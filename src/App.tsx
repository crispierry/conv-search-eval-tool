import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Database,
  ExternalLink,
  Film,
  GitBranch,
  ListChecks,
  MessageSquareText,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Tv,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  evaluationRuns,
  nodeById,
  seedById,
} from './data/evaluationFixtures';
import { mediaById } from './data/mediaCatalog';
import {
  gateReviewKey,
  getRunNodes,
  getRunSeeds,
  getSeedNodes,
  getSeedRootNode,
  initialGateReviews,
  initialQualityReviews,
  qualityReviewKey,
  summarizeRun,
} from './lib/evaluation';
import {
  hasTmdbToken,
  tmdbAttribution,
  tmdbPosterUrl,
  tmdbTitleUrl,
} from './lib/tmdb';
import { qualityLabels } from './types';
import type {
  AppTab,
  ConversationNode,
  EvaluationRun,
  GateDecision,
  GateReviewMap,
  QualityAssessment,
  QualityLabel,
  QualityReviewMap,
  RunRollup,
  Stage1Outcome,
} from './types';

const tabs = [
  { id: 'runs', label: 'Runs', icon: ClipboardCheck },
  { id: 'queries', label: 'Queries', icon: ListChecks },
  { id: 'detail', label: 'Automated Detail', icon: GitBranch },
  { id: 'review', label: 'Human Review', icon: UserCheck },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
] satisfies Array<{ id: AppTab; label: string; icon: typeof ClipboardCheck }>;

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const reviewStorageKey = 'conv-search-eval-tool.review-state.v1';

function readStoredReviewState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(reviewStorageKey);
    return stored ? (JSON.parse(stored) as Partial<{
      qualityReviews: QualityReviewMap;
      gateReviews: GateReviewMap;
    }>) : {};
  } catch {
    return {};
  }
}

function saveReviewState(qualityReviews: QualityReviewMap, gateReviews: GateReviewMap) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      reviewStorageKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        qualityReviews,
        gateReviews,
      }),
    );
  } catch {
    // Local review state is a convenience for the mock, so storage failures should not block review.
  }
}

function formatDate(date: string) {
  return dateTimeFormatter.format(new Date(date));
}

function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(date));
}

function scoreText(score: number) {
  return `${score.toFixed(1)} / 4`;
}

function statusClass(status: string) {
  if (status === 'Passing' || status === 'Approved' || status === 'Pass') {
    return 'positive';
  }

  if (status === 'Failing' || status === 'Rejected' || status === 'Fail') {
    return 'negative';
  }

  if (status === 'False Positive') {
    return 'neutral';
  }

  return 'warning';
}

function qualityClass(label: QualityLabel | string) {
  if (label === 'Excellent') {
    return 'positive';
  }

  if (label === 'Good') {
    return 'info';
  }

  if (label === 'Fail') {
    return 'negative';
  }

  return 'warning';
}

function queryStatusLabel(node: ConversationNode) {
  const hasFailure = node.stage1Findings.some((finding) => finding.outcome === 'Fail');

  if (hasFailure) {
    return 'Failing';
  }

  const hasWarning = node.stage1Findings.some((finding) => finding.outcome === 'Warning');
  return hasWarning ? 'Needs Review' : 'Passing';
}

function formatMachineLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function StatusPill({ label }: { label: string }) {
  return <span className={`pill ${statusClass(label)}`}>{label}</span>;
}

function QualityPill({ label }: { label: QualityLabel }) {
  return <span className={`pill ${qualityClass(label)}`}>{label}</span>;
}

function OutcomeIcon({ outcome }: { outcome: Stage1Outcome }) {
  if (outcome === 'Pass') {
    return <CheckCircle2 aria-hidden="true" />;
  }

  if (outcome === 'Fail') {
    return <XCircle aria-hidden="true" />;
  }

  return <CircleAlert aria-hidden="true" />;
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tone?: 'neutral' | 'positive' | 'warning' | 'negative' | 'info';
}) {
  return (
    <div className={`metric ${tone}`}>
      <Icon aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="score-bar" aria-label={scoreText(score)}>
      <span style={{ width: `${Math.max(4, Math.min(100, (score / 4) * 100))}%` }} />
    </div>
  );
}

function MiniLineChart({
  values,
  labels,
  suffix = '',
}: {
  values: number[];
  labels: string[];
  suffix?: string;
}) {
  const width = 340;
  const height = 110;
  const padding = 14;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend chart">
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <polyline points={points} />
        {values.map((value, index) => {
          const x =
            values.length === 1
              ? width / 2
              : padding + (index / (values.length - 1)) * (width - padding * 2);
          const y = height - padding - ((value - min) / range) * (height - padding * 2);
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" />;
        })}
      </svg>
      <div className="chart-labels">
        {labels.map((label, index) => (
          <span key={label}>
            {label}
            <strong>
              {values[index]}
              {suffix}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function MediaPoster({ mediaId }: { mediaId: string }) {
  const media = mediaById[mediaId];

  if (!media) {
    return null;
  }

  return (
    <a
      className="poster"
      href={tmdbTitleUrl(media.mediaType, media.tmdbId)}
      target="_blank"
      rel="noreferrer"
      title={`Open ${media.title} on TMDB`}
    >
      <span className="poster-fallback">{media.title.slice(0, 2).toUpperCase()}</span>
      {media.posterPath ? (
        <img src={tmdbPosterUrl(media.posterPath)} alt={`${media.title} poster`} />
      ) : null}
    </a>
  );
}

function MediaTypeIcon({ type }: { type: string }) {
  return type === 'series' ? <Tv aria-hidden="true" /> : <Film aria-hidden="true" />;
}

function getDefaultNodeForRun(run: EvaluationRun) {
  const firstSeed = run.seedIds[0];
  return getSeedRootNode(run, firstSeed) ?? getRunNodes(run)[0];
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('runs');
  const [selectedRunId, setSelectedRunId] = useState(evaluationRuns[0].id);
  const [selectedSeedId, setSelectedSeedId] = useState(evaluationRuns[0].seedIds[0]);
  const [selectedNodeId, setSelectedNodeId] = useState(
    getDefaultNodeForRun(evaluationRuns[0])?.id ?? '',
  );
  const [qualityReviews, setQualityReviews] = useState<QualityReviewMap>(() => ({
    ...initialQualityReviews(),
    ...(readStoredReviewState().qualityReviews ?? {}),
  }));
  const [gateReviews, setGateReviews] = useState<GateReviewMap>(() => ({
    ...initialGateReviews(),
    ...(readStoredReviewState().gateReviews ?? {}),
  }));

  const selectedRun = evaluationRuns.find((run) => run.id === selectedRunId) ?? evaluationRuns[0];
  const selectedNode = nodeById[selectedNodeId] ?? getDefaultNodeForRun(selectedRun);
  const selectedSeed = seedById[selectedSeedId] ?? seedById[selectedRun.seedIds[0]];
  const rollups = useMemo(
    () =>
      Object.fromEntries(
        evaluationRuns.map((run) => [run.id, summarizeRun(run, qualityReviews, gateReviews)]),
      ) as Record<string, RunRollup>,
    [qualityReviews, gateReviews],
  );
  const selectedRollup = rollups[selectedRun.id];
  const tmdbMode = hasTmdbToken() ? 'TMDB fixture data · token ready' : 'TMDB fixture data';

  useEffect(() => {
    saveReviewState(qualityReviews, gateReviews);
  }, [qualityReviews, gateReviews]);

  function selectRun(run: EvaluationRun) {
    const nextNode = getDefaultNodeForRun(run);
    setSelectedRunId(run.id);
    setSelectedSeedId(run.seedIds[0]);
    setSelectedNodeId(nextNode?.id ?? '');
  }

  function selectSeed(seedId: string) {
    const root = getSeedRootNode(selectedRun, seedId);
    setSelectedSeedId(seedId);
    setSelectedNodeId(root?.id ?? getSeedNodes(selectedRun, seedId)[0]?.id ?? '');
  }

  function selectQuery(node: ConversationNode) {
    setSelectedSeedId(node.seedId);
    setSelectedNodeId(node.id);
  }

  function updateQualityReview(
    nodeId: string,
    area: QualityAssessment['area'],
    patch: Partial<QualityReviewMap[string]>,
  ) {
    const key = qualityReviewKey(nodeId, area);
    setQualityReviews((reviews) => ({
      ...reviews,
      [key]: {
        decision: reviews[key]?.decision ?? 'Pending',
        label: reviews[key]?.label ?? 'Good',
        comment: reviews[key]?.comment ?? '',
        ...patch,
      },
    }));
  }

  function updateGateReview(
    nodeId: string,
    findingId: string,
    patch: Partial<GateReviewMap[string]>,
  ) {
    const key = gateReviewKey(nodeId, findingId);
    setGateReviews((reviews) => ({
      ...reviews,
      [key]: {
        decision: reviews[key]?.decision ?? 'Open',
        comment: reviews[key]?.comment ?? '',
        ...patch,
      },
    }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Search aria-hidden="true" />
          </span>
          <div>
            <h1>Conversational Search Evaluation</h1>
            <p>{selectedRun.querySetName} · {selectedRun.querySetVersion}</p>
          </div>
        </div>
        <div className="source-strip">
          <Database aria-hidden="true" />
          <span>{tmdbMode}</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Main views">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main>
        {activeTab === 'runs' ? (
          <RunsView
            selectedRun={selectedRun}
            selectedRollup={selectedRollup}
            rollups={rollups}
            onSelectRun={selectRun}
            onOpenDetail={() => setActiveTab('detail')}
          />
        ) : null}

        {activeTab === 'queries' ? (
          <QueryExecutionView
            selectedRun={selectedRun}
            selectedNodeId={selectedNode?.id ?? ''}
            onSelectQuery={selectQuery}
            onOpenDetail={() => setActiveTab('detail')}
          />
        ) : null}

        {activeTab === 'detail' && selectedNode ? (
          <AutomatedDetailView
            run={selectedRun}
            rollup={selectedRollup}
            selectedSeedId={selectedSeed.id}
            selectedNode={selectedNode}
            onSelectSeed={selectSeed}
            onSelectNode={setSelectedNodeId}
            onOpenReview={() => setActiveTab('review')}
          />
        ) : null}

        {activeTab === 'review' && selectedNode ? (
          <HumanReviewView
            node={selectedNode}
            gateReviews={gateReviews}
            qualityReviews={qualityReviews}
            onSelectNode={setSelectedNodeId}
            onUpdateGateReview={updateGateReview}
            onUpdateQualityReview={updateQualityReview}
          />
        ) : null}

        {activeTab === 'trends' ? (
          <TrendsView rollups={rollups} selectedRun={selectedRun} selectedRollup={selectedRollup} />
        ) : null}
      </main>

      <footer>
        <span>{tmdbAttribution}</span>
      </footer>
    </div>
  );
}

function RunsView({
  selectedRun,
  selectedRollup,
  rollups,
  onSelectRun,
  onOpenDetail,
}: {
  selectedRun: EvaluationRun;
  selectedRollup: RunRollup;
  rollups: Record<string, RunRollup>;
  onSelectRun: (run: EvaluationRun) => void;
  onOpenDetail: () => void;
}) {
  return (
    <div className="view-grid runs-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Query Sets And Runs</h2>
            <p>{evaluationRuns.length} saved evaluation snapshots</p>
          </div>
          <button className="primary-action" type="button" onClick={onOpenDetail}>
            <PlayCircle aria-hidden="true" />
            Open Run
          </button>
        </div>

        <div className="run-list">
          {evaluationRuns.map((run) => {
            const rollup = rollups[run.id];
            return (
              <button
                key={run.id}
                className={`run-row ${selectedRun.id === run.id ? 'selected' : ''}`}
                type="button"
                onClick={() => onSelectRun(run)}
              >
                <div>
                  <strong>{run.label}</strong>
                  <span>{formatDate(run.date)} · {run.systemLabel}</span>
                </div>
                <StatusPill label={rollup.status} />
                <span>{rollup.stage1FailureRate}% Stage 1</span>
                <span>{scoreText(rollup.stage2Average)}</span>
                <ChevronRight aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="summary-band">
        <Metric
          label="Seed Queries"
          value={String(selectedRollup.seedCount)}
          icon={ListChecks}
          tone="info"
        />
        <Metric
          label="Follow-Up Paths"
          value={String(selectedRollup.pathCount)}
          icon={GitBranch}
          tone="positive"
        />
        <Metric
          label="Open Hard Failures"
          value={String(selectedRollup.openHardFailures)}
          icon={XCircle}
          tone={selectedRollup.openHardFailures ? 'negative' : 'positive'}
        />
        <Metric
          label="Golden Coverage"
          value={`${selectedRollup.goldenCoverage}%`}
          icon={Star}
          tone="warning"
        />
      </section>

      <section className="panel split-panel">
        <div>
          <div className="section-heading compact">
            <h2>Quality Scores</h2>
            <StatusPill label={selectedRollup.status} />
          </div>
          <div className="score-list">
            {Object.entries(selectedRollup.qualityByArea).map(([area, score]) => (
              <div className="score-row" key={area}>
                <span>{area}</span>
                <ScoreBar score={score} />
                <strong>{scoreText(score)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="section-heading compact">
            <h2>Recurring Failure Reasons</h2>
            <span>{selectedRollup.warnings} warnings</span>
          </div>
          <div className="reason-list">
            {selectedRollup.topFailureReasons.length ? (
              selectedRollup.topFailureReasons.map((reason) => (
                <div className="reason-row" key={reason.label}>
                  <span>{reason.label}</span>
                  <strong>{reason.count}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">No open hard failures</div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading compact">
          <h2>Human Review Rollup</h2>
          <span>{selectedRollup.falsePositiveFailures} false positives marked</span>
        </div>
        <div className="review-rollup">
          <Metric
            label="Approved AI Scores"
            value={String(selectedRollup.approvedQualityChecks)}
            icon={CheckCircle2}
            tone="positive"
          />
          <Metric
            label="Rejected AI Scores"
            value={String(selectedRollup.rejectedQualityChecks)}
            icon={CircleAlert}
            tone={selectedRollup.rejectedQualityChecks ? 'warning' : 'neutral'}
          />
          <Metric
            label="Reviewed Nodes"
            value={`${selectedRollup.nodeCount}`}
            icon={MessageSquareText}
            tone="info"
          />
        </div>
      </section>
    </div>
  );
}

function QueryExecutionView({
  selectedRun,
  selectedNodeId,
  onSelectQuery,
  onOpenDetail,
}: {
  selectedRun: EvaluationRun;
  selectedNodeId: string;
  onSelectQuery: (node: ConversationNode) => void;
  onOpenDetail: () => void;
}) {
  const queryNodes = getRunNodes(selectedRun);
  const seedQueryCount = queryNodes.filter((node) => node.depth === 0).length;
  const followUpQueryCount = queryNodes.length - seedQueryCount;
  const maxDepth = Math.max(...queryNodes.map((node) => node.depth), 0);
  const failingQueryCount = queryNodes.filter((node) => queryStatusLabel(node) === 'Failing').length;

  return (
    <div className="view-grid queries-grid">
      <section className="summary-band query-summary">
        <Metric
          label="Seed Queries"
          value={String(seedQueryCount)}
          icon={ListChecks}
          tone="info"
        />
        <Metric
          label="During-Run Queries"
          value={String(followUpQueryCount)}
          icon={MessageSquareText}
          tone="positive"
        />
        <Metric label="Max Depth" value={String(maxDepth)} icon={GitBranch} tone="warning" />
        <Metric
          label="Failing Queries"
          value={String(failingQueryCount)}
          icon={XCircle}
          tone={failingQueryCount ? 'negative' : 'positive'}
        />
      </section>

      <section className="panel query-panel">
        <div className="section-heading">
          <div>
            <h2>Query Execution List</h2>
            <p>{selectedRun.label}</p>
          </div>
          <button className="primary-action" type="button" onClick={onOpenDetail}>
            <GitBranch aria-hidden="true" />
            Open Selected
          </button>
        </div>

        <div className="query-list">
          {queryNodes.map((node, index) => {
            const seed = seedById[node.seedId];
            const phase = node.depth === 0 ? 'Before Evaluation' : 'During Evaluation';
            const status = queryStatusLabel(node);

            return (
              <button
                key={node.id}
                type="button"
                className={`query-row ${node.id === selectedNodeId ? 'selected' : ''}`}
                onClick={() => onSelectQuery(node)}
              >
                <span className="query-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="query-copy">
                  <strong>{node.query}</strong>
                  <span>
                    {node.path.length > 1 ? node.path.join(' / ') : seed.notes}
                  </span>
                </span>
                <span className="query-meta">
                  <span>Depth {node.depth}</span>
                  <span>{formatMachineLabel(seed.category)}</span>
                  <span>{formatMachineLabel(seed.expectedMediaType)}</span>
                </span>
                <span className={`query-phase ${node.depth === 0 ? 'before' : 'during'}`}>
                  {phase}
                </span>
                <StatusPill label={status} />
                <span className="query-result-count">{node.resultSet.length} results</span>
                <ChevronRight aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AutomatedDetailView({
  run,
  rollup,
  selectedSeedId,
  selectedNode,
  onSelectSeed,
  onSelectNode,
  onOpenReview,
}: {
  run: EvaluationRun;
  rollup: RunRollup;
  selectedSeedId: string;
  selectedNode: ConversationNode;
  onSelectSeed: (seedId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onOpenReview: () => void;
}) {
  const seedNodes = getSeedNodes(run, selectedSeedId);
  const rootSeeds = getRunSeeds(run);

  return (
    <div className="view-grid detail-grid">
      <aside className="panel side-panel">
        <div className="section-heading compact">
          <h2>Seed Queries</h2>
          <span>{run.querySetVersion}</span>
        </div>
        <div className="seed-list">
          {rootSeeds.map((seed) => {
            const root = getSeedRootNode(run, seed.id);
            const hasFailure = root?.stage1Findings.some((finding) => finding.outcome === 'Fail');
            return (
              <button
                key={seed.id}
                type="button"
                className={selectedSeedId === seed.id ? 'selected' : ''}
                onClick={() => onSelectSeed(seed.id)}
              >
                <span>{seed.query}</span>
                <small>{seed.category} · {seed.expectedMediaType}</small>
                <StatusPill label={hasFailure ? 'Needs Review' : 'Passing'} />
              </button>
            );
          })}
        </div>
      </aside>

      <section className="panel detail-main">
        <div className="section-heading">
          <div>
            <h2>Automated Run Detail</h2>
            <p>{selectedNode.path.join(' / ')}</p>
          </div>
          <button className="primary-action" type="button" onClick={onOpenReview}>
            <UserCheck aria-hidden="true" />
            Review Node
          </button>
        </div>

        <div className="node-switcher">
          {seedNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={node.id === selectedNode.id ? 'selected' : ''}
              onClick={() => onSelectNode(node.id)}
            >
              <span>Depth {node.depth}</span>
              <strong>{node.query}</strong>
            </button>
          ))}
        </div>

        <div className="response-layout">
          <div className="result-strip">
            {selectedNode.resultSet.map((resultItem) => {
              const media = mediaById[resultItem.mediaId];
              if (!media) {
                return null;
              }

              return (
                <article className="title-tile" key={resultItem.mediaId}>
                  <MediaPoster mediaId={resultItem.mediaId} />
                  <div>
                    <span className="rank">#{resultItem.rank}</span>
                    <h3>{media.title}</h3>
                    <p>{media.year} · {media.runtimeLabel}</p>
                    <QualityPill label={resultItem.relevance} />
                  </div>
                  <p className="title-custom-description">
                    {selectedNode.customDescriptions[resultItem.mediaId]}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="blurb-block">
            <h3>Conversation Blurb</h3>
            <p>{selectedNode.blurb}</p>
          </div>

          <div className="two-column">
            <div>
              <h3>Correctness Gates</h3>
              <div className="finding-list">
                {selectedNode.stage1Findings.map((finding) => (
                  <div className={`finding ${statusClass(finding.outcome)}`} key={finding.id}>
                    <OutcomeIcon outcome={finding.outcome} />
                    <div>
                      <strong>{finding.title}</strong>
                      <p>{finding.message}</p>
                      <small>{finding.evidence}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3>Quality Scores</h3>
              <div className="quality-list">
                {selectedNode.qualityAssessments.map((assessment) => (
                  <div className="quality-row" key={assessment.area}>
                    <div>
                      <strong>{assessment.area}</strong>
                      <p>{assessment.rationale}</p>
                    </div>
                    <QualityPill label={assessment.label} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3>Follow-Up Suggestions</h3>
            <div className="follow-up-list">
              {selectedNode.followUps.map((followUp) => (
                <button
                  key={followUp.id}
                  type="button"
                  onClick={() => followUp.targetNodeId && onSelectNode(followUp.targetNodeId)}
                  disabled={!followUp.targetNodeId}
                >
                  <MessageSquareText aria-hidden="true" />
                  {followUp.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside className="panel side-panel">
        <div className="section-heading compact">
          <h2>Run Rollup</h2>
          <StatusPill label={rollup.status} />
        </div>
        <div className="compact-metrics">
          <Metric label="Nodes" value={String(rollup.nodeCount)} icon={GitBranch} tone="info" />
          <Metric
            label="Stage 1 Fail Rate"
            value={`${rollup.stage1FailureRate}%`}
            icon={CircleAlert}
            tone={rollup.stage1FailureRate ? 'warning' : 'positive'}
          />
          <Metric
            label="Stage 2 Average"
            value={scoreText(rollup.stage2Average)}
            icon={BarChart3}
            tone="positive"
          />
        </div>
        <div className="metadata-box">
          <h3>Metadata Source</h3>
          <p>TMDB title, media type, cast, crew, dates, rating, and poster paths.</p>
        </div>
        <div className="metadata-box">
          <h3>Follow-Up Patterns</h3>
          {rollup.followUpPatterns.map((pattern) => (
            <div className="reason-row" key={pattern.label}>
              <span>{pattern.label}</span>
              <strong>{pattern.count}</strong>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function HumanReviewView({
  node,
  gateReviews,
  qualityReviews,
  onSelectNode,
  onUpdateGateReview,
  onUpdateQualityReview,
}: {
  node: ConversationNode;
  gateReviews: GateReviewMap;
  qualityReviews: QualityReviewMap;
  onSelectNode: (nodeId: string) => void;
  onUpdateGateReview: (
    nodeId: string,
    findingId: string,
    patch: Partial<GateReviewMap[string]>,
  ) => void;
  onUpdateQualityReview: (
    nodeId: string,
    area: QualityAssessment['area'],
    patch: Partial<QualityReviewMap[string]>,
  ) => void;
}) {
  const siblingNodes = getSeedNodes(
    evaluationRuns.find((run) => run.id === node.runId) ?? evaluationRuns[0],
    node.seedId,
  );

  return (
    <div className="view-grid review-grid">
      <section className="panel review-context">
        <div className="section-heading">
          <div>
            <h2>Human Review Detail</h2>
            <p>{node.path.join(' / ')}</p>
          </div>
          <StatusPill label="Needs Review" />
        </div>

        <div className="node-switcher">
          {siblingNodes.map((sibling) => (
            <button
              key={sibling.id}
              type="button"
              className={sibling.id === node.id ? 'selected' : ''}
              onClick={() => onSelectNode(sibling.id)}
            >
              <span>Depth {sibling.depth}</span>
              <strong>{sibling.query}</strong>
            </button>
          ))}
        </div>

        <div className="review-results">
          {node.resultSet.map((resultItem) => {
            const media = mediaById[resultItem.mediaId];
            if (!media) {
              return null;
            }

            return (
              <article className="result-review" key={resultItem.mediaId}>
                <MediaPoster mediaId={resultItem.mediaId} />
                <div>
                  <div className="result-title-line">
                    <h3>{media.title}</h3>
                    <a
                      href={tmdbTitleUrl(media.mediaType, media.tmdbId)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open on TMDB"
                    >
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                  <p>{node.customDescriptions[resultItem.mediaId]}</p>
                  <div className="metadata-tags">
                    <span>
                      <MediaTypeIcon type={media.mediaType} />
                      {media.mediaType}
                    </span>
                    <span>{media.year}</span>
                    <span>TMDB {media.voteAverage.toFixed(1)}</span>
                    <span>{media.genres.slice(0, 2).join(', ')}</span>
                  </div>
                  <div className="metadata-checks">
                    {resultItem.metadataChecks.map((check) => (
                      <div className="metadata-check" key={check.id}>
                        <StatusPill label={check.outcome} />
                        <div>
                          <strong>{check.field}</strong>
                          <p>
                            Expected {check.expected}; actual {check.actual}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel reviewer-panel">
        <div className="section-heading compact">
          <h2>AI Assessment</h2>
          <span>{node.metadataSource} metadata</span>
        </div>

        <div className="review-form-list">
          {node.qualityAssessments.map((assessment) => {
            const review = qualityReviews[qualityReviewKey(node.id, assessment.area)];
            return (
              <article className="review-form" key={assessment.area}>
                <div className="review-form-heading">
                  <div>
                    <strong>{assessment.area}</strong>
                    <p>{assessment.rationale}</p>
                  </div>
                  <QualityPill label={assessment.label} />
                </div>
                <div className="review-controls">
                  <select
                    value={review?.label ?? assessment.label}
                    onChange={(event) =>
                      onUpdateQualityReview(node.id, assessment.area, {
                        label: event.target.value as QualityLabel,
                      })
                    }
                    aria-label={`${assessment.area} quality label`}
                  >
                    {qualityLabels.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={review?.decision === 'Approved' ? 'selected positive' : ''}
                    onClick={() =>
                      onUpdateQualityReview(node.id, assessment.area, { decision: 'Approved' })
                    }
                  >
                    <CheckCircle2 aria-hidden="true" />
                    Approved
                  </button>
                  <button
                    type="button"
                    className={review?.decision === 'Rejected' ? 'selected warning' : ''}
                    onClick={() =>
                      onUpdateQualityReview(node.id, assessment.area, { decision: 'Rejected' })
                    }
                  >
                    <CircleAlert aria-hidden="true" />
                    Rejected
                  </button>
                </div>
                <textarea
                  value={review?.comment ?? ''}
                  onChange={(event) =>
                    onUpdateQualityReview(node.id, assessment.area, {
                      comment: event.target.value,
                    })
                  }
                  placeholder="Reviewer comment"
                />
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel gate-review-panel">
        <div className="section-heading compact">
          <h2>Correctness Gates</h2>
          <span>{node.stage1Findings.length} findings</span>
        </div>
        <div className="review-form-list">
          {node.stage1Findings.map((finding) => {
            const review = gateReviews[gateReviewKey(node.id, finding.id)];
            const decisions: GateDecision[] =
              finding.outcome === 'Fail'
                ? ['Open', 'Acknowledged', 'False Positive']
                : ['Open', 'Acknowledged'];
            return (
              <article className="gate-form" key={finding.id}>
                <div className="finding-line">
                  <OutcomeIcon outcome={finding.outcome} />
                  <div>
                    <strong>{finding.title}</strong>
                    <p>{finding.evidence}</p>
                  </div>
                  <StatusPill label={review?.decision ?? 'Open'} />
                </div>
                <div className="segmented">
                  {decisions.map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      className={review?.decision === decision ? 'selected' : ''}
                      onClick={() =>
                        onUpdateGateReview(node.id, finding.id, {
                          decision,
                        })
                      }
                    >
                      {decision}
                    </button>
                  ))}
                </div>
                <textarea
                  value={review?.comment ?? ''}
                  onChange={(event) =>
                    onUpdateGateReview(node.id, finding.id, {
                      comment: event.target.value,
                    })
                  }
                  placeholder="Gate comment"
                />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TrendsView({
  rollups,
  selectedRun,
  selectedRollup,
}: {
  rollups: Record<string, RunRollup>;
  selectedRun: EvaluationRun;
  selectedRollup: RunRollup;
}) {
  const chronologicalRuns = [...evaluationRuns].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const qualityTrend = chronologicalRuns.map((run) => rollups[run.id].stage2Average);
  const failureTrend = chronologicalRuns.map((run) => rollups[run.id].stage1FailureRate);
  const coverageTrend = chronologicalRuns.map((run) => rollups[run.id].goldenCoverage);
  const labels = chronologicalRuns.map((run) => formatShortDate(run.date));

  return (
    <div className="view-grid trends-grid">
      <section className="panel trend-panel">
        <div className="section-heading compact">
          <h2>Stage 2 Quality Trend</h2>
          <span>{scoreText(selectedRollup.stage2Average)}</span>
        </div>
        <MiniLineChart values={qualityTrend} labels={labels} />
      </section>

      <section className="panel trend-panel">
        <div className="section-heading compact">
          <h2>Stage 1 Hard Failure Trend</h2>
          <span>{selectedRollup.stage1FailureRate}%</span>
        </div>
        <MiniLineChart values={failureTrend} labels={labels} suffix="%" />
      </section>

      <section className="panel trend-panel">
        <div className="section-heading compact">
          <h2>Golden-Set Coverage</h2>
          <span>{selectedRollup.goldenCoverage}%</span>
        </div>
        <MiniLineChart values={coverageTrend} labels={labels} suffix="%" />
      </section>

      <section className="panel split-panel wide">
        <div>
          <div className="section-heading compact">
            <h2>Quality By Area</h2>
            <span>{selectedRun.label}</span>
          </div>
          <div className="score-list">
            {Object.entries(selectedRollup.qualityByArea).map(([area, score]) => (
              <div className="score-row" key={area}>
                <span>{area}</span>
                <ScoreBar score={score} />
                <strong>{scoreText(score)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="section-heading compact">
            <h2>Follow-Up Depth</h2>
            <span>{selectedRollup.repeatedFollowUpRate}% repeated</span>
          </div>
          <div className="depth-list">
            {selectedRollup.depthQuality.map((item) => (
              <div className="score-row" key={item.depth}>
                <span>Depth {item.depth}</span>
                <ScoreBar score={item.score} />
                <strong>{scoreText(item.score)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel split-panel wide">
        <Breakdown title="By Query Category" items={selectedRollup.categoryBreakdown} />
        <Breakdown title="By Expected Media Type" items={selectedRollup.mediaTypeBreakdown} />
      </section>

      <section className="panel split-panel wide">
        <div>
          <div className="section-heading compact">
            <h2>Top Failure Reasons</h2>
            <span>{selectedRollup.openHardFailures} open</span>
          </div>
          <div className="reason-list">
            {selectedRollup.topFailureReasons.length ? (
              selectedRollup.topFailureReasons.map((reason) => (
                <div className="reason-row" key={reason.label}>
                  <span>{reason.label}</span>
                  <strong>{reason.count}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">No open hard failures</div>
            )}
          </div>
        </div>
        <div>
          <div className="section-heading compact">
            <h2>Suggestion Patterns</h2>
            <span>{selectedRollup.repeatedFollowUpRate}% repeated</span>
          </div>
          <div className="reason-list">
            {selectedRollup.followUpPatterns.map((pattern) => (
              <div className="reason-row" key={pattern.label}>
                <span>{pattern.label}</span>
                <strong>{pattern.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Breakdown({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; score: number; failures: number }>;
}) {
  return (
    <div>
      <div className="section-heading compact">
        <h2>{title}</h2>
        <span>{items.length} groups</span>
      </div>
      <div className="score-list">
        {items.map((item) => (
          <div className="score-row" key={item.label}>
            <span>{item.label}</span>
            <ScoreBar score={item.score} />
            <strong>{scoreText(item.score)}</strong>
            <small>{item.failures} fails</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
