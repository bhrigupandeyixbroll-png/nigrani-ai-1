import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies,
  assets,
  auditLogs,
  contractors,
  dataSources,
  dataVersions,
  documents,
  evidenceItems,
  expenditures,
  imageEvidence,
  investigationCases,
  locationEvidence,
  modelVersions,
  policyRules,
  projects,
  publicVerifications,
  recommendations,
  riskScores,
  riskSignals,
  sanctions,
  satelliteObservations,
  users,
} from "@/db/schema";

import { INDIAN_STATES, MPLADS_SECTORS, formatInrCurrency } from "./constants";

export { INDIAN_STATES, MPLADS_SECTORS, formatInrCurrency };

const WORK_TEMPLATES = [
  { name: "Construction of Multi-Purpose Community Resource Centre", hi: "बहुउद्देशीय सामुदायिक संसाधन केंद्र निर्माण", sector: "Community Infrastructure", asset3d: "building", baseAmt: 2500000 },
  { name: "Solar High-Mast Lighting System at Village Junctions", hi: "ग्राम चौराहों पर सौर हाई-मास्ट प्रकाश व्यवस्था", sector: "Renewable Energy & Solar", asset3d: "solar_pole", baseAmt: 1200000 },
  { name: "Drinking Water Pipeline Extension with RO Filtration Unit", hi: "आरओ शोधन इकाई सहित पेयजल पाइपलाइन विस्तार", sector: "Drinking Water & Sanitation", asset3d: "water_tank", baseAmt: 1850000 },
  { name: "Smart STEM Laboratory & Library in Govt Higher Secondary School", hi: "राजकीय उच्च माध्यमिक विद्यालय में स्मार्ट स्टेम प्रयोगशाला", sector: "Education & Schools", asset3d: "school", baseAmt: 2200000 },
  { name: "CC Approach Road with Covered Stormwater Drain", hi: "कवर्ड तूफानी जल निकासी सहित सीसी पहुंच मार्ग", sector: "Roads, Pathways & Bridges", asset3d: "road", baseAmt: 3400000 },
  { name: "Primary Health Sub-Centre Diagnostic Wing Modernization", hi: "प्राथमिक स्वास्थ्य उप-केंद्र नैदानिक विंग आधुनिकीकरण", sector: "Health & Family Welfare", asset3d: "health_center", baseAmt: 2800000 },
  { name: "Rejuvenation of Village Amrit Sarovar and Inflow Channels", hi: "अमृत सरोवर एवं जल अंतर्वाह चैनलों का पुनरुद्धार", sector: "Irrigation & Water Conservation", asset3d: "water_tank", baseAmt: 1950000 },
  { name: "Public Rural Sports Arena & Open Gymnasium Facility", hi: "सार्वजनिक ग्रामीण खेल मैदान एवं ओपन जिम सुविधा", sector: "Sports & Youth Infrastructure", asset3d: "building", baseAmt: 1600000 },
];

function formatInrStr(n: number): string {
  return (Math.round(n / 1000) * 1000).toFixed(2);
}

export async function ensureDemoUsers() {
  const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  if ((count?.count ?? 0) > 0) return;

  await db.insert(users).values([
    { name: "NIGRANI System Owner", email: "superadmin@nigrani.gov.in", role: "SUPER_ADMIN", state: null, district: null, active: true },
    { name: "Anjali Deshmukh", email: "admin@nigrani.gov.in", role: "ADMIN", state: null, district: null, active: true },
    { name: "Rahul Iyer", email: "official@nigrani.gov.in", role: "OFFICIAL", state: "Karnataka", district: "Bengaluru Urban", active: true },
    { name: "Meera Krishnan", email: "auditor@nigrani.gov.in", role: "AUDITOR", state: "Karnataka", district: "Bengaluru Urban", active: true },
    { name: "Dev Sharma", email: "investigator@nigrani.gov.in", role: "INVESTIGATOR", state: "Karnataka", district: "Bengaluru Urban", active: true },
    { name: "Public Citizen", email: "citizen@example.in", role: "CITIZEN", state: null, district: null, active: true },
  ]);

  await db.insert(auditLogs).values({
    actor: "system",
    action: "SEED_DEMO_USERS",
    entityType: "users",
    entityId: "seed",
    newValue: { count: 6 },
    reason: "Initial role-based access control demonstration users.",
  });
}

export async function listUsers() {
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    state: users.state,
    district: users.district,
    active: users.active,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function ensureDemoData() {
  await ensureDemoUsers();
  const [existing] = await db.select({ count: sql<number>`count(*)::int` }).from(projects);
  if (existing && existing.count >= 200) {
    await ensureRelatedDemoData();
    return;
  }

  // 1. Seed Data Sources
  await db.insert(dataSources).values([
    { id: "synthetic-mvp", name: "NIGRANI Synthetic Demonstration Dataset", sourceType: "Synthetic demonstration", authority: "demo", reliabilityScore: 75, status: "demo", lastSuccessfulSync: new Date() },
    { id: "mplads-esakshi", name: "MPLADS eSAKSHI Portal (MoSPI)", sourceType: "Authorized Export / Portal", authority: "official", reliabilityScore: 95, status: "snapshot", lastSuccessfulSync: new Date("2026-03-01") },
    { id: "copernicus-sentinel", name: "Copernicus Data Space Ecosystem (Sentinel-2 L2A)", sourceType: "Satellite Provider", authority: "authorized", reliabilityScore: 92, status: "connected", lastSuccessfulSync: new Date() },
    { id: "bhuvan-isro", name: "Bhuvan ISRO Indian Geospatial Platform", sourceType: "Geospatial Adapter", authority: "authorized", reliabilityScore: 90, status: "connected", lastSuccessfulSync: new Date() },
    { id: "pfms-gem", name: "PFMS / GeM Procurement Ledger Adapter", sourceType: "Financial Connector", authority: "authorized", reliabilityScore: 88, status: "snapshot", lastSuccessfulSync: new Date() },
  ]).onConflictDoNothing();

  // 2. Data Version
  await db.insert(dataVersions).values({
    sourceId: "synthetic-mvp",
    versionName: "NIGRANI-DATASET-V2026.1-IND",
    recordCount: 248,
    acceptedCount: 248,
    rejectedCount: 0,
    notes: "Curated Indian public-development benchmark corpus covering 30 districts, 15 States/UTs, across 8 priority MPLADS sectors. Contains explicit synthetic data labels for ethical integrity.",
  });

  // 3. Agencies & Contractors
  const agencyInserts = INDIAN_STATES.map((loc) => ({
    name: `${loc.district} District Rural Development Agency (DRDA)`,
    level: "district",
    state: loc.state,
    district: loc.district,
  }));
  const agencyRows = await db.insert(agencies).values(agencyInserts).returning();

  const contractorNames = [
    "Shree Balaji Infrastructure Pvt Ltd",
    "Apex Civic Engineers & Infra Ltd",
    "Bharat Nirman Nirman Karigar Sangh",
    "Southern GeoConstruct Technologies",
    "Pragati Utkarsh Infrastructure Ltd",
    "Kaveri Civic Works Consortium",
    "Navodaya Green Infra Solutions",
    "Garuda Urban Development Corp",
  ];
  const contractorRows = await db.insert(contractors).values(
    contractorNames.map((name, i) => ({
      name,
      registrationReference: `REG-PWD-2024-${1000 + i}`,
      panMasked: `AAAAA${1000 + i}C`,
    }))
  ).returning();

  // 4. Policy Rules
  await db.insert(policyRules).values([
    { ruleId: "FIN-MISMATCH-01", name: "Disbursement vs Physical Progress Divergence", dimension: "Financial anomaly", severity: "High", threshold: 25, condition: "Financial expenditure > reported physical progress + 25%", active: true, description: "Flags projects where funds are drawn significantly ahead of physical execution." },
    { ruleId: "TIME-OVERDUE-02", name: "Milestone Target Date Exceeded Without Extension", dimension: "Timeline anomaly", severity: "High", threshold: 90, condition: "Current date > expected completion date + 90 days with status != Completed", active: true, description: "Detects overdue public asset commissioning." },
    { ruleId: "DOC-INCOMPLETE-03", name: "Missing Final Stage Inspection & Completion Certificate", dimension: "Document inconsistency", severity: "Medium", threshold: 100, condition: "Status == Completed AND completion certificate absent", active: true, description: "Ensures no asset is closed without certified human desk review." },
    { ruleId: "SAT-DELTA-04", name: "Satellite Surface Change Divergence from Claimed Status", dimension: "Satellite observation", severity: "Medium", threshold: 60, condition: "Reported physical progress > 80% BUT satellite NDVI/NDWI/surface delta < threshold", active: true, description: "Corroborates large-scale physical footprint changes." },
    { ruleId: "GEO-PROXIMITY-05", name: "Duplicate Asset or Overlapping Geographic Footprint", dimension: "Geospatial signal", severity: "High", threshold: 50, condition: "Distance < 50m to existing registered asset in same sector", active: true, description: "Detects potential convergence overlap or double-billing risks." },
  ]).onConflictDoNothing();

  // 5. Model Versions
  await db.insert(modelVersions).values([
    {
      name: "NIGRANI Risk Engine V2.4 (Isolation Forest + Rule Ensemble)",
      version: "NIG-RISK-2.4-IND",
      modelType: "Isolation Forest + Explainable Multi-Stream Fusion",
      datasetPeriod: "FY 2022-2026",
      features: ["expenditure_progress_delta", "timeline_overdue_days", "doc_completeness_ratio", "satellite_change_signal", "citizen_verification_activity", "geo_duplicate_distance"],
      metrics: { f1: 0.91, precision: 0.89, recall: 0.94, auroc: 0.96 },
      validationDate: "2026-02-15",
      owner: "NIGRANI Intelligence Research Division",
      active: true,
    },
    {
      name: "NIGRANI Satellite Observation Service (Sentinel-2 L2A)",
      version: "NIG-SAT-1.8-COPERNICUS",
      modelType: "Multi-Spectral Temporal Index Analyzer (NDVI / NDWI / BSI)",
      datasetPeriod: "Sentinel-2 Multi-Spectral Instrument (10m-20m)",
      features: ["B02_blue", "B03_green", "B04_red", "B08_nir", "cloud_probability", "scene_classification"],
      metrics: { resolution_meters: 10, repeat_cycle_days: 5 },
      validationDate: "2026-03-01",
      owner: "Geospatial Observation Unit",
      active: true,
    },
  ]).onConflictDoNothing();

  const now = new Date();

  // 6. Generate 240+ Realistic Indian Projects
  const totalProjects = 248;
  const projectList = [];
  const riskList = [];
  const signalList = [];
  const evidenceList = [];
  const docList = [];
  const satelliteList = [];
  const caseList = [];
  const assetList = [];
  const verificationList = [];

  for (let i = 0; i < totalProjects; i++) {
    const loc = INDIAN_STATES[i % INDIAN_STATES.length];
    const tpl = WORK_TEMPLATES[i % WORK_TEMPLATES.length];
    const agency = agencyRows[i % agencyRows.length];
    const contractor = contractorRows[i % contractorRows.length];

    const isFlaggedDemo = i === 0;
    const isSpecialHighRisk = i > 0 && i % 8 === 0;
    const isMediumReview = i > 0 && i % 4 === 0 && !isSpecialHighRisk;
    const isCompletedClean = i > 0 && i % 3 === 0 && !isSpecialHighRisk && !isMediumReview;

    const projectId = isFlaggedDemo ? "NIG-DEMO-001" : `NIG-IN-${loc.state.slice(0, 2).toUpperCase()}-${String(100 + i).padStart(4, "0")}`;
    const workName = isFlaggedDemo
      ? "Community Health Sub-Centre Diagnostic Modernization & Solar Power Unit"
      : `${tpl.name} — ${loc.district}`;
    const workNameHi = isFlaggedDemo
      ? "सामुदायिक स्वास्थ्य उप-केंद्र नैदानिक आधुनिकीकरण एवं सौर ऊर्जा इकाई"
      : `${tpl.hi} — ${loc.district}`;

    const baseAmount = tpl.baseAmt + ((i * 180000) % 2500000);
    const recommendedAmt = baseAmount * 1.05;
    const sanctionedAmt = baseAmount;
    
    // Status & Progress logic
    let status = "In Progress";
    let physicalProgress = 45 + ((i * 7) % 50);
    let financialProgress = physicalProgress;
    let expenditureAmt = (sanctionedAmt * financialProgress) / 100;
    let verificationStatus = "Validated";
    let scoreVal = 18 + ((i * 5) % 24);
    let confidenceVal = 82 + ((i * 3) % 15);
    let matrixQuad = "ROUTINE MONITORING";

    if (isFlaggedDemo) {
      status = "Reported Completed";
      physicalProgress = 62;
      financialProgress = 92;
      expenditureAmt = 2392000;
      verificationStatus = "Needs Review";
      scoreVal = 78;
      confidenceVal = 86;
      matrixQuad = "PRIORITY VERIFICATION";
    } else if (isSpecialHighRisk) {
      status = i % 16 === 0 ? "Non-Progress" : "Delayed";
      physicalProgress = 20 + (i % 25);
      financialProgress = physicalProgress + 35;
      expenditureAmt = (sanctionedAmt * Math.min(100, financialProgress)) / 100;
      verificationStatus = "Needs Review";
      scoreVal = 72 + (i % 22);
      confidenceVal = 75 + (i % 20);
      matrixQuad = "PRIORITY VERIFICATION";
    } else if (isMediumReview) {
      status = "In Progress";
      physicalProgress = 40 + (i % 30);
      financialProgress = physicalProgress + 15;
      expenditureAmt = (sanctionedAmt * financialProgress) / 100;
      verificationStatus = "Needs Review";
      scoreVal = 48 + (i % 18);
      confidenceVal = 68 + (i % 20);
      matrixQuad = "REQUEST EVIDENCE";
    } else if (isCompletedClean) {
      status = "Completed";
      physicalProgress = 100;
      financialProgress = 98;
      expenditureAmt = sanctionedAmt * 0.98;
      verificationStatus = "Validated";
      scoreVal = 12 + (i % 15);
      confidenceVal = 92 + (i % 7);
      matrixQuad = "ROUTINE MONITORING";
    }

    const releasedAmt = sanctionedAmt * Math.min(1, (financialProgress + 10) / 100);
    const dataQuality = 75 + ((i * 9) % 23);
    const completeness = 80 + ((i * 7) % 19);
    const consistency = isSpecialHighRisk || isFlaggedDemo ? 54 : 88;
    const freshness = 85 + ((i * 3) % 14);

    // Minor spatial jitter around genuine Indian district coords
    const latJitter = (loc.lat + ((i % 17) - 8) * 0.0085).toFixed(7);
    const lngJitter = (loc.lng + ((i % 13) - 6) * 0.0085).toFixed(7);

    projectList.push({
      id: projectId,
      workName,
      workNameHi,
      state: loc.state,
      district: loc.district,
      constituency: `${loc.constituency} Lok Sabha`,
      memberReference: `Hon'ble MP ${loc.mp}`,
      mpHouse: "Lok Sabha",
      sector: tpl.sector,
      financialYear: i % 2 === 0 ? "2024-2025" : "2025-2026",
      recommendationDate: "2024-04-12",
      sanctionDate: "2024-05-28",
      startDate: "2024-07-15",
      expectedCompletionDate: isCompletedClean ? "2025-04-30" : "2025-08-31",
      actualCompletionDate: isCompletedClean ? "2025-04-20" : null,
      recommendedAmount: formatInrStr(recommendedAmt),
      sanctionedAmount: formatInrStr(sanctionedAmt),
      releasedAmount: formatInrStr(releasedAmt),
      expenditureAmount: formatInrStr(expenditureAmt),
      physicalProgress,
      financialProgress: Math.min(100, Math.round(financialProgress)),
      status,
      implementingAgencyId: agency.id,
      contractorId: contractor.id,
      latitude: latJitter,
      longitude: lngJitter,
      locationConfidence: 90 + (i % 10),
      sourceId: "synthetic-mvp",
      sourceRecordId: `MPLADS-WR-2025-${String(3000 + i)}`,
      sourceUrl: "https://mplads.gov.in/eSAKSHI/WorkRegister",
      sourceDocument: `Sanction Order No. DRDA/${loc.district.slice(0, 3).toUpperCase()}/2024/${200 + i}`,
      sourceTimestamp: now,
      dataQualityScore: dataQuality,
      completenessScore: completeness,
      consistencyScore: consistency,
      freshnessScore: freshness,
      verificationStatus,
      recordKind: isFlaggedDemo ? "synthetic" : "synthetic",
      rawRecord: {
        sourcePortal: "MPLADS eSAKSHI",
        sanctionOrder: `SO-${loc.district.slice(0, 3).toUpperCase()}-${3000 + i}`,
        state: loc.state,
        district: loc.district,
        mpName: loc.mp,
        currency: "INR",
        notes: "Official record schema simulation with full provenance preservation.",
      },
      normalizedRecord: {
        schemaVersion: "NIGRANI.MPLADS.v2",
        normalizedAt: now.toISOString(),
        validationLevel: "PASSED_STRICT_SCHEMA",
      },
      derivedRecord: {
        costVariancePct: (((expenditureAmt - sanctionedAmt) / sanctionedAmt) * 100).toFixed(1),
        progressDelta: financialProgress - physicalProgress,
        riskScore: scoreVal,
      },
    });

    // Risk Scores
    riskList.push({
      projectId,
      score: scoreVal,
      evidenceConfidence: confidenceVal,
      completenessScore: completeness,
      matrixQuadrant: matrixQuad,
      classification:
        scoreVal >= 70
          ? "Potential Inconsistency Requiring Verification"
          : scoreVal >= 45
          ? "Analytical Anomaly — Desk Review Recommended"
          : "Routine Evidence Monitoring",
      recommendation:
        scoreVal >= 70
          ? "Request latest physical progress evidence, cross-correlate Sentinel-2 imagery, and dispatch authorized district field verification."
          : scoreVal >= 45
          ? "Issue requisition for missing milestone certificate and conduct desk consistency review."
          : "No immediate intervention required. Continue routine evidence ingestion.",
      modelVersion: "NIG-RISK-2.4-IND",
      calculatedAt: now,
    });

    // Risk Signals
    if (scoreVal >= 70 || isFlaggedDemo) {
      signalList.push(
        {
          projectId,
          dimension: "Financial anomaly",
          contribution: 24,
          explanation: `Expenditure recorded (₹${(expenditureAmt / 100000).toFixed(2)}L, ${Math.min(100, Math.round(financialProgress))}%) is significantly ahead of physical progress (${physicalProgress}%).`,
          modelVersion: "NIG-RISK-2.4-IND",
          ruleReference: "FIN-MISMATCH-01",
          confidence: 90,
        },
        {
          projectId,
          dimension: "Timeline anomaly",
          contribution: 18,
          explanation: "Target milestone date was 31 Aug 2025; no formal extension recorded in work register.",
          modelVersion: "NIG-RISK-2.4-IND",
          ruleReference: "TIME-OVERDUE-02",
          confidence: 94,
        },
        {
          projectId,
          dimension: "Document inconsistency",
          contribution: 15,
          explanation: "Stage-3 engineering completion sign-off and geo-tagged inspection certificate not yet attached.",
          modelVersion: "NIG-RISK-2.4-IND",
          ruleReference: "DOC-INCOMPLETE-03",
          confidence: 82,
        },
        {
          projectId,
          dimension: "Satellite observation",
          contribution: 12,
          explanation: "Sentinel-2 MSI multi-spectral temporal change index reveals low structural reflectance delta.",
          modelVersion: "NIG-SAT-1.8-COPERNICUS",
          ruleReference: "SAT-DELTA-04",
          confidence: 76,
        },
        {
          projectId,
          dimension: "Citizen verification signal",
          contribution: 9,
          explanation: "Public verification signals received from local citizens indicate work is partially incomplete.",
          modelVersion: "NIG-RISK-2.4-IND",
          ruleReference: "CIT-SIGNAL-01",
          confidence: 85,
        }
      );
    }

    // Evidence Items
    evidenceList.push(
      {
        projectId,
        type: "Financial",
        title: "Sanction & Expenditure Ledger (PFMS / eSAKSHI)",
        summary: `Sanctioned: ₹${(sanctionedAmt / 100000).toFixed(2)}L · Released: ₹${(releasedAmt / 100000).toFixed(2)}L · Recorded: ₹${(expenditureAmt / 100000).toFixed(2)}L`,
        state: isSpecialHighRisk || isFlaggedDemo ? "Conflict" : "Confirmed",
        confidence: 94,
        sourceId: "mplads-esakshi",
        dataDate: now,
      },
      {
        projectId,
        type: "Document",
        title: "Official Sanction Order & Technical Estimate",
        summary: `Order Ref: DRDA/${loc.district.slice(0, 3).toUpperCase()}/2024/${200 + i}. Technical estimate approved by Executive Engineer.`,
        state: "Confirmed",
        confidence: 92,
        sourceId: "mplads-esakshi",
        dataDate: new Date("2024-05-28"),
      },
      {
        projectId,
        type: "Timeline",
        title: "Project Milestone Progression Schedule",
        summary: isCompletedClean ? "Completed within sanctioned timeline." : `Expected: 31 Aug 2025 · Status: ${status}`,
        state: isSpecialHighRisk || isFlaggedDemo ? "Needs review" : "Confirmed",
        confidence: 89,
        sourceId: "synthetic-mvp",
        dataDate: now,
      },
      {
        projectId,
        type: "Location",
        title: "Bhuvan ISRO Geo-Spatial Coordinate Fix",
        summary: `Lat: ${latJitter}, Lng: ${lngJitter} (Accuracy ±4.2m). Within ${loc.district} administrative boundary.`,
        state: "Confirmed",
        confidence: 98,
        sourceId: "bhuvan-isro",
        dataDate: now,
      },
      {
        projectId,
        type: "Satellite",
        title: "Copernicus Sentinel-2 L2A Multi-Spectral Observation",
        summary: "Temporal change analysis across 10m bands (B02, B03, B04, B08). Corroborating physical footprint change.",
        state: isSpecialHighRisk || isFlaggedDemo ? "Needs review" : "Confirmed",
        confidence: 82,
        sourceId: "copernicus-sentinel",
        dataDate: new Date("2026-02-24"),
      },
      {
        projectId,
        type: "Image",
        title: "Site Progress Photographs & Geo-Tagged Evidence",
        summary: isCompletedClean ? "Final completion photographs verified by Assistant Engineer." : "Mid-stage construction photographs captured with GPS stamp.",
        state: "Confirmed",
        confidence: 88,
        sourceId: "synthetic-mvp",
        dataDate: new Date("2025-11-10"),
      }
    );

    // Satellite Observations
    satelliteList.push({
      projectId,
      provider: "Copernicus Sentinel-2 L2A",
      sceneId: `S2B_MSIL2A_20260224T051019_N0500_R019_${loc.district.slice(0, 3).toUpperCase()}`,
      acquiredAt: new Date("2026-02-24T05:10:19Z"),
      cloudCover: "4.80",
      resolutionMeters: 10,
      bands: "B02,B03,B04,B08 (10m True Color & NIR)",
      ndviValue: (0.34 + ((i % 10) * 0.03)).toFixed(3),
      ndwiValue: (-0.12 + ((i % 8) * 0.02)).toFixed(3),
      quality: "good",
      corroborationStatus:
        scoreVal >= 70
          ? "Partial surface delta; field check recommended"
          : "Corroborating physical change within AOI",
      beforeDate: "2024-04-10",
      afterDate: "2026-02-24",
      metadata: {
        satellite: "Sentinel-2B",
        processingLevel: "Level-2A (Bottom of Atmosphere)",
        aoiRadiusMeters: 250,
        providerNote: "Official Copernicus Data Space Ecosystem API schema integration.",
      },
    });

    // Documents
    docList.push(
      {
        projectId,
        name: `Administrative_Sanction_Order_${loc.district}_${projectId}.pdf`,
        type: "PDF",
        sourcePage: 1,
        integrityStatus: "verified",
        sourceId: "mplads-esakshi",
      },
      {
        projectId,
        name: `Detailed_Project_Report_Technical_Estimate_${projectId}.pdf`,
        type: "PDF",
        sourcePage: 4,
        integrityStatus: "verified",
        sourceId: "mplads-esakshi",
      }
    );

    // Asset Passport
    assetList.push({
      id: `AST-IND-${loc.state.slice(0, 2).toUpperCase()}-${String(4000 + i)}`,
      projectId,
      assetType: tpl.sector,
      model3dType: tpl.asset3d,
      condition: isCompletedClean ? "Excellent" : isSpecialHighRisk ? "Needs Verification" : "Good",
      lifecycleState: isCompletedClean ? "Completed" : "Execution",
      lastInspectedAt: isCompletedClean ? new Date("2025-05-10") : null,
      estimatedLifespanYears: 20,
      maintenanceBudgetInr: formatInrStr(sanctionedAmt * 0.04),
    });

    // Cases
    if (scoreVal >= 70 || isFlaggedDemo) {
      caseList.push({
        id: `CASE-IND-2026-${String(500 + i)}`,
        projectId,
        state: isFlaggedDemo ? "Desk review" : i % 16 === 0 ? "Field verification" : "Assigned",
        priority: scoreVal >= 75 ? "Critical" : "High",
        assignedTo: `District Monitoring Cell — ${loc.district}`,
        assignedOfficerRole: "District Quality Monitor (DQM)",
        reason: "Multi-stream evidence divergence: disbursement rate outpaces reported physical milestone.",
        notes: isFlaggedDemo
          ? "Demonstration case initiated for authorized desk review. Satellite comparison and citizen signals are linked to the case file."
          : "Case registered under standard NIGRANI risk protocol. Awaiting field inspection report.",
        finding: null,
        resolution: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Public Citizen Verifications
    if (i < 25) {
      verificationList.push({
        trackingId: `VRF-IN-2026-${String(8900 + i)}`,
        projectId,
        category: i % 2 === 0 ? "Work appears incomplete" : "Information appears outdated",
        comment: `Citizen field observation from ${loc.district}: Physical structure is partially complete but machinery is not active.`,
        latitude: latJitter,
        longitude: lngJitter,
        locationAccuracy: 6,
        citizenHash: `anon_${Math.random().toString(36).substring(2, 10)}`,
        state: i % 3 === 0 ? "Under Review" : "Received",
        officialResponse: i % 3 === 0 ? "Assigned to Junior Engineer for field inspection." : null,
        createdAt: new Date(Date.now() - (i * 86400000)),
        updatedAt: now,
      });
    }
  }

  // Insert batches
  console.log("Seeding NIGRANI dataset with 248 validated Indian public development works...");
  await db.insert(projects).values(projectList);
  await db.insert(riskScores).values(riskList);
  await db.insert(riskSignals).values(signalList);
  await db.insert(evidenceItems).values(evidenceList);
  await db.insert(satelliteObservations).values(satelliteList);
  await db.insert(documents).values(docList);
  await db.insert(assets).values(assetList);
  await db.insert(investigationCases).values(caseList);
  await db.insert(publicVerifications).values(verificationList);

  await db.insert(auditLogs).values({
    actor: "NIGRANI Ingestion Engine",
    action: "INITIAL_DATASET_LOAD",
    entityType: "data_version",
    entityId: "NIGRANI-DATASET-V2026.1-IND",
    newValue: { recordCount: totalProjects, statesCovered: 15, sectors: 8, label: "Synthetic demonstration dataset" },
    reason: "Bootstrap of nationwide 248-record MPLADS public development intelligence database.",
  });
}

async function ensureRelatedDemoData() {
  const [caseCount] = await db.select({ count: sql<number>`count(*)::int` }).from(investigationCases);
  const [satCount] = await db.select({ count: sql<number>`count(*)::int` }).from(satelliteObservations);
  const [assetCount] = await db.select({ count: sql<number>`count(*)::int` }).from(assets);
  const [verifCount] = await db.select({ count: sql<number>`count(*)::int` }).from(publicVerifications);
  const [auditCount] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
  if ((caseCount?.count ?? 0) > 0 && (satCount?.count ?? 0) > 0 && (assetCount?.count ?? 0) > 0 && (verifCount?.count ?? 0) > 0 && (auditCount?.count ?? 0) > 0) return;

  const projectRows = await db
    .select({
      id: projects.id,
      workName: projects.workName,
      state: projects.state,
      district: projects.district,
      sector: projects.sector,
      latitude: projects.latitude,
      longitude: projects.longitude,
      physicalProgress: projects.physicalProgress,
      financialProgress: projects.financialProgress,
      sanctionedAmount: projects.sanctionedAmount,
      expenditureAmount: projects.expenditureAmount,
      status: projects.status,
      score: riskScores.score,
      evidenceConfidence: riskScores.evidenceConfidence,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
    .orderBy(projects.id);

  if (!projectRows.length) return;
  const now = new Date();
  const caseList: Array<Record<string, unknown>> = [];
  const satList: Array<Record<string, unknown>> = [];
  const assetList: Array<Record<string, unknown>> = [];
  const verificationList: Array<Record<string, unknown>> = [];

  for (let i = 0; i < projectRows.length; i++) {
    const p = projectRows[i];
    const score = p.score ?? 0;
    if ((caseCount?.count ?? 0) === 0 && (score >= 70 || p.id === "NIG-DEMO-001")) {
      caseList.push({
        id: `CASE-IND-2026-${String(500 + i)}`,
        projectId: p.id,
        state: p.id === "NIG-DEMO-001" ? "Desk review" : i % 16 === 0 ? "Field verification" : "Assigned",
        priority: score >= 75 ? "Critical" : "High",
        assignedTo: `District Monitoring Cell — ${p.district}`,
        assignedOfficerRole: "District Quality Monitor (DQM)",
        reason: "Multi-stream evidence divergence: disbursement rate outpaces reported physical milestone.",
        notes: p.id === "NIG-DEMO-001"
          ? "Demonstration case initiated for authorized desk review. Satellite comparison and citizen signals are linked to the case file."
          : "Case registered under standard NIGRANI risk protocol. Awaiting field inspection report.",
        finding: null,
        resolution: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    if ((satCount?.count ?? 0) === 0) {
      satList.push({
        projectId: p.id,
        provider: "Copernicus Sentinel-2 L2A",
        sceneId: `S2B_MSIL2A_20260224_${(p.district || "IND").slice(0, 3).toUpperCase()}_019`,
        acquiredAt: new Date("2026-02-24T05:10:19Z"),
        cloudCover: "4.80",
        resolutionMeters: 10,
        bands: "B02,B03,B04,B08",
        ndviValue: (0.34 + ((i % 10) * 0.03)).toFixed(3),
        ndwiValue: (-0.12 + ((i % 8) * 0.02)).toFixed(3),
        quality: "good",
        corroborationStatus: score >= 70
          ? "Partial surface delta; field check recommended"
          : "Corroborating physical change within AOI",
        beforeDate: "2024-04-10",
        afterDate: "2026-02-24",
        metadata: {
          satellite: "Sentinel-2B",
          processingLevel: "Level-2A (Bottom of Atmosphere)",
          aoiRadiusMeters: 250,
          providerNote: "Metadata snapshot. Live Process API requires configured Copernicus credentials.",
        },
      });
    }

    if ((assetCount?.count ?? 0) === 0) {
      const sector = (p.sector || "").toLowerCase();
      const model3dType = sector.includes("road")
        ? "road"
        : sector.includes("water") || sector.includes("irrigation")
          ? "water_tank"
          : sector.includes("solar") || sector.includes("energy")
            ? "solar_pole"
            : sector.includes("health")
              ? "health_center"
              : sector.includes("education") || sector.includes("school")
                ? "school"
                : "building";
      assetList.push({
        id: `AST-IND-${(p.state || "IN").slice(0, 2).toUpperCase()}-${String(4000 + i)}`,
        projectId: p.id,
        assetType: p.sector || "Community Infrastructure",
        model3dType,
        condition: p.status === "Completed" ? "Excellent" : score >= 70 ? "Needs Verification" : "Good",
        lifecycleState: p.status === "Completed" ? "Completed" : "Execution",
        lastInspectedAt: p.status === "Completed" ? new Date("2025-05-10") : null,
        estimatedLifespanYears: 20,
        maintenanceBudgetInr: p.sanctionedAmount ? String(Number(p.sanctionedAmount) * 0.04) : null,
      });
    }

    if ((verifCount?.count ?? 0) === 0 && i < 25) {
      verificationList.push({
        trackingId: `VRF-IN-2026-${String(8900 + i)}`,
        projectId: p.id,
        category: i % 2 === 0 ? "Work appears incomplete" : "Information appears outdated",
        comment: `Citizen field observation from ${p.district}: Physical structure is partially complete but machinery is not active.`,
        latitude: p.latitude,
        longitude: p.longitude,
        locationAccuracy: 6,
        citizenHash: `anon_${Math.random().toString(36).substring(2, 10)}`,
        state: i % 3 === 0 ? "Under Review" : "Received",
        officialResponse: i % 3 === 0 ? "Assigned to Junior Engineer for field inspection." : null,
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: now,
      });
    }
  }

  const safeInsert = async (label: string, run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (error) {
      console.error(`NIGRANI related seed skipped for ${label}:`, error);
    }
  };

  if (caseList.length) await safeInsert("cases", () => db.insert(investigationCases).values(caseList as any));
  if (satList.length) await safeInsert("satellite", () => db.insert(satelliteObservations).values(satList as any));
  if (assetList.length) await safeInsert("assets", () => db.insert(assets).values(assetList as any));
  if (verificationList.length) await safeInsert("verifications", () => db.insert(publicVerifications).values(verificationList as any));
  if ((auditCount?.count ?? 0) === 0) {
    await safeInsert("audit", () => db.insert(auditLogs).values({
      actor: "NIGRANI Ingestion Engine",
      action: "RELATED_DATASET_BACKFILL",
      entityType: "data_version",
      entityId: "NIGRANI-DATASET-V2026.1-IND",
      newValue: {
        cases: caseList.length,
        satellite: satList.length,
        assets: assetList.length,
        verifications: verificationList.length,
        label: "Synthetic demonstration dataset",
      },
      reason: "Backfilled related evidence and workflow entities for an incomplete seed state.",
    }));
  }
}

export type ProjectFilterParams = {
  query?: string;
  state?: string;
  district?: string;
  sector?: string;
  status?: string;
  riskBand?: string;
  quadrant?: string;
};

export async function listProjectsFiltered(params: ProjectFilterParams = {}) {
  await ensureDemoData();
  const clauses = [];

  if (params.query) {
    const q = `%${params.query.trim()}%`;
    clauses.push(
      or(
        ilike(projects.id, q),
        ilike(projects.workName, q),
        ilike(projects.district, q),
        ilike(projects.state, q),
        ilike(projects.constituency, q),
        ilike(projects.sector, q)
      )!
    );
  }
  if (params.state && params.state !== "All States") {
    clauses.push(eq(projects.state, params.state));
  }
  if (params.district && params.district !== "All Districts") {
    clauses.push(eq(projects.district, params.district));
  }
  if (params.sector && params.sector !== "All Sectors") {
    clauses.push(eq(projects.sector, params.sector));
  }
  if (params.status && params.status !== "All Statuses") {
    clauses.push(eq(projects.status, params.status));
  }
  if (params.riskBand) {
    if (params.riskBand === "High") clauses.push(sql`${riskScores.score} >= 70`);
    else if (params.riskBand === "Medium") clauses.push(sql`${riskScores.score} >= 45 and ${riskScores.score} < 70`);
    else if (params.riskBand === "Low") clauses.push(sql`${riskScores.score} < 45`);
  }
  if (params.quadrant && params.quadrant !== "All") {
    clauses.push(eq(riskScores.matrixQuadrant, params.quadrant));
  }

  return db
    .select({
      id: projects.id,
      workName: projects.workName,
      workNameHi: projects.workNameHi,
      state: projects.state,
      district: projects.district,
      constituency: projects.constituency,
      memberReference: projects.memberReference,
      sector: projects.sector,
      financialYear: projects.financialYear,
      sanctionedAmount: projects.sanctionedAmount,
      releasedAmount: projects.releasedAmount,
      expenditureAmount: projects.expenditureAmount,
      physicalProgress: projects.physicalProgress,
      financialProgress: projects.financialProgress,
      status: projects.status,
      dataQualityScore: projects.dataQualityScore,
      completenessScore: projects.completenessScore,
      consistencyScore: projects.consistencyScore,
      freshnessScore: projects.freshnessScore,
      verificationStatus: projects.verificationStatus,
      recordKind: projects.recordKind,
      riskScore: riskScores.score,
      evidenceConfidence: riskScores.evidenceConfidence,
      matrixQuadrant: riskScores.matrixQuadrant,
      sourceId: projects.sourceId,
      sourceRecordId: projects.sourceRecordId,
      sourceTimestamp: projects.sourceTimestamp,
      latitude: projects.latitude,
      longitude: projects.longitude,
      locationConfidence: projects.locationConfidence,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(desc(riskScores.score))
    .limit(300);
}

export async function getNationalDashboardData() {
  await ensureDemoData();

  const [totals] = await db.select({
    totalProjects: sql<number>`count(*)::int`,
    activeWorks: sql<number>`count(*) filter (where ${projects.status} in ('In Progress', 'Delayed', 'Reported Completed'))::int`,
    completedWorks: sql<number>`count(*) filter (where ${projects.status} = 'Completed')::int`,
    nonProgressWorks: sql<number>`count(*) filter (where ${projects.status} = 'Non-Progress')::int`,
    delayedWorks: sql<number>`count(*) filter (where ${projects.status} = 'Delayed')::int`,
    totalSanctioned: sql<string>`coalesce(sum(${projects.sanctionedAmount}), 0)`,
    totalReleased: sql<string>`coalesce(sum(${projects.releasedAmount}), 0)`,
    totalExpenditure: sql<string>`coalesce(sum(${projects.expenditureAmount}), 0)`,
    avgDataQuality: sql<number>`round(avg(${projects.dataQualityScore}))::int`,
    avgCompleteness: sql<number>`round(avg(${projects.completenessScore}))::int`,
  }).from(projects);

  const [highRiskCount] = await db.select({ count: sql<number>`count(*)::int` }).from(riskScores).where(sql`${riskScores.score} >= 70`);
  const [reviewCount] = await db.select({ count: sql<number>`count(*)::int` }).from(projects).where(eq(projects.verificationStatus, "Needs Review"));
  const [totalCitizenSignals] = await db.select({ count: sql<number>`count(*)::int` }).from(publicVerifications);
  const [openCasesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(investigationCases);

  const stateBreakdown = await db
    .select({
      state: projects.state,
      count: sql<number>`count(*)::int`,
      sanctionedSum: sql<string>`coalesce(sum(${projects.sanctionedAmount}), 0)`,
      spentSum: sql<string>`coalesce(sum(${projects.expenditureAmount}), 0)`,
      avgRisk: sql<number>`round(avg(${riskScores.score}))::int`,
      highRiskCount: sql<number>`count(*) filter (where ${riskScores.score} >= 70)::int`,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
    .groupBy(projects.state)
    .orderBy(desc(sql`count(*)`));

  const sectorBreakdown = await db
    .select({
      sector: projects.sector,
      count: sql<number>`count(*)::int`,
      sanctionedSum: sql<string>`coalesce(sum(${projects.sanctionedAmount}), 0)`,
      spentSum: sql<string>`coalesce(sum(${projects.expenditureAmount}), 0)`,
      avgRisk: sql<number>`round(avg(${riskScores.score}))::int`,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
    .groupBy(projects.sector)
    .orderBy(desc(sql`count(*)`));

  const statusRows = await db
    .select({ status: projects.status, count: sql<number>`count(*)::int` })
    .from(projects)
    .groupBy(projects.status);

  const quadrantCounts = await db
    .select({
      quadrant: riskScores.matrixQuadrant,
      count: sql<number>`count(*)::int`,
    })
    .from(riskScores)
    .groupBy(riskScores.matrixQuadrant);

  const recentPrioritized = await db
    .select({
      id: projects.id,
      workName: projects.workName,
      workNameHi: projects.workNameHi,
      state: projects.state,
      district: projects.district,
      constituency: projects.constituency,
      memberReference: projects.memberReference,
      sector: projects.sector,
      financialYear: projects.financialYear,
      sanctionedAmount: projects.sanctionedAmount,
      releasedAmount: projects.releasedAmount,
      expenditureAmount: projects.expenditureAmount,
      physicalProgress: projects.physicalProgress,
      financialProgress: projects.financialProgress,
      status: projects.status,
      dataQualityScore: projects.dataQualityScore,
      completenessScore: projects.completenessScore,
      consistencyScore: projects.consistencyScore,
      freshnessScore: projects.freshnessScore,
      verificationStatus: projects.verificationStatus,
      recordKind: projects.recordKind,
      riskScore: riskScores.score,
      evidenceConfidence: riskScores.evidenceConfidence,
      matrixQuadrant: riskScores.matrixQuadrant,
      sourceId: projects.sourceId,
      sourceRecordId: projects.sourceRecordId,
      sourceTimestamp: projects.sourceTimestamp,
      latitude: projects.latitude,
      longitude: projects.longitude,
      locationConfidence: projects.locationConfidence,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
    .orderBy(desc(riskScores.score))
    .limit(8);

  return {
    totals: {
      ...totals,
      highRiskCount: highRiskCount.count,
      verificationPendingCount: reviewCount.count,
      totalCitizenSignals: totalCitizenSignals.count,
      openCasesCount: openCasesCount.count,
    },
    stateBreakdown,
    sectorBreakdown,
    statusRows,
    quadrantCounts,
    recentPrioritized,
  };
}

export async function getProjectFullDetail(id: string) {
  await ensureDemoData();

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return null;

  const [score] = await db.select().from(riskScores).where(eq(riskScores.projectId, id)).orderBy(desc(riskScores.calculatedAt)).limit(1);
  const signals = await db.select().from(riskSignals).where(eq(riskSignals.projectId, id)).orderBy(desc(riskSignals.contribution));
  const evidence = await db.select().from(evidenceItems).where(eq(evidenceItems.projectId, id));
  const docs = await db.select().from(documents).where(eq(documents.projectId, id));
  const observations = await db.select().from(satelliteObservations).where(eq(satelliteObservations.projectId, id));
  const cases = await db.select().from(investigationCases).where(eq(investigationCases.projectId, id));
  const verifications = await db.select().from(publicVerifications).where(eq(publicVerifications.projectId, id)).orderBy(desc(publicVerifications.createdAt));
  const [asset] = await db.select().from(assets).where(eq(assets.projectId, id));
  const [agency] = project.implementingAgencyId ? await db.select().from(agencies).where(eq(agencies.id, project.implementingAgencyId)) : [null];
  const [contractor] = project.contractorId ? await db.select().from(contractors).where(eq(contractors.id, project.contractorId)) : [null];

  return {
    project,
    score,
    signals,
    evidence,
    docs,
    observations,
    cases,
    verifications,
    asset,
    agency,
    contractor,
  };
}



export function validateProjectPayload(value: unknown) {
  if (!value || typeof value !== "object") return { ok: false as const, error: "Invalid project payload format." };
  const input = value as Record<string, unknown>;
  const required = ["id", "workName", "state", "district", "sector"];
  for (const field of required) {
    if (typeof input[field] !== "string" || !String(input[field]).trim()) {
      return { ok: false as const, error: `Field '${field}' is required and must be non-empty.` };
    }
  }
  return { ok: true as const, data: input };
}

// Aliases for compatibility
export const getDashboardData = getNationalDashboardData;
export const listProjects = (q?: string, s?: string) => listProjectsFiltered({ query: q, status: s });
export const getProjectDetail = getProjectFullDetail;
export const validateProjectInput = validateProjectPayload;
