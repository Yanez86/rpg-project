const vm=require('vm');
function P2(name){ const f=function(){}; f.__c={}; return new Proxy(f,{
  get(t,k){ if(k===Symbol.toPrimitive) return ()=>1; if(k==='then') return undefined; if(k in t.__c) return t.__c[k];
    if(k==='array') { const a=new Float32Array(4096); t.__c[k]=a; return a; }
    const v=P2(name+'.'+String(k)); t.__c[k]=v; return v; },
  set(t,k,v){ t.__c[k]=v; return true; }, apply(){ return P2(name+'()'); }, construct(){ return P2('new '+name); } }); }
const els={};const el=()=>({hidden:false,textContent:'',style:{},addEventListener(){},setAttribute(){},setPointerCapture(){},getBoundingClientRect(){return{left:0,top:0,width:112,height:112}}});
let frames=0;
const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,k)=>k==='createImageData'?((w,h)=>({data:new Uint8ClampedArray(w*h*4)})):(k==='measureText'?(()=>({width:10})):(typeof k==='string'?(()=>P2('c2d')):undefined)),set:()=>true})});
const ctx={console,Math,Date,JSON,Float32Array,Int8Array,Uint8Array,Uint8ClampedArray,Uint16Array,Uint32Array,Int32Array,Array,Map,Set,Object,Symbol,Number,String,Error,
  innerWidth:390,innerHeight:844,devicePixelRatio:3,
  document:{getElementById:id=>els[id]||(els[id]=el()),createElement:cv,fonts:{load:()=>Promise.resolve()}},
  localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},setTimeout:(f)=>f(),requestAnimationFrame:(f)=>{ if(frames++<3) f(); },THREE:P2('THREE')};
ctx.window=ctx;ctx.Promise=Promise;
vm.createContext(ctx);
vm.runInContext(require('fs').readFileSync('main.js','utf8'),ctx);
console.log('frames',frames,'err hidden?',els.err&&els.err.hidden);
