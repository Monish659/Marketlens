import { z } from "zod";

export const IdeationResponse = z.object({
  summary: z.string().min(1),
  segments: z.array(z.object({
    name: z.string(),
    why_it_fits: z.string(),
    hooks: z.array(z.string()).min(1),
    kpis: z.array(z.string()).min(1),
    platform_fit: z.array(z.string()).min(1)
  })).min(1).max(5),
  features: z.array(z.string()).min(1).max(10),
  risks: z.array(z.object({
    risk: z.string(),
    mitigation: z.string()
  })).min(1),
  social_fit: z.array(z.object({
    platform: z.string(),
    why: z.string()
  })).min(1),
  improvements_by_segment: z.array(z.object({
    segment: z.string(),
    ideas: z.array(z.string()).min(1)
  })).min(1),
  followups: z.array(z.string()).min(1).max(3),
  // Step 1 addition for auditability (used later by Critic/Refiner)
  assumptions: z.array(z.string()).optional(),
  uncertainty_score: z.number().min(0).max(1).optional()
});

export type IdeationResponseT = z.infer<typeof IdeationResponse>;

export const CritiqueIssue = z.object({
  section: z.string().optional(), // allow any section name or missing if cross-cutting
  severity: z.enum(["low", "medium", "high"]),
  reason: z.string().min(1),
  impact: z.string().min(1),
  evidence: z.string().nullable().optional()
});

export const CritiqueFix = z.object({
  section: z.string().min(1),
  change: z.string().min(1),
  rationale: z.string().min(1),
  example: z.string().nullable().optional()
});

export const CritiqueResponse = z.object({
  summary: z.string().min(1), // high-level verdict of the plan quality
  score: z.number().min(0).max(1), // 0..1 confidence in plan viability
  issues: z.array(CritiqueIssue).min(1),
  fixes: z.array(CritiqueFix).min(1),
  meta: z.object({
    assumptions_to_validate: z.array(z.string()).default([]),
    missing_data: z.array(z.string()).default([]),
    suggested_experiments: z.array(z.string()).default([]) // quick tests to de-risk
  })
});

export type CritiqueResponseT = z.infer<typeof CritiqueResponse>;

export const DeltaChange = z.object({
  section: z.enum([
    "summary",
    "segments",
    "features",
    "risks",
    "social_fit",
    "improvements_by_segment",
    "followups",
    "kpi_plan",         // reserved for future if you add it to Advisor
    "channel_strategy"  // same note
  ]),
  path: z.string().min(1), // JSON pointer-ish, e.g. "segments[1].kpis[0]"
  before: z.any().optional(),
  after: z.any().optional(),
  rationale: z.string().min(1)
});

export const RefinedResponse = z.object({
  final: IdeationResponse,           // SAME SHAPE as Advisor
  deltas: z.array(DeltaChange).min(1),
  uncertainty_score: z.number().min(0).max(1),
  assumptions: z.array(z.string()).min(0)
});

export type RefinedResponseT = z.infer<typeof RefinedResponse>;

export type IdeaDoc = {
  _id?: import("mongodb").ObjectId;
  idea: string;
  artifacts?: { type: "url"|"pdf"|"image"; name: string; ref: string }[];
  stage: "advisor"; // Steps 2/3 will add "critic" and "refiner"
  result: IdeationResponseT;
  createdAt: Date;
  critic?: {
    response: CritiqueResponseT;
    critiquedAt: Date;
  };
  refiner?: {
    response: RefinedResponseT;
    refinedAt: Date;
  };
};

export type ScoutPageDoc = {
  _id?: import("mongodb").ObjectId;
  url: string;
  title: string;
  html: string;
  text: string;
  screenshot?: string; // base64 encoded or file path
  fetchedAt: Date;
  domain: string;
  metaDescription?: string;
  error?: string;
};

export type ScoutVectorDoc = {
  _id?: import("mongodb").ObjectId;
  pageId: import("mongodb").ObjectId;
  chunkId: string; // c0, c1, ...
  text: string;
  embedding: number[]; // vector for Atlas Vector Search
  url: string;
};
