import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DELIS, CURE, RUB, toKg, scale, formatGrams, mapUrl } from '../site/js/data.js';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '../site');

test('delis are complete and unique', () => {
  assert.ok(DELIS.length >= 5);
  assert.equal(new Set(DELIS.map((d) => d.name)).size, DELIS.length);
  for (const d of DELIS) {
    for (const f of ['name', 'borough', 'hood', 'address', 'blurb', 'order']) assert.ok(d[f], `${d.name}.${f}`);
    assert.ok(['Manhattan', 'Brooklyn', 'Bronx', 'Queens', 'Staten Island'].includes(d.borough), d.name);
    assert.ok(Array.isArray(d.tags) && d.tags.length, `${d.name}.tags`);
    if (d.since) assert.match(d.since, /^\d{4}$/, `${d.name}.since`);
    if (d.take) assert.ok(d.take.score && d.take.text, `${d.name}.take`);
    assert.ok(mapUrl(d).startsWith('https://www.google.com/maps/search/?api=1&query='));
  }
});

test('equilibrium cure: 2.5% salt, 0.25% Prague Powder #1', () => {
  const per = Object.fromEntries(CURE);
  assert.equal(per['Kosher salt'] / 1000, 0.025);
  assert.equal(per['Prague Powder #1'] / 1000, 0.0025);
  // 6.25% nitrite in cure #1 -> ~156 ppm ingoing nitrite, under the 200 ppm limit for dry-cured beef
  const ppm = per['Prague Powder #1'] * 0.0625 * 1000;
  assert.ok(ppm > 150 && ppm < 200, `${ppm} ppm`);
});

test('calculator math', () => {
  assert.ok(Math.abs(toKg(5, 'lb') - 2.26796185) < 1e-6);
  assert.equal(toKg(2, 'kg'), 2);
  const scaled = Object.fromEntries(scale(CURE, 2));
  assert.equal(scaled['Kosher salt'], 50);
  assert.equal(scale(RUB, 1).length, RUB.length);
  assert.equal(formatGrams(5.67), '5.7 g');
  assert.equal(formatGrams(56.7), '57 g');
});

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : f.endsWith('.html') ? [p] : [];
  });

test('pages: no inline scripts (CSP script-src self) and every local reference exists', () => {
  const pages = htmlFiles(SITE);
  assert.ok(pages.length >= 2);
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(m[1], /\bsrc=/, `${page}: inline <script>`);
      assert.equal(m[2].trim(), '', `${page}: script body`);
    }
    assert.doesNotMatch(html, /\son[a-z]+=["']/i, `${page}: inline event handler`);
    for (const [, ref] of html.matchAll(/\b(?:src|href)="([^"#?]+)"/g)) {
      if (/^(https?:|data:|mailto:)/.test(ref)) continue;
      const target = ref.startsWith('/') ? join(SITE, ref) : join(dirname(page), ref);
      const file = ref.endsWith('/') ? join(target, 'index.html') : target;
      assert.ok(existsSync(file), `${page}: ${ref} -> missing`);
    }
  }
});
