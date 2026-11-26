import { DELIS, CURE, RUB, LB_TO_KG, toKg, scale, formatGrams, mapUrl } from './data.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- delis ----------
const list = document.getElementById('deliList');
const filters = document.getElementById('filters');
const boroughs = ['All', ...new Set(DELIS.map((d) => d.borough))];
let active = 'All';

function renderFilters() {
  filters.innerHTML = boroughs.map((b) => {
    const n = b === 'All' ? DELIS.length : DELIS.filter((d) => d.borough === b).length;
    return `<button class="chip" aria-pressed="${b === active}" data-b="${esc(b)}">${esc(b)} · ${n}</button>`;
  }).join('');
}

function renderList() {
  list.innerHTML = DELIS.filter((d) => active === 'All' || d.borough === active).map((d) => `
    <article class="deli">
      <div class="top">
        <h3>${esc(d.name)}</h3>
        ${d.since ? `<span class="since">est. ${esc(d.since)}</span>` : ''}
      </div>
      <div class="where">${esc(d.hood)}, ${esc(d.borough)} · ${esc(d.address)}</div>
      <div class="tags">${d.tags.map((t, i) => `<span class="tag${d.news && i === 0 ? ' news' : ''}">${esc(t)}</span>`).join('')}</div>
      ${d.take ? `<div class="take"><span class="score">${esc(d.take.score)}</span>${esc(d.take.text)}</div>` : ''}
      <p>${esc(d.blurb)}</p>
      ${d.tip ? `<p><b>Pro tip:</b> ${esc(d.tip)}</p>` : ''}
      <div class="order"><b>Order:</b> ${esc(d.order)}</div>
      <a class="map" href="${esc(mapUrl(d))}" target="_blank" rel="noopener">Map ↗</a>
    </article>`).join('');
}

filters.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  active = b.dataset.b;
  renderFilters();
  renderList();
});
renderFilters();
renderList();

// ---------- recipe calculator ----------
const weightIn = document.getElementById('weight');
const unitIn = document.getElementById('unit');
const table = document.getElementById('amounts');

function renderCalc() {
  const w = parseFloat(weightIn.value);
  if (!(w > 0)) { table.innerHTML = '<tr><td>Enter a weight</td><td></td></tr>'; return; }
  const kg = toKg(w, unitIn.value);
  const rows = (title, items) =>
    `<tr class="group"><td colspan="2">${title}</td></tr>` +
    scale(items, kg).map(([name, g]) => `<tr><td>${esc(name)}</td><td>${formatGrams(g)}</td></tr>`).join('');
  table.innerHTML = rows('Cure', CURE) + rows('Rub', RUB);
}
weightIn.addEventListener('input', renderCalc);
unitIn.addEventListener('change', () => {
  const w = parseFloat(weightIn.value);
  if (w > 0) weightIn.value = (unitIn.value === 'kg' ? w * LB_TO_KG : w / LB_TO_KG).toFixed(2);
  renderCalc();
});
renderCalc();
