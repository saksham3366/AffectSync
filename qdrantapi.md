Read the .env.

Connect to Qdrant.

If the collection does not exist,

create it automatically.

If vectors are missing,

re-index all wardrobe items automatically.


Treat Qdrant as the primary database.

On startup:

1. Check if Qdrant is reachable.

2. If unreachable:

Retry every 5 seconds.

3. If collection missing:

Create collection automatically.

4. Verify vector dimensions.

5. Verify payload schema.

6. Verify insert.

7. Verify search.

8. Verify delete.

9. If any upload reaches MongoDB but not Qdrant:

Mark

vector_pending=true

Retry in background until synchronized.

10. Never lose uploaded clothing.

11. Never block the UI because of Qdrant.

12. Maintain an operation queue.

13. Replay queued operations once Qdrant is healthy.

14. Expose

GET /health/vector

returning

- status
- latency
- collection
- vector count
- failed operations

15. Log all failures with detailed diagnostics.


Support both vector search AND metadata filtering.

Payload schema MUST contain:

userId
type
category
color
ocasion
szn
material
image
thumbnail
occasion_tags
color_tags
category_tags
season_tags

Color palette:

Light
Dark
Neutral
Vibrant
Pastel

Occasion tags:

Formal, casual, party, wedding, office, streetwear, festive, workout, date, travel

Do NOT simply return the nearest vectors.

Implement

1. ANN retrieval

↓

2. Metadata filtering

↓

3. Colour harmony score

↓

4. Occasion score

↓

5. Emotion score

↓

6. Accessory compatibility

↓

7. Footwear compatibility

↓

8. Layer compatibility

↓

9. Diversity reranking

↓

10. History penalty

↓

11. Final weighted score

Return only the highest-scoring outfit.

Every application startup should automatically:

• Connect to Qdrant.

• Create missing collections.

• Repair indexes if required.

• Compare MongoDB and Qdrant.

• Re-index missing clothes automatically.

• Remove orphan vectors.

• Remove orphan Mongo records.

• Validate payload consistency.

The application should never require manual synchronization.


QDRANT_URL=https://4c7cb0de-a2c1-4a66-b16d-e8a3346f7244.eu-west-2-0.aws.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6ZWRiNjlmMjgtZDZmMS00MGJjLWE5YzgtMjNlZGMzMDY2MGU5In0.YTcktXomqtdcUXmDkJM5mEwaGpXedAu2NtT2fSldBPI