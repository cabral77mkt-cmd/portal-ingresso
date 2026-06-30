import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Neon green: rgb(197, 255, 0) · Electric violet: rgb(124, 58, 237)
// Reduced count on mobile to keep 60fps
const isMobile = () => window.innerWidth < 768;

export default function HeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function getSize() {
      const el = canvas.parentElement || document.documentElement;
      return { w: el.clientWidth || window.innerWidth, h: el.clientHeight || window.innerHeight };
    }
    const { w, h } = getSize();
    renderer.setSize(w, h);

    // Scene & camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.z = 4;

    // Particles
    const COUNT = isMobile() ? 900 : 2000;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      // Spread particles in an elongated volume matching the hero
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7;

      if (Math.random() > 0.38) {
        // Neon acid green — 62%
        colors[i * 3]     = 197 / 255;
        colors[i * 3 + 1] = 255 / 255;
        colors[i * 3 + 2] = 0   / 255;
      } else {
        // Electric violet — 38%
        colors[i * 3]     = 124 / 255;
        colors[i * 3 + 1] = 58  / 255;
        colors[i * 3 + 2] = 237 / 255;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
      size:         0.028,
      vertexColors: true,
      transparent:  true,
      opacity:      0.72,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse tracking
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const onMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 0.45;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.30;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Resize
    const onResize = () => {
      const { w: nw, h: nh } = getSize();
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Animation loop — slow organic drift + mouse parallax
    let rafId;
    let elapsed = 0;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      elapsed += clock.getDelta();

      // Smooth lerp toward mouse
      currentX += (targetX - currentX) * 0.03;
      currentY += (targetY - currentY) * 0.03;

      points.rotation.x = elapsed * 0.028 + currentY * 0.5;
      points.rotation.y = elapsed * 0.042 + currentX * 0.5;
      points.rotation.z = elapsed * 0.012;

      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize',    onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
