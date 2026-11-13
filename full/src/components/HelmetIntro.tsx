'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export default function HelmetIntro({ onComplete }: { onComplete?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState('Initializing mission');

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
    catch {
      container.setAttribute('aria-label', 'This device could not initialize the 3D introduction.');
      return;
    }
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .95;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', opacity: '0' });
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, .03, 60);
    camera.position.set(0, .06, 8.8);
    // NASA's catalog-derived sky supplies both the backdrop and glass reflections.
    let sky: THREE.Texture | undefined;
    let skyEnvironment: THREE.WebGLRenderTarget | undefined;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const helmet = new THREE.Group();
    scene.add(helmet);
    helmet.rotation.set(-.025, -.12, -.035);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const material = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = helmet) => {
      geometries.push(g); const object = new THREE.Mesh(g, m); parent.add(object); return object;
    };
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    // The typography is a texture mapped onto curved 3D glass, not a DOM overlay.
    const screen = document.createElement('canvas'); screen.width = 1024; screen.height = 1024;
    const context = screen.getContext('2d');
    const texture = new THREE.CanvasTexture(screen); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textMaterial = material(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    const textGeometry = new THREE.PlaneGeometry(1.58, .95, 40, 40);
    const positions = textGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i) + .36;
      positions.setXYZ(i, x, y, 1.47 - x * x * .20 - (y - .36) * (y - .36) * .12);
    }
    positions.needsUpdate = true;
    mesh(textGeometry, textMaterial);
    // Broad studio lights keep the shell readable while the background stays black.
    scene.add(new THREE.HemisphereLight(0x9db5d4, 0x080908, .38));
    const light = new THREE.DirectionalLight(0xffedd3, 4.0); light.position.set(-3, 4, 5); scene.add(light);
    const rim = new THREE.DirectionalLight(0x8dbff2, 3.3); rim.position.set(4, 1, -2); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb0c6d9, .65); fill.position.set(2, -2, 4); scene.add(fill);
    let disposed = false, started = false, exiting = false;
    let modelReady = false, skyReady = false;
    let lastStep = -1;
    const pointer = new THREE.Vector2();
    const motion = { reveal: 0, progress: 0, exit: 0 };
    const drawBoot = (progress: number) => {
      if (!context) return;
      const step = Math.floor(progress * 100);
      if (step === lastStep) return; lastStep = step;
      const c = context;
      c.clearRect(0, 0, 1024, 1024);
      c.textAlign = 'center';
      c.fillStyle = '#dce8df';
      c.font = '32px monospace';
      c.fillText('LOADING', 512, 420);
      c.font = '52px monospace';
      c.fillText(`${step}%`, 512, 525);
      c.strokeStyle = '#60796d'; c.lineWidth = 2;
      c.strokeRect(220, 590, 584, 18);
      c.fillStyle = '#b6debd';
      c.fillRect(225, 595, Math.round(574 * progress), 8);
      texture.needsUpdate = true;
    };
    const resize = () => {
      const width = window.innerWidth, height = window.innerHeight;
      renderer.setSize(width, height, false); camera.aspect = width / height;
      camera.fov = width < 650 ? 47 : 36; camera.updateProjectionMatrix();
    };
    resize();
    const pointerMove = (event: PointerEvent) => pointer.set(event.clientX / window.innerWidth - .5, event.clientY / window.innerHeight - .5);
    window.addEventListener('resize', resize); window.addEventListener('pointermove', pointerMove, { passive: true });
    const timeline = gsap.timeline({ delay: .65, paused: true });
    timeline.to(renderer.domElement, { opacity: 1, duration: reduced ? .1 : 1.5 })
      .to(motion, { reveal: 1, duration: reduced ? .1 : 1.8, ease: 'power2.out' }, '<')
      .to(textMaterial, { opacity: .94, duration: .7 }, '-=.7')
      .call(() => { started = true; setPhase('Running helmet boot sequence'); })
      .to(motion, { progress: 1, duration: 9, ease: 'none' })
      .to({}, { duration: 1.0 })
      .call(() => { exiting = true; setPhase('Entering mission'); })
      .to(motion, { exit: 1, duration: reduced ? .25 : 2.3, ease: 'power3.in' })
      .to(renderer.domElement, { opacity: 0, duration: .4 }, '-=.5')
      .call(() => { renderer.setAnimationLoop(null); renderer.clear(); setPhase('Mission ready'); onComplete?.(); });
    const startWhenReady = () => { if (modelReady && skyReady && !disposed) timeline.play(); };
    new THREE.TextureLoader().load('/textures/space/nasa-starmap-preview.jpg', loaded => {
      if (disposed) { loaded.dispose(); return; }
      sky = loaded;
      sky.colorSpace = THREE.SRGBColorSpace;
      sky.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = new THREE.Color('#000000');
      scene.backgroundIntensity = .12;
      scene.backgroundRotation.set(.22, 1.4, .48);
      skyEnvironment = pmrem.fromEquirectangular(sky);
      scene.environment = skyEnvironment.texture;
      skyReady = true;
      startWhenReady();
    }, undefined, () => { skyReady = true; startWhenReady(); });
    const starField = new THREE.Group();
    starField.rotation.set(.22, 1.4, .48);
    scene.add(starField);
    const skyAbort = new AbortController();
    fetch('/textures/space/stars-6.json', { signal: skyAbort.signal })
      .then(response => { if (!response.ok) throw new Error('Star catalog unavailable'); return response.json(); })
      .then((catalog: { features: Array<{ geometry: { coordinates: number[] }; properties: { mag: number; bv: string } }> }) => {
        if (disposed) return;
        const coordinates: number[] = [], brightness: number[] = [], colors: number[] = [];
        for (const star of catalog.features) {
          const ra = THREE.MathUtils.degToRad(star.geometry.coordinates[0]);
          const dec = THREE.MathUtils.degToRad(star.geometry.coordinates[1]);
          coordinates.push(38 * Math.cos(dec) * Math.cos(ra), 38 * Math.sin(dec), 38 * Math.cos(dec) * Math.sin(ra));
          brightness.push(Math.max(1.05, 5.5 - (star.properties.mag + 1.4) * .55));
          const bv = Number(star.properties.bv);
          const color = new THREE.Color('#e8efff');
          if (Number.isFinite(bv)) color.lerp(new THREE.Color(bv > .6 ? '#ffd6a6' : '#b5d2ff'), Math.min(.65, Math.abs(bv - .6) * .5));
          colors.push(color.r, color.g, color.b);
        }
        const geometry = new THREE.BufferGeometry(); geometries.push(geometry);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
        geometry.setAttribute('starSize', new THREE.Float32BufferAttribute(brightness, 1));
        geometry.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3));
        const stars = material(new THREE.ShaderMaterial({
          uniforms: { pixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) } },
          vertexShader: `attribute float starSize; attribute vec3 starColor; varying vec3 tint; uniform float pixelRatio;
          void main(){tint=starColor;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=starSize*pixelRatio;}`,
          fragmentShader: `varying vec3 tint;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float alpha=exp(-r*r*4.);gl_FragColor=vec4(tint,alpha);}`,
          transparent: true, depthWrite: false, toneMapped: false,
        }));
        starField.add(new THREE.Points(geometry, stars));
      }).catch(() => { /* NASA sky texture remains available as a fallback. */ });
    loader.load('/models/helmet/detailed-helmet.glb' , gltf => {
      if (disposed) {
        gltf.scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const originals = Array.isArray(object.material) ? object.material : [object.material];
            originals.forEach(m => m.dispose());
          }
        });
        return;
      }
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 3.3 / Math.max(size.x, size.y);
      model.scale.setScalar(scale);
      model.position.copy(center).multiplyScalar(-scale);
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.push(object.geometry);
        const originals = Array.isArray(object.material) ? object.material : [object.material];
        originals.forEach(original => {
          materials.push(original);
          if (original instanceof THREE.MeshStandardMaterial) {
            // Keep the authored base-color, normal, AO and metallic/roughness maps.
            original.envMapIntensity = 1.4;
            original.normalScale.set(1.1, 1.1);
            original.emissiveIntensity = .3;
            // Remove the baked HUD inside the visor without flattening the shell.
            original.onBeforeCompile = shader => {
              shader.vertexShader = 'varying vec3 helmetLocal;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nhelmetLocal=position;');
              shader.fragmentShader = 'varying vec3 helmetLocal;\n' + shader.fragmentShader;
              shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
                #include <map_fragment>
                float visorEllipse=pow(helmetLocal.x/.69,2.)+pow((helmetLocal.z+.10)/.76,2.);
                float cleanVisor=(1.-smoothstep(.90,1.02,visorEllipse))*smoothstep(.25,.43,helmetLocal.y);
                diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.009,.015,.019),cleanVisor);
              `).replace('#include <roughnessmap_fragment>', `
                #include <roughnessmap_fragment>
                roughnessFactor=mix(roughnessFactor,.22,cleanVisor);
              `).replace('#include <metalnessmap_fragment>', `
                #include <metalnessmap_fragment>
                metalnessFactor=mix(metalnessFactor,.68,cleanVisor);
              `).replace('#include <normal_fragment_maps>', `
                #include <normal_fragment_maps>
                normal=normalize(mix(normal,nonPerturbedNormal,cleanVisor));
              `).replace('#include <emissivemap_fragment>', `
                #include <emissivemap_fragment>
                totalEmissiveRadiance*=1.-cleanVisor;
              `);
            };
            original.customProgramCacheKey = () => 'clean-visor-v1';
            original.needsUpdate = true;
          }
        });
      });
      const facing = new THREE.Group();
      facing.add(model);
      facing.rotation.y = 0;
      helmet.add(facing);
      renderer.compile(scene, camera);
      modelReady = true;
      startWhenReady();
    }, undefined, () => {
      setPhase('Unable to load the helmet. Refresh to try again.');
    });
    const startedAt = performance.now();
    renderer.setAnimationLoop(() => {
      if (disposed) return;
      const t = (performance.now() - startedAt) / 1000;
      const float = reduced ? 0 : Math.sin(t * .48) * .11;
      helmet.position.x = reduced ? 0 : Math.sin(t * .25) * .075 * (1 - motion.exit);
      helmet.position.y = -.15 + float - (1 - motion.reveal) * .18;
      helmet.rotation.y = -.12 * (1 - motion.exit) + (reduced ? 0 : (pointer.x * .10 + Math.sin(t * .30) * .09) * (1 - motion.exit));
      helmet.rotation.x = -.025 + (reduced ? 0 : (pointer.y * .045 + Math.sin(t * .38) * .035) * (1 - motion.exit));
      helmet.rotation.z = (-.035 + (reduced ? 0 : Math.sin(t * .29) * .055)) * (1 - motion.exit);
      if (!reduced) {
        if (sky) scene.backgroundRotation.y = 1.4 + t * .006;
        starField.rotation.y = 1.4 + t * .006;
      }
      const zoom = motion.exit;
      camera.position.set(0, .06 + zoom * .04, 8.8 - zoom * 7.62);
      if (started) drawBoot(motion.progress);
      if (exiting) textMaterial.opacity = .94 * (1 - Math.pow(zoom, .65));
      renderer.render(scene, camera);
    });
    return () => {
      disposed = true; timeline.kill(); renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize); window.removeEventListener('pointermove', pointerMove);
      geometries.forEach(g => g.dispose()); materials.forEach(m => {
        if (m instanceof THREE.MeshStandardMaterial) {
          new Set([m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.emissiveMap]).forEach(t => t?.dispose());
        }
        m.dispose();
      }); texture.dispose(); skyAbort.abort(); sky?.dispose(); skyEnvironment?.dispose(); pmrem.dispose(); draco.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [onComplete]);

  return <div className="helmet-intro" ref={host}><span className="sr-only" role="status" aria-live="polite">{phase}</span></div>;
}
