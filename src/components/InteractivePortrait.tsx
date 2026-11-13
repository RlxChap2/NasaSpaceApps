'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PORTRAIT = '/assets/astronaut-eyes/portrait-original.png';
const vertex = `varying vec2 vUv;
varying vec3 vLocal;
void main(){vUv=uv;vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

const faceFragment = `
uniform sampler2D portrait;
uniform float blink;
varying vec2 vUv;
vec4 photo(vec2 p){return texture2D(portrait,vec2(p.x/627.,1.-p.y/350.));}
void main(){
 vec2 p=vec2(vUv.x*627.,(1.-vUv.y)*350.);
 vec4 color=photo(p);
 for(int i=0;i<2;i++){
   float cx=i==0?205.:416.;
   float cy=i==0?124.:124.;
   float halfWidth=i==0?43.:43.;
   float x=(p.x-cx)/halfWidth;
   if(abs(x)<1.){
     float arc=pow(max(0.,1.-x*x),.72);
     float slope=(i==0?-.035:-.065)*(p.x-cx);
     float originalTop=cy-18.*arc+slope;
     float originalBottom=cy+14.*arc+slope;
     float meeting=cy+5.*arc+slope;
     float top=mix(originalTop,meeting,blink);
     float bottom=mix(originalBottom,meeting,blink);
     if(p.y>top && p.y<bottom && blink<.999) discard;
     if(p.y>=originalTop-1. && p.y<=originalBottom+1. && blink>.001){
       float upper=1.-smoothstep(meeting-.4,meeting+.4,p.y);
       float upperDepth=clamp((p.y-originalTop)/max(1.,meeting-originalTop),0.,1.);
       float lowerDepth=clamp((originalBottom-p.y)/max(1.,originalBottom-meeting),0.,1.);
       vec2 skinUv=vec2(p.x,originalTop-2.-(1.-upperDepth)*7.);
       vec4 upperSkin=photo(skinUv);
       vec4 lowerSkin=photo(vec2(p.x,originalBottom+2.+(1.-lowerDepth)*5.));
       vec4 lid=mix(lowerSkin,upperSkin,upper);
       // A moving continuous lid edge occludes the globe, never another eye image.
       float edge=min(abs(p.y-top),abs(p.y-bottom));
       lid.rgb*=1.-.60*exp(-edge*edge/1.0)*arc;
       lid.rgb*=1.-.08*sin(upperDepth*3.14159)*upper;
       float coverage=smoothstep(originalTop-1.,originalTop+.5,p.y)*(1.-smoothstep(originalBottom-.5,originalBottom+1.,p.y));
       color=mix(color,lid,coverage);
     }
   }
 }
 gl_FragColor=color;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

const eyeFragment = `
uniform sampler2D portrait;
uniform vec2 irisCenter;
varying vec3 vLocal;
void main(){
 vec3 n=normalize(vLocal);
 float radius=length(vLocal.xy);
 float iris=1.-smoothstep(19.1,20.5,radius);
 vec2 uv=vec2((irisCenter.x+vLocal.x)/627.,1.-(irisCenter.y-vLocal.y)/350.);
 vec3 irisColor=texture2D(portrait,uv).rgb;
 float light=.38+.62*max(0.,dot(n,normalize(vec3(.5,.8,1.))));
 vec3 sclera=vec3(.26,.31,.32)*light;
 float vein=sin(vLocal.y*.8+sin(vLocal.x*.34)*2.)*.5+.5;
 sclera=mix(sclera,sclera*vec3(1.04,.96,.96),pow(vein,14.)*.12);
 vec3 color=mix(sclera,irisColor,iris);
 color*=.70+.30*smoothstep(-.8,.65,n.y);
 float glint=pow(max(0.,dot(n,normalize(vec3(.32,.48,1.)))),180.);
 color+=vec3(.12,.18,.2)*glint;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export default function InteractivePortrait() {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const container=host.current;
  if(!container)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  let disposed=false;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-313.5,313.5,175,-175,.1,1000);
  camera.position.z=300;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.domElement.className='portrait-webgl';
  Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',opacity:'0',display:'block'});
  renderer.domElement.setAttribute('aria-hidden','true');
  container.appendChild(renderer.domElement);
  const materials:THREE.ShaderMaterial[]=[];
  const geometries:THREE.BufferGeometry[]=[];
  const eyes:THREE.Mesh[]=[];
  let face:THREE.ShaderMaterial|undefined;
  let texture:THREE.Texture|undefined;
  const target=new THREE.Vector2();
  const gaze=new THREE.Vector2();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let previous=performance.now(),nextBlink=previous+3000,blinkStart=-Infinity;
  let elapsed=0;
  const move=(event:PointerEvent)=>{
   const rect=container.getBoundingClientRect();
   target.set(THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1),THREE.MathUtils.clamp(-((event.clientY-rect.top)/rect.height*2-1),-1,1));
  };
  const reset=()=>target.set(0,0);
  const resize=()=>{
   const width=Math.min(window.innerWidth,window.innerHeight*627/350);
   renderer.setSize(Math.max(1,Math.round(width)),Math.max(1,Math.round(width*350/627)),false);
  };
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  new THREE.TextureLoader().load(PORTRAIT,(loaded)=>{
   if(disposed){loaded.dispose();return;}
   texture=loaded;texture.colorSpace=THREE.SRGBColorSpace;
   texture.minFilter=THREE.LinearFilter;
   face=new THREE.ShaderMaterial({uniforms:{portrait:{value:texture},blink:{value:0}},vertexShader:vertex,fragmentShader:faceFragment});
   materials.push(face);
   const plane=new THREE.PlaneGeometry(627,350);geometries.push(plane);
   const portrait=new THREE.Mesh(plane,face);portrait.position.z=55;scene.add(portrait);
   for(const x of [205,416]){
    const geometry=new THREE.SphereGeometry(48,64,48);geometries.push(geometry);
    const material=new THREE.ShaderMaterial({uniforms:{portrait:{value:texture},irisCenter:{value:new THREE.Vector2(x===205?207:417,122)}},vertexShader:vertex,fragmentShader:eyeFragment});
    materials.push(material);
    const eye=new THREE.Mesh(geometry,material);
    eye.position.set(x-313.5,175-124,0);scene.add(eye);eyes.push(eye);
   }
   renderer.render(scene,camera);
   renderer.domElement.style.opacity='1';
   renderer.setAnimationLoop((now)=>{
    if(disposed||!face)return;
    if(document.hidden){previous=now;return;}
    const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;
    gaze.lerp(target,1-Math.exp(-dt*11));
    if(!reduced&&now>nextBlink){blinkStart=now;nextBlink=now+3500+Math.random()*4000;}
    const t=now-blinkStart;
    // Quick closing stroke, tiny closed hold, slower relaxed reopening.
    let closure=0;
    if(t<85)closure=THREE.MathUtils.smoothstep(t,0,85);
    else if(t<115)closure=1;
    else if(t<260)closure=1-THREE.MathUtils.smoothstep(t,115,260);
    face.uniforms.blink.value=closure;
    for(const eye of eyes){
     eye.rotation.y=gaze.x*.14;
     eye.rotation.x=-gaze.y*.10;
     if(!reduced){eye.rotation.y+=Math.sin(elapsed*1.7)*.0015;}
    }
    renderer.render(scene,camera);
   });
  });
  window.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);
  return()=>{
   disposed=true;renderer.setAnimationLoop(null);observer.disconnect();window.removeEventListener('pointermove',move);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);
   geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture?.dispose();renderer.dispose();renderer.domElement.remove();
  };
 },[]);
 return <div className="portrait-container" ref={host} style={{position:'relative',width:'min(100vw, 179.142857svh)',aspectRatio:'627 / 350'}}>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img className="portrait-poster" src={PORTRAIT} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}} alt="وجه رائدة فضاء بخوذة، تتحرك عيناها مع المؤشر وترمش" width={627} height={350} fetchPriority="high" />
 </div>;
}
