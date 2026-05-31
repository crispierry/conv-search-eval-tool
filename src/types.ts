export const qualityLabels = ['Excellent', 'Good', 'Needs Work', 'Fail'] as const;

export type QualityLabel = (typeof qualityLabels)[number];
export type Stage1Outcome = 'Pass' | 'Warning' | 'Fail';
export type MediaType = 'movie' | 'series';
export type ExpectedMediaType = MediaType | 'mixed' | 'unknown';
export type ReviewDecision = 'Pending' | 'Approved' | 'Rejected';
export type GateDecision = 'Open' | 'Acknowledged' | 'False Positive';
export type AppTab = 'runs' | 'detail' | 'review' | 'trends';

export interface TmdbMedia {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number;
  posterPath?: string;
  overview: string;
  genres: string[];
  cast: string[];
  director?: string;
  creator?: string;
  voteAverage: number;
  runtimeLabel: string;
  source: 'TMDB';
}

export interface ExpectedResultCount {
  min: number;
  max: number;
}

export interface SeedQuery {
  id: string;
  query: string;
  category:
    | 'cast'
    | 'director'
    | 'award'
    | 'rating'
    | 'mood'
    | 'similar_to'
    | 'compound'
    | 'ambiguous'
    | 'exploratory';
  expectedMediaType: ExpectedMediaType;
  expectedResultCount?: ExpectedResultCount;
  constraints: string[];
  goldenSet: string[];
  notes: string;
}

export interface MetadataCheck {
  id: string;
  outcome: Stage1Outcome;
  field: string;
  expected: string;
  actual: string;
  source: 'TMDB' | 'Fixture';
  mediaId?: string;
}

export interface Stage1Finding {
  id: string;
  outcome: Stage1Outcome;
  title: string;
  scope: 'Result' | 'Node' | 'Copy' | 'Metadata';
  message: string;
  evidence: string;
  source: 'TMDB' | 'Fixture';
  mediaId?: string;
}

export interface SearchResult {
  mediaId: string;
  rank: number;
  relevance: QualityLabel;
  metadataChecks: MetadataCheck[];
}

export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: 'refine' | 'broaden' | 'filter' | 'compare';
  patternKey: string;
  targetNodeId?: string;
}

export interface QualityAssessment {
  area:
    | 'Search Results'
    | 'Blurb'
    | 'Custom Descriptions'
    | 'Follow-Up Suggestions';
  label: QualityLabel;
  rationale: string;
}

export interface ConversationNode {
  id: string;
  seedId: string;
  runId: string;
  parentId?: string;
  depth: number;
  query: string;
  path: string[];
  resultSet: SearchResult[];
  blurb: string;
  customDescriptions: Record<string, string>;
  followUps: FollowUpSuggestion[];
  stage1Findings: Stage1Finding[];
  qualityAssessments: QualityAssessment[];
  metadataSource: 'TMDB';
  rawPayloadId: string;
}

export interface RunSummarySnapshot {
  status: 'Passing' | 'Needs Review' | 'Failing';
  stage1FailureRate: number;
  stage2Average: number;
  seedCount: number;
  exploredPaths: number;
  goldenCoverage: number;
}

export interface EvaluationRun {
  id: string;
  label: string;
  date: string;
  systemLabel: string;
  querySetName: string;
  querySetVersion: string;
  configVersion: string;
  seedIds: string[];
  nodeIds: string[];
  snapshot: RunSummarySnapshot;
}

export interface QualityReview {
  decision: ReviewDecision;
  label: QualityLabel;
  comment: string;
}

export interface GateReview {
  decision: GateDecision;
  comment: string;
}

export type QualityReviewMap = Record<string, QualityReview>;
export type GateReviewMap = Record<string, GateReview>;

export interface RunRollup {
  status: 'Passing' | 'Needs Review' | 'Failing';
  nodeCount: number;
  seedCount: number;
  pathCount: number;
  hardFailures: number;
  warnings: number;
  openHardFailures: number;
  falsePositiveFailures: number;
  stage1FailureRate: number;
  stage2Average: number;
  goldenCoverage: number;
  approvedQualityChecks: number;
  rejectedQualityChecks: number;
  qualityByArea: Record<QualityAssessment['area'], number>;
  topFailureReasons: Array<{ label: string; count: number }>;
  followUpPatterns: Array<{ label: string; count: number }>;
  repeatedFollowUpRate: number;
  depthQuality: Array<{ depth: number; score: number }>;
  categoryBreakdown: Array<{ label: string; score: number; failures: number }>;
  mediaTypeBreakdown: Array<{ label: string; score: number; failures: number }>;
}
