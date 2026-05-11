
const WHATSAPP_NUMBER = "254786781665";
const STORAGE_KEY = "fr_cart";

function $(s,r=document){return r.querySelector(s)}
function $$(s,r=document){return [...r.querySelectorAll(s)]}
function fmt(n){return "$"+Number(n).toFixed(2)}
function qs(name){return new URLSearchParams(location.search).get(name)}

let PRODUCTS = [];
async function loadProducts(){
  if(PRODUCTS.length) return PRODUCTS;
  const r = await fetch('products.json');
  PRODUCTS = await r.json();
  return PRODUCTS;
}

function getCart(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return []} }
function setCart(c){ localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); updateCartCount() }
function updateCartCount(){
  const c = getCart().reduce((s,i)=>s+i.qty,0);
  $$('.cart-count').forEach(el=>el.textContent=c);
}
function addToCart(id, qty=1){
  const c = getCart();
  const e = c.find(i=>i.id===id);
  if(e) e.qty += qty; else c.push({id, qty});
  setCart(c);
  toast("Added to cart");
}
function removeFromCart(id){ setCart(getCart().filter(i=>i.id!==id)) }
function updateQty(id, qty){
  const c = getCart();
  const e = c.find(i=>i.id===id);
  if(e){ e.qty = Math.max(1, qty); setCart(c); }
}
function toast(msg){
  const t=document.createElement('div');
  t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}

function stars(r){
  const f=Math.round(r); return "★".repeat(f)+"☆".repeat(5-f);
}

function cardHTML(p){
  return `<div class="card">
    <a class="card-img" href="product.html?id=${p.id}"><img src="${p.image}" loading="lazy" alt="${p.name}"></a>
    <div class="card-body">
      <span class="brand">${p.brand}</span>
      <h3 class="pname"><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <div class="meta">${p.category} · ${p.size_ml}ml · ${p.gender}</div>
      <div class="stars">${stars(p.rating)} <span class="meta">(${p.reviews})</span></div>
      <div class="price">${fmt(p.price)}<span class="old-price">${fmt(p.old_price)}</span></div>
      <div class="card-actions">
        <button class="btn btn-outline" onclick="addToCart(${p.id})">Add to Cart</button>
        <button class="btn btn-primary" onclick="buyNow(${p.id})">Buy Now</button>
      </div>
    </div></div>`;
}

function buyNow(id){ addToCart(id,1); location.href='checkout.html'; }

// THEME
function initTheme(){
  const t = localStorage.getItem('theme')||'dark';
  document.documentElement.setAttribute('data-theme', t);
}
function toggleTheme(){
  const t = document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

// LISTING with filter+sort+paginate
const PAGE_SIZE = 24;
let listState = { page:1, brand:'', gender:'', family:'', sort:'pop', q:'' };

function renderList(){
  const grid = $('#grid'); if(!grid) return;
  let list = PRODUCTS.slice();
  if(listState.q){ const q=listState.q.toLowerCase(); list=list.filter(p=>(p.name+" "+p.brand).toLowerCase().includes(q)); }
  if(listState.brand) list=list.filter(p=>p.brand===listState.brand);
  if(listState.gender) list=list.filter(p=>p.gender===listState.gender);
  if(listState.family) list=list.filter(p=>p.family===listState.family);
  if(listState.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(listState.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(listState.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  else if(listState.sort==='new') list.sort((a,b)=>b.year-a.year);
  else list.sort((a,b)=>b.reviews-a.reviews);

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total/PAGE_SIZE));
  if(listState.page>pages) listState.page=1;
  const start = (listState.page-1)*PAGE_SIZE;
  const slice = list.slice(start, start+PAGE_SIZE);

  $('#count').textContent = `${total} fragrances`;
  grid.innerHTML = slice.length ? slice.map(cardHTML).join('') : `<div class="empty">No fragrances match your filters.</div>`;

  const pager = $('#pager'); pager.innerHTML='';
  const mk=(n,lbl=n,dis=false)=>{const b=document.createElement('button');b.textContent=lbl;if(n===listState.page)b.classList.add('active');if(dis)b.disabled=true;b.onclick=()=>{listState.page=n;renderList();window.scrollTo({top:0,behavior:'smooth'})};return b};
  pager.appendChild(mk(Math.max(1,listState.page-1),'‹',listState.page===1));
  const win=2; for(let i=1;i<=pages;i++){if(i===1||i===pages||(i>=listState.page-win&&i<=listState.page+win))pager.appendChild(mk(i));else if(i===listState.page-win-1||i===listState.page+win+1){const s=document.createElement('span');s.textContent='…';s.style.padding='8px';pager.appendChild(s)}}
  pager.appendChild(mk(Math.min(pages,listState.page+1),'›',listState.page===pages));
}

async function initListing(){
  await loadProducts();
  const brands=[...new Set(PRODUCTS.map(p=>p.brand))].sort();
  const families=[...new Set(PRODUCTS.map(p=>p.family))].sort();
  const bs=$('#fBrand'); brands.forEach(b=>bs.insertAdjacentHTML('beforeend',`<option>${b}</option>`));
  const fs=$('#fFamily'); families.forEach(b=>fs.insertAdjacentHTML('beforeend',`<option>${b}</option>`));
  $('#fBrand').onchange=e=>{listState.brand=e.target.value;listState.page=1;renderList()};
  $('#fGender').onchange=e=>{listState.gender=e.target.value;listState.page=1;renderList()};
  $('#fFamily').onchange=e=>{listState.family=e.target.value;listState.page=1;renderList()};
  $('#fSort').onchange=e=>{listState.sort=e.target.value;renderList()};
  $('#fSearch').oninput=e=>{listState.q=e.target.value;listState.page=1;renderList()};
  const initialQ = qs('q'); if(initialQ){ $('#fSearch').value=initialQ; listState.q=initialQ; }
  const initialB = qs('brand'); if(initialB){ $('#fBrand').value=initialB; listState.brand=initialB; }
  renderList();
}

async function initHome(){
  await loadProducts();
  const featured = [...PRODUCTS].sort((a,b)=>b.rating-a.rating).slice(0,8);
  const newest = [...PRODUCTS].sort((a,b)=>b.year-a.year).slice(0,8);
  const trending = [...PRODUCTS].sort((a,b)=>b.reviews-a.reviews).slice(0,8);
  $('#featured').innerHTML = featured.map(cardHTML).join('');
  $('#newest').innerHTML = newest.map(cardHTML).join('');
  $('#trending').innerHTML = trending.map(cardHTML).join('');
  const brands=[...new Set(PRODUCTS.map(p=>p.brand))].sort().slice(0,18);
  $('#brands').innerHTML = brands.map(b=>`<a class="brand-chip" href="shop.html?brand=${encodeURIComponent(b)}">${b}</a>`).join('');
}

async function initProduct(){
  await loadProducts();
  const id = +qs('id');
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p){ $('#pdetail').innerHTML='<p class="empty">Product not found.</p>'; return; }
  document.title = `${p.brand} ${p.name} — Fragrance`;
  $('#pdetail').innerHTML = `
    <div class="product-img"><img src="${p.image}" alt="${p.name}"></div>
    <div class="product-info">
      <span class="brand">${p.brand}</span>
      <h1>${p.name}</h1>
      <div class="stars">${stars(p.rating)} <span class="meta">${p.rating} · ${p.reviews} reviews</span></div>
      <p class="meta">${p.category} · ${p.size_ml}ml · ${p.gender} · ${p.family} · ${p.year}</p>
      <div class="price" style="font-size:28px;margin:12px 0">${fmt(p.price)} <span class="old-price">${fmt(p.old_price)}</span></div>
      <p>${p.description}</p>
      <div class="notes-block">
        <h4>Top Notes</h4>${p.notes.top.map(n=>`<span class="note-pill">${n}</span>`).join('')}
        <h4 style="margin-top:14px">Heart Notes</h4>${p.notes.heart.map(n=>`<span class="note-pill">${n}</span>`).join('')}
        <h4 style="margin-top:14px">Base Notes</h4>${p.notes.base.map(n=>`<span class="note-pill">${n}</span>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;align-items:center;flex-wrap:wrap">
        <div class="qty">
          <button onclick="document.getElementById('qty').value=Math.max(1,+document.getElementById('qty').value-1)">−</button>
          <input id="qty" type="number" value="1" min="1">
          <button onclick="document.getElementById('qty').value=+document.getElementById('qty').value+1">+</button>
        </div>
        <button class="btn btn-outline" onclick="addToCart(${p.id},+document.getElementById('qty').value)">Add to Cart</button>
        <button class="btn btn-primary" onclick="addToCart(${p.id},+document.getElementById('qty').value);location.href='checkout.html'">Buy Now</button>
      </div>
      <p class="meta" style="margin-top:14px">In stock: ${p.stock} · Free shipping over $100 · 30-day returns</p>
    </div>`;
  const similar = PRODUCTS.filter(x=>x.family===p.family && x.id!==p.id).slice(0,8);
  $('#similar').innerHTML = similar.map(cardHTML).join('');
}

async function initCart(){
  await loadProducts();
  const c = getCart();
  const box = $('#cart-box');
  if(!c.length){ box.innerHTML='<div class="empty">Your cart is empty. <a href="shop.html" style="color:var(--accent)">Continue shopping</a></div>'; return; }
  const rows = c.map(i=>{
    const p = PRODUCTS.find(x=>x.id===i.id); if(!p) return '';
    return `<tr>
      <td><img src="${p.image}"></td>
      <td><strong>${p.brand}</strong><br>${p.name}<br><small class="meta">${p.size_ml}ml</small></td>
      <td>${fmt(p.price)}</td>
      <td><div class="qty"><button onclick="updateQty(${p.id},${i.qty-1});initCart()">−</button><input value="${i.qty}" readonly><button onclick="updateQty(${p.id},${i.qty+1});initCart()">+</button></div></td>
      <td>${fmt(p.price*i.qty)}</td>
      <td><button class="icon-btn" onclick="removeFromCart(${p.id});initCart()">✕</button></td>
    </tr>`;
  }).join('');
  const sub = c.reduce((s,i)=>{const p=PRODUCTS.find(x=>x.id===i.id);return s+(p?p.price*i.qty:0)},0);
  const ship = sub>100?0:9.99; const tax=sub*0.08; const tot=sub+ship+tax;
  box.innerHTML = `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:30px" class="cart-layout">
    <table class="cart-table"><thead><tr><th></th><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="summary">
      <h3 style="margin-top:0">Order Summary</h3>
      <div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      <div class="row"><span>Shipping</span><span>${ship?fmt(ship):'Free'}</span></div>
      <div class="row"><span>Tax (8%)</span><span>${fmt(tax)}</span></div>
      <div class="row total"><span>Total</span><span>${fmt(tot)}</span></div>
      <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:14px;text-align:center">Proceed to Checkout</a>
    </div></div>`;
}

async function initCheckout(){
  await loadProducts();
  const c = getCart();
  if(!c.length){ $('#checkout-root').innerHTML='<div class="empty">Your cart is empty.</div>'; return; }
  const items = c.map(i=>{const p=PRODUCTS.find(x=>x.id===i.id);return{p,qty:i.qty}}).filter(x=>x.p);
  const sub = items.reduce((s,x)=>s+x.p.price*x.qty,0);
  const ship = sub>100?0:9.99; const tax=sub*0.08; const tot=sub+ship+tax;
  $('#summary-items').innerHTML = items.map(x=>`
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <img src="${x.p.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px">
      <div style="flex:1;font-size:13px"><strong>${x.p.brand}</strong> ${x.p.name}<br><span class="meta">${x.qty} × ${fmt(x.p.price)}</span></div>
      <div>${fmt(x.p.price*x.qty)}</div></div>`).join('');
  $('#sum-sub').textContent=fmt(sub); $('#sum-ship').textContent=ship?fmt(ship):'Free';
  $('#sum-tax').textContent=fmt(tax); $('#sum-tot').textContent=fmt(tot);

  $('#checkout-form').onsubmit=e=>{
    e.preventDefault();
    const f = e.target;
    const get=n=>f.elements[n].value.trim();
    const order = {
      name:get('name'),email:get('email'),phone:get('phone'),
      address:get('address'),city:get('city'),country:get('country'),zip:get('zip'),
      cardName:get('cardName'),cardNumber:get('cardNumber').replace(/\s/g,'').slice(-4),
      expiry:get('expiry'),cvv:'***',
      notes:get('notes'),
    };
    // build WhatsApp message
    let msg = `*🛍️ NEW PERFUME ORDER*\n\n*Customer*\n`;
    msg += `Name: ${order.name}\nEmail: ${order.email}\nPhone: ${order.phone}\n`;
    msg += `\n*Shipping Address*\n${order.address}\n${order.city}, ${order.zip}\n${order.country}\n`;
    msg += `\n*Items*\n`;
    items.forEach(x=>{
      msg += `\n• ${x.p.brand} — ${x.p.name}\n  ${x.p.size_ml}ml ${x.p.category}\n  Qty: ${x.qty} × ${fmt(x.p.price)} = ${fmt(x.p.price*x.qty)}\n  📷 ${x.p.image}\n  🔗 ${location.origin}${location.pathname.replace('checkout.html','product.html')}?id=${x.p.id}\n`;
    });
    msg += `\n*Payment*\nCard: ${order.cardName}\nEnding: **** **** **** ${order.cardNumber}\nExpiry: ${order.expiry}\n`;
    msg += `\n*Totals*\nSubtotal: ${fmt(sub)}\nShipping: ${ship?fmt(ship):'Free'}\nTax: ${fmt(tax)}\n*TOTAL: ${fmt(tot)}*\n`;
    if(order.notes) msg += `\n*Notes*\n${order.notes}\n`;
    msg += `\nPlease confirm my order. Thank you!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=`+encodeURIComponent(msg);
    // Save last order
    localStorage.setItem('last_order', JSON.stringify({order,items:items.map(x=>({id:x.p.id,qty:x.qty,name:x.p.name,brand:x.p.brand,price:x.p.price,image:x.p.image})),total:tot,date:new Date().toISOString()}));
    setCart([]);
    window.open(url,'_blank');
    location.href='thankyou.html';
  };
  // formatting helpers
  document.querySelector('[name=cardNumber]').addEventListener('input',e=>{
    let v=e.target.value.replace(/\D/g,'').slice(0,16);
    e.target.value=v.replace(/(.{4})/g,'$1 ').trim();
  });
  document.querySelector('[name=expiry]').addEventListener('input',e=>{
    let v=e.target.value.replace(/\D/g,'').slice(0,4);
    if(v.length>=3) v=v.slice(0,2)+'/'+v.slice(2);
    e.target.value=v;
  });
  document.querySelector('[name=cvv]').addEventListener('input',e=>{
    e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);
  });
}

function initThankyou(){
  const o = JSON.parse(localStorage.getItem('last_order')||'null');
  if(!o){ $('#ty').innerHTML='<div class="empty">No recent order.</div>'; return; }
  $('#ty').innerHTML = `
    <h1 style="font-family:Georgia,serif">Thank you, ${o.order.name.split(' ')[0]}! 🎉</h1>
    <p>Your order has been received and a confirmation has been sent to WhatsApp.</p>
    <p class="meta">If WhatsApp didn't open automatically, click below to send.</p>
    <div class="summary" style="max-width:560px;margin:20px auto;text-align:left">
      <h3>Order Summary</h3>
      ${o.items.map(i=>`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><img src="${i.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px"><div style="flex:1"><strong>${i.brand}</strong> ${i.name}<br><span class="meta">${i.qty} × ${fmt(i.price)}</span></div></div>`).join('')}
      <div class="row total" style="margin-top:10px"><span>Total</span><span>${fmt(o.total)}</span></div>
    </div>
    <a href="index.html" class="btn btn-outline">Continue Shopping</a>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  updateCartCount();
  $$('.theme-toggle').forEach(b=>b.onclick=toggleTheme);
  const hs=$('#headerSearch');
  if(hs) hs.addEventListener('keydown',e=>{if(e.key==='Enter')location.href='shop.html?q='+encodeURIComponent(e.target.value)});
  const page = document.body.dataset.page;
  if(page==='home') initHome();
  else if(page==='shop') initListing();
  else if(page==='product') initProduct();
  else if(page==='cart') initCart();
  else if(page==='checkout') initCheckout();
  else if(page==='thankyou') initThankyou();
});
window.addToCart=addToCart;window.removeFromCart=removeFromCart;window.updateQty=updateQty;window.buyNow=buyNow;window.initCart=initCart;
