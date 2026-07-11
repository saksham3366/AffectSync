# AffectSync - Outfit Recommendation & Color Theory Improvement Specification

## Objective

Improve outfit generation so recommendations resemble a professional
stylist instead of relying mainly on vector similarity.

## Problems to Fix

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

## Recommendation Pipeline

Emotion → Tops → Bottoms → Shoes → Accessories → Layers → Metadata
filtering → Colour harmony → Occasion → Style → History penalty →
Diversity bonus → Final score → Outfit

## Diversity

Penalize: - repeated outfits - repeated shoes - repeated accessories -
repeated layers

Reward unseen combinations.

## Acceptance Criteria

-   Accessories rotate naturally.
-   Shoes match outfit colours.
-   Brown shoes primarily match earthy palettes.
-   Silver shoes primarily match cool palettes.
-   Recommendations look intentionally styled.
-   Multiple outfit generations produce visually diverse combinations.
