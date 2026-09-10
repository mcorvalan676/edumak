const cfg = window.EDUMAP_CONFIG || {};
if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
  document.body.insertAdjacentHTML("afterbegin",
    `<div class="config-warning">Falta configurar <b>config.js</b>. Copia <b>config.example.js</b> y agrega la URL + anon public key de Supabase.</div>`);
}
const sb = supabase.createClient(cfg.supabaseUrl || "https://invalid.supabase.co", cfg.supabaseAnonKey || "invalid");

let spaces = [];
let nodes = [];
let edges = [];
let favorites = [];
let map;
let routeLayer;

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

async function loadData() {
  const [s, n, e] = await Promise.all([
    sb.from("spaces").select("*").order("name"),
    sb.from("navigation_nodes").select("*").order("name"),
    sb.from("navigation_edges").select("*")
  ]);
  if (s.error || n.error || e.error) {
    console.error(s.error, n.error, e.error);
    document.getElementById("routeResult").textContent =
      "No se pudieron cargar los datos. Revisa Supabase y las políticas RLS.";
    return;
  }
  spaces = s.data || [];
  nodes = n.data || [];
  edges = e.data || [];
  renderSpaces();
  fillNodeSelects();
  renderMap();
}

function renderSpaces() {
  const el = document.getElementById("spaces");
  el.innerHTML = spaces.map(x => `
    <article class="card">
      <h3>${esc(x.name)}</h3>
      <p>${esc(x.description || "Sin descripción")}</p>
      <small>Tipo: ${esc(x.space_type || "espacio")} · Piso: ${esc(x.floor_id)}</small>
      <button data-fav="${x.id}" class="secondary favBtn">☆ Favorito</button>
    </article>
  `).join("");
  document.querySelectorAll(".favBtn").forEach(b =>
    b.addEventListener("click", () => toggleFavorite(Number(b.dataset.fav)))
  );
}

function fillNodeSelects() {
  const opts = nodes.map(n => `<option value="${n.id}">${esc(n.name)}</option>`).join("");
  document.getElementById("fromNode").innerHTML = opts;
  document.getElementById("toNode").innerHTML = opts;
  if (nodes.length > 1) document.getElementById("toNode").selectedIndex = 1;
}

function renderMap() {
  if (!map) {
    map = L.map("map").setView([-35.848, -71.597], 18);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 21,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
  }
  nodes.forEach(n => {
    if (n.lat != null && n.lng != null) {
      L.marker([n.lat, n.lng]).addTo(map).bindPopup(`<b>${esc(n.name)}</b>`);
    }
  });
}

function dijkstra(startId, endId, accessibleOnly=false) {
  const dist = new Map(nodes.map(n => [n.id, Infinity]));
  const prev = new Map();
  const used = new Set();
  dist.set(startId, 0);

  while (used.size < nodes.length) {
    let u = null, best = Infinity;
    for (const [id, d] of dist) if (!used.has(id) && d < best) { best=d; u=id; }
    if (u === null) break;
    if (u === endId) break;
    used.add(u);

    for (const e of edges) {
      if (accessibleOnly && !e.accessible) continue;
      let v = null;
      if (e.from_node_id === u) v = e.to_node_id;
      else if (e.to_node_id === u) v = e.from_node_id;
      if (v === null || used.has(v)) continue;
      const nd = best + Number(e.weight || 1);
      if (nd < dist.get(v)) {
        dist.set(v, nd);
        prev.set(v, u);
      }
    }
  }
  if (!isFinite(dist.get(endId))) return [];
  const path = [];
  let cur = endId;
  while (cur != null) {
    path.unshift(cur);
    if (cur === startId) break;
    cur = prev.get(cur);
  }
  return path[0] === startId ? path : [];
}

async function calculateRoute() {
  const start = Number(document.getElementById("fromNode").value);
  const end = Number(document.getElementById("toNode").value);
  const accessible = document.getElementById("accessibleOnly").checked;
  const path = dijkstra(start, end, accessible);

  if (!path.length) {
    document.getElementById("routeResult").textContent = "No existe una ruta con esos criterios.";
    return;
  }

  const points = path.map(id => nodes.find(n => n.id === id)).filter(Boolean)
    .filter(n => n.lat != null && n.lng != null)
    .map(n => [n.lat, n.lng]);

  if (routeLayer) routeLayer.remove();
  if (points.length > 1) {
    routeLayer = L.polyline(points, {weight: 6}).addTo(map);
    map.fitBounds(routeLayer.getBounds(), {padding: [20,20]});
  }
  document.getElementById("routeResult").textContent =
    `Ruta encontrada: ${path.length} puntos · distancia lógica ${pathDistance(path).toFixed(1)}`;
}

function pathDistance(path) {
  let total = 0;
  for (let i=1; i<path.length; i++) {
    const e = edges.find(x =>
      (x.from_node_id === path[i-1] && x.to_node_id === path[i]) ||
      (x.to_node_id === path[i-1] && x.from_node_id === path[i])
    );
    total += Number(e?.weight || 1);
  }
  return total;
}

async function searchSpaces() {
  const q = document.getElementById("searchInput").value.trim();
  const el = document.getElementById("searchResults");
  if (!q) { el.innerHTML = ""; return; }
  const {data, error} = await sb.from("spaces").select("*")
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`).limit(20);
  if (error) { el.textContent = "Error en búsqueda."; return; }
  el.innerHTML = (data || []).map(x =>
    `<button class="resultItem" data-node="${x.node_id || ""}"><b>${esc(x.name)}</b> — ${esc(x.description || "")}</button>`
  ).join("") || "No se encontraron resultados.";
  el.querySelectorAll("[data-node]").forEach(btn => btn.addEventListener("click", () => {
    const node = Number(btn.dataset.node);
    const idx = nodes.findIndex(n => n.id === node);
    if (idx >= 0) document.getElementById("toNode").selectedIndex = idx;
  }));
}

async function toggleFavorite(spaceId) {
  const {data:{user}} = await sb.auth.getUser();
  if (!user) return alert("Inicia sesión para guardar favoritos.");
  const existing = favorites.find(f => f.space_id === spaceId);
  if (existing) {
    await sb.from("favorites").delete().eq("id", existing.id);
  } else {
    await sb.from("favorites").insert({user_id:user.id, space_id:spaceId});
  }
  await loadFavorites();
}

async function loadFavorites() {
  const {data:{user}} = await sb.auth.getUser();
  const el = document.getElementById("favorites");
  if (!user) { el.textContent = "Inicia sesión para ver tus favoritos."; return; }
  const {data, error} = await sb.from("favorites")
    .select("id,space_id,spaces(name)").eq("user_id", user.id);
  if (error) { el.textContent = "No se pudieron cargar favoritos."; return; }
  favorites = data || [];
  el.innerHTML = favorites.map(f => `<div class="resultItem">${esc(f.spaces?.name || "Espacio")}</div>`).join("")
    || "No tienes favoritos todavía.";
}

async function updateAuthUI() {
  const {data:{user}} = await sb.auth.getUser();
  const label = document.getElementById("userLabel");
  const logout = document.getElementById("logoutBtn");
  if (!user) {
    label.textContent = "No conectado";
    logout.classList.add("hidden");
    document.getElementById("adminPanel").classList.add("hidden");
    return loadFavorites();
  }
  label.textContent = user.email;
  logout.classList.remove("hidden");
  await loadFavorites();

  const {data:profile} = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.role === "admin";
  document.getElementById("adminPanel").classList.toggle("hidden", !isAdmin);
  document.getElementById("adminHint").classList.toggle("hidden", isAdmin);
}

document.getElementById("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const {error} = await sb.auth.signInWithPassword({email, password});
  document.getElementById("authMessage").textContent = error ? error.message : "Sesión iniciada.";
  await updateAuthUI();
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const {error} = await sb.auth.signUp({email, password});
  document.getElementById("authMessage").textContent =
    error ? error.message : "Registro creado. Si Supabase solicita confirmación, revisa tu correo.";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  await updateAuthUI();
});

document.getElementById("routeBtn").addEventListener("click", calculateRoute);
document.getElementById("searchBtn").addEventListener("click", searchSpaces);
document.getElementById("searchInput").addEventListener("keydown", e => {
  if (e.key === "Enter") searchSpaces();
});
document.getElementById("reloadBtn").addEventListener("click", loadData);

sb.auth.onAuthStateChange(() => setTimeout(updateAuthUI, 0));

loadData();
updateAuthUI();
