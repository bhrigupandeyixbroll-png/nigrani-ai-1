"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BadgeAlert,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Box,
  Boxes,
  BrainCircuit,
  Building,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CircleHelp,
  Clock,
  Coins,
  Cpu,
  Database,
  Download,
  Eye,
  FileCheck,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FileUp,
  Filter,
  FolderKanban,
  Globe,
  Globe2,
  HelpCircle,
  History,
  Image as ImageIcon,
  IndianRupee,
  Info,
  KeyRound,
  Landmark,
  Layers,
  Layers3,
  LineChart,
  ListFilter,
  Loader2,
  Lock,
  LockKeyhole,
  MapPin,
  MapPinned,
  Menu,
  Moon,
  MoreHorizontal,
  Navigation,
  Network,
  PackageCheck,
  Phone,
  PieChart,
  Plus,
  RefreshCw,
  Scale,
  Satellite,
  Search,
  Send,
  Settings,
  Settings2,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Table,
  Target,
  Upload,
  UploadCloud,
  User,
  UserCheck,
  UserRoundCheck,
  Users,
  UsersRound,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { ThreeWatchfulEye } from "./three-watchful-eye";
import { ThreeIndiaMapVisualizer } from "./three-india-map";
import { ThreeAssetPassportViewer } from "./three-asset-passport";
import { SatelliteComparisonViewer } from "./satellite-comparison-viewer";
import { NigraniCopilotDock } from "./nigrani-copilot-dock";
import { GoogleSatelliteMap } from "./google-satellite-map";
import { NigraniBrandMark } from "./nigrani-brand-mark";
import { formatInrCurrency, INDIAN_STATES, MPLADS_SECTORS } from "@/lib/constants";

export type ProjectItem = {
  id: string;
  workName: string;
  workNameHi?: string | null;
  state: string;
  district: string;
  constituency?: string | null;
  memberReference?: string | null;
  sector: string;
  financialYear?: string | null;
  sanctionedAmount: string | null;
  releasedAmount?: string | null;
  expenditureAmount: string | null;
  physicalProgress: number | null;
  financialProgress: number | null;
  status: string;
  dataQualityScore: number;
  completenessScore?: number;
  consistencyScore?: number;
  freshnessScore?: number;
  verificationStatus: string;
  recordKind: string;
  riskScore: number | null;
  evidenceConfidence: number | null;
  matrixQuadrant?: string | null;
  sourceId: string | null;
  sourceRecordId: string | null;
  sourceTimestamp: string | Date | null;
  latitude: string | null;
  longitude: string | null;
  locationConfidence?: number | null;
};

export type DashboardPayload = {
  totals: {
    totalProjects: number;
    activeWorks: number;
    completedWorks: number;
    nonProgressWorks: number;
    delayedWorks: number;
    totalSanctioned: string;
    totalReleased: string;
    totalExpenditure: string;
    avgDataQuality: number;
    avgCompleteness: number;
    highRiskCount: number;
    verificationPendingCount: number;
    totalCitizenSignals: number;
    openCasesCount: number;
  };
  stateBreakdown: Array<{
    state: string;
    count: number;
    sanctionedSum: string;
    spentSum: string;
    avgRisk: number;
    highRiskCount: number;
  }>;
  sectorBreakdown: Array<{
    sector: string;
    count: number;
    sanctionedSum: string;
    spentSum: string;
    avgRisk: number;
  }>;
  statusRows: Array<{ status: string; count: number }>;
  quadrantCounts: Array<{ quadrant: string | null; count: number }>;
  recentPrioritized: Array<ProjectItem>;
};

type ViewMode =
  | "command"
  | "map"
  | "explorer"
  | "investigation"
  | "financial"
  | "matrix"
  | "citizen"
  | "cases"
  | "ingest"
  | "governance"
  | "admin";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "OFFICIAL" | "AUDITOR" | "INVESTIGATOR" | "CITIZEN";
type Language = "en" | "hi";

const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR", "CITIZEN"];
const ROLE_META: Record<UserRole, { label: string; description: string; tone: string }> = {
  SUPER_ADMIN: { label: "Super Admin", description: "Full system access, users, models, rules, audit logs and settings.", tone: "text-red-300" },
  ADMIN: { label: "Admin", description: "Operational control over projects, cases, evidence and reports.", tone: "text-amber-300" },
  OFFICIAL: { label: "Official", description: "Monitor and review projects within your assigned jurisdiction.", tone: "text-sky-300" },
  AUDITOR: { label: "Auditor", description: "Review financial and documentary evidence for assigned cases.", tone: "text-violet-300" },
  INVESTIGATOR: { label: "Investigator", description: "Run field verification and resolve assigned cases.", tone: "text-emerald-300" },
  CITIZEN: { label: "Citizen", description: "Search, view and verify public development works.", tone: "text-slate-300" },
};

const GOV_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR"];
const ANALYST_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR"];
const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

function roleCan(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}

const copy = {
  en: {
    command: "Command Center", map: "3D Geospatial Map", evidence: "Evidence Fusion Room", explorer: "Project Explorer", money: "Where Is The Money?", matrix: "2x2 Decision Matrix", citizen: "Citizen Verification Portal", cases: "Investigation Cases", ingest: "Data Ingestion Center", governance: "Model Governance & Health",
    switchRole: "Switch Role", verify: "Verify a Project", investigate: "Investigate Demo", government: "GOVT OF INDIA", observatory: "MPLADS INTELLIGENCE OBSERVATORY", watch: "Watch the money.", verifyWork: "Verify the work.", protect: "Protect the asset.", exploreMap: "Explore India Map", evidenceRoom: "Open 3D Evidence Room", publicVerify: "Verify Your Local Public Asset", searchWorks: "Search Public Works", reportIssue: "Report Field Issue", trackStatus: "Track Status", language: "Language", users: "Users", signIn: "Sign in", signOut: "Sign out", accessDenied: "Access restricted", accessDeniedHint: "You don't have permission to view this information.", backToDashboard: "Return to dashboard",
  },
  hi: {
    command: "कमांड सेंटर", map: "3D भू-स्थानिक मानचित्र", evidence: "साक्ष्य फ्यूज़न रूम", explorer: "परियोजना एक्सप्लोरर", money: "पैसा कहाँ जा रहा है?", matrix: "2x2 निर्णय मैट्रिक्स", citizen: "नागरिक सत्यापन पोर्टल", cases: "जांच मामले", ingest: "डेटा इनजेशन सेंटर", governance: "मॉडल गवर्नेंस और स्वास्थ्य",
    switchRole: "भूमिका बदलें", verify: "परियोजना सत्यापित करें", investigate: "डेमो जांचें", government: "भारत सरकार", observatory: "एमपीएलएडीएस इंटेलिजेंस वेधशाला", watch: "पैसे पर निगरानी।", verifyWork: "काम सत्यापित करें।", protect: "संपत्ति सुरक्षित रखें।", exploreMap: "भारत का मानचित्र देखें", evidenceRoom: "3D साक्ष्य रूम खोलें", publicVerify: "अपनी सार्वजनिक संपत्ति सत्यापित करें", searchWorks: "सार्वजनिक कार्य खोजें", reportIssue: "मैदानी समस्या दर्ज करें", trackStatus: "स्थिति ट्रैक करें", language: "भाषा", users: "उपयोगकर्ता", signIn: "साइन इन", signOut: "साइन आउट", accessDenied: "पहुंच प्रतिबंधित", accessDeniedHint: "आपके पास यह जानकारी देखने की अनुमति नहीं है।", backToDashboard: "डैशबोर्ड पर लौटें",
  },
} as const;

type NavItem = {
  view: ViewMode;
  labelKey: keyof typeof copy.en;
  icon: React.ComponentType<{ size?: number }>;
  roles: UserRole[];
};

const NAV_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Overview",
    items: [
      { view: "command", labelKey: "command", icon: Activity, roles: ALL_ROLES },
      { view: "map", labelKey: "map", icon: MapPinned, roles: ALL_ROLES },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { view: "explorer", labelKey: "explorer", icon: Search, roles: ALL_ROLES },
      { view: "investigation", labelKey: "evidence", icon: BrainCircuit, roles: GOV_ROLES },
      { view: "financial", labelKey: "money", icon: IndianRupee, roles: ANALYST_ROLES },
      { view: "matrix", labelKey: "matrix", icon: Layers3, roles: ANALYST_ROLES },
    ],
  },
  {
    section: "Verification",
    items: [
      { view: "cases", labelKey: "cases", icon: FolderKanban, roles: GOV_ROLES },
      { view: "citizen", labelKey: "citizen", icon: UserRoundCheck, roles: ["CITIZEN"] },
    ],
  },
  {
    section: "Management",
    items: [
      { view: "ingest", labelKey: "ingest", icon: FileUp, roles: ADMIN_ROLES },
      { view: "governance", labelKey: "governance", icon: ShieldCheck, roles: ADMIN_ROLES },
      { view: "admin", labelKey: "users", icon: Users, roles: ADMIN_ROLES },
    ],
  },
];

function viewAllowedForRole(view: ViewMode, role: UserRole): boolean {
  return NAV_SECTIONS.some((section) => section.items.some((item) => item.view === view && roleCan(role, item.roles)));
}

export default function NigraniPlatform({
  initialDashboard,
  initialProjects,
}: {
  initialDashboard: DashboardPayload;
  initialProjects: ProjectItem[];
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [role, setRole] = useState<UserRole>("CITIZEN");
  const [scope, setScope] = useState<{ state?: string | null; district?: string | null }>({});
  const t = copy[language];
  const [view, setView] = useState<ViewMode>("command");
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("NIG-DEMO-001");
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showSatelliteModal, setShowSatelliteModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [showPublicProject, setShowPublicProject] = useState<boolean>(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All States");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [riskFilter, setRiskFilter] = useState("All");

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProject = async (id: string, targetView?: ViewMode) => {
    setSelectedProjectId(id);
    setLoadingDetail(true);
    if (targetView) setView(targetView);
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json().catch(() => null);
      if (res.status === 403) {
        notify(data?.error || "You don't have access to this project's jurisdiction.");
        setProjectDetail(null);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Could not load project details");
      setProjectDetail(data);
    } catch {
      notify("Failed to retrieve source-grounded evidence for project.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // ignore network errors on sign out
    }
    setRole("CITIZEN");
    setScope({});
    setProjectDetail(null);
    setShowPublicProject(false);
    setView("command");
    notify("Signed out. You are viewing the public portal.");
  };

  const openPublicProject = async (id: string) => {
    setSelectedProjectId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error();
      setProjectDetail(await res.json());
      setShowPublicProject(true);
    } catch {
      notify("Could not load this project.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectProject = (id: string) => {
    if (role === "CITIZEN") void openPublicProject(id);
    else void loadProject(id, "investigation");
  };

  // Initial load of NIG-DEMO-001 and restore role session
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
  }, [language]);

  useEffect(() => {
    void loadProject("NIG-DEMO-001");
    void (async () => {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) return;
        const json = await res.json();
        if (json.role && ALL_ROLES.includes(json.role as UserRole)) {
          setRole(json.role as UserRole);
        }
        if (json.scope) setScope(json.scope || {});
      } catch {
        // keep default public/citizen role
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        `${p.id} ${p.workName} ${p.district} ${p.state} ${p.constituency}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesState = stateFilter === "All States" || p.state === stateFilter;
      const matchesSector = sectorFilter === "All Sectors" || p.sector === sectorFilter;
      const matchesStatus = statusFilter === "All Statuses" || p.status === statusFilter;
      const matchesRisk =
        riskFilter === "All" ||
        (riskFilter === "High" && (p.riskScore ?? 0) >= 70) ||
        (riskFilter === "Medium" && (p.riskScore ?? 0) >= 45 && (p.riskScore ?? 0) < 70) ||
        (riskFilter === "Low" && (p.riskScore ?? 0) < 45);

      return matchesSearch && matchesState && matchesSector && matchesStatus && matchesRisk;
    });
  }, [projects, searchQuery, stateFilter, sectorFilter, statusFilter, riskFilter]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const currentProject = projectDetail?.project || projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === "dark"
          ? "bg-[#061224] text-slate-100 dark-theme"
          : "bg-[#f8fafc] text-slate-900 light-theme"
      }`}
    >
      {/* Top Global Indian Header / Tricolor Micro-Accent */}
      <div className="h-1 bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808] w-full sticky top-0 z-50" />

      {/* Main App Container */}
      <div className="flex">
        {/* Navigation Sidebar */}
        <aside
          className={`fixed inset-y-1 left-0 z-40 w-64 ${
            theme === "dark"
              ? "bg-[#081830] border-r border-slate-800 text-slate-300"
              : "bg-white border-r border-slate-200 text-slate-700 shadow-xl"
          } p-4 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Brand Logo & Emblem */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <NigraniBrandMark />
                <div>
                  <h1 className="font-extrabold text-sm tracking-wider text-white flex items-center gap-1.5">
                    <span aria-hidden="true" className="brand-flag">🇮🇳</span> NIGRANI AI
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      MPLADS
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400">{language === "hi" ? "सार्वजनिक विकास इंटेलिजेंस" : "Public Development Intelligence"}</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Role & Scope */}
            <div className="my-3.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className={role === "CITIZEN" ? "text-slate-400" : "text-emerald-400"} />
                  <span className={`text-[11px] font-semibold ${ROLE_META[role].tone}`}>{ROLE_META[role].label}</span>
                </div>
                {role !== "CITIZEN" && (
                  <button onClick={signOut} className="text-[10px] font-medium text-slate-400 hover:text-slate-200">{t.signOut}</button>
                )}
              </div>
              {role !== "CITIZEN" && scope.state && (
                <div className="mt-1 text-[10px] text-slate-500">Scope: {scope.state}{scope.district ? ` · ${scope.district}` : ""}</div>
              )}
              <button
                onClick={() => setLoginModalOpen(true)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800/60 py-1.5 text-[10px] font-medium text-sky-300 hover:bg-slate-800"
              >
                {role === "CITIZEN" ? t.signIn : t.switchRole}
              </button>
            </div>

            {/* Role-aware navigation */}
            <nav className="space-y-1 text-xs font-medium mt-2">
              {NAV_SECTIONS.map((section) => {
                const visible = section.items.filter((item) => roleCan(role, item.roles));
                if (!visible.length) return null;
                return (
                  <div key={section.section}>
                    <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase tracking-widest text-slate-500">{section.section}</div>
                    {visible.map((item) => {
                      const Icon = item.icon;
                      const active = view === item.view;
                      const badge = item.view === "explorer" ? String(projects.length) : item.view === "cases" ? String(initialDashboard.totals.openCasesCount) : null;
                      return (
                        <button
                          key={item.view}
                          onClick={() => { setView(item.view); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${active ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30" : "hover:bg-slate-800/60 text-slate-300"}`}
                        >
                          <Icon size={16} />
                          <span>{t[item.labelKey]}</span>
                          {badge && (
                            <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded ${item.view === "cases" ? "bg-red-950 text-red-400" : "bg-slate-800 text-slate-300"}`}>{badge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Controls */}
          <div className="pt-3 border-t border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Copernicus Live
              </span>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              NIGRANI AI is an intelligence layer. AI signals are not corruption findings.
            </p>
          </div>
        </aside>

        {/* Main Workspace Stage */}
        <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
          {/* Top Command Bar */}
          <header
            className={`h-16 sticky top-1 z-30 px-4 lg:px-8 flex items-center justify-between border-b ${
              theme === "dark"
                ? "bg-[#071426]/90 border-slate-800 backdrop-blur-md"
                : "bg-white/90 border-slate-200 backdrop-blur-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300"
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 uppercase tracking-wider">
                    {role === "CITIZEN"
                      ? "🇮🇳 NIGRANI AI · PUBLIC VERIFICATION"
                      : `🇮🇳 ${language === "hi" ? "भारत · इंडिया अवलोकन" : "भारत · INDIA OVERVIEW"}`}
                  </span>
                  {role !== "CITIZEN" && (<><span>/</span><span className="text-sky-400 font-mono">{t.observatory}</span></>)}
                </div>
                <h2 className="text-sm font-extrabold text-white capitalize tracking-wide">
                  {view === "command" && (role === "CITIZEN" ? "Public project verification" : role === "SUPER_ADMIN" ? "National Command Center" : role === "ADMIN" ? "Operational Overview" : role === "OFFICIAL" ? "My Work" : role === "AUDITOR" ? "Assigned Cases" : "Investigation Workspace")}
                  {view === "map" && "India Project Map"}
                  {view === "investigation" && "Evidence Room"}
                  {view === "explorer" && "Project Explorer"}
                  {view === "financial" && "Financial Intelligence"}
                  {view === "matrix" && "Decision Framework"}
                  {view === "citizen" && "Verify a Project"}
                  {view === "cases" && "Investigation Cases"}
                  {view === "ingest" && "Data Ingestion"}
                  {view === "governance" && "Governance & Health"}
                  {view === "admin" && "User Management"}
                </h2>
              </div>
            </div>

            {/* Quick Actions & Role Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {role !== "CITIZEN" && (
                <button
                  onClick={() => loadProject("NIG-DEMO-001", "investigation")}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 hover:scale-105 transition"
                >
                  <Sparkles size={14} />
                  <span>{t.investigate} (NIG-DEMO-001)</span>
                </button>
              )}

              {role === "CITIZEN" && (
                <button
                  onClick={() => setView("citizen")}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 hover:scale-105 transition"
                >
                  <UserRoundCheck size={14} />
                  <span>{t.verify}</span>
                </button>
              )}

              <label className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-300">
                <Globe2 size={14} className="text-[#ff9933]" />
                <span className="hidden sm:inline">{t.language}</span>
                <select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="bg-transparent text-slate-100 outline-none">
                  <option value="en">EN</option>
                  <option value="hi">हिंदी</option>
                </select>
              </label>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title={role === "CITIZEN" ? "Sign in" : "Account & role"}
                aria-label="Account and role"
              >
                <User size={16} />
              </button>
            </div>
          </header>

          {/* Main Body Stage Router */}
          <main className="p-4 lg:p-8 flex-1">
            {showPublicProject && role === "CITIZEN" ? (
              <PublicProjectView detail={projectDetail} onBack={() => setShowPublicProject(false)} onVerify={() => { setShowPublicProject(false); setView("citizen"); }} />
            ) : !viewAllowedForRole(view, role) ? (
              <AccessDenied onBack={() => setView("command")} label={t.accessDenied} hint={t.accessDeniedHint} backLabel={t.backToDashboard} />
            ) : (
              <>
              {view === "command" && (
                <RoleDashboard
                  role={role}
                  dashboard={initialDashboard}
                  projects={projects}
                  scope={scope}
                  onSelectProject={handleSelectProject}
                  onNavigate={(v) => setView(v)}
                  language={language}
                />
              )}

            {/* VIEW 2: 3D GEOSPATIAL MAP */}
            {view === "map" && (
              <GeoMapView
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCheckSatellite={() => setShowSatelliteModal(true)}
              />
            )}

            {/* VIEW 3: 3D EVIDENCE FUSION ROOM (WOW INTERACTION) */}
            {view === "investigation" && (
              <EvidenceFusionRoomView
                detail={projectDetail}
                loading={loadingDetail}
                onSelectProject={(id) => loadProject(id)}
                onOpenSatellite={() => setShowSatelliteModal(true)}
                onDispatchField={() => {
                  setView("cases");
                  notify("Case escalated to District Field Verification Cell.");
                }}
                onOpenCitizenVerify={() => setView("citizen")}
              />
            )}

            {/* VIEW 4: PROJECT EXPLORER */}
            {view === "explorer" && (
              <ProjectExplorerView
                projects={filteredProjects}
                totalCount={projects.length}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                stateFilter={stateFilter}
                setStateFilter={setStateFilter}
                sectorFilter={sectorFilter}
                setSectorFilter={setSectorFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                onSelectProject={handleSelectProject}
              />
            )}

            {/* VIEW 5: WHERE IS THE MONEY? (FINANCIAL FORENSICS) */}
            {view === "financial" && (
              <FinancialForensicView
                projects={projects}
                onSelectProject={(id) => loadProject(id, "investigation")}
              />
            )}

            {/* VIEW 6: 2x2 DECISION MATRIX */}
            {view === "matrix" && (
              <DecisionMatrixView
                projects={projects}
                onSelectProject={(id) => loadProject(id, "investigation")}
              />
            )}

            {/* VIEW 7: CITIZEN VERIFICATION PORTAL */}
            {view === "citizen" && (
              <CitizenPortalView
                projects={projects}
                onSelectProject={handleSelectProject}
                notify={notify}
                language={language}
              />
            )}

            {/* VIEW 8: INVESTIGATION CASES */}
            {view === "cases" && (
              <CasesWorkspaceView
                detail={projectDetail}
                onSelectProject={(id) => loadProject(id, "investigation")}
                role={role}
                notify={notify}
              />
            )}

            {/* VIEW 9: DATA INGESTION CENTER */}
            {view === "ingest" && <DataIngestionView notify={notify} />}

            {/* VIEW 10: GOVERNANCE & HEALTH */}
            {view === "governance" && <GovernanceHealthView />}

            {/* VIEW 11: USER MANAGEMENT */}
            {view === "admin" && <AdminUsersView role={role} notify={notify} />}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Satellite Modal Comparison Slider */}
      {showSatelliteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowSatelliteModal(false)}
                className="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <SatelliteComparisonViewer
              project={currentProject}
              onRunFieldVerification={() => {
                setShowSatelliteModal(false);
                setView("cases");
                notify("Field verification request logged with geo-coordinates.");
              }}
            />
          </div>
        </div>
      )}

      {/* Login & Role Switcher Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                {role === "CITIZEN" ? "Sign in to NIGRANI" : "Switch role"}
              </h3>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 space-y-2">
              <p className="text-xs text-slate-400">
                Select a role to enter the appropriate portal. Government roles see a jurisdiction-scoped workspace; citizens see the public portal only.
              </p>

              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          role: r,
                          state: GOV_ROLES.includes(r) ? scope.state || "Karnataka" : "",
                          district: GOV_ROLES.includes(r) ? scope.district || "" : "",
                        }),
                      });
                      const json = await res.json();
                      if (!res.ok) throw new Error(json.error || "Sign in failed");
                      setRole(r);
                      setScope(json.scope || {});
                      setShowPublicProject(false);
                      setLoginModalOpen(false);
                      notify(`Signed in as ${ROLE_META[r].label}.`);
                      setView("command");
                    } catch (error: any) {
                      notify(error.message || "Sign in failed");
                    }
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    role === r
                      ? "bg-blue-600/20 border-blue-500 text-white font-semibold"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div className={`text-xs font-bold ${ROLE_META[r].tone}`}>{ROLE_META[r].label}</div>
                    <div className="text-[10px] text-slate-400">{ROLE_META[r].description}</div>
                  </div>
                  {role === r && <CheckCircle2 size={18} className="text-blue-400" />}
                </button>
              ))}

              {role !== "CITIZEN" && (
                <button onClick={() => { void signOut(); setLoginModalOpen(false); }} className="mt-1 w-full rounded-xl border border-slate-700 p-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                  {t.signOut}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Docked AI Copilot — government roles only */}
      {role !== "CITIZEN" && (
        <NigraniCopilotDock
          activeProjectId={selectedProjectId}
          onOpenProject={(id) => loadProject(id, "investigation")}
        />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-sky-500 text-white text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <BadgeCheck size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 1: NATIONAL COMMAND CENTER
// -------------------------------------------------------------
function CommandCenterView({
  dashboard,
  projects,
  onSelectProject,
  onNavigate,
  language = "en",
}: {
  dashboard: DashboardPayload;
  projects: ProjectItem[];
  onSelectProject: (id: string) => void;
  onNavigate: (v: ViewMode) => void;
  language?: Language;
}) {
  const ui = copy[language];
  const { totals, recentPrioritized, stateBreakdown } = dashboard;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#07172e] via-[#0d274c] to-[#12386e] p-6 lg:p-8 border border-slate-700/60 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles size={14} className="text-amber-400" />
            NIGRANI PUBLIC DEVELOPMENT INTELLIGENCE · NATIONWIDE
          </div>
          <h2 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {ui.watch} <span className="text-sky-400">{ui.verifyWork}</span>{" "}
            <span className="text-emerald-400">{ui.protect}</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-300 mt-2 leading-relaxed">
            Connecting funds, official sanction orders, execution timelines, satellite observations, and citizen
            evidence into explainable verification intelligence.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onSelectProject("NIG-DEMO-001")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <BrainCircuit size={16} />
              {ui.evidenceRoom}
            </button>
            <button
              onClick={() => onNavigate("map")}
              className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition flex items-center gap-2"
            >
              <Globe size={16} />
              {ui.exploreMap}
            </button>
          </div>
        </div>

        {/* 3D Eye Hero Silhouette */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block w-72 h-56 pointer-events-none opacity-80">
          <ThreeWatchfulEye compact interactive={false} focusLabel="National Monitor" />
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Projects Monitored</span>
            <Building size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totals.totalProjects}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Across 15 States/UTs</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Active Works</span>
            <Activity size={16} className="text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totals.activeWorks}</div>
          <div className="text-[10px] text-slate-400 mt-1">In progress / Delayed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">High-Risk Signals</span>
            <AlertOctagon size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400">{totals.highRiskCount}</div>
          <div className="text-[10px] text-red-300/80 mt-1">Requires human review</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Total Sanctioned</span>
            <IndianRupee size={16} className="text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-300">
            {formatInrCurrency(totals.totalSanctioned)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">MPLADS Approved</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Recorded Spent</span>
            <Coins size={16} className="text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-300">
            {formatInrCurrency(totals.totalExpenditure)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">PFMS / eSAKSHI Ledger</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Citizen Signals</span>
            <Users size={16} className="text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-violet-300">{totals.totalCitizenSignals}</div>
          <div className="text-[10px] text-violet-300/80 mt-1">Public verification input</div>
        </div>
      </div>

      {/* 3D Map + Risk Priorities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3D Geospatial Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="text-sky-400" size={16} />
                National Public Development Geospatial Grid
              </h3>
              <p className="text-[11px] text-slate-400">
                Interactive spatial coordinates linked with Sentinel-2 observation footprints
              </p>
            </div>
            <button
              onClick={() => onNavigate("map")}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              Full Screen Map <ArrowRight size={14} />
            </button>
          </div>

          <ThreeIndiaMapVisualizer
            projects={projects}
            onSelectProject={onSelectProject}
            selectedProjectId="NIG-DEMO-001"
          />
        </div>

        {/* Right Col: Priority Verification Queue */}
        <div className="space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BadgeAlert className="text-red-400" size={16} />
              Priority Verification Queue
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300">
              {totals.highRiskCount} FLAGGED
            </span>
          </div>

          <div className="flex-1 bg-slate-900/90 rounded-2xl border border-slate-800 p-3 space-y-2 overflow-y-auto max-h-[380px]">
            {recentPrioritized.map((proj) => (
              <button
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700/70 transition flex items-start justify-between gap-2 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-sky-300 font-bold">
                      {proj.id}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {proj.district}, {proj.state}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate mt-1">
                    {proj.workName}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sanctioned: {formatInrCurrency(proj.sanctionedAmount)} · Spent:{" "}
                    {formatInrCurrency(proj.expenditureAmount)} ({proj.financialProgress}%) · Physical:{" "}
                    {proj.physicalProgress}%
                  </p>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      (proj.riskScore || 0) >= 70
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {proj.riskScore}/100
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1">RISK SCORE</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* State Aggregates & Sector Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building size={16} className="text-sky-400" />
            State-Level MPLADS Implementation Rollup
          </h3>
          <div className="space-y-2">
            {stateBreakdown.slice(0, 5).map((s) => (
              <div
                key={s.state}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs"
              >
                <div>
                  <strong className="text-slate-200 block">{s.state}</strong>
                  <span className="text-[10px] text-slate-400">
                    {s.count} works · Sanctioned: {formatInrCurrency(s.sanctionedSum)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-sky-300 block">{formatInrCurrency(s.spentSum)}</span>
                  <span className="text-[10px] text-red-400">{s.highRiskCount} high-risk signals</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart size={16} className="text-emerald-400" />
            Priority Development Sectors
          </h3>
          <div className="space-y-2">
            {dashboard.sectorBreakdown.slice(0, 5).map((sec) => (
              <div
                key={sec.sector}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs"
              >
                <div>
                  <strong className="text-slate-200 block">{sec.sector}</strong>
                  <span className="text-[10px] text-slate-400">{sec.count} projects</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-300">{formatInrCurrency(sec.sanctionedSum)}</span>
                  <span className="text-[10px] text-slate-400 block">Avg Risk: {sec.avgRisk}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 2: 3D GEOSPATIAL MAP VIEW
// -------------------------------------------------------------
function GeoMapView({
  projects,
  selectedProjectId,
  onSelectProject,
  onCheckSatellite,
}: {
  projects: ProjectItem[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCheckSatellite: () => void;
}) {
  const current = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="text-sky-400" size={20} />
            National 3D Geospatial Observatory
          </h2>
          <p className="text-xs text-slate-400">
            Plotting {projects.length} works with Bhuvan ISRO coordinates and Copernicus Sentinel-2 AOI footprints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCheckSatellite}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
          >
            <Sparkles size={14} />
            CHECK WITH SATELLITE (Sentinel-2 L2A)
          </button>
        </div>
      </div>

      <ThreeIndiaMapVisualizer
        projects={projects}
        onSelectProject={onSelectProject}
        selectedProjectId={selectedProjectId}
      />

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Satellite className="text-[#ff9933]" size={16} />Google satellite evidence context</h3>
            <p className="text-[11px] text-slate-400">Use this layer to inspect the project coordinate. It is location context, not proof of completion.</p>
          </div>
          <span className="text-[10px] font-mono text-slate-500">LIVE KEY OR CONFIGURATION FALLBACK</span>
        </div>
        <GoogleSatelliteMap projects={projects} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} height="430px" />
      </div>

      {/* Project Selected Drawer */}
      {current && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-bold border border-sky-800">
                {current.id}
              </span>
              <span className="text-xs text-slate-400">
                📍 {current.district}, {current.state} ({current.constituency})
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {current.sector}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{current.workName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sanctioned: <strong>{formatInrCurrency(current.sanctionedAmount)}</strong> · Spent:{" "}
              <strong>{formatInrCurrency(current.expenditureAmount)}</strong> ({current.financialProgress}%) ·
              Physical Progress: <strong>{current.physicalProgress}%</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onCheckSatellite}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Globe size={14} /> Compare Satellite Imagery
            </button>
            <button
              onClick={() => onSelectProject(current.id)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <BrainCircuit size={14} /> View Evidence Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 3: 3D EVIDENCE FUSION ROOM (THE "WOW INTERACTION")
// -------------------------------------------------------------
function EvidenceFusionRoomView({
  detail,
  loading,
  onSelectProject,
  onOpenSatellite,
  onDispatchField,
  onOpenCitizenVerify,
}: {
  detail: any;
  loading: boolean;
  onSelectProject: (id: string) => void;
  onOpenSatellite: () => void;
  onDispatchField: () => void;
  onOpenCitizenVerify: () => void;
}) {
  const [activeNode, setActiveNode] = useState<string>("Financial");

  if (loading || !detail) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 size={36} className="animate-spin text-sky-400" />
        <p className="text-sm font-semibold text-slate-200">
          Focusing 3D Watchful Eye & Fusing Multi-Stream Evidence...
        </p>
      </div>
    );
  }

  const { project, score, signals, evidence, asset } = detail;

  const streamNodes = [
    { key: "Financial", icon: IndianRupee, label: "₹ Funds & Spend", color: "text-amber-400" },
    { key: "Document", icon: FileText, label: "📄 Sanction Orders", color: "text-sky-400" },
    { key: "Timeline", icon: Clock, label: "📅 Milestones", color: "text-purple-400" },
    { key: "Location", icon: MapPin, label: "📍 Bhuvan GPS Fix", color: "text-emerald-400" },
    { key: "Satellite", icon: Globe, label: "🛰 Sentinel-2 L2A", color: "text-cyan-400" },
    { key: "Image", icon: Camera, label: "📷 Site Photos", color: "text-orange-400" },
  ];

  const selectedEvidenceItem = evidence.find((e: any) => e.type.toLowerCase().includes(activeNode.toLowerCase())) || evidence[0];

  return (
    <div className="space-y-6">
      {/* Project Header Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-blue-950 text-blue-300 font-bold border border-blue-800">
              {project.id}
            </span>
            <span className="text-xs text-slate-300">
              📍 {project.district}, {project.state} ({project.constituency})
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {project.sector}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">
              {project.status}
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-white">{project.workName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Official Source: <i>{project.sourceRecordId}</i> · Quality Score: <strong>{project.dataQualityScore}/100</strong> · Completeness: <strong>{project.completenessScore}/100</strong>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSatellite}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
          >
            <Globe size={15} />
            CHECK WITH SATELLITE
          </button>
          <button
            onClick={onDispatchField}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-2"
          >
            <ShieldCheck size={15} />
            Dispatch Field Verification
          </button>
        </div>
      </div>

      {/* 3-Column WOW Investigation Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COL (3 cols): Project Facts & Asset Passport */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building size={15} className="text-sky-400" />
              Source-Recorded Facts
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Sanctioned Amount</span>
                <strong className="text-white">{formatInrCurrency(project.sanctionedAmount)}</strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Recorded Spent</span>
                <strong className="text-amber-300">{formatInrCurrency(project.expenditureAmount)}</strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Physical Progress</span>
                <strong className="text-emerald-300">{project.physicalProgress}%</strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Financial Progress</span>
                <strong className="text-sky-300">{project.financialProgress}%</strong>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Coordinates</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {project.latitude}, {project.longitude}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sanction Order Date</span>
                <span className="text-slate-300">{project.sanctionDate || "28 May 2024"}</span>
              </div>
            </div>
          </div>

          {/* 3D Asset Passport Viewer */}
          <ThreeAssetPassportViewer
            assetType={project.sector}
            model3dType={asset?.model3dType || "building"}
            condition={asset?.condition || "Good"}
            lifecycleState={asset?.lifecycleState || "Execution"}
          />
        </div>

        {/* CENTER COL (5 cols): 3D Watchful Eye & Evidence Orbit */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative p-5 rounded-3xl bg-gradient-to-b from-[#091e3d] via-[#081830] to-[#061224] border border-slate-700/80 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-300">
                EVIDENCE FUSION ROOM
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                CORRELATED
              </span>
            </div>

            {/* 3D Watchful Eye Canvas */}
            <div className="w-full h-[280px]">
              <ThreeWatchfulEye focusLabel={`${activeNode} Vector`} compact={false} />
            </div>

            {/* 6 Orbit Streams Buttons */}
            <div className="grid grid-cols-3 gap-2 w-full mt-2">
              {streamNodes.map((n) => {
                const Icon = n.icon;
                const isSelected = activeNode === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => setActiveNode(n.key)}
                    className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                      isSelected
                        ? "bg-blue-600 border-blue-400 text-white font-bold shadow-lg shadow-blue-600/30"
                        : "bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={14} className={n.color} />
                    <span className="text-[11px] truncate">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Evidence Item Card */}
          {selectedEvidenceItem && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-bold">
                  {selectedEvidenceItem.type} Stream Evidence
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Confidence: {selectedEvidenceItem.confidence || 85}%
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">{selectedEvidenceItem.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedEvidenceItem.summary}</p>
            </div>
          )}
        </div>

        {/* RIGHT COL (4 cols): Risk Engine & Explainable Signals */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  EXPLAINABLE RISK ENGINE
                </span>
                <h3 className="text-sm font-bold text-white">Risk & Confidence Score</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300">
                NIG-RISK-2.4
              </span>
            </div>

            {/* Twin Score Dials */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div>
                <div className="text-3xl font-extrabold text-red-400">{score?.score || 78}</div>
                <div className="text-[10px] font-bold text-slate-400 mt-0.5">RISK SCORE (0-100)</div>
                <div className="text-[9px] text-red-300/80 uppercase font-mono mt-1">High Anomaly</div>
              </div>
              <div className="border-l border-slate-800">
                <div className="text-3xl font-extrabold text-emerald-400">
                  {score?.evidenceConfidence || 86}
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-0.5">EVIDENCE CONFIDENCE</div>
                <div className="text-[9px] text-emerald-300/80 uppercase font-mono mt-1">Strong Corroboration</div>
              </div>
            </div>

            {/* WHY FLAGGED? Multi-stream breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" />
                Why Flagged? (Explainable Signal Breakdown)
              </h4>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {signals.map((sig: any) => (
                  <div
                    key={sig.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs flex items-start gap-2"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold font-mono text-[10px] flex-shrink-0">
                      +{sig.contribution}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-slate-200 block text-[11px]">{sig.dimension}</strong>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{sig.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Action Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-800/60 space-y-1 text-xs">
              <strong className="text-sky-300 flex items-center gap-1.5 font-bold">
                <Sparkles size={14} /> Recommended Next Action
              </strong>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {score?.recommendation ||
                  "Request latest physical progress evidence, cross-correlate Sentinel-2 imagery, and dispatch authorized district field verification."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 4: PROJECT EXPLORER
// -------------------------------------------------------------
function ProjectExplorerView({
  projects,
  totalCount,
  searchQuery,
  setSearchQuery,
  stateFilter,
  setStateFilter,
  sectorFilter,
  setSectorFilter,
  statusFilter,
  setStatusFilter,
  riskFilter,
  setRiskFilter,
  onSelectProject,
}: {
  projects: ProjectItem[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  stateFilter: string;
  setStateFilter: (v: string) => void;
  sectorFilter: string;
  setSectorFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  riskFilter: string;
  setRiskFilter: (v: string) => void;
  onSelectProject: (id: string) => void;
}) {
  const exportCsv = () => {
    const headers = [
      "Project ID",
      "Work Name",
      "State",
      "District",
      "Constituency",
      "Sector",
      "Sanctioned (INR)",
      "Expenditure (INR)",
      "Physical Progress %",
      "Status",
      "Risk Score",
      "Data Quality",
    ];
    const rows = projects.map((p) => [
      p.id,
      `"${p.workName.replace(/"/g, '""')}"`,
      p.state,
      p.district,
      p.constituency || "",
      p.sector,
      p.sanctionedAmount || "",
      p.expenditureAmount || "",
      p.physicalProgress ?? "",
      p.status,
      p.riskScore ?? "",
      p.dataQualityScore,
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NIGRANI_Projects_Export_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="text-sky-400" size={18} />
              National Project Explorer
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {projects.length} of {totalCount} records
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Filter by Indian state, parliamentary constituency, priority sector, and explainable risk tier
            </p>
          </div>

          <button
            onClick={exportCsv}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Filter Inputs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Project ID, district, work..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option>All States</option>
            {Array.from(new Set(INDIAN_STATES.map((s) => s.state))).map((st) => (
              <option key={st}>{st}</option>
            ))}
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option>All Sectors</option>
            {MPLADS_SECTORS.map((sec) => (
              <option key={sec}>{sec}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option>All Statuses</option>
            <option>In Progress</option>
            <option>Reported Completed</option>
            <option>Completed</option>
            <option>Delayed</option>
            <option>Non-Progress</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Risk Tiers</option>
            <option value="High">High Risk (≥70)</option>
            <option value="Medium">Medium Review (45-69)</option>
            <option value="Low">Low / Routine (&lt;45)</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
              <tr>
                <th className="p-3.5 pl-5">Project Details</th>
                <th className="p-3.5">Location & MP</th>
                <th className="p-3.5">Sector</th>
                <th className="p-3.5">Sanctioned</th>
                <th className="p-3.5">Spent</th>
                <th className="p-3.5">Progress</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {projects.map((p) => {
                const isHighRisk = (p.riskScore || 0) >= 70;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3.5 pl-5 max-w-xs">
                      <div className="font-bold text-white truncate">{p.workName}</div>
                      <div className="text-[10px] font-mono text-sky-400">{p.id}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">
                        {p.district}, {p.state}
                      </div>
                      <div className="text-[10px] text-slate-400">{p.constituency}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                        {p.sector}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-white">
                      {formatInrCurrency(p.sanctionedAmount)}
                    </td>

                    <td className="p-3.5 font-semibold text-amber-300">
                      {formatInrCurrency(p.expenditureAmount)}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${p.physicalProgress || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px]">{p.physicalProgress}%</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === "Completed"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : p.status === "Delayed" || p.status === "Non-Progress"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                          isHighRisk
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {p.riskScore ?? "—"}
                      </span>
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 5: WHERE IS THE MONEY GOING? (FINANCIAL FORENSICS)
// -------------------------------------------------------------
function FinancialForensicView({
  projects,
  onSelectProject,
}: {
  projects: ProjectItem[];
  onSelectProject: (id: string) => void;
}) {
  const anomalies = projects.filter(
    (p) => (p.financialProgress ?? 0) - (p.physicalProgress ?? 0) >= 20
  );
  const sanctionedTotal = projects.reduce((sum, project) => sum + Number(project.sanctionedAmount || 0), 0);
  const expenditureTotal = projects.reduce((sum, project) => sum + Number(project.expenditureAmount || 0), 0);
  const completedExpenditure = projects.filter((project) => project.status === "Completed").reduce((sum, project) => sum + Number(project.expenditureAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <IndianRupee className="text-amber-400" size={20} />
          Where Is The Money Going? — Financial Progression Ledger
        </h2>
        <p className="text-xs text-slate-400">
          Compare sanctioned amounts, recorded expenditure and reported physical progress. Values shown are from the current workspace snapshot.
        </p>
      </div>

      {/* Multi-Stage Financial Flow / Sankey Waterfall Summary */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#081830] to-[#0c2448] border border-slate-700/80 shadow-2xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-300">
          FINANCIAL FLOW · CURRENT WORKSPACE SNAPSHOT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase">1. SANCTIONED WORKS</span>
            <div className="text-xl font-extrabold text-white mt-1">{formatInrCurrency(sanctionedTotal)}</div>
            <div className="text-[10px] text-slate-400">{projects.length} stored project records</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-sky-400 uppercase">2. RECORDED EXPENDITURE</span>
            <div className="text-xl font-extrabold text-sky-300 mt-1">{formatInrCurrency(expenditureTotal)}</div>
            <div className="text-[10px] text-slate-400">Stored expenditure fields</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-amber-400 uppercase">3. EXPENDITURE GAP</span>
            <div className="text-xl font-extrabold text-amber-300 mt-1">{formatInrCurrency(Math.max(0, sanctionedTotal - expenditureTotal))}</div>
            <div className="text-[10px] text-slate-400">Sanctioned less recorded spend</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">4. COMPLETED WORKS</span>
            <div className="text-xl font-extrabold text-emerald-300 mt-1">{formatInrCurrency(completedExpenditure)}</div>
            <div className="text-[10px] text-slate-400">Expenditure on source-reported completed works</div>
          </div>
        </div>
      </div>

      {/* Progress vs Expenditure Divergence Watchlist */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={16} />
              Disbursement vs Physical Execution Divergence Watchlist
            </h3>
            <p className="text-xs text-slate-400">
              Projects where funds spent outpace reported ground execution by ≥ 20%
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
            {anomalies.length} DIVERGENT WORKS
          </span>
        </div>

        <div className="space-y-2.5">
          {anomalies.map((p) => {
            const delta = (p.financialProgress ?? 0) - (p.physicalProgress ?? 0);
            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-sky-400 font-bold">
                      {p.id}
                    </span>
                    <span className="text-xs text-slate-300">
                      {p.district}, {p.state}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{p.workName}</h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>Sanctioned: {formatInrCurrency(p.sanctionedAmount)}</span>
                    <span>Spent: {formatInrCurrency(p.expenditureAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-400">+{delta}% Fund Divergence</div>
                    <div className="text-[10px] text-slate-400">
                      Spent {p.financialProgress}% vs Progress {p.physicalProgress}%
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectProject(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 6: 2x2 DECISION MATRIX
// -------------------------------------------------------------
function DecisionMatrixView({
  projects,
  onSelectProject,
}: {
  projects: ProjectItem[];
  onSelectProject: (id: string) => void;
}) {
  const priorityVerif = projects.filter((p) => (p.riskScore || 0) >= 65 && (p.evidenceConfidence || 0) >= 70);
  const requestEvidence = projects.filter((p) => (p.riskScore || 0) >= 65 && (p.evidenceConfidence || 0) < 70);
  const routineMonitor = projects.filter((p) => (p.riskScore || 0) < 65 && (p.evidenceConfidence || 0) >= 70);
  const dataCompletion = projects.filter((p) => (p.riskScore || 0) < 65 && (p.evidenceConfidence || 0) < 70);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers3 className="text-sky-400" size={20} />
          NIGRANI 2×2 Decision Framework Matrix
        </h2>
        <p className="text-xs text-slate-400">
          Classifying public development works by Risk Anomaly Severity vs Evidence Confidence Strength to prevent false accusations and optimize field inspection resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant 1: High Risk + High Evidence */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-red-950/60 to-slate-900 border border-red-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-900/80 text-red-300 font-bold">
                QUADRANT I
              </span>
              <h3 className="text-sm font-extrabold text-red-300 mt-1">PRIORITY VERIFICATION</h3>
            </div>
            <span className="text-2xl font-black text-red-400">{priorityVerif.length}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            High risk anomaly supported by strong multi-stream corroboration. Immediate field verification recommended.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {priorityVerif.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-red-900/50 hover:bg-slate-850 text-left text-xs flex justify-between items-center"
              >
                <div className="truncate">
                  <strong className="text-white block truncate">{p.workName}</strong>
                  <span className="text-[10px] text-slate-400">
                    {p.id} · {p.district}
                  </span>
                </div>
                <span className="text-xs font-bold text-red-400">{p.riskScore}/100</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quadrant 2: High Risk + Low Evidence */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 font-bold">
                QUADRANT II
              </span>
              <h3 className="text-sm font-extrabold text-amber-300 mt-1">REQUEST EVIDENCE</h3>
            </div>
            <span className="text-2xl font-black text-amber-400">{requestEvidence.length}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Anomaly detected but available evidence is incomplete. Issue formal notice for stage documents & photos.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {requestEvidence.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-amber-900/50 hover:bg-slate-850 text-left text-xs flex justify-between items-center"
              >
                <div className="truncate">
                  <strong className="text-white block truncate">{p.workName}</strong>
                  <span className="text-[10px] text-slate-400">
                    {p.id} · {p.district}
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-400">{p.riskScore}/100</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quadrant 3: Low Risk + High Evidence */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 font-bold">
                QUADRANT III
              </span>
              <h3 className="text-sm font-extrabold text-emerald-300 mt-1">ROUTINE MONITORING</h3>
            </div>
            <span className="text-2xl font-black text-emerald-400">{routineMonitor.length}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Normal execution supported by verified milestone records and corroborative satellite observations.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {routineMonitor.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-emerald-900/50 hover:bg-slate-850 text-left text-xs flex justify-between items-center"
              >
                <div className="truncate">
                  <strong className="text-white block truncate">{p.workName}</strong>
                  <span className="text-[10px] text-slate-400">
                    {p.id} · {p.district}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400">{p.riskScore}/100</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quadrant 4: Low Risk + Low Evidence */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                QUADRANT IV
              </span>
              <h3 className="text-sm font-extrabold text-sky-300 mt-1">DATA COMPLETION</h3>
            </div>
            <span className="text-2xl font-black text-slate-300">{dataCompletion.length}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            No obvious anomaly, but missing geographic fix or completion sign-off. Request ingestion update.
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {dataCompletion.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:bg-slate-850 text-left text-xs flex justify-between items-center"
              >
                <div className="truncate">
                  <strong className="text-white block truncate">{p.workName}</strong>
                  <span className="text-[10px] text-slate-400">
                    {p.id} · {p.district}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">{p.riskScore}/100</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 7: CITIZEN PUBLIC VERIFICATION PORTAL
// -------------------------------------------------------------
function CitizenPortalView({
  projects,
  onSelectProject,
  notify,
  language = "en",
}: {
  projects: ProjectItem[];
  onSelectProject: (id: string) => void;
  notify: (msg: string) => void;
  language?: Language;
}) {
  const ui = copy[language];
  const [activeTab, setActiveTab] = useState<"search" | "submit" | "track">("search");
  const [searchWord, setSearchWord] = useState("");
  const [chosenProject, setChosenProject] = useState<ProjectItem | null>(projects[0] || null);

  // Form State
  const [category, setCategory] = useState("Work appears incomplete");
  const [comment, setComment] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTrackingId, setSubmittedTrackingId] = useState<string | null>(null);

  // Track State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const matchedProjects = useMemo(() => {
    if (!searchWord.trim()) return projects.slice(0, 6);
    return projects
      .filter((p) =>
        `${p.id} ${p.workName} ${p.district} ${p.state}`.toLowerCase().includes(searchWord.toLowerCase())
      )
      .slice(0, 6);
  }, [projects, searchWord]);

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenProject) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: chosenProject.id,
          category,
          comment,
          latitude: chosenProject.latitude ? parseFloat(chosenProject.latitude) : undefined,
          longitude: chosenProject.longitude ? parseFloat(chosenProject.longitude) : undefined,
          accuracy: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmittedTrackingId(data.trackingId);
      setActiveTab("track");
      notify(`Verification Signal submitted! Tracking ID: ${data.trackingId}`);
    } catch (err: any) {
      notify(err.message || "Failed to submit verification signal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async () => {
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/verifications?trackingId=${encodeURIComponent(trackQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tracking ID not found");
      setTrackResult(data.verification);
    } catch (err: any) {
      notify(err.message || "Verification tracking record not found.");
      setTrackResult(null);
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Citizen Hero */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#061836] via-[#092956] to-[#0d3b7a] text-center border border-slate-700/70 shadow-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
          <UserRoundCheck size={14} />
          सार्वजनिक विकास कार्य सत्यापन · CITIZEN TRUST PLATFORM
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
          {ui.publicVerify}
        </h2>
        <p className="text-xs lg:text-sm text-slate-300 max-w-xl mx-auto">
          See a school, road, water tank or community center in your district? Check what funds were sanctioned and report real ground observations for official review.
        </p>

        {/* Tab Switcher */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "search"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            1. {ui.searchWorks}
          </button>
          <button
            onClick={() => setActiveTab("submit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "submit"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            2. {ui.reportIssue}
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "track"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            3. {ui.trackStatus}
          </button>
        </div>
      </div>

      {/* TAB 1: SEARCH WORKS */}
      {activeTab === "search" && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Enter village, district, school name or Project ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {matchedProjects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400 font-bold">
                    {p.id}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    Sanctioned: {formatInrCurrency(p.sanctionedAmount)}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{p.workName}</h4>
                <p className="text-[11px] text-slate-400">
                  📍 {p.district}, {p.state} · Sector: {p.sector} · Status: <strong>{p.status}</strong>
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500">Reported Progress: {p.physicalProgress}%</span>
                  <button
                    onClick={() => {
                      setChosenProject(p);
                      setActiveTab("submit");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <UserRoundCheck size={13} /> Verify This Work
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUBMIT ISSUE */}
      {activeTab === "submit" && chosenProject && (
        <form onSubmit={handleCitizenSubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-sky-400">{chosenProject.id}</span>
              <h3 className="text-xs font-bold text-white">{chosenProject.workName}</h3>
              <p className="text-[11px] text-slate-400">
                {chosenProject.district}, {chosenProject.state}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className="text-xs text-sky-400 underline"
            >
              Change Work
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option>Work not visible on ground</option>
                <option>Work appears incomplete / stalled</option>
                <option>Incorrect location or coordinates</option>
                <option>Asset damaged / poor construction quality</option>
                <option>Asset inaccessible to public</option>
                <option>Information appears outdated</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Your Ground Observation</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Describe what you observed (e.g. structure partially built, road has cracks, RO water plant not functioning)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-dashed border-slate-800 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Camera size={20} className="flex-shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <strong className="block truncate text-slate-200">Attach site photo</strong>
                  <span className="block truncate text-[10px] text-slate-400">Optional · {photoName || "Helps an officer plan field review"}</span>
                </div>
              </div>
              <label className={`flex-shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold ${hasPhoto ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                {hasPhoto ? "Photo selected" : "Choose photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 8 * 1024 * 1024) {
                      notify("Photo must be smaller than 8 MB.");
                      return;
                    }
                    setHasPhoto(true);
                    setPhotoName(file.name);
                  }}
                />
              </label>
            </div>
            {hasPhoto && <p className="-mt-2 text-[10px] text-slate-500">Selected on this device. Secure object-storage upload is required before a production deployment.</p>}

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Protected:</strong> Citizen identities are never published publicly. Submissions are registered as analytical verification signals for district quality officers.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Submit Verification Signal
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TRACK SUBMISSION */}
      {activeTab === "track" && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search size={16} className="text-emerald-400" />
            Track Verification Status by Tracking ID
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              placeholder="e.g. VRF-IN-2026-8900"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleLookup}
              disabled={trackLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              {trackLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Track
            </button>
          </div>

          {submittedTrackingId && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs space-y-1">
              <strong className="text-emerald-300 block">Your Latest Submission</strong>
              <p className="text-slate-300">
                Tracking ID: <span className="font-mono font-bold text-white">{submittedTrackingId}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Status: <strong className="text-emerald-400">Received (Queued for District Review)</strong>
              </p>
            </div>
          )}

          {trackResult && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sky-400 font-bold">{trackResult.trackingId}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  {trackResult.stateStatus}
                </span>
              </div>
              <h4 className="font-bold text-white">{trackResult.workName}</h4>
              <p className="text-slate-400">
                Category: <strong>{trackResult.category}</strong>
              </p>
              <p className="text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                &ldquo;{trackResult.comment}&rdquo;
              </p>
              {trackResult.officialResponse && (
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800 text-sky-300">
                  <strong>Official Action:</strong> {trackResult.officialResponse}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 8: INVESTIGATION CASES WORKSPACE
// -------------------------------------------------------------
function CasesWorkspaceView({
  detail,
  onSelectProject,
  role,
  notify,
}: {
  detail: any;
  onSelectProject: (id: string) => void;
  role: string;
  notify: (msg: string) => void;
}) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [caseState, setCaseState] = useState<string>("Desk review");
  const [casePriority, setCasePriority] = useState<string>("High");
  const [findingText, setFindingText] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const project = detail?.project;
  const detailCases = detail?.cases || [];
  const currentCase = detailCases.find((c: any) => c.id === selectedCaseId) || detailCases[0] || queue[0] || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingQueue(true);
      try {
        const res = await fetch("/api/cases");
        const json = await res.json();
        if (!cancelled) {
          setQueue(json.cases || []);
          if (!selectedCaseId && json.cases?.[0]?.id) setSelectedCaseId(json.cases[0].id);
        }
      } catch {
        if (!cancelled) notify("Case queue could not be loaded.");
      } finally {
        if (!cancelled) setLoadingQueue(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notify, selectedCaseId]);

  useEffect(() => {
    if (!currentCase) return;
    setCaseState(currentCase.caseState || currentCase.state || "Desk review");
    setCasePriority(currentCase.priority || "High");
    setFindingText(currentCase.notes || "");
    // intentionally sync only when the selected case identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCase?.id]);

  const ensureAuth = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role === "CITIZEN" ? "INVESTIGATOR" : role }),
    });
    if (!res.ok) throw new Error("Unable to establish authorized session");
  };

  const updateCase = async () => {
    if (!currentCase?.id) return notify("No case selected.");
    setBusy(true);
    try {
      await ensureAuth();
      const res = await fetch(`/api/cases/${currentCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: caseState, priority: casePriority, notes: findingText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update case");
      notify("Case status transition saved with full audit signature.");
      const refresh = await fetch("/api/cases");
      const refreshed = await refresh.json();
      setQueue(refreshed.cases || []);
      if (currentCase.projectId || project?.id) onSelectProject(currentCase.projectId || project.id);
    } catch (error: any) {
      notify(error.message || "Case update failed.");
    } finally {
      setBusy(false);
    }
  };

  const recordFieldVerification = async () => {
    const projectId = currentCase?.projectId || project?.id;
    if (!projectId) return notify("Open a project before recording field verification.");
    setBusy(true);
    try {
      await ensureAuth();
      const res = await fetch("/api/field-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          caseId: currentCase?.id,
          notes: findingText || "Field observation recorded from investigation workspace.",
          physicalCondition: "Observed on site",
          latitude: project?.latitude ? Number(project.latitude) : undefined,
          longitude: project?.longitude ? Number(project.longitude) : undefined,
          checklist: {
            structureVisible: true,
            progressConsistent: false,
            publicAccessAvailable: true,
            geoTagCaptured: true,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Field verification failed");
      notify(json.message || "Field observation recorded.");
      onSelectProject(projectId);
    } catch (error: any) {
      notify(error.message || "Field verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = async (type: string) => {
    const projectId = currentCase?.projectId || project?.id || "NIG-DEMO-001";
    const res = await fetch(`/api/reports?type=${encodeURIComponent(type)}&projectId=${encodeURIComponent(projectId)}&format=json`);
    if (!res.ok) return notify("Report could not be generated.");
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nigrani-${type}-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`${type} report downloaded with provenance metadata.`);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FolderKanban className="text-red-400" size={20} />
          Authorized Human Investigation Center
        </h2>
        <p className="text-xs text-slate-400">
          Formal workflow for District Quality Monitors, State Officers, and Auditors. Analytical flags require human verification and never become automatic findings of wrongdoing.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-3">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Case Queue</h3>
              <span className="text-[10px] font-mono text-slate-400">{queue.length} OPEN</span>
            </div>
            {loadingQueue ? (
              <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} />Loading cases…</div>
            ) : queue.length ? (
              <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCaseId(item.id);
                      if (item.projectId) onSelectProject(item.projectId);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      currentCase?.id === item.id
                        ? "border-blue-500 bg-blue-950/40"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-sky-300">{item.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.priority === "Critical" ? "bg-red-950 text-red-300" : "bg-amber-950 text-amber-300"}`}>{item.priority}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-white line-clamp-2">{item.workName}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{item.district}, {item.stateName} · Risk {item.riskScore ?? "—"}/100</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">No investigation cases are currently open.</div>
            )}
          </div>
        </div>

        <div className="xl:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            {!currentCase ? (
              <div className="text-xs text-slate-400">Select a case from the queue or open a high-risk project evidence room.</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 text-sky-400 font-bold border border-slate-800">{currentCase.id}</span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800">{casePriority} Priority</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{project?.workName || currentCase.workName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Project ID: {project?.id || currentCase.projectId} · Assigned to: <strong>{currentCase.assignedTo || "Unassigned"}</strong></p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <strong className="text-slate-300 block">Flag Reason</strong>
                  <p className="text-slate-400 leading-relaxed">{currentCase.reason}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">CASE LIFECYCLE STAGE</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-center text-xs">
                    {["Alert", "Assigned", "Desk review", "Field verification", "Finding", "Resolved", "Escalated"].map((st) => {
                      const isActive = caseState.toLowerCase() === st.toLowerCase();
                      return (
                        <button key={st} onClick={() => setCaseState(st)} className={`p-2 rounded-xl font-semibold border transition ${isActive ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30" : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"}`}>{st}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Field Officer Observation / Verification Finding</label>
                  <textarea value={findingText} onChange={(e) => setFindingText(e.target.value)} rows={4} placeholder="Enter authorized field findings. Do not record accusations. Capture observed condition, geo-tag status and recommended next action." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => downloadReport("investigation")} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2"><Download size={14} />Investigation Report</button>
                  <button onClick={recordFieldVerification} disabled={busy} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2"><MapPin size={14} />Record Field Verification</button>
                  <button onClick={updateCase} disabled={busy} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2">{busy ? <Loader2 className="animate-spin" size={14} /> : <FileCheck size={15} />} Save Authorized Finding</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={15} className="text-violet-400" />Attached Multi-Stream Evidence</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-semibold text-white"><span>Financial</span><span className="text-amber-300">{formatInrCurrency(project?.expenditureAmount)} / {formatInrCurrency(project?.sanctionedAmount)}</span></div>
                <p className="text-[10px] text-slate-400 mt-0.5">Physical {project?.physicalProgress ?? "—"}% · Financial {project?.financialProgress ?? "—"}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-semibold text-white"><span>Risk / Confidence</span><span className="text-red-300">{detail?.score?.score ?? currentCase?.riskScore ?? "—"} / {detail?.score?.evidenceConfidence ?? currentCase?.evidenceConfidence ?? "—"}</span></div>
                <p className="text-[10px] text-slate-400 mt-0.5">Completeness {detail?.score?.completenessScore ?? project?.completenessScore ?? "—"}/100</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-semibold text-white"><span>Satellite</span><span className="text-sky-300">{detail?.observations?.length ? "Metadata available" : "Not loaded"}</span></div>
                <p className="text-[10px] text-slate-400 mt-0.5">{detail?.observations?.[0]?.corroborationStatus || "Open CHECK WITH SATELLITE for location context."}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between font-semibold text-white"><span>Citizen Signals</span><span className="text-emerald-400">{detail?.verifications?.length ?? 0}</span></div>
                <p className="text-[10px] text-slate-400 mt-0.5">Public reports remain verification signals only.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => downloadReport("evidence")} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] text-slate-200 hover:bg-slate-900">Download Evidence Report</button>
              <button onClick={() => downloadReport("satellite")} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] text-slate-200 hover:bg-slate-900">Download Satellite Report</button>
              <button onClick={() => downloadReport("asset")} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] text-slate-200 hover:bg-slate-900">Download Asset Passport</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 9: DATA INGESTION CENTER
// -------------------------------------------------------------
function DataIngestionView({ notify }: { notify: (msg: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileUp className="text-sky-400" size={20} />
          Multi-Source Versioned Ingestion Center
        </h2>
        <p className="text-xs text-slate-400">
          Upload official reports (CSV, XLSX, PDF, GeoJSON) to run schema validation, duplicate detection, and create immutable versioned snapshots.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-10 rounded-3xl border-2 border-dashed text-center transition ${
          dragOver ? "border-sky-400 bg-sky-950/20" : "border-slate-700 bg-slate-900/60"
        } space-y-4`}
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-sky-400">
          <UploadCloud size={32} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            {selectedFile ? selectedFile.name : "Drop Official Report or Datasets"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: CSV · XLSX · PDF · JSON · GeoJSON (Max 25 MB)
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer">
            Browse Files
            <input
              type="file"
              className="hidden"
              onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
            />
          </label>
          {selectedFile && (
            <button
              onClick={() => {
                notify(`Validation engine started for ${selectedFile.name}`);
                setSelectedFile(null);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Validate & Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-VIEW 10: MODEL GOVERNANCE & INTEGRATION HEALTH
// -------------------------------------------------------------
function GovernanceHealthView() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [quality, setQuality] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [integrationsRes, qualityRes, auditRes] = await Promise.all([
          fetch("/api/integrations"),
          fetch("/api/data-quality"),
          fetch("/api/audit?limit=20"),
        ]);
        const integrationsJson = await integrationsRes.json();
        const qualityJson = await qualityRes.json();
        const auditJson = auditRes.ok ? await auditRes.json() : { rows: [] };
        if (cancelled) return;
        setConnectors(integrationsJson.sources || []);
        setQuality(qualityJson);
        setAudits(auditJson.rows || []);
      } catch {
        if (!cancelled) setError("Governance services could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={20} />
          Model Governance & Integration Health Center
        </h2>
        <p className="text-xs text-slate-400">
          Traceable auditability of connected external APIs, explainable AI model versions, data-quality scores and ethical safeguards.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-xs text-slate-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16} />Loading governance telemetry…</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-800 bg-red-950/30 p-6 text-xs text-red-200">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              ["Data Quality", quality?.scores?.dataQuality],
              ["Completeness", quality?.scores?.completeness],
              ["Consistency", quality?.scores?.consistency],
              ["Freshness", quality?.scores?.freshness],
              ["Geo Validity", quality?.scores?.geographicValidity],
              ["Source Reliability", quality?.scores?.sourceReliability],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="text-[11px] text-slate-400">{label}</div>
                <div className="mt-1 text-2xl font-extrabold text-white">{value ?? "—"}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-300">AUTHORIZED CONNECTOR STATUS</h3>
              <div className="space-y-2 text-xs">
                {(connectors.length ? connectors : [
                  { name: "PostgreSQL", sourceType: "Database", status: "connected", authority: "local" },
                ]).map((c) => (
                  <div key={c.id || c.name} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-white block">{c.name}</strong>
                      <span className="text-[10px] text-slate-400">{c.sourceType || c.authority || "Connector"} · Last sync: {c.lastSuccessfulSync ? new Date(c.lastSuccessfulSync).toLocaleString("en-IN") : "Not available"}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full border font-semibold text-[11px] ${
                      String(c.status).toLowerCase().includes("connect") || String(c.status).toLowerCase() === "demo"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : String(c.status).toLowerCase().includes("snapshot")
                          ? "bg-sky-950 text-sky-300 border-sky-800"
                          : "bg-amber-950 text-amber-300 border-amber-800"
                    }`}>{c.status}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">Connector status reflects configured credentials and approved access only. No live private government API is claimed without credentials.</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-violet-300">RECENT AUDIT TRAIL</h3>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {audits.length ? audits.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-white">{row.action}</strong>
                      <span className="font-mono text-[10px] text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : ""}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">{row.actor} · {row.entityType}/{row.entityId}</div>
                    {row.reason && <div className="mt-1 text-[11px] text-slate-500">{row.reason}</div>}
                  </div>
                )) : (
                  <div className="text-xs text-slate-400">No authorized audit events are visible for the current role, or the audit trail is empty.</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">DATA QUALITY INTERPRETATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(quality?.interpretation || []).map((item: any) => (
                <div key={item.metric} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-white text-sm">{item.metric}</strong>
                    <span className="text-emerald-300 font-bold">{item.score}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{item.why}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">{quality?.disclaimer}</p>
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ROLE-BASED DASHBOARDS
// -------------------------------------------------------------
function RoleDashboard({
  role,
  dashboard,
  projects,
  scope,
  onSelectProject,
  onNavigate,
  language,
}: {
  role: UserRole;
  dashboard: DashboardPayload;
  projects: ProjectItem[];
  scope: { state?: string | null; district?: string | null };
  onSelectProject: (id: string) => void;
  onNavigate: (v: ViewMode) => void;
  language: Language;
}) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return <CommandCenterView dashboard={dashboard} projects={projects} onSelectProject={onSelectProject} onNavigate={onNavigate} language={language} />;
  }
  if (role === "OFFICIAL") {
    return <OfficialDashboard dashboard={dashboard} projects={projects} scope={scope} onSelectProject={onSelectProject} onNavigate={onNavigate} />;
  }
  if (role === "AUDITOR" || role === "INVESTIGATOR") {
    return <AuditorDashboard dashboard={dashboard} projects={projects} role={role} onSelectProject={onSelectProject} onNavigate={onNavigate} />;
  }
  return <CitizenDashboard projects={projects} onSelectProject={onSelectProject} onNavigate={onNavigate} language={language} />;
}

function OfficialDashboard({
  dashboard,
  projects,
  scope,
  onSelectProject,
  onNavigate,
}: {
  dashboard: DashboardPayload;
  projects: ProjectItem[];
  scope: { state?: string | null; district?: string | null };
  onSelectProject: (id: string) => void;
  onNavigate: (v: ViewMode) => void;
}) {
  const scopedProjects = scope.state ? projects.filter((p) => p.state === scope.state) : projects;
  const needingReview = scopedProjects.filter((p) => p.verificationStatus === "Needs Review" || (p.riskScore ?? 0) >= 70).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="eyebrow"><Target size={14} />MY WORK</p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">Assigned projects</h2>
        <p className="mt-2 text-xs text-slate-400">
          {scope.state ? <>You are reviewing <strong className="text-slate-200">{scope.state}</strong>{scope.district ? ` · ${scope.district}` : ""}.</> : "Review the projects assigned to your jurisdiction."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricStat label="Projects in scope" value={scopedProjects.length} tone="blue" />
        <MetricStat label="Requiring review" value={needingReview.length} tone="amber" />
        <MetricStat label="Open cases" value={dashboard.totals.openCasesCount} tone="red" />
        <MetricStat label="Citizen signals" value={dashboard.totals.totalCitizenSignals} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-bold text-white">Requiring review</h3>
          <div className="mt-3 space-y-2">
            {needingReview.length ? needingReview.map((p) => (
              <button key={p.id} onClick={() => onSelectProject(p.id)} className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-sky-300">{p.id}</span>
                  <span className={`text-xs font-bold ${(p.riskScore ?? 0) >= 70 ? "text-red-400" : "text-amber-300"}`}>{p.riskScore ?? "—"}/100</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-white line-clamp-1">{p.workName}</div>
                <div className="mt-0.5 text-[10px] text-slate-400">{p.district}, {p.state} · {p.status}</div>
              </button>
            )) : <div className="text-xs text-slate-400">No projects need review right now.</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-bold text-white">Next actions</h3>
          <div className="mt-3 grid gap-2">
            <button onClick={() => onNavigate("cases")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Review open cases</span><FolderKanban size={16} className="text-red-400" /></button>
            <button onClick={() => onNavigate("map")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Check a project location</span><MapPinned size={16} className="text-sky-400" /></button>
            <button onClick={() => onSelectProject("NIG-DEMO-001")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Review evidence for NIG-DEMO-001</span><Satellite size={16} className="text-emerald-400" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditorDashboard({
  dashboard,
  projects,
  role,
  onSelectProject,
  onNavigate,
}: {
  dashboard: DashboardPayload;
  projects: ProjectItem[];
  role: UserRole;
  onSelectProject: (id: string) => void;
  onNavigate: (v: ViewMode) => void;
}) {
  const flagged = dashboard.recentPrioritized.slice(0, 5);
  const title = role === "AUDITOR" ? "Evidence & audit workspace" : "Investigation workspace";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className="eyebrow"><Scale size={14} />EVIDENCE REVIEW</p>
        <h2 className="mt-1 text-2xl font-extrabold text-white">{title}</h2>
        <p className="mt-2 text-xs text-slate-400">Review evidence and assigned cases. Observations become review notes, never automatic findings of wrongdoing.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricStat label="Assigned cases" value={dashboard.totals.openCasesCount} tone="red" />
        <MetricStat label="High-risk signals" value={dashboard.totals.highRiskCount} tone="amber" />
        <MetricStat label="Evidence confidence avg" value={Math.round(dashboard.recentPrioritized.reduce((s, p) => s + (p.evidenceConfidence ?? 0), 0) / Math.max(1, dashboard.recentPrioritized.length))} tone="blue" />
        <MetricStat label="Citizen signals" value={dashboard.totals.totalCitizenSignals} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-bold text-white">Prioritized evidence</h3>
          <div className="mt-3 space-y-2">
            {flagged.map((p) => (
              <button key={p.id} onClick={() => onSelectProject(p.id)} className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-left hover:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-sky-300">{p.id}</span>
                  <span className="text-xs font-bold text-red-400">{p.riskScore ?? "—"}/100</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-white line-clamp-1">{p.workName}</div>
                <div className="mt-0.5 text-[10px] text-slate-400">{p.district}, {p.state} · Confidence {p.evidenceConfidence ?? "—"}%</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-bold text-white">Review tools</h3>
          <div className="mt-3 grid gap-2">
            <button onClick={() => onNavigate("financial")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Financial evidence</span><IndianRupee size={16} className="text-amber-400" /></button>
            <button onClick={() => onNavigate("cases")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Open my cases</span><FolderKanban size={16} className="text-red-400" /></button>
            <button onClick={() => onSelectProject("NIG-DEMO-001")} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left hover:border-slate-700"><span className="text-xs font-semibold text-white">Compare satellite evidence</span><Satellite size={16} className="text-sky-400" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CitizenDashboard({
  projects,
  onSelectProject,
  onNavigate,
  language,
}: {
  projects: ProjectItem[];
  onSelectProject: (id: string) => void;
  onNavigate: (v: ViewMode) => void;
  language: Language;
}) {
  const ui = copy[language];
  const recent = projects.slice(0, 3);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-b from-[#0c2448] to-slate-900 p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <UserRoundCheck size={14} /> PUBLIC VERIFICATION
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">{ui.publicVerify}</h2>
        <p className="mx-auto mt-2 max-w-md text-xs text-slate-300 sm:text-sm">
          See a school, road, water tank or community centre in your area? Check the record and share what you observed.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button onClick={() => onNavigate("explorer")} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left hover:border-slate-600">
            <Search size={18} className="text-sky-400" />
            <div className="mt-2 text-sm font-bold text-white">{ui.searchWorks}</div>
            <div className="mt-1 text-[11px] text-slate-400">Find a project by ID, district or name.</div>
          </button>
          <button onClick={() => onNavigate("citizen")} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left hover:border-slate-600">
            <UserRoundCheck size={18} className="text-emerald-400" />
            <div className="mt-2 text-sm font-bold text-white">{ui.reportIssue}</div>
            <div className="mt-1 text-[11px] text-slate-400">Submit an observation with a tracking ID.</div>
          </button>
          <button onClick={() => onNavigate("map")} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left hover:border-slate-600">
            <MapPinned size={18} className="text-saffron-400" />
            <div className="mt-2 text-sm font-bold text-white">{ui.exploreMap}</div>
            <div className="mt-1 text-[11px] text-slate-400">See projects near you on the map.</div>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white">Recent public projects</h3>
        <div className="mt-3 grid gap-3">
          {recent.map((p) => (
            <button key={p.id} onClick={() => onSelectProject(p.id)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] text-sky-300">{p.id}</div>
                  <div className="mt-1 text-sm font-semibold text-white line-clamp-1">{p.workName}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{p.district}, {p.state} · {p.status}</div>
                </div>
                <ChevronRight size={18} className="flex-shrink-0 text-slate-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  const toneClass = tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-300" : tone === "violet" ? "text-violet-300" : "text-sky-300";
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${toneClass}`}>{value}</div>
    </div>
  );
}

function AccessDenied({ onBack, label, hint, backLabel }: { onBack: () => void; label: string; hint: string; backLabel: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-400" />
        <h2 className="mt-3 text-base font-bold text-white">{label}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p>
        <button onClick={onBack} className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">{backLabel}</button>
      </div>
    </div>
  );
}

function PublicProjectView({ detail, onBack, onVerify }: { detail: any; onBack: () => void; onVerify: () => void }) {
  if (!detail?.project) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="text-center text-xs text-slate-400">This project is not available for public viewing.</div>
      </div>
    );
  }
  const p = detail.project;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"><ChevronRight size={14} className="rotate-180" />Back to search</button>
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-sky-300">{p.id}</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">{p.status}</span>
        </div>
        <h2 className="mt-2 text-xl font-extrabold text-white">{p.workName}</h2>
        <p className="mt-1 text-xs text-slate-400">{p.district}, {p.state}{p.constituency ? ` · ${p.constituency}` : ""} · {p.sector}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="text-[10px] text-slate-400">Sanctioned</div><div className="mt-1 text-sm font-bold text-white">{formatInrCurrency(p.sanctionedAmount)}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="text-[10px] text-slate-400">Reported progress</div><div className="mt-1 text-sm font-bold text-white">{p.physicalProgress ?? "—"}%</div></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="text-[10px] text-slate-400">Location</div><div className="mt-1 text-sm font-bold text-emerald-300">{p.latitude && p.longitude ? "Available" : "Unavailable"}</div></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="text-[10px] text-slate-400">Public signals</div><div className="mt-1 text-sm font-bold text-violet-300">{detail.publicVerification?.count ?? 0}</div></div>
        </div>
        {detail.publicEvidence?.length ? (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-slate-300">Public evidence</h3>
            <div className="mt-2 space-y-2">
              {detail.publicEvidence.map((e: any) => (
                <div key={e.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3"><div className="text-xs font-semibold text-white">{e.title}</div><div className="mt-0.5 text-[11px] text-slate-400">{e.summary}</div></div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-[11px] text-amber-200/80">
          <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-amber-300" />{detail.disclaimer || "NIGRANI risk indicators are analytical signals and do not constitute findings of wrongdoing."}
        </div>
        <button onClick={onVerify} className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"><UserRoundCheck size={14} />Verify this project</button>
      </div>
    </div>
  );
}

function AdminUsersView({ role, notify }: { role: UserRole; notify: (msg: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "OFFICIAL", state: "", district: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load users");
      setRows(json.users || []);
    } catch (err: any) {
      setError(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create user");
      notify("User created.");
      setForm({ name: "", email: "", role: "OFFICIAL", state: "", district: "" });
      void load();
    } catch (err: any) {
      notify(err.message || "Could not create user");
    }
  };

  const updateRole = async (id: string, nextRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update role");
      notify("Role updated.");
      void load();
    } catch (err: any) {
      notify(err.message || "Only a Super Admin can reassign roles.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-sky-400" />User management</h2>
        <p className="mt-1 text-xs text-slate-400">
          {role === "SUPER_ADMIN" ? "You can manage all users, reassign roles and deactivate accounts." : "You can manage operational users. Only a Super Admin can reassign roles or remove accounts."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Accounts</h3>
            <button onClick={() => void load()} className="text-[11px] text-sky-400 hover:text-sky-300">Refresh</button>
          </div>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="animate-spin" size={14} />Loading users…</div>
          ) : error ? (
            <div className="mt-4 text-xs text-red-300">{error}</div>
          ) : (
            <div className="mt-3 space-y-2">
              {rows.map((user) => (
                <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400">{user.email}</div>
                      {user.state && <div className="text-[10px] text-slate-500">Scope: {user.state}{user.district ? ` · ${user.district}` : ""}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        disabled={role !== "SUPER_ADMIN"}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className={`rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] ${user.active ? "text-slate-200" : "text-slate-500"}`}
                      >
                        {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                      </select>
                      <span className={`h-2 w-2 rounded-full ${user.active ? "bg-emerald-400" : "bg-slate-600"}`} title={user.active ? "Active" : "Inactive"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={createUser} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Add user</h3>
          <label className="block text-xs text-slate-400">Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500" /></label>
          <label className="block text-xs text-slate-400">Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500" /></label>
          <label className="block text-xs text-slate-400">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500">{role === "SUPER_ADMIN" ? ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>) : ["OFFICIAL", "AUDITOR", "INVESTIGATOR", "CITIZEN"].map((r) => <option key={r} value={r}>{ROLE_META[r as UserRole].label}</option>)}</select></label>
          <label className="block text-xs text-slate-400">State (optional)<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500" /></label>
          <label className="block text-xs text-slate-400">District (optional)<input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-sky-500" /></label>
          <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500">Create user</button>
        </form>
      </div>
    </div>
  );
}
