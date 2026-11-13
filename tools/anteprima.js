// Anteprima di una scena senza rete né GPU: Chromium di Playwright con SwiftShader (WebGL in software).
// Three.js r128 viene preso da npm (npm pack three@0.128.0) e servito al posto dei CDN, che qui non si raggiungono.
//
// uso:  node tools/anteprima.js <scena.html> <cartella-out> [larghezza] [altezza] [vista ...]
//   vista = nome passato a window.__view (es. sala, cucina) oppure JSON per window.__set
//           (es. '{"x":-3,"z":4.4,"f":0,"yaw":-0.97,"pitch":0.14}')
//   senza viste scatta solo la vista iniziale.
// Stampa gli errori della pagina e il testo del riquadro degli errori, se compare.
// Variabili: THREE_DIR = cartella "package" di three@0.128.0 già estratta; SCALA = deviceScaleFactor (default 1).
'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),os=require('os'),{execSync}=require('child_process');

function threeDir(){
  if(process.env.THREE_DIR)return process.env.THREE_DIR;
  const dir=path.join(os.tmpdir(),'rpg-three-r128'),pkg=path.join(dir,'package');
  if(!fs.existsSync(path.join(pkg,'build','three.min.js'))){
    fs.mkdirSync(dir,{recursive:true});
    execSync('npm pack three@0.128.0 --silent',{cwd:dir,stdio:'ignore'});
    execSync('tar xzf three-0.128.0.tgz',{cwd:dir});
  }
  return pkg;
}

(async()=>{
  const [file,out,w='960',h='540',...views]=process.argv.slice(2);
  if(!file||!out){console.log('uso: node tools/anteprima.js <scena.html> <cartella-out> [larghezza] [altezza] [vista ...]');process.exit(1);}
  const T=threeDir();fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:+(process.env.SCALA||1)});
  const logs=[];
  p.on('pageerror',e=>logs.push('ERRORE: '+e.message));
  p.on('console',m=>{if((m.type()==='error'||m.type()==='warning')&&!/willReadFrequently/.test(m.text()))logs.push(m.type()+': '+m.text().slice(0,300));});
  await p.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',r=>r.fulfill({body:fs.readFileSync(path.join(T,'build','three.min.js')),contentType:'text/javascript'}));
  await p.route('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js',r=>r.fulfill({body:fs.readFileSync(path.join(T,'examples','js','utils','BufferGeometryUtils.js')),contentType:'text/javascript'}));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));   // niente font: l'HUD ripiega su monospace
  await p.goto('file://'+path.resolve(file));
  const sc=+(process.env.SCALA||1),lento=sc*sc;   // a scala 2 ogni fotogramma costa circa 4 volte tanto
  await p.waitForTimeout(7000*lento);   // costruzione della scena + i primi fotogrammi (SwiftShader fa pochi fotogrammi al secondo)
  const list=views.length?views:['iniziale'];
  for(let i=0;i<list.length;i++){const v=list[i];
    if(v.startsWith('{'))await p.evaluate(s=>window.__set&&window.__set(JSON.parse(s)),v);
    else if(v!=='iniziale')await p.evaluate(s=>window.__view&&window.__view(s),v);
    await p.waitForTimeout(2500*lento);
    const name=v.startsWith('{')?'vista'+i:v;const f=path.join(out,name+'.png');await p.screenshot({path:f,timeout:60000*lento});console.log('scritto',f);}
  const err=await p.evaluate(()=>{const e=document.getElementById('err');return e&&!e.hidden?e.textContent:null;});
  if(err)logs.push('RIQUADRO ERRORI: '+err);
  console.log(logs.length?logs.join('\n'):'nessun errore nella pagina');
  await b.close();
})();
