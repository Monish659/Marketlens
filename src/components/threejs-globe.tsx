"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ThreeJSGlobeProps {
  className?: string;
  size?: number;
  color?: string;
  speed?: number;
}

export function ThreeJSGlobe({ 
  className, 
  size = 400, 
  color = "#ffffff",
  speed = 0.005 
}: ThreeJSGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const autoRotateRef = useRef<boolean>(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clean up any existing content first
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 2.5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(size, size);
    renderer.setClearColor(new THREE.Color(0x000000), 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.userSelect = 'none';
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Globe group
    const globeGroup = new THREE.Group();
    globeRef.current = globeGroup;
    scene.add(globeGroup);

    // Create sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Create wireframe material
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    // Create wireframe sphere
    const wireframeSphere = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    globeGroup.add(wireframeSphere);

    // Create latitude lines
    const createLatitudeLines = () => {
      const latitudes = [];
      for (let i = -80; i <= 80; i += 20) {
        const phi = (90 - i) * (Math.PI / 180);
        const radius = Math.sin(phi);
        const y = Math.cos(phi);
        
        const curve = new THREE.EllipseCurve(
          0, 0,
          radius, radius,
          0, 2 * Math.PI,
          false,
          0
        );
        
        const points = curve.getPoints(64);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Convert 2D points to 3D
        const positions = geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < positions.length; j += 3) {
          const x = positions[j];
          const z = positions[j + 1];
          positions[j] = x;
          positions[j + 1] = y;
          positions[j + 2] = z;
        }
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, lineMaterial);
        latitudes.push(line);
      }
      return latitudes;
    };

    // Create longitude lines
    const createLongitudeLines = () => {
      const longitudes = [];
      for (let i = 0; i < 180; i += 20) {
        const curve = new THREE.EllipseCurve(
          0, 0,
          1, 1,
          0, Math.PI,
          false,
          0
        );
        
        const points = curve.getPoints(32);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, lineMaterial);
        line.rotation.y = (i * Math.PI) / 180;
        longitudes.push(line);
      }
      return longitudes;
    };

    // Add latitude and longitude lines
    const latLines = createLatitudeLines();
    const lonLines = createLongitudeLines();
    
    latLines.forEach(line => globeGroup.add(line));
    lonLines.forEach(line => globeGroup.add(line));

    // Continents removed to eliminate random wireframe lines

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;
    controlsRef.current = controls;

    // Handle user interaction
    const onControlsStart = () => {
      autoRotateRef.current = false;
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onControlsEnd = () => {
      renderer.domElement.style.cursor = 'grab';
      // Resume auto-rotation after 3 seconds of no interaction
      setTimeout(() => {
        autoRotateRef.current = true;
      }, 3000);
    };

    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('end', onControlsEnd);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      controls.update();
      
      if (globeRef.current && autoRotateRef.current) {
        globeRef.current.rotation.y += speed;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('start', onControlsStart);
        controlsRef.current.removeEventListener('end', onControlsEnd);
        controlsRef.current.dispose();
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      globeRef.current = null;
      controlsRef.current = null;
    };
  }, [size, color, speed]);

  return (
    <div 
      ref={mountRef} 
      className={className}
      style={{ 
        width: size, 
        height: size,
        position: 'relative',
        cursor: 'grab'
      }}
    />
  );
}

export default ThreeJSGlobe;
