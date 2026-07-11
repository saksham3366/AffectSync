# AffectSync - AI Weather Stylist (Master Architecture)

> Goal: Build a premium AI Weather Stylist experience integrated into
> the existing AffectSync theme. Preserve current UI colors, typography,
> spacing and navigation.

------------------------------------------------------------------------

# 1. Feature Overview

AI Weather Stylist combines: - Weather API - Mood Detection - Color
Theory - Occasion - Wardrobe - Qdrant Retrieval - Recommendation Engine

Weather influences recommendations but NEVER replaces Mood.

If weather fails, automatically fall back to Mood-only recommendations.

------------------------------------------------------------------------

# 2. System Architecture

Browser ↓ Location (GPS or Manual City) ↓ Weather API ↓ Weather
Classifier ↓ Mood Detection ↓ Weather + Mood Fusion ↓ Color Theory
Engine ↓ Qdrant Candidate Retrieval ↓ Metadata Filtering ↓ Style
Compatibility ↓ Silhouette Balance ↓ Footwear ↓ Accessories ↓ Optional
Layer ↓ History Penalty ↓ Diversity Bonus ↓ Weighted Score ↓ Top 3--5
Outfits

------------------------------------------------------------------------

# 3. Weather Page

Route: /weather

Reuse the existing AffectSync theme.

Sections:

1.  Hero
2.  Live animated background
3.  Current weather card
4.  AI Stylist card
5.  Today's recommended palette
6.  Today's generated outfit
7.  Outfit actions (Save, Regenerate, Favourite)
8.  Forecast cards
9.  Weather insights
10. Wardrobe suitability summary

------------------------------------------------------------------------

# 4. Background Animation Mapping

SUNNY - Soft sun - Moving sun rays - Floating light particles

RAIN - Rain drops - Dark clouds - Glass reflections

COLD - Snow particles - Frost glow

PLEASANT - Blossom tree - Floating leaves - Soft sunlight

Change animation automatically from classified weather.

------------------------------------------------------------------------

# 5. Weather Classification (Pseudo Python)

``` python
def classify_weather(temp, rain_mm, condition):
    c = condition.lower()

    if rain_mm > 0 or "rain" in c or "storm" in c:
        return "RAINY"

    if temp >= 32:
        return "HOT"

    if temp <= 16:
        return "COLD"

    return "PLEASANT"
```

------------------------------------------------------------------------

# 6. Fail Safe

``` python
try:
    weather = weather_api.fetch(city)
    weather_type = classify_weather(...)
except Exception:
    weather_type = None

if weather_type is None:
    recommendation_mode = "MOOD_ONLY"
else:
    recommendation_mode = "WEATHER_AND_MOOD"
```

Never block outfit generation.

------------------------------------------------------------------------

# 7. AI Stylist Prompt

Input: - Weather - Mood - Temperature - Humidity - UV - Occasion -
Wardrobe

Output: - Short styling advice - Fabrics - Colors - Footwear -
Accessories - Layer advice

------------------------------------------------------------------------

# 8. Recommendation Weights

Color Harmony 30% Weather Suitability 20% Mood 15% Occasion 10% Style
10% Silhouette 5% Footwear 5% Accessories 5%

------------------------------------------------------------------------

# 9. Expanded Color Theory

Universal: Black, White, Grey

Warm: Beige, Cream, Brown, Olive, Mustard, Terracotta

Cool: Navy, Sky Blue, Denim, Charcoal, Silver

Complementary examples: - Navy + Beige - White + Denim - Olive + Cream -
Brown + Beige - Forest Green + Tan - Burgundy + Grey - Charcoal + Blue -
Black + Silver - White + Sage - Lavender + White - Peach + Cream - Sky
Blue + Grey - Mint + Beige

Avoid: - Bright Silver + Warm Brown - Neon + Earth tones - Olive + Neon
Pink - Heavy Black outfits in extreme heat

Weather modifiers: HOT → prefer breathable light colours. RAIN → darker
practical colours. COLD → layers + rich dark colours. PLEASANT →
balanced palette.

------------------------------------------------------------------------

# 10. Saved Outfit Integration

Weather and mood used when saving: - Weather snapshot - Mood - AI note -
Palette - Outfit score

Saved outfits improve future recommendations.

------------------------------------------------------------------------

# 11. Progress Tracking

Maintain PROJECT_PROGRESS.md with: - completed - in progress - pending -
blockers - modified files - next task

Resume from this file if model context is lost.

------------------------------------------------------------------------

# 12. Lottie Integration (React)

Install:

``` bash
npm install lottie-react
```

Folder:

src/assets/lottie/

Add: - sunny.json - rain.json - cold.json - pleasant.json

Component:

``` jsx
import Lottie from "lottie-react";
import sunny from "@/assets/lottie/sunny.json";

<Lottie animationData={sunny} loop />
```

Dynamic selection:

``` jsx
const animations = {
  HOT: sunny,
  RAINY: rain,
  COLD: cold,
  PLEASANT: blossom
};

<Lottie animationData={animations[weatherType]} loop />
```

Useful sources: - https://lottiefiles.com/ -
https://iconscout.com/lotties

Search terms: - sun rays - rain - snowfall - sakura - floating leaves

Keep animations subtle with low opacity behind glassmorphism cards.

------------------------------------------------------------------------

# Acceptance

✓ Weather page matches existing theme. ✓ Animation changes
automatically. ✓ Weather API failure falls back to Mood. ✓ Outfit
recommendations use weather + mood. ✓ Color theory respected. ✓ Saved
outfits store weather context. ✓ PROJECT_PROGRESS.md maintained. ✓
Production ready.
