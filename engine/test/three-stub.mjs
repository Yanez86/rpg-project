// Stub di three: ogni classe/costante è un Proxy che accetta qualsiasi uso.
// Serve solo a trovare errori JavaScript (riferimenti mancanti, TDZ, import sbagliati), non errori degli shader.
function P2(name){ const f=function(){}; f.__c={}; return new Proxy(f,{
  get(t,k){ if(k===Symbol.toPrimitive) return ()=>1; if(k===Symbol.iterator) return function*(){}; if(k==='then') return undefined; if(k in t.__c) return t.__c[k];
    if(k==='array') { const a=new Float32Array(4096); t.__c[k]=a; return a; }
    if(k==='count'||k==='itemSize') return 4;
    const v=P2(name+'.'+String(k)); t.__c[k]=v; return v; },
  set(t,k,v){ t.__c[k]=v; return true; }, apply(){ return P2(name+'()'); }, construct(t,args){ const o=P2('new '+name); if(['Mesh','InstancedMesh','Points','LineSegments'].includes(name)&&args[0]){ o.geometry=args[0]; o.material=args[1]; } return o; } }); }
export const AddEquation=P2('AddEquation');
export const AdditiveBlending=P2('AdditiveBlending');
export const AmbientLight=P2('AmbientLight');
export const BackSide=P2('BackSide');

export const CanvasTexture=P2('CanvasTexture');
export const Clock=P2('Clock');
export const Color=P2('Color');
export const CustomBlending=P2('CustomBlending');
export const DataTexture=P2('DataTexture');
export const DepthTexture=P2('DepthTexture');
export const DirectionalLight=P2('DirectionalLight');
export const DoubleSide=P2('DoubleSide');
export const FogExp2=P2('FogExp2');
export const Group=P2('Group');
export const HemisphereLight=P2('HemisphereLight');
export const InstancedMesh=P2('InstancedMesh');
export const LineBasicMaterial=P2('LineBasicMaterial');
export const LineSegments=P2('LineSegments');
export const LinearFilter=P2('LinearFilter');
export const LinearMipmapLinearFilter=P2('LinearMipmapLinearFilter');
export const Mesh=P2('Mesh');
export const MeshBasicMaterial=P2('MeshBasicMaterial');
export const MeshLambertMaterial=P2('MeshLambertMaterial');
export const MeshPhongMaterial=P2('MeshPhongMaterial');
export const NearestFilter=P2('NearestFilter');
export const NormalBlending=P2('NormalBlending');
export const Object3D=P2('Object3D');
export const OneFactor=P2('OneFactor');
export const OrthographicCamera=P2('OrthographicCamera');
export const PCFSoftShadowMap=P2('PCFSoftShadowMap');
export const PerspectiveCamera=P2('PerspectiveCamera');
export const PointLight=P2('PointLight');
export const Points=P2('Points');
export const RGBAFormat=P2('RGBAFormat');
export const RepeatWrapping=P2('RepeatWrapping');
export const Scene=P2('Scene');
export const ShaderMaterial=P2('ShaderMaterial');
export const Shape=P2('Shape');
export const SrcAlphaFactor=P2('SrcAlphaFactor');
export const UnsignedIntType=P2('UnsignedIntType');
export const Vector2=P2('Vector2');
export const Vector3=P2('Vector3');
export const Vector4=P2('Vector4');
export const WebGLRenderTarget=P2('WebGLRenderTarget');
export const WebGLRenderer=P2('WebGLRenderer');
export const ZeroFactor=P2('ZeroFactor');
export const AnimationClip=P2('AnimationClip');
export const QuaternionKeyframeTrack=P2('QuaternionKeyframeTrack');
export const VectorKeyframeTrack=P2('VectorKeyframeTrack');
export const AnimationMixer=P2('AnimationMixer');
export const Quaternion=P2('Quaternion');
export const Euler=P2('Euler');

// Geometrie e attributi "veri a metà": tengono gli attributi, così un attributo mai creato dà errore come nel browser.
class StubAttr { constructor(array, itemSize){ this.array = array && array.length !== undefined ? (Array.isArray(array) ? Float32Array.from(array) : array) : new Float32Array(12); this.itemSize = itemSize || 3; this.count = Math.floor(this.array.length / this.itemSize); }
  getX(i){ return this.array[i*this.itemSize]; } getY(i){ return this.array[i*this.itemSize+1]; } getZ(i){ return this.array[i*this.itemSize+2]; }
  setX(i,v){ this.array[i*this.itemSize]=v; return this; } setY(i,v){ this.array[i*this.itemSize+1]=v; return this; } setZ(i,v){ this.array[i*this.itemSize+2]=v; return this; }
  setXY(i,x,y){ this.setX(i,x); return this.setY(i,y); } setXYZ(i,x,y,z){ this.setX(i,x); this.setY(i,y); return this.setZ(i,z); } set(a,o){ this.array.set(a,o||0); return this; }
  getComponent(i,k){ return this.array[i*this.itemSize+k]; } }
class StubGeo { constructor(){ this.attributes={}; this.index=null; this.groups=[]; this.morphAttributes={}; }
  setAttribute(k,v){ this.attributes[k]=v; return this; } getAttribute(k){ return this.attributes[k]; } setIndex(i){ this.index=i; return this; }
  addGroup(){ } computeVertexNormals(){ } computeBoundingSphere(){ } computeBoundingBox(){ this.boundingBox=P2('box'); }
  translate(){ return this; } rotateX(){ return this; } rotateY(){ return this; } rotateZ(){ return this; } scale(){ return this; }
  toNonIndexed(){ return this; } clone(){ const g=new StubGeo(); g.attributes={...this.attributes}; return g; } applyMatrix4(){ return this; } dispose(){ } }
class PrimGeo extends StubGeo { constructor(){ super(); this.setAttribute('position', new StubAttr(null,3)); this.setAttribute('normal', new StubAttr(null,3)); this.setAttribute('uv', new StubAttr(new Float32Array(8),2)); } }
export const BufferGeometry=StubGeo, InstancedBufferGeometry=StubGeo;
export const BufferAttribute=StubAttr, Float32BufferAttribute=StubAttr, InstancedBufferAttribute=StubAttr;
export const BoxGeometry=PrimGeo;
export const CylinderGeometry=PrimGeo;
export const ConeGeometry=PrimGeo;
export const IcosahedronGeometry=PrimGeo;
export const SphereGeometry=PrimGeo;
export const PlaneGeometry=PrimGeo;
export const TorusGeometry=PrimGeo;
export const CircleGeometry=PrimGeo;
export const LatheGeometry=PrimGeo;
export const ExtrudeGeometry=PrimGeo;
export const ShapeGeometry=PrimGeo;
export const OctahedronGeometry=PrimGeo;
export const MeshToonMaterial=P2('MeshToonMaterial');
