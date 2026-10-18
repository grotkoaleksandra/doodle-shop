import { config } from './config.js';
import { doodles } from './doodles.js';
import { esc, price, render, loadListings, getCart, setCart, addToCart } from './shared.js';

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
    const link = /^https:\/\//.test(s.link || '') ? s.link : '';
    document.getElementById('buy').innerHTML = `
      <button class="btn solid" id="add">Add ${esc(s.name)} to cart</button>
      ${link ? `<a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Buy ${esc(s.name)} now</a>` : ''}
      ${config.instagram ? `<a class="btn ghost" href="https://ig.me/m/${esc(config.instagram)}" target="_blank" rel="noopener">DM on Instagram</a>` : ''}
      <p class="added" id="added" hidden>Added! <a href="cart.html">Go to cart →</a></p>`;
    document.getElementById('add').onclick = () => {
      addToCart(it.id, s.name);
      document.getElementById('added').hidden = false;
    };
  };
  document.querySelectorAll('input[name=size]').forEach((r) => (r.onchange = update));
  update();
}

async function cart() {
  const listings = await loadListings();
  // Match cart lines to current prints/prices; drop anything no longer on sale.
  const lines = getCart().map((l) => {
    const it = listings.find((i) => i.id === l.id && i.status !== 'hidden');
    const s = it && sizesOf(it).find((x) => x.name === l.size);
    return s ? { ...l, it, price: s.price } : null;
  }).filter(Boolean);
  setCart(lines.map(({ id, size, qty }) => ({ id, size, qty })));
  const total = lines.reduce((t, l) => t + l.price * l.qty, 0);

  if (!lines.length) {
    return render('Cart', `<p class="kicker">CART / カート</p><h1>Your cart</h1>
      <div class="empty">${doodles.frame}<p>Your cart is empty. <a href="./">Go find a print →</a></p></div>`);
  }

  const money = (n) => `${n.toFixed(2).replace('.', ',')} ${config.currency}`;
  const orderText = [
    "Hi! I'd like to order:",
    '',
    ...lines.map((l) => `• ${l.it.title} — ${l.size} × ${l.qty} = ${money(l.price * l.qty)}`),
    '',
    `Total: ${money(total)} (+ shipping)`,
    '',
    'My name:',
    'Shipping address:',
    '',
  ].join('\n');
  const mail = `mailto:${config.contactEmail}?subject=${encodeURIComponent(`Print order (${lines.length} item${lines.length > 1 ? 's' : ''})`)}&body=${encodeURIComponent(orderText)}`;

  render('Cart', `<p class="kicker">CART / カート</p><h1>Your cart</h1>
    <table class="cart">
      <tbody>${lines.map((l, i) => `
        <tr>
          <td>${l.it.images[0] ? `<img src="${esc(l.it.images[0])}" alt="">` : ''}</td>
          <td><a href="item.html?id=${esc(l.id)}">${esc(l.it.title)}</a><br><span class="muted">${esc(l.size)} · ${price(l.price)}</span></td>
          <td class="qty"><button data-qty="${i}" data-d="-1" aria-label="One less">−</button><span>${l.qty}</span><button data-qty="${i}" data-d="1" aria-label="One more">+</button></td>
          <td class="linetotal">${price(l.price * l.qty)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p class="total">Total: ${price(total)} <span class="muted">+ shipping</span></p>
    <div class="buy">
      <a class="btn solid" href="${esc(mail)}">Send my order by email</a>
      <button class="btn" id="copy">Copy order (for Instagram DM)</button>
    </div>
    <p class="note">${doodles.arrow} I'll reply with shipping costs and how to pay. ${esc(config.printNote)}</p>
    <p><button class="link" id="clear">empty cart</button></p>`);

  document.querySelectorAll('[data-qty]').forEach((b) => (b.onclick = () => {
    const c = getCart();
    c[b.dataset.qty].qty += Number(b.dataset.d);
    setCart(c.filter((l) => l.qty > 0));
    cart();
  }));
  document.getElementById('copy').onclick = async (e) => {
    try { await navigator.clipboard.writeText(orderText); e.target.textContent = 'Copied! Paste it in a DM'; }
    catch { e.target.textContent = 'Couldn\'t copy — use email instead'; }
  };
  document.getElementById('clear').onclick = () => { setCart([]); cart(); };
}

function about() {
  render('About', `<section class="prose"><p class="kicker">ABOUT / について</p><h1>Hi, I'm the one behind ${esc(config.shopName)}.</h1>
    <p>I draw things, and you can have them on your wall. Every print is made to order — I print yours when you order it, so nothing goes to waste.</p>
    <p>${esc(config.printNote)} Questions about sizes, framing or custom orders? Just message me.</p>${doodles.roller}</section>`);
}

({ home, item, about, cart })[document.body.dataset.page]?.();
