"use client";

import { useState } from "react";
import { Calendar, CloudSun, Info, RefreshCw, Satellite, Sparkles } from "lucide-react";
import type { ProjectItem } from "./nigrani-platform";
import { GoogleSatelliteMap } from "./google-satellite-map";

type SatelliteComparisonViewerProps = {
  project: ProjectItem;
  onRunFieldVerification?: () => void;
};

export function SatelliteComparisonViewer({ project, onRunFieldVerification }: SatelliteComparisonViewerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [selectedEpoch, setSelectedEpoch] = useState("Latest observation");
  const epochs = [
    { label: "Baseline requested", date: "10 Apr 2024", cloud: "Catalog search required" },
    { label: "Mid-stage requested", date: "15 Nov 2025", cloud: "Catalog search required" },
    { label: "Latest observation", date: "24 Feb 2026", cloud: "Metadata snapshot" },
  ];

  const refresh = () => {
    setIsRefreshing(true);
    setMapKey((value) => value + 1);
    window.setTimeout(() => setIsRefreshing(false), 850);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-200 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <Satellite className="text-sky-400" size={18} />
          <div>
            <h3 className="text-sm font-bold text-white">Google satellite location context</h3>
            <p className="text-[11px] text-slate-400">{project.id} · {project.district}, {project.state} · {project.latitude}, {project.longitude}</p>
          </div>
        </div>
        <button onClick={refresh} disabled={isRefreshing} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"><RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} /> Refresh map</button>
      </div>

      <div className="p-3">
        <GoogleSatelliteMap key={mapKey} projects={[project]} selectedProjectId={project.id} onSelectProject={() => undefined} height="340px" />
      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2"><Calendar size={15} className="text-sky-400" /><span className="text-xs font-semibold text-slate-300">Temporal observation request</span></div>
          <span className="font-mono text-[10px] text-slate-500">AOI radius: 250m · Asset suitability: corroborative only</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {epochs.map((epoch) => <button key={epoch.label} onClick={() => setSelectedEpoch(epoch.label)} className={`rounded-lg px-3 py-2 text-left text-[10px] transition ${selectedEpoch === epoch.label ? "bg-sky-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}><span className="block font-semibold">{epoch.label}</span><span className="mt-0.5 block opacity-70">{epoch.date} · {epoch.cloud}</span></button>)}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 px-4 py-3">
        <div className="flex max-w-xl items-start gap-2"><Info size={16} className="mt-0.5 flex-shrink-0 text-amber-400" /><div className="text-xs"><strong className="block text-amber-300">Satellite evidence is corroborative, not ground truth.</strong><p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">Google provides map imagery and location context here. Temporal Sentinel processing requires configured server-side Copernicus credentials; no unavailable image is replaced with a synthetic scene.</p></div></div>
        {onRunFieldVerification && <button onClick={onRunFieldVerification} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"><Sparkles size={14} />Dispatch field verification</button>}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500"><CloudSun size={13} />Current selection: {selectedEpoch} · Google Maps Satellite layer · Source date and imagery attribution are controlled by Google Maps.</div>
    </div>
  );
}
