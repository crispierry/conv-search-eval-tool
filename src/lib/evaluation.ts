import { conversationNodes, nodeById, seedById } from '../data/evaluationFixtures';
import type {
  ConversationNode,
  EvaluationRun,
  GateReviewMap,
  QualityAssessment,
  QualityLabel,
  QualityReviewMap,
  RunRollup,
  SeedQuery,
} from '../types';

export const qualityScores: Record<QualityLabel, number> = {
  Excellent: 4,
  Good: 3,
  'Needs Work': 2,
  Fail: 1,
};

export function qualityReviewKey(nodeId: string, area: QualityAssessment['area']) {
  return `${nodeId}::${area}`;
}

export function gateReviewKey(nodeId: string, findingId: string) {
  return `${nodeId}::${findingId}`;
}

export function getRunNodes(run: EvaluationRun) {
  return run.nodeIds.map((nodeId) => nodeById[nodeId]).filter(Boolean);
}

export function getRunSeeds(run: EvaluationRun) {
  return run.seedIds.map((seedId) => seedById[seedId]).filter(Boolean);
}

export function getSeedRootNode(run: EvaluationRun, seedId: string) {
  return getRunNodes(run).find((node) => node.seedId === seedId && node.depth === 0);
}

export function getSeedNodes(run: EvaluationRun, seedId: string) {
  return getRunNodes(run).filter((node) => node.seedId === seedId);
}

export function initialQualityReviews() {
  return conversationNodes.reduce<QualityReviewMap>((reviews, node) => {
    node.qualityAssessments.forEach((assessment) => {
      reviews[qualityReviewKey(node.id, assessment.area)] = {
        decision: 'Pending',
        label: assessment.label,
        comment: '',
      };
    });
    return reviews;
  }, {});
}

export function initialGateReviews() {
  return conversationNodes.reduce<GateReviewMap>((reviews, node) => {
    node.stage1Findings.forEach((finding) => {
      reviews[gateReviewKey(node.id, finding.id)] = {
        decision: 'Open',
        comment: '',
      };
    });
    return reviews;
  }, {});
}

function effectiveQualityScore(
  node: ConversationNode,
  area: QualityAssessment['area'],
  qualityReviews: QualityReviewMap,
) {
  const automated = node.qualityAssessments.find((assessment) => assessment.area === area);
  const review = qualityReviews[qualityReviewKey(node.id, area)];
  const label = review?.label ?? automated?.label ?? 'Fail';
  return qualityScores[label];
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getActiveFailures(node: ConversationNode, gateReviews: GateReviewMap) {
  return node.stage1Findings.filter((finding) => {
    if (finding.outcome !== 'Fail') {
      return false;
    }

    const review = gateReviews[gateReviewKey(node.id, finding.id)];
    return review?.decision !== 'False Positive';
  });
}

function countFalsePositiveFailures(node: ConversationNode, gateReviews: GateReviewMap) {
  return node.stage1Findings.filter((finding) => {
    const review = gateReviews[gateReviewKey(node.id, finding.id)];
    return finding.outcome === 'Fail' && review?.decision === 'False Positive';
  }).length;
}

function calculateGoldenCoverage(run: EvaluationRun) {
  const seedScores = getRunSeeds(run).map((seed) => {
    const root = getSeedRootNode(run, seed.id);

    if (!root || seed.goldenSet.length === 0) {
      return 100;
    }

    const returned = new Set(root.resultSet.map((result) => result.mediaId));
    const matched = seed.goldenSet.filter((mediaId) => returned.has(mediaId));
    return (matched.length / seed.goldenSet.length) * 100;
  });

  return round(average(seedScores), 0);
}

function getQualityAreas(nodes: ConversationNode[]) {
  return Array.from(
    new Set(nodes.flatMap((node) => node.qualityAssessments.map((assessment) => assessment.area))),
  ) as QualityAssessment['area'][];
}

function countPathEnds(nodes: ConversationNode[]) {
  const parentIds = new Set(nodes.map((node) => node.parentId).filter(Boolean));
  return nodes.filter((node) => !parentIds.has(node.id)).length;
}

function summarizeFailures(nodes: ConversationNode[], gateReviews: GateReviewMap) {
  const counts = new Map<string, number>();

  nodes.forEach((node) => {
    getActiveFailures(node, gateReviews).forEach((finding) => {
      counts.set(finding.title, (counts.get(finding.title) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function summarizeFollowUps(nodes: ConversationNode[]) {
  const counts = new Map<string, number>();

  nodes.forEach((node) => {
    node.followUps.forEach((followUp) => {
      counts.set(followUp.patternKey, (counts.get(followUp.patternKey) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function repeatedFollowUpRate(nodes: ConversationNode[]) {
  const suggestions = nodes.flatMap((node) => node.followUps.map((followUp) => followUp.patternKey));

  if (suggestions.length === 0) {
    return 0;
  }

  const unique = new Set(suggestions);
  return round(((suggestions.length - unique.size) / suggestions.length) * 100, 0);
}

function getSeedScore(
  run: EvaluationRun,
  seed: SeedQuery,
  qualityReviews: QualityReviewMap,
) {
  const nodes = getSeedNodes(run, seed.id);
  const scores = nodes.flatMap((node) =>
    node.qualityAssessments.map((assessment) =>
      effectiveQualityScore(node, assessment.area, qualityReviews),
    ),
  );

  return average(scores);
}

function groupedSeedBreakdown(
  run: EvaluationRun,
  qualityReviews: QualityReviewMap,
  gateReviews: GateReviewMap,
  getLabel: (seed: SeedQuery) => string,
) {
  const groups = new Map<string, { scores: number[]; failures: number }>();

  getRunSeeds(run).forEach((seed) => {
    const label = getLabel(seed);
    const seedNodes = getSeedNodes(run, seed.id);
    const group = groups.get(label) ?? { scores: [], failures: 0 };
    group.scores.push(getSeedScore(run, seed, qualityReviews));
    group.failures += seedNodes.reduce(
      (sum, node) => sum + getActiveFailures(node, gateReviews).length,
      0,
    );
    groups.set(label, group);
  });

  return [...groups.entries()].map(([label, group]) => ({
    label,
    score: round(average(group.scores)),
    failures: group.failures,
  }));
}

export function summarizeRun(
  run: EvaluationRun,
  qualityReviews: QualityReviewMap,
  gateReviews: GateReviewMap,
): RunRollup {
  const nodes = getRunNodes(run);
  const areas = getQualityAreas(nodes);
  const allQualityScores = nodes.flatMap((node) =>
    node.qualityAssessments.map((assessment) =>
      effectiveQualityScore(node, assessment.area, qualityReviews),
    ),
  );
  const hardFailures = nodes.reduce(
    (sum, node) => sum + node.stage1Findings.filter((finding) => finding.outcome === 'Fail').length,
    0,
  );
  const openHardFailures = nodes.reduce(
    (sum, node) => sum + getActiveFailures(node, gateReviews).length,
    0,
  );
  const falsePositiveFailures = nodes.reduce(
    (sum, node) => sum + countFalsePositiveFailures(node, gateReviews),
    0,
  );
  const warnings = nodes.reduce(
    (sum, node) =>
      sum + node.stage1Findings.filter((finding) => finding.outcome === 'Warning').length,
    0,
  );
  const nodesWithFailures = nodes.filter((node) => getActiveFailures(node, gateReviews).length > 0)
    .length;
  const qualityByArea = areas.reduce(
    (scores, area) => {
      scores[area] = round(
        average(nodes.map((node) => effectiveQualityScore(node, area, qualityReviews))),
      );
      return scores;
    },
    {} as Record<QualityAssessment['area'], number>,
  );
  const approvedQualityChecks = Object.entries(qualityReviews).filter(([key, review]) => {
    return run.nodeIds.some((nodeId) => key.startsWith(`${nodeId}::`)) && review.decision === 'Approved';
  }).length;
  const rejectedQualityChecks = Object.entries(qualityReviews).filter(([key, review]) => {
    return run.nodeIds.some((nodeId) => key.startsWith(`${nodeId}::`)) && review.decision === 'Rejected';
  }).length;
  const depthValues = new Map<number, number[]>();

  nodes.forEach((node) => {
    const nodeScore = average(
      node.qualityAssessments.map((assessment) =>
        effectiveQualityScore(node, assessment.area, qualityReviews),
      ),
    );
    depthValues.set(node.depth, [...(depthValues.get(node.depth) ?? []), nodeScore]);
  });

  const categoryBreakdown = groupedSeedBreakdown(
    run,
    qualityReviews,
    gateReviews,
    (seed) => seed.category,
  );
  const mediaTypeBreakdown = groupedSeedBreakdown(
    run,
    qualityReviews,
    gateReviews,
    (seed) => seed.expectedMediaType,
  );

  return {
    status: openHardFailures > 2 ? 'Failing' : openHardFailures > 0 || warnings > 0 ? 'Needs Review' : 'Passing',
    nodeCount: nodes.length,
    seedCount: run.seedIds.length,
    pathCount: countPathEnds(nodes),
    hardFailures,
    warnings,
    openHardFailures,
    falsePositiveFailures,
    stage1FailureRate: round((nodesWithFailures / Math.max(nodes.length, 1)) * 100, 0),
    stage2Average: round(average(allQualityScores)),
    goldenCoverage: calculateGoldenCoverage(run),
    approvedQualityChecks,
    rejectedQualityChecks,
    qualityByArea,
    topFailureReasons: summarizeFailures(nodes, gateReviews),
    followUpPatterns: summarizeFollowUps(nodes),
    repeatedFollowUpRate: repeatedFollowUpRate(nodes),
    depthQuality: [...depthValues.entries()]
      .map(([depth, values]) => ({ depth, score: round(average(values)) }))
      .sort((a, b) => a.depth - b.depth),
    categoryBreakdown,
    mediaTypeBreakdown,
  };
}
