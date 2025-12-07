/* ============================================
   BuySahi – All Products Grid Page
=============================================== */

const SHEET_ID = "1Nnil4LOj5Fkr3O8zX7KLqleOLIi8-iy3GVKoOWug9bQ";
const SHEET_NAME = "Sheet2";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];

/* Utility */
const s = (v) => (v || "").toString().toLowerCase();
function escapeHtml(v){
  return String(v||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

async function loadProductsFromSheet() {
  try {
    const res = await fetch(SHEET_URL, { cache: "no-store" });
    const text = await res.text();

    // Strip GViz wrapper: google.visualization.Query.setResponse(...)
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table?.rows || [];

    // Sheet2: Product Name | Price | ImageURL | Code | Category
    ALL_PRODUCTS = rows.map((r) => {
      const c = r.c || [];
      const rawCat = c[4]?.v || "trending";

      return {
        title: c[0]?.v || "",
        price: c[1]?.v || "",
        image: c[2]?.v || "",
        // No ProductLink column in Sheet2 — keep placeholder for now
        link: "#",
        code: (c[3]?.v || "").toString(),
        desc: "", // no description column in Sheet2
        category: safeCategory(rawCat)
      };
    });

    CATEGORIES = groupByCategory(ALL_PRODUCTS);
    buildCarousels();

    lastLoadedAt = Date.now();
  } catch (err) {
    console.error("❌ Failed to load sheet:", err);
    showStatus("Sheet fetch failed. Check sharing & sheet name.", true);
  }
}

/* Build Filter Chips */
function buildCategoryChips(){
  const chips = document.getElementById("filterChips");

  const uniqueCats = [...new Set(ALL_PRODUCTS.map(p => p.category))];

  uniqueCats.forEach(cat => {
    chips.insertAdjacentHTML("beforeend", `
      <button class="chip" data-category="${cat}">${cat}</button>
    `);
  });

  chips.addEventListener("click", (e) => {
    if(!e.target.classList.contains("chip")) return;

    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");

    const cat = e.target.dataset.category;
    if(cat === "all"){
      renderGrid(ALL_PRODUCTS);
    } else {
      renderGrid(ALL_PRODUCTS.filter(p => p.category === cat));
    }
  });
}

/* Render Grid */
function renderGrid(list){
  const grid = document.getElementById("allProductsGrid");
  grid.innerHTML = "";

  if(list.length === 0){
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;opacity:0.6;">No products found</p>`;
    return;
  }

  list.forEach(p => {
    grid.insertAdjacentHTML("beforeend", `
      <div class="card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
        <h3>${escapeHtml(p.title)}</h3>
        <div class="price">₹${escapeHtml(p.price)}</div>
        <a href="${escapeHtml(p.link)}" target="_blank">Buy Now →</a>
      </div>
    `);
  });
}

/* Search */
document.getElementById("allSearchInput").addEventListener("input", (e)=>{
  const q = s(e.target.value);
  if(!q){ renderGrid(ALL_PRODUCTS); return; }

  const parts = q.split(/\s+/).filter(Boolean);

  const filtered = ALL_PRODUCTS.filter(p => {
    const hay = s(`${p.title} ${p.code} ${p.desc} ${p.category}`);
    return parts.every(t => hay.includes(t));
  });

  renderGrid(filtered);
});

/* Init */
loadAllProducts();
