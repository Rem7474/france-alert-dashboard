import fs from 'fs';
const E='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/';
async function js(ds,q){
  const r=await fetch(E+ds+'?'+q+'&format=JSON&lang=EN'); if(!r.ok) throw new Error(ds+' '+r.status);
  const j=await r.json(); const ids=j.id,size=j.size;
  const out={}; // key geo -> {time:val}
  const gi=ids.indexOf('geo'),ti=ids.indexOf('time');
  const gk=Object.entries(j.dimension.geo.category.index).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  const tk=Object.entries(j.dimension.time.category.index).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  const stride=[];let s=1;for(let i=ids.length-1;i>=0;i--){stride[i]=s;s*=size[i];}
  for(const [k,v] of Object.entries(j.value)){const n=+k;const g=gk[Math.floor(n/stride[gi])%size[gi]];const t=tk[Math.floor(n/stride[ti])%size[ti]];(out[g]??={})[t]=v;}
  return out;
}
const G='geo=FR&geo=DE&geo=IT&geo=EA20&geo=EU27_2020';
const R={};
const jobs={
 debt:['gov_10dd_edpt1',`${G}&sector=S13&unit=PC_GDP&na_item=GD&sinceTimePeriod=2000`],
 debtEur:['gov_10dd_edpt1','geo=FR&sector=S13&unit=MIO_EUR&na_item=GD&sinceTimePeriod=2000'],
 def:['gov_10dd_edpt1',`${G}&sector=S13&unit=PC_GDP&na_item=B9&sinceTimePeriod=2000`],
 interest:['gov_10a_main','geo=FR&sector=S13&unit=MIO_EUR&na_item=D41PAY&sinceTimePeriod=2000'],
 exp:['gov_10a_main',`${G}&sector=S13&unit=PC_GDP&na_item=TE&sinceTimePeriod=2000`],
 rev:['gov_10a_main',`${G}&sector=S13&unit=PC_GDP&na_item=TR&sinceTimePeriod=2000`],
 exports:['nama_10_gdp','geo=FR&geo=DE&geo=IT&unit=CP_MEUR&na_item=P6&sinceTimePeriod=2000'],
 imports:['nama_10_gdp','geo=FR&geo=DE&geo=IT&unit=CP_MEUR&na_item=P7&sinceTimePeriod=2000'],
 gdp:['nama_10_gdp','geo=FR&geo=DE&geo=IT&unit=CP_MEUR&na_item=B1GQ&sinceTimePeriod=2000'],
 manuf:['nama_10_a10','geo=FR&geo=DE&geo=IT&unit=CP_MEUR&na_item=B1G&nace_r2=C&sinceTimePeriod=2000'],
 vaTot:['nama_10_a10','geo=FR&geo=DE&geo=IT&unit=CP_MEUR&na_item=B1G&nace_r2=TOTAL&sinceTimePeriod=2000'],
 fert:['demo_find','geo=FR&geo=DE&geo=IT&geo=EU27_2020&indic_de=TOTFERRT&sinceTimePeriod=2000'],
 youth:['une_rt_a','geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020&age=Y15-24&sex=T&unit=PC_ACT&sinceTimePeriod=2000'],
 emp5564:['lfsi_emp_a','geo=FR&geo=DE&geo=SE&geo=IT&geo=EU27_2020&age=Y55-64&sex=T&unit=PC_POP&indic_em=EMP_LFS&sinceTimePeriod=2005'],
};
for(const [k,[ds,q]] of Object.entries(jobs)){try{R[k]=await js(ds,q);console.log(k,Object.keys(R[k]).map(g=>g+':'+Object.keys(R[k][g]).at(-1)+'='+R[k][g][Object.keys(R[k][g]).at(-1)]).join(' '));}catch(e){console.log('FAIL',k,e.message)}}
async function ecb(c){const t=await (await fetch(`https://data-api.ecb.europa.eu/service/data/IRS/M.${c}.L.L40.CI.0000.EUR.N.Z?format=csvdata&startPeriod=2005-01`)).text();
 const L=t.trim().split('\n');const h=L[0].split(',');const ti=h.indexOf('TIME_PERIOD'),vi=h.indexOf('OBS_VALUE');const o={};
 for(const l of L.slice(1)){const f=l.split(',');o[f[ti]]=+f[vi];}return o;}
R.yFR=await ecb('FR');R.yDE=await ecb('DE');
console.log('ECB',Object.keys(R.yFR).at(-1),R.yFR[Object.keys(R.yFR).at(-1)],R.yDE[Object.keys(R.yDE).at(-1)]);
const out=process.argv[2]||'data/snapshot.json';
const required=['debt','def','interest','yFR','yDE','fert'];
for(const k of required) if(!R[k]||!Object.keys(R[k]).length) throw new Error('Données manquantes : '+k);
fs.writeFileSync(out,JSON.stringify(R));console.log('écrit',out);
