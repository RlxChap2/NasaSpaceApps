'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function EarthGlobe() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
    camera.position.z = 4.5;
    const loader = new THREE.TextureLoader();
    const color = loader.load('/textures/planets/earth-day.jpg');
    color.colorSpace = THREE.SRGBColorSpace;
    const cloud = loader.load('/textures/planets/earth-clouds.jpg');
    const geo = new THREE.SphereGeometry(1, 96, 64);
    const material = new THREE.MeshStandardMaterial({ map: color, roughness: .8, metalness: 0 });
    const earth = new THREE.Mesh(geo, material);
    earth.rotation.set(.12, -1.5, .15);
    scene.add(earth);
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', alphaMap: cloud, transparent: true, opacity: .85, depthWrite: false });
    const clouds = new THREE.Mesh(geo, cloudMaterial);
    clouds.scale.setScalar(1.009); earth.add(clouds);
    const atmosphereMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader: 'varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.15,.4,.9,a*.38);}' });
    const atmosphere = new THREE.Mesh(geo, atmosphereMaterial); atmosphere.scale.setScalar(1.035); scene.add(atmosphere);
    scene.add(new THREE.AmbientLight('#92b0ce', .55));
    const sun = new THREE.DirectionalLight('#fff5e9', 3); sun.position.set(-3, 2, 5); scene.add(sun);
    const resize = () => { const w = container.clientWidth, h = container.clientHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.position.z = camera.aspect < 1 ? 3.9/camera.aspect : 4.5; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; }); intersection.observe(container);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last=0;
    renderer.setAnimationLoop(now => { const dt=Math.min((now-last)/1000,.05); last=now; if(!visible || document.hidden)return; if(!reduced){earth.rotation.y+=dt*.045;clouds.rotation.y+=dt*.007;} renderer.render(scene,camera); });
    return () => {observer.disconnect();intersection.disconnect();renderer.setAnimationLoop(null);geo.dispose();material.dispose();cloudMaterial.dispose();atmosphereMaterial.dispose();color.dispose();cloud.dispose();renderer.dispose();renderer.domElement.remove();};
  }, []);
  return <div className="earth-globe" ref={host} role="img" aria-label="A complete three-dimensional Earth with clouds and sunlight" />;
}
