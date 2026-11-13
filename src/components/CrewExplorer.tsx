'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CrewSignals from './CrewSignals';
import { Health, ArrowRight } from 'iconsax-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const organs = [
  { id: 'heart', name: 'Heart', status: 'red', title: 'Poor condition · attention needed', text: 'Demo status: poor. This example is marked for prompt attention by the mission health team. Review the recorded symptoms and measurements and follow the approved care procedure.' },
  { id: 'lung', name: 'Lungs', status: 'yellow', title: 'Moderate condition · review needed', text: 'Demo status: moderate. Review the reported breathing discomfort, repeat the relevant checks according to mission guidance, and monitor changes. Arrange health-team review if concerns persist.' },
  { id: 'kidney', name: 'Kidneys', status: 'green', title: 'Good condition · routine follow-up', text: 'Demo status: good. No additional care is flagged in this example. Continue routine monitoring and scheduled checks; review any new symptoms or changes.' },
];
const regions = [
  { id:'chest-region', name:'Chest', status:'red', title:'Poor condition · attention needed', text:'Demo record: chest discomfort and an unusual heart-rate trend have been flagged. The mission health team should review the recorded symptoms and measurements using approved procedures.' },
  { id:'shoulder-region', name:'Shoulder', status:'yellow', title:'Moderate condition · review needed', text:'Demo record: shoulder soreness after activity. Review movement, workload and symptom changes with the mission health team.' },
  { id:'thigh-region', name:'Thigh', status:'yellow', title:'Moderate condition · review needed', text:'Demo record: muscle fatigue after exercise. Record how it changes and review the exercise routine according to mission guidance.' },
  { id:'arm-region', name:'Forearm', status:'green', title:'Good condition · routine follow-up', text:'Demo record: no additional care is flagged for this region. Continue the scheduled routine and record any new symptoms.' },
];
const records = [...organs, ...regions];

export default function CrewExplorer() {
  const host = useRef<HTMLDivElement>(null);
  const [mode,setMode] = useState('skeleton');
  const [selected,setSelected] = useState('');
  const [hover,setHover] = useState('');
  const dismissed=useRef('');
  const [anchor,setAnchor] = useState({x:50,y:40});
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const chosen = records.find(o=>o.id===(hover||selected));
  const hoverRecord = records.find(o=>o.id===hover);
  const displayName = (id:string) => records.find(o=>o.id===id)?.name || (/torso|shell|cavity/i.test(id) ? 'Torso' : id.replace(/MakeHuman|CC0|representative|connected|stub/gi,'').replace(/\s+/g,' ').trim());
  const nextStep = (status?:string) => status==='red' ? 'Contact the mission health team. Follow the approved care procedure.' : status==='yellow' ? 'Review symptoms and repeat the relevant checks according to mission guidance.' : status==='green' ? 'Continue routine monitoring and scheduled checks.' : 'Select a colored region to review its example health record.';

  const selectRef=useRef(selected);
  useEffect(()=>{selectRef.current=selected;},[selected]);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setTimeout(()=>{setError('3D is unavailable in this browser. Use the organ list to explore the records.');setLoading(false);},0);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.01,100);camera.position.set(0,0,4);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=false;controls.autoRotate=true;controls.autoRotateSpeed=.25;controls.touches.ONE=THREE.TOUCH.PAN;controls.minDistance=1.8;controls.maxDistance=7;
    scene.add(new THREE.HemisphereLight('#ffffff','#586477',2));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(3,4,5);scene.add(light);
    const draco=new DRACOLoader();draco.setDecoderPath('/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tweens:gsap.core.Tween[]=[];
    let disposed=false;const meshes:THREE.Mesh[]=[];let root:THREE.Object3D|undefined;
    loader.load(mode==='organs'?'/models/anatomy/torso.glb':'/models/anatomy/body.glb',gltf=>{
      if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(v=>v.dispose());}});return;}
      root=gltf.scene;const box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());const scale=2.6/Math.max(size.x,size.y,size.z);root.position.copy(center).multiplyScalar(-scale);root.scale.setScalar(scale);
      root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const old=Array.isArray(o.material)?o.material:[o.material];old.forEach(m=>m.dispose());const id=organs.find(a=>o.name.toLowerCase().includes(a.id))?.id || o.name.replace(/[_.]/g,' ').replace(/\d+$/,'').trim();const shell=/torso.*shell/i.test(o.name);let region=id;if(mode!=='organs'){const name=o.name.toLowerCase();if(/pectoralis/.test(name))region='chest-region';else if(/deltoid/.test(name))region='shoulder-region';else if(/rectus.femoris|vastus/.test(name))region='thigh-region';else if(/brachioradialis|flexor.carpi/.test(name))region='arm-region';}o.userData.organ=region;o.userData.shell=shell;o.material=new THREE.MeshStandardMaterial({color:'#e8e8e5',roughness:.65,transparent:shell,opacity:shell?.12:1,depthWrite:!shell});meshes.push(o);});scene.add(root);if(!reduced){const targetY=root.position.y;root.position.y-=.15;tweens.push(gsap.to(root.position,{y:targetY,duration:1.4,ease:'power3.out'}));}setLoading(false);
    },undefined,()=>{if(!disposed){setError('The anatomy model could not load. Please reload or use the organ list.');setLoading(false);}});
    const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();let highlighted='';let downX=0,downY=0;
    const hit=(e:PointerEvent)=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(meshes).find(h=>h.object.userData.organ && !h.object.userData.shell)?.object.userData.organ as string|undefined;};
    const move=(e:PointerEvent)=>{highlighted=hit(e)||'';if(highlighted!==dismissed.current)dismissed.current='';const rect=container.getBoundingClientRect();setAnchor({x:(e.clientX-rect.left)/rect.width*100,y:(e.clientY-rect.top)/rect.height*100});controls.autoRotate=!highlighted;setHover(highlighted===dismissed.current?'':highlighted);renderer.domElement.style.cursor=highlighted?'pointer':'grab';};
    const down=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;};const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-downX,e.clientY-downY)<6){const id=hit(e);if(id){setSelected(id);const mesh=meshes.find(m=>m.userData.organ===id);if(mesh){const point=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());const target=point.clone().multiplyScalar(.45);const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(camera.aspect<.8?3.8/camera.aspect:3.8);tweens.push(gsap.to(camera.position,{x:target.x+offset.x,y:target.y+offset.y,z:target.z+offset.z,duration:reduced?0:1.1,ease:'power3.inOut',overwrite:true}));tweens.push(gsap.to(controls.target,{x:target.x,y:target.y,z:target.z,duration:reduced?0:1.1,ease:'power3.inOut',overwrite:true}));}}}};
    const leave=(e:PointerEvent)=>{if(e.relatedTarget instanceof Element&&e.relatedTarget.closest('.callout-card'))return;highlighted='';setHover('');dismissed.current='';controls.autoRotate=true;};renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
    const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<.8?4.3/camera.aspect:4.3;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const neutral=new THREE.Color('#e8e8e5');const targetColor=new THREE.Color();const targetEmission=new THREE.Color();let last=performance.now();
    renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;controls.update();const blend=reduced?1:1-Math.exp(-dt*9);const pulse=reduced?1:.85+Math.sin(now*.004)*.15;
      meshes.forEach(mesh=>{const id=mesh.userData.organ;const material=mesh.material as THREE.MeshStandardMaterial;const active=id===highlighted||(!highlighted&&id===selectRef.current);const record=records.find(r=>r.id===id);const flagged=!!record;const status=record?.status;
        targetColor.copy(neutral);if(flagged)targetColor.set(status==='red'?'#ee4747':status==='yellow'?'#efc34d':'#59c788');
        if(highlighted&&!active&&!flagged)targetColor.multiplyScalar(.36);if(active&&!flagged)targetColor.set('#ceeadd');material.color.lerp(targetColor,blend);
        targetEmission.set(active?(flagged?(status==='red'?'#8f2427':status==='yellow'?'#796020':'#2f6a47'):'#365c4d'):'#000000');material.emissive.lerp(targetEmission,blend);material.emissiveIntensity=active?pulse:flagged?.4:.2;
      });renderer.render(scene,camera);
    });
    return()=>{tweens.forEach(t=>t.kill());disposed=true;observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();draco.dispose();meshes.forEach(mesh=>{mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();});renderer.dispose();renderer.domElement.remove();};
  },[mode]);
  return <main className="crew-page"><header className="journey-header crew-nav"><nav aria-label="Explore"><Link href="/crew-health">Crew health</Link><Link href="/#habitat">Habitat</Link></nav><Link className="journey-brand" href="/"><Health size={28} color="currentColor" variant="Bold" /> BEYOND</Link><Link className="header-action" href="/">Back to mission <ArrowRight color="currentColor" size={20}/></Link></header><div className="crew-heading"><h1>THE HUMAN<br/><span>WITHIN THE MISSION.</span></h1><p>Your body, in focus. Point to any structure to discover it. Scroll to explore the signals behind crew health.</p></div><div className="crew-workspace" id="body"><div className="anatomy-panel"><div className="anatomy-toolbar">{['organs','skeleton'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>{if(mode!==m){setLoading(true);setError('');setMode(m);}}}>{m==='organs'?'Internal organs':'Full body'}</button>)}</div><div className="anatomy-canvas" ref={host}/>{hover && <div className="anatomy-callout" aria-live="polite"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="callout-stroke"><stop stopColor="#d2645e"/><stop offset="1" stopColor="#a4c8d4"/></linearGradient></defs><path d={`M ${anchor.x} ${anchor.y} L 78 24 L 83 24 M ${anchor.x} ${anchor.y} L 83 43`} fill="none" stroke="url(#callout-stroke)" strokeWidth=".12"/><circle cx={anchor.x} cy={anchor.y} r=".55" fill="#d4e0d8"/></svg><div className={`callout-card status-${hoverRecord?.status || 'white'}`} key={hover}><button type="button" className="callout-close" aria-label="Close body details" onClick={()=>{dismissed.current=hover;setHover('');}}>×</button><p>CREW HEALTH · EXAMPLE RECORD</p><h3>{displayName(hover)}</h3><div className="callout-status"><i />{hoverRecord?.status==='red'?'Poor · needs attention':hoverRecord?.status==='yellow'?'Moderate · needs review':hoverRecord?.status==='green'?'Good · routine follow-up':'No recorded concern'}</div><div className="callout-observation"><b>Observation</b><p>{hoverRecord?.text || 'No health observation is linked to this anatomical structure.'}</p></div><div className="callout-next"><b>Next step</b><p>{nextStep(hoverRecord?.status)}</p></div><small>Click to keep this region selected</small></div></div>}{loading&&<p className="anatomy-loading" role="status">Loading anatomy…</p>}{error&&<p role="alert">{error}</p>}<p className="anatomy-help">Point to explore · drag to rotate · scroll to continue</p>{hover&&<p className="anatomy-hover">{records.find(o=>o.id===hover)?.name || hover}</p>}</div><aside className="organ-record"><p className="record-label">DEMONSTRATION RECORDS</p><div className="status-legend"><span className="legend-white">White · no data</span><span className="legend-green">Green · good</span><span className="legend-yellow">Yellow · moderate</span><span className="legend-red">Red · poor</span></div><div className="organ-list">{(mode==='organs'?organs:regions).map(o=><button key={o.id} aria-pressed={selected===o.id} onClick={()=>setSelected(o.id)}><i className={o.status}/>{o.name}<span>{o.status==='red'?'Needs attention':o.status==='yellow'?'Needs review':'Good condition'}</span></button>)}</div><div className="record-detail" key={selected}><h2>{displayName(hover||selected) || 'Explore the body'}</h2><h3>{chosen?.title || (selected ? 'Anatomical structure' : 'Point to a structure')}</h3><p>{chosen?.text || (selected ? 'This structure has no linked health record. White means unmarked. A wearable reading alone cannot identify an injury in an individual structure.' : 'Move across the body to see each structure’s name. Select a structure to keep it in focus, or switch to internal organs to explore the colored example records.')}</p></div><p className="anatomy-note">Colored areas are assigned demonstration cases, not live measurements or diagnoses. Point to any colored region to see its example record.</p></aside></div><CrewSignals /><aside className="anatomy-credits" aria-label="Anatomy model credits"><p>Body anatomy: Z-Anatomy / hpfrei · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Display materials recolored; geometry unchanged.<br/>Torso: <a href="https://www.innerscene.com/tools/library/3d-parts/torso-with-removable-organs-1fe1b70a">Innerscene / MakeHuman</a> · CC0.</p></aside></main>;
}
