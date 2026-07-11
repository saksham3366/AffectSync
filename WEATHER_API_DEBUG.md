# WEATHER_API_DEBUG.md

# AffectSync -- Complete Weather API Integration Audit & Repair

> **Objective**
>
> The Weather Stylist page currently always shows **22°C**, changing the
> city has no effect, and the WeatherAPI dashboard reports **0 API
> calls**.
>
> This document is a production-level debugging guide. Follow every step
> in order. Do **not** skip steps or assume any part already works.

------------------------------------------------------------------------

# Expected Architecture

    React Weather Page
            │
            ▼
    GET /api/weather?city=<city>
            │
            ▼
    Express Backend
            │
            ▼
    Weather Service
            │
            ▼
    WeatherAPI.com
            │
            ▼
    JSON Response
            │
            ▼
    Weather Classifier
            │
            ▼
    Weather Stylist Engine
            │
            ▼
    React UI

The frontend must **never** hardcode weather values.

------------------------------------------------------------------------

# Phase 1 -- Search for Mock Data

Search the entire repository for:

-   22
-   temp: 22
-   temperature: 22
-   weatherMock
-   mockWeather
-   fakeWeather
-   dummyWeather
-   sampleWeather

If found:

-   Remove the mock.
-   Replace it with live API data.

------------------------------------------------------------------------

# Phase 2 -- Verify Frontend

Inspect the Weather page.

Confirm that:

-   Changing the city updates component state.
-   Clicking refresh/search triggers a new request.
-   The request URL contains the selected city.
-   No cached dummy object is reused.

Example request:

    GET /api/weather?city=Delhi

------------------------------------------------------------------------

# Phase 3 -- Verify Backend Route

Confirm the route actually executes.

Example:

    GET /api/weather

Add temporary logs:

-   Incoming city
-   Timestamp
-   Route entered
-   API called
-   Response received

Remove verbose logs after debugging.

------------------------------------------------------------------------

# Phase 4 -- Verify Environment Variables

Check:

    WEATHER_API_KEY

Confirm:

-   exists
-   non-empty
-   loaded with dotenv
-   readable through process.env

Restart server after changing `.env`.

------------------------------------------------------------------------

# Phase 5 -- Verify API Request

Construct request dynamically.

Correct pattern:

    https://api.weatherapi.com/v1/current.json
        ?key=<API_KEY>
        &q=<CITY>

Never hardcode city.

Log:

-   city
-   endpoint (without exposing key)
-   HTTP status

------------------------------------------------------------------------

# Phase 6 -- Inspect Response

Verify the backend receives live JSON.

Required fields:

-   location.name
-   current.temp_c
-   current.feelslike_c
-   current.humidity
-   current.wind_kph
-   current.uv
-   current.condition.text

Reject incomplete responses.

------------------------------------------------------------------------

# Phase 7 -- Remove Silent Fallbacks

Search for patterns such as:

    catch (...) {
        return {
            temp:22
        }
    }

or

    temp || 22

Replace with:

-   clear error logging
-   graceful UI message
-   optional fallback to mood-only recommendation

Never silently fake weather.

------------------------------------------------------------------------

# Phase 8 -- Verify Network

Browser DevTools

Network Tab

Confirm:

-   Request sent
-   Status 200
-   Correct city
-   JSON returned

If request never appears:

The frontend is not calling the backend.

------------------------------------------------------------------------

# Phase 9 -- Analytics Verification

WeatherAPI Dashboard should increase request count.

If dashboard remains zero:

-   request never left backend
-   wrong endpoint
-   request blocked
-   mock still active

------------------------------------------------------------------------

# Phase 10 -- Weather Classification

Use normalized categories.

Python pseudocode:

``` python
def classify_weather(temp, rain_mm, condition):
    condition = condition.lower()

    if rain_mm > 0 or "rain" in condition or "storm" in condition:
        return "RAINY"

    if temp >= 32:
        return "HOT"

    if temp <= 16:
        return "COLD"

    return "PLEASANT"
```

Never classify directly from UI text.

------------------------------------------------------------------------

# Phase 11 -- Weather Fail-Safe

If WeatherAPI fails:

    Weather API

    ↓

    Failure

    ↓

    Log Error

    ↓

    Disable Weather Influence

    ↓

    Continue Mood Logic

    ↓

    Generate Outfit

The user should still receive recommendations.

------------------------------------------------------------------------

# Phase 12 -- Browser Validation

Test multiple cities:

-   Delhi
-   Mumbai
-   London
-   Tokyo
-   New York

Verify:

-   temperature changes
-   humidity changes
-   weather icon changes
-   AI stylist advice changes
-   background animation changes

------------------------------------------------------------------------

# Phase 13 -- Production Checklist

All must pass:

-   WeatherAPI dashboard increments
-   City changes work
-   No hardcoded temperature
-   No mock weather
-   API key loaded
-   Backend route executed
-   Network request visible
-   Live JSON parsed
-   Weather classification correct
-   Mood fallback works
-   Console free of weather errors

Only then mark the Weather Stylist as production-ready.

implement a Developer Diagnostics page that's only available in development mode.

For example, a route like:

/dev/diagnostics

It could display live status for:

 MongoDB
 Qdrant
 Cloudinary
 WeatherAPI
 Gemini API (if used)
 Current city
 Weather classification (HOT, RAINY, etc.)
 API response time
 Active environment (Development/Production)