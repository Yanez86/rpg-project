# Valfiorita in una bella giornata di sole, con le comparse in cel shading che passeggiano.
# Parte da valfiorita-pioggia.html e applica patch puntuali (ognuna deve trovare il suo punto esattamente le volte attese).
# Uso: python3 reference/build/sole.py   →   reference/valfiorita-sole.html
# Le comparse arrivano da reference/gente-sole.js (moduli del motore, collegati al three globale con engine/tools/three-global.js).
import os, re
HERE = os.path.dirname(os.path.abspath(__file__)); REF = os.path.dirname(HERE)
s = open(os.path.join(REF, 'valfiorita-pioggia.html')).read()
def R1(a, b, n=1):
    global s
    c = s.count(a); assert c == n, f'{c} occorrenze invece di {n}: {a[:70]!r}'
    s = s.replace(a, b)

# ---------- pagina ----------
R1('<title>Valfiorita sotto la pioggia</title>', '<title>Valfiorita al sole</title>')
R1('<span class="eyebrow">Valfiorita · pioggia</span>', '<span class="eyebrow">Valfiorita · giornata di sole</span>')
R1('aria-label="Vista in prima persona dalla piazza del mercato di un borgo fantasy sotto la pioggia, nella nebbia"',
   'aria-label="Vista in prima persona dalla piazza del mercato di un borgo fantasy in una giornata di sole, con gli abitanti che passeggiano"')
R1('<p class="keys touch-only">Trascina per guardare · joystick per camminare</p>',
   '<p class="keys touch-only">Trascina per guardare · joystick per camminare</p>\n  <p class="keys">Avvicinati agli abitanti: ti salutano.</p>')
# HUD raccolto in un bottone in basso a destra (come nelle pagine dei personaggi); il joystick resta fuori
R1('<div class="plate panel">', '<div class="hud" id="hud" hidden>\n<div class="plate panel">')
R1('<div class="home"><button class="act" id="home" type="button">Torna al mercato</button></div>',
   '<div class="home"><button class="act" id="home" type="button">Torna al mercato</button></div>\n</div>\n'
   '<button class="act hud-toggle" id="hudBtn" type="button" aria-expanded="false" aria-controls="hud">☰ Comandi</button>')
# il joystick è dopo i filtri nell'HTML: va spostato fuori dal pannello
m = re.search(r'<div class="stick" id="stick".*?</div></div>\n', s); stick = m.group(0); s = s.replace(stick, '', 1)
R1('<button class="act hud-toggle"', stick + '<button class="act hud-toggle"')
R1('</style>', """.hud-toggle { position: fixed; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); z-index: 5; }
.hud { position: fixed; right: max(16px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 64px); width: min(400px, calc(100% - 32px)); max-height: calc(100% - 110px); overflow-y: auto; display: flex; flex-direction: column; gap: 8px; z-index: 4; }
.hud[hidden] { display: none; }
.hud .plate, .hud .filters, .hud .home { position: static; max-width: none; }
.hud .filters, .hud .home { display: flex; flex-direction: row; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
</style>""")
R1('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
   """<script>{const h=document.getElementById('hud'),b=document.getElementById('hudBtn');const set=o=>{h.hidden=!o;b.setAttribute('aria-expanded',String(o));b.textContent=o?'✕ Chiudi':'☰ Comandi';document.getElementById('stick').style.visibility=o?'hidden':'';};b.addEventListener('click',()=>set(h.hidden));addEventListener('keydown',e=>{if(e.key==='Escape')set(false);});}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>""")

# ---------- cielo limpido e luce del sole ----------
R1('const FOG=new THREE.Color(0x97a29a);', 'const FOG=new THREE.Color(0xb4c8d6);   // foschia azzurra di una giornata limpida')
R1('scene.fog=new THREE.FogExp2(FOG,0.03);', 'scene.fog=new THREE.FogExp2(FOG,0.011);')
R1('dens:{value:0.03}', 'dens:{value:0.011}', 2)
R1('fN: { value: 0.03 }', 'fN: { value: 0.011 }', 2)
R1('const sunDir=new V(-0.35,0.86,-0.36).normalize();', 'const sunDir=new V(-0.42,0.66,0.62).normalize();   // sole di metà pomeriggio alle spalle di chi entra in piazza')
R1('scene.add(new THREE.HemisphereLight(0xc8d0c8,0x4a5044,0.95));', 'scene.add(new THREE.HemisphereLight(0xc4dcf2,0x6b5e44,0.55));   // cielo azzurro sopra, terra calda che rimbalza da sotto')
R1('scene.add(new THREE.AmbientLight(0xb8c4bc,0.18));', 'scene.add(new THREE.AmbientLight(0xfff2dc,0.06));')
R1('const sun=new THREE.DirectionalLight(0xdfe4dc,0.28);', 'const sun=new THREE.DirectionalLight(0xfff0d2,1.05);   // sole caldo: ombre nette e lunghe')
# cielo: azzurro che sale dalla foschia, alone del sole, cumuli bianchi con la pancia grigio-azzurra
R1('uniforms:{t:skyT,fogc:{value:FOG}}', 'uniforms:{t:skyT,fogc:{value:FOG},sunD:{value:sunDir}}')
R1('fragmentShader:`uniform float t;uniform vec3 fogc;varying vec3 vW;', 'fragmentShader:`uniform float t;uniform vec3 fogc,sunD;varying vec3 vW;')
R1('vec3 col=mix(fogc*1.05,fogc*0.8,smoothstep(0.0,0.7,y));col=mix(col,col*0.84,smoothstep(0.45,0.75,c)*smoothstep(0.05,0.4,y));',
   'vec3 col=mix(fogc*1.03,vec3(0.29,0.5,0.8),smoothstep(0.0,0.6,y));float sd=max(dot(d,sunD),0.0);'
   'col+=vec3(1.0,0.9,0.7)*(pow(sd,10.0)*0.22+step(0.9994,sd)*1.2);'
   'float cu=vn(uv*0.8+vec2(t*0.006,0.0))*0.5+vn(uv*1.9+vec2(t*0.009,3.0))*0.32+vn(uv*4.6+vec2(0.0,t*0.01))*0.18;'
   'float cov=smoothstep(0.56,0.66,cu)*smoothstep(0.03,0.22,y);vec3 cc=mix(vec3(0.74,0.79,0.86),vec3(1.0,0.98,0.94),smoothstep(0.6,0.78,cu));'
   'col=mix(col,mix(cc,fogc,1.0-smoothstep(0.03,0.3,y)),cov*0.95);')
R1('clouds.push([g,R(0.8,1.6)]);}', 'clouds.push([g,R(0.8,1.6)]);}\nclouds.forEach(c=>c[0].visible=false);   // le nuvole a palle della scena cartoon restano nascoste: ora sono nel cielo')

# ---------- di giorno le finestre non sono accese ----------
R1('const LIT={0x8fd3f5:0xffc070,0x9fdcff:0xffb45a,0xffeaa6:0xffd38a,0xffe9a0:0xffd38a};',
   'const LIT={0x8fd3f5:0x56636e,0x9fdcff:0xc89a62,0xffeaa6:0xd8bc8a,0xffe9a0:0xd8bc8a};   // vetri scuri con le tende, lanterne spente')

# ---------- niente pioggia: via gocce, pozzanghere, banchi di nebbia, cerchi sull'acqua ----------
R1('rain.frustumCulled=false;scene.add(rain);', 'rain.frustumCulled=false;scene.add(rain);const RAINING=false;rain.visible=false;')
R1('  for(let i=0;i<RAIN_N;i++){let x=rainPos[i*6]', '  if(RAINING)for(let i=0;i<RAIN_N;i++){let x=rainPos[i*6]')
R1('dripLines.frustumCulled=false;scene.add(dripLines);', 'dripLines.frustumCulled=false;scene.add(dripLines);dripLines.visible=false;')
R1('softTick(dt);dripTick(dt);', 'softTick(dt);')
R1('m.userData.keep=true;', 'm.userData.keep=true;m.visible=false;')
R1('s.al[i]=(0.14+0.06*Math.sin(T*0.3+ph))*Math.min(1,edge*3);', 's.al[i]=0;')
R1("""  for(let n=0;n<3;n++){const a=rnd()*PI*2,r=Math.sqrt(rnd())*3.4;simLow.drop(Math.cos(a)*r,Math.sin(a)*r,0.18,1);}
  {const a=rnd()*PI*2,r=Math.sqrt(rnd())*1.6;simMid.drop(Math.cos(a)*r,Math.sin(a)*r,0.15,1);}
  for(let n=0;n<6;n++)simRiv.drop(R(RX0,RX1),RZ+R(-1.8,1.8),0.16,1);""", '')
# acqua limpida che prende l'azzurro del cielo
R1('deep: { value: new THREE.Color(0x203a38) }, base: { value: new THREE.Color(0x30504a) }, lite: { value: new THREE.Color(0x6a8a82) },',
   'deep: { value: new THREE.Color(0x1d4a5a) }, base: { value: new THREE.Color(0x2e6a7a) }, lite: { value: new THREE.Color(0x78b0bc) },')
R1('foam: { value: new THREE.Color(0xc4d0ca) }', 'foam: { value: new THREE.Color(0xe2eef0) }')
R1('new THREE.Color(0x4a625d)', 'new THREE.Color(0x3c6a78)'); R1('new THREE.Color(0x7d948d)', 'new THREE.Color(0x76a6b2)'); R1('new THREE.Color(0xb4c4bf)', 'new THREE.Color(0xcfe4ea)')
# pulviscolo dorato nel sole e scintille sul fiume
R1('pollen.alpha[i]=0;}pollen.flush();', 'pollen.alpha[i]=Math.max(0,Math.sin(T*1.3+ph*5.0))*0.5;}pollen.flush();')
R1('glint.alpha[i]=0;}glint.flush();', 'glint.alpha[i]=Math.pow(Math.max(0,Math.sin(T*2.3+i*1.618)),6.0);}glint.flush();')

# ---------- post: asciutto, meno foschia, colori caldi ----------
R1('if(refl>0.5&&c4.a<0.95)c=ssr(uv,c,c4.a<0.6?0.8:(c4.a<0.75?0.42:0.2));', 'if(refl>0.5&&c4.a<0.6)c=ssr(uv,c,0.6);   // riflette solo l\'acqua: il selciato è asciutto')
R1('vec3 col=fogc*0.95;', 'vec3 col=mix(fogc,vec3(0.36,0.56,0.82),0.45);')
R1('c=mix(c,fogc,hf*0.55);', 'c=mix(c,fogc,hf*0.16);')
R1('smoothstep(0.6,0.95,l)', 'smoothstep(0.86,1.0,l)')
R1('c+=texture2D(tB,uv).rgb*0.55;', 'c+=texture2D(tB,uv).rgb*0.3;')
R1('c=mix(c,vec3(l),0.08);', 'c=mix(c,vec3(l),-0.05);')
R1('c=c*0.97+vec3(0.012,0.016,0.014);', 'c=c*0.97+vec3(0.016,0.012,0.006);')

# ---------- chi gioca ha gli occhi all'altezza degli abitanti; aggancio per le comparse ----------
R1('const START={x:-1.0,z:10.0,yaw:0.28,pitch:0.09};', 'let EYE=1.6;   // la imposta gente-sole.js con l\'altezza degli occhi di un abitante\nconst START={x:-1.0,z:10.0,yaw:0.28,pitch:0.02};')
R1('const gy=groundAt(player.x,player.z)+1.7;', 'const gy=groundAt(player.x,player.z)+EYE;')
R1('  renderFrame();requestAnimationFrame(tick);\n}', '  if(window.VF&&VF.onTick)VF.onTick(dt,T);\n  renderFrame();requestAnimationFrame(tick);\n}')
R1("requestAnimationFrame(tick);\naddEventListener('resize'",
   "window.VF={THREE,scene,camera,renderer,groundAt,collide,onPath,obs,player,PLAZA,ISL,setEye:h=>{EYE=h;player.y=groundAt(player.x,player.z)+h;},onTick:null};\n"
   "requestAnimationFrame(tick);\naddEventListener('resize'")
R1('})();\n</script>', """})();
</script>
<script type="importmap">{"imports":{"three":"../engine/tools/three-global.js"}}</script>
<script type="module" src="./gente-sole.js"></script>""")
open(os.path.join(REF, 'valfiorita-sole.html'), 'w').write(s)
print('scritto valfiorita-sole.html', len(s))
