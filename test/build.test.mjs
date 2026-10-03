import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const snap = JSON.parse(fs.readFileSync('data/snapshot.json', 'utf8'));

test('le snapshot contient les séries clés pour la France', () => {
  for (const k of ['debt', 'def', 'interest', 'exp', 'rev', 'fert', 'youth', 'emp5564']) {
    assert.ok(Object.keys(snap[k].FR).length > 5, `série ${k} vide`);
  }
  assert.ok(Object.keys(snap.yFR).length > 100, 'taux FR 10 ans');
  assert.ok(Object.keys(snap.yDE).length > 100, 'taux DE 10 ans');
});

test('valeurs plausibles', () => {
  const last = o => o[Object.keys(o).sort().at(-1)];
  assert.ok(last(snap.debt.FR) > 80 && last(snap.debt.FR) < 160);
  assert.ok(last(snap.def.FR) < 0 && last(snap.def.FR) > -15);
  assert.ok(last(snap.fert.FR) > 1 && last(snap.fert.FR) < 3);
});

test('le build produit une page autonome sans placeholder', () => {
  execFileSync('node', ['scripts/build.mjs', 'data/snapshot.json']);
  const html = fs.readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('__DATA__'));
  assert.ok(html.includes('const DATA={'));
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  assert.doesNotThrow(() => new Function(script));
});
