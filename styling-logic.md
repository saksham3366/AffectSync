# AffectSync Styling Logic Knowledge Base

This document defines the rule-set AffectSync's recommendation engine uses to pair colors, fits, and silhouettes for **men** and **women**, with a leaning toward modern **Gen Z aesthetics** (oversized/baggy fits, pastel and muted-tone palettes, texture mixing, and mood-driven styling). The structure at the bottom maps directly to **MongoDB collections** and **Qdrant vector payloads** so it can be ingested straight into the recommendation pipeline.

---

## 1. Color Theory Foundations

### 1.1 Core relationships used by the engine

| Relationship | Definition | Use case |
|---|---|---|
| Monochrome | Same hue, varying tints/shades | Minimal, calm, "quiet luxury" looks |
| Analogous | Hues next to each other on the wheel | Soft, cohesive Gen Z pastel fits |
| Complementary | Opposite hues | Statement / confident / party looks |
| Triadic | Three evenly spaced hues | Bold streetwear, excited mood |
| Neutral + pop | One neutral base + one accent color | Everyday wear, easiest to execute |

### 1.2 Base neutral palette (anchors every outfit)

| Name | Hex | Notes |
|---|---|---|
| Cream | `#F5F0E8` | Soft base, pairs with everything |
| Sand | `#D4C5A9` | Warm neutral |
| Stone Grey | `#B4B2A9` | Cool-toned neutral |
| Espresso | `#3D2B1F` | Deep grounding tone |
| Off-White | `#EDE8DF` | Brighter than cream, crisp |
| Charcoal | `#2C2C2A` | Modern alternative to black |

### 1.3 Gen Z pastel palette (the "soft drop" set)

| Name | Hex | Pairs best with |
|---|---|---|
| Baby Blue | `#AFCBE3` | Butter yellow, white, lilac |
| Butter Yellow | `#F5E6A8` | Baby blue, sage, lavender |
| Sage Green | `#B7C4A8` | Cream, mocha, butter yellow |
| Lilac | `#D9C9E8` | Baby blue, sage, charcoal |
| Blush Pink | `#F2D4D4` | Sage green, espresso, grey |
| Powder Lavender | `#DCD6F0` | Sand, lilac, off-white |
| Mint | `#C9E4D8` | Blush pink, charcoal, cream |
| Peach | `#F7D9C4` | Baby blue, mocha, mint |

### 1.4 "New combo" pairings (2025–2026 trend-driven)

These are non-obvious pairings that read as intentional and current:

- **Sage green + chocolate brown** — earthy, calm, elevated streetwear
- **Baby blue + burnt orange** — high contrast, confident/excited
- **Lavender + olive** — unexpected but balanced, minimal-edge
- **Butter yellow + grey** — soft but grounded, great for layering
- **Blush pink + navy** — feminine-meets-classic, romantic mood
- **Mint + maroon** — cool/warm tension, bold but wearable
- **Cream + powder blue + tan** (3-tone) — tonal Gen Z "soft fit"

---

## 2. Gen Z Styling Principles (applies to all genders)

1. **Proportion play** — pair one oversized/baggy piece with one fitted piece. Never baggy-on-baggy unless it's an intentional "blob" silhouette for streetwear/loungewear moods.
2. **Layering with length contrast** — a longer base layer (oversized tee/shirt) under a cropped layer (cropped jacket, vest, cardigan).
3. **Texture mixing over color mixing** — when colors are tonal/neutral, contrast comes from texture: ribbed knit + denim, satin + corduroy, mesh + cotton.
4. **One "anchor" color, rest neutral** — pick a single accent (pastel or saturated) and keep everything else neutral/tonal so the look doesn't feel costume-y.
5. **Footwear grounds the fit** — chunky sneakers or loafers for baggy/streetwear; minimal sneakers or ballet flats for soft/pastel looks.
6. **Accessories carry the mood** — beanies, tote bags, chains, mini sunglasses, and socks-as-statement are low-cost mood signals.
7. **Sock and hem visibility is intentional** — cropped pants + visible socks/ankle is a deliberate Gen Z signal, not a fit mistake.

---

## 3. Men's Styling Logic

### 3.1 Silhouette rules

| Body type | Recommended balance |
|---|---|
| Athletic | Baggy bottoms + fitted/semi-fitted top to show shoulders |
| Slim | Oversized top + tapered/straight bottoms (avoid full baggy-on-baggy) |
| Broad | Structured layers, vertical lines (open shirts, longline jackets) |
| Average | Most flexible — can do full oversized "blob" or balanced fits |

### 3.2 Color combo rules by base item

**Base: Beige / Sand**
- + Chocolate brown (tonal, elevated)
- + Sage green (earthy Gen Z)
- + Baby blue (soft contrast)
- + Black (classic high-contrast)

**Base: Black**
- + Sage green or olive (toned-down contrast)
- + Butter yellow (statement pop)
- + Grey (monochrome streetwear)
- + White (crisp classic)

**Base: White / Off-white**
- + Lilac or lavender (soft Gen Z)
- + Navy (clean classic)
- + Sage green (fresh, minimal)
- + Burnt orange (warm pop)

**Base: Denim (blue)**
- + Cream / off-white (timeless)
- + Sage green (modern earthy)
- + Burnt orange or rust (autumn pop)
- + Grey (cool monochrome)

### 3.3 Gen Z fit formulas (men)

| Formula | Pieces | Mood tag |
|---|---|---|
| Cargo Core | Oversized tee + cargo pants (sage/olive/black) + chunky sneakers + bucket hat | Calm, Casual |
| Soft Layer | Lavender or baby blue oversized shirt (open) + white tee + beige baggy trousers | Calm, Romantic |
| Court Drip | Basketball shorts + long tube socks + oversized graphic tee + retro sneakers | Excited, Confident |
| Quiet Luxe | Monochrome brown/tan knitwear + tailored wide trousers + loafers | Confident, Focused |
| Skater Soft | Baggy jeans (light wash) + cropped hoodie (butter yellow) + skate shoes | Happy, Excited |
| Dark Academia Lite | Charcoal turtleneck + wide trousers + trench coat + chain detail | Focused, Sad (cozy) |

---

## 4. Women's Styling Logic

### 4.1 Silhouette rules

| Body type | Recommended balance |
|---|---|
| Hourglass | Fitted top + baggy bottom (or vice versa), define waist with belt |
| Pear | Volume on top (oversized shirt/blazer) + straighter bottoms |
| Apple | Longline open layers + relaxed straight pants |
| Rectangle | Layering and cropped pieces to create shape contrast |
| Petite | Cropped tops/jackets with high-rise baggy bottoms to elongate legs |

### 4.2 Color combo rules by base item

**Base: Blush Pink**
- + Sage green (calm, balanced)
- + Navy (romantic contrast)
- + Cream (tonal soft)
- + Grey (modern muted)

**Base: Baby Blue**
- + Butter yellow (cheerful pastel combo)
- + Burnt orange (high-energy contrast)
- + White (clean fresh)
- + Lilac (analogous soft)

**Base: Lavender / Lilac**
- + Olive (unexpected, elevated)
- + Sand/beige (neutral grounding)
- + Charcoal (edgy soft contrast)
- + Mint (cool pastel duo)

**Base: Black**
- + Mint or sage (soft contrast)
- + Butter yellow (statement)
- + Blush pink (feminine edge)
- + Silver/grey accessories (confident)

### 4.3 Gen Z fit formulas (women)

| Formula | Pieces | Mood tag |
|---|---|---|
| Coquette Soft | Blush pink baby tee + baggy light-wash jeans + ballet flats + mini bag | Romantic, Calm |
| Mob Wife | Oversized faux-fur or knit coat + slip dress + boots + sunglasses | Confident, Excited |
| Clean Girl Pastel | Lavender set (matching baggy trousers + cropped top) + white sneakers | Calm, Focused |
| Y2K Revival | Low-rise baggy cargo + cropped tank (mint/baby blue) + chunky belt | Excited, Happy |
| Cottage Soft | Sage green midi skirt + cream oversized cardigan + mary janes | Calm, Romantic |
| Sporty Pastel | Baby blue track pants + oversized hoodie (butter yellow) + sneakers | Happy, Energetic |

---

## 5. Mood → Style Mapping (AffectSync core logic)

This is the bridge between the **emotion-detection model output** and the **outfit recommendation query**.

| Detected Mood | Color direction | Silhouette direction | Fabric/texture |
|---|---|---|---|
| Happy | Butter yellow, mint, peach, bright pastels | Relaxed, playful proportions | Cotton, jersey |
| Calm | Sage, lavender, cream, sand | Soft oversized, flowing | Linen, knit |
| Confident | Black, chocolate, burnt orange, monochrome | Structured + one oversized piece | Wool, leather accents |
| Romantic | Blush pink, lilac, cream, navy accents | Fitted-soft mix, delicate layers | Satin, soft knit |
| Sad | Muted blues, grey, deep neutrals, soft browns | Cozy oversized, layered | Fleece, heavy knit |
| Excited | Burnt orange, baby blue + yellow combos, bold pastels | Bold proportion contrast | Mixed textures, sporty |
| Stressed | Sage, mint, powder lavender, neutral tones | Loose, unstructured, comfort-first | Soft cotton, jersey |
| Focused | Charcoal, navy, olive, tonal neutrals | Streamlined with one relaxed piece | Wool, structured cotton |

---

## 6. MongoDB Schema (Node.js + Mongoose friendly)

### 6.1 `colorCombos` collection

```json
{
  "_id": "ObjectId",
  "baseColor": { "name": "Sage Green", "hex": "#B7C4A8" },
  "pairColor": { "name": "Chocolate Brown", "hex": "#3D2B1F" },
  "relationship": "neutral+pop",
  "genders": ["men", "women", "unisex"],
  "moodTags": ["calm", "focused"],
  "styleTags": ["earthy", "elevated-streetwear", "gen-z"],
  "description": "Sage green paired with chocolate brown for an earthy, calm, elevated streetwear look.",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### 6.2 `outfitFormulas` collection

```json
{
  "_id": "ObjectId",
  "name": "Cargo Core",
  "gender": "men",
  "pieces": [
    { "type": "top", "item": "Oversized tee", "color": "#EDE8DF" },
    { "type": "bottom", "item": "Cargo pants", "color": "#B7C4A8" },
    { "type": "footwear", "item": "Chunky sneakers", "color": "#FFFFFF" },
    { "type": "accessory", "item": "Bucket hat", "color": "#3D2B1F" }
  ],
  "moodTags": ["calm", "casual"],
  "silhouette": "baggy-bottom-relaxed-top",
  "fabricNotes": ["cotton", "ripstop"],
  "createdAt": "ISODate"
}
```

### 6.3 `wardrobeItems` collection (per-user, links to detected mood history)

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "top",
  "subtype": "hoodie",
  "name": "Butter Yellow Cropped Hoodie",
  "colors": [{ "name": "Butter Yellow", "hex": "#F5E6A8" }],
  "fit": "cropped",
  "moodTags": ["happy", "excited"],
  "styleTags": ["gen-z", "skater-soft"],
  "imageUrl": "cloudinary://...",
  "embeddingId": "qdrant-point-uuid",
  "createdAt": "ISODate"
}
```

### 6.4 `moodOutfitLogs` collection (links AI emotion detection → outfit served)

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "detectedMood": "calm",
  "confidence": 0.87,
  "recommendedFormula": "Soft Layer",
  "wornItemIds": ["ObjectId", "ObjectId", "ObjectId"],
  "timestamp": "ISODate"
}
```

---

## 7. Qdrant Vector Schema

Qdrant stores the **embedding** of a natural-language description (generated from this rule set) so the recommendation engine can do similarity search against a user's mood + wardrobe context.

### 7.1 Collection: `style_combos`

```json
{
  "collection_name": "style_combos",
  "vector_size": 384,
  "distance": "Cosine"
}
```

### 7.2 Point payload structure

```json
{
  "id": "uuid-v4",
  "vector": [0.0123, -0.045, "... 384 dims ..."],
  "payload": {
    "type": "color_combo",
    "gender": ["men", "women", "unisex"],
    "baseColorHex": "#AFCBE3",
    "pairColorHex": "#F5E6A8",
    "moodTags": ["happy", "excited"],
    "styleTags": ["gen-z", "pastel", "y2k"],
    "text": "Baby blue paired with butter yellow makes a cheerful, energetic pastel combo great for happy or excited moods, Gen Z casual styling.",
    "mongoRefId": "ObjectId-string"
  }
}
```

### 7.3 Embedding text generation rule

For every color combo, fit formula, or wardrobe item, generate the embedding source text using this template:

```
"{baseColor} paired with {pairColor} creates a {relationship} look,
ideal for {moodTags} moods. Best suited for {gender} in
{styleTags} styling. {extraDescription}"
```

This text is embedded (e.g. via a sentence-transformer model) and stored as the `vector`, with the structured fields kept in `payload` for filtering (gender, mood, style tags) before/after the similarity search.

### 7.4 Query flow (AffectSync runtime)

1. Flask AI server detects mood (e.g. `"happy"`, confidence `0.92`).
2. Node/Express backend builds a query string: `"happy mood, gen-z pastel styling, {user.gender}, {user.stylePersonality}"`.
3. Query is embedded and sent to Qdrant with a payload filter: `moodTags CONTAINS "happy"` and `gender CONTAINS user.gender`.
4. Top-k matches return `mongoRefId`s.
5. Node fetches full documents from `outfitFormulas` / `colorCombos` in MongoDB using those IDs.
6. Response merged with user's actual `wardrobeItems` (matching by `colors.hex` and `styleTags`) to produce the final outfit recommendation.

---

## 8. Quick Reference: Pastel Combo Cheat Sheet

| Combo | Hex pair | Mood | Gender fit |
|---|---|---|---|
| Baby blue + Butter yellow | `#AFCBE3` / `#F5E6A8` | Happy | Both |
| Sage + Lavender | `#B7C4A8` / `#D9C9E8` | Calm | Both |
| Blush + Sage | `#F2D4D4` / `#B7C4A8` | Romantic | Women-leaning |
| Mint + Maroon | `#C9E4D8` / `#6B2C2C` | Excited | Both |
| Lilac + Olive | `#D9C9E8` / `#5A6040` | Focused | Both |
| Peach + Baby blue | `#F7D9C4` / `#AFCBE3` | Happy | Both |
| Cream + Powder lavender + Tan | `#F5F0E8` / `#DCD6F0` / `#D4C5A9` | Calm | Both |

---

*This document is intended to be parsed programmatically: each table row can be converted into a MongoDB document and a corresponding Qdrant point using the templates in Section 6 and 7.*
