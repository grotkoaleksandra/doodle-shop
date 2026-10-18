import { config } from './config.js';
import { doodles } from './doodles.js';

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const price = (p) => `${Number(p).toFixed(2).replace('.', ',')} ${esc(config.currency)}`;

export const hasToken = () => {
  try { return !!localStorage.getItem('gh-token'); } catch { return false; }
};

// Page frame shared by every page: side column, nav, footer.
export const render = (title, body) => {
  document.title = title === config.shopName ? title : `${title} — ${config.shopName}`;
  document.body.innerHTML = `
${doodles.filters}
<aside class="side">
  <a href="./" class="logo">${doodles.logo}<span>${esc(config.shopName)}</span></a>
  <p class="vertical">${esc(config.tagline)} ✶ ${esc(config.contactEmail)}</p>
</aside>
<div class="wrap">
  <header>
    <nav class="top">
      <a href="./">All prints</a><a href="about.html">About</a>
      <span class="spacer"></span>
      ${config.instagram ? `<a href="https://instagram.com/${esc(config.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
      <a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>
      <a href="cart.html" class="cartbtn">Cart (<span id="cartcount">${cartCount()}</span>)</a>
    </nav>
    <div class="rule"></div>
    ${hasToken() ? `<nav class="adminbar"><a href="admin.html">✎ Admin</a><a href="admin.html#new">+ New print</a></nav>` : ''}
  </header>
  <main>${body}</main>
  <footer><div class="rule"></div>${doodles.squiggle}<p>© ${new Date().getFullYear()} ${esc(config.shopName)}</p></footer>
</div>`;
};

export const loadListings = async () => {
  const res = await fetch('data/listings.json', { cache: 'no-cache' });
  return res.ok ? res.json() : [];
};

// ---------- cart (kept in this browser only) ----------
export const getCart = () => {
  try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
};
export const setCart = (cart) => {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch {}
  const el = document.getElementById('cartcount');
  if (el) el.textContent = cartCount();
};
export const cartCount = () => getCart().reduce((n, line) => n + line.qty, 0);
export const addToCart = (id, size) => {
  const cart = getCart();
  const line = cart.find((l) => l.id === id && l.size === size);
  if (line) line.qty += 1;
  else cart.push({ id, size, qty: 1 });
  setCart(cart);
};
