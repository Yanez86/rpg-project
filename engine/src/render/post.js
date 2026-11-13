// Post-processing: SSAO → SSR sul bagnato → foschia bassa → bloom → color grading → scanlines.
// Il canale alpha della scena è la maschera dei riflessi (docs/estetica.md §4).
import * as THREE from 'three';
import { E } from '../core/context.js';

/**
 * opts: { pixelRatio, reflections:true, scanlines:true }
 * Restituisce { render(), resize(), set(name, bool) }.
 */
export function createPost(opts) {
  opts = opts || {}; const renderer = E.renderer, scene = E.scene, camera = E.camera, night = E.mood === 'night';
  const PR = opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 1.5);
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  rt.depthTexture = new THREE.DepthTexture(4, 4); rt.depthTexture.type = THREE.UnsignedIntType;
  const mkRT = () => new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const rtA = mkRT(), rtB = mkRT();
  const FSQ = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  const pass = (u, fs) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: FSQ, fragmentShader: fs, depthTest: false, depthWrite: false });
  const TH = night ? 'smoothstep(0.36,0.85,l)' : 'smoothstep(0.6,0.95,l)';
  const brightMat = pass({ tC: { value: rt.texture } }, `uniform sampler2D tC;varying vec2 vUv;void main(){vec3 c=texture2D(tC,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));gl_FragColor=vec4(c*${TH},1.0);}`);
  const blurMat = pass({ tI: { value: null }, dir: { value: new THREE.Vector2() } }, `uniform sampler2D tI;uniform vec2 dir;varying vec2 vUv;
    void main(){vec3 s=texture2D(tI,vUv).rgb*0.227;s+=(texture2D(tI,vUv+dir*1.385).rgb+texture2D(tI,vUv-dir*1.385).rgb)*0.316;s+=(texture2D(tI,vUv+dir*3.231).rgb+texture2D(tI,vUv-dir*3.231).rgb)*0.07;gl_FragColor=vec4(s,1.0);}`);
  const GRADE = night
    ? 'c+=texture2D(tB,uv).rgb*0.95;float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),0.04);c=clamp(c,0.0,1.0);c=mix(c,c*c*(3.0-2.0*c),0.2);c=c*0.97+vec3(0.006,0.01,0.016);'
    : 'c+=texture2D(tB,uv).rgb*0.55;float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),0.08);c=clamp(c,0.0,1.0);c=mix(c,c*c*(3.0-2.0*c),0.35);c=c*0.97+vec3(0.012,0.016,0.014);';
  const post = pass({
    res: { value: new THREE.Vector2(1, 1) }, tC: { value: rt.texture }, tD: { value: rt.depthTexture }, tB: { value: rtA.texture }, refl: { value: 1 }, scan: { value: 1 }, px: { value: 1 }, wt: E.time, fogc: { value: E.fog },
    proj: { value: camera.projectionMatrix }, projInv: { value: camera.projectionMatrixInverse }, view: { value: camera.matrixWorldInverse }, camW: { value: camera.matrixWorld }
  }, `uniform sampler2D tC,tD,tB;uniform float refl,wt,scan,px;uniform vec3 fogc;uniform mat4 proj,projInv,view,camW;uniform vec2 res;varying vec2 vUv;
  float gr(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  vec3 vpos(vec2 uv){vec4 q=projInv*vec4(uv*2.0-1.0,texture2D(tD,uv).r*2.0-1.0,1.0);return q.xyz/q.w;}
  // riflessi in spazio schermo: ray-march nella vista, normale increspata dalle gocce, Fresnel
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
  // occlusione ambientale in spazio schermo: 10 campioni, raggio 0,6 m, normale ricostruita dalla profondità
  float ssao(vec2 uv){vec3 P=vpos(uv);vec3 Px=vpos(uv+vec2(1.0/res.x,0.0)),Py=vpos(uv+vec2(0.0,1.0/res.y));vec3 N=normalize(cross(Px-P,Py-P));if(dot(N,-P)<0.0)N=-N;
    float z=max(-P.z,0.3);float o=0.0;float a0=gr(floor(gl_FragCoord.xy))*6.2832;
    for(int i=0;i<10;i++){float fi=float(i);float a=a0+fi*2.39996;float r=0.6*(0.15+0.85*(fi+0.5)/10.0);
      vec2 s=uv+vec2(cos(a)*proj[0][0],sin(a)*proj[1][1])*r*0.5/z;vec3 d=vpos(s)-P;float dl=length(d);
      o+=max(dot(N,d/max(dl,1e-4))-0.12,0.0)*smoothstep(1.5,0.3,dl);}
    return mix(1.0,clamp(1.0-o*0.24,0.0,1.0),smoothstep(60.0,18.0,z));}
  void main(){vec2 uv=vUv;vec4 c4=texture2D(tC,uv);vec3 c=c4.rgb;if(texture2D(tD,uv).r<0.99999)c*=mix(1.0,ssao(uv),0.85);
    if(refl>0.5&&c4.a<0.95)c=ssr(uv,c,c4.a<0.6?0.8:(c4.a<0.75?0.42:0.2));
    if(texture2D(tD,uv).r<0.99999){vec3 P=vpos(uv);vec3 Wp=(camW*vec4(P,1.0)).xyz;float dist=length(P);
      float hf=smoothstep(8.0,-1.0,Wp.y)*(1.0-exp(-max(dist-3.0,0.0)*0.06));c=mix(c,fogc,hf*0.55);}
    ${GRADE}
    c=mix(c,c*c*(3.0-2.0*c),0.2);
    if(scan>0.5){float ln=mod(floor(gl_FragCoord.y/px),3.0);c*=ln<1.0?0.72:1.05;c+=(gr(floor(gl_FragCoord.xy/px)+floor(wt*30.0))-0.5)*0.025;}
    gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}`);
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false; postScene.add(quad);
  const runPass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(postScene, postCam); };
  function resize() {
    const rw = Math.round(innerWidth * PR), rh = Math.round(innerHeight * PR), qw = Math.max(1, Math.round(rw / 4)), qh = Math.max(1, Math.round(rh / 4));
    rt.setSize(rw, rh); rtA.setSize(qw, qh); rtB.setSize(qw, qh); post.uniforms.res.value.set(rw, rh);
  }
  resize();
  if (opts.reflections === false) post.uniforms.refl.value = 0;
  if (opts.scanlines === false) post.uniforms.scan.value = 0;
  return {
    resize,
    set(name, on) { if (name === 'reflections') post.uniforms.refl.value = on ? 1 : 0; if (name === 'scanlines') post.uniforms.scan.value = on ? 1 : 0; },
    render() {
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      runPass(brightMat, rtA);
      for (const k of [1, 2]) { blurMat.uniforms.tI.value = rtA.texture; blurMat.uniforms.dir.value.set(k / rtA.width, 0); runPass(blurMat, rtB); blurMat.uniforms.tI.value = rtB.texture; blurMat.uniforms.dir.value.set(0, k / rtA.height); runPass(blurMat, rtA); }
      runPass(post, null);
    }
  };
}
