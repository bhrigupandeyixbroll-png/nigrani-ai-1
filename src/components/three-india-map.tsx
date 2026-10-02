"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Layers, MapPin, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface IndiaProjectPoint {
  id: string;
  workName: string;
  state: string;
  district: string;
  sector: string;
  status: string;
  riskScore: number | null;
  latitude: string | null;
  longitude: string | null;
}

interface ThreeIndiaMapProps {
  projects: IndiaProjectPoint[];
  onSelectProject: (id: string) => void;
  selectedProjectId?: string | null;
}

export function ThreeIndiaMapVisualizer({
  projects,
  onSelectProject,
  selectedProjectId,
}: ThreeIndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredProject, setHoveredProject] = useState<IndiaProjectPoint | null>(null);
  const [layerMode, setLayerMode] = useState<"risk" | "sector" | "all">("risk");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Position camera looking from south-west elevated angle over India
    camera.position.set(0, -18, 22);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      return;
    }

    // India center approximation in map coordinates (Lat ~22, Lng ~79)
    const centerLat = 22.0;
    const centerLng = 79.5;
    const scale = 0.55;

    function geoToVector3(lat: number, lng: number, altitude = 0): THREE.Vector3 {
      const x = (lng - centerLng) * scale;
      const y = (lat - centerLat) * scale * 1.12;
      return new THREE.Vector3(x, y, altitude);
    }

    // 1. Subtle India Administrative Base Grid
    const gridHelper = new THREE.GridHelper(26, 32, 0x1e3a8a, 0x0f172a);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.2;
    scene.add(gridHelper);

    // 2. India Geometric Outline
    const indiaOutlineCoords = [
      [35.5, 74.8], [34.5, 77.5], [32.0, 78.5], [30.0, 81.0], [28.0, 84.5],
      [27.5, 88.5], [28.0, 96.0], [27.0, 97.0], [24.0, 93.5], [22.0, 89.0],
      [21.5, 87.0], [18.0, 84.0], [13.0, 80.3], [9.0, 78.2], [8.1, 77.5],
      [10.0, 75.8], [15.0, 73.8], [19.0, 72.8], [23.0, 68.8], [24.5, 71.0],
      [28.0, 70.0], [31.5, 74.5], [35.5, 74.8]
    ];

    const outlineGeom = new THREE.BufferGeometry();
    const outlinePos: number[] = [];
    indiaOutlineCoords.forEach(([lat, lng]) => {
      const v = geoToVector3(lat, lng, 0.05);
      outlinePos.push(v.x, v.y, v.z);
    });
    outlineGeom.setAttribute("position", new THREE.Float32BufferAttribute(outlinePos, 3));
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const outlineLine = new THREE.Line(outlineGeom, outlineMat);
    scene.add(outlineLine);

    // 3. Project Marker Group
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    const projectMeshMap = new Map<THREE.Mesh, IndiaProjectPoint>();

    projects.forEach((proj) => {
      if (!proj.latitude || !proj.longitude) return;
      const lat = parseFloat(proj.latitude);
      const lng = parseFloat(proj.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const pos = geoToVector3(lat, lng, 0.1);
      const risk = proj.riskScore || 0;

      let color = 0x10b981; // Green
      if (risk >= 70) color = 0xef4444; // Red
      else if (risk >= 45) color = 0xf59e0b; // Amber
      else if (proj.status === "In Progress") color = 0x3b82f6; // Blue

      const isSelected = proj.id === selectedProjectId;
      const markerGeom = new THREE.CylinderGeometry(
        isSelected ? 0.35 : 0.22,
        0.05,
        isSelected ? 1.4 : 0.8,
        12
      );
      const markerMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xff9933 : color,
      });

      const mesh = new THREE.Mesh(markerGeom, markerMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(pos);
      markerGroup.add(mesh);
      projectMeshMap.set(mesh, proj);
    });

    // Raycasting for interactive hover & click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerGroup.children);
      if (intersects.length > 0) {
        const found = projectMeshMap.get(intersects[0].object as THREE.Mesh);
        if (found) setHoveredProject(found);
      } else {
        setHoveredProject(null);
      }
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markerGroup.children);
      if (intersects.length > 0) {
        const found = projectMeshMap.get(intersects[0].object as THREE.Mesh);
        if (found) onSelectProject(found.id);
      }
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("click", handleClick);

    let frameId: number;
    let time = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.03;

      // Subtle pulsating pin heights
      markerGroup.children.forEach((child, i) => {
        child.position.z = 0.2 + Math.sin(time + i * 0.4) * 0.08;
      });

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
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("click", handleClick);
      cancelAnimationFrame(frameId);
      if (renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [projects, selectedProjectId, onSelectProject]);

  return (
    <div className="relative w-full h-[380px] bg-gradient-to-b from-[#061224] to-[#0b1e38] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl flex flex-col">
      {/* Top Map HUD */}
      <div className="absolute top-3 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-sky-200 uppercase">
            BHUVAN / ISRO GEOSPATIAL MAP · 3D ORBIT
          </span>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setLayerMode(layerMode === "risk" ? "all" : "risk")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <Layers size={13} />
            Layer: <strong className="text-sky-300 uppercase">{layerMode}</strong>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full flex-1 cursor-crosshair" />

      {/* Hover Card */}
      {hoveredProject && (
        <div className="absolute bottom-12 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-sky-500/40 shadow-2xl max-w-sm pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-bold">
              {hoveredProject.id}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (hoveredProject.riskScore || 0) >= 70
                  ? "bg-red-950 text-red-400 border border-red-800"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-800"
              }`}
            >
              Risk: {hoveredProject.riskScore ?? "—"}/100
            </span>
          </div>
          <h4 className="text-xs font-bold text-white line-clamp-1">{hoveredProject.workName}</h4>
          <p className="text-[11px] text-slate-300 mt-0.5">
            📍 {hoveredProject.district}, {hoveredProject.state} · <i>{hoveredProject.sector}</i>
          </p>
          <div className="mt-2 text-[10px] text-sky-300 font-semibold flex items-center gap-1">
            <span>Click marker to investigate & open Sentinel satellite imagery</span>
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="bg-slate-950/90 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High Risk (≥70)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Review (45-69)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Verified / Routine
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {projects.length} Geo-spatial points across 15 States
        </span>
      </div>
    </div>
  );
}
