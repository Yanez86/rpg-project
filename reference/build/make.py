import re
src = open('/home/claude/vox/pioggia/src.html').read()
body = src[src.index('<script src="https://cdnjs'):]

def R1(a, b):
    global body
    assert body.count(a) == 1, a[:100]
    body = body.replace(a, b)

head = r'''<title>Valfiorita sotto la pioggia</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jacquard+24&family=Pixelify+Sans:wght@400;600&display=swap">
<style>
/* Layout: vista in prima persona a tutto schermo con l'HUD di Runess: targa in alto a sinistra, riflessi in alto a destra, joystick in basso a sinistra, ritorno al mercato in basso a destra. Un solo tema scuro: è l'interfaccia del gioco. */
:root {
  --ground: #110e0b;
  --panel: rgba(26, 21, 16, 0.88);
  --panel-hi: #241d16;
  --picked: #2e2418;
  --bronze: #5c452b;
  --bronze-lit: #d6a352;
  --key-edge: #9a7550;
  --text: #dccdb4;
  --dim: #a3917a;
  --gold: #ffd999;
  --outline: #080503;
  --f-display: "Jacquard 24", "Pixelify Sans", ui-monospace, monospace;
  --f-ui: "Pixelify Sans", ui-monospace, Consolas, monospace;
  color-scheme: dark;
}
html, body { height: 100%; margin: 0; overflow: hidden; background: #6f7a72; color: var(--text); font-family: var(--f-ui); }
#scene { position: fixed; inset: 0; display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
#scene:active { cursor: grabbing; }
.panel { background: var(--panel); border: 3px solid var(--bronze); box-shadow: 0 0 0 2px var(--outline); }
.plate { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 14px); left: max(16px, env(safe-area-inset-left, 0px)); padding: 8px 14px 10px; pointer-events: none; max-width: min(380px, calc(100% - 48px)); display: grid; gap: 4px; }
.eyebrow { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--bronze-lit); }
.plate h1 { font-family: var(--f-display); font-weight: 400; font-size: clamp(30px, 6vw, 42px); line-height: .95; margin: 0; color: var(--gold); text-wrap: balance; text-shadow: 2px 2px 0 var(--outline); }
.keys { margin: 2px 0 0; font-size: 13px; color: var(--dim); display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
kbd { font-family: var(--f-ui); font-size: 12px; color: var(--text); background: var(--panel-hi); border: 2px solid var(--key-edge); box-shadow: 0 0 0 1px var(--outline); padding: 0 5px; line-height: 17px; }
.touch-only { display: none; }
@media (pointer: coarse) { .mouse-only { display: none; } .touch-only { display: inline; } }
.filters { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 14px); right: max(16px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
button.act { font-family: var(--f-ui); font-size: 15px; padding: 5px 12px; cursor: pointer; color: var(--text); background: var(--panel); border: 2px solid var(--bronze); box-shadow: 0 0 0 2px var(--outline); }
button.act:hover { border-color: var(--bronze-lit); color: var(--gold); }
button.act:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
button.act[aria-pressed="true"] { border-color: var(--bronze-lit); color: var(--gold); background: var(--picked); }
button.act[aria-pressed]::before { content: ""; display: inline-block; width: 8px; height: 8px; margin-right: 8px; vertical-align: 1px; background: var(--bronze); box-shadow: 0 0 0 1px var(--outline); }
button.act[aria-pressed="true"]::before { background: var(--gold); }
.home { position: fixed; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 22px); }
.stick { position: fixed; left: max(20px, calc(env(safe-area-inset-left, 0px) + 12px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 22px); width: 112px; height: 112px; touch-action: none; background: rgba(26, 21, 16, 0.55); border: 3px solid var(--bronze); box-shadow: 0 0 0 2px var(--outline);
  clip-path: polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px); }
.knob { position: absolute; left: 50%; top: 50%; width: 40px; height: 40px; margin: -20px 0 0 -20px; background: var(--gold); border: 3px solid var(--bronze-lit); box-shadow: inset -4px -4px 0 #c99a4a; pointer-events: none; }
.err { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 12px 18px; font-size: 16px; color: var(--gold); max-width: calc(100% - 48px); text-align: center; }
</style>

<canvas id="scene" aria-label="Vista in prima persona dalla piazza del mercato di un borgo fantasy sotto la pioggia, nella nebbia"></canvas>
<div class="plate panel">
  <span class="eyebrow">Valfiorita · pioggia</span>
  <h1>Piazza del Mercato</h1>
  <p class="keys mouse-only"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> cammina · <kbd>Shift</kbd> corri · trascina per guardare</p>
  <p class="keys touch-only">Trascina per guardare · joystick per camminare</p>
</div>
<div class="filters"><button class="act" id="refl" type="button" aria-pressed="true">Riflessi</button></div>
<div class="stick" id="stick" role="application" aria-label="Joystick per camminare"><div class="knob" id="knob"></div></div>
<div class="home"><button class="act" id="home" type="button">Torna al mercato</button></div>
<div class="err panel" id="err" hidden>Il tuo dispositivo non supporta WebGL, quindi la scena non può essere mostrata.</div>

'''

# ---------- renderer, fog, light ----------
R1("try{renderer=new THREE.WebGLRenderer({canvas,antialias:true});}", "try{renderer=new THREE.WebGLRenderer({canvas,antialias:false});}")
R1("const PR=Math.min(window.devicePixelRatio||1,1.75);", "const PR=Math.min(window.devicePixelRatio||1,1.5);")
R1("renderer.shadowMap.type=THREE.PCFShadowMap;", "renderer.shadowMap.type=THREE.PCFSoftShadowMap;")
R1("""{
  const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#3a9fec');g.addColorStop(.5,'#8fd3ff');g.addColorStop(1,'#dcf4ff');
  x.fillStyle=g;x.fillRect(0,0,4,256);scene.background=new THREE.CanvasTexture(c);
}
scene.fog=new THREE.Fog(0xcdeeff,70,190);""", """const FOG=new THREE.Color(0x97a29a);
renderer.setClearColor(FOG,1);
scene.fog=new THREE.FogExp2(FOG,0.03);""")
R1("""const sunDir=new V(-0.5,0.74,-0.36).normalize();
scene.add(new THREE.HemisphereLight(0xe4f5ff,0x7f9a52,0.55));
scene.add(new THREE.AmbientLight(0xffffff,0.12));
const sun=new THREE.DirectionalLight(0xfff0d2,1.0);""", """// cielo coperto: la luce arriva da tutto il cielo, il sole è solo un chiarore che dà ombre morbidissime
const sunDir=new V(-0.35,0.86,-0.36).normalize();
scene.add(new THREE.HemisphereLight(0xc8d0c8,0x4a5044,0.95));
scene.add(new THREE.AmbientLight(0xb8c4bc,0.18));
const sun=new THREE.DirectionalLight(0xdfe4dc,0.28);""")

# ---------- pixel textures ----------
i = body.index("function tiles(rot){"); j = body.index("/* ================= materiali cel ================= */")
body = body[:i] + r'''// texture a pixel grossi, dipinte un pixel alla volta, come nei pacchetti di texture dei giochi a blocchi
function pix(S,fn,rot){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S);
  for(let y=0;y<S;y++)for(let X=0;X<S;X++){const[u,v]=rot?[y,S-1-X]:[X,y];const p=fn(u,v,S);const k=(y*S+X)*4;im.data[k]=p[0];im.data[k+1]=p[1];im.data[k+2]=p[2];im.data[k+3]=255;}
  x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}
const hn=(a,b,c)=>{let h=Math.imul(a|0,73856093)^Math.imul(b|0,19349663)^Math.imul((c|0)+7,83492791);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
const G=v=>{v=Math.max(0,Math.min(255,v|0));return[v,v,v];};
const tilePix=(u,v,S)=>{const row=v>>4,off=(row&1)*8,col=((u+off)>>4),lu=(u+off)&15,lv=v&15;
  const b=150+hn(col,row,1)*70,q=hn(u,v,2);if(lv===15||(lv>10&&(lu===0||lu===15)))return G(b*0.42);if(lv<=1)return G(b*1.14);if(q<.025&&lv>8)return[95,118,80];return G(b*(0.88+q*.18)-(lv>10?(lv-10)*6:0)+(lu<3?8:0));};
const TEX={
  tilesV:pix(64,tilePix,false),tilesU:pix(64,tilePix,true),
  stone:pix(64,(u,v)=>{const row=v>>4,off=(row&1)*12,col=Math.floor((u+off)/24),lu=(u+off)%24,lv=v&15;if(lv===15||lu===0)return G(85);const b=185+hn(col,row,3)*55,q=hn(u,v,4),m=hn(u>>2,v>>2,30);if(lv>11&&m<.3)return[130+q*30,150+q*25,105];return G(b*(0.88+q*.16)+(lv<2?14:0)-(lu>21?14:0));}),
  cobble:pix(128,(u,v)=>{const row=Math.floor(v/12),off=(row&1)*9,col=Math.floor((u+off)/18),lu=(u+off)%18,lv=v%12;if(lv===11||lu===17||(lv<1&&lu<1))return G(70);const b=195+hn(col,row,5)*55,q=hn(u,v,6);if((lu===0||lv===10)&&q<.6)return G(b*.7);return G(b*(0.86+q*.18)+(lv<2?16:0));}),
  grass:pix(64,(u,v)=>{const q=hn(u,v,7),p=hn(u>>3,v>>3,8);return G(150+p*60+q*45-(q<.12?40:0)+((v+(u>>1))%5===0&&q>.7?20:0));}),
  dirt:pix(64,(u,v)=>{const q=hn(u,v,9),p=hn(u>>3,v>>3,10);return G(170+p*45+q*30-(q<.1?50:0));}),
  wood:pix(64,(u,v)=>{const pl=u>>4,lu=u&15;if(lu===0)return G(62);const b=170+hn(pl,0,11)*60,g=Math.sin((v+hn(pl,1,12)*30)*0.35+lu*.6)*12;return G(b+g+hn(u,v,13)*16-(hn(pl,v>>4,14)<.06&&(lu===7||lu===8)?70:0)-(lu===15?18:0));}),
  plaster:pix(64,(u,v)=>{const q=hn(u,v,15),p=hn(u>>4,v>>4,16);let b=218+p*24+q*12;if(v>50)b-=(v-50)*4*(0.6+q*.6);if(hn(u>>1,v>>3,17)<.03)b-=45;if(hn(u>>2,v,18)<.012)b-=30;return G(b);}),
  ivy:(()=>{const S=32,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S);for(let y=0;y<S;y++)for(let X=0;X<S;X++){const q=hn(X>>1,y>>1,40),k=(y*S+X)*4,on=q<.62;const g=on?70+hn(X,y,41)*90:0;im.data[k]=g*.55;im.data[k+1]=g;im.data[k+2]=g*.45;im.data[k+3]=on?255:0;}x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t;})()
};
''' + body[j:]

# ---------- materials: lit, muted colours; warm lit windows; no outlines ----------
R1("""function tm(color,o){o=o||{};const k=color+'|'+(o.tex||'')+'|'+(o.emi||0)+'|'+(o.side||0);
  if(!mats[k]){const p={color,gradientMap:gradTex};if(o.tex)p.map=TEX[o.tex];if(o.emi)p.emissive=new THREE.Color(o.emi);if(o.side)p.side=THREE.DoubleSide;mats[k]=new THREE.MeshToonMaterial(p);}
  return mats[k];}""", """// i colori della fiaba, smorzati dalla pioggia; vetri e lanterne diventano luce calda
const LIT={0x8fd3f5:0xffa848,0x9fdcff:0xffb45a,0xffeaa6:0xffd38a,0xffe9a0:0xffd38a};
function mute(h){const c=new THREE.Color(h),l=c.r*.3+c.g*.59+c.b*.11;c.r=(c.r*.62+l*.38)*.86;c.g=(c.g*.62+l*.38)*.88;c.b=(c.b*.62+l*.38)*.84;return c;}
function tm(color,o){o=o||{};const k=color+'|'+(o.tex||'')+'|'+(o.emi||0)+'|'+(o.side||0);
  if(!mats[k]){
    if(LIT[color]!=null)mats[k]=new THREE.MeshBasicMaterial({color:LIT[color]});
    else{const p={color:mute(color)};if(o.tex)p.map=TEX[o.tex];if(o.tex&&o.tex.indexOf('tiles')===0)p.opacity=0.86;if(o.emi)p.emissive=mute(o.emi).multiplyScalar(.6);if(o.side)p.side=THREE.DoubleSide;mats[k]=new THREE.MeshLambertMaterial(p);}}
  return mats[k];}""")
R1("function outline(m,t){const g=m.geometry;", "function outline(m,t){return;const g=m.geometry;")
# window frames dark wood, no painted highlight
R1("  P(g,B(0.84,1.04,0.08),0xfff8ea,x,y,zf+0.02,{line:0.025,cast:false});", "  P(g,B(0.84,1.04,0.08),0x4a3628,x,y,zf+0.02,{line:0.025,cast:false});")
R1("  P(g,B(0.08,0.26,0.02),0xffffff,x-0.18,y+0.2,zf+0.1,{rot:[0,0,0.35],line:0,cast:false});\n", "  P(g,B(0.64,0.04,0.08),TIMBER,x,y-0.18,zf+0.07,{line:0,cast:false});P(g,B(0.64,0.04,0.08),TIMBER,x,y+0.28,zf+0.07,{line:0,cast:false});\n")
# signs: pixel lettering
R1("""  const c=document.createElement('canvas');c.width=512;c.height=128;const t=new THREE.CanvasTexture(c);t.anisotropy=4;
  const draw=()=>{const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,128);x.strokeStyle=fg;x.lineWidth=8;rr(x,10,10,492,108,18);x.stroke();
    x.fillStyle=fg;x.font='600 '+(px||66)+'px Fredoka, "Trebuchet MS", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,70);t.needsUpdate=true;};
  draw();signDraws.push(draw);
  return new THREE.MeshToonMaterial({map:t,gradientMap:gradTex});""", """  const c=document.createElement('canvas');c.width=128;c.height=32;const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;
  const draw=()=>{const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#5a4432';x.fillRect(0,0,128,32);x.fillStyle='#3a2a1e';x.fillRect(0,0,128,2);x.fillRect(0,30,128,2);x.fillRect(0,0,2,32);x.fillRect(126,0,2,32);
    x.fillStyle='#e8d6b0';x.font='600 '+Math.round((px||66)/4.6)+'px "Pixelify Sans", monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,17);t.needsUpdate=true;};
  draw();signDraws.push(draw);
  return new THREE.MeshLambertMaterial({map:t});""")
R1("if(document.fonts&&document.fonts.load)document.fonts.load('600 66px Fredoka')", "if(document.fonts&&document.fonts.load)document.fonts.load('600 14px \"Pixelify Sans\"')")

# walls get plaster texture: timber house walls, round and tall houses
R1("  P(g,B(W2,h2,D2),wall,0,y2,0,{line:0.05});", "  P(g,uvB(W2,h2,D2,W2/1.6,h2/1.6),wall,0,y2,0,{tex:'plaster',line:0.05});")
R1("  P(g,CY(r,r,h,20),wall,0,h/2,0,{line:0.05});", "  P(g,uvS(CY(r,r,h,20),r*4,h/1.6),wall,0,h/2,0,{tex:'plaster',line:0.05});")
R1("  P(g,B(w,h,w),wall,0,h/2,0,{line:0.05});", "  P(g,uvB(w,h,w,w/1.6,h/1.6),wall,0,h/2,0,{tex:'plaster',line:0.05});")
R1("  P(g,tg,wall,0,y0,0,{line:0.04});", "  P(g,tg,wall,0,y0,0,{tex:'plaster',line:0.04});")

# ---------- rain water: dark green-grey, rings from raindrops, flagged for reflections ----------
R1("""function waterMat(base,light,k,edge){return new THREE.ShaderMaterial({
  uniforms:{t:waterT,base:{value:new THREE.Color(base)},light:{value:new THREE.Color(light)},k:{value:k},e:{value:edge}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',""", """function waterMat(base,light,k,edge){return new THREE.ShaderMaterial({
  uniforms:{t:waterT,fogC:{value:FOG},dens:{value:0.03}},
  vertexShader:'varying vec3 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:`uniform float t,dens;uniform vec3 fogC;varying vec3 vW;varying float vD;
    float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 q=floor(vW.xz*12.0)/12.0;
      vec3 col=mix(vec3(0.16,0.2,0.19),vec3(0.24,0.29,0.27),hh(floor(vW.xz*2.0)));
      float ring=0.0;
      for(int k=0;k<3;k++){vec2 cell=floor(q*1.6+float(k)*0.37);float ph=hh(cell+float(k)*7.1);float tt=fract(t*0.9+ph);
        vec2 c0=(cell+vec2(hh(cell+3.1),hh(cell+5.3)))/1.6-float(k)*0.37/1.6;float d=length(q-c0);ring=max(ring,(1.0-tt)*step(abs(d-tt*0.45),0.04));}
      col=mix(col,vec3(0.62,0.68,0.66),ring*0.7);
      col=mix(col,fogC,1.0-exp(-dens*dens*vD*vD));
      gl_FragColor=vec4(col,0.5);}`});}
function waterMatOld(base,light,k,edge){return new THREE.ShaderMaterial({
  uniforms:{t:waterT,base:{value:new THREE.Color(base)},light:{value:new THREE.Color(light)},k:{value:k},e:{value:edge}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',""")

# wet cobbles and paths
R1("{const top=new THREE.CircleGeometry(PLAZA,72);top.rotateX(-PI/2);P(world,top,0xffffff,0,0.252,0,{tex:'cobble',uv:[7,7],line:0,cast:false});",
   "{const top=new THREE.CircleGeometry(PLAZA,72);top.rotateX(-PI/2);const pz=P(world,top,0xd8d0c0,0,0.252,0,{tex:'cobble',uv:[9,9],line:0,cast:false});pz.material.opacity=0.68;")
R1("  const m=P(world,g,0xffffff,(ax+bx)/2,0.03,(az+bz)/2,{tex:'dirt',line:0,cast:false});m.rotation.y=Math.atan2(bx-ax,bz-az);}",
   "  const m=P(world,g,0xb8a888,(ax+bx)/2,0.03,(az+bz)/2,{tex:'dirt',line:0,cast:false});m.material.opacity=0.8;m.rotation.y=Math.atan2(bx-ax,bz-az);}")

# ---------- sky dome instead of the sun ----------
R1("""// sole
const sunSprite=(()=>{""", """// cielo coperto, con nuvole basse che scorrono
const skyT={value:0};
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.ShaderMaterial({uniforms:{t:skyT,fogc:{value:FOG}},side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float t;uniform vec3 fogc;varying vec3 vW;
    float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(vW-cameraPosition);float y=d.y;vec2 uv=d.xz/(abs(y)+0.25);
      float c=vn(uv*1.2+vec2(t*0.012,0.0))*0.6+vn(uv*2.6+vec2(t*0.02,3.0))*0.4;
      vec3 col=mix(fogc*1.05,fogc*0.8,smoothstep(0.0,0.7,y));col=mix(col,col*0.84,smoothstep(0.45,0.75,c)*smoothstep(0.05,0.4,y));
      gl_FragColor=vec4(col,1.0);}`}));
skyDome.renderOrder=-10;skyDome.frustumCulled=false;scene.add(skyDome);
const sunSprite=(()=>{""")
R1("  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false,depthWrite:false}));s.scale.set(70,70,1);scene.add(s);return s;})();",
   "  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false,depthWrite:false}));s.scale.set(70,70,1);s.visible=false;scene.add(s);return s;})();")
# smoke puffs and ripples tuned for rain
R1("smokeBases.forEach((base,ci)=>{for(let k=0;k<6;k++)puffs.push({m:P(scene,puffGeo,0xf4f6ff,0,0,0,{line:0.05,cast:false}),base,ph:k/6+ci*0.13});});",
   "smokeBases.forEach((base,ci)=>{for(let k=0;k<6;k++)puffs.push({m:P(scene,puffGeo,0xb8bcb8,0,0,0,{line:0.05,cast:false}),base,ph:k/6+ci*0.13});});")
R1("for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.RingGeometry(0.85,1,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));",
   "for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.RingGeometry(0.85,1,28),new THREE.MeshBasicMaterial({color:0xc8d0cc,transparent:true,depthWrite:false}));")

# ---------- rain, splashes, post-processing ----------
R1("/* ================= camminare in prima persona ================= */", r"""/* ================= pioggia ================= */
// strisce sottili quasi verticali attorno a chi guarda, con schizzi dove toccano terra
const RAIN_N=1700,rainPos=new Float32Array(RAIN_N*6),rainV=new Float32Array(RAIN_N),rainL=new Float32Array(RAIN_N);
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xc4ccc8,transparent:true,opacity:0.55,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
for(let i=0;i<RAIN_N;i++){rainV[i]=R(8,11);rainL[i]=R(0.25,0.5);rainPos[i*6]=R(-20,20);rainPos[i*6+1]=R(0,15);rainPos[i*6+2]=R(-20,20);}
const rsplash=PS(320,PT.dot,false);let rsI=0;

/* ================= post: riflessi sul bagnato, foschia bassa, bagliore delle finestre, colori smorzati ================= */
const opts={refl:true};try{const s=JSON.parse(localStorage.getItem('vfp-1')||'{}');if(typeof s.refl==='boolean')opts.refl=s.refl;}catch(e){}
const rt=new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
rt.depthTexture=new THREE.DepthTexture(4,4);rt.depthTexture.type=THREE.UnsignedIntType;
const mkRT=()=>new THREE.WebGLRenderTarget(4,4,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
const rtA=mkRT(),rtB=mkRT();
const FSQ='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
const pass=(u,fs)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:FSQ,fragmentShader:fs,depthTest:false,depthWrite:false});
const brightMat=pass({tC:{value:rt.texture}},`uniform sampler2D tC;varying vec2 vUv;void main(){vec3 c=texture2D(tC,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));gl_FragColor=vec4(c*smoothstep(0.6,0.95,l),1.0);}`);
const blurMat=pass({tI:{value:null},dir:{value:new THREE.Vector2()}},`uniform sampler2D tI;uniform vec2 dir;varying vec2 vUv;
  void main(){vec3 s=texture2D(tI,vUv).rgb*0.227;s+=(texture2D(tI,vUv+dir*1.385).rgb+texture2D(tI,vUv-dir*1.385).rgb)*0.316;s+=(texture2D(tI,vUv+dir*3.231).rgb+texture2D(tI,vUv-dir*3.231).rgb)*0.07;gl_FragColor=vec4(s,1.0);}`);
const post=pass({tC:{value:rt.texture},tD:{value:rt.depthTexture},tB:{value:rtA.texture},refl:{value:1},wt:waterT,fogc:{value:FOG},
  proj:{value:camera.projectionMatrix},projInv:{value:camera.projectionMatrixInverse},view:{value:camera.matrixWorldInverse},camW:{value:camera.matrixWorld}},
  `uniform sampler2D tC,tD,tB;uniform float refl,wt;uniform vec3 fogc;uniform mat4 proj,projInv,view,camW;varying vec2 vUv;
  vec3 vpos(vec2 uv){vec4 q=projInv*vec4(uv*2.0-1.0,texture2D(tD,uv).r*2.0-1.0,1.0);return q.xyz/q.w;}
  vec3 ssr(vec2 uv,vec3 base,float k){
    vec3 P=vpos(uv);vec3 W=(camW*vec4(P,1.0)).xyz;
    vec2 n=vec2(sin(W.x*3.1+wt*1.5+sin(W.z*2.0)),cos(W.z*2.7-wt*1.2+sin(W.x*1.7)))*0.03;
    vec3 N=normalize((view*vec4(normalize(vec3(n.x,1.0,n.y)),0.0)).xyz);
    vec3 V=normalize(P);vec3 Rd=reflect(V,N);vec3 col=fogc*0.95;
    float st=0.12;vec3 Q=P;
    for(int i=0;i<40;i++){Q+=Rd*st;st*=1.1;vec4 cq=proj*vec4(Q,1.0);vec2 s=cq.xy/cq.w*0.5+0.5;
      if(s.x<0.0||s.y<0.0||s.x>1.0||s.y>1.0||cq.w<0.0)break;float sz=vpos(s).z;
      if(sz>Q.z&&sz-Q.z<0.4+st*1.5){vec3 a=Q-Rd*st,b=Q;for(int j=0;j<5;j++){vec3 m=(a+b)*0.5;vec4 cm=proj*vec4(m,1.0);vec2 sm=cm.xy/cm.w*0.5+0.5;if(vpos(sm).z>m.z)b=m;else a=m;}
        vec4 cb=proj*vec4(b,1.0);vec2 sb=cb.xy/cb.w*0.5+0.5;vec2 ed=min(sb,1.0-sb);col=mix(col,texture2D(tC,sb).rgb,smoothstep(0.0,0.08,min(ed.x,ed.y)));break;}}
    float fr=0.08+0.92*pow(1.0-max(dot(-V,N),0.0),5.0);return mix(base,col,k*mix(0.35,0.95,fr));}
  void main(){vec2 uv=vUv;vec4 c4=texture2D(tC,uv);vec3 c=c4.rgb;
    if(refl>0.5&&c4.a<0.95)c=ssr(uv,c,c4.a<0.6?0.8:0.42);
    if(texture2D(tD,uv).r<0.99999){vec3 P=vpos(uv);vec3 Wp=(camW*vec4(P,1.0)).xyz;float dist=length(P);
      float hf=smoothstep(8.0,-1.0,Wp.y)*(1.0-exp(-max(dist-3.0,0.0)*0.06));c=mix(c,fogc,hf*0.55);}
    c+=texture2D(tB,uv).rgb*0.55;
    float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),0.18);c=c*0.92+vec3(0.03,0.04,0.035);
    c=mix(c,c*c*(3.0-2.0*c),0.2);
    gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}`);
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),post);postScene.add(quad);
function runPass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(postScene,postCam);}
function sizeRT(){const rw=Math.round(innerWidth*PR),rh=Math.round(innerHeight*PR),qw=Math.max(1,Math.round(rw/4)),qh=Math.max(1,Math.round(rh/4));rt.setSize(rw,rh);rtA.setSize(qw,qh);rtB.setSize(qw,qh);}
sizeRT();
function renderFrame(){
  renderer.setRenderTarget(rt);renderer.render(scene,camera);
  runPass(brightMat,rtA);
  for(const k of[1,2]){blurMat.uniforms.tI.value=rtA.texture;blurMat.uniforms.dir.value.set(k/rtA.width,0);runPass(blurMat,rtB);blurMat.uniforms.tI.value=rtB.texture;blurMat.uniforms.dir.value.set(0,k/rtA.height);runPass(blurMat,rtA);}
  runPass(post,null);
}
{const b=document.getElementById('refl');const show=()=>{b.setAttribute('aria-pressed',String(opts.refl));post.uniforms.refl.value=opts.refl?1:0;};show();
  b.addEventListener('click',()=>{opts.refl=!opts.refl;show();try{localStorage.setItem('vfp-1',JSON.stringify(opts));}catch(e){}});}

/* ================= camminare in prima persona ================= */""")

# ---------- tick: rain update, quieter dust, render through post ----------
R1("  sunSprite.position.copy(camera.position).addScaledVector(sunDir,320);", "  sunSprite.position.copy(camera.position).addScaledVector(sunDir,320);skyDome.position.copy(camera.position);skyT.value=T;")
R1("    pollen.alpha[i]=0.3+0.45*Math.max(0,Math.sin(T*1.5+ph));}pollen.flush();", "    pollen.alpha[i]=0;}pollen.flush();")
R1("glint.alpha[i]=Math.pow(Math.max(0,Math.sin(T*2.4+glint.ph[i])),8);}glint.flush();", "glint.alpha[i]=0;}glint.flush();")
R1("  renderer.render(scene,camera);requestAnimationFrame(tick);", r"""  // pioggia
  for(let i=0;i<RAIN_N;i++){let x=rainPos[i*6],y=rainPos[i*6+1],z=rainPos[i*6+2];
    y-=rainV[i]*dt;x=wrap(x+0.9*dt,player.x,20);z=wrap(z+0.6*dt,player.z,20);
    const gy=groundAt(x,z)+(Math.hypot(x,z)<4.4?0.9:0);
    if(y<gy){if(rnd()<.3){const k=rsI++%rsplash.n,a=rnd()*7;rsplash.pos[k*3]=x;rsplash.pos[k*3+1]=gy+.02;rsplash.pos[k*3+2]=z;rsplash.vel[k*3]=Math.cos(a)*R(.2,.5);rsplash.vel[k*3+1]=R(.6,1.1);rsplash.vel[k*3+2]=Math.sin(a)*R(.2,.5);rsplash.life[k]=.25;rsplash.size[k]=R(.03,.06);rsplash.setCol(k,0xd0d8d4);}y=gy+R(12,15);}
    rainPos[i*6]=x;rainPos[i*6+1]=y;rainPos[i*6+2]=z;rainPos[i*6+3]=x-0.04;rainPos[i*6+4]=y+rainL[i];rainPos[i*6+5]=z-0.03;}
  rainGeo.attributes.position.needsUpdate=true;
  {const p=rsplash.pos,v=rsplash.vel;for(let i=0;i<rsplash.n;i++){rsplash.life[i]-=dt;if(rsplash.life[i]<=0){rsplash.alpha[i]=0;continue;}v[i*3+1]-=9.8*dt;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;rsplash.alpha[i]=rsplash.life[i]*3;}rsplash.flush();}

  renderFrame();requestAnimationFrame(tick);""")
R1("addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?76:66;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);setPsScale();});",
   "addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<innerHeight?76:66;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);setPsScale();sizeRT();});")

# particle shader writes fog-aware colour and leaves the reflection flag alone
R1("void main(){vec4 t=texture2D(map,gl_PointCoord);float a=t.a*vA;if(a<0.02)discard;gl_FragColor=vec4(vC*t.rgb,a);}`;",
   "void main(){vec4 t=texture2D(map,gl_PointCoord);float a=t.a*vA;if(a<0.02)discard;gl_FragColor=vec4(vC*t.rgb,a);}`;")

out = head + body

# ---------- filtro a righe come nella foto, acqua simulata come nelle versioni voxel ----------
def R2(a,b):
    global out
    assert out.count(a)==1,a[:90]; out=out.replace(a,b)
R2('<div class="filters"><button class="act" id="refl" type="button" aria-pressed="true">Riflessi</button></div>',
   '<div class="filters"><button class="act" id="scan" type="button" aria-pressed="true">Linee</button><button class="act" id="refl" type="button" aria-pressed="true">Riflessi</button></div>')
R2("const opts={refl:true};try{const s=JSON.parse(localStorage.getItem('vfp-1')||'{}');if(typeof s.refl==='boolean')opts.refl=s.refl;}catch(e){}",
   "const opts={refl:true,scan:true};try{const s=JSON.parse(localStorage.getItem('vfp-3')||'{}');for(const k of['refl','scan'])if(typeof s[k]==='boolean')opts[k]=s[k];}catch(e){}")
R2("const post=pass({tC:{value:rt.texture},tD:{value:rt.depthTexture},tB:{value:rtA.texture},refl:{value:1},wt:waterT,fogc:{value:FOG},",
   "const post=pass({tC:{value:rt.texture},tD:{value:rt.depthTexture},tB:{value:rtA.texture},refl:{value:1},scan:{value:1},px:{value:1},wt:waterT,fogc:{value:FOG},")
R2("`uniform sampler2D tC,tD,tB;uniform float refl,wt;uniform vec3 fogc;uniform mat4 proj,projInv,view,camW;varying vec2 vUv;",
   "`uniform sampler2D tC,tD,tB;uniform float refl,wt,scan,px;uniform vec3 fogc;uniform mat4 proj,projInv,view,camW;varying vec2 vUv;\n  float gr(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}")
R2("    c=mix(c,c*c*(3.0-2.0*c),0.2);\n    gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}`);",
   "    c=mix(c,c*c*(3.0-2.0*c),0.2);\n    if(scan>0.5){float ln=mod(floor(gl_FragCoord.y/px),3.0);c*=ln<1.0?0.72:1.05;c+=(gr(floor(gl_FragCoord.xy/px)+floor(wt*30.0))-0.5)*0.025;}\n    gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}`);")
R2("function sizeRT(){const rw=Math.round(innerWidth*PR),rh=Math.round(innerHeight*PR),qw=Math.max(1,Math.round(rw/4)),qh=Math.max(1,Math.round(rh/4));rt.setSize(rw,rh);rtA.setSize(qw,qh);rtB.setSize(qw,qh);}",
   "function sizeRT(){const rw=Math.round(innerWidth*PR),rh=Math.round(innerHeight*PR),qw=Math.max(1,Math.round(rw/4)),qh=Math.max(1,Math.round(rh/4));rt.setSize(rw,rh);rtA.setSize(qw,qh);rtB.setSize(qw,qh);post.uniforms.px.value=1;}")
R2("{const b=document.getElementById('refl');const show=()=>{b.setAttribute('aria-pressed',String(opts.refl));post.uniforms.refl.value=opts.refl?1:0;};show();\n  b.addEventListener('click',()=>{opts.refl=!opts.refl;show();try{localStorage.setItem('vfp-1',JSON.stringify(opts));}catch(e){}});}",
   "for(const id of['refl','scan']){const b=document.getElementById(id);const show=()=>{b.setAttribute('aria-pressed',String(opts[id]));post.uniforms.refl.value=opts.refl?1:0;post.uniforms.scan.value=opts.scan?1:0;};show();\n  b.addEventListener('click',()=>{opts[id]=!opts[id];show();try{localStorage.setItem('vfp-3',JSON.stringify(opts));}catch(e){}});}")

# acqua: superfici con onde simulate e veli d'acqua che scorrono, nei colori della pioggia
wp=open('/home/claude/vox/pioggia/water_port.js').read()
wp=wp.replace("col=mix(col,fogC,smoothstep(fN,fF,vD));","col=mix(col,fogC,1.0-exp(-fN*fN*vD*vD));")
wp=wp.replace("fN: { value: scene.fog.near }, fF: { value: scene.fog.far }","fN: { value: 0.03 }, fF: { value: 0 }")
wp=wp.replace("deep: { value: new THREE.Color(o.deep || 0x2f86c9) }, base: { value: new THREE.Color(o.base || 0x46ade6) }, lite: { value: new THREE.Color(o.lite || 0x9fdcff) },","deep: { value: new THREE.Color(0x203a38) }, base: { value: new THREE.Color(0x30504a) }, lite: { value: new THREE.Color(0x6a8a82) },")
wp=wp.replace("deep: { value: new THREE.Color(0x2f86c9) }, base: { value: new THREE.Color(0x46ade6) }, lite: { value: new THREE.Color(0x9fdcff) },","deep: { value: new THREE.Color(0x203a38) }, base: { value: new THREE.Color(0x30504a) }, lite: { value: new THREE.Color(0x6a8a82) },")
wp=wp.replace("foam: { value: new THREE.Color(o.foam || 0xf4fbff) },","foam: { value: new THREE.Color(0xc4d0ca) },").replace("foam: { value: new THREE.Color(0xf4fbff) },","foam: { value: new THREE.Color(0xc4d0ca) },")
wp=wp.replace("deep: { value: new THREE.Color(0x4aa8e0) }, base: { value: new THREE.Color(0x9fdcff) }, lite: { value: new THREE.Color(0xeaf8ff) },","deep: { value: new THREE.Color(0x5f7c76) }, base: { value: new THREE.Color(0x9db2ab) }, lite: { value: new THREE.Color(0xd8e2de) },")
wp=wp.replace("col=mix(col,vec3(1.0),step(0.55,sp));","col=mix(col,vec3(0.85,0.9,0.88),step(0.7,sp)*0.6);")
assert "exp(-fN*fN*vD*vD)" in wp and "0x203a38" in wp and "0x5f7c76" in wp and "0xc4d0ca" in wp
glue=r"""
/* ================= acqua viva: onde simulate nelle vasche e nel fiume, veli d'acqua che scorrono ================= */
const newWater=new THREE.Group();scene.add(newWater);
""" + wp + r"""
scene.traverse(o=>{const u=o.material&&o.material.uniforms;if(u&&u.dens&&!u.hm)o.visible=false;});
ripples.forEach(r=>r.m.visible=false);fount.pts.visible=false;fall.pts.visible=false;
const basinF=r=>(x,z)=>Math.hypot(x,z)<r;
const simLow=new Sim(64,64,-3.6,-3.6,7.2,7.2,basinF(3.52)),simMid=new Sim(32,32,-1.75,-1.75,3.5,3.5,basinF(1.68)),simTop=new Sim(16,16,-0.72,-0.72,1.44,1.44,basinF(0.68));
const RLEN=RX1-RX0,simRiv=new Sim(384,24,RX0,RZ-RW/2,RLEN,RW,(x,z)=>Math.abs(z-RZ)<RW/2-0.15,true);
surface(simLow,FY+0.9,48,48,{kind:0,rad:3.52,ringR:2.5,amp:0.035});
surface(simMid,FY+3.89,24,24,{kind:0,rad:1.68,ringR:0.95,amp:0.03});
surface(simTop,FY+4.99,12,12,{kind:0,rad:0.68,ringR:0.4,amp:0.025});
surface(simRiv,0.135,256,12,{kind:1,flow:1.4,amp:0.04});
const ringF=(r0,vr,y0,vy,tEnd)=>(u,v)=>{const a=u*PI*2,t=v*tEnd,r=r0+vr*t;return[Math.cos(a)*r,y0+vy*t-4.9*t*t,Math.sin(a)*r];};
ribbon(10,40,(u,v)=>{const t=v*2.6,w=1+0.3*v;return[RX1-0.05+2.0*t,0.13+0.35*t-4.9*t*t,RZ+(u-.5)*(RW-0.3)*w];},{NU:56,NV:520,speed:70,gap:0.06,fadeA:0.4});
ribbon(64,10,ringF(1.8,0.9,FY+3.87,0,0.78),{NU:200,NV:46,speed:34,gap:0.22});
ribbon(32,8,ringF(0.76,0.4,FY+4.98,0,0.47),{NU:80,NV:22,speed:26,gap:0.25});
ribbon(24,14,ringF(0.12,0.5,FY+5.93,1.0,0.56),{NU:36,NV:44,speed:30,gap:0.55});
let simAcc=0;
function waterStep(dt){
  for(let n=0;n<4;n++){const a=rnd()*PI*2;simLow.drop(Math.cos(a)*2.5,Math.sin(a)*2.5,0.35,1);}
  for(let n=0;n<2;n++){const a=rnd()*PI*2;simMid.drop(Math.cos(a)*0.95,Math.sin(a)*0.95,0.3,1);}
  {const a=rnd()*PI*2;simTop.drop(Math.cos(a)*0.4,Math.sin(a)*0.4,0.3,1);}
  if(rnd()<.5)simRiv.drop(RX0+R(0.2,1.2),RZ+R(-1.6,1.6),0.5,1);
  // la pioggia sull'acqua
  for(let n=0;n<3;n++){const a=rnd()*PI*2,r=Math.sqrt(rnd())*3.4;simLow.drop(Math.cos(a)*r,Math.sin(a)*r,0.18,1);}
  {const a=rnd()*PI*2,r=Math.sqrt(rnd())*1.6;simMid.drop(Math.cos(a)*r,Math.sin(a)*r,0.15,1);}
  for(let n=0;n<6;n++)simRiv.drop(R(RX0,RX1),RZ+R(-1.8,1.8),0.16,1);
  simRiv.off=(T*1.4/RLEN)%1;simRiv.mat.uniforms.off.value=simRiv.off;
  simAcc=Math.min(simAcc+dt,0.06);
  while(simAcc>=1/60){simLow.step(0.982);simMid.step(0.975);simTop.step(0.96);simRiv.step(0.985);simAcc-=1/60;}
  simLow.upload();simMid.upload();simTop.upload();simRiv.upload();
}
"""
R2("/* ================= pioggia ================= */", glue+"\n/* ================= pioggia ================= */")

# ---------- più dettagli: lanterne di carta, vasi, casse, edera, gocce dalle grondaie, pozzanghere ----------
R2("if(refl>0.5&&c4.a<0.95)c=ssr(uv,c,c4.a<0.6?0.8:0.42);","if(refl>0.5&&c4.a<0.95)c=ssr(uv,c,c4.a<0.6?0.8:(c4.a<0.75?0.42:0.2));")
R2("  return {rad:Math.max(W2,D2)*0.72+0.3,hook:new V(0,h1+h2*0.55,D2/2+0.1)};",
   "  const eaves=[];for(const s of[-1,1])for(let k=0;k<8;k++)eaves.push(new V(s*(W2/2+0.45),h1+h2-0.45*rh/(W2/2)-0.06,-(D2+0.9)/2+(k+.5)/8*(D2+0.9)));\n  return {rad:Math.max(W2,D2)*0.72+0.3,hook:new V(0,h1+h2*0.55,D2/2+0.1),eaves};")
R2("  return {rad:r+1.0,hook:new V(0,h*0.85,r)};","  const eaves=[];for(let k=0;k<12;k++){const a=k/12*PI*2;eaves.push(new V(Math.cos(a)*(r+0.75),h-0.05,Math.sin(a)*(r+0.75)));}\n  return {rad:r+1.0,hook:new V(0,h*0.85,r),eaves};")
R2("  return {rad:w*0.75+0.5,hook:new V(0,h*0.55,w/2)};","  const eaves=[];for(let k=0;k<8;k++){const a=k/8*PI*2+PI/8;eaves.push(new V(Math.cos(a)*w*0.72,h-0.05,Math.sin(a)*w*0.72));}\n  return {rad:w*0.75+0.5,hook:new V(0,h*0.55,w/2),eaves};")
R2("function house(x,z,ring){",r"""const lanterns=[],dripPts=[],lantPend=[];
const LANT_MAT=new THREE.MeshBasicMaterial({color:0xff8048}),IVY_MAT=new THREE.MeshLambertMaterial({map:TEX.ivy,alphaTest:0.5,side:THREE.DoubleSide,color:0xb8c4a8});
function houseDetails(g,info,ring){
  const fz=info.hook.z;
  if(rnd()<(ring?0.8:0.5)){
    const side=rnd()<.5?-1:1,lx=side*0.95,ly=2.35;
    P(g,B(0.04,0.04,0.42),0x2f3550,lx,ly+0.32,fz+0.2,{line:0});
    const pv=new THREE.Group();pv.position.set(lx,ly+0.32,fz+0.4);g.add(pv);
    const cord=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.2,4),tm(0x2f3550));cord.position.y=-0.1;pv.add(cord);
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,8),LANT_MAT);body.scale.y=1.3;body.position.y=-0.4;pv.add(body);
    for(const yy of[-0.18,-0.62]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.05,10),tm(0x2a2420));cap.position.y=yy;pv.add(cap);}
    const tas=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.22,4),LANT_MAT);tas.position.y=-0.76;pv.add(tas);
    lantPend.push(pv);
  }
  for(const s of[-1,1])if(rnd()<.7){const px=s*R(0.95,1.6),pz=fz+R(0.25,0.5);P(g,CY(0.18,0.13,0.3,10),0xa0583a,px,0.15,pz,{line:0});P(g,SP(R(0.2,0.3),1),pick([0x4f7a3a,0x5a8a42,0x3f6a34]),px,0.42,pz,{line:0});
    if(rnd()<.5)for(let k=0;k<4;k++)P(g,SP(0.05,0),pick(FLOW),px+R(-.15,.15),0.55+R(0,.1),pz+R(-.15,.15),{line:0,cast:false});}
  if(rnd()<.35){const sx=(rnd()<.5?-1:1)*R(1.7,2.2);crate(g,sx,0,fz+0.5,0.5,R(-.3,.3));if(rnd()<.6)crate(g,sx+0.05,0.5,fz+0.5,0.4,R(-.3,.3));}
  if(rnd()<.5){const w=R(0.8,1.5),h=R(1.8,3.0),px=(rnd()<.5?-1:1)*R(0.5,1.3);const gi=new THREE.PlaneGeometry(w,h);uvS(gi,w/0.8,h/0.8);const m=new THREE.Mesh(gi,IVY_MAT);m.position.set(px,h/2,fz+0.07);m.receiveShadow=true;g.add(m);}
}
function house(x,z,ring){""")
R2("  const t=rnd(),info=t<0.6?timberHouse(g,ring):t<0.82?roundHouse(g):tallHouse(g);",
   "  const t=rnd(),info=t<0.6?timberHouse(g,ring):t<0.82?roundHouse(g):tallHouse(g);\n  houseDetails(g,info,ring);")
R2("  if(ring)ringHooks.push(g.localToWorld(info.hook.clone()));\n}",
   "  if(ring)ringHooks.push(g.localToWorld(info.hook.clone()));\n  info.eaves.forEach(p=>dripPts.push(g.localToWorld(p.clone())));\n  lantPend.splice(0).forEach(pv=>{scene.attach(pv);lanterns.push({pv,ph:rnd()*6});});\n}")
R2("scene.traverse(o=>{const u=o.material&&o.material.uniforms;if(u&&u.dens&&!u.hm)o.visible=false;});",
   r"""scene.traverse(o=>{const u=o.material&&o.material.uniforms;if(u&&u.dens&&!u.hm&&!o.userData.keep)o.visible=false;});
// pozzanghere sul selciato: riflettono e si increspano di gocce
for(let k=0;k<11;k++){const a=rnd()*PI*2,r=R(5.4,10.4),g=new THREE.CircleGeometry(1,18);g.rotateX(-PI/2);
  const pa=g.attributes.position;for(let i=1;i<pa.count;i++){const ang=Math.atan2(pa.getZ(i),pa.getX(i));const f=0.75+0.35*Math.sin(ang*3+k)+0.15*Math.sin(ang*5+k*2);pa.setX(i,pa.getX(i)*f);pa.setZ(i,pa.getZ(i)*f);}
  const m=new THREE.Mesh(g,waterMat());m.userData.keep=true;m.scale.set(R(0.5,1.2),1,R(0.4,0.9));m.rotation.y=rnd()*PI;m.position.set(Math.cos(a)*r,0.262,Math.sin(a)*r);scene.add(m);}""")

# ---------- fumo morbido e banchi di nebbia ----------
R2("/* ================= pioggia ================= */", r"""/* ================= fumo morbido e banchi di nebbia (particelle morbide, a billboard) ================= */
const softTex=(()=>{const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S);
  const vn=(X,Y,o)=>{const xi=Math.floor(X),yi=Math.floor(Y),xf=X-xi,yf=Y-yi,sm=t=>t*t*(3-2*t),a=hn(xi,yi,o),b=hn(xi+1,yi,o),c2=hn(xi,yi+1,o),d=hn(xi+1,yi+1,o),u=sm(xf),v=sm(yf);return a+(b-a)*u+(c2-a)*v+(a-b-c2+d)*u*v;};
  for(let y=0;y<S;y++)for(let X=0;X<S;X++){const dx=(X+.5)/S*2-1,dy=(y+.5)/S*2-1,r=Math.hypot(dx,dy),n=vn(X/16,y/16,50)*.55+vn(X/8,y/8,51)*.3+vn(X/4,y/4,52)*.15;
    const a=Math.max(0,Math.min(1,(1-r*1.05-(0.5-n)*0.9)*1.6));const k=(y*S+X)*4;im.data[k]=im.data[k+1]=im.data[k+2]=255;im.data[k+3]=a*a*255;}
  x.putImageData(im,0,0);return new THREE.CanvasTexture(c);})();
function softSys(n){
  const g=new THREE.InstancedBufferGeometry(),base=new THREE.PlaneGeometry(1,1);g.index=base.index;g.setAttribute('position',base.attributes.position);g.setAttribute('uv',base.attributes.uv);
  const o={n,off:new Float32Array(n*3),sz:new Float32Array(n),al:new Float32Array(n),rot:new Float32Array(n),tint:new Float32Array(n*3),life:new Float32Array(n),ph:new Float32Array(n),g};
  g.setAttribute('ioff',new THREE.InstancedBufferAttribute(o.off,3));g.setAttribute('isz',new THREE.InstancedBufferAttribute(o.sz,1));g.setAttribute('ial',new THREE.InstancedBufferAttribute(o.al,1));
  g.setAttribute('irot',new THREE.InstancedBufferAttribute(o.rot,1));g.setAttribute('itint',new THREE.InstancedBufferAttribute(o.tint,3));g.instanceCount=n;
  const mat=new THREE.ShaderMaterial({uniforms:{map:{value:softTex},fogC:{value:FOG},dens:{value:0.03}},transparent:true,depthWrite:false,
    vertexShader:`attribute vec3 ioff;attribute float isz,ial,irot;attribute vec3 itint;varying vec2 vUv;varying float vA,vD;varying vec3 vT;
      void main(){vec4 mv=viewMatrix*vec4(ioff,1.0);float c=cos(irot),s=sin(irot);mv.xy+=mat2(c,s,-s,c)*position.xy*isz;vUv=uv;vA=ial;vT=itint;vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform sampler2D map;uniform vec3 fogC;uniform float dens;varying vec2 vUv;varying float vA,vD;varying vec3 vT;
      void main(){float a=texture2D(map,vUv).a*vA*smoothstep(0.2,1.8,vD);if(a<0.004)discard;vec3 col=vT*(0.86+0.24*vUv.y);col=mix(col,fogC,1.0-exp(-dens*dens*vD*vD));gl_FragColor=vec4(col,a);}`});
  const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=5;scene.add(m);
  for(let i=0;i<n;i++)o.ph[i]=rnd()*100;
  o.set=(i,x,y,z,size,a,r,t)=>{o.off[i*3]=x;o.off[i*3+1]=y;o.off[i*3+2]=z;o.sz[i]=size;o.al[i]=a;o.rot[i]=r;o.tint[i*3]=t[0];o.tint[i*3+1]=t[1];o.tint[i*3+2]=t[2];};
  o.flush=()=>{for(const k of['ioff','isz','ial','irot','itint'])g.attributes[k].needsUpdate=true;};
  return o;
}
puffs.forEach(p=>p.m.visible=false);
const SMK=[0.74,0.75,0.73],FOGT=[0.7,0.76,0.72],MISTT=[0.86,0.9,0.88];
const smokeSoft=softSys(Math.max(1,smokeBases.length*12));
const fogBank=softSys(40);for(let i=0;i<fogBank.n;i++){fogBank.off[i*3]=R(-35,35);fogBank.off[i*3+1]=R(0.5,2.4);fogBank.off[i*3+2]=R(-35,35);fogBank.sz[i]=R(6,13);}
const fallMist=softSys(28),poolMist=softSys(16);
function softTick(dt){
  {const s=smokeSoft;for(let i=0;i<s.n;i++){const b=smokeBases[Math.floor(i/12)];if(!b){s.al[i]=0;continue;}const L=7,t=((T+s.ph[i]*L)%L)/L,ph=s.ph[i];
    const up=0.6*L*t*(1-t*0.25),dr=t*L*0.45;
    s.set(i,b.x+dr*0.8+Math.sin(t*5+ph)*0.25*t,b.y+up,b.z+dr*0.6+Math.cos(t*4+ph)*0.25*t,0.45+t*2.8,0.5*Math.pow(Math.sin(PI*Math.min(1,t*1.15)),0.8)*(1-t*0.3),ph+t*1.3,SMK);}s.flush();}
  {const s=fogBank;for(let i=0;i<s.n;i++){const ph=s.ph[i];s.off[i*3]=wrap(s.off[i*3]+0.35*dt,player.x,35);s.off[i*3+2]=wrap(s.off[i*3+2]+0.22*dt,player.z,35);
    const ex=s.off[i*3]-player.x,ez=s.off[i*3+2]-player.z,edge=1-Math.min(1,Math.max(Math.abs(ex),Math.abs(ez))/35);
    s.al[i]=(0.14+0.06*Math.sin(T*0.3+ph))*Math.min(1,edge*3);s.rot[i]=ph+T*0.02;s.tint.set(FOGT,i*3);}s.flush();}
  {const s=fallMist;for(let i=0;i<s.n;i++){const L=5,t=((T+s.ph[i]*L)%L)/L,ph=s.ph[i];s.set(i,RX1+1+t*3.5+Math.sin(ph)*1.2,-1-t*9-Math.cos(ph)*2,RZ+Math.sin(ph*3)*2.5,1.2+t*4,0.35*Math.sin(PI*t),ph+t,MISTT);}s.flush();}
  {const s=poolMist;for(let i=0;i<s.n;i++){const L=4,t=((T+s.ph[i]*L)%L)/L,ph=s.ph[i],a=ph*7;s.set(i,Math.cos(a)*2.5,1.2+t*1.2,Math.sin(a)*2.5,0.6+t*1.4,0.22*Math.sin(PI*t),ph+t,MISTT);}s.flush();}
}

/* ================= gocce che cadono dalle grondaie ================= */
const DRIP_N=320,dripPos=new Float32Array(DRIP_N*6),dripV=new Float32Array(DRIP_N);
const dripGeo=new THREE.BufferGeometry();dripGeo.setAttribute('position',new THREE.BufferAttribute(dripPos,3));
const dripLines=new THREE.LineSegments(dripGeo,new THREE.LineBasicMaterial({color:0xd0d8d4,transparent:true,opacity:0.7,depthWrite:false}));dripLines.frustumCulled=false;scene.add(dripLines);
for(let i=0;i<DRIP_N;i++)dripPos[i*6+1]=-99;
function dripTick(dt){
  for(let i=0;i<DRIP_N;i++){let y=dripPos[i*6+1];
    if(y<-50){if(dripPts.length&&rnd()<0.08){const p=dripPts[(rnd()*dripPts.length)|0];if(Math.hypot(p.x-player.x,p.z-player.z)<28){dripPos[i*6]=p.x+R(-.2,.2);dripPos[i*6+2]=p.z+R(-.2,.2);dripPos[i*6+1]=p.y;dripV[i]=R(0,1);}}continue;}
    dripV[i]+=9.8*dt;y-=dripV[i]*dt;const x=dripPos[i*6],z=dripPos[i*6+2];
    if(y<groundAt(x,z)){const k=rsI++%rsplash.n,a=rnd()*7;rsplash.pos[k*3]=x;rsplash.pos[k*3+1]=groundAt(x,z)+.02;rsplash.pos[k*3+2]=z;rsplash.vel[k*3]=Math.cos(a)*R(.2,.5);rsplash.vel[k*3+1]=R(.6,1.1);rsplash.vel[k*3+2]=Math.sin(a)*R(.2,.5);rsplash.life[k]=.25;rsplash.size[k]=R(.03,.06);rsplash.setCol(k,0xd0d8d4);dripPos[i*6+1]=-99;dripPos[i*6+4]=-99;continue;}
    dripPos[i*6+1]=y;dripPos[i*6+3]=x;dripPos[i*6+4]=y+0.12+dripV[i]*0.02;dripPos[i*6+5]=z;}
  dripGeo.attributes.position.needsUpdate=true;
}

/* ================= pioggia ================= */""")
R2("  // pioggia\n  for(let i=0;i<RAIN_N;i++){","  softTick(dt);dripTick(dt);\n  lanterns.forEach(l=>{l.pv.rotation.z=Math.sin(T*1.3+l.ph)*0.08;l.pv.rotation.x=Math.cos(T*1.1+l.ph)*0.06;});\n  // pioggia\n  for(let i=0;i<RAIN_N;i++){")

R2("  const p=new THREE.Points(g,m);p.frustumCulled=false;scene.add(p);","  const p=new THREE.Points(g,m);p.frustumCulled=false;scene.add(p);o.pts=p;")
R2("  // pioggia\n  for(let i=0;i<RAIN_N;i++){","  waterStep(dt);\n  // pioggia\n  for(let i=0;i<RAIN_N;i++){")

# ---------- lanterne di carta dettagliate ----------
R2("""    const pv=new THREE.Group();pv.position.set(lx,ly+0.32,fz+0.4);g.add(pv);
    const cord=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.2,4),tm(0x2f3550));cord.position.y=-0.1;pv.add(cord);
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.17,12,8),LANT_MAT);body.scale.y=1.3;body.position.y=-0.4;pv.add(body);
    for(const yy of[-0.18,-0.62]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.05,10),tm(0x2a2420));cap.position.y=yy;pv.add(cap);}
    const tas=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.22,4),LANT_MAT);tas.position.y=-0.76;pv.add(tas);
    lantPend.push(pv);""","""    P(g,B(0.03,0.22,0.03),0x2f3550,lx,ly+0.2,fz+0.03,{line:0});P(g,CY(0.012,0.012,0.36,5),0x2f3550,lx,ly+0.08,fz+0.2,{rot:[PI/2-0.5,0,0],line:0});
    const pv=paperLantern();pv.position.set(lx,ly+0.32,fz+0.4);g.add(pv);
    lantPend.push(pv);""")
R2("function houseDetails(g,info,ring){",r"""// lanterna di carta: corpo tornito a spicchi, nervature di bambù, tappi di legno, gancio, nappa con perlina
const lanTex=pix(32,(u,v)=>{const glow=Math.sin(Math.PI*v/32);let r=170+glow*80,g=40+glow*55,b=24+glow*20;
  if(v%6===0){r*=.62;g*=.55;b*=.55;}if(u%4===0){r*=.86;g*=.84;b*=.84;}
  if(v>=24&&v<=27){r=200+glow*40;g=150+glow*40;b=60;if((u+v)%4===0){r*=.7;g*=.6;}}
  const cu=(u%16)-8,cv=v-13,d=Math.hypot(cu,cv*1.2);if(d>3&&d<4.4){r*=.5;g*=.4;b*=.4;}if(d<1.2){r*=.55;g*=.45;b*=.45;}
  return[r,g,b];});
lanTex.wrapS=THREE.RepeatWrapping;
const LANT_PAPER=new THREE.MeshBasicMaterial({map:lanTex,side:THREE.DoubleSide}),LANT_RIB=new THREE.MeshBasicMaterial({color:0x4a160e}),LANT_WOOD=tm(0x2a2420),LANT_GOLD=tm(0xc9a24a),LANT_TAS=new THREE.MeshBasicMaterial({color:0xd84a2a});
const lanProfile=[];for(let i=0;i<=14;i++){const t=i/14;lanProfile.push(new THREE.Vector2(0.055+0.135*Math.pow(Math.sin(Math.PI*(0.06+t*0.88)),0.8),-t*0.44));}
const lanGeo=new THREE.LatheGeometry(lanProfile,20);
function paperLantern(){
  const pv=new THREE.Group(),add=(geo,mat,y,rx)=>{const m=new THREE.Mesh(geo,mat);m.position.y=y;if(rx)m.rotation.x=rx;pv.add(m);return m;};
  add(new THREE.CylinderGeometry(0.005,0.005,0.16,4),LANT_WOOD,-0.08);
  add(new THREE.TorusGeometry(0.02,0.005,4,10),LANT_GOLD,-0.165,0);
  add(new THREE.CylinderGeometry(0.075,0.085,0.04,14),LANT_WOOD,-0.2);add(new THREE.CylinderGeometry(0.06,0.06,0.015,14),LANT_GOLD,-0.177);
  add(lanGeo,LANT_PAPER,-0.215);
  for(let k=1;k<6;k++){const t=k/6,r=0.055+0.135*Math.pow(Math.sin(Math.PI*(0.06+t*0.88)),0.8);add(new THREE.TorusGeometry(r+0.003,0.004,4,24),LANT_RIB,-0.215-t*0.44,PI/2);}
  add(new THREE.CylinderGeometry(0.085,0.075,0.04,14),LANT_WOOD,-0.67);add(new THREE.CylinderGeometry(0.06,0.06,0.015,14),LANT_GOLD,-0.693);
  add(new THREE.SphereGeometry(0.022,8,6),LANT_GOLD,-0.72);
  for(let k=0;k<6;k++){const a=k/6*PI*2,m=add(new THREE.CylinderGeometry(0.005,0.003,0.2,4),LANT_TAS,-0.83);m.position.x=Math.cos(a)*0.012;m.position.z=Math.sin(a)*0.012;m.rotation.z=Math.cos(a)*0.08;m.rotation.x=Math.sin(a)*0.08;}
  return pv;
}
function houseDetails(g,info,ring){""")
exec(open('/home/claude/vox/pioggia/rich.py').read())
open('/home/claude/vox/pioggia/valfiorita-pioggia.html', 'w').write(out)

# =================== versione di notte ===================
day=out
def N1(a,b):
    global out
    assert out.count(a)==1,a[:90]; out=out.replace(a,b)
N1("<title>Valfiorita sotto la pioggia</title>","<title>Valfiorita di notte</title>")
N1('<span class="eyebrow">Valfiorita · pioggia</span>','<span class="eyebrow">Valfiorita · notte di pioggia</span>')
N1('aria-label="Vista in prima persona dalla piazza del mercato di un borgo fantasy sotto la pioggia, nella nebbia"','aria-label="Vista in prima persona dalla piazza del mercato di un borgo fantasy di notte, sotto la pioggia, con le finestre accese"')
N1("html, body { height: 100%; margin: 0; overflow: hidden; background: #6f7a72;","html, body { height: 100%; margin: 0; overflow: hidden; background: #12181b;")
N1("const FOG=new THREE.Color(0x97a29a);","const FOG=new THREE.Color(0x26343a);")
N1("const WATER_K=1.0,CLIFF_K=1.0;","const WATER_K=0.42,CLIFF_K=0.3;")
N1("scene.fog=new THREE.FogExp2(FOG,0.03);","scene.fog=new THREE.FogExp2(FOG,0.034);")
N1("scene.add(new THREE.HemisphereLight(0xc8d0c8,0x4a5044,0.95));","scene.add(new THREE.HemisphereLight(0x5a6e88,0x1a1c1a,0.32));")
N1("scene.add(new THREE.AmbientLight(0xb8c4bc,0.18));","scene.add(new THREE.AmbientLight(0x3a4658,0.12));")
N1("const sun=new THREE.DirectionalLight(0xdfe4dc,0.28);","const sun=new THREE.DirectionalLight(0x8aa4d0,0.16);")
# luce per pixel, così le luci delle case disegnano macchie vere sui muri e a terra
N1("mats[k]=new THREE.MeshLambertMaterial(p);}}","p.shininess=10;p.specular=new THREE.Color(0x181818);mats[k]=new THREE.MeshPhongMaterial(p);}}")
# cielo di notte: nuvole basse illuminate dal basso dalle luci del borgo
N1("      vec3 col=mix(fogc*1.05,fogc*0.8,smoothstep(0.0,0.7,y));col=mix(col,col*0.84,smoothstep(0.45,0.75,c)*smoothstep(0.05,0.4,y));",
   "      vec3 col=mix(fogc*1.15+vec3(0.06,0.035,0.01)*(1.0-smoothstep(0.0,0.35,y)),vec3(0.035,0.045,0.07),smoothstep(0.0,0.7,y));col=mix(col,col*1.5+vec3(0.02,0.012,0.0),smoothstep(0.45,0.75,c)*smoothstep(0.05,0.5,y)*(1.0-y*0.6));")
# bagliore più forte, neri più profondi
N1("void main(){vec3 c=texture2D(tC,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));gl_FragColor=vec4(c*smoothstep(0.6,0.95,l),1.0);}","void main(){vec3 c=texture2D(tC,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));gl_FragColor=vec4(c*smoothstep(0.36,0.85,l),1.0);}")
N1("    c+=texture2D(tB,uv).rgb*0.55;","    c+=texture2D(tB,uv).rgb*0.95;")
N1("c=c*0.97+vec3(0.012,0.016,0.014);","c=c*0.97+vec3(0.006,0.01,0.016);")
N1("c=mix(c,vec3(l),0.08);c=clamp(c,0.0,1.0);c=mix(c,c*c*(3.0-2.0*c),0.35);","c=mix(c,vec3(l),0.04);c=clamp(c,0.0,1.0);c=mix(c,c*c*(3.0-2.0*c),0.2);")
N1("const SMK=[0.74,0.75,0.73],FOGT=[0.7,0.76,0.72],MISTT=[0.86,0.9,0.88];","const SMK=[0.2,0.21,0.22],FOGT=[0.14,0.17,0.19],MISTT=[0.24,0.28,0.3];")
N1("const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xc4ccc8,transparent:true,opacity:0.55,depthWrite:false}));",
   "const rainCol=new Float32Array(RAIN_N*6);rainGeo.setAttribute('color',new THREE.BufferAttribute(rainCol,3));\nconst rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.7,depthWrite:false}));")
N1("    rainPos[i*6]=x;rainPos[i*6+1]=y;rainPos[i*6+2]=z;rainPos[i*6+3]=x-0.04;rainPos[i*6+4]=y+rainL[i];rainPos[i*6+5]=z-0.03;}",
   "    rainPos[i*6]=x;rainPos[i*6+1]=y;rainPos[i*6+2]=z;rainPos[i*6+3]=x-0.04;rainPos[i*6+4]=y+rainL[i];rainPos[i*6+5]=z-0.03;\n    let L=0;for(const q of active){const dx=x-q.x,dy=y-q.y,dz=z-q.z;L+=q.k/(1+(dx*dx+dy*dy+dz*dz)*0.5);}L=Math.min(1.6,L);\n    const r=0.16+L*0.95,gg=0.19+L*0.68,bb=0.23+L*0.4;rainCol.set([r,gg,bb,r*.7,gg*.7,bb*.7],i*6);}\n  rainGeo.attributes.color.needsUpdate=true;")
N1("s.tint.set(FOGT,i*3);}s.flush();}","{let L=0;for(const q of active){const dx=s.off[i*3]-q.x,dz=s.off[i*3+2]-q.z;L+=q.k/(1+(dx*dx+dz*dz)*0.06);}L=Math.min(1.2,L);s.tint[i*3]=FOGT[0]+L*0.5;s.tint[i*3+1]=FOGT[1]+L*0.33;s.tint[i*3+2]=FOGT[2]+L*0.14;s.al[i]*=1.4;}}s.flush();}")
# raccogliere le sorgenti di luce: finestre, lampioni, lanterne
N1("function win(g,x,y,zf,sh,box){","const winPend=[];\nfunction win(g,x,y,zf,sh,box){winPend.push([g,x,y,zf]);")
N1("  lantPend.splice(0).forEach(pv=>{scene.attach(pv);lanterns.push({pv,ph:rnd()*6});});\n}",
   "  lantPend.splice(0).forEach(pv=>{scene.attach(pv);lanterns.push({pv,ph:rnd()*6});});\n  winPend.splice(0).forEach(([sg,x,y,zf])=>{const p=sg.localToWorld(new V(x,y,zf+0.12)),q=sg.localToWorld(new V(x,y,zf+1.12)).sub(p);LIGHTS.push({x:p.x,y:p.y,z:p.z,nx:q.x,nz:q.z,k:1,kind:'w'});});\n}")
N1("const lanterns=[],dripPts=[],lantPend=[];","const lanterns=[],dripPts=[],lantPend=[],LIGHTS=[];")
N1("/* ================= fumo morbido e banchi di nebbia", r"""/* ================= luci della notte ================= */
// 1) luci dinamiche: poche luci vere, sempre quelle più vicine a chi guarda (light culling)
// 2) macchie di luce a terra davanti a ogni finestra (light decal / pozze di luce), anche lontano
// 3) coni di luce nella nebbia e nella pioggia (falsi raggi volumetrici) e aloni attorno alle sorgenti (halo)
lampTops.forEach(p=>LIGHTS.push({x:p.x,y:p.y+0.25,z:p.z,nx:0,nz:0,k:1.3,kind:'l'}));
lanterns.forEach(l=>{const p=new V();l.pv.getWorldPosition(p);LIGHTS.push({x:p.x,y:p.y-0.42,z:p.z,nx:0,nz:0,k:0.9,kind:'p',lan:l});});
LIGHTS.push({x:0,y:FY+5.7,z:0,nx:0,nz:0,k:0.6,kind:'c'});
// quante luci vere regge la scheda video: sui telefoni il limite di uniform è basso
const GLc=renderer.getContext(),FUV=GLc.getParameter(GLc.MAX_FRAGMENT_UNIFORM_VECTORS)||64;
const NL=FUV>=1000?8:FUV>=200?6:FUV>=120?4:2,plights=[];for(let i=0;i<NL;i++){const L=new THREE.PointLight(0xffa458,0,7.5,2);scene.add(L);plights.push(L);}
let lightCheck=0;
function checkPrograms(){const bad=(renderer.info.programs||[]).some(p=>p.diagnostics&&!p.diagnostics.runnable);
  if(bad&&plights.length){plights.splice(0).forEach(L=>scene.remove(L));scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});return true;}return false;}
let active=[];
function pickLights(){
  const cx=camera.position.x,cz=camera.position.z;
  const sorted=LIGHTS.map(q=>({q,d:(q.x-cx)**2+(q.z-cz)**2})).sort((a,b)=>a.d-b.d).slice(0,NL);
  active=sorted.map(o=>o.q);
  if(!poolsBuilt)buildPools();
  if(lightCheck<3&&++lightCheck>1)checkPrograms();
  plights.forEach((L,i)=>{const q=active[i];if(!q){L.intensity=0;return;}const out=q.kind==='w'?0.55:0;L.position.set(q.x+q.nx*out,q.y,q.z+q.nz*out);
    L.color.setHex(q.kind==='l'?0xffcf8a:q.kind==='c'?0x8ff0ff:q.kind==='p'?0xff7a48:0xffa458);
    const fl=q.kind==='p'?0.85+0.15*Math.sin(T*9+q.x)+0.08*Math.sin(T*23+q.z):0.97+0.03*Math.sin(T*3+q.x);L.intensity=(q.kind==='w'?1.25:q.kind==='l'?1.6:1.1)*q.k*fl;L.distance=q.kind==='w'?7:8.5;});
}
const poolTex=pix(32,(u,v)=>{const d=Math.hypot((u+.5)/16-1,(v+.5)/16-1);const a=Math.max(0,1-d);const q=Math.round(a*a*6)/6;return G(q*255);});
const ADD={transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor};
const poolMat=new THREE.ShaderMaterial(Object.assign({uniforms:{map:{value:poolTex},dens:{value:0.034}},
  vertexShader:'varying vec2 vUv;varying vec3 vC;varying float vD;void main(){vUv=uv;vC=instanceColor;vec4 mv=viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.0);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;uniform float dens;varying vec2 vUv;varying vec3 vC;varying float vD;void main(){float a=texture2D(map,vUv).r*exp(-dens*dens*vD*vD);gl_FragColor=vec4(vC*a,1.0);}'},ADD));
let poolsBuilt=false;
function buildPools(){poolsBuilt=true;const n=LIGHTS.length,pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-PI/2);const m=new THREE.InstancedMesh(pg,poolMat,n),d=new THREE.Object3D(),c=new THREE.Color();
  LIGHTS.forEach((q,i)=>{const h=Math.max(0.5,q.y),out=q.kind==='w'?0.9+h*0.35:0;const x=q.x+q.nx*out,z=q.z+q.nz*out,gy=groundAt(x,z)+0.03;
    const s=q.kind==='w'?2.2+h*0.45:q.kind==='l'?5.5:q.kind==='c'?6:2.6;d.position.set(x,gy+(Math.hypot(x,z)<4.6?0.9:0),z);d.rotation.set(0,Math.atan2(q.nx,q.nz),0);d.scale.set(s,1,s*(q.kind==='w'?1.3:1));d.updateMatrix();m.setMatrixAt(i,d.matrix);
    const k=(q.kind==='w'?0.55/(1+h*0.25):q.kind==='l'?0.6:q.kind==='c'?0.3:0.4);c.setRGB(1.0*k,(q.kind==='c'?0.95:0.6)*k,(q.kind==='c'?1.0:0.3)*k);m.setColorAt(i,c);});
  m.frustumCulled=false;m.renderOrder=3;scene.add(m);}
// coni di luce dalle finestre: tronchi di piramide che si allargano verso il basso e sfumano
{const pos=[],fad=[],idx=[];let v0=0;
  LIGHTS.filter(q=>q.kind==='w').forEach(q=>{const nx=q.nx,nz=q.nz,tx=-nz,tz=nx,len=2.6,dn=Math.min(q.y-0.1,1.6);
    const near=[[-0.32,-0.42],[0.32,-0.42],[0.32,0.42],[-0.32,0.42]],far=[[-1.0,-1.0],[1.0,-1.0],[1.0,0.7],[-1.0,0.7]];
    const P0=near.map(([a,b])=>[q.x+tx*a,q.y+b,q.z+tz*a]),P1=far.map(([a,b])=>[q.x+tx*a+nx*len,q.y+b-dn,q.z+tz*a+nz*len]);
    for(let e=0;e<4;e++){const e2=(e+1)%4;[P0[e],P0[e2],P1[e2],P1[e]].forEach((p,k)=>{pos.push(...p);fad.push(k<2?0:1,(k===0||k===3)?0:1);});idx.push(v0,v0+1,v0+2,v0,v0+2,v0+3);v0+=4;}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('fade',new THREE.Float32BufferAttribute(fad,2));g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.ShaderMaterial(Object.assign({uniforms:{dens:{value:0.034},t:waterT},side:THREE.DoubleSide,
    vertexShader:'attribute vec2 fade;varying vec2 vF;varying float vD;varying vec3 vW;void main(){vF=fade;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float dens,t;varying vec2 vF;varying float vD;varying vec3 vW;void main(){float a=pow(1.0-vF.x,1.6)*(0.55+0.45*sin(vF.y*3.14159))*0.13;a*=0.85+0.15*sin(vW.y*9.0+t*6.0+vW.x*3.0);a*=exp(-dens*dens*vD*vD)*smoothstep(0.3,2.0,vD);gl_FragColor=vec4(vec3(1.0,0.66,0.34)*a,1.0);}'},ADD)));
  m.frustumCulled=false;m.renderOrder=6;scene.add(m);}

/* ================= fumo morbido e banchi di nebbia""")
# aloni attorno alle sorgenti: particelle morbide additive
N1("const smokeSoft=softSys(Math.max(1,smokeBases.length*12));","""const smokeSoft=softSys(Math.max(1,smokeBases.length*12));
const halo=softSys(LIGHTS.length);halo.g.attributes.ioff.array.length;halo.mat=null;
{const mesh=scene.children[scene.children.length-1];Object.assign(mesh.material,ADD);mesh.material.needsUpdate=true;mesh.renderOrder=7;
  LIGHTS.forEach((q,i)=>{const s=q.kind==='w'?1.5:q.kind==='l'?2.2:q.kind==='c'?3:1.3;const t=q.kind==='c'?[0.3,0.75,0.8]:q.kind==='l'?[0.85,0.68,0.42]:q.kind==='p'?[0.9,0.4,0.22]:[0.85,0.52,0.26];
    halo.set(i,q.x+q.nx*0.25,q.y,q.z+q.nz*0.25,s,0.55,rnd()*6,t);});halo.flush();}""")
N1("  {const s=fogBank;for(let i=0;i<s.n;i++){","  pickLights();\n  {const s=fogBank;for(let i=0;i<s.n;i++){")
N1("  lanterns.forEach(l=>{l.pv.rotation.z=Math.sin(T*1.3+l.ph)*0.08;l.pv.rotation.x=Math.cos(T*1.1+l.ph)*0.06;});",
   "  lanterns.forEach(l=>{l.pv.rotation.z=Math.sin(T*1.3+l.ph)*0.08;l.pv.rotation.x=Math.cos(T*1.1+l.ph)*0.06;});\n  {const a=halo.al;LIGHTS.forEach((q,i)=>{a[i]=(q.kind==='p'?0.5+0.12*Math.sin(T*9+q.x):0.5)*(q.kind==='w'?0.85:1);});halo.g.attributes.ial.needsUpdate=true;}")

N1('<div class="err panel" id="err" hidden>Il tuo dispositivo non supporta WebGL, quindi la scena non può essere mostrata.</div>','<div class="err panel" id="err" hidden>Il tuo dispositivo non supporta WebGL, quindi la scena non può essere mostrata.</div>\n<script>window.addEventListener("error",function(e){var d=document.getElementById("err");if(d){d.hidden=false;d.textContent="Errore nella scena: "+e.message+" (riga "+e.lineno+")";}});</script>')
open('/home/claude/vox/pioggia/valfiorita-notte.html', 'w').write(out)
open('/home/claude/vox/pioggia/night.js','w').write(out[out.rfind('<script>')+8:out.rfind('</script>')])
out=day
s = out[out.rfind('<script>') + 8:out.rfind('</script>')]
open('/home/claude/vox/pioggia/main.js', 'w').write(s)
print('ok', len(out))
# ---------- versione con la pioggia: base realistica ----------
exec(open('/home/claude/vox/pioggia/real.py').read())
open('/home/claude/vox/pioggia/valfiorita-pioggia.html', 'w').write(out)
open('/home/claude/vox/pioggia/main.js', 'w').write(out[out.rfind('<script>') + 8:out.rfind('</script>')])
print('real ok')
