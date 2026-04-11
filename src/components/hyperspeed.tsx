"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
} from "postprocessing";

export default function Hyperspeed() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      90,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Post processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const smaaPass = new EffectPass(
      camera,
      new SMAAEffect({
        preset: SMAAPreset.MEDIUM,
      })
    );
    smaaPass.renderToScreen = true;
    composer.addPass(smaaPass);

    // White line geometry
    const lineCount = 300;
    const positions: number[] = [];

    for (let i = 0; i < lineCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      positions.push(x, y, -Math.random() * 200);
      positions.push(x, y, -Math.random() * 200 - 20);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    // Animation
    let rafId = 0;
    const speed = 2;

    const animate = () => {
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 2; i < pos.length; i += 6) {
        pos[i] += speed;
        pos[i + 3] += speed;

        if (pos[i] > 5) {
          pos[i] = -200;
          pos[i + 3] = -220;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      composer.render();
      rafId = requestAnimationFrame(animate);
    };

    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      scene.remove(lines);
      geometry.dispose();
      material.dispose();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full bg-black"
      aria-hidden="true"
    />
  );
}
