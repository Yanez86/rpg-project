# ========== base realistica, solo per la versione con la pioggia ==========
def RA(a,b):
    global out
    assert out.count(a)>=1,a[:90]; out=out.replace(a,b)
# --- palette di materiali veri: intonaco sporco, legno scuro, ardesia; il colore saturo resta solo negli accenti
R2("const WALLS=[0xfff1d6,0xffd9b0,0xd7f0e0,0xe6dcff,0xfff3a8,0xffe0ea];","const WALLS=[0xd9cdb6,0xcbbd9f,0xbfb3a0,0xd4c4a4,0xc2b8a8,0xb8a890];")
R2("const ROOFS=[0xe0533d,0x2fa59a,0x3f7fd9,0x8a5cc9,0xf08a2c,0xd94f8a];","const ROOFS=[0x585e66,0x4c535a,0x666b70,0x5e5048,0x50565c,0x6a5a4e];")
R2("const SHUT=[0x3f7fd9,0x2fa59a,0xe0533d,0x5aa847,0x8a5cc9,0xf08a2c];","const SHUT=[0x3e3028,0x34444c,0x4e2e24,0x3c4634,0x46383e,0x5a4028];")
R2("const DOORS=[0x8a5a3c,0x3f7fd9,0x2fa59a,0xc94f4f,0x6b4a3a];","const DOORS=[0x4a3424,0x3a2a1e,0x34404a,0x5a2e24,0x2e2620];")
R2("const TIMBER=0x6b4a3a,STONE=0xddd0b8;","const TIMBER=0x3a2a20,STONE=0xa8a294;")
R2("c:pick([0xe0533d,0xffcf4a,0x2fa59a,0x3f7fd9,0xd94f8a,0xfff1d6,0x8a5cc9])","c:pick([0x8a2a24,0xa8843a,0x2f5a5a,0x34507a,0x6a2a48,0xc8bca0,0x4a3a5a])")
R2("const c=pick([0xffcf4a,0xff7b6b,0xff9fd0,0x9ff0ff]);","const c=pick([0xd8743a,0xc8502a,0xe09048]);")
R2("pick([0x7fc955,0x8fd35f,0x6fbb4c,0xa0dc6a])","pick([0x5a8a3c,0x6a9444,0x4f7e36,0x76a04c])")
R2("pick([0x5fbf4a,0x78cf55,0x4aa64f,0x8ad65c])","pick([0x4a7e36,0x5a8c3e,0x3f7034,0x66963f])")
R2("pick([0xffb3cf,0xff9cc4])","pick([0xc88a98,0xb87888])")
for a,b in [("0x6c4fd1","0x4c535a"),("0xbdb6cc","0xa8a49a"),("0xd4cde4","0xb4b0a6"),("0xa59fb8","0x96928a"),("0xc9c2d6","0xaaa69c"),
            ("0xfff1d6","0xd0c4ac"),("0xe0533d","0x8a3a2c"),("0xffcf4a","0xb08a48"),("0xfff8ea","0xc8bca6"),("0x6fae46","0x55803a")]:RA(a,b)
# --- variazione di tinta per pixel (hue shifting): ogni texture grigia diventa un mosaico di toni caldi e freddi
R2("const p=fn(u,v,S);const k=(y*S+X)*4;","const p=fn(u,v,S);if(p[0]===p[1]&&p[1]===p[2]){const t=(hn(X>>2,y>>2,91)-0.5)*0.24+(hn(X,y,92)-0.5)*0.08,gq=(hn(X>>3,y>>3,93)-0.5)*0.12;p[0]*=1+t;p[1]*=1+gq;p[2]*=1-t;}const k=(y*S+X)*4;")
# tegole d'ardesia: ogni tegola ha la sua tinta (più blu, più verde, più bruna)
R2("return G(b*(0.9+q*.16)-(lv-1)*8+(lu<2?12:0));};","const L=b*(0.9+q*.16)-(lv-1)*8+(lu<2?12:0),th=hn(col,row,95)-0.5,tg=hn(col,row,96)-0.5;return[L*(1+th*0.3),L*(1+tg*0.18),L*(1-th*0.3)];};")
# --- usura (weathering): sporco che sale da terra, muschio alla base, colature sotto finestre e gronde, grana di sporco
R2("function tm(color,o){","""const WEAR_V='varying vec3 vWq;varying vec3 vNw;\\n';
function wear(m){m.onBeforeCompile=s=>{
  s.vertexShader=WEAR_V+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\\n{vec4 wq=vec4(transformed,1.0);\\n#ifdef USE_INSTANCING\\nwq=instanceMatrix*wq;\\n#endif\\nvWq=(modelMatrix*wq).xyz;vNw=normalize(mat3(modelMatrix)*objectNormal);}');
  s.fragmentShader=WEAR_V+'float wh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\\n'+s.fragmentShader.replace('#include <fog_fragment>',
   '{vec3 q=floor(vWq*14.0);float vert=1.0-abs(vNw.y);float y=vWq.y;float n=wh(q);'+
   'float g=mix(0.55,1.0,smoothstep(0.0,1.5,y-0.2+n*0.35));'+
   'vec2 tg=normalize(vec2(-vNw.z,vNw.x)+vec2(1e-4));float cl=floor(dot(vWq.xz,tg)*7.0);float s=wh(vec3(cl,3.1,7.7));'+
   'float sk=step(0.72,s)*smoothstep(0.0,1.0,fract(y*0.42+s*5.0))*(0.14+0.22*fract(s*13.7));'+
   'vec3 w=vec3(mix(1.0,g,vert*0.9+0.1));w*=1.0-sk*vert;'+
   'w*=mix(vec3(1.0),vec3(0.8,0.93,0.74),vert*(1.0-smoothstep(0.0,0.8,y-0.15+n*0.3)));'+
   'w*=0.9+0.12*n;w*=mix(1.0,0.84+0.16*wh(floor(vWq*5.0)),max(vNw.y,0.0));'+
   'gl_FragColor.rgb*=w;}\\n#include <fog_fragment>');};
  m.customProgramCacheKey=()=>'wear';return m;}
function tm(color,o){""")
R2("mats[k]=new THREE.MeshLambertMaterial(p);}}","mats[k]=wear(new THREE.MeshLambertMaterial(p));}}")
# --- occlusione ambientale in spazio schermo (SSAO): angoli, gronde, piedi dei muri si scuriscono
R2("uniform mat4 proj,projInv,view,camW;varying vec2 vUv;","uniform mat4 proj,projInv,view,camW;uniform vec2 res;varying vec2 vUv;")
R2("const post=pass({tC:{value:rt.texture},","const post=pass({res:{value:new THREE.Vector2(1,1)},tC:{value:rt.texture},")
R2("post.uniforms.px.value=1;}","post.uniforms.px.value=1;post.uniforms.res.value.set(rw,rh);}")
R2("  void main(){vec2 uv=vUv;vec4 c4=texture2D(tC,uv);vec3 c=c4.rgb;","""  float ssao(vec2 uv){vec3 P=vpos(uv);vec3 Px=vpos(uv+vec2(1.0/res.x,0.0)),Py=vpos(uv+vec2(0.0,1.0/res.y));vec3 N=normalize(cross(Px-P,Py-P));if(dot(N,-P)<0.0)N=-N;
    float z=max(-P.z,0.3);float o=0.0;float a0=gr(floor(gl_FragCoord.xy))*6.2832;
    for(int i=0;i<10;i++){float fi=float(i);float a=a0+fi*2.39996;float r=0.6*(0.15+0.85*(fi+0.5)/10.0);
      vec2 s=uv+vec2(cos(a)*proj[0][0],sin(a)*proj[1][1])*r*0.5/z;vec3 d=vpos(s)-P;float dl=length(d);
      o+=max(dot(N,d/max(dl,1e-4))-0.12,0.0)*smoothstep(1.5,0.3,dl);}
    return mix(1.0,clamp(1.0-o*0.24,0.0,1.0),smoothstep(60.0,18.0,z));}
  void main(){vec2 uv=vUv;vec4 c4=texture2D(tC,uv);vec3 c=c4.rgb;if(texture2D(tD,uv).r<0.99999)c*=mix(1.0,ssao(uv),0.85);""")
# --- panchina da parco: fianchi di ghisa con riccioli, doghe di legno separate, bulloni, braccioli, foglie bagnate
R2("""function bench(x,z){const g=new THREE.Group();g.position.set(x,0.25,z);g.rotation.y=Math.atan2(-x,-z);world.add(g);
  P(g,uvB(1.8,0.08,0.45,2,1),0xa8774c,0,0.46,0,{tex:'wood',line:0.025});
  P(g,uvB(1.8,0.35,0.06,2,1),0xa8774c,0,0.75,-0.22,{tex:'wood',rot:[-0.15,0,0],line:0.02});
  for(const sx of[-0.75,0.75])P(g,B(0.08,0.46,0.42),0x2f3550,sx,0.23,0,{line:0.02});obs.push([x,z,0.8]);}""",
"""function bench(x,z){const g=new THREE.Group();g.position.set(x,0.25,z);g.rotation.y=Math.atan2(-x,-z);world.add(g);
  const IRON=0x2a2a2c,WOODS=[0x6a4a32,0x5e4230,0x74523a,0x664632],L=1.8,o={line:0};
  // segmento di ghisa tra due punti (y,z) sul fianco
  const bar=(sx,y0,z0,y1,z1,t)=>{const len=Math.hypot(y1-y0,z1-z0);P(g,B(t,len,t),IRON,sx,(y0+y1)/2,(z0+z1)/2,{rot:[Math.atan2(z1-z0,y1-y0),0,0],line:0});};
  const curl=(sx,y,z,r,a0,arc)=>{const m=P(g,new THREE.TorusGeometry(r,0.011,4,14,arc),IRON,sx,y,z,o);m.rotation.set(0,PI/2,a0);};
  for(const sx of[-0.84,0,0.84]){const side=sx!==0;
    bar(sx,0.0,0.19,0.42,0.16,0.045);                 // gamba anteriore
    bar(sx,0.0,-0.2,0.42,-0.19,0.045);                // gamba posteriore
    bar(sx,0.42,-0.19,0.9,-0.33,0.04);                // montante dello schienale
    bar(sx,0.415,-0.21,0.415,0.2,0.045);              // traversa sotto le doghe
    bar(sx,0.12,0.18,0.12,-0.19,0.025);               // traversa bassa
    P(g,B(0.1,0.02,0.1),IRON,sx,0.01,0.19,o);P(g,B(0.1,0.02,0.1),IRON,sx,0.01,-0.2,o);
    curl(sx,0.2,0.0,0.07,0,PI*1.4);                    // ricciolo tra le gambe
    if(side){bar(sx,0.42,0.17,0.64,0.22,0.035);        // sostegno del bracciolo
      bar(sx,0.66,0.22,0.66,-0.27,0.035);              // bracciolo di ghisa
      curl(sx,0.62,0.27,0.05,PI*0.5,PI*1.6);curl(sx,0.33,0.2,0.045,-PI*0.4,PI*1.3);
      P(g,uvB(0.075,0.028,0.56,1,1),WOODS[0],sx,0.69,-0.02,{tex:'wood',line:0});}
  }
  // doghe della seduta, ognuna con la sua tinta e una un po' imbarcata
  for(let i=0;i<5;i++){const zz=-0.17+i*0.088,m=P(g,uvB(L,0.034,0.07,3,0.2),pick(WOODS),0,0.455,zz,{tex:'wood',line:0});
    if(i===3)m.rotation.z=0.006;
    for(const bx of[-0.84,0,0.84])P(g,B(0.016,0.008,0.016),0x1a1a1a,bx,0.474,zz,o);}
  // doghe dello schienale, inclinate come il montante
  const ba=Math.atan2(0.14,0.48);
  for(let i=0;i<3;i++){const t=0.3+i*0.26,yy=0.42+0.48*t+0.04,zz=-0.19-0.14*t-0.035;
    const m=P(g,uvB(L,0.085,0.03,3,0.3),pick(WOODS),0,yy,zz,{tex:'wood',line:0});m.rotation.x=-ba;
    for(const bx of[-0.84,0,0.84])P(g,B(0.016,0.016,0.008),0x1a1a1a,bx,yy,zz+0.018,o);}
  // targhetta d'ottone al centro dello schienale
  P(g,B(0.16,0.045,0.006),0x8a7040,0,0.42+0.48*0.56+0.04,-0.19-0.14*0.56-0.017,{rot:[-ba,0,0],line:0,cast:false});
  // foglie cadute e bagnate sulla seduta e a terra
  for(let k=0;k<6;k++){const onSeat=k<3;P(g,B(0.055,0.004,0.035),pick([0x7a4a22,0x9a5a22,0x5a6a2a,0x6a3a1a]),R(-0.75,0.75),onSeat?0.475:0.004,onSeat?R(-0.15,0.18):R(-0.4,0.5),{rot:[0,rnd()*6,0],line:0,cast:false});}
  obs.push([x,z,0.8]);}""")
# --- alberi procedurali: scheletro di rami ricorsivo, chiome di "card" di foglie con trasparenza, sei specie diverse
R2("  leaf:pix(32,","""  bark:pix(32,(u,v)=>{const f=Math.sin(u*0.9+Math.sin(v*0.21)*2.2+hn(u>>2,0,70)*3);let b=150+f*38+hn(u,v,71)*28;if(hn(u>>1,v>>3,72)<.08)b-=60;return G(b);}),
  birch:pix(32,(u,v)=>{let b=232+hn(u,v,73)*18;if(hn(u>>3,v,74)<.1&&(v%3===0))b=70;if(hn(u>>2,v>>2,75)<.07)b=60+hn(u,v,76)*40;if(hn(u>>1,v>>1,77)<.05)b-=50;return G(b);}),
  leaf:pix(32,""")
R2("function tree(x,z){","""// texture di foglie con trasparenza, dipinte pixel per pixel (rng locale per non spostare il borgo)
function leafTex(kind){const S=64,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),im=x.createImageData(S,S),d=im.data;
  let sd=({oak:11,birch:23,willow:37,fir:41,blossom:53})[kind];const lr=()=>(sd=(Math.imul(sd,1664525)+1013904223)>>>0)/4294967296;
  const put=(X,Y,r,g,b)=>{X|=0;Y|=0;if(X<0||Y<0||X>=S||Y>=S)return;const k=(Y*S+X)*4;d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=255;};
  const leaf=(cx,cy,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++){const e=(i===0&&j===0)?1.18:(i===w-1&&j===h-1)?0.72:1;put(cx+i,cy+j,col[0]*e,col[1]*e,col[2]*e);}};
  if(kind==='willow'){for(let sx=1;sx<S;sx+=3){const len=30+lr()*33,ox=lr()*2;for(let y=0;y<len;y+=2){const t=lr(),col=[86+t*44,118+t*46,44+t*22];put(sx+ox+Math.sin(y*0.15)*1.2,y,...col);put(sx+ox+((y>>1)%2?1:-1)+Math.sin(y*0.15)*1.2,y+1,col[0]*.85,col[1]*.85,col[2]*.85);}}}
  else if(kind==='fir'){for(let u=0;u<62;u++){const v=32+u*u/420;put(u,v,52,40,30);if(u%2===0){const l=(1-u/64)*13+3;for(let k=1;k<l;k++){const t=lr(),col=[28+t*22,56+t*30,40+t*18],tip=k>l-3?1.25:1;put(u+k*0.55,v-k,col[0]*tip,col[1]*tip,col[2]*tip);put(u+k*0.55,v+k*0.9,col[0]*.8,col[1]*.8,col[2]*.8);}}}}
  else{const n=kind==='birch'?120:190,rad=kind==='birch'?26:28;
    for(let i=0;i<n;i++){const a=lr()*6.283,r=Math.sqrt(lr())*rad,cx=32+Math.cos(a)*r,cy=32+Math.sin(a)*r*0.9,t=lr();
      let col=kind==='birch'?[112+t*55,138+t*50,48+t*22]:[50+t*42,76+t*56,32+t*20];
      if(kind==='blossom'&&lr()<0.7)col=lr()<0.3?[226,214,206]:[196+t*36,146+t*34,156+t*34];
      const w=kind==='birch'?2:2+(lr()<.5),h=kind==='birch'?2:2+(lr()<.5);leaf(cx,cy,w,h,col);}
    for(let i=0;i<14;i++){let X=32,Y=32;const a=lr()*6.283;for(let k=0;k<12;k++){X+=Math.cos(a)*1.6;Y+=Math.sin(a)*1.6;if(lr()<.6)put(X,Y,48,36,28);}}}
  x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
const LEAF_T={};['oak','birch','willow','fir','blossom'].forEach(k=>LEAF_T[k]=leafTex(k));
const leafMats={};
function leafMat(kind,tint){const key=kind+tint;if(leafMats[key])return leafMats[key];
  const m=new THREE.MeshLambertMaterial({map:LEAF_T[kind],alphaTest:0.42,side:THREE.DoubleSide,color:new THREE.Color(tint)});
  m.onBeforeCompile=s=>{s.uniforms.wT=waterT;s.vertexShader='uniform float wT;\\n'+s.vertexShader.replace('#include <begin_vertex>',
    'vec3 transformed=vec3(position);float hk=smoothstep(0.8,5.0,position.y);float wv=sin(wT*1.5+position.x*0.45+position.z*0.31)*0.06+sin(wT*3.9+position.x*1.7+position.y*1.3)*0.018;transformed.x+=wv*hk;transformed.z+=wv*0.6*hk;transformed.y+=sin(wT*4.3+position.z*2.1)*0.012*hk;');s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\\ndiffuseColor.a=1.0;');};
  m.customProgramCacheKey=()=>'leafw';return leafMats[key]=m;}
const UP=new V(0,1,0);
function limb(g,a,b,r0,r1,col,tex){const d=b.clone().sub(a),len=d.length();const m=P(g,uvS(CY(r1,r0,len,6),1,len*1.4),col,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,{tex,line:0});m.quaternion.setFromUnitVectors(UP,d.normalize());return m;}
function leafCard(g,mat,p,w,h,rx,ry,rz,ord){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.copy(p);if(ord)m.rotation.order=ord;m.rotation.set(rx,ry,rz);m.castShadow=false;m.receiveShadow=true;g.add(m);return m;}
function cluster(g,sp,p,r){const mats=[leafMat(sp.leaf,sp.tints[0]),leafMat(sp.leaf,sp.tints[1])];
  if(sp.leaf==='willow'){for(let i=0;i<7;i++){const q=p.clone().add(new V(R(-r,r)*0.6,R(-0.1,0.2),R(-r,r)*0.6)),hh=R(1.4,2.4);const pg=new THREE.PlaneGeometry(R(0.5,0.8),hh);pg.translate(0,-hh/2,0);
      const m=new THREE.Mesh(pg,pick(mats));m.position.copy(q);m.rotation.set(R(-0.15,0.15),rnd()*PI,R(-0.1,0.1));m.castShadow=false;m.receiveShadow=true;g.add(m);}return;}
  P(g,SP(r*0.5,1),sp.fill,p.x,p.y,p.z,{tex:'leaf',line:0,cast:false});
  for(let i=0;i<sp.cards;i++){const q=p.clone().add(new V(R(-1,1),R(-0.6,0.8),R(-1,1)).multiplyScalar(r*0.45));const s=r*R(1.6,2.3);
    leafCard(g,pick(mats),q,s,s,R(-1.3,1.3),rnd()*PI,rnd()*PI);}}
function branch(g,sp,a,dir,len,rad,depth,tips){
  const side=new V(rnd()-.5,0,rnd()-.5).cross(dir).normalize();
  const mid=a.clone().addScaledVector(dir,len*0.5).addScaledVector(side,len*sp.gnarl*R(-1,1));
  const b=a.clone().addScaledVector(dir,len);if(sp.droop)b.y-=len*sp.droop*(1-depth/sp.depth);
  const r1=rad*sp.taper;limb(g,a,mid,rad,(rad+r1)/2,sp.bark,sp.btex);limb(g,mid,b,(rad+r1)/2,r1,sp.bark,sp.btex);
  if(depth===0){tips.push(b);return;}
  const n=sp.kids[0]+(rnd()<sp.kids[1]?1:0);
  for(let i=0;i<n;i++){const ax=new V(rnd()-.5,rnd()-.5,rnd()-.5).cross(dir).normalize();
    const nd=dir.clone().applyAxisAngle(ax,sp.spread*R(0.6,1.25));nd.y+=sp.up;nd.normalize();
    branch(g,sp,b,nd,len*sp.decay*R(0.85,1.15),r1*R(0.8,1),depth-1,tips);}
  if(depth<sp.depth&&rnd()<0.5)tips.push(b.clone().lerp(a,0.3));}
const SPECIES={
  oak:{leaf:'oak',tints:[0xffffff,0xd8e0c0],fill:0x2f4a26,bark:0x5a4c40,btex:'bark',trunk:[1.5,2.3],rad:[0.26,0.38],depth:3,kids:[2,0.6],spread:0.75,up:0.18,decay:0.7,taper:0.62,gnarl:0.14,cards:6,cl:[0.85,1.15]},
  birch:{leaf:'birch',tints:[0xffffff,0xe8f0c8],fill:0x4a6a2a,bark:0xdad6cc,btex:'birch',trunk:[3.0,4.4],rad:[0.11,0.15],depth:2,kids:[3,0.5],spread:0.5,up:0.45,decay:0.62,taper:0.7,gnarl:0.05,cards:5,cl:[0.55,0.75]},
  willow:{leaf:'willow',tints:[0xffffff,0xd0d8b0],fill:0x3f5a2a,bark:0x4a4038,btex:'bark',trunk:[1.4,2.0],rad:[0.3,0.4],depth:2,kids:[3,0.7],spread:0.85,up:0.3,decay:0.72,taper:0.6,gnarl:0.16,cards:0,cl:[0.9,1.2],droop:0.15},
  blossom:{leaf:'blossom',tints:[0xffffff,0xf0e0e0],fill:0x6a4a4a,bark:0x4a3a34,btex:'bark',trunk:[1.0,1.5],rad:[0.16,0.22],depth:3,kids:[2,0.5],spread:0.85,up:0.12,decay:0.68,taper:0.6,gnarl:0.18,cards:5,cl:[0.6,0.85]},
  dead:{leaf:'oak',tints:[0xb8a070,0x9a8a60],fill:0x3a3a28,bark:0x4a4642,btex:'bark',trunk:[1.6,2.4],rad:[0.2,0.3],depth:3,kids:[2,0.5],spread:0.8,up:0.1,decay:0.72,taper:0.55,gnarl:0.22,cards:2,cl:[0.35,0.5]}};
function fir(g,x,z){const h=R(6,9.5),r0=R(0.18,0.26),mats=[leafMat('fir',0xffffff),leafMat('fir',0xc8d4c0)];
  limb(g,new V(0,0,0),new V(R(-.1,.1),h,R(-.1,.1)),r0,0.03,0x4a3a30,'bark');
  for(let y=1.1;y<h-0.3;y+=R(0.32,0.46)){const t=(y-1.1)/(h-1.4),L=(1-t)*2.5+0.45,n=5+Math.floor(rnd()*3),a0=rnd()*6;
    for(let i=0;i<n;i++){const az=a0+i/n*PI*2+R(-0.25,0.25);const fg=new THREE.PlaneGeometry(L,0.75*(0.6+0.4*(1-t)));fg.translate(L/2,0,0);
      const m=new THREE.Mesh(fg,pick(mats));m.position.set(0,y+R(-0.08,0.08),0);m.rotation.order='YZX';m.rotation.set(R(-0.5,0.5)+PI/2*(i%2),az,-R(0.15,0.45));m.castShadow=false;m.receiveShadow=true;g.add(m);}}
  for(let i=0;i<3;i++){const fg=new THREE.PlaneGeometry(0.5,0.9);fg.translate(0,0.45,0);const m=new THREE.Mesh(fg,mats[0]);m.position.set(0,h-0.4,0);m.rotation.y=i*PI/3;g.add(m);}
  return h;}
function tree(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;world.add(g);
  const nearRiver=x>RX0-1&&Math.abs(z-RZ)<9,k=rnd();
  const kind=nearRiver&&k<0.45?'willow':k<0.26?'fir':k<0.56?'oak':k<0.74?'birch':k<0.88?'blossom':k<0.95?'willow':'dead';
  if(kind==='fir'){const h=fir(g,x,z);crowns.push([x,h*0.6,z,0]);obs.push([x,z,0.6]);return;}
  const sp=SPECIES[kind],th=R(sp.trunk[0],sp.trunk[1]),rad=R(sp.rad[0],sp.rad[1]);
  // radici che affiorano
  for(let i=0;i<4;i++){const a=i/4*PI*2+R(-.3,.3);limb(g,new V(Math.cos(a)*rad*2.2,-0.05,Math.sin(a)*rad*2.2),new V(0,0.45,0),rad*0.35,rad*0.7,sp.bark,sp.btex);}
  const lean=new V(R(-.12,.12),1,R(-.12,.12)).normalize();const tips=[];
  branch(g,sp,new V(0,0,0),lean,th,rad,sp.depth,tips);
  tips.forEach(p=>cluster(g,sp,p,R(sp.cl[0],sp.cl[1])));
  const top=tips.reduce((m,p)=>Math.max(m,p.y),0);
  crowns.push([x,top,z,kind==='blossom'?1:0]);obs.push([x,z,0.6]);}
function treeOld(x,z){""")
# --- via i cartelli con le scritte; insegne fantasy appese: staffa di ferro battuto, catenelle, tavola sagomata dipinta con un simbolo
R2("const signDraws=[];","""const signDraws=[];
const SIGNS=[];
// simboli dipinti a pixel, senza scritte: ogni bottega si riconosce dal disegno
function iconTex(kind,bg){const W=32,H=24,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const ic=document.createElement('canvas');ic.width=W;ic.height=H;const y=ic.getContext('2d');
  const F=(col,...r)=>{y.fillStyle=col;y.fillRect(...r);},C=(col,cx,cy,rx,ry)=>{y.fillStyle=col;y.beginPath();y.ellipse(cx,cy,rx,ry||rx,0,0,PI*2);y.fill();};
  const S=(col,cx,cy,r,w)=>{y.strokeStyle=col;y.lineWidth=w||1.5;y.beginPath();y.arc(cx,cy,r,0,PI*2);y.stroke();};
  ({apple:()=>{C('#a8302a',16,14,6.5,6);C('#c84a3a',14,12,2.5);F('#4a2e1a',15.5,4,1.5,4);C('#5a7a2e',19,6,2.8,1.4);},
    spool:()=>{F('#5a3a22',10,5,12,2);F('#5a3a22',10,17,12,2);F('#8a2a3a',12,7,8,10);for(let i=8;i<17;i+=2)F('#a84a5a',12,i,8,1);F('#c8bca0',21,10,6,1);},
    vase:()=>{C('#34507a',16,15,6,5.5);F('#34507a',14,6,4,5);F('#4a6a9a',12,5,8,1.5);F('#c8bca0',10,14,12,1.2);C('#5a7aaa',14,13,1.5);},
    potion:()=>{C('#2f6a5a',16,15,6.5);F('#9ab0a8',14,5,4,6);F('#6a4a2a',13.5,3,5,2.5);C('#5ab8a0',16,16,4.5);F('#d8f0e8',13,12,1.5,1.5);},
    bread:()=>{C('#9a6a32',16,13,10,5.5);C('#b88446',15,11.5,7.5,3.2);for(const bx of[11,15,19])F('#7a4a22',bx,10,1.5,4);},
    flower:()=>{F('#4a6a2e',15.4,12,1.4,9);C('#5a7a2e',19,17,2.6,1.2);for(let i=0;i<5;i++){const a=i/5*PI*2-PI/2;C('#b8607a',16+Math.cos(a)*3.6,10+Math.sin(a)*3.6,2.4);}C('#d8b040',16,10,1.8);},
    lantern:()=>{F('#2a2420',13,4,6,2);F('#2a2420',12,6,8,1.5);F('#e0a040',13,7.5,6,9);F('#f8d080',14.5,9,3,5);F('#2a2420',12,16.5,8,1.5);for(const lx of[13,18])F('#2a2420',lx,7.5,1,9);S('#2a2420',16,2.5,1.4,1);},
    tankard:()=>{F('#8a8478',10,8,10,11);F('#6a6458',10,10,10,1);F('#6a6458',10,15,10,1);C('#e8e0c8',15,8,5.5,2.4);C('#e8e0c8',12,6.5,2);S('#6a6458',21.5,13,3.2,2);},
    anvil:()=>{F('#3a3a3e',9,8,15,3.5);y.fillStyle='#3a3a3e';y.beginPath();y.moveTo(9,8);y.lineTo(4,9);y.lineTo(9,11.5);y.fill();F('#3a3a3e',13,11,7,4);F('#3a3a3e',10,15,13,3);F('#6a6a70',9,8,15,1);F('#7a4a22',19,3,1.5,6);F('#5a5a60',17,2,6,2.5);},
    key:()=>{S('#b08a48',10,12,3.4,2);F('#b08a48',13,11,13,2);F('#b08a48',22,13,1.5,3);F('#b08a48',24.5,13,1.5,2.5);},
    fish:()=>{C('#8a9aa0',15,12,8,3.8);y.fillStyle='#8a9aa0';y.beginPath();y.moveTo(22,12);y.lineTo(28,7);y.lineTo(28,17);y.fill();C('#1a1a1a',10,11,1);F('#aab8be',9,13,10,1);},
    shield:()=>{y.fillStyle='#7a2a24';y.beginPath();y.moveTo(9,4);y.lineTo(23,4);y.lineTo(23,12);y.quadraticCurveTo(23,18,16,21);y.quadraticCurveTo(9,18,9,12);y.fill();F('#b08a48',15,5,2,15);F('#b08a48',10,9,12,2);}
  })[kind]();
  const id=y.getImageData(0,0,W,H);for(let i=3;i<id.data.length;i+=4)id.data[i]=id.data[i]>110?255:0;y.putImageData(id,0,0);
  x.fillStyle=bg;x.fillRect(0,0,W,H);
  const bd=x.getImageData(0,0,W,H);for(let p=0;p<W*H;p++){const u=p%W,v=(p/W)|0,k=p*4,g=0.84+0.16*hn(u,v>>1,80)-(hn(u>>2,v,81)<.08?0.12:0);bd.data[k]*=g;bd.data[k+1]*=g;bd.data[k+2]*=g;}x.putImageData(bd,0,0);
  x.strokeStyle='rgba(176,138,72,0.9)';x.lineWidth=1;x.strokeRect(2.5,2.5,W-5,H-5);
  x.drawImage(ic,0,0);
  const id2=x.getImageData(0,0,W,H);for(let p=0;p<W*H;p++){const u=p%W,v=(p/W)|0,k=p*4;if(hn(u,v,82)<.06){id2.data[k]*=.8;id2.data[k+1]*=.8;id2.data[k+2]*=.8;}}x.putImageData(id2,0,0);
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t;}
// tavola con gli angoli superiori scavati a quarto di cerchio, come le insegne delle locande
function boardGeo(W,H){const s=new THREE.Shape(),c=W*0.13;s.moveTo(-W/2,-H/2);s.lineTo(W/2,-H/2);s.lineTo(W/2,H/2-c);s.absarc(W/2,H/2,c,-PI/2,-PI,true);s.lineTo(-W/2+c,H/2);s.absarc(-W/2,H/2,c,0,-PI/2,true);s.lineTo(-W/2,-H/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:0.045,bevelEnabled:true,bevelThickness:0.008,bevelSize:0.008,bevelSegments:1});g.translate(0,0,-0.0225);
  const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/W+0.5,p.getY(i)/H+0.5);return g;}
function hangSign(parent,base,dir,len,kind,bg){
  const IRON=0x242426,g=new THREE.Group();g.position.copy(base);g.rotation.y=Math.atan2(-dir.z,dir.x);parent.add(g);const o={line:0};
  P(g,B(0.03,0.32,0.12),IRON,0.015,-0.06,0,o);
  P(g,B(len,0.035,0.035),IRON,len/2,0,0,o);
  {const a=new V(0.02,-0.25,0),b=new V(len*0.62,0,0),d=b.clone().sub(a),m=P(g,B(d.length(),0.025,0.025),IRON,(a.x+b.x)/2,(a.y+b.y)/2,0,o);m.rotation.z=Math.atan2(d.y,d.x);}
  for(const [cx,cy,r,a0,arc] of[[len*0.2,-0.09,0.07,0.3,PI*1.5],[len*0.42,0.07,0.05,PI*1.1,PI*1.4],[len+0.035,0.0,0.04,-PI*0.6,PI*1.5]])
    {const m=P(g,new THREE.TorusGeometry(r,0.009,4,14,arc),IRON,cx,cy,0,o);m.rotation.z=a0;}
  P(g,new THREE.ConeGeometry(0.02,0.08,5),IRON,len*0.42,0.12,0,o);
  const W=len*0.72,H=W*0.74,pv=new THREE.Group();pv.position.set(len*0.58,-0.02,0);g.add(pv);
  for(const cx of[-W*0.36,W*0.36]){for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.TorusGeometry(0.016,0.0045,4,8),tm(IRON));m.position.set(cx,-0.02-k*0.03,0);m.rotation.y=k%2?PI/2:0;m.scale.y=1.4;pv.add(m);}
    const hk=new THREE.Mesh(B(0.02,0.03,0.02),tm(IRON));hk.position.set(cx,-0.175,0);pv.add(hk);}
  const board=new THREE.Mesh(boardGeo(W,H),[new THREE.MeshLambertMaterial({map:iconTex(kind,bg||pick(['#3a2a20','#2e3a3a','#3a2a2e','#2a3020']))}),tm(0x3a2a20,{tex:'wood'})]);
  board.position.set(0,-0.19-H/2,0);board.castShadow=true;board.receiveShadow=true;pv.add(board);
  {const tr=new THREE.Mesh(B(W+0.04,0.035,0.06),tm(0x2a1e16));tr.position.set(0,-0.185,0);pv.add(tr);}
  parent.updateMatrixWorld(true);scene.attach(pv);pv.rotation.reorder('YXZ');SIGNS.push({pv,ph:rnd()*6,x0:pv.rotation.x});
  return g;}
const HOUSE_ICONS=['tankard','anvil','key','fish','shield','bread','potion','spool'];""")
# bancarelle: niente più cartello col nome, un'insegna appesa al palo
R2("""  P(g,B(1.7,0.5,0.08),DARK,0,3.38,-0.88,{line:0.03});
  P(g,new THREE.PlaneGeometry(1.58,0.4),0,0,3.38,-0.835,{mat:signMat(S.name,'#fff8e6','#1d2340'),line:0,cast:false});""",
"""  g.updateMatrixWorld(true);hangSign(g,new V(1.48,3.0,-0.85),new V(1,0,0),0.95,['apple','spool','vase','potion','bread','flower','lantern'][k]);""")
R2("sign:g.localToWorld(new V(0,3.6,-0.9))","sign:g.localToWorld(new V(-1.45,3.05,-0.85))")
# case: insegne su staffa perpendicolare al muro
R2("  // insegna appesa a una staffa\n  if(ring&&rnd()<0.45){","  if(ring&&rnd()<0.55){const s=rnd()<.5?-1:1;g.updateMatrixWorld(true);hangSign(g,new V(s*1.6,2.45,fr),new V(0,0,1),0.95,pick(HOUSE_ICONS));}\n  if(false){")
# via il cartello indicatore con le scritte
_a=out.index("{ // cartello indicatore");_b=out.index("{ // bacheca degli avvisi")
out=out[:_a]+out[_b:]
# le insegne oscillano nel vento
R2("  lanterns.forEach(l=>{l.pv.rotation.z=Math.sin(T*1.3+l.ph)*0.08;l.pv.rotation.x=Math.cos(T*1.1+l.ph)*0.06;});",
   "  lanterns.forEach(l=>{l.pv.rotation.z=Math.sin(T*1.3+l.ph)*0.08;l.pv.rotation.x=Math.cos(T*1.1+l.ph)*0.06;});\n  SIGNS.forEach(s=>{s.pv.rotation.x=s.x0+Math.sin(T*1.2+s.ph)*0.07+Math.sin(T*2.9+s.ph*2)*0.015;});")
# --- ponte in pietra ad arco ribassato: muri di testa, conci a raggiera con chiave di volta, cornice, parapetti con copertina, lastricato, pilastrini
_a=out.index("  // ponte ad arco");_b=out.index("\n}\n\n/* ---------- sentieri")
out=out[:_a]+r"""  // ponte in pietra ad arco ribassato
  const g=new THREE.Group();g.position.set(0,0,RZ);world.add(g);
  const bh=z=>0.3+0.6*(1-(z/3.5)*(z/3.5)),bhc=z=>bh(Math.max(-3.5,Math.min(3.5,z)));
  const BIVY=new THREE.MeshLambertMaterial({map:TEX.ivy,alphaTest:0.5,side:THREE.DoubleSide,color:0xb8c4a8});
  const ST=[0x9a968a,0x8a867c,0xa8a294,0x948e80],SPAN=2.3,RISE=0.5,arch=z=>0.02+RISE*(1-(z/SPAN)*(z/SPAN)),o={line:0};
  { // corpo: profilo laterale (strada sopra, arco sotto) estruso su tutta la larghezza
    const s=new THREE.Shape();s.moveTo(-3.7,-0.25);for(let z=-3.7;z<=3.701;z+=0.25)s.lineTo(z,bhc(z)-0.07);s.lineTo(3.7,-0.25);s.lineTo(SPAN,-0.25);
    for(let i=0;i<=24;i++){const z=SPAN-i/24*2*SPAN;s.lineTo(z,arch(z));}s.lineTo(-SPAN,-0.25);s.lineTo(-3.7,-0.25);
    const eg=new THREE.ExtrudeGeometry(s,{depth:2.9,bevelEnabled:false});eg.rotateY(-PI/2);eg.translate(1.45,0,0);uvS(eg,1.3,1.3);
    P(g,eg,ST[0],0,0,0,{tex:'stone',line:0});}
  // conci dell'arco su entrambe le facce, a raggiera, con la chiave di volta più grande
  const N=15;for(const fx of[-1.47,1.47])for(let i=0;i<N;i++){const z0=-SPAN+i/N*2*SPAN,z1=-SPAN+(i+1)/N*2*SPAN,zc=(z0+z1)/2,yc=arch(zc);
    const a=Math.atan(-2*RISE*zc/(SPAN*SPAN)),key=i===(N>>1),dep=key?0.44:(i%2?0.26:0.33),sl=Math.hypot(z1-z0,arch(z1)-arch(z0))*0.93;
    const m=P(g,uvB(key?0.12:0.07,dep,sl,0.3,0.6),key?0xb0aa9c:pick(ST),fx+Math.sign(fx)*(key?0.03:0.01),yc+Math.cos(a)*dep/2,zc-Math.sin(a)*dep/2,{tex:'stone',line:0});m.rotation.x=-a;}
  // cornice sporgente sotto il parapetto e parapetti a corsi di pietra con copertina
  const NS=14;for(let i=0;i<NS;i++){const z0=-3.6+i/NS*7.2,z1=-3.6+(i+1)/NS*7.2,zc=(z0+z1)/2,a=Math.atan((bhc(z1)-bhc(z0))/(z1-z0)),sl=Math.hypot(z1-z0,bhc(z1)-bhc(z0))+0.01;
    for(const sx of[-1,1]){
      const c=P(g,B(0.14,0.09,sl),0x8a867c,sx*1.5,bhc(zc)-0.12,zc,{tex:'stone',line:0});c.rotation.x=-a;
      const w=P(g,uvB(0.24,0.5,sl,0.3,0.6),pick(ST),sx*1.35,bhc(zc)+0.09+0.25,zc,{tex:'stone',line:0});w.rotation.x=-a;
      const cp=P(g,uvB(0.32,0.08,sl-0.015,0.4,0.6),0xb0aa9c,sx*1.35,bhc(zc)+0.09+0.54,zc,{tex:'stone',line:0});cp.rotation.x=-a;
      if(rnd()<0.5){const t=P(g,CO(0.05,R(0.1,0.2),4),0x4f7e36,sx*1.2,bhc(zc)+0.12,zc+R(-0.2,0.2),{line:0,cast:false});}
      if(rnd()<0.3){const iv=new THREE.Mesh(new THREE.PlaneGeometry(R(0.4,0.8),R(0.4,0.9)),BIVY);iv.position.set(sx*1.55,bhc(zc)-0.45,zc);iv.rotation.y=PI/2;g.add(iv);}}}
  // lastricato: file di lastre di larghezza diversa, ogni lastra con il suo tono
  for(let zc=-3.45;zc<3.46;zc+=0.42){const a=Math.atan(-1.2*zc/12.25*0.98);let x=-1.23;
    while(x<1.22){const w=Math.min(1.23-x,R(0.45,0.9));const m=P(g,uvB(w-0.025,0.1,0.395,w*0.7,0.3),pick(ST),x+w/2,bhc(zc)+0.04,zc,{tex:'stone',line:0,cast:false});m.rotation.x=a;x+=w;}}
  // cordolo lungo i parapetti
  for(const sx of[-1,1])for(let i=0;i<NS;i++){const z0=-3.6+i/NS*7.2,z1=z0+7.2/NS,zc=(z0+z1)/2,a=Math.atan((bhc(z1)-bhc(z0))/(z1-z0));const k=P(g,B(0.1,0.07,7.2/NS),0x7e7a70,sx*1.18,bhc(zc)+0.1,zc,{line:0,cast:false});k.rotation.x=-a;}
  // pilastrini alle testate con sfera di pietra e muri d'ala che si aprono verso le sponde
  for(const sz of[-1,1])for(const sx of[-1,1]){const z=sz*3.75,y0=bhc(z);
    P(g,uvB(0.42,1.0,0.42,0.5,1),0x948e80,sx*1.38,y0+0.4,z,{tex:'stone',line:0});P(g,B(0.5,0.1,0.5),0xb0aa9c,sx*1.38,y0+0.95,z,o);P(g,SP(0.15,1),0xa8a294,sx*1.38,y0+1.15,z,{tex:'stone',line:0});
    const ww=P(g,uvB(0.26,0.55,1.6,1.5,0.6),0x948e80,sx*1.95,0.22,sz*4.45,{tex:'stone',line:0});ww.rotation.y=sx*sz*0.55;
    P(g,B(0.32,0.08,1.6),0xb0aa9c,sx*1.95,0.53,sz*4.45,{rot:[0,sx*sz*0.55,0],line:0});}
  // sassi e muschio dove l'arco tocca l'acqua
  for(const sz of[-1,1])for(let i=0;i<6;i++)P(g,SP(R(0.15,0.32),0),pick([0x7e7a70,0x6a6a60]),R(-1.6,1.6),0.1,sz*R(2.0,2.4),{scale:[1,0.6,1],line:0,cast:false});"""+out[_b:]
# --- terreno: mesh suddivisa con macchie di colore (prato folto, erba secca, terra battuta, muschio umido) e leggere ondulazioni
R2("  P(world,top,0x9ad865,0,0,0,{tex:'grass',uv:[24,24],line:0,cast:false});","""  {const N=150,pg=new THREE.PlaneGeometry(ISL*2,ISL*2,N,N);pg.rotateX(-PI/2);const pa=pg.attributes.position,cols=new Float32Array(pa.count*3);
    const vn=(x,z,s,k)=>{x/=s;z/=s;const x0=Math.floor(x),z0=Math.floor(z),fx=x-x0,fz=z-z0,sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);
      const a=hn(x0,z0,k),b=hn(x0+1,z0,k),c=hn(x0,z0+1,k),d=hn(x0+1,z0+1,k);return a+(b-a)*sx+(c-a)*sz+(a-b-c+d)*sx*sz;};
    const lush=[0.36,0.5,0.24],dry=[0.58,0.56,0.32],dirt=[0.5,0.41,0.3],moss=[0.24,0.36,0.2],mix=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);
    for(let i=0;i<pa.count;i++){let x=pa.getX(i),z=pa.getZ(i);const r=Math.hypot(x,z);if(r>ISL){x*=ISL/r;z*=ISL/r;pa.setX(i,x);pa.setZ(i,z);}
      const n1=vn(x,z,7,101),n2=vn(x,z,2.2,102),n3=vn(x,z,0.9,103);let c=mix(lush,dry,Math.max(0,Math.min(1,(n1-0.55)*3)));
      c=mix(c,moss,Math.max(0,Math.min(1,(0.4-n2)*3))*0.8);
      const riv=x>RX0-2&&Math.abs(z-RZ)<RW/2+2.5;if(riv)c=mix(c,moss,0.6);
      const nearP=onPath(x,z,0.9)||Math.abs(Math.hypot(x,z)-PLAZA)<1.2;if(nearP)c=mix(c,dirt,0.45+n3*0.4);
      if(n3>0.8)c=mix(c,dirt,0.5);
      const k=0.9+n3*0.2;cols.set([c[0]*k,c[1]*k,c[2]*k],i*3);
      const flat=r<PLAZA+1.5||onPath(x,z,0.6)||riv||r>ISL-1.5;pa.setY(i,flat?0:Math.max(0,(n2-0.5)*0.16+(n1-0.5)*0.12));}
    pg.setAttribute('color',new THREE.BufferAttribute(cols,3));pg.computeVertexNormals();uvS(pg,36,36);
    const gm=wear(new THREE.MeshLambertMaterial({map:TEX.grass2,vertexColors:true}));const gmesh=new THREE.Mesh(pg,gm);gmesh.receiveShadow=true;scene.add(gmesh);}""")
R2("  grass:pix(64,","  grass2:pix(128,(u,v)=>{const q=hn(u,v,107),o=(hn(u,0,108)*8)|0,bl=hn(u,(v+o)>>2,109);let b=128+bl*78+q*26;if(bl>0.88&&((v+o)&3)===0)b+=45;if(q<.05)b=72;if(hn(u>>2,v>>2,110)<.035)b=212;if(hn(u>>1,v>>1,111)<.012)b=95;return G(b);}),\n  grass:pix(64,")
# --- sentieri: solchi delle ruote bagnati e sassi lungo i bordi
R2("m.material.opacity=0.8;m.rotation.y=Math.atan2(bx-ax,bz-az);}","""m.material.opacity=0.8;m.rotation.y=Math.atan2(bx-ax,bz-az);
  const dx=(bx-ax)/len,dz=(bz-az)/len,ang=Math.atan2(bx-ax,bz-az);
  for(const off of[-0.42,0.42]){const rg=new THREE.PlaneGeometry(0.22,len*0.96);rg.rotateX(-PI/2);uvS(rg,0.2,len/2);const r=P(world,rg,0x5a4a3a,(ax+bx)/2+dz*off,0.036,(az+bz)/2-dx*off,{tex:'dirt',line:0,cast:false});r.material.opacity=0.62;r.rotation.y=ang;}
  for(let t=0.3;t<len;t+=R(0.3,0.7))for(const s of[-1,1])if(rnd()<0.55){const e=w/2+R(-0.12,0.15);P(world,SP(R(0.07,0.16),0),pick([0x8a867c,0x7e7a70,0x9a968a]),ax+dx*t+dz*s*e,0.03,az+dz*t-dx*s*e,{scale:[1,0.5,1],line:0,cast:false});}}""")
# --- sottobosco: felci, funghi, massi muschiati, foglie cadute, sassolini, canne lungo il fiume
R2("/* ---------- pareti verdi lontane, a strati nella nebbia ---------- */","""/* ---------- sottobosco e dettagli del terreno ---------- */
{const okAt=(x,z,pad)=>{const r=Math.hypot(x,z);if(r<PLAZA+0.6||r>ISL-1.2)return false;if(onPath(x,z,pad)||inRiver(x,z,pad))return false;
    for(const o of obs)if(Math.hypot(x-o[0],z-o[1])<o[2]*0.75+pad)return false;return true;};
  const treesAt=crowns.map(c=>[c[0],c[2]]);
  const near=(spread)=>{const t=pick(treesAt);const a=rnd()*PI*2,r=R(0.8,spread);return[t[0]+Math.cos(a)*r,t[1]+Math.sin(a)*r];};
  // felci: ciuffi di fronde che si aprono a raggiera
  const fm=[leafMat('fir',0x9ab878),leafMat('fir',0x7a9a60)];
  for(let n=0,tr=0;n<170&&tr<900;tr++){const[x,z]=near(3.2);if(!okAt(x,z,0.2))continue;n++;const k=6+Math.floor(rnd()*4),s=R(0.5,0.9),a0=rnd()*6;
    for(let i=0;i<k;i++){const fg=new THREE.PlaneGeometry(s,s*0.42);fg.translate(s/2,0,0);const m=new THREE.Mesh(fg,pick(fm));m.position.set(x,0.05,z);m.rotation.order='YZX';m.rotation.set(R(-0.4,0.4),a0+i/k*PI*2,R(0.35,0.8));m.castShadow=false;m.receiveShadow=true;world.add(m);}}
  // funghi a gruppetti ai piedi degli alberi
  for(let n=0,tr=0;n<45&&tr<400;tr++){const[x,z]=near(1.6);if(!okAt(x,z,0.05))continue;n++;const cap=pick([0x8a3a2c,0x9a7048,0xc8b89a,0x6a4a32]);
    for(let i=0;i<3+Math.floor(rnd()*4);i++){const px=x+R(-0.25,0.25),pz=z+R(-0.25,0.25),h=R(0.05,0.14),r=R(0.035,0.08);
      P(world,CY(r*0.35,r*0.45,h,5),0xd8d0bc,px,h/2,pz,{line:0,cast:false});P(world,SP(r,1),cap,px,h,pz,{scale:[1,0.55,1],line:0,cast:false});}}
  // massi con il cappello di muschio
  for(let n=0,tr=0;n<26&&tr<500;tr++){const a=rnd()*PI*2,r=R(PLAZA+3,ISL-3),x=Math.cos(a)*r,z=Math.sin(a)*r;if(!okAt(x,z,0.8))continue;n++;const s=R(0.35,0.95);
    P(world,SP(s,0),pick([0x8a867c,0x7e7a70,0x948e80]),x,s*0.3,z,{tex:'stone',scale:[1,R(0.55,0.8),R(0.8,1.2)],rot:[0,rnd()*6,0],line:0});
    P(world,SP(s*0.82,0),0x3f5a2e,x+R(-.1,.1),s*0.48,z+R(-.1,.1),{tex:'leaf',scale:[1,0.35,1],line:0,cast:false});obs.push([x,z,s*0.8]);}
  // istanze: foglie cadute, sassolini, canne
  const inst=(geo,n,place)=>{const m=new THREE.InstancedMesh(geo,tm(0xffffff),n),d=new THREE.Object3D(),c=new THREE.Color();let k=0;
    for(let t=0;t<n*6&&k<n;t++){if(!place(d,c))continue;d.updateMatrix();m.setMatrixAt(k,d.matrix);m.setColorAt(k,c);k++;}
    m.count=k;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);};
  inst(B(0.07,0.006,0.045),2600,(d,c)=>{const[x,z]=rnd()<0.8?near(3.5):[R(-ISL,ISL),R(-ISL,ISL)];const r=Math.hypot(x,z);if(r>ISL-1||inRiver(x,z,0))return false;
    d.position.set(x,(r<PLAZA?0.255:0.03)+rnd()*0.01,z);d.rotation.set(R(-0.2,0.2),rnd()*6,R(-0.2,0.2));d.scale.setScalar(R(0.7,1.3));c.setHex(pick([0x7a4a22,0x9a5a22,0x6a3a1a,0x8a6a2a,0x5a6a2a]));return true;});
  inst(SP(0.05,0),1800,(d,c)=>{const a=rnd()*PI*2,r=R(PLAZA+0.3,ISL-1),x=Math.cos(a)*r,z=Math.sin(a)*r;if(inRiver(x,z,0))return false;if(!onPath(x,z,0.6)&&rnd()<0.6)return false;
    d.position.set(x,0.02,z);d.rotation.set(0,rnd()*6,0);d.scale.set(R(0.5,1.5),R(0.3,0.7),R(0.5,1.5));c.setHex(pick([0x8a867c,0x7e7a70,0x9a968a,0x6a665e]));return true;});
  {const rg=B(0.022,1,0.022);rg.translate(0,0.5,0);
   inst(rg,900,(d,c)=>{const x=R(RX0,RX1-0.5);if(Math.abs(x)<2.6)return false;const s=rnd()<.5?-1:1,z=RZ+s*(RW/2+R(-0.35,0.7));
     d.position.set(x,0.05,z);d.rotation.set(R(-0.18,0.18),rnd()*6,R(-0.18,0.18));const h=R(0.6,1.5);d.scale.set(1,h,1);c.setHex(pick([0x5a6a32,0x6a7a3a,0x7a6a3a,0x4a5a2a]));return true;});
   const ct=CY(0.03,0.03,0.16,5);ct.translate(0,0.08,0);
   inst(ct,140,(d,c)=>{const x=R(RX0,RX1-0.5);if(Math.abs(x)<2.6)return false;const s=rnd()<.5?-1:1,z=RZ+s*(RW/2+R(-0.2,0.5));d.position.set(x,R(0.9,1.4),z);d.rotation.set(R(-0.15,0.15),0,R(-0.15,0.15));d.scale.set(1,1,1);c.setHex(0x5a3a22);return true;});}
}

/* ---------- pareti verdi lontane, a strati nella nebbia ---------- */""")
# --- legno irregolare: assi di larghezza diversa, venatura ondulata che gira attorno ai nodi, giunte di testa, crepe, chiodi, assi ingrigite
R2("  wood:pix(64,(u,v)=>{const pl=u>>4,lu=u&15;if(lu===0)return G(62);const b=170+hn(pl,0,11)*60,g=Math.sin((v+hn(pl,1,12)*30)*0.35+lu*.6)*12;return G(b+g+hn(u,v,13)*16-(hn(pl,v>>4,14)<.06&&(lu===7||lu===8)?70:0)-(lu===15?18:0));}),",
"""  wood:pix(128,(u,v)=>{
    const edges=[0,22,38,61,80,104,128];let pl=0;while(u>=edges[pl+1])pl++;const x0=edges[pl],w=edges[pl+1]-x0,lu=u-x0;
    const joint=(hn(pl,9,120)*128)|0,seg=((v-joint+128)%128)<64?0:1,id=pl*2+seg;
    if(lu===0||((v-joint+128)%64)===0)return G(48);
    if(lu===1||lu===w-1)return G(118+hn(u,v,121)*20);
    let b=150+hn(id,0,122)*55;const grey=hn(id,1,123)<0.3;
    const kx=x0+2+hn(id,2,124)*(w-4),ky=hn(id,3,125)*128,dx=u-kx,dy=(v-ky+192)%128-64,kd=Math.hypot(dx*1.6,dy);
    const warp=12/(1+kd*0.12);
    const gr=Math.sin((lu+Math.sin(v*0.07+id)*2.2+warp*Math.sign(dx||1))*1.25+hn(id,4,126)*6);
    b+=gr*14+Math.sin(v*0.9+lu*2.1+id)*3+(hn(u,v,127)-0.5)*18;
    if(kd<2.6&&hn(id,5,128)<0.75)b=kd<1.3?52:90;
    if(hn(id,6,129)<0.35&&Math.abs(lu-(w*0.45|0))<1&&((v+id*13)%128)<40)b-=55;
    if((lu===2||lu===w-3)&&((v-joint+128)%64===4))b=40;
    if(hn(u>>1,v>>2,130)<.05)b-=28;
    b-=Math.max(0,8-Math.abs(((v-joint+128)%64)-32))*0;
    return grey?[b*0.92,b*0.92,b*0.9]:G(b);}),""")
# --- fiori modellati: margherite, tulipani, campanule, papaveri, lavanda; stelo, foglie, petali e bottone separati
R2("const FLOW=[","""const FLOWER_TYPES=['daisy','tulip','bell','poppy','lavender'];
const FLOWER_COLS={daisy:[0xf0ece0,0xf2e6b8,0xe8d8e8],tulip:[0xb8242e,0xd86a2a,0xd8b030,0xc85a7a],bell:[0x6a5ab8,0x8a7ac8,0x5a6ab0],poppy:[0xc8302a,0xd8402a],lavender:[0x7a5aa8,0x8a6ab8]};
const FLOWER_GEO=(()=>{const NI=g=>{g=g.index?g.toNonIndexed():g;return g;},M=a=>THREE.BufferGeometryUtils.mergeBufferGeometries(a.map(NI));
  const stem=(h,bend)=>{const parts=[],n=3;let px=0,py=0;for(let i=0;i<n;i++){const c=CY(0.0055,0.007,h/n+0.004,4);c.rotateZ(-bend*(i+0.5)/n);c.translate(px+Math.sin(bend*(i+0.5)/n)*h/n/2,py+h/n/2,0);parts.push(c);px+=Math.sin(bend*(i+0.5)/n)*h/n;py+=Math.cos(bend*(i+0.5)/n)*h/n;}
    return {parts,top:[px,py]};};
  const leaf=(len,w,ang,ry,y)=>{const l=B(w,len,0.004);l.translate(0,len/2,0);l.rotateZ(ang);l.rotateY(ry);l.translate(0,y,0);return l;};
  const G={};
  {const s=stem(0.3,0.15),[tx,ty]=s.top,p=[];for(let i=0;i<12;i++){const b=B(0.016,0.004,0.06);b.translate(0,0,0.038);b.rotateX(-0.22);b.rotateY(i/12*PI*2+(i%2)*0.1);b.translate(tx,ty,0);p.push(b);}
   const c=SP(0.017,1);c.scale(1,0.55,1);c.translate(tx,ty+0.004,0);G.daisy={petal:M(p),stem:M([...s.parts,leaf(0.09,0.022,0.7,0,0.04),leaf(0.08,0.02,-0.6,2.2,0.07)]),center:M([c]),cc:0xc89a28};}
  {const s=stem(0.32,0.06),[tx,ty]=s.top,p=[];for(let i=0;i<6;i++){const r=i<3?0.024:0.018,b=B(0.032,0.072,0.005);b.translate(0,0.036,r);b.rotateX(i<3?0.2:0.08);b.rotateY(i/3*PI*2+(i<3?0:PI/3));b.translate(tx,ty-0.005,0);p.push(b);}
   const c=SP(0.008,0);c.translate(tx,ty+0.02,0);G.tulip={petal:M(p),stem:M([...s.parts,leaf(0.19,0.032,0.22,0,0.0),leaf(0.16,0.028,-0.28,2.6,0.02)]),center:M([c]),cc:0x2a2418};}
  {const s=stem(0.34,0.55),[tx,ty]=s.top,p=[],cs=[];for(let i=0;i<3;i++){const t=0.55+i*0.2,bx=tx*t,by=ty*t;const k=CO(0.022,0.04,6);k.rotateX(PI);k.translate(bx+0.01,by-0.03,0);p.push(k);
     const st=CY(0.003,0.003,0.03,3);st.translate(bx+0.01,by-0.012,0);cs.push(st);const cl=SP(0.006,0);cl.translate(bx+0.01,by-0.05,0);cs.push(cl);}
   G.bell={petal:M(p),stem:M([...s.parts,...cs.slice(0,0),leaf(0.08,0.02,0.6,1,0.03)]),center:M(cs),cc:0x4a6a2e};}
  {const s=stem(0.36,0.2),[tx,ty]=s.top,p=[];for(let i=0;i<4;i++){const b=SP(0.034,1);b.scale(1,0.18,0.85);b.rotateX(-0.55);b.translate(0,0.008,0.026);b.rotateY(i*PI/2+0.3);b.translate(tx,ty,0);p.push(b);}
   const c=SP(0.013,1);c.scale(1,0.7,1);c.translate(tx,ty+0.012,0);G.poppy={petal:M(p),stem:M([...s.parts,leaf(0.07,0.018,0.9,0.5,0.05),leaf(0.06,0.016,-0.8,3.3,0.03)]),center:M([c]),cc:0x1e2418};}
  {const s=stem(0.24,0.1),[tx,ty]=s.top,p=[];for(let i=0;i<11;i++){const b=SP(0.011,0);b.scale(1,1.3,1);const a=i*2.4;b.translate(tx+Math.cos(a)*0.008,ty+i*0.011,Math.sin(a)*0.008);p.push(b);}
   const c=SP(0.004,0);c.translate(tx,ty-0.004,0);G.lavender={petal:M(p),stem:M([...s.parts,leaf(0.1,0.008,0.25,0,0.0),leaf(0.1,0.008,-0.3,1.6,0.0),leaf(0.09,0.008,0.35,3.1,0.0)]),center:M([c]),cc:0x6a8a5a};}
  return G;})();
const FLOWER_STEM=0x4a6a2e;
function flower(parent,x,y,z,type,col,s){const f=FLOWER_GEO[type],g=new THREE.Group();g.position.set(x,y,z);g.rotation.set(R(-0.15,0.15),rnd()*6,R(-0.15,0.15));g.scale.setScalar(s||1);parent.add(g);
  const o={line:0,cast:false};P(g,f.petal,col,0,0,0,o);P(g,f.stem,FLOWER_STEM,0,0,0,o);P(g,f.center,f.cc,0,0,0,o);return g;}
function flowerBed(parent,x,y,z,n,spread,s){const t=pick(FLOWER_TYPES),c=pick(FLOWER_COLS[t]);for(let i=0;i<n;i++)flower(parent,x+R(-spread,spread),y,z+R(-spread,spread),t,c,(s||1)*R(0.8,1.15));}
const FLOW=[""")
# fioriere alle finestre, vasi, aiuole, cespugli, bancarella dei fiori
R2("    for(let i=0;i<9;i++)P(g,SP(0.06,0),pick(FLOW),x-0.44+i*0.11,y-0.58+R(-0.05,0.05),zf+0.2+R(-0.08,0.08),{line:0.01,cast:false});",
   "    {const t=pick(FLOWER_TYPES),fc=pick(FLOWER_COLS[t]);for(let i=0;i<8;i++)flower(g,x-0.42+i*0.12,y-0.74,zf+0.17+R(-0.06,0.06),rnd()<0.8?t:pick(FLOWER_TYPES),fc,R(0.5,0.65));}")
R2("    if(rnd()<.5)for(let k=0;k<4;k++)P(g,SP(0.05,0),pick(FLOW),px+R(-.15,.15),0.55+R(0,.1),pz+R(-.15,.15),{line:0,cast:false});}",
   "    if(rnd()<.5)flowerBed(g,px,0.3,pz,4,0.1,0.75);}")
R2("  for(let k=0;k<3;k++)P(g,SP(R(0.2,0.3),1),pick(FLOW),R(-1.8,1.8),0.22,info.hook.z+R(0.9,1.6),{line:0.02,cast:false});",
   "  for(let k=0;k<2;k++)flowerBed(g,R(-1.8,1.8),0.0,info.hook.z+R(0.9,1.6),9,0.3,1.1);")
R2("    for(let k=0;k<4;k++)P(world,SP(0.07,0),pick(FLOW),x+R(-0.4,0.8),0.7+R(-0.1,0.15),z+R(-0.3,0.5),{line:0.01,cast:false});}",
   "    flowerBed(world,x+0.2,0.0,z+0.1,6,0.5,1.2);}")
R2("      P(g,SP(0.14,1),0x5aa847,x,top+0.3,cz,{line:0.015});const fc=pick(FLOW);\n      for(let j=0;j<6;j++){const t=j/6*PI*2;P(g,SP(0.06,0),fc,x+Math.cos(t)*0.1,top+0.36+R(0,0.06),cz+Math.sin(t)*0.1,{line:0.01,cast:false});}}",
   "      flowerBed(g,x,top+0.2,cz,6,0.07,0.9);}")
R2("const fc=pick(FLOW);\n      for(let j=0;j<7;j++){const h=R(0.5,0.8),xx=sx+R(-0.12,0.12),zz=1.45+R(-0.12,0.12);P(g,CY(0.012,0.012,h,4),0x4a9a40,xx,0.42+h/2,zz,{line:0,cast:false});P(g,SP(0.07,0),fc,xx,0.42+h,zz,{line:0.01,cast:false});}}",
   "flowerBed(g,sx,0.4,1.45,8,0.1,1.9);}")
# prato: i fiori a sfera diventano fiori veri istanziati, a chiazze della stessa specie
R2("fl.setMatrixAt(nf,d.matrix);c.setHex(pick(FLOW));fl.setColorAt(nf,c);nf++;}}","flowerSpots.push([x+R(-0.15,0.15),z+R(-0.15,0.15),R(0.8,1.35)]);nf++;}}")
R2("  const fl=new THREE.InstancedMesh(SP(0.075,0),tm(0xffffff),1400);fl.receiveShadow=true;","  const flowerSpots=[];")
R2("  grass.count=n;fl.count=nf;scene.add(grass);scene.add(fl);","""  grass.count=n;scene.add(grass);
  {const byType={};FLOWER_TYPES.forEach(t=>byType[t]=[]);
   flowerSpots.forEach(([x,z,s])=>{const q=hn(Math.floor(x/3.5),Math.floor(z/3.5),140),t=FLOWER_TYPES[Math.floor(q*5)%5];byType[rnd()<0.85?t:pick(FLOWER_TYPES)].push([x,z,s]);});
   const vc=(geo,hex)=>{const c=new THREE.Color(hex),a=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;};
   const greenMat=new THREE.MeshLambertMaterial({vertexColors:true}),petMat=new THREE.MeshLambertMaterial({color:0xffffff});
   FLOWER_TYPES.forEach(t=>{const L=byType[t];if(!L.length)return;const f=FLOWER_GEO[t];
     const gg=THREE.BufferGeometryUtils.mergeBufferGeometries([vc(f.stem.clone(),mute(FLOWER_STEM).getHex()),vc(f.center.clone(),mute(f.cc).getHex())]);
     const A=new THREE.InstancedMesh(f.petal,petMat,L.length),Bm=new THREE.InstancedMesh(gg,greenMat,L.length),d=new THREE.Object3D(),c=new THREE.Color();
     const pal=FLOWER_COLS[t],base=pick(pal);
     L.forEach(([x,z,s],i)=>{d.position.set(x,0,z);d.rotation.set(R(-0.2,0.2),rnd()*6,R(-0.2,0.2));d.scale.setScalar(s);d.updateMatrix();A.setMatrixAt(i,d.matrix);Bm.setMatrixAt(i,d.matrix);
       c.copy(mute(rnd()<0.75?base:pick(pal)));A.setColorAt(i,c);});
     for(const m of[A,Bm]){m.receiveShadow=true;m.frustumCulled=false;scene.add(m);}});}""")
