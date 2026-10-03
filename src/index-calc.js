const PILLARS = [
  ['fin', 'Finances publiques'],
  ['eco', 'Économie réelle'],
  ['dem', 'Démographie & emploi'],
  ['mkt', 'Marché de la dette'],
];
const INDEX_START = 2005;

function byYear(o) {
  const r = {};
  for (const [k, v] of Object.entries(o || {})) if (v != null && +k.slice(0, 4) >= INDEX_START) r[+k.slice(0, 4)] = v;
  return r;
}
function ratio(a, b, k = 100) {
  const r = {};
  for (const y of Object.keys(a)) if (b[y]) r[y] = (a[y] / b[y]) * k;
  return r;
}
function range(vals) {
  const a = vals.filter(v => v != null && isFinite(v));
  return [Math.min(...a), Math.max(...a)];
}
function norm(v, [lo, hi]) {
  return hi === lo ? 0 : Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
}

function buildIndex(D, weights = { fin: 1, eco: 1, dem: 1, mkt: 1 }) {
  const gdp = byYear(D.gdp.FR), ex = byYear(D.exports.FR), im = byYear(D.imports.FR);
  const net = {};
  for (const y of Object.keys(ex)) if (im[y] != null) net[y] = ex[y] - im[y];
  // sign +1 : une valeur haute aggrave l'indice ; -1 : une valeur basse l'aggrave
  const defs = [
    { id: 'debt', p: 'fin', s: 1, y: byYear(D.debt.FR) },
    { id: 'def', p: 'fin', s: -1, y: byYear(D.def.FR) },
    { id: 'int', p: 'fin', s: 1, y: ratio(byYear(D.interest.FR), gdp) },
    { id: 'trade', p: 'eco', s: -1, y: ratio(net, gdp) },
    { id: 'manuf', p: 'eco', s: -1, y: ratio(byYear(D.manuf.FR), byYear(D.vaTot.FR)) },
    { id: 'fert', p: 'dem', s: -1, y: byYear(D.fert.FR) },
    { id: 'youth', p: 'dem', s: 1, y: byYear(D.youth.FR) },
    { id: 'emp', p: 'dem', s: -1, y: byYear(D.emp5564.FR) },
  ];
  for (const d of defs) {
    const oriented = Object.fromEntries(Object.entries(d.y).map(([y, v]) => [y, v * d.s]));
    const rg = range(Object.values(oriented));
    d.score = Object.fromEntries(Object.entries(oriented).map(([y, v]) => [y, norm(v, rg)]));
    d.years = Object.keys(d.score).map(Number).sort((a, b) => a - b);
  }
  const scoreAt = (d, y) => {
    if (y < d.years[0]) return null;
    let k = d.years[0];
    for (const yy of d.years) if (yy <= y) k = yy;
    return d.score[k];
  };
  const pillarAt = (p, y) => {
    const v = defs.filter(d => d.p === p).map(d => scoreAt(d, y)).filter(v => v != null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const combine = pl => {
    let s = 0, w = 0;
    for (const [id] of PILLARS) if (pl[id] != null) { s += pl[id] * weights[id]; w += weights[id]; }
    return w ? s / w : null;
  };

  // marché : spread FR-DE mensuel (taux de convergence BCE)
  const spread = {};
  for (const k of Object.keys(D.yFR)) if (D.yDE[k] != null && +k.slice(0, 4) >= INDEX_START) spread[k] = D.yFR[k] - D.yDE[k];
  const spRange = range(Object.values(spread));
  const months = Object.keys(spread).sort().map(k => {
    const y = +k.slice(0, 4);
    const pl = { fin: pillarAt('fin', y), eco: pillarAt('eco', y), dem: pillarAt('dem', y), mkt: norm(spread[k], spRange) };
    return { t: Date.UTC(y, +k.slice(5, 7) - 1, 1), idx: combine(pl), p: pl };
  });

  // quotidien : tension souveraine zone euro (courbe tous émetteurs − courbe AAA, 10 ans)
  const stress = {};
  for (const k of Object.keys(D.daily.all)) if (D.daily.aaa[k] != null) stress[k] = D.daily.all[k] - D.daily.aaa[k];
  const stRange = range(Object.values(stress));
  const lastYear = Math.max(...defs.flatMap(d => d.years));
  const fixed = { fin: pillarAt('fin', lastYear), eco: pillarAt('eco', lastYear), dem: pillarAt('dem', lastYear) };
  const days = Object.keys(stress).sort().slice(-400).map(k => {
    const pl = { ...fixed, mkt: norm(stress[k], stRange) };
    return { t: Date.parse(k + 'T00:00:00Z'), idx: combine(pl), p: pl, raw: stress[k] };
  });

  return { months, days, defs, spRange, stRange, lastYear };
}
