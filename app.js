import { config } from './config.js';
import { doodles } from './doodles.js';
import { esc, price, render, loadListings } from './shared.js';

const stamp = (it, cls = '') =>
  it.status !== 'available' ? `<span class="stamp ${cls}">${it.status === 'sold' ? 'sold!' : 'reserved'}</span>` : '';

const card = (it) => `
<a class="card ${esc(it.status)}" href="item.html?id=${esc(it.id)}">
  <div class="thumb">
    ${it.images[0] ? `<img src="${esc(it.images[0])}" alt="${esc(it.title)}" loading="lazy">` : `<div class="noimg">${doodles.hanger}</div>`}
    ${stamp(it)}
  </div>
  <h3>${esc(it.title)}</h3>
  <p class="price">${price(it.price)}${it.size ? ` <span class="muted">· ${esc(it.size)}</span>` : ''}</p>
</a>`;

async function home() {
  const onlyAvailable = new URLSearchParams(location.search).get('show') === 'available';
  let items = (await loadListings()).sort((a, b) => b.createdAt - a.createdAt);
  if (onlyAvailable) items = items.filter((i) => i.status === 'available');
  render(config.shopName, `
    <section class="hero">
      <div>
        <p class="kicker">NEW / 新着</p>
        <h1>${esc(config.shopName)}</h1>
        <p>${esc(config.tagline)}. Everything here is one of a kind — see something you like? Message me or buy it right away.</p>
      </div>
      <div class="hero-doodles">${doodles.bag}${doodles.star}${doodles.sweater}</div>
    </section>
    <div class="rule"></div>
    <p class="count">${items.length} ${onlyAvailable ? 'available ' : ''}item${items.length === 1 ? '' : 's'}</p>
    ${items.length ? `<div class="grid">${items.map(card).join('')}</div>`
      : `<div class="empty">${doodles.hanger}<p>Nothing here yet — check back soon!</p></div>`}`);
}

async function item() {
  const id = new URLSearchParams(location.search).get('id');
  const it = (await loadListings()).find((i) => i.id === id);
  if (!it) return render('Not found', `<div class="empty">${doodles.hanger}<p>That item wandered off.</p></div>`);
  const mail = `mailto:${config.contactEmail}?subject=${encodeURIComponent(`I'd like to buy: ${it.title}`)}&body=${encodeURIComponent(`Hi! Is "${it.title}" (${price(it.price)}) still available?`)}`;
  render(it.title, `
    <p class="crumbs"><a href="./">All items</a> / ${esc(it.title)}</p>
    <article class="item">
      <div class="gallery">
        ${it.images.length ? it.images.map((f) => `<img src="${esc(f)}" alt="${esc(it.title)}">`).join('') : `<div class="noimg big">${doodles.hanger}</div>`}
      </div>
      <div class="info">
        ${stamp(it, 'inline')}
        <h1>${esc(it.title)}</h1>
        <p class="price big">${price(it.price)}</p>
        <dl>
          ${it.size ? `<dt>Size</dt><dd>${esc(it.size)}</dd>` : ''}
          ${it.condition ? `<dt>Condition</dt><dd>${esc(it.condition)}</dd>` : ''}
          ${it.brand ? `<dt>Brand</dt><dd>${esc(it.brand)}</dd>` : ''}
        </dl>
        <p class="desc">${esc(it.description).replace(/\n/g, '<br>')}</p>
        ${it.status === 'available' ? `
          <div class="buy">
            ${/^https:\/\//.test(it.paymentLink || '') ? `<a class="btn solid" href="${esc(it.paymentLink)}" target="_blank" rel="noopener">Buy now</a>` : ''}
            <a class="btn" href="${esc(mail)}">Message me to buy</a>
            ${config.instagram ? `<a class="btn ghost" href="https://ig.me/m/${esc(config.instagram)}" target="_blank" rel="noopener">DM on Instagram</a>` : ''}
          </div>
          <p class="note">${doodles.arrow} ${it.paymentLink ? 'pay securely online, or' : ''} write to me and we'll sort out payment & shipping.</p>`
        : `<p class="note">This one's found a new home. <a href="./?show=available">See what's still available →</a></p>`}
      </div>
    </article>`);
}

function about() {
  render('About', `<section class="prose"><p class="kicker">ABOUT / について</p><h1>Hi, I'm the one behind ${esc(config.shopName)}.</h1>
    <p>I sell pieces from my own wardrobe and things I've found along the way. Each listing is a single item. To buy, hit “Buy now” where available, or message me — I usually reply within a day.</p>
    <p>Shipping and pickup are arranged by message.</p>${doodles.sweater}</section>`);
}

({ home, item, about })[document.body.dataset.page]?.();
