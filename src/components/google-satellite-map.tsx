"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin, Satellite } from "lucide-react";
import type { ProjectItem } from "./nigrani-platform";

type GoogleSatelliteMapProps = {
  projects: ProjectItem[];
  selectedProjectId?: string | null;
  onSelectProject: (id: string) => void;
  height?: string;
};

type MapState = "idle" | "loading" | "ready" | "missing-key" | "error";

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps is browser-only."));
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-nigrani-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.nigraniGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}

function indianCenter(projects: ProjectItem[]) {
  const withCoordinates = projects.filter((project) => project.latitude && project.longitude);
  if (!withCoordinates.length) return { lat: 22.5, lng: 79.2 };
  const selected = withCoordinates[0];
  return { lat: Number(selected.latitude), lng: Number(selected.longitude) };
}

function markerColor(project: ProjectItem) {
  if ((project.riskScore ?? 0) >= 70) return "#ef4444";
  if ((project.riskScore ?? 0) >= 45) return "#f59e0b";
  if (project.status === "Completed") return "#10b981";
  return "#2563eb";
}

function GoogleSatelliteEmbed({ project, count, height, reason }: { project?: ProjectItem; count: number; height: string; reason: "missing-key" | "api-error" }) {
  if (!project?.latitude || !project.longitude) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 p-8 text-center" style={{ minHeight: height }}>
        <div className="max-w-md"><MapPin className="mx-auto mb-3 text-amber-400" size={28} /><h3 className="text-sm font-bold text-white">Location evidence unavailable</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">This project does not have a usable latitude and longitude, so Google satellite context cannot be opened.</p></div>
      </div>
    );
  }

  const coordinates = `${project.latitude},${project.longitude}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=k&z=18&output=embed`;
  const openUrl = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&t=k&z=18`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950" style={{ minHeight: height }}>
      <iframe
        title={`Google satellite view for ${project.id}`}
        src={embedUrl}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
      />
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-[10px] font-mono text-slate-100 shadow-lg"><Satellite size={13} className="text-[#ff9933]" />GOOGLE SATELLITE EMBED · {count} LOCATION{count === 1 ? "" : "S"}</div>
      <div className="absolute bottom-3 left-3 max-w-[min(430px,calc(100%-24px))] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-[10px] text-slate-300 shadow-lg"><span className="font-semibold text-amber-300">{reason === "missing-key" ? "JavaScript API key not configured" : "JavaScript API unavailable"}.</span> Showing the authorized Google satellite embed for the selected coordinate. This is location context, not proof of completion.</div>
      <a className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-2 text-[10px] text-sky-300 shadow-lg" href={openUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} />Open in Google Maps</a>
    </div>
  );
}

export function GoogleSatelliteMap({ projects, selectedProjectId, onSelectProject, height = "420px" }: GoogleSatelliteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [state, setState] = useState<MapState>(apiKey ? "idle" : "missing-key");
  const coordinateProjects = useMemo(() => projects.filter((project) => project.latitude && project.longitude), [projects]);
  const selectedProject = coordinateProjects.find((project) => project.id === selectedProjectId) ?? coordinateProjects[0];

  useEffect(() => {
    let disposed = false;
    if (!apiKey) return;

    const timer = window.setTimeout(() => {
      if (!mapRef.current || disposed) return;
      setState("loading");
      loadGoogleMaps(apiKey)
        .then(() => {
          if (disposed || !mapRef.current || !window.google?.maps) return;
          const map = new window.google.maps.Map(mapRef.current, {
            center: indianCenter(projects),
            zoom: 5,
            mapTypeId: "satellite",
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
            zoomControl: true,
            gestureHandling: "greedy",
            clickableIcons: false,
            styles: [],
          });
          mapInstanceRef.current = map;
          setState("ready");
        })
        .catch(() => {
          if (!disposed) setState("error");
        });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [apiKey, projects]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = coordinateProjects.map((project) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: Number(project.latitude), lng: Number(project.longitude) },
        title: `${project.id} · ${project.workName}`,
        label: { text: "●", color: markerColor(project), fontSize: selectedProjectId === project.id ? "25px" : "18px" },
        zIndex: selectedProjectId === project.id ? 100 : Number(project.riskScore ?? 0),
      });
      marker.addListener("click", () => onSelectProject(project.id));
      return marker;
    });

    const selected = coordinateProjects.find((project) => project.id === selectedProjectId);
    if (selected) {
      map.panTo({ lat: Number(selected.latitude), lng: Number(selected.longitude) });
      map.setZoom(14);
    }
  }, [coordinateProjects, onSelectProject, selectedProjectId, state]);

  if (state === "missing-key") {
    return <GoogleSatelliteEmbed project={selectedProject} count={coordinateProjects.length} height={height} reason="missing-key" />;
  }

  if (state === "error") {
    return <GoogleSatelliteEmbed project={selectedProject} count={coordinateProjects.length} height={height} reason="api-error" />;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950" style={{ minHeight: height }}>
      <div ref={mapRef} className="absolute inset-0" />
      {state !== "ready" && <div className="absolute inset-0 grid place-items-center bg-slate-950/90"><div className="flex items-center gap-2 text-xs text-slate-300"><Loader2 className="animate-spin text-sky-400" size={18} />Loading Google satellite layer…</div></div>}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-[10px] font-mono text-slate-200 shadow-lg"><MapPin size={13} className="text-[#ff9933]" />GOOGLE SATELLITE · {coordinateProjects.length} EVIDENCE LOCATIONS</div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-[10px] text-slate-300 shadow-lg"><span className="mr-3 text-red-300">● high risk</span><span className="mr-3 text-amber-300">● review</span><span className="mr-3 text-emerald-300">● verified</span><span className="text-blue-300">● active</span></div>
      <a className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/85 px-2.5 py-2 text-[10px] text-sky-300 shadow-lg" href="https://developers.google.com/maps/documentation/javascript" target="_blank" rel="noreferrer"><ExternalLink size={12} />API attribution & setup</a>
    </div>
  );
}
