/* ═══════════════════════════════════════════════════════════════════
   AffectSync — Frontend Application
   Full API integration, auth flow, real data from MongoDB + Qdrant
   ═══════════════════════════════════════════════════════════════════ */

const API = window.location.origin.includes("localhost:4173") || window.location.origin.includes("localhost:3000") 
  ? "http://localhost:5000/api" 
  : "/api";

const moods = {
  happy:     { color: "223, 157, 65",  accent: "#a86b28", label: "Joyful",     icon: "☺", note: "Vibrant & Energetic" },
  calm:      { color: "179, 135, 91",  accent: "#8b592d", label: "Calm",      icon: "♧", note: "Peaceful & Relaxed" },
  confident: { color: "186, 123, 53",  accent: "#8c4f1f", label: "Determined", icon: "☆", note: "Bold & Powerful" },
  romantic:  { color: "201, 111, 116", accent: "#9b5058", label: "Reserved",  icon: "♡", note: "Soft & Elegant" },
  sad:       { color: "104, 139, 166", accent: "#516f88", label: "Reflective", icon: "☁", note: "Quiet & Reflective" },
  excited:   { color: "225, 124, 44",  accent: "#b4571e", label: "Excited",   icon: "ϟ", note: "Fun & Adventurous" },
  stressed:  { color: "130, 125, 154", accent: "#615b7a", label: "Cautious",  icon: "⌘", note: "Neutral & Soothing" },
};

const state = {
  mood: localStorage.getItem("affectsync-mood") || "happy",
  route: location.hash.slice(1) || "home",
  favorites: new Set(JSON.parse(localStorage.getItem("affectsync-favorites") || "[]")),
  query: "",
  filter: "All Types",
  token: localStorage.getItem("affectsync-token") || null,
  user: JSON.parse(localStorage.getItem("affectsync-user") || "null"),
  wardrobe: [],
  wardrobeStats: null,
  profileStats: null,
  currentOutfits: null,
  excludedOutfitIds: [],
  location: JSON.parse(localStorage.getItem("affectsync-location") || "null"),
  weather: null,
};

const app = document.querySelector("#app");
const scanDialog = document.querySelector("#scanDialog");
const uploadDialog = document.querySelector("#uploadDialog");
const profileEditDialog = document.querySelector("#profileEditDialog");
const toast = document.querySelector("#toast");
let cameraStream;

// ── API Helper ──────────────────────────────────────────────────────
async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) { logout(); throw new Error("Unauthorized"); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────
function isLoggedIn() { return !!state.token && !!state.user; }

function showApp() {
  document.querySelector("#authGate").classList.add("hidden");
  document.querySelector("#siteHeader").style.display = "";
  document.querySelector("#app").style.display = "";
  document.querySelector("#siteFooter").style.display = "";
}

function hideApp() {
  document.querySelector("#authGate").classList.remove("hidden");
  document.querySelector("#siteHeader").style.display = "none";
  document.querySelector("#app").style.display = "none";
  document.querySelector("#siteFooter").style.display = "none";
}

function logout() {
  state.token = null;
  state.user = null;
  state.wardrobe = [];
  localStorage.removeItem("affectsync-token");
  localStorage.removeItem("affectsync-user");
  hideApp();
}

async function login(username, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem("affectsync-token", data.token);
  localStorage.setItem("affectsync-user", JSON.stringify(data.user));
  showApp();
  await loadWardrobe();
  render();
}

async function register(formData) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(formData),
  });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem("affectsync-token", data.token);
  localStorage.setItem("affectsync-user", JSON.stringify(data.user));
  showApp();
  await loadWardrobe();
  render();
}

// ── Wardrobe ────────────────────────────────────────────────────────
async function loadWardrobe() {
  try {
    const data = await apiRequest("/wardrobe");
    state.wardrobe = data.items || [];
  } catch { state.wardrobe = []; }
}

async function loadWardrobeStats() {
  try {
    const data = await apiRequest("/wardrobe/stats");
    state.wardrobeStats = data.stats;
  } catch { state.wardrobeStats = null; }
}

async function deleteItem(id) {
  try {
    await apiRequest(`/wardrobe/${id}`, { method: "DELETE" });
    showToast("Item deleted from wardrobe");
    await loadWardrobe();
    render();
  } catch (err) {
    showToast("Failed to delete: " + err.message);
  }
}

async function uploadItem(formEl) {
  const formData = new FormData();
  const fileInput = document.querySelector("#itemUpload");
  if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

  formData.append("name", document.querySelector("#uploadName").value);
  formData.append("category", document.querySelector("#uploadCategory").value);
  formData.append("subtype", document.querySelector("#uploadSubtype").value);
  formData.append("fit", document.querySelector("#uploadFit").value);

  const occasion = Array.from(document.querySelector("#uploadOccasion").selectedOptions).map(o => o.value);
  formData.append("occasion", JSON.stringify(occasion));

  const colors = Array.from(document.querySelectorAll("#uploadColors .chip.selected")).map(c => c.dataset.value);
  formData.append("color_spectrum", JSON.stringify(colors));

  const labels = document.querySelector("#uploadLabels").value;
  formData.append("labels", labels);

  try {
    const headers = {};
    if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
    const res = await fetch(`${API}/wardrobe/add`, { method: "POST", headers, body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast(`"${data.item.name}" added to wardrobe!`);
    uploadDialog.close();
    fileInput.value = "";
    await loadWardrobe();
    render();
  } catch (err) {
    showToast("Upload failed: " + err.message);
  }
}

// ── Weather ─────────────────────────────────────────────────────────
async function fetchWeather() {
  try {
    let params = '';
    if (state.location?.lat && state.location?.lon) {
      params = `?lat=${state.location.lat}&lon=${state.location.lon}`;
    } else if (state.location?.city) {
      params = `?city=${encodeURIComponent(state.location.city)}`;
    } else {
      return; // No location set
    }
    const data = await apiRequest(`/weather${params}`);
    if (data.weather) {
      state.weather = data.weather;
      render();
    }
  } catch (err) {
    console.warn("[Weather] Fetch failed:", err.message);
  }
}

async function autoDetectAndFetchWeather() {
  if (state.weather) return; // Already have weather
  if (state.location) {
    await fetchWeather();
    return;
  }
  // Try geolocation
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      state.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      localStorage.setItem("affectsync-location", JSON.stringify(state.location));
      await fetchWeather();
    }, () => {
      // Geolocation denied - silently fail
    });
  }
}

// ── Outfits ─────────────────────────────────────────────────────────
async function generateOutfit(fresh = false) {
  try {
    if (fresh) state.excludedOutfitIds = [];
    state.outfitLoading = true;
    render();

    const data = await apiRequest("/recommend-outfits", {
      method: "POST",
      body: JSON.stringify({
        emotion: state.mood,
        exclude_ids: state.excludedOutfitIds,
        city: state.location?.city,
        lat: state.location?.lat,
        lon: state.location?.lon,
      }),
    });

    state.currentOutfits = data.combinations;
    if (data.weather) state.weather = data.weather;
    state.outfitLoading = false;

    // Track shown item IDs for "generate another"
    if (data.combinations) {
      data.combinations.forEach(combo => {
        Object.values(combo).forEach(item => {
          if (!item || typeof item !== 'object') return;
          const id = item._id || item.mongoId;
          if (id && !state.excludedOutfitIds.includes(id)) {
            state.excludedOutfitIds.push(id);
          }
        });
      });
    }

    render();
    showToast(`${data.combinations.length} outfit(s) generated for "${moods[state.mood]?.label}" mood`);
  } catch (err) {
    state.outfitLoading = false;
    render();
    showToast("Failed to generate outfit: " + err.message);
  }
}

// ── Profile ─────────────────────────────────────────────────────────
async function loadProfileStats() {
  try {
    const data = await apiRequest("/profile/stats");
    state.profileStats = data.stats;
  } catch { state.profileStats = null; }
}

async function updateProfile(updates) {
  try {
    const data = await apiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    state.user = data.user;
    localStorage.setItem("affectsync-user", JSON.stringify(data.user));
    showToast("Profile updated!");
    profileEditDialog.close();
    render();
  } catch (err) {
    showToast("Update failed: " + err.message);
  }
}

// ── Mood ─────────────────────────────────────────────────────────────
function setMood(key, announce = true) {
  const mood = moods[key] || moods.calm;
  state.mood = key;
  localStorage.setItem("affectsync-mood", key);
  document.documentElement.style.setProperty("--mood-rgb", mood.color);
  document.documentElement.style.setProperty("--accent", mood.accent);
  document.querySelector("#headerMood").textContent = mood.label;
  document.querySelector('meta[name="theme-color"]').content = mood.accent;
  if (announce) showToast(`${mood.label} palette applied`);
  render();
}

// ── Rendering ───────────────────────────────────────────────────────
function render() {
  const renderer = routes[state.route] || routes.home;
  // Remove any previous weather background (it uses position:fixed)
  document.querySelectorAll(".weather-bg").forEach(el => el.remove());
  app.innerHTML = renderer();
  document.querySelectorAll("[data-route]").forEach(link =>
    link.classList.toggle("active", link.dataset.route === state.route)
  );
  bindPageEvents();
  requestAnimationFrame(() => app.focus({ preventScroll: true }));
}

function filteredWardrobe() {
  return state.wardrobe.filter(item =>
    (item.name || "").toLowerCase().includes(state.query.toLowerCase()) &&
    (state.filter === "All Types" || item.category === state.filter.toLowerCase())
  );
}

function itemImageStyle(item) {
  if (item.image_url) {
    const url = item.image_url.startsWith("http") 
      ? item.image_url 
      : `http://localhost:5000${item.image_url}`;
    return `background-image:url('${url}');background-size:cover;background-position:center;`;
  }
  return "background:#f5e9da;display:grid;place-items:center;font-size:2.5rem;color:var(--muted);";
}

function itemImageContent(item) {
  if (item.image_url) return "";
  const icons = { top: "👕", bottom: "👖", layer: "🧥", footwear: "👟", accessory: "⌚" };
  return icons[item.category] || "👔";
}

const COLOR_HEX = {
  dark:"#2c2c2a", light:"#f5f0e8", bright:"#e8a838", black:"#171512", white:"#f4eee5",
  beige:"#d4c5a9", pink:"#f2d4d4", yellow:"#f5e6a8", blue:"#afcbe3", green:"#b7c4a8",
  grey:"#b4b2a9", brown:"#3d2b1f", pastel:"#dcd6f0", bold:"#c0392b", sage:"#b7c4a8",
  lavender:"#d9c9e8", navy:"#2c3e6b", mint:"#c9e4d8", cream:"#f5f0e8", charcoal:"#2c2c2a",
  monochrome:"#555", printed:"#888", red:"#c0392b", olive:"#5a6040", peach:"#f7d9c4",
};

// ── Route Renderers ─────────────────────────────────────────────────
const routes = {
  home: () => {
    const items = state.wardrobe.slice(0, 6);
    return `
    <div class="page home-page">
      <section class="hero">
        <div class="hero-copy" data-parallax="-.08">
          <span class="eyebrow">EMOTION-LED PERSONAL STYLE</span>
          <h1>Dress for Your <em>Mood.</em><br>Live in Sync.</h1>
          <p>Real-time emotion detection meets personal style. Discover combinations from your own wardrobe that match how you feel, inside and out.</p>
          <button class="button primary" data-scroll="#moods">Get started <span>→</span></button>
        </div>
        <div class="hero-visual" data-parallax=".06"></div>
        <div class="detection-card panel">
          <span class="face">${moods[state.mood].icon}</span>
          <div><small>Detected mood</small><strong>${moods[state.mood].label}</strong></div>
          <div><small>Wardrobe items</small><strong>${state.wardrobe.length}</strong></div>
        </div>
      </section>
      <section class="section panel" style="padding:25px">
        <div class="section-heading"><div><h2>Your Wardrobe</h2><p>Items from your collection</p></div><button class="text-link" data-route-jump="wardrobe">View all →</button></div>
        <div class="cards-row">${items.length > 0 ? items.map(productCardFromDB).join("") : '<div class="empty-state"><span>👗</span><h3>No items yet</h3><p>Add clothes to your wardrobe to get started.</p><button class="button primary" data-route-jump="wardrobe">Go to Wardrobe <span>→</span></button></div>'}</div>
      </section>
      ${moodSection()}
    </div>`;
  },

  wardrobe: () => {
    const filtered = filteredWardrobe();
    const stats = state.wardrobeStats || {};
    const total = stats.total || state.wardrobe.length;
    const catCounts = {
      "All Items": total,
      "Tops": stats.top || 0,
      "Bottoms": stats.bottom || 0,
      "Layers": stats.layer || 0,
      "Footwear": stats.footwear || 0,
      "Accessories": stats.accessory || 0,
    };
    const pct = total > 0 ? Math.min(100, Math.round((total / 200) * 100)) : 0;

    return `<div class="page app-layout"><aside class="sidebar panel">
      <div class="side-title">WARDROBE</div>
      ${Object.entries(catCounts).map(([name, count]) =>
        `<button class="side-link ${(state.activeSideFilter || "All Items")===name?"active":""}" data-side-filter="${name}"><span>${name}</span><b>${count}</b></button>`
      ).join("")}
      <div class="capacity panel"><small>Wardrobe space</small><div class="bar"><i style="width:${pct}%"></i></div><b>${pct}% used</b></div>
      <button class="button primary" data-open-upload style="width:100%;margin-top:14px">+ Add new item</button>
    </aside><section>
      <div class="page-header"><span class="eyebrow">YOUR COLLECTION</span><h1>My Wardrobe</h1><p>All your clothes, organised and ready for any mood.</p></div>
      <div class="toolbar">
        <input class="control" id="wardrobeSearch" value="${state.query}" placeholder="Search in wardrobe...">
        <select class="control" id="typeFilter"><option>All Types</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="layer">Layer</option><option value="footwear">Footwear</option><option value="accessory">Accessory</option></select>
        <button class="button primary" data-open-upload>+ Add item</button>
      </div>
      <div class="catalog-grid">${filtered.length > 0 ? filtered.map(catalogCardFromDB).join("") :
        '<div class="empty-state" style="grid-column:1/-1"><span>📦</span><h3>No items found</h3><p>Upload clothes to build your wardrobe.</p><button class="button primary" data-open-upload>+ Add your first item <span>→</span></button></div>'
      }</div>
    </section></div>`;
  },

  outfits: () => {
    const combos = state.currentOutfits || [];
    const isLoading = state.outfitLoading;
    return `<div class="page" style="padding:30px 0 70px">
      <div class="page-header"><span class="eyebrow">AI CURATION</span><h1>Outfits for You</h1><p>Smart combinations from your wardrobe that match your mood.</p></div>
      <div class="chips">${Object.keys(moods).map(key => `<button class="chip toggleable mood-select ${state.mood===key?"selected":""}" data-mood="${key}">${moods[key].icon} ${moods[key].label}</button>`).join("")}</div>
      <div style="display:flex;gap:12px;margin-bottom:28px">
        <button class="button primary" id="btnGenerate" ${isLoading ? 'disabled' : ''}>${isLoading ? '<span class="spinner"></span> Generating...' : 'Generate outfit <span>→</span>'}</button>
        <button class="button ghost" id="btnRefresh" ${isLoading ? 'disabled' : ''}>New outfit ↻</button>
      </div>
      ${isLoading ? '<div class="loading-state"><div class="spinner-lg"></div><p>Curating outfits for your mood...</p></div>' :
        combos.length > 0 ? combos.map((combo, idx) => renderOutfitCombo(combo, idx)).join("") :
        '<div class="empty-state"><span>✨</span><h3>No outfits generated yet</h3><p>Click "Generate outfit" to get AI-curated combinations based on your current mood.</p></div>'
      }
    </div>`;
  },

  weather: () => {
    const w = state.weather;
    const wType = w?.type || 'PLEASANT';

    // Weather emoji map
    const weatherEmoji = { HOT: '☀️', RAINY: '🌧️', COLD: '❄️', PLEASANT: '🌸' };
    const weatherLabel = { HOT: 'Hot & Sunny', RAINY: 'Rainy', COLD: 'Cold', PLEASANT: 'Pleasant' };

    // Build animated background particles
    function buildBgParticles(type) {
      let html = '';
      if (type === 'HOT') {
        for (let i = 0; i < 20; i++) {
          const left = Math.random() * 100;
          const delay = Math.random() * 8;
          const size = 2 + Math.random() * 4;
          html += `<div class="particle" style="left:${left}%;animation-delay:${delay}s;width:${size}px;height:${size}px;"></div>`;
        }
      } else if (type === 'RAINY') {
        for (let i = 0; i < 60; i++) {
          const left = Math.random() * 100;
          const delay = Math.random() * 2;
          const dur = 0.5 + Math.random() * 0.8;
          const h = 15 + Math.random() * 25;
          html += `<div class="rain-drop" style="left:${left}%;height:${h}px;animation-delay:${delay}s;animation-duration:${dur}s;"></div>`;
        }
      } else if (type === 'COLD') {
        const flakes = ['❄', '❅', '❆', '✧', '·'];
        for (let i = 0; i < 30; i++) {
          const left = Math.random() * 100;
          const delay = Math.random() * 10;
          const dur = 5 + Math.random() * 8;
          const size = 10 + Math.random() * 14;
          html += `<div class="snowflake" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;font-size:${size}px;">${flakes[i % flakes.length]}</div>`;
        }
      } else {
        const leaves = ['🍃', '🌿', '🍂', '🌱', '☘️'];
        for (let i = 0; i < 15; i++) {
          const left = Math.random() * 100;
          const delay = Math.random() * 12;
          const dur = 10 + Math.random() * 8;
          html += `<div class="leaf" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;">${leaves[i % leaves.length]}</div>`;
        }
      }
      return html;
    }

    // Color palettes per weather type
    const palettes = {
      HOT:      [{ name:'White',   hex:'#ffffff' }, { name:'Cream',  hex:'#f5f0e8' }, { name:'Sky',    hex:'#87ceeb' }, { name:'Sage',    hex:'#c9e4d8' }, { name:'Peach',    hex:'#f7d9c4' }, { name:'Linen',  hex:'#faf0e6' }],
      RAINY:    [{ name:'Navy',    hex:'#2c3e6b' }, { name:'Charcoal',hex:'#2c2c2a' }, { name:'Olive',  hex:'#5a6040' }, { name:'Slate',   hex:'#708090' }, { name:'Burgundy', hex:'#800020' }, { name:'Dark Teal',hex:'#2f4f4f' }],
      COLD:     [{ name:'Brown',   hex:'#6b4423' }, { name:'Cream',  hex:'#f5f0e8' }, { name:'Burgundy',hex:'#800020' }, { name:'Charcoal',hex:'#2c2c2a' }, { name:'Forest',   hex:'#2d5f2d' }, { name:'Grey',   hex:'#888' }],
      PLEASANT: [{ name:'Beige',   hex:'#d4b896' }, { name:'Lavender',hex:'#d9c9e8' }, { name:'Mint',   hex:'#c9e4d8' }, { name:'Denim',   hex:'#5b7ea1' }, { name:'White',    hex:'#ffffff' }, { name:'Sage',   hex:'#9caf88' }],
    };

    // Stylist notes per weather
    const stylistNotes = {
      HOT: { title: 'Beat the Heat', icon: '🧊', advice: 'Prioritize breathable fabrics like linen and cotton. Go for lighter colors that reflect sunlight. Skip heavy layers — a single well-fitted top with shorts or light trousers is ideal. Open footwear works great today.', fabrics: 'Linen, Cotton, Chambray', avoid: 'Dark heavy layers, Wool, Leather boots' },
      RAINY: { title: 'Stay Dry, Stay Sharp', icon: '☂️', advice: 'Layer up with water-resistant outer layers. Darker tones hide splash marks. Avoid white footwear — go for boots or dark sneakers. A good jacket is your best friend today.', fabrics: 'Nylon, Polyester, Treated Cotton', avoid: 'White sneakers, Suede, Silk' },
      COLD: { title: 'Bundle Up in Style', icon: '🧣', advice: 'Layer strategically — a base layer, mid-layer, and outer coat. Rich, warm colors pair beautifully with cold weather. Boots are your best footwear option. Accessories like scarves and gloves add both warmth and style.', fabrics: 'Wool, Cashmere, Fleece, Knit', avoid: 'Thin cotton tees, Sandals, Sleeveless' },
      PLEASANT: { title: 'Perfect Weather, Full Freedom', icon: '✨', advice: 'The weather is on your side! You have full creative freedom today. Mix and match colors freely. This is the best weather for experimenting with patterns, prints, and statement pieces.', fabrics: 'Anything goes — Cotton, Denim, Light Knits', avoid: 'No restrictions today!' },
    };

    // Wardrobe suitability insights
    const insights = {
      HOT:      [{ icon:'👕', text:'Light tops recommended' }, { icon:'🩳', text:'Shorts & skirts ideal' }, { icon:'🧴', text:'UV protection advised' }, { icon:'👟', text:'Open or canvas shoes' }],
      RAINY:    [{ icon:'🧥', text:'Water-resistant layers' }, { icon:'👢', text:'Waterproof boots ideal' }, { icon:'🌂', text:'Carry an umbrella' }, { icon:'🎨', text:'Darker color palette' }],
      COLD:     [{ icon:'🧥', text:'Warm outer layers' }, { icon:'🧣', text:'Scarves & gloves' }, { icon:'👢', text:'Insulated footwear' }, { icon:'🔥', text:'Rich warm tones' }],
      PLEASANT: [{ icon:'👗', text:'Versatile outfits' }, { icon:'🎨', text:'Any color palette' }, { icon:'👟', text:'Any footwear' }, { icon:'🌈', text:'Experiment freely' }],
    };

    const palette = palettes[wType] || palettes.PLEASANT;
    const note = stylistNotes[wType] || stylistNotes.PLEASANT;
    const insightList = insights[wType] || insights.PLEASANT;
    const isRainy = wType === 'RAINY';



    return `
    <div class="weather-bg weather-bg--${wType}">
      ${buildBgParticles(wType)}
    </div>
    <div class="page weather-page ${isRainy ? 'rainy-theme' : ''}">
      <div class="weather-content">
        <div class="page-header">
          <span class="eyebrow">AI WEATHER STYLIST</span>
          <h1>Style by Forecast</h1>
          <p>Your mood meets real-time weather — outfit intelligence that adapts to the sky.</p>
        </div>

        ${w ? `
        <div class="weather-glass" style="margin-bottom:20px">
          <div class="weather-hero-card">
            <div class="weather-icon-wrap">${weatherEmoji[wType]}</div>
            <div>
              <h2 class="weather-temp">${Math.round(w.temp)}°C</h2>
              <p class="weather-condition">${w.condition}</p>
              <p class="weather-city">${w.city}</p>
            </div>
            <div class="weather-location-actions">
              <button class="button primary" id="btnDetectLocation" style="font-size:.85rem">📍 Update Location</button>
              <button class="button ghost" id="btnManualLocation" style="font-size:.85rem">🔍 Enter City</button>
            </div>
          </div>
          <div class="weather-hero-meta">
            <div class="meta-item">🌡️ Feels like ${Math.round(w.temp)}°C</div>
            <div class="meta-item">💧 ${w.humidity || '--'}% humidity</div>
            <div class="meta-item">☁️ ${weatherLabel[wType]}</div>
            <div class="meta-item">👗 ${moods[state.mood]?.label || 'Happy'} mood</div>
          </div>
        </div>


        <div class="weather-grid">
          <div class="weather-glass">
            <h2>🧠 AI Stylist Note</h2>
            <div class="stylist-note">
              <span class="note-icon">${note.icon}</span>
              <div class="note-content">
                <h4>${note.title}</h4>
                <p>${note.advice}</p>
              </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:20px;flex-wrap:wrap">
              <div><small style="opacity:.6">Recommended Fabrics</small><p style="margin:4px 0 0;font-weight:600;font-size:.9rem">${note.fabrics}</p></div>
              <div><small style="opacity:.6">Avoid Today</small><p style="margin:4px 0 0;font-weight:600;font-size:.9rem;opacity:.7">${note.avoid}</p></div>
            </div>
          </div>
          <div class="weather-glass">
            <h2>🎨 Today’s Color Palette</h2>
            <p style="font-size:.88rem;opacity:.7">Colors curated for ${weatherLabel[wType].toLowerCase()} weather and your ${moods[state.mood]?.label || ''} mood.</p>
            <div class="palette-strip">
              ${palette.map(c => `<div class="palette-swatch" style="background:${c.hex}"><span class="swatch-label">${c.name}</span></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="weather-glass" style="margin-top:20px">
          <h2>📊 Wardrobe Suitability</h2>
          <p style="font-size:.88rem;opacity:.7">How today’s weather affects your outfit choices.</p>
          <div class="insight-row">
            ${insightList.map(i => `<div class="insight-chip"><span class="chip-icon">${i.icon}</span>${i.text}</div>`).join('')}
          </div>
        </div>


        ` : `
        <div class="weather-glass">
          <div class="weather-empty">
            <span class="empty-icon">🌤️</span>
            <h3>Connect Your Location</h3>
            <p>Share your location or enter a city to unlock weather-aware styling. The AI Stylist will adapt your outfits to match the weather outside.</p>
            <div class="button-row">
              <button class="button primary" id="btnDetectLocation">📍 Detect My Location</button>
              <button class="button ghost" id="btnManualLocation">🔍 Enter City Manually</button>
            </div>
          </div>
        </div>
        `}
      </div>
    </div>`;
  },

  mood: () => `<div class="page">
    ${moodSection(true)}
    <section class="section dashboard">
      <div class="panel"><h2>Mood History</h2><div class="donut" id="moodDonut"></div></div>
      <div class="panel"><h2>Style Response</h2><p>Your moods shape your wardrobe suggestions. The system learns which colors, fits, and silhouettes work best for each emotional state.</p>
        <ul class="preference-list">
          ${state.profileStats?.moodDistribution ? Object.entries(state.profileStats.moodDistribution).slice(0, 5).map(([mood, pct]) =>
            `<li><span>${mood.charAt(0).toUpperCase() + mood.slice(1)}</span><b>${pct}%</b></li>`
          ).join("") : '<li><span>No mood data yet</span><b>—</b></li>'}
        </ul>
      </div>
    </section>
  </div>`,

  profile: () => {
    const u = state.user || {};
    const s = state.profileStats || {};
    const initial = (u.username || "?")[0].toUpperCase();
    return `
    <div class="page" style="padding:35px 0 70px">
      <section class="profile-hero panel">
        <div class="avatar">${initial}</div>
        <div>
          <span class="eyebrow">PERSONAL STYLE PROFILE</span>
          <h1>Hey, ${u.username || "User"} 👋</h1>
          <p>Looking good. Let's keep your style in sync.</p>
        </div>
        <div style="display:flex;gap:10px;flex-direction:column">
          <button class="button primary" id="btnEditProfile">Edit profile</button>
          <button class="logout-btn" id="btnLogout">Sign out</button>
        </div>
      </section>
      <div class="stats">
        <div class="stat panel"><strong>${s.itemCount ?? state.wardrobe.length}</strong><small>Items in wardrobe</small></div>
        <div class="stat panel"><strong>${s.outfitCount ?? 0}</strong><small>Outfits created</small></div>
        <div class="stat panel"><strong>${state.favorites.size}</strong><small>Favourite items</small></div>
        <div class="stat panel"><strong>${s.daysActive ?? 1}</strong><small>Days active</small></div>
      </div>
      <section class="dashboard">
        <div class="panel"><h2>Style Preferences</h2><ul class="preference-list">
          <li><span>Fit Preference</span><b>${u.fitPreference || "Regular"}</b></li>
          <li><span>Color Preference</span><b>${(u.colorPreference || []).join(", ") || "Not set"}</b></li>
          <li><span>Style Personality</span><b>${u.stylePersonality || "Minimal"}</b></li>
          <li><span>Fabric Preference</span><b>${(u.fabricPreference || []).join(", ") || "Not set"}</b></li>
        </ul></div>
        <div class="panel"><h2>Body & Style Profile</h2><ul class="preference-list">
          <li><span>Height</span><b>${u.height ? u.height + " cm" : "Not set"}</b></li>
          <li><span>Weight</span><b>${u.weight ? u.weight + " kg" : "Not set"}</b></li>
          <li><span>Body Type</span><b>${u.bodyType || "Average"}</b></li>
          <li><span>Skin Tone</span><b>${u.skinTone || "Medium"}</b></li>
          <li><span>Hair Type</span><b>${u.hairType || "Straight"}</b></li>
        </ul></div>
        <div class="panel"><h2>Mood Insights</h2>
          ${s.moodDistribution && Object.keys(s.moodDistribution).length > 0 ?
            `<div class="donut" id="profileDonut"></div>` :
            `<p style="color:var(--muted)">Scan your face to start building mood insights.</p>`
          }
        </div>
        <div class="panel"><h2>Recent Moods</h2><div class="history-list">
          ${(s.recentMoods || []).length > 0 ? (s.recentMoods || []).slice(0, 5).map(m =>
            `<div class="history-item panel" style="padding:14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div><b>${m.mood.charAt(0).toUpperCase() + m.mood.slice(1)}</b><small style="color:var(--muted)"> · ${new Date(m.timestamp).toLocaleDateString()}</small></div>
              <span>${(m.confidence * 100).toFixed(0)}%</span>
            </div>`
          ).join("") : '<p style="color:var(--muted)">No mood scans yet.</p>'}
        </div></div>
      </section>
    </div>`;
  },
};

// ── Component Helpers ───────────────────────────────────────────────
function moodSection(standalone = false) {
  return `<section class="section ${standalone ? "panel" : ""}" id="moods" style="${standalone ? "padding:clamp(24px,5vw,60px);margin-top:35px" : ""}">
    <div class="section-heading"><div><h2>How are you feeling?</h2><p>Your mood drives your style and the site's ambient gradient.</p></div>
    ${standalone ? '<button class="button primary" id="openScan">Scan face</button>' : ""}</div>
    <div class="mood-grid">${Object.entries(moods).map(([key, mood]) =>
      `<button class="mood-card ${state.mood === key ? "active" : ""}" data-mood="${key}">
        <span class="mood-icon">${mood.icon}</span><b>${mood.label}</b><small>${mood.note}</small>
      </button>`
    ).join("")}</div>
  </section>`;
}

function productCardFromDB(item) {
  return `<article class="product-card">
    <div class="product-image" style="${itemImageStyle(item)}">${itemImageContent(item)}</div>
    <h3>${item.name}</h3>
    <p>${item.category}${item.subtype ? " · " + item.subtype : ""}</p>
  </article>`;
}

function catalogCardFromDB(item) {
  const fav = state.favorites.has(item._id);
  const colors = (item.color_spectrum || []).slice(0, 5);
  const labels = (item.labels || []).slice(0, 3);
  return `<article class="product-card catalog-card">
    <button class="delete-btn" data-delete="${item._id}" title="Delete item">✕</button>
    <div class="product-image" style="${itemImageStyle(item)}">${itemImageContent(item)}</div>
    <div class="card-copy">
      <small>${item.category}${item.subtype ? " · " + item.subtype : ""}</small>
      <h3>${item.name}</h3>
      <button class="text-link favorite" data-favorite="${item._id}">${fav ? "♥ Saved" : "♡ Save"}</button>
      <div class="swatches">${colors.map(c => `<i style="background:${COLOR_HEX[c] || "#ccc"}"></i>`).join("")}</div>
      ${labels.length > 0 ? `<div class="card-labels">${labels.map(l => `<span>${l}</span>`).join("")}</div>` : ""}
    </div>
  </article>`;
}

function renderOutfitCombo(combo, idx) {
  const CATEGORY_ORDER = ["top", "bottom", "layer", "footwear", "accessory"];
  const CATEGORY_LABELS = { top: "Top", bottom: "Bottom", layer: "Layer", footwear: "Footwear", accessory: "Accessory" };
  const pieces = CATEGORY_ORDER
    .filter(k => combo[k] && typeof combo[k] === 'object' && (combo[k].name || combo[k].mongoId))
    .map(k => [k, combo[k]]);
  if (pieces.length === 0) return "";
  const titles = ["Today's Look", "Alternative Style", "Mix It Up"];
  const gridCols = pieces.length <= 3 ? 'repeat(3, 1fr)' : pieces.length === 4 ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)';
  return `
    <div class="outfit-combo-section" style="margin-bottom:32px">
      <div class="outfit-combo-header">
        <h3>${titles[idx] || "Outfit " + (idx + 1)}</h3>
        <span class="outfit-piece-count">${pieces.length} pieces</span>
      </div>
      <div class="outfit-combo-grid" style="grid-template-columns:${gridCols}">
        ${pieces.map(([cat, item]) => `
          <article class="product-card outfit-combo-card">
            <div class="outfit-category-badge">${CATEGORY_LABELS[cat] || cat}</div>
            <div class="product-image" style="${itemImageStyle(item)}">${itemImageContent(item)}</div>
            <div class="card-copy"><small>${cat}</small><h3>${item.name || "Item"}</h3></div>
          </article>
        `).join("")}
      </div>
    </div>`;
}

// ── Event Bindings ──────────────────────────────────────────────────
function bindPageEvents() {
  document.querySelectorAll("[data-mood]").forEach(btn =>
    btn.addEventListener("click", () => setMood(btn.dataset.mood))
  );
  document.querySelectorAll("[data-route-jump]").forEach(btn =>
    btn.addEventListener("click", () => { location.hash = btn.dataset.routeJump; })
  );
  document.querySelectorAll("[data-scroll]").forEach(btn =>
    btn.addEventListener("click", () => document.querySelector(btn.dataset.scroll)?.scrollIntoView({ behavior: "smooth" }))
  );
  document.querySelectorAll("[data-open-upload]").forEach(btn =>
    btn.addEventListener("click", openUploadDialog)
  );
  document.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", (e) => { e.stopPropagation(); deleteItem(btn.dataset.delete); })
  );
  document.querySelectorAll("[data-favorite]").forEach(btn =>
    btn.addEventListener("click", () => toggleFavorite(btn.dataset.favorite))
  );
  document.querySelector("#openScan")?.addEventListener("click", openScanner);
  // Debounced search
  document.querySelector("#wardrobeSearch")?.addEventListener("input", e => {
    clearTimeout(state._searchDebounce);
    state._searchDebounce = setTimeout(() => { state.query = e.target.value; render(); }, 250);
  });
  document.querySelector("#typeFilter")?.addEventListener("change", e => { state.filter = e.target.value || "All Types"; render(); });

  document.querySelector("#btnGenerate")?.addEventListener("click", () => generateOutfit(true));
  document.querySelector("#btnRefresh")?.addEventListener("click", () => generateOutfit(false));
  document.querySelector("#btnEditProfile")?.addEventListener("click", openProfileEdit);
  document.querySelector("#btnLogout")?.addEventListener("click", logout);

  document.querySelector("#btnDetectLocation")?.addEventListener("click", () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        state.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem("affectsync-location", JSON.stringify(state.location));
        showToast("Location detected! Fetching weather...");
        await fetchWeather();
      }, () => {
        showToast("Could not detect location.");
      });
    }
  });

  document.querySelector("#btnManualLocation")?.addEventListener("click", async () => {
    const city = prompt("Enter your city:");
    if (city) {
      state.location = { city };
      localStorage.setItem("affectsync-location", JSON.stringify(state.location));
      showToast("City updated! Fetching weather...");
      await fetchWeather();
    }
  });

  // Sidebar filter — track active in state to survive re-renders
  document.querySelectorAll("[data-side-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.sideFilter;
      const filterMap = { "All Items": "All Types", "Tops": "top", "Bottoms": "bottom", "Layers": "layer", "Footwear": "footwear", "Accessories": "accessory" };
      state.filter = filterMap[val] || "All Types";
      state.activeSideFilter = val;
      render();
    });
  });

  // Build donut charts if present
  buildDonut("moodDonut");
  buildDonut("profileDonut");
}

function buildDonut(id) {
  const el = document.querySelector(`#${id}`);
  if (!el || !state.profileStats?.moodDistribution) return;
  const dist = state.profileStats.moodDistribution;
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return;

  const colors = { happy: "#dfb341", calm: "#b3875b", confident: "#ba7b35", romantic: "#c96f74", sad: "#688ba6", excited: "#e17c2c", stressed: "#827d9a" };
  let gradient = "";
  let cumulative = 0;
  entries.forEach(([mood, pct]) => {
    const start = cumulative;
    cumulative += pct;
    gradient += `${colors[mood] || "#ccc"} ${start}% ${cumulative}%, `;
  });
  el.style.background = `conic-gradient(${gradient.slice(0, -2)})`;
  const top = entries[0];
  el.setAttribute("style", el.getAttribute("style") + `;--donut-label:"${top[0]}\\A${top[1]}%"`);
  el.innerHTML = `<div style="position:absolute;inset:26px;border-radius:50%;display:grid;place-items:center;text-align:center;background:#faf2e7;font-weight:700">${top[0].charAt(0).toUpperCase() + top[0].slice(1)}<br>${top[1]}%</div>`;
}

function toggleFavorite(id) {
  state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
  localStorage.setItem("affectsync-favorites", JSON.stringify([...state.favorites]));
  render();
}

// ── Dialogs ─────────────────────────────────────────────────────────
function openUploadDialog() {
  document.querySelector("#uploadForm").reset();
  document.querySelector("#uploadPreviewImg").style.display = "none";
  document.querySelector("#uploadPreview").style.display = "";
  document.querySelectorAll("#uploadColors .chip").forEach(c => c.classList.remove("selected"));
  uploadDialog.showModal();
}

function openProfileEdit() {
  const u = state.user || {};
  document.querySelector("#editHeight").value = u.height || "";
  document.querySelector("#editWeight").value = u.weight || "";
  document.querySelector("#editBodyType").value = u.bodyType || "Average";
  document.querySelector("#editSkinTone").value = u.skinTone || "Medium";
  document.querySelector("#editStyle").value = u.stylePersonality || "Minimal";
  document.querySelector("#editFit").value = u.fitPreference || "Regular";
  profileEditDialog.showModal();
}

function openScanner() { scanDialog.showModal(); }

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ── Camera / Face Scan ──────────────────────────────────────────────
async function startCamera() {
  const status = document.querySelector("#scanStatus");
  const btn = document.querySelector("#startCamera");
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    document.querySelector("#camera").srcObject = cameraStream;
    status.textContent = "Scanning... capturing frames for 7 seconds";
    btn.textContent = "Scanning...";
    btn.disabled = true;

    // Capture frames over 7 seconds
    const frames = [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const video = document.querySelector("#camera");

    const captureInterval = setInterval(() => {
      if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        frames.push(canvas.toDataURL("image/jpeg", 0.6));
      }
    }, 1000); // 1 frame per second

    setTimeout(async () => {
      clearInterval(captureInterval);
      status.textContent = `Analyzing ${frames.length} frames...`;

      try {
        const data = await apiRequest("/ai/scan", {
          method: "POST",
          body: JSON.stringify({ frames }),
        });
        status.textContent = `${moods[data.emotion]?.label || data.emotion} detected · ${(data.confidence * 100).toFixed(0)}% confidence`;
        setTimeout(() => {
          closeScanner();
          setMood(data.emotion);
        }, 1200);
      } catch (err) {
        status.textContent = "Detection failed — " + err.message + ". Try demo mode.";
        btn.textContent = "Start face scan →";
        btn.disabled = false;
      }
    }, 7000);
  } catch {
    status.textContent = "Camera unavailable. Use demo detection or connect over HTTPS.";
  }
}

function closeScanner() {
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
  const btn = document.querySelector("#startCamera");
  if (btn) { btn.textContent = "Start face scan →"; btn.disabled = false; }
  scanDialog.close();
}

// ── Global Event Listeners ──────────────────────────────────────────

// Parallax
document.addEventListener("mousemove", e => {
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
}, { passive: true });

document.addEventListener("scroll", () => {
  document.querySelectorAll("[data-parallax]").forEach(el => {
    const speed = Number(el.dataset.parallax);
    el.style.setProperty("--parallax", `${window.scrollY * speed}px`);
    if (!el.classList.contains("hero-visual")) el.style.transform = `translateY(${window.scrollY * speed}px)`;
  });
}, { passive: true });

// Hash routing
window.addEventListener("hashchange", () => {
  state.route = location.hash.slice(1) || "home";
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Load data for specific routes
  if (state.route === "wardrobe") loadWardrobeStats().then(render);
  else if (state.route === "profile") loadProfileStats().then(render);
  else if (state.route === "mood") loadProfileStats().then(render);
  else if (state.route === "weather") { autoDetectAndFetchWeather(); render(); }
  else render();
});

// Header scan button
document.querySelector("#faceScan").addEventListener("click", openScanner);
document.querySelector("[data-close]").addEventListener("click", closeScanner);
document.querySelector("#startCamera").addEventListener("click", startCamera);
document.querySelector("#demoScan").addEventListener("click", () => {
  const keys = Object.keys(moods);
  const detected = keys[Math.floor(Math.random() * keys.length)];
  document.querySelector("#scanStatus").textContent = `${moods[detected].label} detected · 92% confidence`;
  setTimeout(() => { closeScanner(); setMood(detected); }, 800);
});
document.querySelector("#menuButton").addEventListener("click", () =>
  document.querySelector(".main-nav").classList.toggle("open")
);
scanDialog.addEventListener("click", e => { if (e.target === scanDialog) closeScanner(); });

// Upload dialog
document.querySelector("[data-close-upload]").addEventListener("click", () => uploadDialog.close());
uploadDialog.addEventListener("click", e => { if (e.target === uploadDialog) uploadDialog.close(); });

// Upload preview
document.querySelector("#uploadPreview").addEventListener("click", () => document.querySelector("#itemUpload").click());
document.querySelector("#uploadPreviewImg").addEventListener("click", () => document.querySelector("#itemUpload").click());
document.querySelector("#itemUpload").addEventListener("change", e => {
  if (!e.target.files[0]) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.querySelector("#uploadPreviewImg").src = ev.target.result;
    document.querySelector("#uploadPreviewImg").style.display = "";
    document.querySelector("#uploadPreview").style.display = "none";
  };
  reader.readAsDataURL(e.target.files[0]);
});

// Upload form
document.querySelector("#uploadForm").addEventListener("submit", e => {
  e.preventDefault();
  uploadItem(e.target);
});

// Chip select toggles
document.addEventListener("click", e => {
  if (e.target.classList.contains("toggleable") && e.target.closest(".chip-select")) {
    e.target.classList.toggle("selected");
  }
});

// Profile edit dialog
document.querySelector("[data-close-profile]").addEventListener("click", () => profileEditDialog.close());
profileEditDialog.addEventListener("click", e => { if (e.target === profileEditDialog) profileEditDialog.close(); });
document.querySelector("#profileEditForm").addEventListener("submit", e => {
  e.preventDefault();
  updateProfile({
    height: Number(document.querySelector("#editHeight").value) || null,
    weight: Number(document.querySelector("#editWeight").value) || null,
    bodyType: document.querySelector("#editBodyType").value,
    skinTone: document.querySelector("#editSkinTone").value,
    stylePersonality: document.querySelector("#editStyle").value,
    fitPreference: document.querySelector("#editFit").value,
  });
});

// ── Auth Forms ──────────────────────────────────────────────────────
document.querySelector("#showRegister").addEventListener("click", () => {
  document.querySelector("#loginForm").style.display = "none";
  document.querySelector("#registerForm").style.display = "";
});
document.querySelector("#showLogin").addEventListener("click", () => {
  document.querySelector("#registerForm").style.display = "none";
  document.querySelector("#loginForm").style.display = "";
});

// Registration steps
document.querySelector("#regNext1").addEventListener("click", () => {
  const user = document.querySelector("#regUser").value;
  const pass = document.querySelector("#regPass").value;
  const gender = document.querySelector("#regGender").value;
  if (!user || !pass || !gender) return;
  document.querySelector("#regStep1").style.display = "none";
  document.querySelector("#regStep2").style.display = "";
});
document.querySelector("#regNext2").addEventListener("click", () => {
  document.querySelector("#regStep2").style.display = "none";
  document.querySelector("#regStep3").style.display = "";
});
document.querySelector("#regBack1").addEventListener("click", () => {
  document.querySelector("#regStep2").style.display = "none";
  document.querySelector("#regStep1").style.display = "";
});
document.querySelector("#regBack2").addEventListener("click", () => {
  document.querySelector("#regStep3").style.display = "none";
  document.querySelector("#regStep2").style.display = "";
});

// Login submit
document.querySelector("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.querySelector("#loginError");
  errEl.textContent = "";
  try {
    await login(
      document.querySelector("#loginUser").value,
      document.querySelector("#loginPass").value
    );
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// Register submit
document.querySelector("#registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const errEl = document.querySelector("#regError");
  errEl.textContent = "";

  const colorChips = Array.from(document.querySelectorAll("#regColors .chip.selected")).map(c => c.dataset.value);

  try {
    await register({
      username: document.querySelector("#regUser").value,
      password: document.querySelector("#regPass").value,
      gender: document.querySelector("#regGender").value,
      height: Number(document.querySelector("#regHeight").value) || null,
      weight: Number(document.querySelector("#regWeight").value) || null,
      bodyType: document.querySelector("#regBodyType").value,
      skinTone: document.querySelector("#regSkinTone").value,
      hairType: document.querySelector("#regHairType").value,
      stylePersonality: document.querySelector("#regStyle").value,
      fitPreference: document.querySelector("#regFit").value,
      colorPreference: colorChips,
    });
  } catch (err) {
    errEl.textContent = err.message;
  }
});

// ── Initialization ──────────────────────────────────────────────────
if (isLoggedIn()) {
  showApp();
  setMood(state.mood, false);
  loadWardrobe().then(() => render());
} else {
  hideApp();
  setMood(state.mood, false);
}
