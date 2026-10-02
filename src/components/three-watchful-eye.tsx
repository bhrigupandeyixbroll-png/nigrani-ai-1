"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface WatchfulEyeProps {
  focusLabel?: string;
  compact?: boolean;
  activeStream?: string;
  onSelectStream?: (stream: string) => void;
  interactive?: boolean;
  pulseSpeed?: number;
}

export function ThreeWatchfulEye({
  focusLabel = "Evidence Fusion",
  compact = false,
  activeStream,
  onSelectStream,
  interactive = true,
}: WatchfulEyeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = container.clientWidth || (compact ? 280 : 380);
    const height = container.clientHeight || (compact ? 200 : 280);

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, compact ? 12 : 10.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      // If WebGL fails, fallback gracefully
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x1646d8, 3.5, 30);
    blueLight.position.set(4, 5, 6);
    scene.add(blueLight);

    const tealLight = new THREE.PointLight(0x12b8a6, 2.5, 30);
    tealLight.position.set(-4, -4, 5);
    scene.add(tealLight);

    const saffronLight = new THREE.PointLight(0xff9933, 1.8, 25);
    saffronLight.position.set(0, 4, 3);
    scene.add(saffronLight);

    // Group for entire Eye assembly
    const eyeGroup = new THREE.Group();
    scene.add(eyeGroup);

    // 1. Central Core Iris (Indian Orbital Grid / Ashoka Chakra geometry)
    const irisGeom = new THREE.SphereGeometry(1.65, 32, 32);
    const irisMat = new THREE.MeshPhysicalMaterial({
      color: 0x071e3d,
      roughness: 0.2,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x0a2b5e,
      emissiveIntensity: 0.6,
    });
    const irisMesh = new THREE.Mesh(irisGeom, irisMat);
    eyeGroup.add(irisMesh);

    // Pupil Core
    const pupilGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.2, 32);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x010814 });
    const pupilMesh = new THREE.Mesh(pupilGeom, pupilMat);
    pupilMesh.rotation.x = Math.PI / 2;
    pupilMesh.position.z = 1.6;
    eyeGroup.add(pupilMesh);

    // Glowing pupil lens reflection
    const lensGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.position.set(0.2, 0.2, 1.72);
    eyeGroup.add(lensMesh);

    // 2. Ashoka-inspired 24-spoke circular lattice ring
    const chakraRingsGroup = new THREE.Group();
    eyeGroup.add(chakraRingsGroup);

    const chakraSpokesCount = 24;
    for (let i = 0; i < chakraSpokesCount; i++) {
      const angle = (i / chakraSpokesCount) * Math.PI * 2;
      const spokeGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
      const spokeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
      const spoke = new THREE.Mesh(spokeGeom, spokeMat);
      spoke.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 1.45);
      spoke.rotation.z = angle + Math.PI / 2;
      chakraRingsGroup.add(spoke);
    }

    // 3. 7 Orbital Rings (FUNDS, DOCS, TIME, GEO, SATELLITE, IMAGES, ASSETS)
    const ringColors = [
      0xff9933, // Saffron (FUNDS)
      0x38bdf8, // Sky Blue (DOCUMENTS)
      0xa78bfa, // Violet (TIMELINE)
      0x34d399, // Emerald (GEOSPATIAL)
      0x06b6d4, // Cyan (SATELLITE)
      0xfbbf24, // Amber (IMAGES)
      0x60a5fa, // Blue (ASSET)
    ];

    const orbitalRings: THREE.Line[] = [];
    ringColors.forEach((color, idx) => {
      const radius = 2.4 + idx * 0.45;
      const segments = 64;
      const ringGeom = new THREE.BufferGeometry();
      const positions = new Float32Array((segments + 1) * 3);

      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        positions[s * 3] = Math.cos(theta) * radius;
        positions[s * 3 + 1] = Math.sin(theta) * radius;
        positions[s * 3 + 2] = 0;
      }
      ringGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const ringMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4 + (idx === 4 ? 0.35 : 0.1),
        linewidth: 1.5,
      });

      const ringLine = new THREE.Line(ringGeom, ringMat);
      ringLine.rotation.x = 0.4 + idx * 0.18;
      ringLine.rotation.y = (idx * Math.PI) / 4;
      eyeGroup.add(ringLine);
      orbitalRings.push(ringLine);
    });

    // 4. Floating Data Nodes & Particles
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0xff9933);
    const c2 = new THREE.Color(0x38bdf8);
    const c3 = new THREE.Color(0x10b981);

    for (let p = 0; p < particleCount; p++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.2 + Math.random() * 3.5;

      particlePositions[p * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[p * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[p * 3 + 2] = r * Math.cos(phi);

      const chosenColor = p % 3 === 0 ? c1 : p % 3 === 1 ? c2 : c3;
      particleColors[p * 3] = chosenColor.r;
      particleColors[p * 3 + 1] = chosenColor.g;
      particleColors[p * 3 + 2] = chosenColor.b;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    eyeGroup.add(particles);

    // Mouse movement response
    let targetRotX = 0;
    let targetRotY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = -y * 0.35;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Subtle orbital rotations
        orbitalRings.forEach((ring, idx) => {
          ring.rotation.z += (0.003 * (idx % 2 === 0 ? 1 : -1)) * (1 + idx * 0.2);
        });

        chakraRingsGroup.rotation.z -= 0.005;
        particles.rotation.y += 0.002;
        particles.rotation.x += 0.001;

        // Smooth eye tracking
        eyeGroup.rotation.y += (targetRotY - eyeGroup.rotation.y) * 0.06;
        eyeGroup.rotation.x += (targetRotX - eyeGroup.rotation.x) * 0.06;

        // Subtle organic breathing
        const breath = Math.sin(elapsed * 1.5) * 0.04;
        irisMesh.scale.set(1 + breath, 1 + breath, 1 + breath);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive) window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [compact, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${
        compact ? "min-h-[190px]" : "min-h-[280px]"
      }`}
      aria-label={`3D NIGRANI Watchful Eye focused on ${focusLabel}`}
      role="img"
    >
      {/* Overlay status hud */}
      <div className="absolute top-2 left-3 z-10 pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[10px] font-mono tracking-widest text-emerald-300/90 uppercase">
          EVIDENCE FUSION CORE · 60 FPS
        </span>
      </div>

      <div className="absolute bottom-2 inset-x-0 z-10 pointer-events-none text-center">
        <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">ACTIVE VECTOR</span>
        <strong className="text-xs tracking-wider text-sky-200 font-semibold">{focusLabel}</strong>
      </div>
    </div>
  );
}
