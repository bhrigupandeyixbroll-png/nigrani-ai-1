"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Box, Eye, Layers, RotateCw } from "lucide-react";

interface AssetPassport3DProps {
  assetType?: string;
  model3dType?: string;
  condition?: string;
  lifecycleState?: string;
}

export function ThreeAssetPassportViewer({
  assetType = "Community Infrastructure",
  model3dType = "building",
  condition = "Good",
  lifecycleState = "Completed",
}: AssetPassport3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0.5, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(6, 8, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    fillLight.position.set(-6, -2, -5);
    scene.add(fillLight);

    // Ground Base (Indian civic plinth)
    const plinthGeom = new THREE.CylinderGeometry(3.5, 3.8, 0.25, 32);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x0f2744,
      roughness: 0.8,
      wireframe,
    });
    const plinth = new THREE.Mesh(plinthGeom, plinthMat);
    plinth.position.y = -0.12;
    scene.add(plinth);

    // Grid ring
    const gridHelper = new THREE.PolarGridHelper(3.4, 16, 8, 64, 0x1e40af, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Asset Procedural Group
    const assetGroup = new THREE.Group();
    scene.add(assetGroup);

    const typeLower = (model3dType || "").toLowerCase();

    if (typeLower.includes("solar")) {
      // Solar High-Mast Light
      const poleGeom = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 16);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, wireframe });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = 1.6;
      assetGroup.add(pole);

      // Solar Panel Array
      const panelGeom = new THREE.BoxGeometry(1.6, 0.08, 1.0);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2, wireframe });
      const panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(0, 3.3, 0);
      panel.rotation.x = 0.5;
      assetGroup.add(panel);

      // LED Light Head
      const lightGeom = new THREE.SphereGeometry(0.2, 16, 16);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const lightMesh = new THREE.Mesh(lightGeom, lightMat);
      lightMesh.position.set(0, 3.0, 0.3);
      assetGroup.add(lightMesh);
    } else if (typeLower.includes("water") || typeLower.includes("tank") || typeLower.includes("ro")) {
      // Water Tank / Treatment Facility
      const tankGeom = new THREE.CylinderGeometry(1.1, 1.1, 1.8, 24);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4, wireframe });
      const tank = new THREE.Mesh(tankGeom, tankMat);
      tank.position.y = 1.8;
      assetGroup.add(tank);

      // Support pillars
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const colGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 12);
        const colMat = new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe });
        const col = new THREE.Mesh(colGeom, colMat);
        col.position.set(Math.cos(angle) * 0.9, 0.5, Math.sin(angle) * 0.9);
        assetGroup.add(col);
      }
    } else if (typeLower.includes("road")) {
      // Road Corridor Segment
      const roadGeom = new THREE.BoxGeometry(1.6, 0.1, 4.0);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, wireframe });
      const road = new THREE.Mesh(roadGeom, roadMat);
      road.position.y = 0.05;
      assetGroup.add(road);

      // Center Divider line
      const lineGeom = new THREE.BoxGeometry(0.08, 0.12, 3.8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.y = 0.06;
      assetGroup.add(line);
    } else {
      // School / Community Resource Building
      const mainGeom = new THREE.BoxGeometry(2.4, 1.4, 2.0);
      const mainMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, wireframe });
      const mainBlock = new THREE.Mesh(mainGeom, mainMat);
      mainBlock.position.y = 0.7;
      assetGroup.add(mainBlock);

      // Slanted terracotta-style roof
      const roofGeom = new THREE.ConeGeometry(2.1, 0.8, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.5, wireframe });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = 1.8;
      roof.rotation.y = Math.PI / 4;
      assetGroup.add(roof);

      // Entrance Porch
      const porchGeom = new THREE.BoxGeometry(0.8, 0.9, 0.5);
      const porchMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, wireframe });
      const porch = new THREE.Mesh(porchGeom, porchMat);
      porch.position.set(0, 0.45, 1.15);
      assetGroup.add(porch);
    }

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (autoRotate) {
        assetGroup.rotation.y += 0.008;
        plinth.rotation.y += 0.002;
      }
      renderer.render(scene, camera);
    };
    animate();

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
      cancelAnimationFrame(frameId);
      if (renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [model3dType, wireframe, autoRotate]);

  return (
    <div className="relative w-full h-[240px] bg-slate-900/90 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner flex flex-col">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
          3D ASSET TWIN · {assetType}
        </span>
      </div>

      <div className="absolute top-2 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`p-1.5 rounded text-xs transition ${
            wireframe ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          title="Toggle Wireframe Mesh"
        >
          <Layers size={14} />
        </button>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded text-xs transition ${
            autoRotate ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div ref={containerRef} className="w-full flex-1" />

      <div className="bg-slate-950/80 px-3 py-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Condition: <strong className="text-emerald-300 ml-0.5">{condition}</strong>
        </span>
        <span className="text-[9px] text-slate-500 italic">Representative 3D visualization</span>
      </div>
    </div>
  );
}
