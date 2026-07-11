import os
# Force Keras to use PyTorch backend
os.environ["KERAS_BACKEND"] = "torch"

import tensorflow as tf
import keras
from keras import layers, models
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
import torch

print("==================================================")
print("Environment Diagnostics:")
print("PyTorch Version:", torch.__version__)
print("CUDA Available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Device Name:", torch.cuda.get_device_name(0))
print("Keras Version:", keras.__version__)
print("Keras Backend:", keras.config.backend())
print("==================================================")

# Paths
train_dir = 'preprocessed_images/train'
val_dir = 'preprocessed_images/validation'
model_save_path = 'emotion_model.keras'

# Alphabetical order matching folder names:
class_names = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
IMG_SIZE = (48, 48)
BATCH_SIZE = 64

# Load datasets
train_ds = tf.keras.utils.image_dataset_from_directory(
    train_dir,
    labels='inferred',
    label_mode='categorical',
    color_mode='grayscale',
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_names=[c.lower() for c in class_names],
    shuffle=True
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    val_dir,
    labels='inferred',
    label_mode='categorical',
    color_mode='grayscale',
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_names=[c.lower() for c in class_names],
    shuffle=False
)

# Preprocessing & Data Augmentation Pipeline
data_augmentation = keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.15),
    layers.RandomTranslation(0.1, 0.1),
])

def preprocess_train(image, label):
    # Grayscale (1-ch) -> RGB (3-ch) for ImageNet models
    image = tf.image.grayscale_to_rgb(image)
    # Resize to 128x128 for efficient GPU training
    image = tf.image.resize(image, (128, 128), method='bicubic')
    return image, label

def preprocess_val(image, label):
    image = tf.image.grayscale_to_rgb(image)
    image = tf.image.resize(image, (128, 128), method='bicubic')
    return image, label

# Apply mapping
train_data = train_ds.map(preprocess_train, num_parallel_calls=tf.data.AUTOTUNE)
val_data = val_ds.map(preprocess_val, num_parallel_calls=tf.data.AUTOTUNE)

# Prefetch for performance
train_data = train_data.prefetch(tf.data.AUTOTUNE)
val_data = val_data.prefetch(tf.data.AUTOTUNE)

# Calculate class weights programmatically based on pre-deduplication or actual image counts
# Folder class image count mapping (alphabetical):
# Angry: 3993, Disgust: 436, Fear: 4103, Happy: 7164, Neutral: 4982, Sad: 4938, Surprise: 3205
counts = [3993, 436, 4103, 7164, 4982, 4938, 3205]
total = sum(counts)
class_weights = {i: total / (len(counts) * counts[i]) for i in range(len(counts))}
print("Class Weights:", class_weights)

# Build Model using EfficientNetB0
def create_model():
    base_model = keras.applications.EfficientNetB0(
        input_shape=(128, 128, 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze backbone

    inputs = layers.Input(shape=(128, 128, 3))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(7, activation='softmax')(x)

    model = models.Model(inputs, outputs)
    return model, base_model

model, base_model = create_model()
model.summary()

# ----------------------------------------------------
# Stage 1: Warmup Classification Head
# ----------------------------------------------------
print("\n--- Phase 1: Training Classification Head ---")
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_head = model.fit(
    train_data,
    validation_data=val_data,
    epochs=5,
    class_weight=class_weights
)

# ----------------------------------------------------
# Stage 2: Fine-Tuning (Unfreeze top layers of Backbone)
# ----------------------------------------------------
print("\n--- Phase 2: Fine-Tuning Backbone ---")
base_model.trainable = True

# We compile with a much smaller learning rate for fine-tuning
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=5e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    keras.callbacks.ModelCheckpoint(
        filepath=model_save_path,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    ),
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=8,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        verbose=1
    )
]

history_fine = model.fit(
    train_data,
    validation_data=val_data,
    epochs=35,
    callbacks=callbacks,
    class_weight=class_weights
)

# ----------------------------------------------------
# Evaluation
# ----------------------------------------------------
print("\n--- Phase 3: Final Model Evaluation ---")
# Load best model weights
if os.path.exists(model_save_path):
    print(f"Loading best weights from {model_save_path}")
    model = models.load_model(model_save_path)

y_true = []
y_pred = []

print("Predicting on validation set...")
for images, labels in val_data:
    preds = model.predict(images, verbose=0)
    y_true.extend(np.argmax(labels.numpy(), axis=1))
    y_pred.extend(np.argmax(preds, axis=1))

# Metrics
print("\n📋 Classification Report:\n")
print(classification_report(y_true, y_pred, target_names=class_names, digits=4))

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
df_cm = pd.DataFrame(cm, index=class_names, columns=class_names)
print("\nConfusion Matrix:")
print(df_cm)

# Save confusion matrix plot to a file
plt.figure(figsize=(8, 6))
sns.heatmap(df_cm, annot=True, fmt='d', cmap='Blues')
plt.title('Emotion Recognition Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('confusion_matrix.png')
print("Saved confusion matrix plot to confusion_matrix.png")
