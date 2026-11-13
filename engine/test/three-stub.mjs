// Stub di three: ogni classe/costante è un Proxy che accetta qualsiasi uso.
// Serve solo a trovare errori JavaScript (riferimenti mancanti, TDZ, import sbagliati), non errori degli shader.
function P2(name){ const f=function(){}; f.__c={}; return new Proxy(f,{
  get(t,k){ if(k===Symbol.toPrimitive) return ()=>1; if(k===Symbol.iterator) return function*(){}; if(k==='then') return undefined; if(k in t.__c) return t.__c[k];
    if(k==='array') { const a=new Float32Array(4096); t.__c[k]=a; return a; }
    if(k==='count'||k==='itemSize') return 4;
    const v=P2(name+'.'+String(k)); t.__c[k]=v; return v; },
  set(t,k,v){ t.__c[k]=v; return true; }, apply(){ return P2(name+'()'); }, construct(){ return P2('new '+name); } }); }
export const AddEquation=P2('AddEquation');
export const AdditiveBlending=P2('AdditiveBlending');
export const AmbientLight=P2('AmbientLight');
export const BackSide=P2('BackSide');
export const BoxGeometry=P2('BoxGeometry');
export const BufferAttribute=P2('BufferAttribute');
export const BufferGeometry=P2('BufferGeometry');
export const CanvasTexture=P2('CanvasTexture');
export const CircleGeometry=P2('CircleGeometry');
export const Clock=P2('Clock');
export const Color=P2('Color');
export const ConeGeometry=P2('ConeGeometry');
export const CustomBlending=P2('CustomBlending');
export const CylinderGeometry=P2('CylinderGeometry');
export const DataTexture=P2('DataTexture');
export const DepthTexture=P2('DepthTexture');
export const DirectionalLight=P2('DirectionalLight');
export const DoubleSide=P2('DoubleSide');
export const ExtrudeGeometry=P2('ExtrudeGeometry');
export const Float32BufferAttribute=P2('Float32BufferAttribute');
export const FogExp2=P2('FogExp2');
export const Group=P2('Group');
export const HemisphereLight=P2('HemisphereLight');
export const IcosahedronGeometry=P2('IcosahedronGeometry');
export const InstancedBufferAttribute=P2('InstancedBufferAttribute');
export const InstancedBufferGeometry=P2('InstancedBufferGeometry');
export const InstancedMesh=P2('InstancedMesh');
export const LatheGeometry=P2('LatheGeometry');
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
export const PlaneGeometry=P2('PlaneGeometry');
export const PointLight=P2('PointLight');
export const Points=P2('Points');
export const RGBAFormat=P2('RGBAFormat');
export const RepeatWrapping=P2('RepeatWrapping');
export const Scene=P2('Scene');
export const ShaderMaterial=P2('ShaderMaterial');
export const Shape=P2('Shape');
export const SphereGeometry=P2('SphereGeometry');
export const SrcAlphaFactor=P2('SrcAlphaFactor');
export const TorusGeometry=P2('TorusGeometry');
export const UnsignedIntType=P2('UnsignedIntType');
export const Vector2=P2('Vector2');
export const Vector3=P2('Vector3');
export const Vector4=P2('Vector4');
export const WebGLRenderTarget=P2('WebGLRenderTarget');
export const WebGLRenderer=P2('WebGLRenderer');
export const ZeroFactor=P2('ZeroFactor');
