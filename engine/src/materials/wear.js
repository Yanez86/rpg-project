// Usura (weathering) iniettata in un materiale Lambert/Phong con onBeforeCompile.
// Lavora sulla posizione nel mondo: sporco che sale da terra, muschio alla base delle facce verticali,
// colature verticali, grana di sporco a blocchi di ~7 cm. Vedi docs/estetica.md §4.
export const WEAR_V='varying vec3 vWq;varying vec3 vNw;\n';
export function wear(m){m.onBeforeCompile=s=>{
  s.vertexShader=WEAR_V+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n{vec4 wq=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwq=instanceMatrix*wq;\n#endif\nvWq=(modelMatrix*wq).xyz;vNw=normalize(mat3(modelMatrix)*objectNormal);}');
  s.fragmentShader=WEAR_V+'float wh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\n'+s.fragmentShader.replace('#include <fog_fragment>',
   '{vec3 q=floor(vWq*14.0);float vert=1.0-abs(vNw.y);float y=vWq.y;float n=wh(q);'+
   'float g=mix(0.55,1.0,smoothstep(0.0,1.5,y-0.2+n*0.35));'+
   'vec2 tg=normalize(vec2(-vNw.z,vNw.x)+vec2(1e-4));float cl=floor(dot(vWq.xz,tg)*7.0);float s=wh(vec3(cl,3.1,7.7));'+
   'float sk=step(0.72,s)*smoothstep(0.0,1.0,fract(y*0.42+s*5.0))*(0.14+0.22*fract(s*13.7));'+
   'vec3 w=vec3(mix(1.0,g,vert*0.9+0.1));w*=1.0-sk*vert;'+
   'w*=mix(vec3(1.0),vec3(0.8,0.93,0.74),vert*(1.0-smoothstep(0.0,0.8,y-0.15+n*0.3)));'+
   'w*=0.9+0.12*n;w*=mix(1.0,0.84+0.16*wh(floor(vWq*5.0)),max(vNw.y,0.0));'+
   'gl_FragColor.rgb*=w;}\n#include <fog_fragment>');};
  m.customProgramCacheKey=()=>'wear';return m;}
