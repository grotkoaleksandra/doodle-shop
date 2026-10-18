// Admin page. GitHub Pages has no server, so listings and photos are saved
// straight into the GitHub repo using a personal access token that only the
// shop owner has. The token is kept in this browser only (localStorage).
import { config } from './config.js';
import { doodles } from './doodles.js';
import { esc, price, render } from './shared.js';

const { owner, repo, branch } = config.github;
const LISTINGS = 'data/listings.json';
const token = () => { try { return localStorage.getItem('gh-token'); } catch { return null; } };
const previews = {}; // photos uploaded this session → local preview until Pages rebuilds

// ---------- GitHub API ----------
async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (!res.ok) throw new Error(`GitHub said ${res.status}: ${(await res.json().catch(() => ({}))).message || res.statusText}`);
  return res.status === 204 ? null : res.json();
}
const getFile = (path) => gh(`/contents/${path}?ref=${branch}`);
const putFile = (path, content, message, sha) =>
  gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content, branch, ...(sha && { sha }) }) });
const deleteFile = async (path, message) => {
  const { sha } = await getFile(path).catch(() => ({}));
  if (sha) await gh(`/contents/${path}`, { method: 'DELETE', body: JSON.stringify({ message, sha, branch }) });
};

const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));

async function loadListings() {
  const f = await getFile(LISTINGS).catch(() => null);
  return f ? JSON.parse(fromB64(f.content)) : [];
}
async function saveListings(items, message) {
  const f = await getFile(LISTINGS).catch(() => null); // fresh sha avoids conflicts
  await putFile(LISTINGS, toB64(new TextEncoder().encode(JSON.stringify(items, null, 2) + '\n')), message, f?.sha);
}

// Shrink photos before upload so the repo (and the site) stays fast.
async function shrink(file, max = 1600) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * scale), height: Math.round(bmp.height * scale) });
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
}

// ---------- views ----------
const img = (p) => previews[p] || p;
const flash = (msg) => sessionStorage.setItem('flash', msg);
const takeFlash = () => { const m = sessionStorage.getItem('flash'); sessionStorage.removeItem('flash'); return m ? `<p class="flash">${esc(m)}</p>` : ''; };

function setupView(error = '') {
  render('Admin', `
    <form class="form" id="setup">
      <p class="kicker">ADMIN</p><h1>Connect your shop</h1>
      ${error ? `<p class="error">${esc(error)}</p>` : ''}
      <p>Your listings are saved in your GitHub repo <b>${esc(owner)}/${esc(repo)}</b>. To post, this browser needs a GitHub key that only you have:</p>
      <ol class="steps">
        <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → new fine-grained token</a>.</li>
        <li>Repository access: <b>Only select repositories</b> → <b>${esc(repo)}</b>.</li>
        <li>Permissions → Repository permissions → <b>Contents: Read and write</b>.</li>
        <li>Generate it, copy it and paste it below.</li>
      </ol>
      <label>GitHub token<input type="password" name="token" required autocomplete="off" placeholder="github_pat_…"></label>
      <button class="btn solid">Connect</button>
      <p class="muted">The key stays in this browser only. Anyone without it can only look at the shop.</p>
    </form>`);
  document.getElementById('setup').onsubmit = async (e) => {
    e.preventDefault();
    localStorage.setItem('gh-token', e.target.token.value.trim());
    try { await gh(''); location.hash = ''; route(); }
    catch (err) { localStorage.removeItem('gh-token'); setupView(`That key didn't work — ${err.message}`); }
  };
}

async function listView() {
  render('Admin', `<p class="kicker">ADMIN</p><h1>Your prints</h1><p class="muted">Loading…</p>`);
  const items = (await loadListings()).sort((a, b) => b.createdAt - a.createdAt);
  const rows = items.map((it) => `
    <tr>
      <td>${it.images[0] ? `<img src="${esc(img(it.images[0]))}" alt="">` : ''}</td>
      <td><a href="item.html?id=${esc(it.id)}">${esc(it.title)}</a></td>
      <td>${(it.sizes || []).filter((s) => s.price > 0).map((s) => `${esc(s.name)} ${price(s.price)}`).join('<br>')}</td>
      <td><select data-status="${esc(it.id)}">${[['available', 'on sale'], ['hidden', 'hidden']].map(([v, l]) => `<option value="${v}" ${v === (it.status || 'available') ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td class="actions"><a href="#edit/${esc(it.id)}">edit</a><button class="link" data-delete="${esc(it.id)}">delete</button></td>
    </tr>`).join('');
  render('Admin', `${takeFlash()}<p class="kicker">ADMIN</p><h1>Your prints</h1>
    <p class="adminlinks"><a class="btn solid" href="#new">+ New print</a><a href="#help">how to send an order to Gelato</a><button class="link" id="logout">disconnect this browser</button></p>
    ${items.length ? `<table class="admin"><thead><tr><th></th><th>Print</th><th>Sizes & prices</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">${doodles.frame}<p>No prints yet. Post your first one!</p></div>`}`);

  document.getElementById('logout').onclick = () => { localStorage.removeItem('gh-token'); location.href = './'; };
  document.querySelectorAll('[data-status]').forEach((sel) => (sel.onchange = async () => {
    sel.disabled = true;
    const all = await loadListings();
    const it = all.find((i) => i.id === sel.dataset.status);
    it.status = sel.value;
    await saveListings(all, `Mark "${it.title}" as ${it.status}`);
    flash(`“${it.title}” is now ${it.status === 'hidden' ? 'hidden from the shop' : 'on sale'}. The live site updates in about a minute.`);
    listView();
  }));
  document.querySelectorAll('[data-delete]').forEach((btn) => (btn.onclick = async () => {
    if (!confirm('Delete this print and its photos?')) return;
    btn.textContent = 'deleting…';
    const all = await loadListings();
    const it = all.find((i) => i.id === btn.dataset.delete);
    await saveListings(all.filter((i) => i !== it), `Delete "${it.title}"`);
    for (const p of it.images) await deleteFile(p, `Delete photo of "${it.title}"`);
    flash(`Deleted “${it.title}”.`);
    listView();
  }));
}

async function formView(id) {
  const items = await loadListings();
  const it = id ? items.find((i) => i.id === id) : {};
  if (!it) return (location.hash = '');
  const sizes = it.sizes?.length ? it.sizes : config.defaultSizes.map((name) => ({ name, price: '', link: '' }));
  const sizeRow = (sz = {}) => `
    <tr>
      <td><input name="sizeName" maxlength="40" value="${esc(sz.name)}" placeholder="e.g. A4"></td>
      <td><input name="sizePrice" type="number" min="0" step="0.01" value="${esc(sz.price)}" placeholder="—"></td>
      <td><input name="sizeLink" type="url" pattern="https://.*" value="${esc(sz.link)}" placeholder="https://buy.stripe.com/… (optional)"></td>
    </tr>`;
  render(id ? 'Edit print' : 'New print', `
    <form class="form" id="listing">
      <p class="kicker"><a href="admin.html">ADMIN</a></p><h1>${id ? 'Edit print' : 'New print'}</h1>
      <label>Title<input name="title" required maxlength="120" value="${esc(it.title)}" placeholder="Cat on a windowsill"></label>
      <div class="sizefield">
        <p class="label">Sizes & prices <span class="muted">— leave a price empty if you don't offer that size. A payment link adds a “Buy now” button for that size.</span></p>
        <table class="sizetable">
          <thead><tr><th>Size</th><th>Price (${esc(config.currency)})</th><th>Payment link</th></tr></thead>
          <tbody>${sizes.map(sizeRow).join('')}</tbody>
        </table>
        <button type="button" class="link" id="addsize">+ add another size</button>
      </div>
      <label>Description <span class="muted">(optional — paper, story behind it…)</span><textarea name="description" rows="5" maxlength="4000">${esc(it.description)}</textarea></label>
      ${it.images?.length ? `<div class="thumbs">${it.images.map((p) => `<label class="thumbpick"><img src="${esc(img(p))}" alt=""><span><input type="checkbox" name="remove" value="${esc(p)}"> remove</span></label>`).join('')}</div>` : ''}
      <label>Photos <span class="muted">(up to 8, first one is the cover)</span><input type="file" name="photos" accept="image/*" multiple></label>
      <button class="btn solid" type="submit">${id ? 'Save changes' : 'Post it!'}</button>
      <p class="status muted" aria-live="polite"></p>
    </form>`);

  const form = document.getElementById('listing');
  document.getElementById('addsize').onclick = () => form.querySelector('.sizetable tbody').insertAdjacentHTML('beforeend', sizeRow());
  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const prices = f.getAll('sizePrice'), links = f.getAll('sizeLink');
    const sizes = f.getAll('sizeName').map((name, i) => ({ name: name.trim(), price: Math.max(0, Number(prices[i]) || 0), link: links[i].trim() }))
      .filter((s) => s.name && s.price > 0);
    const status = form.querySelector('.status');
    if (!sizes.length) { status.textContent = 'Add a price for at least one size.'; return; }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const listingId = it.id || crypto.randomUUID().slice(0, 10);
      const remove = f.getAll('remove');
      const files = f.getAll('photos').filter((p) => p.size);
      const added = [];
      for (const [i, file] of files.entries()) {
        status.textContent = `Uploading photo ${i + 1} of ${files.length}…`;
        const blob = await shrink(file);
        const path = `images/${listingId}-${Date.now()}-${i}.jpg`;
        await putFile(path, toB64(new Uint8Array(await blob.arrayBuffer())), `Add photo for "${f.get('title')}"`);
        previews[path] = URL.createObjectURL(blob);
        added.push(path);
      }
      status.textContent = 'Saving print…';
      const all = await loadListings();
      const fields = { title: f.get('title').trim(), sizes, description: f.get('description') };
      const current = all.find((i) => i.id === listingId);
      if (current) {
        Object.assign(current, fields, { images: [...current.images.filter((p) => !remove.includes(p)), ...added].slice(0, 8) });
      } else {
        all.push({ id: listingId, ...fields, images: added.slice(0, 8), status: 'available', createdAt: Date.now() });
      }
      await saveListings(all, `${current ? 'Update' : 'Add'} print "${fields.title}"`);
      for (const p of remove) await deleteFile(p, `Remove photo from "${fields.title}"`);
      flash(`Saved “${fields.title}”! It'll be live on the site in about a minute.`);
      location.hash = '';
    } catch (err) {
      status.textContent = `Something went wrong: ${err.message}`;
      btn.disabled = false;
    }
  };
}

function helpView() {
  render('Sending orders to Gelato', `
    <section class="prose guide">
      <p class="kicker"><a href="admin.html">ADMIN</a> / GUIDE</p>
      <h1>How to send an order to Gelato</h1>
      <p>Gelato prints your poster and posts it straight to your customer, so you never touch paper or parcels. Gelato's buttons may be named a little differently from what's written here, but the steps are the same.</p>

      <h2>Once, before your first sale</h2>
      <ol>
        <li>Make a free account at <a href="https://www.gelato.com" target="_blank" rel="noopener">gelato.com</a>.</li>
        <li>Save each design as a big, sharp file (PNG or PDF). For good quality at 300 dpi:
          <ul><li>A5 — 1748 × 2480 px</li><li>A4 — 2480 × 3508 px</li><li>A3 — 3508 × 4961 px</li></ul>
          Keep these files in one folder so you can find them fast.</li>
        <li>Order one sample print to yourself to check the paper and colours.</li>
        <li>Check what Gelato charges for each size <b>including shipping</b>, and make sure your prices on this site cover that plus your profit.</li>
      </ol>

      <h2>Every time someone orders</h2>
      <ol>
        <li>You get an email (or DM) with their order: which prints, which sizes, their name and address.</li>
        <li>Reply with the total including shipping and how to pay (BLIK, bank transfer, or a payment link).</li>
        <li>Once they've paid, go to Gelato and start a new order.</li>
        <li>Pick the poster product and the size, and upload that print's design file.</li>
        <li>Type in your <b>customer's</b> name and shipping address (not yours!).</li>
        <li>Pay Gelato for the print and shipping.</li>
        <li>When Gelato sends you the tracking link, forward it to your customer.</li>
      </ol>

      <h2>Tips</h2>
      <ul>
        <li>If Gelato lets you save a design as a product or template, do it — next time you only pick the size and type the address.</li>
        <li>Note each order down somewhere (even a notes app): who, what, paid, sent to Gelato, tracking sent.</li>
        <li>If a print arrives damaged, Gelato usually reprints it — contact their support with a photo.</li>
      </ul>
      <p><a class="btn" href="admin.html">← Back to your prints</a></p>
    </section>`);
}

async function route() {
  if (!token()) return setupView();
  const [view, id] = location.hash.slice(1).split('/');
  try {
    if (view === 'help') helpView();
    else if (view === 'new') await formView();
    else if (view === 'edit') await formView(id);
    else await listView();
  } catch (err) {
    if (/ 401/.test(err.message)) { localStorage.removeItem('gh-token'); return setupView('Your GitHub key expired or was revoked — paste a new one.'); }
    render('Admin', `<p class="error">${esc(err.message)}</p>`);
  }
}

window.addEventListener('hashchange', route);
route();
