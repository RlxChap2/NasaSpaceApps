'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import Image from 'next/image';
import EarthGlobe from './EarthGlobe';
import MissionFaq from './MissionFaq';
import MissionFooter from './MissionFooter';
import MissionLink from './MissionLink';
import MissionStories from './MissionStories';
import { ArrowDown, ArrowRight, Health, ShieldTick, Moon, People, Wind, Activity } from 'iconsax-react';

export default function SpaceJourney() {
  const host = useRef<HTMLDivElement>(null);
  const moonCopy = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); } catch { return; }
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, .1, 100);
    camera.position.z = 8;
    const resources: THREE.Texture[] = [];
    const materials: THREE.Material[] = [];
    const geometry = new THREE.SphereGeometry(1, 128, 80);
    const loader = new THREE.TextureLoader();
    let disposed = false;
    const load = (url: string, color = true) => {
      const texture = loader.load(url, loaded => { if (disposed) loaded.dispose(); });
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      resources.push(texture); return texture;
    };
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: load('/textures/planets/moon-color.jpg'),
      bumpMap: load('/textures/planets/moon-height.jpg', false),
      bumpScale: .025, roughness: .98, metalness: 0, color: '#c9c9c7',
    });
    const moon = new THREE.Mesh(geometry, moonMaterial);
    moon.rotation.set(.1, -1.1, .07); moon.scale.setScalar(3.25); scene.add(moon);
    materials.push(moonMaterial);
    scene.add(new THREE.AmbientLight(0x96abc6, .19));
    const sun = new THREE.DirectionalLight(0xfff4e6, 3.1); sun.position.set(-5, 3, 6); scene.add(sun);
    const edge = new THREE.DirectionalLight(0x8fb4d8, .35); edge.position.set(4, -1, -3); scene.add(edge);
    // Real catalog coordinates; a fixed celestial sphere keeps stars at infinity.
    const starGroup = new THREE.Group(); scene.add(starGroup);
    let starGeometry: THREE.BufferGeometry | undefined;
    const abort = new AbortController();
    fetch('/textures/space/stars-6.json', { signal: abort.signal }).then(r => r.json()).then((data: { features: Array<{ geometry: { coordinates: number[] }; properties: { mag: number } }> }) => {
      if (disposed) return;
      const points: number[] = [], sizes: number[] = [];
      data.features.forEach(star => {
        const ra = THREE.MathUtils.degToRad(star.geometry.coordinates[0]);
        const dec = THREE.MathUtils.degToRad(star.geometry.coordinates[1]);
        points.push(40*Math.cos(dec)*Math.cos(ra),40*Math.sin(dec),40*Math.cos(dec)*Math.sin(ra));
        sizes.push(Math.max(.9, 4.8 - (star.properties.mag+1.4)*.5));
      });
      starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, toneMapped: false,
        uniforms: { ratio: { value: Math.min(window.devicePixelRatio, 1.75) } },
        vertexShader: `attribute float size;uniform float ratio;void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*ratio;}`,
        fragmentShader: `void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.78,.85,1.,exp(-r*r*4.)*.7);}`,
      });
      materials.push(material); starGroup.add(new THREE.Points(starGeometry, material));
      starGroup.rotation.set(.2, 1.4, .45);
    }).catch(() => {});
    const rise = { value: reduced ? 1 : 0 };
    const entrance = gsap.to(rise, { value: 1, duration: 2, ease: 'power3.out' });
    const copyAnimation = gsap.fromTo(moonCopy.current, { opacity: 0, y: reduced ? 0 : 25 }, { opacity: 1, y: 0, duration: 1.5, delay: .35 });
    const resize = () => { const w = container.clientWidth, h = container.clientHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); };
    resize(); window.addEventListener('resize', resize);
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(container);
    let last = performance.now();
    let time = 0;
    renderer.setAnimationLoop(now => {
      if (document.hidden || !visible) { last = now; return; }
      const dt = Math.min((now-last)/1000, .05); last = now; time += dt;
      moon.position.set(0, -3.0 - (1-rise.value)*2.5, 0);
      moon.rotation.y = -1.1 + (reduced ? 0 : time*.009);
      renderer.render(scene,camera);
    });
    return () => {
      disposed = true; abort.abort(); entrance.kill(); copyAnimation.kill(); renderer.setAnimationLoop(null);
      window.removeEventListener('resize',resize); observer.disconnect();
      geometry.dispose();starGeometry?.dispose();materials.forEach(m=>m.dispose());resources.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();
    };
  }, []);

  return <div className="space-journey">
    <header className="journey-header">
      <nav aria-label="Explore"><a href="/crew-health">Crew health</a><a href="#habitat">Habitat</a></nav>
      <a className="journey-brand" href="#moon"><Health color="currentColor" size={28} variant="Bold" /> BEYOND</a>
      <a className="header-action" href="#habitat">Explore habitat <ArrowRight color="currentColor" size={20} /></a>
    </header>
    <section id="moon" className="moon-section" aria-labelledby="moon-title">
      <div className="planet-canvas" ref={host} role="img" aria-label="A detailed Moon beneath a field of stars" />
      <div className="editorial-grid" aria-hidden="true"><i /><i /><i /></div>
      <Image className="floating-astronaut" src="/images/lunar-astronaut.png" alt="An astronaut floating above the lunar horizon" width={1100} height={1414} priority />
      <div className="moon-copy" ref={moonCopy}>
        <h1 id="moon-title"><span>HUMAN.</span><span>BEYOND</span><span>EARTH.</span></h1>
        <p className="hero-statement">FARTHER OUT.<br />CLOSER TO<br />WHAT MATTERS.</p>
        <a className="scroll-invitation" href="#health">Life on the Moon starts with us <ArrowDown color="currentColor" size={22} /></a>
      </div>
    </section>
    <HealthSections />
    <MissionFooter />
  </div>;
}

const hazards = [
  { title: 'Radiation', Icon: ShieldTick, line: 'Invisible exposure. Visible awareness.', detail: 'Bring personal dosimeter logs, exposure history and shelter procedures into one place. Review mission-approved guidance when conditions change.' },
  { title: 'Isolation', Icon: People, line: 'A small crew. A vital connection.', detail: 'Make space for mood check-ins, private journaling, team routines and meaningful rest. Small daily observations help the crew stay connected.' },
  { title: 'Distance', Icon: Activity, line: 'More independence, every day.', detail: 'Keep essential procedures, supply inventories and emergency references available offline. Lunar crews need clear information when ground support is unavailable.' },
  { title: 'Gravity', Icon: Moon, line: 'A new world. A different balance.', detail: 'Track movement, exercise routines and adaptation observations in lunar gravity. Record changes for review by the mission health team.' },
  { title: 'Habitat', Icon: Wind, line: 'Your environment is part of your health.', detail: 'Review cabin conditions alongside cleaning, maintenance and symptom logs. A healthy habitat depends on consistent care.' },
];

function HealthSections() {
  const [active, setActive] = useState(0);
  const selected = hazards[active];

  const sections = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = sections.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations: gsap.core.Tween[] = [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const targets = entry.target.querySelectorAll('[data-reveal]');
        animations.push(gsap.fromTo(targets, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity' }));
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    root.querySelectorAll('section').forEach(section => observer.observe(section));
    return () => { observer.disconnect(); animations.forEach(animation => animation.kill()); };
  }, []);
  return <div ref={sections}>
    <section id="health" className="health-section">
      <div className="section-intro" data-reveal><h2>THE MISSION<br />IS HUMAN.</h2><div><p>The Moon changes the way we live.<br />Care should evolve with it.</p><p className="muted">One place for the everyday routines that support a crew: exposure awareness, rest, movement, connection and a healthy habitat.</p></div></div>
      <div data-reveal className="hazard-tabs" role="tablist" aria-label="Spaceflight hazards">{hazards.map(({title, Icon}, i) => <button id={`hazard-tab-${i}`} key={title} type="button" role="tab" aria-selected={active === i} aria-controls="hazard-detail" onClick={() => setActive(i)}><Icon color="currentColor" size={28} variant="Bold" /><span>{title}</span></button>)}</div>
      <div key={active} className="hazard-detail" id="hazard-detail" role="tabpanel" aria-labelledby={`hazard-tab-${active}`}><h3>{selected.line}</h3><p>{selected.detail}</p></div>
    </section>
    <section className="earth-film" id="perspective">
      <div className="film-heading" data-reveal><h2>WE LEAVE EARTH.<br /><span>OUR NEEDS COME WITH US.</span></h2><p>On Earth, air, gravity and familiar rhythms shape everyday life. On the Moon, the crew depends on a carefully managed habitat. BEYOND brings human health and the surrounding environment into the same picture.</p></div>
      <div className="globe-frame" data-reveal><EarthGlobe /></div>
    </section>
    <MissionStories />
    <section id="habitat" className="body-invitation">
      <div className="body-invitation-copy" data-reveal><h2>SEE THE BODY.<br /><span>UNDERSTAND<br />THE SIGNALS.</span></h2><p>Explore the human side of a mission. Point to a body region, discover its recorded status and see the observations behind every color.</p><MissionLink href="/crew-health">Explore crew health</MissionLink></div>
      <div className="body-invitation-visual" data-reveal><Image unoptimized src="/images/crew-health.jpg" alt="An astronaut performing an in-flight health examination" width={1400} height={933}/><div><span><i className="good"/>Good</span><span><i className="watch"/>Review</span><span><i className="attention"/>Attention</span></div></div>
    </section>
    <section className="mission-routine" id="how-it-works"><div className="section-intro" data-reveal><h2>LESS GUESSWORK.<br /><span>MORE CONTEXT.</span></h2><p>From a daily check-in<br />to a picture that makes sense.</p></div><div className="routine-columns"><article data-reveal><h3>Meet the person.</h3><p>Select a crew member and mission day. Review sleep, stress, mood and vital signs in a single daily record.</p><MissionLink href="/crew-health#daily-log">View daily records</MissionLink></article><article data-reveal><h3>Explore the body.</h3><p>Move across the anatomy to see each region. Colored example cases reveal observations and the next review step.</p><MissionLink href="/crew-health#body">Open body explorer</MissionLink></article><article data-reveal><h3>Follow the change.</h3><p>Compare observations over time. Explore sleep history or add a reading to the interactive trend to understand the bigger picture.</p><MissionLink href="/crew-health#signals">Explore trends</MissionLink></article></div></section>
    <MissionFaq />
  </div>;
}
