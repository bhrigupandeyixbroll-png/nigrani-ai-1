import { boolean, date, integer, jsonb, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const dataSources = pgTable("data_sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  sourceType: varchar("source_type", { length: 48 }).notNull(),
  url: text("url"),
  authority: varchar("authority", { length: 32 }).notNull().default("demo"),
  reliabilityScore: integer("reliability_score").notNull().default(50),
  lastSuccessfulSync: timestamp("last_successful_sync", { withTimezone: true }),
  status: varchar("status", { length: 32 }).notNull().default("unavailable"),
  createdAt,
});

export const dataVersions = pgTable("data_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  versionName: varchar("version_name", { length: 96 }).notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
  recordCount: integer("record_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  rejectedCount: integer("rejected_count").notNull().default(0),
  notes: text("notes"),
  createdAt,
});

export const agencies = pgTable("agencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  level: varchar("level", { length: 32 }).notNull().default("district"),
  state: varchar("state", { length: 96 }),
  district: varchar("district", { length: 96 }),
  createdAt,
});

export const contractors = pgTable("contractors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  registrationReference: varchar("registration_reference", { length: 96 }),
  panMasked: varchar("pan_masked", { length: 32 }),
  createdAt,
});

export const projects = pgTable("projects", {
  id: varchar("id", { length: 64 }).primaryKey(),
  workName: text("work_name").notNull(),
  workNameHi: text("work_name_hi"),
  state: varchar("state", { length: 96 }).notNull(),
  district: varchar("district", { length: 96 }).notNull(),
  constituency: varchar("constituency", { length: 128 }),
  memberReference: varchar("member_reference", { length: 128 }),
  mpHouse: varchar("mp_house", { length: 32 }).default("Lok Sabha"),
  sector: varchar("sector", { length: 96 }).notNull(),
  financialYear: varchar("financial_year", { length: 32 }).default("2024-2025"),
  recommendationDate: date("recommendation_date"),
  sanctionDate: date("sanction_date"),
  startDate: date("start_date"),
  expectedCompletionDate: date("expected_completion_date"),
  actualCompletionDate: date("actual_completion_date"),
  recommendedAmount: numeric("recommended_amount", { precision: 15, scale: 2 }),
  sanctionedAmount: numeric("sanctioned_amount", { precision: 15, scale: 2 }),
  releasedAmount: numeric("released_amount", { precision: 15, scale: 2 }),
  expenditureAmount: numeric("expenditure_amount", { precision: 15, scale: 2 }),
  physicalProgress: integer("physical_progress"),
  financialProgress: integer("financial_progress"),
  status: varchar("status", { length: 48 }).notNull().default("Unknown"),
  implementingAgencyId: uuid("implementing_agency_id").references(() => agencies.id),
  contractorId: uuid("contractor_id").references(() => contractors.id),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationConfidence: integer("location_confidence").default(85),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  sourceRecordId: varchar("source_record_id", { length: 128 }),
  sourceUrl: text("source_url"),
  sourceDocument: text("source_document"),
  sourceTimestamp: timestamp("source_timestamp", { withTimezone: true }),
  dataQualityScore: integer("data_quality_score").notNull().default(0),
  completenessScore: integer("completeness_score").notNull().default(0),
  consistencyScore: integer("consistency_score").notNull().default(0),
  freshnessScore: integer("freshness_score").notNull().default(0),
  verificationStatus: varchar("verification_status", { length: 48 }).notNull().default("Insufficient evidence"),
  recordKind: varchar("record_kind", { length: 32 }).notNull().default("synthetic"),
  rawRecord: jsonb("raw_record").notNull().default({}),
  normalizedRecord: jsonb("normalized_record").notNull().default({}),
  derivedRecord: jsonb("derived_record").notNull().default({}),
  createdAt,
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  reference: varchar("reference", { length: 96 }),
  amount: numeric("amount", { precision: 15, scale: 2 }),
  recommendedOn: date("recommended_on"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  createdAt,
});

export const sanctions = pgTable("sanctions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  reference: varchar("reference", { length: 96 }),
  amount: numeric("amount", { precision: 15, scale: 2 }),
  sanctionedOn: date("sanctioned_on"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  createdAt,
});

export const expenditures = pgTable("expenditures", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  installmentNo: integer("installment_no").default(1),
  recordedOn: date("recorded_on"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  createdAt,
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("payment_date"),
  reference: varchar("reference", { length: 96 }),
  recipientAgency: text("recipient_agency"),
  createdAt,
});

export const workStatuses = pgTable("work_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  status: varchar("status", { length: 48 }).notNull(),
  physicalProgress: integer("physical_progress"),
  financialProgress: integer("financial_progress"),
  reportedOn: date("reported_on"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  createdAt,
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  name: text("name").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  storageUrl: text("storage_url"),
  sourcePage: integer("source_page"),
  extractedEntities: jsonb("extracted_entities").notNull().default({}),
  integrityStatus: varchar("integrity_status", { length: 48 }).notNull().default("verified"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  createdAt,
});

export const imageEvidence = pgTable("image_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  storageUrl: text("storage_url"),
  stage: varchar("stage", { length: 48 }).default("progress"), // before, progress, after
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  assessment: text("assessment"),
  visualProgressEst: integer("visual_progress_est"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt,
});

export const locationEvidence = pgTable("location_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  provider: varchar("provider", { length: 64 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  accuracyMeters: numeric("accuracy_meters", { precision: 8, scale: 2 }),
  geometry: jsonb("geometry"),
  confidence: integer("confidence"),
  createdAt,
});

export const satelliteObservations = pgTable("satellite_observations", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  provider: varchar("provider", { length: 64 }).notNull().default("Copernicus Sentinel-2 L2A"),
  sceneId: varchar("scene_id", { length: 128 }),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }),
  cloudCover: numeric("cloud_cover", { precision: 5, scale: 2 }),
  resolutionMeters: integer("resolution_meters").default(10),
  bands: varchar("bands", { length: 256 }).default("B02,B03,B04,B08"),
  ndviValue: numeric("ndvi_value", { precision: 5, scale: 3 }),
  ndwiValue: numeric("ndwi_value", { precision: 5, scale: 3 }),
  quality: varchar("quality", { length: 48 }).notNull().default("good"),
  corroborationStatus: varchar("corroboration_status", { length: 64 }).default("Corroborating physical change detected"),
  beforeDate: date("before_date"),
  afterDate: date("after_date"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt,
});

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  type: varchar("type", { length: 48 }).notNull(), // Financial, Document, Timeline, Location, Satellite, Image, Asset
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  state: varchar("state", { length: 48 }).notNull(), // Confirmed, Conflict, Insufficient evidence, Needs review
  confidence: integer("confidence"),
  sourceId: varchar("source_id", { length: 64 }).references(() => dataSources.id),
  dataDate: timestamp("data_date", { withTimezone: true }),
  createdAt,
});

export const riskSignals = pgTable("risk_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  dimension: varchar("dimension", { length: 64 }).notNull(),
  contribution: integer("contribution").notNull(),
  explanation: text("explanation").notNull(),
  modelVersion: varchar("model_version", { length: 64 }),
  ruleReference: varchar("rule_reference", { length: 64 }),
  confidence: integer("confidence"),
  createdAt,
});

export const riskScores = pgTable("risk_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  score: integer("score").notNull(),
  evidenceConfidence: integer("evidence_confidence").notNull(),
  completenessScore: integer("completeness_score").notNull().default(85),
  matrixQuadrant: varchar("matrix_quadrant", { length: 64 }).default("PRIORITY VERIFICATION"), // PRIORITY VERIFICATION, REQUEST EVIDENCE, ROUTINE MONITORING, DATA COMPLETION
  classification: varchar("classification", { length: 64 }).notNull(),
  recommendation: text("recommendation").notNull(),
  modelVersion: varchar("model_version", { length: 64 }).notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt,
});

export const modelVersions = pgTable("model_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  modelType: varchar("model_type", { length: 64 }).default("Isolation Forest + Explainable Rules"),
  datasetPeriod: varchar("dataset_period", { length: 96 }),
  features: jsonb("features").notNull().default([]),
  metrics: jsonb("metrics").notNull().default({}),
  validationDate: date("validation_date"),
  owner: varchar("owner", { length: 128 }),
  active: boolean("active").notNull().default(false),
  createdAt,
});

export const policyRules = pgTable("policy_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleId: varchar("rule_id", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  dimension: varchar("dimension", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 32 }).default("High"),
  threshold: integer("threshold").notNull(),
  condition: text("condition").notNull(),
  active: boolean("active").notNull().default(true),
  description: text("description"),
  createdAt,
});

export const investigationCases = pgTable("investigation_cases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  state: varchar("state", { length: 48 }).notNull().default("Alert"), // Alert, Assigned, Desk review, Field verification, Finding, Resolved, Escalated
  priority: varchar("priority", { length: 24 }).notNull().default("Medium"),
  assignedTo: varchar("assigned_to", { length: 128 }),
  assignedOfficerRole: varchar("assigned_officer_role", { length: 64 }),
  reason: text("reason").notNull(),
  notes: text("notes"),
  finding: text("finding"),
  resolution: text("resolution"),
  createdAt,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: varchar("case_id", { length: 64 }).references(() => investigationCases.id),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  conductedBy: varchar("conducted_by", { length: 128 }),
  status: varchar("status", { length: 48 }).notNull().default("Requested"),
  gpsLatitude: numeric("gps_latitude", { precision: 10, scale: 7 }),
  gpsLongitude: numeric("gps_longitude", { precision: 10, scale: 7 }),
  physicalCondition: varchar("physical_condition", { length: 64 }),
  finding: text("finding"),
  checklistResults: jsonb("checklist_results").default({}),
  createdAt,
});

export const actions = pgTable("actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: varchar("case_id", { length: 64 }).references(() => investigationCases.id),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  detail: text("detail").notNull(),
  actor: varchar("actor", { length: 128 }),
  createdAt,
});

export const assets = pgTable("assets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  assetType: varchar("asset_type", { length: 64 }).default("Community Infrastructure"),
  model3dType: varchar("model_3d_type", { length: 48 }).default("building"), // building, road, water_tank, solar_pole, health_center, school
  condition: varchar("condition", { length: 48 }).notNull().default("Good"),
  lifecycleState: varchar("lifecycle_state", { length: 48 }).notNull(), // Recommended, Sanctioned, Execution, Completed, Verified, Maintained, Current
  lastInspectedAt: timestamp("last_inspected_at", { withTimezone: true }),
  estimatedLifespanYears: integer("estimated_lifespan_years").default(15),
  maintenanceBudgetInr: numeric("maintenance_budget_inr", { precision: 12, scale: 2 }),
  createdAt,
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  assetId: varchar("asset_id", { length: 64 }).notNull().references(() => assets.id),
  workDone: text("work_done").notNull(),
  costInr: numeric("cost_inr", { precision: 12, scale: 2 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  conditionAfter: varchar("condition_after", { length: 48 }),
  createdAt,
});

export const publicVerifications = pgTable("public_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackingId: varchar("tracking_id", { length: 64 }).notNull().unique(),
  projectId: varchar("project_id", { length: 64 }).notNull().references(() => projects.id),
  category: varchar("category", { length: 64 }).notNull(),
  comment: text("comment"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationAccuracy: integer("location_accuracy"),
  photoUrl: text("photo_url"),
  citizenHash: varchar("citizen_hash", { length: 64 }), // anonymized token
  state: varchar("state", { length: 48 }).notNull().default("Received"), // Received, Under Review, Additional Evidence Requested, Verified, Not Substantiated, Closed
  officialResponse: text("official_response"),
  createdAt,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: varchar("actor", { length: 128 }).notNull().default("system"),
  action: varchar("action", { length: 96 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 96 }).notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipMasked: varchar("ip_masked", { length: 48 }),
  reason: text("reason"),
  createdAt,
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  role: varchar("role", { length: 32 }).notNull().default("CITIZEN"), // SUPER_ADMIN, ADMIN, OFFICIAL, AUDITOR, INVESTIGATOR, CITIZEN
  state: varchar("state", { length: 96 }),
  district: varchar("district", { length: 96 }),
  active: boolean("active").notNull().default(true),
  createdAt,
});
