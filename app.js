import { config } from './config.js';
import { doodles } from './doodles.js';
import { esc, price, render, loadListings } from './shared.js';

const sizesOf = (it) => (it.sizes || []).filter((s) => s.price > 0);
const fromPrice = (it) => {
  const prices = sizesOf(it).map((s) => s.price);
  return prices.length ? `${prices.length > 1 ? 'from ' : ''}${price(Math.min(...prices))}` : '';
};

const card = (it) => `
<a class="card" href="item.html?id=${esc(it.id)}">
  <div class="thumb">
    ${it.images[0] ? `<img src="${esc(it.images[0])}" alt="${esc(it.title)}" loading="lazy">` : `<div class="noimg">${doodles.frame}</div>`}
  </div>
  <h3>${esc(it.title)}</h3>
  <p class="price">${fromPrice(it)}</p>
</a>`;

async function home() {
  const items = (await loadListings()).filter((i) => i.status !== 'hidden').sort((a, b) => b.createdAt - a.createdAt);
  render(config.shopName, `
    <section class="hero">
      <div>
        <p class="kicker">PRINTS / プリント</p>
        <h1>${esc(config.shopName)}</h1>
        <p>${esc(config.tagline)}. Pick a print and a size — I print it fresh and send it your way.</p>
      </div>
      <div class="hero-doodles">${doodles.roller}${doodles.star}${doodles.pencil}</div>
    </section>
    <div class="rule"></div>
    <p class="count">${items.length} print${items.length === 1 ? '' : 's'} · all made to order</p>
    ${items.length ? `<div class="grid">${items.map(card).join('')}</div>`
      : `<div class="empty">${doodles.frame}<p>New prints coming soon!</p></div>`}`);
}

async function item() {
  const id = new URLSearchParams(location.search).get('id');
  const it = (await loadListings()).find((i) => i.id === id);
  if (!it || it.status === 'hidden') return render('Not found', `<div class="empty">${doodles.frame}<p>That print isn't available right now. <a href="./">See all prints →</a></p></div>`);
  const sizes = sizesOf(it);
  render(it.title, `
    <p class="crumbs"><a href="./">All prints</a> / ${esc(it.title)}</p>
    <article class="item">
      <div class="gallery">
        ${it.images.length ? it.images.map((f) => `<img src="${esc(f)}" alt="${esc(it.title)}">`).join('') : `<div class="noimg big">${doodles.frame}</div>`}
      </div>
      <div class="info">
        <p class="kicker">PRINT TO ORDER</p>
        <h1>${esc(it.title)}</h1>
        <p class="price big" id="price"></p>
        ${sizes.length > 1 ? `
          <fieldset class="sizes"><legend>Size</legend>
            ${sizes.map((s, i) => `<label><input type="radio" name="size" value="${i}" ${i === 0 ? 'checked' : ''}><span>${esc(s.name)}</span></label>`).join('')}
          </fieldset>` : sizes.length ? `<p class="onesize">Size: ${esc(sizes[0].name)}</p>` : ''}
        <div class="buy" id="buy"></div>
        <p class="note">${doodles.arrow} ${esc(config.printNote)}</p>
        ${it.description ? `<p class="desc">${esc(it.description).replace(/\n/g, '<br>')}</p>` : ''}
      </div>
    </article>`);

  // Update the price and buttons for the picked size.
  const update = () => {
    const s = sizes[document.querySelector('input[name=size]:checked')?.value ?? 0];
    if (!s) return;
    document.getElementById('price').innerHTML = price(s.price);
    const mail = `mailto:${config.contactEmail}?subject=${encodeURIComponent(`Print order: ${it.title} (${s.name})`)}&body=${encodeURIComponent(`Hi! I'd like to order "${it.title}" in ${s.name}.\n\nMy name:\nShipping address:\n`)}`;
    const link = /^https:\/\//.test(s.link || '') ? s.link : '';
    document.getElementById('buy').innerHTML = `
      ${link ? `<a class="btn solid" href="${esc(link)}" target="_blank" rel="noopener">Buy ${esc(s.name)} now</a>` : ''}
      <a class="btn ${link ? '' : 'solid'}" href="${esc(mail)}">Order by message</a>
      ${config.instagram ? `<a class="btn ghost" href="https://ig.me/m/${esc(config.instagram)}" target="_blank" rel="noopener">DM on Instagram</a>` : ''}`;
  };
  document.querySelectorAll('input[name=size]').forEach((r) => (r.onchange = update));
  update();
}

function about() {
  render('About', `<section class="prose"><p class="kicker">ABOUT / について</p><h1>Hi, I'm the one behind ${esc(config.shopName)}.</h1>
    <p>I draw things, and you can have them on your wall. Every print is made to order — I print yours when you order it, so nothing goes to waste.</p>
    <p>${esc(config.printNote)} Questions about sizes, framing or custom orders? Just message me.</p>${doodles.roller}</section>`);
}

({ home, item, about })[document.body.dataset.page]?.();
