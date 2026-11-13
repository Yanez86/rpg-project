# ---------- ricchezza: dettaglio, valori, colori d'accento, vegetazione, strati ----------
# colori meno spenti (prima il 38% del colore veniva lavato via)
R2("c.r=(c.r*.62+l*.38)*.86;c.g=(c.g*.62+l*.38)*.88;c.b=(c.b*.62+l*.38)*.84;","c.r=(c.r*.8+l*.2)*.9;c.g=(c.g*.8+l*.2)*.92;c.b=(c.b*.8+l*.2)*.88;")
# tegole: file piccole, ognuna con la sua ombra netta sotto e il bordo chiaro sopra
R2("""const tilePix=(u,v,S)=>{const row=v>>4,off=(row&1)*8,col=((u+off)>>4),lu=(u+off)&15,lv=v&15;
  const b=150+hn(col,row,1)*70,q=hn(u,v,2);if(lv===15||(lv>10&&(lu===0||lu===15)))return G(b*0.42);if(lv<=1)return G(b*1.14);if(q<.025&&lv>8)return[95,118,80];return G(b*(0.88+q*.18)-(lv>10?(lv-10)*6:0)+(lu<3?8:0));};""",
"""const tilePix=(u,v,S)=>{const row=v>>3,off=(row&1)*4,col=((u+off)>>3),lu=(u+off)&7,lv=v&7;
  const b=135+hn(col,row,1)*100,q=hn(u,v,2);if(lv===7)return G(b*0.2);if(lv===6)return G(b*0.48);if(lu===0&&lv>1)return G(b*0.5);
  if(lv===0)return G(Math.min(255,b*1.3));if(q<.035&&lv>2)return[78,110,66];return G(b*(0.9+q*.16)-(lv-1)*8+(lu<2?12:0));};""")
# fogliame a macchie: buchi scuri, foglie chiare, alta frequenza
R2("  ivy:(()=>{","  leaf:pix(32,(u,v)=>{const q=hn(u>>1,v>>1,50),p=hn(u,v,51);if(q<.2)return G(60+p*30);if(q>.88)return G(255);return G(140+q*100+p*25);}),\n  ivy:(()=>{")
# vetri: interno caldo con tende ai lati e un centro più acceso
R2("function tm(color,o){","""const WINTEX=pix(16,(u,v)=>{const cx=Math.abs(u-7.5)/8,cy=Math.abs(v-8.5)/8;let b=255-cx*cx*90-cy*60;if(u<3||u>12)b-=70+hn(u,v>>1,60)*30;if(v<2)b-=40;if(hn(u>>2,v>>2,61)<.12)b-=50;return G(b);});
function tm(color,o){""")
R2("if(LIT[color]!=null)mats[k]=new THREE.MeshBasicMaterial({color:LIT[color]});","if(LIT[color]!=null)mats[k]=new THREE.MeshBasicMaterial({color:LIT[color],map:color===0x8fd3f5?WINTEX:null});")
R2("const LIT={0x8fd3f5:0xffa848,","const LIT={0x8fd3f5:0xffc070,")
# finestre più grandi, a griglia di listelli
R2("""  P(g,B(0.84,1.04,0.08),0x4a3628,x,y,zf+0.02,{line:0.025,cast:false});
  P(g,B(0.64,0.84,0.06),0x8fd3f5,x,y,zf+0.05,{line:0,cast:false});
  P(g,B(0.05,0.84,0.08),TIMBER,x,y,zf+0.07,{line:0,cast:false});
  P(g,B(0.64,0.05,0.08),TIMBER,x,y+0.05,zf+0.07,{line:0,cast:false});
  P(g,B(0.64,0.04,0.08),TIMBER,x,y-0.18,zf+0.07,{line:0,cast:false});P(g,B(0.64,0.04,0.08),TIMBER,x,y+0.28,zf+0.07,{line:0,cast:false});
  if(sh!=null)for(const s of[-1,1]){P(g,B(0.34,0.98,0.05),sh,x+s*0.61,y,zf+0.04,{line:0.02,cast:false});
    for(const dy of[-0.25,0.25])P(g,B(0.3,0.04,0.02),0xffffff,x+s*0.61,y+dy,zf+0.075,{line:0,cast:false});}
  P(g,B(1.0,0.08,0.2),0xfff8ea,x,y-0.55,zf+0.08,{line:0.015,cast:false});
  if(box){P(g,B(0.86,0.2,0.24),0x8a5d3c,x,y-0.7,zf+0.16,{line:0.015,cast:false});
    P(g,SP(0.13,0),0x5aa847,x-0.2,y-0.55,zf+0.17,{line:0,cast:false});P(g,SP(0.13,0),0x5aa847,x+0.2,y-0.55,zf+0.17,{line:0,cast:false});
    for(let i=0;i<6;i++)P(g,SP(0.07,0),pick(FLOW),x-0.34+i*0.136,y-0.48+R(-0.04,0.04),zf+0.16+R(-0.06,0.06),{line:0.01,cast:false});}""",
"""  P(g,B(1.06,1.3,0.08),0x3a2a20,x,y,zf+0.02,{line:0.025,cast:false});
  P(g,B(0.88,1.1,0.06),0x8fd3f5,x,y,zf+0.05,{line:0,cast:false});
  for(const fx of[-0.22,0,0.22])P(g,B(fx?0.035:0.05,1.1,0.08),0x2a1e16,x+fx,y,zf+0.07,{line:0,cast:false});
  for(const fy of[-0.28,0,0.28])P(g,B(0.88,fy?0.035:0.05,0.08),0x2a1e16,x,y+fy,zf+0.07,{line:0,cast:false});
  P(g,B(1.12,0.1,0.14),0x3a2a20,x,y+0.66,zf+0.08,{line:0,cast:false});
  if(sh!=null)for(const s of[-1,1]){P(g,B(0.42,1.22,0.05),sh,x+s*0.76,y,zf+0.04,{line:0.02,cast:false});
    for(const dy of[-0.32,0.32])P(g,B(0.38,0.04,0.02),0x2a1e16,x+s*0.76,y+dy,zf+0.075,{line:0,cast:false});}
  P(g,B(1.2,0.08,0.22),0xfff8ea,x,y-0.68,zf+0.08,{line:0.015,cast:false});
  if(box){P(g,B(1.0,0.22,0.26),0x7a4d2c,x,y-0.84,zf+0.17,{tex:'wood',line:0.015,cast:false});
    for(let i=0;i<5;i++)P(g,SP(R(0.1,0.15),1),pick([0x4f8a3a,0x3f7a34,0x5a9a42]),x-0.4+i*0.2,y-0.66,zf+0.18+R(-0.04,0.04),{tex:'leaf',line:0,cast:false});
    for(let i=0;i<9;i++)P(g,SP(0.06,0),pick(FLOW),x-0.44+i*0.11,y-0.58+R(-0.05,0.05),zf+0.2+R(-0.08,0.08),{line:0.01,cast:false});
    for(let i=0;i<4;i++)P(g,B(0.05,R(0.2,0.4),0.05),0x3f7a34,x-0.36+i*0.24,y-1.0-R(0,0.15),zf+0.32,{line:0,cast:false});}""")
# fronte della casa, per gli stendardi accanto alla porta
R2("  return {rad:Math.max(W2,D2)*0.72+0.3,hook:new V(0,h1+h2*0.55,D2/2+0.1),eaves};","  return {rad:Math.max(W2,D2)*0.72+0.3,hook:new V(0,h1+h2*0.55,D2/2+0.1),eaves,front:d/2};")
R2("  return {rad:r+1.0,hook:new V(0,h*0.85,r),eaves};","  return {rad:r+1.0,hook:new V(0,h*0.85,r),eaves,front:r-0.05};")
R2("  return {rad:w*0.75+0.5,hook:new V(0,h*0.55,w/2),eaves};","  return {rad:w*0.75+0.5,hook:new V(0,h*0.55,w/2),eaves,front:w/2};")
# vasi: cespugli a macchie di foglie
R2("P(g,SP(R(0.2,0.3),1),pick([0x4f7a3a,0x5a8a42,0x3f6a34]),px,0.42,pz,{line:0});","P(g,SP(R(0.24,0.34),1),pick([0x4f8a3a,0x5a9a42,0x3f7a34]),px,0.45,pz,{tex:'leaf',line:0});")
R2("function houseDetails(g,info,ring){\n  const fz=info.hook.z;","""function houseDetails(g,info,ring){
  const fz=info.hook.z,fr=info.front;
  // stendardi di stoffa ai lati della porta: l'accento rosso che fa vibrare il grigio
  if(rnd()<(ring?0.75:0.45)){const c=pick([0xc8302a,0xb22a34,0xd0402a,0x2a58a8]),gold=0xe0b048;
    for(const s of[-1,1]){const x=s*0.79;P(g,B(0.06,0.06,0.3),0x2a1e16,x,2.08,fr+0.12,{line:0,cast:false});P(g,B(0.3,0.05,0.05),0x2a1e16,x,2.08,fr+0.26,{line:0,cast:false});
      P(g,B(0.24,1.5,0.025),c,x,1.32,fr+0.26,{line:0,cast:false});P(g,B(0.16,0.16,0.03),gold,x,1.72,fr+0.27,{rot:[0,0,PI/4],line:0,cast:false});
      P(g,B(0.08,0.08,0.035),c,x,1.72,fr+0.28,{rot:[0,0,PI/4],line:0,cast:false});P(g,B(0.22,0.05,0.03),gold,x,1.2,fr+0.27,{line:0,cast:false});
      for(let k=0;k<4;k++)P(g,B(0.03,0.12,0.02),gold,x-0.09+k*0.06,0.52,fr+0.26,{line:0,cast:false});}}
  // insegna appesa a una staffa
  if(ring&&rnd()<0.45){const s=rnd()<.5?-1:1,x=s*1.55;P(g,B(0.04,0.04,0.7),0x2a1e16,x,2.6,fr+0.35,{line:0,cast:false});
    P(g,uvB(0.06,0.5,0.6,1,1),pick([0x6a3a24,0x2f4a6a,0x5a2a3a]),x,2.25,fr+0.5,{tex:'wood',line:0.02,cast:false});
    P(g,SP(0.1,0),pick([0xe0b048,0xd0402a,0x5aa847]),x+s*0.035,2.25,fr+0.5,{scale:[0.4,1,1],line:0,cast:false});}""")
# alberi: chioma fatta di tante macchie di foglie in tre toni, non una sfera liscia
R2("""    P(g,SP(r,1),col,0,h+r*0.7,0,{line:0.06});
    for(let i=0;i<3;i++){const t=i/3*PI*2;P(g,SP(r*R(0.55,0.7),1),col,Math.cos(t)*r*0.7,h+r*R(0.5,1.0),Math.sin(t)*r*0.7,{line:0.05});}""",
"""    const tones=[col,new THREE.Color(col).multiplyScalar(0.72).getHex(),new THREE.Color(col).lerp(new THREE.Color(0xe8f0a0),0.25).getHex()];
    P(g,SP(r*0.9,1),tones[1],0,h+r*0.7,0,{tex:'leaf',uv:[3,3],line:0.06});
    for(let i=0;i<11;i++){const t=rnd()*PI*2,e=R(-0.3,1),rr=r*R(0.45,0.95);
      P(g,SP(r*R(0.32,0.5),1),tones[i<4?1:i<8?0:2],Math.cos(t)*rr*0.85,h+r*0.7+e*r*0.65,Math.sin(t)*rr*0.85,{tex:'leaf',uv:[2,2],line:0.04});}""")
R2("    for(let i=0;i<4;i++)P(g,CO((2.0-i*0.42)*s,2.1*s,9),i%2?0x2f8f5a:0x3aa36a,0,(1.7+i*1.15)*s,0,{line:0.05});",
   "    for(let i=0;i<4;i++)P(g,CO((2.0-i*0.42)*s,2.1*s,9),i%2?0x2f7f4a:0x3a935a,0,(1.7+i*1.15)*s,0,{tex:'leaf',uv:[4,2],line:0.05});")
R2("  else{const c=pick([0x5aa847,0x6cbc4f]);P(world,SP(R(0.5,0.8),1),c,x,0.35,z,{line:0.035});P(world,SP(R(0.35,0.55),1),c,x+0.5,0.3,z+0.2,{line:0.03});",
   "  else{const c=pick([0x4f9a3f,0x5aa847]);P(world,SP(R(0.5,0.8),1),c,x,0.35,z,{tex:'leaf',uv:[2,2],line:0.035});P(world,SP(R(0.35,0.55),1),c,x+0.5,0.3,z+0.2,{tex:'leaf',line:0.03});")
# altri alberi e cespugli: più pieno
R2("{let tries=0,n=0;while(n<60&&tries++<2000){","{let tries=0,n=0;while(n<95&&tries++<3000){")
R2("for(let i=0;i<40;i++){const a=rnd()*PI*2,r=R(12,43)","for(let i=0;i<90;i++){const a=rnd()*PI*2,r=R(12,43)")
# acqua della fontana meno bianca: non deve mangiarsi la scena
R2("deep: { value: new THREE.Color(0x5f7c76) }, base: { value: new THREE.Color(0x9db2ab) }, lite: { value: new THREE.Color(0xd8e2de) }",
   "deep: { value: new THREE.Color(0x4a625d).multiplyScalar(WATER_K) }, base: { value: new THREE.Color(0x7d948d).multiplyScalar(WATER_K) }, lite: { value: new THREE.Color(0xb4c4bf).multiplyScalar(WATER_K) }")
# pareti di roccia coperte di bosco attorno all'isola: piani lontani che la nebbia schiarisce a strati (prospettiva aerea)
R2("/* ================= unione della geometria statica ================= */","""/* ---------- pareti verdi lontane, a strati nella nebbia ---------- */
const WATER_K=1.0,CLIFF_K=1.0;
{const cliffMat=(col,fogMix)=>new THREE.ShaderMaterial({fog:false,uniforms:{map:{value:TEX.leaf},col:{value:new THREE.Color(col).multiplyScalar(CLIFF_K)},fogc:{value:FOG},mixK:{value:fogMix}},
    vertexShader:'varying vec2 vUv;varying float vY;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vY=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'uniform sampler2D map;uniform vec3 col,fogc;uniform float mixK;varying vec2 vUv;varying float vY;void main(){vec3 c=col*texture2D(map,vUv).rgb;float m=mixK+(1.0-smoothstep(-14.0,22.0,vY))*(1.0-mixK)*0.75;gl_FragColor=vec4(mix(c,fogc,clamp(m,0.0,1.0)),1.0);}'});
  const layers=[[56,0.42,0x3e5a3a,0x6a7466],[74,0.6,0x46604a,0x7a8478],[96,0.76,0x50685a,0x86908a]];
  layers.forEach(([rad,fm,green,rock],li)=>{const gm=cliffMat(green,fm),rm=cliffMat(rock,fm+0.05);
    const n=li===0?11:li===1?14:16;
    for(let i=0;i<n;i++){const a=(i+R(-0.3,0.3))/n*PI*2+li*0.4,r=rad+R(-6,6),x=Math.cos(a)*r,z=Math.sin(a)*r,h=R(26,48)*(1+li*0.25),w=R(7,12)*(1+li*0.3);
      const col=new THREE.Mesh(new THREE.CylinderGeometry(w*0.75,w,h,7,4),rm);uvS(col.geometry,4,h/8);col.position.set(x,h/2-26,z);col.rotation.y=rnd()*3;scene.add(col);
      for(let k=0;k<6;k++){const t=rnd()*PI*2,yy=R(-0.2,0.5)*h,s=w*R(0.45,0.75);const b=new THREE.Mesh(SP(s,1),gm);uvS(b.geometry,3,3);
        b.position.set(x+Math.cos(t)*w*0.6,yy-26+h/2*0.6,z+Math.sin(t)*w*0.6);b.scale.y=R(0.7,1.1);scene.add(b);}
      const top=new THREE.Mesh(SP(w*0.95,1),gm);uvS(top.geometry,4,4);top.scale.y=0.55;top.position.set(x,h-26,z);scene.add(top);
      if(li===0&&rnd()<0.35){const fall=new THREE.Mesh(new THREE.PlaneGeometry(1.4,h*0.7),new THREE.MeshBasicMaterial({color:new THREE.Color(0xc8d4d0).multiplyScalar(CLIFF_K).lerp(FOG,0.45),fog:false}));
        fall.position.set(x-Math.cos(a)*w*0.8,h*0.35-26+h*0.15,z-Math.sin(a)*w*0.8);fall.lookAt(0,fall.position.y,0);scene.add(fall);}}
  });}

/* ================= unione della geometria statica ================= */""")
# finestre del pianterreno senza scuri e più all'esterno, per lasciare posto agli stendardi
R2("  win(g,-w*0.32,1.45,d/2,sh,rnd()<0.6);win(g,w*0.32,1.45,d/2,sh,rnd()<0.6);","  win(g,-w*0.38,1.45,d/2,null,rnd()<0.7);win(g,w*0.38,1.45,d/2,null,rnd()<0.7);")
# gerarchia dei valori: neri più profondi e colori meno lavati
R2("c=c*0.92+vec3(0.03,0.04,0.035);","c=c*0.97+vec3(0.012,0.016,0.014);")
R2("float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),0.18);","float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),0.08);c=clamp(c,0.0,1.0);c=mix(c,c*c*(3.0-2.0*c),0.35);")
