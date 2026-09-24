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
      <a href="./">All items</a><a href="./?show=available">Available</a><a href="about.html">About</a>
      <span class="spacer"></span>
      ${config.instagram ? `<a href="https://instagram.com/${esc(config.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
      <a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>
    </nav>
    <div class="rule"></div>
    ${hasToken() ? `<nav class="adminbar"><a href="admin.html">✎ Admin</a><a href="admin.html#new">+ New listing</a></nav>` : ''}
  </header>
  <main>${body}</main>
  <footer><div class="rule"></div>${doodles.squiggle}<p>© ${new Date().getFullYear()} ${esc(config.shopName)}</p></footer>
</div>`;
};

export const loadListings = async () => {
  const res = await fetch('data/listings.json', { cache: 'no-cache' });
  return res.ok ? res.json() : [];
};
