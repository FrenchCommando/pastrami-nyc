import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDrop, verdict, pileStats, PERFECT_PX, PERFECT_GROW } from '../site/stack/logic.js';

const prev = { x: -100, w: 200 };

test('miss: no overlap ends the game', () => {
  assert.equal(resolveDrop(prev, { x: 100, w: 200 }, 200, 4).kind, 'miss');
  assert.equal(resolveDrop(prev, { x: -300, w: 200 }, 200, 4).kind, 'miss');
});

test('trim: what lands plus what falls is the whole slice', () => {
  for (const x of [-180, -140, -60, -20, 50]) {
    const cur = { x, w: 200 };
    const r = resolveDrop(prev, cur, 200, 2);
    assert.equal(r.kind, 'trim', `x=${x}`);
    assert.equal(r.streak, 0);
    assert.ok(Math.abs(r.placed.w + r.cut.w - cur.w) < 1e-9, `x=${x}`);
    assert.ok(r.placed.x >= prev.x && r.placed.x + r.placed.w <= prev.x + prev.w, `placed inside prev, x=${x}`);
    if (x < prev.x) assert.equal(r.cut.side, -1);
    else assert.equal(r.cut.side, 1);
    // the cut piece is adjacent to the placed piece
    const touches = r.cut.side < 0 ? r.cut.x + r.cut.w : r.cut.x;
    assert.ok(Math.abs(touches - (r.cut.side < 0 ? r.placed.x : r.placed.x + r.placed.w)) < 1e-9);
  }
});

test('perfect: within tolerance snaps to the slice below', () => {
  for (const dx of [-PERFECT_PX, 0, PERFECT_PX]) {
    const r = resolveDrop(prev, { x: prev.x + dx, w: prev.w }, 200, 0);
    assert.equal(r.kind, 'perfect');
    assert.deepEqual(r.placed, prev);
    assert.equal(r.streak, 1);
  }
  assert.equal(resolveDrop(prev, { x: prev.x + PERFECT_PX + 1, w: prev.w }, 200, 0).kind, 'trim');
});

test('perfect streak of 3 grows the slice, centered, capped at the base width', () => {
  const narrow = { x: -50, w: 100 };
  const r = resolveDrop(narrow, { ...narrow }, 200, 2);
  assert.equal(r.streak, 3);
  assert.equal(r.placed.w, 100 + PERFECT_GROW);
  assert.equal(r.placed.x + r.placed.w / 2, 0);

  const almost = { x: -98, w: 196 };
  assert.equal(resolveDrop(almost, { ...almost }, 200, 5).placed.w, 200);
  assert.equal(resolveDrop(prev, { ...prev }, 200, 5).placed.w, 200);
});

test('verdicts and stats', () => {
  assert.match(verdict(0), /bread/);
  assert.notEqual(verdict(4), verdict(5));
  assert.match(verdict(100), /Legendary/);
  assert.deepEqual(pileStats(10), { inches: '1.2 in', weight: '6.0 oz' });
  assert.equal(pileStats(40).weight, '1.50 lb');
});
