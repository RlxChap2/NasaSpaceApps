import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { crewBodyModel } from '../crew-body-model';
import styles from './CrewDashboard.module.css';

type Region = 'heart' | 'brain' | 'muscle';

const regions: Record<Region, RegExp> = {
  heart: /pectoralis|heart/i,
  brain: /frontalis|temporalis|brain/i,
  muscle: /rectus.femoris|vastus|deltoid|humerus|femur|tibia|brachioradialis/i,
};

export default function CrewBodyFigure({ angle, selected, onHover, onSelect }: {
  angle: number;
  selected: Region;
  onHover: (region?: Region) => void;
  onSelect: (region: Region) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const update = useRef<((angle: number, selected: Region) => void) | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return; }

    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    scene.add(pivot);
    const highlights: Array<{ material: THREE.MeshStandardMaterial; region: Region }> = [];
    const meshes: THREE.Mesh[] = [];
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hit = (event: PointerEvent | MouseEvent): Region | undefined => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      ray.setFromCamera(pointer, camera);
      const intersection = ray.intersectObjects(meshes)[0];
      if (!intersection) return;
      if (intersection.point.y > 1.08) return 'brain';
      return intersection.object.userData.dashboardRegion;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const region = hit(event);
      renderer.domElement.style.cursor = region ? 'pointer' : '';
      onHover(region);
    };
    const leave = () => onHover();
    const click = (event: MouseEvent) => {
      const region = hit(event);
      if (region) onSelect(region);
    };
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerleave', leave);
    renderer.domElement.addEventListener('click', click);
    const camera = new THREE.OrthographicCamera(-1, 1, 1.5, -1.5, .1, 12);
    camera.position.z = 5;
    scene.add(new THREE.HemisphereLight('#fff', '#525252', 2.3));
    const light = new THREE.DirectionalLight('#fff', 2);
    light.position.set(3, 4, 5);
    scene.add(light);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    element.appendChild(renderer.domElement);
    const render = () => {
      const { clientWidth: width, clientHeight: height } = element;
      if (!width || !height) return;
      camera.left = -1.5 * width / height;
      camera.right = -camera.left;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(render);
    observer.observe(element);
    const draco = new DRACOLoader().setDecoderPath('/draco/');
    let disposed = false;
    let body: THREE.Object3D | undefined;
    let animation: gsap.core.Tween | undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dispose = (root: THREE.Object3D) => root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      for (const material of [object.material].flat()) material.dispose();
    });
    new GLTFLoader().setDRACOLoader(draco).load(crewBodyModel, ({ scene: model }) => {
      if (disposed) { dispose(model); return; }
      body = model;
      const bounds = new THREE.Box3().setFromObject(model);
      const scale = 2.82 / bounds.getSize(new THREE.Vector3()).y;
      model.scale.multiplyScalar(scale);
      model.position.sub(bounds.getCenter(new THREE.Vector3()).multiplyScalar(scale));
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        meshes.push(object);
        const region = (Object.keys(regions) as Region[]).find(key => regions[key].test(object.name));
        if (!region) return;
        const material = new THREE.MeshStandardMaterial({ color: '#ddd', roughness: .7 });
        for (const original of [object.material].flat()) original.dispose();
        object.material = material;
        object.userData.dashboardRegion = region;
        highlights.push({ material, region });
      });
      pivot.add(model);
      update.current = (rotation, region) => {
        animation?.kill();
        const start = pivot.rotation.y;
        const target = THREE.MathUtils.degToRad(rotation);
        const distance = Math.atan2(Math.sin(target - start), Math.cos(target - start));
        const colors = highlights.map(({ material, region: meshRegion }) => ({
          material, from: material.color.clone(), to: new THREE.Color(meshRegion === region ? '#bfbfbf' : '#ddd'),
        }));
        const draw = (progress: number) => {
          pivot.rotation.y = start + distance * progress;
          for (const { material, from, to } of colors) material.color.lerpColors(from, to, progress);
          renderer.render(scene, camera);
        };
        if (reducedMotion.matches) { draw(1); return; }
        const frame = { progress: 0 };
        animation = gsap.to(frame, {
          progress: 1, duration: Math.abs(distance) > .01 ? .36 : .18, ease: 'power2.out',
          onUpdate: () => draw(frame.progress),
        });
      };
      render();
      setVisible(true);
    }, undefined, () => {});

    return () => {
      disposed = true;
      animation?.kill();
      update.current = null;
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerleave', leave);
      renderer.domElement.removeEventListener('click', click);
      observer.disconnect();
      if (body) dispose(body);
      draco.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onHover, onSelect]);

  useEffect(() => { update.current?.(angle, selected); }, [angle, selected, visible]);

  return (
    <div className={styles.bodyFigure} aria-hidden="true">
      {!visible && <svg viewBox="0 0 220 340">
        <ellipse cx="110" cy="38" rx="25" ry="30" />
        <path d="M96 63 L94 78 L68 87 Q55 92 50 110 L31 188 Q28 200 38 204 Q47 208 52 196 L72 143 L75 193 L70 303 L62 319 Q61 326 74 327 L89 327 Q97 327 98 316 L110 222 L122 316 Q123 327 131 327 L146 327 Q159 326 158 319 L150 303 L145 193 L148 143 L168 196 Q173 208 182 204 Q192 200 189 188 L170 110 Q165 92 152 87 L126 78 L124 63Z" />
      </svg>}
      <div className={styles.bodyCanvas} ref={host} style={{ visibility: visible ? 'visible' : 'hidden' }} />
    </div>
  );
}
