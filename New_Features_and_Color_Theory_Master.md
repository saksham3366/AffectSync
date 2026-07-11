# AffectSync - New Features & Advanced Color Theory (Master Specification)

This document merges the existing Recommendation, Color Theory and Saved
Outfits specifications and extends them into a single implementation
roadmap.

## Existing Specifications

-   Preserve the recommendation pipeline and color-theory improvements.
-   Preserve the Saved Outfits / Lookbook architecture.
-   Improve implementation where appropriate without breaking existing
    behaviour.

------------------------------------------------------------------------

# 1. Recommendation Pipeline

Emotion Detection → Emotion Palette Mapping → Weather Analysis →
Retrieve Top-N candidates from Qdrant → Metadata Filtering → Color
Harmony Engine → Style Compatibility → Silhouette Balance → Footwear
Selection → Accessory Selection → Optional Layer Decision → History
Penalty → Diversity Bonus → Final Weighted Score → Return Top 3--5
Ranked Outfits

Never choose the nearest vector directly. Every recommendation must pass
every stage.

------------------------------------------------------------------------

# 2. Weather-Aware Recommendations

Create a new page:

/weather

Use the existing React + Tailwind design language already used across
AffectSync. Do not introduce a new theme.

Display: - Current weather - Temperature - Feels like - Humidity -
Wind - Weather icon - Suggested clothing palette - AI styling tip

Suggested backend: OpenWeather or WeatherAPI (configurable via
environment variables).

Weather should influence: - colour palette - layer selection -
footwear - fabric weight - accessories

Examples: - Hot → lighter colours, breathable clothing. - Rain →
waterproof footwear, darker practical colours. - Cold → layers, darker
palettes, jackets. - Pleasant → normal recommendation logic.

## VERY IMPORTANT

Read WEATHER_API_KEY from .env.

Never hardcode the API key.

Create a weather service.

Cache weather for 30 minutes.

Do not call the API repeatedly.

Automatically detect the user's city using browser geolocation.

If geolocation permission is denied,

allow manual city search.

Store the last city in local storage.

Use weather information inside the recommendation engine.

Do not block outfit generation if the weather API fails.

Fallback to normal recommendation logic.

Use loading skeletons while weather loads.

## HOW A PAGE SHOULD LOOKLKE

------------------------------------------------------------------------

# 3. Expanded Colour Theory

Prioritize colour harmony before vector similarity.

Core neutral rules: - Black: universal. - White: universal. - Grey:
universal. - Beige/Cream: warm neutrals. - Navy: pairs with beige,
white, grey, olive. - Brown: earthy colours, denim, cream. - Olive:
beige, cream, brown, black. - Silver: black, white, grey, navy, blue. -
Gold: cream, beige, brown, maroon, forest green.

Avoid combinations unless style score is exceptionally high: - Brown +
Bright Silver - Neon + Earth tones - Warm brown + Cool metallic silver -
Olive + Neon pink

Complementary examples: - Navy + Beige - Black + White - White + Denim -
Olive + Cream - Brown + Beige - Burgundy + Grey - Charcoal + Blue -
Forest Green + Tan

Pastels: - Lavender + White - Sky Blue + Grey - Mint + Beige - Peach +
Cream

Weather should modify colour preference naturally.

## important Problems to Fix ignore if already solved

1.  The same accessory is repeatedly selected even when multiple
    suitable accessories exist.
2.  Footwear selection ignores proper colour harmony.
3.  Vector similarity is weighted too heavily, causing visually poor
    outfits.
4.  Recommendations lack diversity.

## Accessory Improvements

-   Retrieve multiple accessory candidates from Qdrant.
-   Rerank using:
    -   Colour compatibility
    -   Outfit style
    -   Occasion
    -   Emotion
    -   Recently used accessories
-   Apply a strong history penalty.
-   Rotate accessories whenever suitable alternatives exist.

## Footwear Colour Theory

Black: - Universal neutral. - Excellent with almost every outfit.

White: - Universal neutral. - Excellent with casual outfits.

Grey: - Neutral and versatile.

Beige: - Beige, cream, olive, brown, navy, soft pink, white, black.

Brown: - Beige - Cream - Olive - Forest green - Navy - Denim blue -
White

Avoid bright silver with warm earthy outfits.

Silver: - Black - White - Grey - Navy - Blue - Cool-toned outfits

Avoid pairing silver with warm browns unless intentionally styled.

Gold: - Beige - Brown - Cream - Olive - Maroon - Dark green

## Footwear Scoring

Weight: - 40% Colour harmony - 20% Occasion - 15% Style compatibility -
10% Season - 10% Mood - 5% Diversity

Do not choose shoes using vector similarity alone.

## Layers

Layers are optional. Include only when they improve outfit quality.


------------------------------------------------------------------------

# 4. Saved Outfits / Lookbook

Retain the existing specification.

Add: - Outfit Collections - Outfit Calendar - Wear Counter - AI Notes -
Duplicate Detection - Export Lookbook (future-ready architecture) -
Download preview image - Share-ready data model (future)

Saved outfits should improve future recommendations while maintaining
diversity.

------------------------------------------------------------------------

# 5. Progress Tracking

Create:

PROJECT_PROGRESS.md

Update automatically after every completed feature.

Include: - Completed tasks - Current task - Remaining tasks - Known
bugs - Deployment blockers - Files modified - Next recommended action

If context is lost or the model changes, resume work using
PROJECT_PROGRESS.md instead of restarting analysis.

------------------------------------------------------------------------

# 6. Architecture Freedom

The model may: - reorganize services - normalize schemas - improve
APIs - optimize Qdrant retrieval - improve MongoDB indexing - introduce
caching - improve React structure

Do not change user-visible behaviour without improving it.

------------------------------------------------------------------------

# 7. Acceptance Criteria

✓ Recommendations use weather. ✓ Recommendations use advanced colour
theory. ✓ Footwear follows colour harmony. ✓ Accessories rotate
naturally. ✓ Saved Outfits works. ✓ Lookbook works. ✓ Collections work.
✓ PROJECT_PROGRESS.md is maintained. ✓ Existing theme preserved. ✓
Production-ready implementation.
