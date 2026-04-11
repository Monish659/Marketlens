// // This file is disabled and should not be used. All globe functionality has been moved to ThreeJSGlobe.
// // To re-enable, remove these comments and restore original code.
// /*
// "use client";

// import React, { useMemo, useRef } from "react";
// import { Canvas, useFrame } from "@react-three/fiber";
// import { useGLTF } from "@react-three/drei";
// import * as THREE from "three";

// interface Globe3DProps {
//   className?: string;
//   /** Canvas size in pixels (width and height). Defaults to 512 */
//   size?: number;
//   /** Base stroke color for the wireframe lines */
//   color?: string;
//   /** Rotation speed in radians per second */
//   speed?: number;
//   /** Uniform scale for the model (1 = original). Defaults to 0.75 */
//   scale?: number;
//   /** Camera Z distance from model. Defaults to 2.8 */
//   cameraZ?: number;
// }

// function WireframeModel({ color = "#9ca3af" }: { color?: string }) {
//     const { scene } = useGLTF("/scene.gltf");
//   const group = useRef<THREE.Group>(null);

//   // Apply a simple wireframe material to all meshes in the scene.
//   // This is more robust than EdgesGeometry for complex models.
//   useMemo(() => {
//     scene.traverse((child) => {
//       if (child instanceof THREE.Mesh) {
//         child.material = new THREE.MeshBasicMaterial({ 
//           color,
//           wireframe: true,
//           transparent: true,
//           opacity: 0.4,
//         });
//       }
//     });
//   }, [scene, color]);

//   return <primitive ref={group} object={scene} />;
// }

// function SpinningGlobe({ color = "#9ca3af", speed = 0.2, scale = 0.6 }: { color?: string; speed?: number; scale?: number }) {
//   const ref = useRef<THREE.Group>(null);
//   useFrame((_, delta) => {
//     if (ref.current) ref.current.rotation.y += speed * delta;
//   });
//   return (
//     <group ref={ref} scale={[scale, scale, scale]}>
//       <WireframeModel color={color} />
//     </group>
//   );
// }

// export function Globe3D({ className, size = 512, color = "#9ca3af", speed = 0.2, scale = 0.6, cameraZ = 2.8 }: Globe3DProps) {
//   return (
//     <div className={className} style={{ width: size, height: size }}>
//       <Canvas camera={{ position: [0, 0, cameraZ], fov: 50 }} dpr={[1, 2]}>
//         {/* Dim ambient so lines are not glowing; MeshBasic ignores light, but keep minimal env */}
//         <ambientLight intensity={0.1} />
//         {/* No bloom/postprocessing to keep it clean */}
//         <SpinningGlobe color={color} speed={speed} scale={scale} />
//       </Canvas>
//     </div>
//   );
// }

// export default Globe3D;

// // drei GLTF preloader (optional)
// useGLTF.preload("/scene.gltf");
// */
