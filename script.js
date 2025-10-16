/* =========================
   Data & State
   ========================= */
const PASSWORD = "8tsb077";

const initialProducts = [
  { id: 1, name: "Protein Bar", desc: "Packed with energy.", price: 2.99, stock: 12, status: "in", img: "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1200&auto=format&fit=crop", category: 'snacks' },
  { id: 2, name: "Trail Mix", desc: "Nuts, raisins & chocolate.", price: 3.49, stock: 10, status: "in", img: "https://images.unsplash.com/photo-1604908812243-8767a0a71df8?q=80&w=1200&auto=format&fit=crop", category: 'snacks' },
  { id: 3, name: "Bottled Water", desc: "Stay hydrated!", price: 1.50, stock: 20, status: "in", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1200&auto=format&fit=crop", category: 'drinks' },
  { id: 4, name: "Notebook", desc: "80 sheets college ruled.", price: 2.25, stock: 8, status: "in", img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop", category: 'school' },
  { id: 5, name: "Pencil Pack", desc: "HB #2 (10 pack)", price: 1.99, stock: 15, status: "in", img: "https://images.unsplash.com/photo-1473187983305-f615310e7daa?q=80&w=1200&auto=format&fit=crop", category: 'school' },
  { id: 6, name: "Hoodie", desc: "Cozy school hoodie.", price: 24.00, stock: 4, status: "in", img: "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop", category: 'apparel' }
];

// render product filters toolbar
function renderProductFilters(){
  const wrap = $('#productFilters');
  if (!wrap) return;
  const cats = ['all', ...Array.from(new Set(store.products.map(p=>p.category).filter(Boolean)))];
  // Render buttons; we'll insert a Chips button immediately after 'all'
  wrap.innerHTML = cats.map(c=> `<button data-cat="${c}" class="${c===store.ui.activeCategory? 'active':''}">${c[0].toUpperCase()+c.slice(1)}</button>`).join('');

  // Insert Chips button right after the All button (if not already present)
  if (!$('#productFilters button[data-cat="chips"]')){
    const allBtn = $('#productFilters button[data-cat="all"]');
    if (allBtn){
      const chipsBtn = document.createElement('button');
      chipsBtn.dataset.cat = 'chips';
      chipsBtn.className = (store.ui.activeCategory==='chips') ? 'active' : '';
      chipsBtn.textContent = 'Chips';
      allBtn.insertAdjacentElement('afterend', chipsBtn);
    }
  }
  $$('#productFilters button').forEach(btn=> btn.addEventListener('click', ()=>{
    const cat = btn.dataset.cat;
    store.ui.activeCategory = cat;
    renderProductFilters();
    renderProducts();
  }));
}

const store = {
  products: JSON.parse(localStorage.getItem("ss_products") || "null") || initialProducts,
  cart: JSON.parse(localStorage.getItem("ss_cart") || "[]"),
  ordersActive: JSON.parse(localStorage.getItem("ss_orders_active") || "[]"),
  ordersHistory: JSON.parse(localStorage.getItem("ss_orders_history") || "[]"),
  theme: localStorage.getItem("ss_theme") || "dark",
  ui: {
    // UI filter state: default to 'all' when not set
    activeCategory: 'all',
    productModalId: null,
    productQty: 1,
    ordersView: "active",     // 'active'|'history'
    adminTab: "orders",       // 'orders'|'inventory'|'analytics'
    invView: "table"          // 'table'|'promos'
  },
  promos: JSON.parse(localStorage.getItem("ss_promos") || "[]"),
  bundles: JSON.parse(localStorage.getItem("ss_bundles") || "[]"),
  // promo applied to cart (persisted)
  appliedPromo: JSON.parse(localStorage.getItem("ss_applied_promo") || "null")
};

// carousel slides persisted separately
store.carouselSlides = JSON.parse(localStorage.getItem('ss_carousel_slides') || 'null') || null;

function persistCarouselSlides(){
  localStorage.setItem('ss_carousel_slides', JSON.stringify(store.carouselSlides));
}

function persist(){
  localStorage.setItem("ss_products", JSON.stringify(store.products));
  localStorage.setItem("ss_cart", JSON.stringify(store.cart));
  localStorage.setItem("ss_orders_active", JSON.stringify(store.ordersActive));
  localStorage.setItem("ss_orders_history", JSON.stringify(store.ordersHistory));
  localStorage.setItem("ss_theme", store.theme);
  localStorage.setItem("ss_promos", JSON.stringify(store.promos));
  localStorage.setItem("ss_bundles", JSON.stringify(store.bundles));
  localStorage.setItem("ss_applied_promo", JSON.stringify(store.appliedPromo));
}

/* =========================
   Utilities
   ========================= */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
function money(n){ return `$${n.toFixed(2)}`; }
function showToast(msg="Order placed ✅"){
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1600);
}
function nowTs(){ return Date.now(); }
function daysBetween(a, b){ return Math.abs(a-b)/(1000*60*60*24); }

// session-only Admin unlock
const ADMIN_SESSION_KEY = "ss_admin_unlocked_session";
function isAdminUnlocked(){ return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"; }
function setAdminUnlocked(v){ sessionStorage.setItem(ADMIN_SESSION_KEY, v ? "true" : "false"); }

/* =========================
   Render: Products (+ Bundles as cards)
   ========================= */
function stockBadgeClass(p){
  if (p.status === "out" || p.stock <= 0) return "stock-badge out";
  if (p.stock <= 3) return "stock-badge low";
  return "stock-badge";
}
function productCard(p){
  const disabled = (p.status === "out" || p.stock <= 0) ? "disabled" : "";
  return `
    <div class="card" data-id="${p.id}">
      <span class="${stockBadgeClass(p)}">Stock: ${Math.max(0,p.stock)}</span>
      <img class="card-img" src="${p.img}" alt="${p.name}"/>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price-row">
        <span class="price">${money(p.price)}</span>
        <button class="add" ${disabled}>Add</button>
      </div>
    </div>
  `;
}
function bundleToCard(b){
  return `
    <div class="card" data-bundle="${b.name}">
      <span class="stock-badge">Bundle</span>
      <img class="card-img" src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop" alt="${b.name}"/>
      <h3>${b.name}</h3>
      <p>Includes: ${b.ids.join(", ")}</p>
      <div class="price-row">
        <span class="price">${money(b.price)}</span>
        <button class="add">Add</button>
      </div>
    </div>
  `;
}
function renderProducts(){
  const q = ($("#searchInput") && $("#searchInput").value) ? $("#searchInput").value.trim().toLowerCase() : "";
  const grid = $("#productGrid");
  if (!grid) return; // nothing to render into
  const productsHtml = store.products
    .filter(p => {
      if (store.ui.activeCategory && store.ui.activeCategory !== 'all'){
        return p.category === store.ui.activeCategory;
      }
      return true;
    })
    .filter(p => !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    .map(productCard).join("");
  const bundlesHtml = store.bundles
    .filter(b => !q || b.name.toLowerCase().includes(q))
    .map(bundleToCard).join("");

  grid.innerHTML = bundlesHtml + productsHtml;

  // ensure filters toolbar is present and correct
  renderProductFilters();

  // wiring: product cards
  $$(".card", grid).forEach(card=>{
    const id = Number(card.dataset.id);
    const bundleName = card.dataset.bundle;

    if (id){
      card.addEventListener("click", (e)=>{
        if (e.target.classList.contains("add")) return;
        openProductModal(id);
      });
      const addBtn = $(".add", card);
      if (addBtn){
        addBtn.addEventListener("click",(e)=>{
          e.stopPropagation();
          addToCart(id, 1, /*openCart*/ true);
        });
      }
    } else if (bundleName){
      const addBtn = $(".add", card);
      addBtn?.addEventListener("click", (e)=>{
        e.stopPropagation();
        // add each product id in the bundle once
        const bundle = store.bundles.find(b=>b.name===bundleName);
        if (!bundle) return;
        // bundle adds as a single line item at bundle price
        addBundleToCart(bundle);
      });
    }
  });
}

/* =========================
   Product Modal
   ========================= */
function openProductModal(id){
  const p = store.products.find(x=>x.id===id);
  if (!p) return;
  store.ui.productModalId = id;
  store.ui.productQty = 1;
  $("#pdImg").src = p.img;
  $("#pdName").textContent = p.name;
  $("#pdDesc").textContent = p.desc;
  $("#pdPrice").textContent = money(p.price);
  const badge = $("#pdStockBadge");
  badge.className = stockBadgeClass(p);
  badge.textContent = `Stock: ${Math.max(0,p.stock)}`;
  $("#pdQty").textContent = "1";
  openModal("productModal");

  $("#pdMinus").onclick = ()=>setPdQty(Math.max(1, store.ui.productQty-1));
  $("#pdPlus").onclick  = ()=>setPdQty(store.ui.productQty+1);
  $("#pdAdd").onclick   = ()=>{
    addToCart(id, store.ui.productQty, /*openCart*/ true);
    closeModal("productModal");
  };
  // defensive: in case handlers referenced before elements exist
  const pdMinus = $("#pdMinus"), pdPlus = $("#pdPlus"), pdAdd = $("#pdAdd");
  if (pdMinus) pdMinus.onclick = ()=>setPdQty(Math.max(1, store.ui.productQty-1));
  if (pdPlus) pdPlus.onclick = ()=>setPdQty(store.ui.productQty+1);
  if (pdAdd) pdAdd.onclick = ()=>{ addToCart(id, store.ui.productQty, true); closeModal("productModal"); };
}
function setPdQty(n){
  store.ui.productQty = n;
  $("#pdQty").textContent = String(n);
}

/* =========================
   Cart & Checkout
   ========================= */
function addBundleToCart(bundle){
  // bundle added as its own item
  store.cart.push({ id:`bundle:${bundle.name}`, name:`${bundle.name} (Bundle)`, price:bundle.price, img:"", qty:1 });
  persist();
  renderCartBadge();
  renderCart();
  openModal("cartModal");
}
function addToCart(id, qty=1, openCartAfter=false){
  const p = store.products.find(x=>x.id===id);
  if (!p || p.status==="out" || p.stock<=0) return;
  const addQty = Math.min(qty, p.stock);
  if (addQty <= 0) return;

  const line = store.cart.find(x=>x.id===id);
  if (line) line.qty += addQty;
  else store.cart.push({ id:p.id, name:p.name, price:p.price, img:p.img, qty:addQty });

  p.stock -= addQty;
  persist();
  renderProducts();
  renderCartBadge();
  renderCart();

  if (openCartAfter) openModal("cartModal");
}

function renderCart(){
  const box = $("#cartItems");
  if (!box){ console.warn('renderCart: #cartItems missing'); return; }
  if (!store.cart.length){
    box.innerHTML = `<div class="muted">Your cart is empty.</div>`;
    const ct = $("#cartTotal"); if (ct) ct.textContent = money(0);
    const pm = $("#promoMsg"); if (pm) pm.textContent = "";
    return;
  }
  box.innerHTML = store.cart.map((c, idx)=>`
    <div class="cart-row" data-idx="${idx}">
      <span>${c.name}</span>
      <span class="muted">x${c.qty}</span>
      <span>${money(c.price)}</span>
      <div class="qty-controls">
        <button class="btn qty-dec" title="Less">-</button>
        <div class="qty">${c.qty}</div>
        <button class="btn qty-inc" title="More">+</button>
      </div>
    </div>
  `).join("");

  const total = store.cart.reduce((s,i)=> s + (i.price||0)*i.qty, 0);
  // compute discount if promo applied
  let discount = 0;
  if (store.appliedPromo){
    const p = store.appliedPromo;
    if (p.type === "percent") discount = total * (p.value/100);
    else discount = p.value;
    discount = Math.min(discount, total);
  }
  const finalTotal = Math.max(0, total - discount);
  $("#cartTotal").textContent = money(finalTotal);

  // update subtotal & discount rows
  $("#cartSubtotal").textContent = money(total);
  $("#cartDiscount").textContent = money(discount);

  // show applied promo message
  if (store.appliedPromo){
    const pm = $("#promoMsg"); if (pm) pm.textContent = "";
    const pillText = $("#promoPillText"); if (pillText) pillText.textContent = `${store.appliedPromo.code} — ${store.appliedPromo.type==='percent'?store.appliedPromo.value+'%':money(store.appliedPromo.value)}`;
    const pill = $("#promoPill"); if (pill) pill.classList.remove('hidden');
    // wire clear promo button
    const clearBtn = $("#clearPromoBtn"); if (clearBtn) clearBtn.onclick = ()=>{ store.appliedPromo = null; persist(); renderCart(); showToast('Promo cleared'); if ($('#promoInput')) $('#promoInput').value = ""; };
    // change apply button to act as 'Clear' while promo applied
    const applyBtn = $("#applyPromoBtn"); if (applyBtn) applyBtn.textContent = "Clear";
  } else {
    const pm = $("#promoMsg"); if (pm) pm.textContent = "";
    const pill = $("#promoPill"); if (pill) pill.classList.add('hidden');
    const applyBtn = $("#applyPromoBtn"); if (applyBtn) applyBtn.textContent = "Apply";
  }

  $$(".cart-row").forEach(row=>{
    const idx = Number(row.dataset.idx);
    const dec = $(".qty-dec", row), inc = $(".qty-inc", row);
    if (dec) dec.onclick = ()=> changeCartQty(idx, -1);
    if (inc) inc.onclick = ()=> changeCartQty(idx, +1);
  });
}
function changeCartQty(index, delta){
  const line = store.cart[index];
  if (!line) return;
  if (line.id && String(line.id).startsWith("bundle:")){
    // bundles just inc/dec qty
    line.qty += (delta>0?1:-1);
    if (line.qty<=0) store.cart.splice(index,1);
  } else if (delta > 0){
    const p = store.products.find(x=>x.id===line.id);
    if (p && p.stock>0){ line.qty += 1; p.stock -= 1; }
  } else {
    line.qty -= 1;
    const p = store.products.find(x=>x.id===line.id);
    if (p) p.stock += 1;
    if (line.qty <= 0) store.cart.splice(index,1);
  }
  persist();
  renderProducts();
  renderCartBadge();
  renderCart();
}

function renderCartBadge(){
  const count = store.cart.reduce((s,i)=> s+i.qty, 0);
  const el = $("#cartCount");
  if (!el) return;
  el.textContent = String(count);
  if (count <= 0) el.classList.add('zero'); else el.classList.remove('zero');
}

/* promos in cart */
const applyPromoBtn = $("#applyPromoBtn");
if (applyPromoBtn) applyPromoBtn.onclick = ()=>{
  const code = $("#promoInput").value.trim();
  const msg = $("#promoMsg");
  msg.textContent = "";
  // if a promo is already applied, clicking the button clears it
  if (store.appliedPromo){ store.appliedPromo = null; persist(); renderCart(); $("#promoInput").value = ""; showToast('Promo cleared'); return; }

  if (!code){ msg.textContent = "Enter a code."; return; }
  if (!store.cart.length){ msg.textContent = "Your cart is empty."; return; }
  const p = store.promos.find(x=>x.code.toLowerCase()===code.toLowerCase());
  if (!p){ msg.textContent = "Invalid code."; return; }

  // apply promo to cart
  store.appliedPromo = { code: p.code, type: p.type, value: p.value };
  persist();
  renderCart();
  msg.textContent = `Applied ${p.type==="percent" ? p.value+"%": money(p.value)} off.`;
  // clear input to indicate applied
  $("#promoInput").value = "";
};

/* Checkout flow */
const checkoutBtn = $("#checkoutBtn"); if (checkoutBtn) checkoutBtn.onclick = ()=>{ closeModal("cartModal"); openModal("orderFormModal"); };
const placeOrderBtn = $("#placeOrderBtn");
if (placeOrderBtn) placeOrderBtn.onclick = ()=>{
  const name = $("#orderName").value.trim();
  const location = $("#orderLocation").value.trim();
  if (!name || !location) { showToast("Please fill out the form."); return; }
  if (!store.cart.length){ showToast("Your cart is empty."); return; }

  const items = store.cart.map(i=>({ ...i }));
  const subtotal = items.reduce((s,i)=> s + i.price*i.qty, 0);
  let discount = 0;
  if (store.appliedPromo){
    const p = store.appliedPromo;
    if (p.type === 'percent') discount = subtotal * (p.value/100);
    else discount = p.value;
    discount = Math.min(discount, subtotal);
  }
  const total = Math.max(0, subtotal - discount);
  const order = {
    id: "ord_" + Math.random().toString(36).slice(2,9),
    name, location,
    items, total,
    promo: store.appliedPromo || null,
    ts: nowTs()
  };

  store.ordersActive.unshift(order);
  store.cart = [];
  // clear applied promo after using
  store.appliedPromo = null;
  persist();

  renderCart();
  renderCartBadge();
  closeModal("orderFormModal");
  showToast("✅ Order placed");

  if (!$("#adminContent").classList.contains("hidden")){
    renderOrders();
    renderAnalytics();
  }
};

/* =========================
   Admin panels (tabs + dropdown)
   ========================= */
const panels = {
  orders: null,
  inventory: null,
  analytics: null
};

function showAdminPanel(name){
  store.ui.adminTab = name;
  panels.orders  ??= $("#admin-orders");
  panels.inventory ??= $("#admin-inventory");
  panels.analytics ??= $("#admin-analytics");

  Object.values(panels).forEach(p=> p && p.classList.add("hidden"));
  const target = panels[name];
  if (target) target.classList.remove("hidden");

  $$("#adminSubnav .tab").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.adminTab === name);
  });

  if (name === "orders") renderOrders();
  if (name === "inventory") {
    // keep dropdown visible; inner view below
    setInventoryView(store.ui.invView || "table");
    renderInventory();
  }
  if (name === "analytics") renderAnalytics();
}

function setInventoryView(view){
  store.ui.invView = view;
  const table  = $("#inventoryPanel");
  const promos = $("#promosPanel");
  if (table)  table.classList.toggle("hidden", view!=="table");
  if (promos) promos.classList.toggle("hidden", view!=="promos");
  $("#inventoryTabBtn").textContent = "Inventory";
}

function bindAdminSubtabs(){
  // avoid binding handlers multiple times (could be called each time settings open)
  if (window.adminSubtabsBound) return;
  const subnav = $("#adminSubnav");
  if (!subnav) return;

  subnav.addEventListener("click",(e)=>{
    const tabBtn = e.target.closest(".tab");
    if (!tabBtn) return;
    const tab = tabBtn.dataset.adminTab;
    if (!tab) return;
    // If the click was on the caret button (inside inventoryTabWrap), ignore here — caret has its own handler
    if (tabBtn.id === 'invSwitchBtn') return;
    // clicking the Inventory tab label should always show the inventory panel
    showAdminPanel(tab);
  });

  const caret = $("#invSwitchBtn");
  const menu  = $("#invSwitchMenu");
  const wrap  = $("#inventoryTabWrap");

  if (caret && menu && wrap){
    // Make clicking the caret toggle the dropdown menu only
    caret.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden', isOpen);
      caret.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) menu.querySelector('button')?.focus();
    });

    // Ensure clicking the Inventory tab label opens the inventory panel (but does not toggle the menu)
    const invTabBtn = $('#inventoryTabBtn');
    if (invTabBtn){
      invTabBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        showAdminPanel('inventory');
      });
    }

    // clicking outside closes the menu
    document.addEventListener("click",(e)=>{
      if (menu.classList.contains("hidden")) return;
      if (e.target.closest("#inventoryTabWrap")) return; // clicking inside wrap (including caret) does not close
      menu.classList.add("hidden");
      caret.setAttribute('aria-expanded','false');
    });

    // menu selection
    menu.addEventListener("click",(e)=>{
      const item = e.target.closest("button[data-invview]");
      if (!item) return;
      const view = item.dataset.invview;
      // special-case: photos opens a dedicated admin page
      if (view === 'photos'){
        // hide dropdown and open photos admin
        menu.classList.add('hidden');
        caret.setAttribute('aria-expanded','false');
        showAdminPhotos();
        return;
      }
      setInventoryView(view);
      menu.classList.add("hidden");
      caret.setAttribute('aria-expanded','false');
    });
  }
  // mark as bound after handlers are successfully attached
  window.adminSubtabsBound = true;
}

function showAdminPhotos(){
  // hide the admin subnav and show the photos panel as its own admin page
  const subnav = $("#adminSubnav");
  const photosPanel = $("#admin-photos");
  if (!photosPanel) return;
  // hide other admin panels
  panels.orders  ??= $("#admin-orders");
  panels.inventory ??= $("#admin-inventory");
  panels.analytics ??= $("#admin-analytics");
  Object.values(panels).forEach(p=> p && p.classList.add("hidden"));

  // hide subnav and show photos panel
  if (subnav) subnav.classList.add('hidden');
  photosPanel.classList.remove('hidden');

  // initialize photo controls
  initPhotosPanel();

  // wire back button
  const back = $("#photosBackBtn");
  if (back) back.onclick = ()=>{
    photosPanel.classList.add('hidden');
    if (subnav) subnav.classList.remove('hidden');
    // restore admin tab to orders
    showAdminPanel('orders');
  };
}

/* Photos panel: init and handlers */
function initPhotosPanel(){
  const sel = $("#photoProductSel");
  const csBtn = $("#photoSelectBtn");
  const csList = $("#photoSelectList");
  const fileInput = $("#photoFileInput");
  const preview = $("#photoPreview");
  const saveBtn = $("#savePhotoBtn");
  if (!sel || !fileInput || !preview || !saveBtn) return;

  // populate both native select (fallback) and custom list (if present)
  function populate(){
    sel.innerHTML = store.products.map(p=> {
      // preserve any special 'Happy photo' option color by marking it with a data attribute
      const isHappy = p.name && p.name.toLowerCase().includes('happy');
      return `<option value="${p.id}" ${isHappy? 'data-happy="true"':''}>${p.id} — ${p.name}</option>`;
    }).join("");
    if (csBtn && csList){
      csList.innerHTML = store.products.map(p=> `<li role="option" data-id="${p.id}" tabindex="0" style="color:#000; opacity:1">${p.id} — ${p.name}</li>`).join("");
      const first = store.products[0];
      const selId = sel.value || (first && String(first.id));
      // set csBtn label to current selection
      const current = store.products.find(x=> String(x.id) === selId) || first;
      if (current){ csBtn.textContent = `${current.id} — ${current.name}`; sel.value = String(current.id); preview.src = current.img || ''; }
      // mark the selected item in the custom list
      $$('#photoSelectList li').forEach(li=>{ if (li.dataset.id === String(sel.value)) li.setAttribute('aria-selected','true'); else li.removeAttribute('aria-selected'); });
    } else {
      const first = store.products[0];
      if (first){ sel.value = String(first.id); preview.src = first.img || ''; }
    }
  }
  populate();

  // detect whether browser honors option color styling; some browsers/OS ignore option styles
  function stylingHonored(){
    const tSel = document.createElement('select');
    const tOpt = document.createElement('option');
    tOpt.textContent = 'x';
    tOpt.style.color = 'rgb(10,200,10)'; // bright color
    tSel.appendChild(tOpt);
    document.body.appendChild(tSel);
    const cs = window.getComputedStyle(tOpt).color;
    document.body.removeChild(tSel);
    // if computed color matches our bright value, styling is honored
    return cs && cs.indexOf('rgb(10,200,10)') !== -1;
  }

  // show custom select only when styling is NOT honored
  const customWrap = $('#photoCustomSelect');
  if (customWrap){
    if (!stylingHonored()){
      customWrap.setAttribute('aria-hidden','false');
      customWrap.classList.remove('hidden');
      // hide native select visually but keep for accessibility
      sel.style.position = 'absolute'; sel.style.left = '-9999px'; sel.setAttribute('aria-hidden','true');
    } else {
      // keep custom hidden
      customWrap.setAttribute('aria-hidden','true');
      customWrap.classList.add('hidden');
    }
  }

  // if custom select exists, wire it
  if (csBtn && csList){
    function closeList(){ csList.classList.add('hidden'); csBtn.setAttribute('aria-expanded','false'); }
    function openList(){ csList.classList.remove('hidden'); csBtn.setAttribute('aria-expanded','true'); }
    csBtn.onclick = (e)=>{ e.stopPropagation(); if (csList.classList.contains('hidden')) openList(); else closeList(); };

    csList.addEventListener('click',(e)=>{
      const li = e.target.closest('li[data-id]');
      if (!li) return;
      const id = Number(li.dataset.id);
      const p = store.products.find(x=>x.id===id);
      if (!p) return;
      csBtn.textContent = `${p.id} — ${p.name}`;
      sel.value = String(p.id);
      preview.src = p.img || '';
      $$('li', csList).forEach(x=> x.removeAttribute('aria-selected'));
      li.setAttribute('aria-selected','true');
      closeList();
    });

    csList.addEventListener('keydown',(e)=>{
      const active = document.activeElement;
      if (e.key === 'ArrowDown') { e.preventDefault(); (active.nextElementSibling||csList.firstElementChild).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (active.previousElementSibling||csList.lastElementChild).focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); active.click(); }
      if (e.key === 'Escape') { closeList(); csBtn.focus(); }
    });

    document.addEventListener('click',(e)=>{ if (!e.target.closest('.custom-select')) closeList(); });
  }

  // native select change updates preview and keeps custom button label in sync
  sel.addEventListener('change', ()=>{
    const id = Number(sel.value);
    const p = store.products.find(x=>x.id===id);
    if (p){ preview.src = p.img || ''; if (csBtn) csBtn.textContent = `${p.id} — ${p.name}`; }
  });

  fileInput.addEventListener('change', ()=>{
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{ preview.src = ev.target.result; };
    reader.readAsDataURL(f);
  });

  saveBtn.addEventListener('click', ()=>{
    const id = Number(sel.value || (store.products[0] && store.products[0].id));
    const p = store.products.find(x=>x.id===id);
    if (!p) { showToast('Select a product'); return; }
    if (!preview.src) { showToast('No image selected'); return; }
    p.img = preview.src;
    persist();
    renderProducts();
    showToast('✅ Photo saved');
  });

  /* Carousel editor wiring */
  const csSel = $('#carouselSlideSel');
  const csFile = $('#carouselFileInput');
  const csCaption = $('#carouselCaptionInput');
  const csPreview = $('#carouselPreview');
  const csSave = $('#saveCarouselSlideBtn');

  // initialize default carouselSlides from DOM if not persisted
  if (!store.carouselSlides){
    const domSlides = $$('#slides .slide').map(s=>({ img: $('img', s)?.src || '', caption: $('.caption', s)?.textContent || '' }));
    store.carouselSlides = domSlides;
  }

  function populateCarouselEditor(){
    if (!csSel) return;
    csSel.innerHTML = store.carouselSlides.map((s,i)=> `<option value="${i}">Slide ${i+1}</option>`).join('');
    const firstIdx = 0;
    csSel.value = String(firstIdx);
    const current = store.carouselSlides[firstIdx];
    if (current){ csPreview.src = current.img || ''; csCaption.value = current.caption || ''; }
  }
  populateCarouselEditor();

  if (csFile){
    csFile.addEventListener('change', ()=>{
      const f = csFile.files && csFile.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{ csPreview.src = ev.target.result; };
      reader.readAsDataURL(f);
    });
  }

  if (csSel){
    csSel.addEventListener('change', ()=>{
      const idx = Number(csSel.value);
      const cur = store.carouselSlides[idx];
      if (cur){ csPreview.src = cur.img || ''; csCaption.value = cur.caption || ''; }
    });
  }

  if (csSave){
    csSave.addEventListener('click', ()=>{
      const idx = Number(csSel.value || 0);
      const cur = store.carouselSlides[idx] || { img: '', caption: '' };
      if (csPreview.src) cur.img = csPreview.src;
      cur.caption = csCaption.value || '';
      store.carouselSlides[idx] = cur;
      persistCarouselSlides();
      // re-render carousel DOM and restart
      setupCarousel();
      showToast('✅ Carousel slide saved');
    });
  }
}

// ensure photos panel init runs when admin unlocked and panels bound
const originalBind = bindAdminSubtabs;

/* Orders list */
let selectedOrderId = null;
function orderRow(o){
  const when = new Date(o.ts).toLocaleString();
  return `
    <div class="order" data-id="${o.id}">
      <div class="order-head"><strong>${o.name}</strong><span>${money(o.total)}</span></div>
      <div class="muted">${o.location} • ${when}</div>
    </div>
  `;
}
function renderOrders(){
  const list = $("#ordersList");
  if (!list){ console.warn('renderOrders: #ordersList missing'); return; }
  const data = store.ui.ordersView === "active" ? store.ordersActive : store.ordersHistory;
  if (!data.length){
    list.innerHTML = `<div class="muted">${store.ui.ordersView==='active'?'No active orders.':'No order history.'}</div>`;
  } else {
    list.innerHTML = data.map(orderRow).join("");
  }
  $$(".order", list).forEach(row=>{
    row.addEventListener("click", ()=>{
      selectedOrderId = row.dataset.id;
      openOrderDetail(selectedOrderId);
    });
  });
}
function openOrderDetail(id){
  const o = store.ordersActive.find(x=>x.id===id) || store.ordersHistory.find(x=>x.id===id);
  if (!o) return;
  const itemsHtml = o.items.map(i=>`<li>${i.name} × ${i.qty} — ${money(i.price*i.qty)}</li>`).join("");
  $("#orderDetailContent").innerHTML = `
    <p><strong>Name:</strong> ${o.name}</p>
    <p><strong>Location:</strong> ${o.location}</p>
    <p><strong>Total:</strong> ${money(o.total)}</p>
    <p><strong>When:</strong> ${new Date(o.ts).toLocaleString()}</p>
    <div><strong>Items:</strong><ul>${itemsHtml}</ul></div>
  `;
  $("#markCompletedBtn").style.display = store.ordersActive.some(x=>x.id===id) ? "inline-flex" : "none";
  openModal("orderDetailModal");
}
const markCompletedBtn = $("#markCompletedBtn"); if (markCompletedBtn) markCompletedBtn.onclick = ()=>{
  if (!selectedOrderId) return;
  const idx = store.ordersActive.findIndex(x=>x.id===selectedOrderId);
  if (idx>=0){
    const done = store.ordersActive.splice(idx,1)[0];
    store.ordersHistory.unshift(done);
    persist();
    renderOrders();
    renderAnalytics();
    closeModal("orderDetailModal");
    showToast("✅ Order completed");
  }
};

/* Inventory table */
function renderInventory(){
  const body = $("#invBody");
  if (!body){ console.warn('renderInventory: #invBody missing'); return; }
  body.innerHTML = store.products.map(p=>`
    <tr data-id="${p.id}">
      <td>
        <div class="inv-name">
          <button class="inv-name-save" data-name-save title="Save name" aria-label="Save item name">S</button>
          <input type="text" class="inv-name-input" value="${p.name}" aria-label="Item name"/>
        </div>
      </td>
      <td>
        <div class="inv-controls">
          <input type="number" class="inv-input" min="0" value="${p.stock}" aria-label="Stock for ${p.name}"/>
          <button class="btn" data-zero title="Set stock to zero">Zero</button>
          <button class="btn" data-save title="Save stock and status">Save</button>
        </div>
      </td>
      <td>
        <select class="inv-status">
          <option value="in" ${p.status==='in'?'selected':''}>In Stock</option>
          <option value="out" ${p.status==='out'?'selected':''}>Out of Stock</option>
        </select>
      </td>
      <td class="muted">ID: ${p.id}</td>
    </tr>
  `).join("");

  $$("#invBody tr").forEach(tr=>{
    const id = Number(tr.dataset.id);
    const nameInput = $(".inv-name-input", tr);
    const input = $(".inv-input", tr);
    const zeroBtn = $("[data-zero]", tr);
    const saveBtn = $("[data-save]", tr);
    const nameSaveBtn = $("[data-name-save]", tr);
    const statusSel = $(".inv-status", tr);

    if (zeroBtn) zeroBtn.onclick = ()=>{ input.value = 0; };
    if (nameSaveBtn) nameSaveBtn.onclick = ()=>{
      const p = store.products.find(x=>x.id===id);
      if (!p || !nameInput) return;
      const trimmed = nameInput.value.trim();
      if (!trimmed){
        nameInput.value = p.name;
        nameInput.focus();
        return;
      }
      p.name = trimmed;
      persist();
      renderProducts();
      renderInventory();
      showToast("💾 Name saved");
    };
    if (saveBtn) saveBtn.onclick = ()=>{
      const p = store.products.find(x=>x.id===id);
      if (!p) return;
      p.stock = Math.max(0, Number(input.value||0));
      p.status = statusSel.value;
      persist();
      renderProducts();
      renderInventory();
      showToast("💾 Inventory saved");
    };
  });

  // promos / bundles lists
  // render promos with delete
  if (store.promos.length){
    $("#promosList").innerHTML = store.promos.map((p,idx)=>`<div data-idx="${idx}">${p.code} – ${p.type} ${p.value} <button class="btn" data-delpromo data-idx="${idx}">Delete</button></div>`).join("");
    $$("[data-delpromo]").forEach(btn=> btn.addEventListener("click", (e)=>{
      const idx = Number(btn.dataset.idx);
      store.promos.splice(idx,1); persist(); renderInventory(); showToast('Promo deleted');
    }));
  } else { $("#promosList").textContent = "No promos yet."; }

  // render bundles with delete
  if (store.bundles.length){
    $("#bundlesList").innerHTML = store.bundles.map((b,idx)=>`<div data-idx="${idx}">${b.name} (ids: ${b.ids.join(",")}) <button class="btn" data-delbundle data-idx="${idx}">Delete</button></div>`).join("");
    $$("[data-delbundle]").forEach(btn=> btn.addEventListener("click", (e)=>{
      const idx = Number(btn.dataset.idx);
      // remove bundle and re-render products
      store.bundles.splice(idx,1); persist(); renderInventory(); renderProducts(); showToast('Bundle deleted');
    }));
  } else { $("#bundlesList").textContent = "No bundles yet."; }
}

/* Analytics */
function computeAnalytics(){
  const all = [...store.ordersActive, ...store.ordersHistory];
  const revenue = all.reduce((s,o)=> s+o.total, 0);
  const orders = all.length;
  const aov = orders ? (revenue / orders) : 0;

  const counts = new Map();
  all.forEach(o=>{
    o.items.forEach(i=>{
      counts.set(i.name, (counts.get(i.name)||0) + i.qty);
    });
  });
  const topArr = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]);
  const topName = topArr[0]?.[0] || "—";

  return { revenue, orders, aov, topArr, topName };
}
function renderAnalytics(){
  const { revenue, orders, aov, topArr, topName } = computeAnalytics();
  $("#kpiRevenue").textContent = money(revenue);
  $("#kpiOrders").textContent  = String(orders);
  $("#kpiAOV").textContent     = money(aov);
  $("#kpiTop").textContent     = topName;

  $("#topProductsList").innerHTML = topArr.slice(0,8).map(([name, qty])=> `<li>${name} — ${qty}</li>`).join("");
}

/* History auto-clear (>3 days) */
function autoClearHistory(){
  const now = nowTs();
  store.ordersHistory = store.ordersHistory.filter(o=> daysBetween(now, o.ts) <= 3.0 );
  persist();
}

/* =========================
   Carousel
   ========================= */
let slideIdx = 0, timer = null;
function setupCarousel(){
  // ensure DOM slides reflect store.carouselSlides if present
  const slidesWrap = $("#slides");
  if (store.carouselSlides && Array.isArray(store.carouselSlides)){
    slidesWrap.innerHTML = store.carouselSlides.map(s=> `\n      <div class="slide">\n        <img src="${s.img}" alt="${s.caption||''}"/>\n        <div class="caption">${s.caption||''}</div>\n      </div>`).join('') + '\n';
  }
  const slides = $$("#slides .slide");
  const dotsWrap = $("#dots");
  dotsWrap.innerHTML = slides.map((_,i)=> `<button class="dot ${i===0?'active':''}" data-i="${i}"></button>`).join("");

  function show(i){
    slideIdx = (i + slides.length) % slides.length;
    slides.forEach((s,idx)=> s.classList.toggle("active", idx===slideIdx));
    $$("#dots .dot").forEach((d,idx)=> d.classList.toggle("active", idx===slideIdx));
  }
  function next(){ show(slideIdx+1); }
  function prev(){ show(slideIdx-1); }

  $("#nextSlide").onclick = ()=>{ next(); restart(); };
  $("#prevSlide").onclick = ()=>{ prev(); restart(); };
  $("#dots").onclick = (e)=>{
    const dot = e.target.closest(".dot");
    if (!dot) return;
    show(Number(dot.dataset.i)); restart();
  };

  function restart(){
    if (timer) clearInterval(timer);
    timer = setInterval(next, 6000);
  }
  restart();
}

/* =========================
   Modals & Misc UI
   ========================= */
function openModal(id){ const el = document.getElementById(id); if (el) el.setAttribute("aria-hidden","false"); }
function closeModal(id){ const el = document.getElementById(id); if (el) el.setAttribute("aria-hidden","true"); }
document.body.addEventListener("click",(e)=>{
  const closer = e.target.closest("[data-close]");
  if (closer){ closeModal(closer.dataset.close); }
});

const cartBtnEl = $("#cartBtn");
if (cartBtnEl) cartBtnEl.onclick = ()=> openModal("cartModal");
const settingsBtnEl = $("#settingsBtn");
if (settingsBtnEl) settingsBtnEl.onclick = ()=>{
  openModal("settingsModal");

  // theme buttons reflect
  // refresh theme toggle label
  updateThemeToggleLabel();

  // Admin lock per session
  // Always require the password when opening settings: clear any previous session unlock
  setAdminUnlocked(false);
  const lockedPane = $("#adminLocked");
  const contentPane = $("#adminContent");
  lockedPane?.classList.remove("hidden");
  contentPane?.classList.add("hidden");
};

const unlockAdminBtn = $("#unlockAdminBtn");
if (unlockAdminBtn) unlockAdminBtn.onclick = ()=>{
  const passEl = $("#adminPass");
  const pass = passEl ? passEl.value.trim() : "";
  // compare case-insensitively so users can enter upper/lower
  if (pass.toLowerCase() === (PASSWORD || "").toLowerCase()){
    setAdminUnlocked(true);
    $("#adminLocked")?.classList.add("hidden");
    $("#adminContent")?.classList.remove("hidden");
    bindAdminSubtabs();
    showAdminPanel("orders");
    renderOrders(); renderInventory(); renderAnalytics();
    // initialize photos panel handlers
    initPhotosPanel();
    showToast("🔓 Admin unlocked");
  } else {
    showToast("❌ Wrong password");
  }
};

/* Orders view dropdown */
const ordersDropdownBtn = $("#ordersDropdownBtn");
const ordersDropdownMenu = $("#ordersDropdownMenu");
if (ordersDropdownBtn && ordersDropdownMenu){
  ordersDropdownBtn.onclick = ()=> ordersDropdownMenu.classList.toggle("hidden");
  ordersDropdownMenu.addEventListener("click",(e)=>{
    const item = e.target.closest("button[data-orders-view]");
    if (!item) return;
    store.ui.ordersView = item.dataset.ordersView;
    ordersDropdownBtn.textContent = (store.ui.ordersView === "active") ? "Active Orders ▾" : "Order History ▾";
    ordersDropdownMenu.classList.add("hidden");
    renderOrders();
  });
}

/* Clear history buttons */
const clearOldHistoryBtn = $("#clearOldHistoryBtn"); if (clearOldHistoryBtn) clearOldHistoryBtn.onclick = ()=>{ autoClearHistory(); renderOrders(); renderAnalytics(); showToast("🧹 Cleared history older than 3 days"); };
const manualClearHistoryBtn = $("#manualClearHistoryBtn"); if (manualClearHistoryBtn) manualClearHistoryBtn.onclick = ()=>{ store.ordersHistory = []; persist(); renderOrders(); renderAnalytics(); showToast("🗑️ History cleared"); };

/* Theme toggles */
// Theme toggle button (replaces subtabs)
const themeToggleBtn = $("#themeToggleBtn");
function updateThemeToggleLabel(){
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = store.theme === 'dark' ? 'Dark Mode (click to switch to Light)' : 'Light Mode (click to switch to Dark)';
}
if (themeToggleBtn){
  themeToggleBtn.addEventListener('click', ()=>{
    const newTheme = store.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateThemeToggleLabel();
  });
}
function applyTheme(){ document.documentElement.setAttribute("data-theme", store.theme); }
function setTheme(theme){ store.theme = theme; persist(); applyTheme(); }

/* Search */
const searchBtn = $("#searchBtn"); if (searchBtn) searchBtn.onclick = renderProducts;
const searchInput = $("#searchInput"); if (searchInput) searchInput.addEventListener("input", renderProducts);

/* Year in footer */
$("#year").textContent = new Date().getFullYear();

/* =========================
   Promos / Bundles creators
   ========================= */
const addPromoBtn = $("#addPromoBtn"); if (addPromoBtn) addPromoBtn.addEventListener("click", ()=>{
  const code = $("#promoCodeInput").value.trim();
  const type = $("#promoTypeSel").value;
  const value = Number($("#promoValueInput").value);
  if (!code || !value || (type!=="percent" && type!=="amount")){ showToast("Enter valid promo."); return; }
  const existing = store.promos.find(p=>p.code.toLowerCase()===code.toLowerCase());
  if (existing){ existing.type=type; existing.value=value; }
  else store.promos.push({ code, type, value });
  persist(); renderInventory(); showToast("✅ Promo saved");
});

const addBundleBtn = $("#addBundleBtn"); if (addBundleBtn) addBundleBtn.addEventListener("click", ()=>{
  const name = $("#bundleNameInput").value.trim();
  const ids = $("#bundleIdsInput").value.split(",").map(s=>Number(s.trim())).filter(Boolean);
  const price = Number($("#bundlePriceInput").value);
  if (!name || !ids.length || !price){ showToast("Enter valid bundle."); return; }
  const exists = store.bundles.find(b=>b.name.toLowerCase()===name.toLowerCase());
  if (exists){ exists.ids = ids; exists.price = price; }
  else store.bundles.push({ name, ids, price });
  persist(); renderProducts(); renderInventory(); showToast("✅ Bundle saved");
});

/* =========================
   Mobile header auto hide
   ========================= */
function initHeaderAutoHide(){
  const header = document.querySelector(".app-header");
  if (!header) return;
  const media = window.matchMedia("(max-width: 720px)");
  const getScrollY = ()=> window.scrollY ?? document.documentElement.scrollTop ?? 0;
  let lastScrollY = getScrollY();
  let ticking = false;
  let mobileApplied = false;

  const enableMobileMode = ()=>{
    if (mobileApplied) return;
    mobileApplied = true;
    header.classList.add("mobile-autohide");
    const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || 0, 10) || 0;
    document.body.style.paddingTop = `${header.offsetHeight + safeTop}px`;
  };
  const disableMobileMode = ()=>{
    if (!mobileApplied) return;
    mobileApplied = false;
    header.classList.remove("mobile-autohide");
    header.classList.remove("hide");
    document.body.style.paddingTop = "";
  };

  const update = ()=>{
    ticking = false;
    if (!media.matches){
      disableMobileMode();
      lastScrollY = getScrollY();
      return;
    }
    enableMobileMode();
    const current = getScrollY();
    const delta = current - lastScrollY;
    const threshold = 2;
    if (current <= 0){
      header.classList.remove("hide");
    } else if (delta > threshold && current > 40){
      header.classList.add("hide");
    } else if (delta < -threshold){
      header.classList.remove("hide");
    }
    lastScrollY = current;
  };

  const onScroll = ()=>{
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  const onChange = ()=>{
    disableMobileMode();
    lastScrollY = getScrollY();
    update();
  };
  if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
  else if (typeof media.addListener === "function") media.addListener(onChange);

  update();
}

/* =========================
   Tabs (General/Admin)
   ========================= */
$("#settingsTabs").addEventListener("click",(e)=>{
  const btn = e.target.closest(".tab");
  if (!btn) return;
  $$("#settingsTabs .tab").forEach(t=>t.classList.remove("active"));
  btn.classList.add("active");
  const tab = btn.dataset.tab;
  $("#tab-general").classList.toggle("hidden", tab!=="general");
  $("#tab-admin").classList.toggle("hidden", tab!=="admin");
});

/* Modals util (defined above) */
/* =========================
   Init
   ========================= */
(function init(){
  applyTheme();
  renderProducts();
  renderCart();
  renderCartBadge();
  setupCarousel();
  autoClearHistory();
  initHeaderAutoHide();
  // run quick smoke tests after a short delay so the DOM stabilizes
  setTimeout(()=>{
    try { smokeTest(); } catch(e){ console.error('smokeTest failed', e); }
  }, 350);
})();

/* =========================
   Smoke tests (basic layout / behavior checks)
   These are lightweight checks to detect missing DOM pieces or major layout regressions.
   They log results to console and show a small toast if something is amiss.
   Not a replacement for full unit/E2E tests.
   ========================= */
function smokeTest(){
  const issues = [];
  // carousel: expect slides and dots
  const slides = $$('#slides .slide');
  const dots = $$('#dots .dot');
  if (!slides || slides.length === 0) issues.push('Carousel slides missing');
  if (!dots || dots.length === 0) issues.push('Carousel dots missing');

  // products: grid should exist and have at least one card
  const grid = $('#productGrid');
  if (!grid) issues.push('Product grid (#productGrid) missing');
  else {
    const cards = $('.card', grid) ? $$('.card', grid) : [];
    if (!cards || cards.length === 0) issues.push('No product cards rendered');
  }

  // cart button and count
  if (!$('#cartBtn')) issues.push('Cart button #cartBtn missing');
  if (!$('#cartCount')) issues.push('Cart count #cartCount missing');

  if (issues.length){
    console.warn('SmokeTest found issues:', issues);
    showToast('Layout checks: ' + issues.slice(0,2).join('; '));
  } else {
    console.log('SmokeTest OK — core layout elements present');
  }
  return issues;
}

/* === MOBILE DIAGNOSTIC + FIX (<=599px) === */
(function initMobileLayoutFix(){
  const isPhone = () => Math.min(window.innerWidth, window.innerHeight) <= 599;
  function overflowCulprit(){
    // Find first element wider than viewport
    const vw = document.documentElement.clientWidth;
    let culprit = null;
    document.querySelectorAll('body *').forEach(el=>{
      const r = el.getBoundingClientRect();
      if (!culprit && r.width > vw + 1) culprit = el;
    });
    return culprit;
  }
  function ensureFilterUnderCarousel(){
    const filter = document.querySelector('.category-filter');
    const carousel = document.querySelector('.carousel');
    if (isPhone() && filter && carousel){
      // If filter is not immediately after carousel, move it there (phones only)
      const next = carousel.nextElementSibling;
      if (next !== filter) {
        carousel.insertAdjacentElement('afterend', filter);
      }
    }
  }
  function killHorizontalScroll(){
    // Guard against 100vw + padding and oversized children
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.querySelectorAll('img,video,canvas').forEach(el=>{
      el.style.maxWidth = '100%';
      el.style.height = 'auto';
      el.style.display = 'block';
    });
    document.querySelectorAll('.product-list, .products, .grid, .product-card, .card, .carousel, .category-filter, main, section, .container')
      .forEach(el=>{
        el.style.maxWidth = '100%';
        el.style.overflowX = 'hidden';
      });
    // If some element is still wider, shrink it
    const culprit = overflowCulprit();
    if (culprit){
      culprit.style.maxWidth = '100%';
      culprit.style.width = '100%';
    }
  }
  function makeTwoColGrid(){
    const grids = document.querySelectorAll('.product-list, .products, .grid');
    grids.forEach(g=>{
      g.style.display = 'grid';
      g.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      g.style.gap = '10px';
      g.style.margin = '0';
      g.style.padding = '0';
    });
    document.querySelectorAll('.product-list > *, .products > *, .grid > *').forEach(ch=>{
      ch.style.minWidth = '0';
    });
    document.querySelectorAll('.product-list .card, .products .card, .grid .card, .product-card').forEach(card=>{
      card.style.width = '100%';
      card.style.maxWidth = 'none';
      card.style.margin = '0';
      card.style.boxSizing = 'border-box';
      card.style.overflow = 'hidden';
    });
  }
  function addDebugBadge(){
    if (!isPhone()) return;
    if (document.getElementById('mobile-debug-badge')) return;
    const b = document.createElement('div');
    b.id = 'mobile-debug-badge';
    b.style.cssText = 'position:fixed;z-index:9999;right:8px;bottom:8px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.5);color:#fff;font:600 12px/1.2 system-ui';
    const filter = !!document.querySelector('.carousel + .category-filter');
    b.textContent = `w:${window.innerWidth}px | filterUnderCarousel:${filter}`;
    document.body.appendChild(b);
    window.addEventListener('resize', ()=>{ b.textContent = `w:${window.innerWidth}px | filterUnderCarousel:${!!document.querySelector('.carousel + .category-filter')}`; });
  }

  function run(){
    if (!isPhone()) return;
    ensureFilterUnderCarousel(); // place filter just under carousel (phones only)
    killHorizontalScroll();      // stop side-scroll
    makeTwoColGrid();            // enforce true 2-col layout
    addDebugBadge();             // tiny on-screen status (remove later)
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  } else {
    run();
  }
  window.addEventListener('resize', ()=>{ if (isPhone()) run(); }, {passive:true});
})();

/* === MOBILE FIX v2 (handles nested containers) === */
(function fixMobileFilterLayout(){
  const isPhone = () => Math.min(window.innerWidth, window.innerHeight) <= 599;

  function placeFilterBelowCarousel(){
    const carousel = document.querySelector('.carousel');
    const filter = document.querySelector('.category-filter');
    if (!carousel || !filter) return;

    const carouselWrapper = carousel.closest('.banner, .carousel-container, main, section') || carousel.parentElement;
    if (carouselWrapper && isPhone()){
      carouselWrapper.insertAdjacentElement('afterend', filter);
    }
  }

  function enforceGrid(){
    document.querySelectorAll('.product-list, .products, .grid').forEach(g=>{
      g.style.display = 'grid';
      g.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      g.style.gap = '10px';
      g.style.margin = '0';
      g.style.padding = '0';
      g.style.justifyContent = 'center';
      g.style.alignItems = 'stretch';
      g.style.maxWidth = '100%';
      g.style.overflowX = 'hidden';
    });
    document.querySelectorAll('.product-list > *, .products > *, .grid > *').forEach(el=>{
      el.style.minWidth = '0';
    });
    document.querySelectorAll('.product-card, .card').forEach(el=>{
      el.style.width = '100%';
      el.style.maxWidth = 'none';
      el.style.margin = '0';
      el.style.boxSizing = 'border-box';
    });
  }

  function killHorizontalScroll(){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
  }

  function run(){
    if (!isPhone()) return;
    placeFilterBelowCarousel();
    enforceGrid();
    killHorizontalScroll();
    console.log('[MobileFix] filter relocated below carousel');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  } else run();
  window.addEventListener('resize', ()=>{ if (isPhone()) run(); }, {passive:true});
})();

/* ====== MOBILE LAYOUT FIX (robust, DOM-agnostic) ====== */
(function mobileLayoutFix(){
  const isPhone = () => Math.min(window.innerWidth, window.innerHeight) <= 599;

  // 1) Find key nodes safely (works even if classes differ slightly)
  function getNodes(){
    const carouselWrap = document.querySelector('section.carousel-wrap') || document.querySelector('.carousel-wrap') || document.querySelector('.banner, .hero');
    const filter = document.querySelector('.category-filter') || document.querySelector('[data-role=\"category-filter\"]');
    // common grid wrappers used in your project
    const grid = document.querySelector('.product-list, .products, .grid, .product-grid, #productsGrid');
    return {carouselWrap, filter, grid};
  }

  // 2) Kill sideways scroll and clamp over-wide children
  function stopSideScroll(){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    // media fit
    document.querySelectorAll('img,video,canvas').forEach(el=>{
      el.style.maxWidth = '100%';
      el.style.height = 'auto';
      el.style.display = 'block';
    });
    // any element wider than viewport => clamp
    const vw = document.documentElement.clientWidth;
    let culprit = null;
    document.querySelectorAll('body *').forEach(el=>{
      const r = el.getBoundingClientRect();
      if (!culprit && r.width > vw + 1) culprit = el;
    });
    if (culprit){
      culprit.style.maxWidth = '100%';
      culprit.style.width = '100%';
      culprit.style.overflowX = 'hidden';
      culprit.setAttribute('data-mobile-overflow-fixed','1');
    }
  }

  // 3) Place filter **directly after** the carousel section on phones
  function placeFilterBelowCarousel(carouselWrap, filter){
    if (!carouselWrap || !filter) return;
    const after = carouselWrap.nextElementSibling;
    if (after !== filter){
      carouselWrap.insertAdjacentElement('afterend', filter);
    }
  }

  // 4) Enforce a **true 2-column grid** on phones only
  function enforceTwoCol(grid){
    if (!grid) return;
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    grid.style.gap = '10px';
    grid.style.margin = '0';
    grid.style.padding = '0';
    grid.style.maxWidth = '100%';
    grid.style.justifyContent = 'center';
    grid.style.alignItems = 'stretch';
    grid.style.overflowX = 'hidden';
    grid.setAttribute('data-mobile-grid','2col');

    // children must be allowed to shrink
    grid.querySelectorAll(':scope > *').forEach(ch => ch.style.minWidth = '0');
    grid.querySelectorAll('.product-card, .card').forEach(card=>{
      card.style.width = '100%';
      card.style.maxWidth = 'none';
      card.style.margin = '0';
      card.style.boxSizing = 'border-box';
      card.style.overflow = 'hidden';
    });
  }

  // 5) Shorten carousel on phones so products appear immediately
  function capCarouselHeight(){
    const c = document.querySelector('.carousel');
    if (!c) return;
    c.style.width = '100%';
    c.style.height = '160px';
    c.style.maxHeight = '160px';
    c.style.overflow = 'hidden';
    const media = c.querySelector('img,video');
    if (media){
      media.style.width = '100%';
      media.style.height = '100%';
      media.style.objectFit = 'cover';
      media.style.display = 'block';
    }
  }

  // 6) Small status badge so we can confirm (will remove after)
  function showBadge(ok){
    let b = document.getElementById('mobile-debug-badge');
    if (!b){
      b = document.createElement('div');
      b.id = 'mobile-debug-badge';
      b.style.cssText = 'position:fixed;z-index:9999;right:8px;bottom:8px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.5);color:#fff;font:600 12px/1.2 system-ui';
      document.body.appendChild(b);
    }
    b.textContent = `w:${window.innerWidth}px | filterUnderCarousel:${ok}`;
  }

  function run(){
    if (!isPhone()) return;
    const {carouselWrap, filter, grid} = getNodes();
    stopSideScroll();
    placeFilterBelowCarousel(carouselWrap, filter);
    enforceTwoCol(grid);
    capCarouselHeight();
    const ok = !!(carouselWrap && filter && carouselWrap.nextElementSibling === filter);
    showBadge(ok);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  } else run();
  window.addEventListener('resize', ()=>{ if (isPhone()) run(); }, {passive:true});
})();
