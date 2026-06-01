import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Database,
  ExternalLink,
  Film,
  GitBranch,
  ListChecks,
  Maximize2,
  MessageSquareText,
  PlayCircle,
  RotateCcw,
  Search,
  Star,
  TrendingUp,
  Tv,
  UserCheck,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import productBriefMarkdown from '../docs/PRODUCT_BRIEF.md?raw';
import {
  evaluationRuns,
  nodeById,
  seedById,
} from './data/evaluationFixtures';
import { mediaById } from './data/mediaCatalog';
import {
  copyReviewKey,
  gateReviewKey,
  getRunNodes,
  getRunSeeds,
  getSeedNodes,
  getSeedRootNode,
  initialCopyReviews,
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
import type {
  AppTab,
  ConversationNode,
  CopyReviewMap,
  CopyReviewTarget,
  EvaluationRun,
  GateDecision,
  GateReviewMap,
  QualityAssessment,
  QualityLabel,
  QualityReviewMap,
  ReviewDecision,
  RunRollup,
  SeedQuery,
  Stage1Outcome,
} from './types';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
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
const maxConversationDepth = 4;
const conversationMapColumnWidth = 360;
const conversationMapRowHeight = 230;
const conversationMapNodeWidth = 250;
const conversationMapNodeHeight = 170;
const conversationMapHeaderOffset = 64;

type TreeBranchState = 'available' | 'dead-end' | 'not-fixture-backed';

interface ConversationMapItem {
  id: string;
  depth: number;
  label: string;
  path: string[];
  state: TreeBranchState;
  status: string;
  childCount: number;
  x: number;
  y: number;
  nodeId?: string;
  parentNodeId?: string;
  qualityLabel?: QualityLabel;
}

interface ConversationMapEdge {
  id: string;
  fromId: string;
  toId: string;
}

type MarkdownBlock =
  | { id: string; type: 'heading'; level: number; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'quote'; text: string }
  | { id: string; type: 'list'; items: string[] };

const productBriefBlocks = parseMarkdown(productBriefMarkdown);

const projectOverviewItems = [
  {
    label: 'Primary Question',
    value: 'Is conversational search getting better over time, and what is still failing?',
  },
  {
    label: 'First Audience',
    value: 'Product teammates reviewing quality, workflow, failures, and handoff needs.',
  },
  {
    label: 'Current Shape',
    value: 'A mock-driven dashboard using saved fixture runs and TMDB prototype metadata.',
  },
  {
    label: 'Future Shape',
    value: 'Live execution, scheduled recurring runs, reviewer assignment, and shareable reports.',
  },
];

const evaluationScopeGroups = [
  {
    title: 'Inputs And Scope',
    icon: ListChecks,
    summary: 'The tool starts with structured seed queries and turns them into saved evaluation runs.',
    items: [
      'Starter query text, search intent category, expected media type, and product notes.',
      'Expected result count, required constraints, and optional golden-set titles.',
      'Run metadata such as system label, query-set version, evaluation config, and snapshot date.',
    ],
  },
  {
    title: 'Stage 1 Gates',
    icon: CircleAlert,
    summary: 'Correctness checks decide whether a response is valid enough to judge.',
    items: [
      'No-result failures, wrong media type, missing required fields, and missing poster art.',
      'Constraint violations across cast, actor, director, awards, ratings, time period, genre, or similar requirements.',
      'Golden-set misses, incomplete metadata, source conflicts, offensive language, and competitor mentions.',
    ],
  },
  {
    title: 'Stage 2 Quality',
    icon: Star,
    summary: 'Quality scoring looks at the user experience once correctness basics are checked.',
    items: [
      'Search result relevance, ranking quality, result count usefulness, and top-result fit.',
      'Conversation blurb accuracy, clarity, tone, safety, and usefulness.',
      'Per-title AI custom blurbs and follow-up suggestions for relevance, specificity, diversity, and coherence.',
    ],
  },
  {
    title: 'Conversation Paths',
    icon: GitBranch,
    summary: 'Suggested follow-ups are evaluated as a bounded conversation tree.',
    items: [
      'Every suggested follow-up is recorded, clicked when available, and evaluated as its own node.',
      'Branches continue independently to the configured depth, with dead ends and repeated suggestions tracked.',
      'Depth quality, branch coherence, repetition, bias, and overrepresented topics roll up to run reporting.',
    ],
  },
  {
    title: 'Human Review',
    icon: UserCheck,
    summary: 'Reviewers validate or correct automated judgments at the field level.',
    items: [
      'Returned title validity, rank position, title-level commentary, and generated custom blurbs.',
      'Overall conversation blurb approval, follow-up suggestion approval, and reviewer comments.',
      'Stage 1 finding acknowledgement, false-positive marking, and preserved automated evidence.',
    ],
  },
  {
    title: 'Reporting',
    icon: TrendingUp,
    summary: 'Run summaries explain whether the system is improving and where failures repeat.',
    items: [
      'Stage 1 hard failure rate, average Stage 2 quality, and quality by area.',
      'Breakdowns by query category, expected media type, golden-set coverage, and follow-up depth.',
      'Recurring failure reasons, repeated follow-up rate, suggestion patterns, and review rollups.',
    ],
  },
];

function readStoredReviewState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(reviewStorageKey);
    return stored
      ? (JSON.parse(stored) as Partial<{
          copyReviews: CopyReviewMap;
          qualityReviews: QualityReviewMap;
          gateReviews: GateReviewMap;
        }>)
      : {};
  } catch {
    return {};
  }
}

function saveReviewState(
  qualityReviews: QualityReviewMap,
  gateReviews: GateReviewMap,
  copyReviews: CopyReviewMap,
) {
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
        copyReviews,
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

function seedStatusLabel(run: EvaluationRun, seedId: string) {
  const nodes = getSeedNodes(run, seedId);

  if (nodes.length === 0) {
    return 'Needs Review';
  }

  const hasFailure = nodes.some((node) =>
    node.stage1Findings.some((finding) => finding.outcome === 'Fail'),
  );

  if (hasFailure) {
    return 'Failing';
  }

  const hasWarning = nodes.some((node) =>
    node.stage1Findings.some((finding) => finding.outcome === 'Warning'),
  );

  return hasWarning ? 'Needs Review' : 'Passing';
}

function formatMachineLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isMarkdownBoundary(line: string) {
  return (
    line.startsWith('# ') ||
    line.startsWith('## ') ||
    line.startsWith('### ') ||
    line.startsWith('- ') ||
    line.startsWith('> ')
  );
}

function parseMarkdown(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);

    if (headingMatch) {
      blocks.push({
        id: `heading-${blocks.length}`,
        level: headingMatch[1].length,
        text: headingMatch[2],
        type: 'heading',
      });
      index += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }

      blocks.push({ id: `list-${blocks.length}`, items, type: 'list' });
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2));
        index += 1;
      }

      blocks.push({
        id: `quote-${blocks.length}`,
        text: quoteLines.join(' '),
        type: 'quote',
      });
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trim();

      if (!nextLine || isMarkdownBoundary(nextLine)) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push({
      id: `paragraph-${blocks.length}`,
      text: paragraphLines.join(' '),
      type: 'paragraph',
    });
  }

  return blocks;
}

function renderInlineMarkdown(text: string) {
  const inlinePattern = /(`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(<code key={`code-${match.index}`}>{match[2]}</code>);
    } else if (match[3] && match[4]) {
      const href = match[4];
      const isExternal = href.startsWith('http');

      nodes.push(
        <a
          href={href}
          key={`link-${match.index}`}
          rel={isExternal ? 'noreferrer' : undefined}
          target={isExternal ? '_blank' : undefined}
        >
          {match[3]}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function conversationTurnLabel(depth: number) {
  return `Turn ${depth + 1}`;
}

function branchStateLabel(state: TreeBranchState) {
  if (state === 'dead-end') {
    return 'Dead end';
  }

  if (state === 'not-fixture-backed') {
    return 'No saved response';
  }

  return 'Available';
}

function branchStateIcon(state: TreeBranchState) {
  if (state === 'dead-end') {
    return XCircle;
  }

  if (state === 'not-fixture-backed') {
    return CircleAlert;
  }

  return CheckCircle2;
}

function getAncestorNodeIds(node: ConversationNode, nodesById: Map<string, ConversationNode>) {
  const ancestorIds = new Set<string>();
  let current: ConversationNode | undefined = node;

  while (current) {
    ancestorIds.add(current.id);
    current = current.parentId ? nodesById.get(current.parentId) : undefined;
  }

  return ancestorIds;
}

function getAncestorNodeAtDepth(
  node: ConversationNode | undefined,
  depth: number,
  nodesById: Map<string, ConversationNode>,
) {
  let current = node;

  while (current && current.depth > depth) {
    current = current.parentId ? nodesById.get(current.parentId) : undefined;
  }

  return current?.depth === depth ? current : undefined;
}

function buildConversationMap(nodes: ConversationNode[], selectedNode: ConversationNode) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const depthGroups = Array.from({ length: maxConversationDepth + 1 }, () => [] as ConversationMapItem[]);
  const itemById = new Map<string, ConversationMapItem>();
  const edges: ConversationMapEdge[] = [];
  const edgeIds = new Set<string>();
  const focusPathNodeIds = new Set<string>();
  const selectedNodeForFocus = nodesById.get(selectedNode.id);

  function appendItem(item: ConversationMapItem) {
    const existingItem = itemById.get(item.id);

    if (existingItem) {
      return existingItem;
    }

    itemById.set(item.id, item);
    depthGroups[item.depth].push(item);
    return item;
  }

  function addEdge(fromId: string, toId: string) {
    const edgeId = `${fromId}-${toId}`;

    if (edgeIds.has(edgeId)) {
      return;
    }

    edgeIds.add(edgeId);
    edges.push({ id: edgeId, fromId, toId });
  }

  function addAvailableNode(node: ConversationNode) {
    return appendItem({
      id: node.id,
      depth: node.depth,
      label: node.query,
      path: node.path,
      state: 'available',
      status: queryStatusLabel(node),
      childCount: node.followUps.length,
      x: 0,
      y: 0,
      nodeId: node.id,
      parentNodeId: node.parentId,
      qualityLabel: getQualityAssessment(node, 'Search Results')?.label,
    });
  }

  function addChildItems(parentNode: ConversationNode) {
    if (parentNode.depth >= maxConversationDepth) {
      return [] as ConversationMapItem[];
    }

    const parentItem = addAvailableNode(parentNode);
    const childDepth = parentNode.depth + 1;

    if (parentNode.followUps.length === 0) {
      const deadId = `dead-${parentNode.id}-${childDepth}`;
      const deadItem = appendItem({
        id: deadId,
        depth: childDepth,
        label: 'No follow-up suggestions returned',
        path: [...parentNode.path, 'No follow-up suggestions returned'],
        state: 'dead-end',
        status: 'Dead end',
        childCount: 0,
        x: 0,
        y: 0,
        parentNodeId: parentNode.id,
      });

      addEdge(parentItem.id, deadItem.id);
      return [deadItem];
    }

    return parentNode.followUps.map((followUp) => {
      const targetNode = followUp.targetNodeId ? nodesById.get(followUp.targetNodeId) : undefined;
      const childItem =
        targetNode && targetNode.depth <= maxConversationDepth
          ? addAvailableNode(targetNode)
          : appendItem({
              id: `stub-${parentNode.id}-${followUp.id}`,
              depth: childDepth,
              label: followUp.text,
              path: [...parentNode.path, followUp.text],
              state: 'not-fixture-backed',
              status: 'Not evaluated',
              childCount: 0,
              x: 0,
              y: 0,
              parentNodeId: parentNode.id,
            });

      addEdge(parentItem.id, childItem.id);
      return childItem;
    });
  }

  function firstAvailableNodeAtDepth(depth: number) {
    const item = depthGroups[depth].find((candidate) => candidate.state === 'available' && candidate.nodeId);

    return item?.nodeId ? nodesById.get(item.nodeId) : undefined;
  }

  function focusedNodeAtDepth(depth: number) {
    const selectedAncestor = getAncestorNodeAtDepth(selectedNodeForFocus, depth, nodesById);

    if (selectedAncestor && itemById.has(selectedAncestor.id)) {
      return selectedAncestor;
    }

    return firstAvailableNodeAtDepth(depth);
  }

  const rootNodes = nodes.filter((node) => node.depth === 0 && node.depth <= maxConversationDepth);
  rootNodes.forEach((node) => addAvailableNode(node));
  const focusedRootNode = focusedNodeAtDepth(0);

  if (focusedRootNode) {
    focusPathNodeIds.add(focusedRootNode.id);
  }

  rootNodes.forEach((node) => addChildItems(node));

  for (let depth = 1; depth <= maxConversationDepth; depth += 1) {
    const focusedNode = focusedNodeAtDepth(depth);

    if (!focusedNode) {
      break;
    }

    focusPathNodeIds.add(focusedNode.id);

    if (depth < maxConversationDepth) {
      addChildItems(focusedNode);
    }
  }

  depthGroups.forEach((items, depth) => {
    items.forEach((item, index) => {
      item.x = depth * conversationMapColumnWidth;
      item.y = conversationMapHeaderOffset + index * conversationMapRowHeight;
    });
  });

  const maxVisibleRows = Math.max(...depthGroups.map((items) => items.length), 1);
  const mapWidth = maxConversationDepth * conversationMapColumnWidth + conversationMapNodeWidth;
  const mapHeight =
    conversationMapHeaderOffset +
    (maxVisibleRows - 1) * conversationMapRowHeight +
    conversationMapNodeHeight +
    28;

  return {
    columnWidth: conversationMapColumnWidth,
    depthGroups,
    edges,
    focusPathNodeIds,
    itemById,
    mapHeight,
    mapWidth,
    nodeHeight: conversationMapNodeHeight,
    nodeWidth: conversationMapNodeWidth,
    nodesById,
  };
}

function StatusPill({ label }: { label: string }) {
  return <span className={`pill ${statusClass(label)}`}>{label}</span>;
}

function QualityPill({ label }: { label: QualityLabel }) {
  return <span className={`pill ${qualityClass(label)}`}>{label}</span>;
}

function ratingLabel(label: QualityLabel) {
  if (label === 'Needs Work') {
    return 'Fair';
  }

  if (label === 'Fail') {
    return 'Bad';
  }

  return label;
}

function RatingPill({ label }: { label: QualityLabel }) {
  return <span className={`pill ${qualityClass(label)}`}>{ratingLabel(label)}</span>;
}

function isApprovedQuality(label: QualityLabel) {
  return label === 'Excellent' || label === 'Good';
}

function getQualityAssessment(node: ConversationNode, area: QualityAssessment['area']) {
  return node.qualityAssessments.find((assessment) => assessment.area === area);
}

function ApprovalBadge({ label }: { label: QualityLabel }) {
  const approved = isApprovedQuality(label);
  const Icon = approved ? CheckCircle2 : XCircle;

  return (
    <span className={`approval-badge ${approved ? 'approved' : 'rejected'}`}>
      <Icon aria-hidden="true" />
      {approved ? 'Approved' : 'Rejected'}
    </span>
  );
}

function HumanDecisionControls({
  ariaLabel,
  decision = 'Pending',
  onChange,
}: {
  ariaLabel: string;
  decision?: ReviewDecision;
  onChange: (decision: ReviewDecision) => void;
}) {
  return (
    <div className="human-decision-controls" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className={`human-decision-button check ${decision === 'Approved' ? 'selected' : ''}`}
        aria-pressed={decision === 'Approved'}
        title="Check"
        onClick={() => onChange('Approved')}
      >
        <CheckCircle2 aria-hidden="true" />
        <span>Check</span>
      </button>
      <button
        type="button"
        className={`human-decision-button x ${decision === 'Rejected' ? 'selected' : ''}`}
        aria-pressed={decision === 'Rejected'}
        title="X"
        onClick={() => onChange('Rejected')}
      >
        <XCircle aria-hidden="true" />
        <span>X</span>
      </button>
    </div>
  );
}

function QualitySignal({ assessment }: { assessment?: QualityAssessment }) {
  if (!assessment) {
    return null;
  }

  return (
    <div className="quality-signal">
      <span className="quality-rationale">{assessment.rationale}</span>
    </div>
  );
}

function QueryListColumn({
  run,
  selectedSeedId,
  onSelectSeed,
}: {
  run: EvaluationRun;
  selectedSeedId: string;
  onSelectSeed: (seedId: string) => void;
}) {
  const queryItems = useMemo(
    () =>
      getRunSeeds(run).reduce<Array<{ seed: SeedQuery; rootNode: ConversationNode }>>(
        (items, seed) => {
          const rootNode = getSeedRootNode(run, seed.id);

          if (rootNode) {
            items.push({ seed, rootNode });
          }

          return items;
        },
        [],
      ),
    [run],
  );

  return (
    <aside className="panel detail-column query-list-column">
      <div className="section-heading compact">
        <h2>Queries</h2>
        <span>{queryItems.length}</span>
      </div>
      <div className="detail-query-list">
        {queryItems.map((item, index) => (
          <button
            key={item.seed.id}
            type="button"
            className={item.seed.id === selectedSeedId ? 'selected' : ''}
            onClick={() => onSelectSeed(item.seed.id)}
          >
            <span className="query-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.rootNode.query}</strong>
            <small>
              {formatMachineLabel(item.seed.category)} ·{' '}
              {formatMachineLabel(item.seed.expectedMediaType)}
            </small>
            <StatusPill label={seedStatusLabel(run, item.seed.id)} />
          </button>
        ))}
      </div>
    </aside>
  );
}

function ConversationTreeNavigator({
  nodes,
  selectedNode,
  onSelectNode,
}: {
  nodes: ConversationNode[];
  selectedNode: ConversationNode;
  onSelectNode: (nodeId: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [zoom, setZoom] = useState(0.86);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const map = useMemo(() => buildConversationMap(nodes, selectedNode), [nodes, selectedNode]);
  const selectedPathIds = useMemo(
    () => getAncestorNodeIds(selectedNode, map.nodesById),
    [map.nodesById, selectedNode],
  );
  const selectedItem = selectedNode.id ? map.itemById.get(selectedNode.id) : undefined;

  function updateZoom(nextZoom: number) {
    setZoom(Math.max(0.45, Math.min(1.45, nextZoom)));
  }

  function fitMapToView() {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const nextZoom = Math.min(
      1,
      (viewport.clientWidth - 32) / Math.max(map.mapWidth, 1),
      (viewport.clientHeight - 32) / Math.max(map.mapHeight, 1),
    );

    updateZoom(nextZoom);
    setPan({ x: 16, y: 16 });
  }

  function resetMapView() {
    setZoom(0.86);
    setPan({ x: 24, y: 24 });
  }

  function centerSelectedNode() {
    const viewport = viewportRef.current;

    if (!viewport || !selectedItem) {
      return;
    }

    setPan({
      x: viewport.clientWidth / 2 - (selectedItem.x + map.nodeWidth / 2) * zoom,
      y: viewport.clientHeight / 2 - (selectedItem.y + map.nodeHeight / 2) * zoom,
    });
  }

  function handleMapMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('.map-node, .map-control-button')) {
      return;
    }

    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handleMapMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    const start = panStartRef.current;

    if (!start) {
      return;
    }

    setPan({
      x: start.panX + event.clientX - start.x,
      y: start.panY + event.clientY - start.y,
    });
  }

  function endMapPan() {
    panStartRef.current = null;
  }

  return (
    <section className="conversation-map">
      <div className="section-heading compact map-heading">
        <div>
          <h3>Conversation Map</h3>
          <span>Depth 0-{maxConversationDepth}</span>
        </div>
        <div className="map-controls" aria-label="Conversation map controls">
          <button
            type="button"
            className="map-control-button"
            onClick={() => updateZoom(zoom + 0.12)}
            title="Zoom in"
          >
            <ZoomIn aria-hidden="true" />
          </button>
          <button
            type="button"
            className="map-control-button"
            onClick={() => updateZoom(zoom - 0.12)}
            title="Zoom out"
          >
            <ZoomOut aria-hidden="true" />
          </button>
          <button
            type="button"
            className="map-control-button"
            onClick={fitMapToView}
            title="Fit to view"
          >
            <Maximize2 aria-hidden="true" />
          </button>
          <button
            type="button"
            className="map-control-button"
            onClick={centerSelectedNode}
            title="Center selected node"
          >
            <Search aria-hidden="true" />
          </button>
          <button
            type="button"
            className="map-control-button"
            onClick={resetMapView}
            title="Reset zoom"
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="map-viewport"
        ref={viewportRef}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={endMapPan}
        onMouseUp={endMapPan}
      >
        <div
          className="map-canvas"
          style={{
            height: map.mapHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: map.mapWidth,
          }}
        >
          <svg
            className="map-edges"
            height={map.mapHeight}
            viewBox={`0 0 ${map.mapWidth} ${map.mapHeight}`}
            width={map.mapWidth}
          >
            {map.edges.map((edge) => {
              const from = map.itemById.get(edge.fromId);
              const to = map.itemById.get(edge.toId);

              if (!from || !to) {
                return null;
              }

              const x1 = from.x + map.nodeWidth;
              const y1 = from.y + map.nodeHeight / 2;
              const x2 = to.x;
              const y2 = to.y + map.nodeHeight / 2;
              const midX = x1 + Math.max(28, (x2 - x1) / 2);

              return (
                <path
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  key={edge.id}
                />
              );
            })}
          </svg>

          <div className="map-depth-headings">
            {map.depthGroups.map((items, depth) => (
              <div className="map-depth-heading" key={depth} style={{ left: depth * map.columnWidth }}>
                <strong>Depth {depth}</strong>
                <span>{conversationTurnLabel(depth)}</span>
                <small>{items.length} nodes</small>
              </div>
            ))}
          </div>

          {[...map.itemById.values()].map((item) => {
            const isAvailable = item.state === 'available' && item.nodeId;
            const isCurrent = item.nodeId === selectedNode.id;
            const isInSelectedPath = item.nodeId ? selectedPathIds.has(item.nodeId) : false;
            const isInFocusedBranch = item.nodeId ? map.focusPathNodeIds.has(item.nodeId) : false;
            const Icon = branchStateIcon(item.state);
            const className = [
              'map-node',
              item.state,
              isCurrent ? 'current' : '',
              isInSelectedPath && !isCurrent ? 'in-path' : '',
              isInFocusedBranch && !isCurrent && !isInSelectedPath ? 'focused-branch' : '',
            ]
              .filter(Boolean)
              .join(' ');
            const content = (
              <>
                <span className="tree-state">
                  <Icon aria-hidden="true" />
                  {isCurrent
                    ? 'Current'
                    : isInSelectedPath
                      ? 'Selected Path'
                      : isInFocusedBranch
                        ? 'Focused Branch'
                        : branchStateLabel(item.state)}
                </span>
                <strong>{item.label}</strong>
                <small>
                  Depth {item.depth} · {item.status}
                </small>
                <div className="map-node-footer">
                  {item.qualityLabel ? <QualityPill label={item.qualityLabel} /> : null}
                  <span>{item.childCount ? `${item.childCount} follow-ups` : 'No follow-ups'}</span>
                </div>
              </>
            );

            return isAvailable ? (
              <button
                key={item.id}
                type="button"
                className={className}
                onClick={() => item.nodeId && onSelectNode(item.nodeId)}
                style={{ left: item.x, top: item.y }}
              >
                {content}
              </button>
            ) : (
              <div className={className} key={item.id} style={{ left: item.x, top: item.y }}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
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
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
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
  const [copyReviews, setCopyReviews] = useState<CopyReviewMap>(() => ({
    ...initialCopyReviews(),
    ...(readStoredReviewState().copyReviews ?? {}),
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
    saveReviewState(qualityReviews, gateReviews, copyReviews);
  }, [qualityReviews, gateReviews, copyReviews]);

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

  function selectNode(nodeId: string) {
    const nextNode = nodeById[nodeId];

    if (nextNode) {
      setSelectedSeedId(nextNode.seedId);
      setSelectedRunId(nextNode.runId);
    }

    setSelectedNodeId(nodeId);
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

  function updateCopyReview(
    nodeId: string,
    target: CopyReviewTarget,
    mediaId: string | undefined,
    patch: Partial<CopyReviewMap[string]>,
  ) {
    const key = copyReviewKey(nodeId, target, mediaId);
    setCopyReviews((reviews) => ({
      ...reviews,
      [key]: {
        decision: reviews[key]?.decision ?? 'Pending',
        comment: reviews[key]?.comment ?? '',
        ...patch,
      },
    }));
  }

  return (
    <div className="app-shell">
      <div className="app-navigation">
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
      </div>

      <main>
        {activeTab === 'overview' ? (
          <OverviewView selectedRollup={selectedRollup} />
        ) : null}

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
            onOpenDetail={(node) => {
              if (node) {
                selectQuery(node);
              }
              setActiveTab('detail');
            }}
          />
        ) : null}

        {activeTab === 'detail' && selectedNode ? (
          <AutomatedDetailView
            run={selectedRun}
            rollup={selectedRollup}
            selectedSeedId={selectedSeed.id}
            selectedNode={selectedNode}
            onSelectSeed={selectSeed}
            onSelectNode={selectNode}
            onOpenReview={() => setActiveTab('review')}
          />
        ) : null}

        {activeTab === 'review' && selectedNode ? (
          <HumanReviewView
            run={selectedRun}
            node={selectedNode}
            copyReviews={copyReviews}
            gateReviews={gateReviews}
            onSelectSeed={selectSeed}
            onSelectNode={selectNode}
            onUpdateCopyReview={updateCopyReview}
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

function OverviewView({ selectedRollup }: { selectedRollup: RunRollup }) {
  const totalSavedNodes = evaluationRuns.reduce((count, run) => count + run.nodeIds.length, 0);
  const qualityAreaCount = Object.keys(selectedRollup.qualityByArea).length;

  return (
    <div className="view-grid overview-grid">
      <section className="summary-band overview-summary">
        <Metric
          label="Saved Runs"
          value={String(evaluationRuns.length)}
          icon={ClipboardCheck}
          tone="info"
        />
        <Metric
          label="Seed Queries"
          value={String(selectedRollup.seedCount)}
          icon={ListChecks}
          tone="positive"
        />
        <Metric
          label="Saved Nodes"
          value={String(totalSavedNodes)}
          icon={GitBranch}
          tone="warning"
        />
        <Metric
          label="Quality Areas"
          value={String(qualityAreaCount)}
          icon={Star}
          tone="neutral"
        />
      </section>

      <section className="panel overview-intro-panel">
        <div className="section-heading">
          <div>
            <h2>Project Overview</h2>
            <p>Conversational search quality, explained for product review.</p>
          </div>
          <StatusPill label="PRD-Backed" />
        </div>

        <div className="overview-copy">
          <p>
            This project is an internal evaluation dashboard for understanding conversational search
            quality across starter queries, automated follow-up paths, human review, and run-level
            trends.
          </p>
          <p>
            The current app is intentionally mock-driven: it uses fixture responses and TMDB
            prototype metadata so the product workflow can be reviewed before live search execution
            and production metadata integrations are available.
          </p>
        </div>

        <div className="overview-facts">
          {projectOverviewItems.map((item) => (
            <div className="overview-fact" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel prd-panel">
        <div className="section-heading">
          <div>
            <h2>Product Requirements Document</h2>
            <p>Rendered from docs/PRODUCT_BRIEF.md</p>
          </div>
          <StatusPill label="PRD" />
        </div>

        <ProductBriefDocument />
      </section>

      <section className="panel evaluation-scope-panel">
        <div className="section-heading">
          <div>
            <h2>Everything We Evaluate</h2>
            <p>Inputs, gates, quality scoring, paths, review, and reporting.</p>
          </div>
          <StatusPill label="Scope" />
        </div>

        <div className="evaluation-scope-list">
          {evaluationScopeGroups.map((group) => {
            const Icon = group.icon;

            return (
              <article className="evaluation-scope-card" key={group.title}>
                <div className="evaluation-scope-heading">
                  <span className="evaluation-scope-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.summary}</p>
                  </div>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ProductBriefDocument() {
  return (
    <article className="prd-document">
      {productBriefBlocks.map((block) => {
        if (block.type === 'heading') {
          if (block.level === 1) {
            return null;
          }

          if (block.level === 2) {
            return <h4 key={block.id}>{renderInlineMarkdown(block.text)}</h4>;
          }

          return <h5 key={block.id}>{renderInlineMarkdown(block.text)}</h5>;
        }

        if (block.type === 'list') {
          return (
            <ul key={block.id}>
              {block.items.map((item) => (
                <li key={item}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'quote') {
          return <blockquote key={block.id}>{renderInlineMarkdown(block.text)}</blockquote>;
        }

        return <p key={block.id}>{renderInlineMarkdown(block.text)}</p>;
      })}
    </article>
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
            label="Approved Stage 2 Areas"
            value={String(selectedRollup.approvedQualityChecks)}
            icon={CheckCircle2}
            tone="positive"
          />
          <Metric
            label="Rejected Stage 2 Areas"
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
  onOpenDetail: (node?: ConversationNode) => void;
}) {
  const queryNodes = getRunNodes(selectedRun);
  const starterNodes = queryNodes.filter((node) => node.depth === 0);
  const selectedNode = queryNodes.find((node) => node.id === selectedNodeId);
  const selectedStarterId =
    selectedNode?.depth === 0
      ? selectedNode.id
      : getSeedRootNode(selectedRun, selectedNode?.seedId ?? '')?.id;
  const selectedStarterNode =
    starterNodes.find((node) => node.id === selectedStarterId) ?? starterNodes[0];
  const seedQueryCount = starterNodes.length;
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
          label="Follow-Up Queries"
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
            <h2>Starter Query List</h2>
            <p>{selectedRun.label}</p>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => onOpenDetail(selectedStarterNode)}
            disabled={!selectedStarterNode}
          >
            <GitBranch aria-hidden="true" />
            Open Selected
          </button>
        </div>

        <div className="query-list">
          {starterNodes.map((node, index) => {
            const seed = seedById[node.seedId];
            const status = seedStatusLabel(selectedRun, node.seedId);

            return (
              <button
                key={node.id}
                type="button"
                className={`query-row ${node.id === selectedStarterNode?.id ? 'selected' : ''}`}
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
                  <span className="query-chip">First Query</span>
                  <span className="query-chip">{formatMachineLabel(seed.category)}</span>
                  <span className="query-chip">{formatMachineLabel(seed.expectedMediaType)}</span>
                </span>
                <span className="query-phase before">Initial</span>
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
  const searchResultsAssessment = getQualityAssessment(selectedNode, 'Search Results');
  const blurbAssessment = getQualityAssessment(selectedNode, 'Blurb');
  const customDescriptionsAssessment = getQualityAssessment(selectedNode, 'Custom Descriptions');
  const followUpAssessment = getQualityAssessment(selectedNode, 'Follow-Up Suggestions');

  return (
    <div className="view-grid detail-grid detail-four-column">
      <QueryListColumn
        run={run}
        selectedSeedId={selectedSeedId}
        onSelectSeed={onSelectSeed}
      />

      <section className="panel detail-column conversation-column">
        <div className="section-heading">
          <div>
            <h2>Conversation</h2>
            <p>{selectedNode.path.join(' / ')}</p>
          </div>
          <StatusPill label={queryStatusLabel(selectedNode)} />
        </div>

        <ConversationTreeNavigator
          nodes={seedNodes}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
        />
      </section>

      <section className="panel detail-column results-column">
        <div className="section-heading">
          <div>
            <h2>Search Results</h2>
            <p>{selectedNode.query}</p>
          </div>
          {searchResultsAssessment ? <QualityPill label={searchResultsAssessment.label} /> : null}
        </div>
        {searchResultsAssessment ? <QualitySignal assessment={searchResultsAssessment} /> : null}

        <div className="result-strip">
          {selectedNode.resultSet.map((resultItem) => {
            const media = mediaById[resultItem.mediaId];
            if (!media) {
              return null;
            }

            return (
              <article className="title-tile" key={resultItem.mediaId}>
                <MediaPoster mediaId={resultItem.mediaId} />
                <div className="title-summary">
                  <span className="rank">Position #{resultItem.rank}</span>
                  <h3>{media.title}</h3>
                  <p>{media.year} · {media.runtimeLabel}</p>
                </div>
                <div className="result-judgment-list">
                  <div className="result-judgment-card">
                    <div>
                      <span className="result-judgment-label">Result title + position</span>
                      <strong>#{resultItem.rank} · {media.title}</strong>
                    </div>
                    <div className="result-judgment-actions">
                      <span className="result-judgment-meta">Rating</span>
                      <RatingPill label={resultItem.relevance} />
                    </div>
                  </div>

                  <div className="result-judgment-card">
                    <div>
                      <span className="result-judgment-label">Title blurb</span>
                      <p className="title-custom-description">
                        {selectedNode.customDescriptions[resultItem.mediaId]}
                      </p>
                    </div>
                    {customDescriptionsAssessment ? (
                      <div className="result-judgment-actions">
                        <span className="result-judgment-meta">Approval</span>
                        <ApprovalBadge label={customDescriptionsAssessment.label} />
                        <span className="result-judgment-meta">Rating</span>
                        <RatingPill label={customDescriptionsAssessment.label} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel detail-column judgment-column">
        <div className="section-heading">
          <div>
            <h2>AI Judgment</h2>
            <p>{selectedNode.metadataSource} metadata · {run.querySetVersion}</p>
          </div>
          <button className="primary-action" type="button" onClick={onOpenReview}>
            <UserCheck aria-hidden="true" />
            Review
          </button>
        </div>

        <section className="blurb-block judgment-blurb">
          <div className="content-heading">
            <div>
              <h3>AI Blurb</h3>
              <QualitySignal assessment={blurbAssessment} />
            </div>
            {blurbAssessment ? (
              <div className="content-heading-actions">
                <ApprovalBadge label={blurbAssessment.label} />
                <QualityPill label={blurbAssessment.label} />
              </div>
            ) : null}
          </div>
          <p>{selectedNode.blurb}</p>
        </section>

        <section className="judgment-section">
          <div className="content-heading">
            <h3>Quality Scores</h3>
          </div>
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
        </section>

        <section className="judgment-section">
          <div className="content-heading">
            <h3>Correctness Gates</h3>
          </div>
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
        </section>

        <section className="judgment-section">
          <div className="content-heading">
            <div>
              <h3>Follow-Up Suggestions</h3>
              <QualitySignal assessment={followUpAssessment} />
            </div>
            {followUpAssessment ? <QualityPill label={followUpAssessment.label} /> : null}
          </div>
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
        </section>

        <section className="metadata-box run-context">
          <div className="section-heading compact">
            <h3>Run Context</h3>
            <StatusPill label={rollup.status} />
          </div>
          <div className="context-metrics">
            <Metric label="Nodes" value={String(rollup.nodeCount)} icon={GitBranch} tone="info" />
            <Metric
              label="Stage 1"
              value={`${rollup.stage1FailureRate}%`}
              icon={CircleAlert}
              tone={rollup.stage1FailureRate ? 'warning' : 'positive'}
            />
          </div>
        </section>
      </aside>
    </div>
  );
}

function HumanReviewView({
  run,
  node,
  copyReviews,
  gateReviews,
  onSelectSeed,
  onSelectNode,
  onUpdateCopyReview,
  onUpdateGateReview,
  onUpdateQualityReview,
}: {
  run: EvaluationRun;
  node: ConversationNode;
  copyReviews: CopyReviewMap;
  gateReviews: GateReviewMap;
  onSelectSeed: (seedId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onUpdateCopyReview: (
    nodeId: string,
    target: CopyReviewTarget,
    mediaId: string | undefined,
    patch: Partial<CopyReviewMap[string]>,
  ) => void;
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
  const siblingNodes = getSeedNodes(run, node.seedId);
  const blurbReview = copyReviews[copyReviewKey(node.id, 'blurb')];

  function updateBlurbJudgment(patch: Partial<CopyReviewMap[string]>) {
    onUpdateCopyReview(node.id, 'blurb', undefined, patch);

    if (patch.decision) {
      onUpdateQualityReview(node.id, 'Blurb', { decision: patch.decision });
    }

    if (typeof patch.comment === 'string') {
      onUpdateQualityReview(node.id, 'Blurb', { comment: patch.comment });
    }
  }

  function descriptionAggregateDecision(mediaId: string, nextDecision: ReviewDecision) {
    const decisions = node.resultSet.map((resultItem) => {
      if (resultItem.mediaId === mediaId) {
        return nextDecision;
      }

      return (
        copyReviews[copyReviewKey(node.id, 'title-description', resultItem.mediaId)]?.decision ??
        'Pending'
      );
    });

    if (decisions.includes('Rejected')) {
      return 'Rejected';
    }

    if (decisions.every((decision) => decision === 'Approved')) {
      return 'Approved';
    }

    return 'Pending';
  }

  function searchResultsAggregateDecision(decisionOverrides: Record<string, ReviewDecision>) {
    const decisions = node.resultSet.flatMap((resultItem) => {
      const validityKey = copyReviewKey(node.id, 'result-validity', resultItem.mediaId);
      const positionKey = copyReviewKey(node.id, 'result-position', resultItem.mediaId);

      return [
        decisionOverrides[validityKey] ??
          copyReviews[validityKey]?.decision ??
          'Pending',
        decisionOverrides[positionKey] ??
          copyReviews[positionKey]?.decision ??
          'Pending',
      ];
    });

    if (decisions.includes('Rejected')) {
      return 'Rejected';
    }

    if (decisions.length > 0 && decisions.every((decision) => decision === 'Approved')) {
      return 'Approved';
    }

    return 'Pending';
  }

  function followUpSuggestionsAggregateDecision(
    suggestionId: string,
    nextDecision: ReviewDecision,
  ) {
    const decisions = node.followUps.map((followUp) => {
      if (followUp.id === suggestionId) {
        return nextDecision;
      }

      return (
        copyReviews[copyReviewKey(node.id, 'follow-up-suggestion', followUp.id)]?.decision ??
        'Pending'
      );
    });

    if (decisions.includes('Rejected')) {
      return 'Rejected';
    }

    if (decisions.length > 0 && decisions.every((decision) => decision === 'Approved')) {
      return 'Approved';
    }

    return 'Pending';
  }

  function updateResultValidityJudgment(mediaId: string, decision: ReviewDecision) {
    const key = copyReviewKey(node.id, 'result-validity', mediaId);

    onUpdateCopyReview(node.id, 'result-validity', mediaId, { decision });
    onUpdateQualityReview(node.id, 'Search Results', {
      decision: searchResultsAggregateDecision({ [key]: decision }),
    });
  }

  function updateResultPositionJudgment(mediaId: string, currentRank: number, position: number) {
    const key = copyReviewKey(node.id, 'result-position', mediaId);
    const decision = position === currentRank ? 'Approved' : 'Rejected';

    onUpdateCopyReview(node.id, 'result-position', mediaId, { decision, position });
    onUpdateQualityReview(node.id, 'Search Results', {
      decision: searchResultsAggregateDecision({ [key]: decision }),
    });
  }

  function updateResultPositionDecision(
    mediaId: string,
    currentRank: number,
    decision: ReviewDecision,
  ) {
    const key = copyReviewKey(node.id, 'result-position', mediaId);
    const position =
      decision === 'Approved' ? currentRank : copyReviews[key]?.position ?? currentRank;

    onUpdateCopyReview(node.id, 'result-position', mediaId, { decision, position });
    onUpdateQualityReview(node.id, 'Search Results', {
      decision: searchResultsAggregateDecision({ [key]: decision }),
    });
  }

  function updateTitleDescriptionJudgment(
    mediaId: string,
    patch: Partial<CopyReviewMap[string]>,
  ) {
    onUpdateCopyReview(node.id, 'title-description', mediaId, patch);

    if (patch.decision) {
      onUpdateQualityReview(node.id, 'Custom Descriptions', {
        decision: descriptionAggregateDecision(mediaId, patch.decision),
      });
    }
  }

  function updateFollowUpSuggestionJudgment(
    suggestionId: string,
    patch: Partial<CopyReviewMap[string]>,
  ) {
    onUpdateCopyReview(node.id, 'follow-up-suggestion', suggestionId, patch);

    if (patch.decision) {
      onUpdateQualityReview(node.id, 'Follow-Up Suggestions', {
        decision: followUpSuggestionsAggregateDecision(suggestionId, patch.decision),
      });
    }
  }

  return (
    <div className="view-grid detail-grid detail-four-column human-review-detail-grid">
      <QueryListColumn
        run={run}
        selectedSeedId={node.seedId}
        onSelectSeed={onSelectSeed}
      />

      <section className="panel detail-column conversation-column">
        <div className="section-heading">
          <div>
            <h2>Conversation</h2>
            <p>{node.path.join(' / ')}</p>
          </div>
          <StatusPill label={queryStatusLabel(node)} />
        </div>

        <ConversationTreeNavigator
          nodes={siblingNodes}
          selectedNode={node}
          onSelectNode={onSelectNode}
        />
      </section>

      <section className="panel detail-column results-column human-results-column">
        <div className="section-heading">
          <div>
            <h2>Search Results</h2>
            <p>{node.query}</p>
          </div>
          <StatusPill label="Human Review" />
        </div>

        <div className="result-strip">
          {node.resultSet.map((resultItem) => {
            const media = mediaById[resultItem.mediaId];
            const descriptionReview =
              copyReviews[copyReviewKey(node.id, 'title-description', resultItem.mediaId)];
            const resultValidityReview =
              copyReviews[copyReviewKey(node.id, 'result-validity', resultItem.mediaId)];
            const resultPositionReview =
              copyReviews[copyReviewKey(node.id, 'result-position', resultItem.mediaId)];
            const commentId = `${node.id}-${resultItem.mediaId}-description-comment`;
            const positionSelectId = `${node.id}-${resultItem.mediaId}-position-select`;

            if (!media) {
              return null;
            }

            return (
              <article className="title-tile human-title-tile" key={resultItem.mediaId}>
                <MediaPoster mediaId={resultItem.mediaId} />
                <div className="title-summary">
                  <div className="rank-review-row">
                    <span className="rank">Position #{resultItem.rank}</span>
                    <div className="result-fit-review">
                      <span className="result-judgment-meta">Valid result</span>
                      <HumanDecisionControls
                        ariaLabel={`${media.title} result validity judgment`}
                        decision={resultValidityReview?.decision ?? 'Pending'}
                        onChange={(decision) =>
                          updateResultValidityJudgment(resultItem.mediaId, decision)
                        }
                      />
                    </div>
                  </div>
                  <h3>{media.title}</h3>
                  <p>{media.year} · {media.runtimeLabel}</p>
                  <div className="position-review-row">
                    <div className="position-review-header">
                      <label htmlFor={positionSelectId}>Correct position</label>
                      <HumanDecisionControls
                        ariaLabel={`${media.title} rank position judgment`}
                        decision={resultPositionReview?.decision ?? 'Pending'}
                        onChange={(decision) =>
                          updateResultPositionDecision(
                            resultItem.mediaId,
                            resultItem.rank,
                            decision,
                          )
                        }
                      />
                    </div>
                    <select
                      id={positionSelectId}
                      value={resultPositionReview?.position ?? resultItem.rank}
                      onChange={(event) =>
                        updateResultPositionJudgment(
                          resultItem.mediaId,
                          resultItem.rank,
                          Number(event.target.value),
                        )
                      }
                    >
                      {node.resultSet.map((positionItem) => (
                        <option key={positionItem.mediaId} value={positionItem.rank}>
                          Position #{positionItem.rank}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="metadata-tags">
                    <span>
                      <MediaTypeIcon type={media.mediaType} />
                      {media.mediaType}
                    </span>
                    <span>TMDB {media.voteAverage.toFixed(1)}</span>
                  </div>
                </div>
                <div className="result-judgment-list">
                  <div className="result-judgment-card">
                    <div>
                      <span className="result-judgment-label">Result title + position</span>
                      <strong>#{resultItem.rank} · {media.title}</strong>
                    </div>
                    <div className="result-judgment-actions">
                      <span className="result-judgment-meta">Source</span>
                      <a
                        className="icon-link"
                        href={tmdbTitleUrl(media.mediaType, media.tmdbId)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open on TMDB"
                      >
                        <ExternalLink aria-hidden="true" />
                      </a>
                    </div>
                  </div>

                  <div className="result-judgment-card human-description-card">
                    <div className="human-copy-content">
                      <span className="result-judgment-label">AI custom blurb</span>
                      <p className="title-custom-description">
                        {node.customDescriptions[resultItem.mediaId]}
                      </p>
                      <div className="result-judgment-actions">
                        <span className="result-judgment-meta">Human judgment</span>
                        <HumanDecisionControls
                          ariaLabel={`${media.title} custom blurb judgment`}
                          decision={descriptionReview?.decision ?? 'Pending'}
                          onChange={(decision) =>
                            updateTitleDescriptionJudgment(resultItem.mediaId, { decision })
                          }
                        />
                      </div>
                    </div>
                    <div className="review-comment result-comment">
                      <label htmlFor={commentId}>Commentary</label>
                      <textarea
                        id={commentId}
                        value={descriptionReview?.comment ?? ''}
                        onChange={(event) =>
                          updateTitleDescriptionJudgment(resultItem.mediaId, {
                            comment: event.target.value,
                          })
                        }
                        placeholder="Add commentary"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel detail-column judgment-column human-judgment-column">
        <div className="section-heading">
          <div>
            <h2>Human Judgment</h2>
            <p>{node.metadataSource} metadata · {run.querySetVersion}</p>
          </div>
          <StatusPill label="Needs Review" />
        </div>

        <section className="blurb-block judgment-blurb human-review-block">
          <div className="content-heading">
            <div>
              <h3>Conversation Blurb</h3>
            </div>
            <HumanDecisionControls
              ariaLabel="Conversation blurb judgment"
              decision={blurbReview?.decision ?? 'Pending'}
              onChange={(decision) => updateBlurbJudgment({ decision })}
            />
          </div>
          <p>{node.blurb}</p>
          <div className="review-comment">
            <label htmlFor={`${node.id}-blurb-comment`}>Commentary</label>
            <textarea
              id={`${node.id}-blurb-comment`}
              value={blurbReview?.comment ?? ''}
              onChange={(event) => updateBlurbJudgment({ comment: event.target.value })}
              placeholder="Add commentary"
            />
          </div>
        </section>

        <section className="judgment-section">
          <div className="content-heading">
            <h3>Correctness Gates</h3>
          </div>
          <div className="review-form-list">
            {node.stage1Findings.map((finding) => {
              const review = gateReviews[gateReviewKey(node.id, finding.id)];
              const decisions: GateDecision[] =
                finding.outcome === 'Fail'
                  ? ['Open', 'Acknowledged', 'False Positive']
                  : ['Open', 'Acknowledged'];

              return (
                <article className="gate-form compact-gate-form" key={finding.id}>
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

        <section className="judgment-section">
          <div className="content-heading">
            <h3>Follow-Up Suggestions</h3>
          </div>
          <div className="follow-up-review-list">
            {node.followUps.length ? (
              node.followUps.map((followUp) => {
                const review =
                  copyReviews[copyReviewKey(node.id, 'follow-up-suggestion', followUp.id)];
                const commentId = `${node.id}-${followUp.id}-follow-up-comment`;

                return (
                  <article className="follow-up-review-card" key={followUp.id}>
                    <div className="follow-up-review-heading">
                      <div>
                        <span className="result-judgment-label">AI follow-up suggestion</span>
                        <strong>
                          <MessageSquareText aria-hidden="true" />
                          {followUp.text}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="icon-link"
                        onClick={() => followUp.targetNodeId && onSelectNode(followUp.targetNodeId)}
                        disabled={!followUp.targetNodeId}
                        title="Open response"
                        aria-label={`Open ${followUp.text} response`}
                      >
                        <ChevronRight aria-hidden="true" />
                      </button>
                    </div>
                    <div className="result-judgment-actions">
                      <span className="result-judgment-meta">Human judgment</span>
                      <HumanDecisionControls
                        ariaLabel={`${followUp.text} follow-up suggestion judgment`}
                        decision={review?.decision ?? 'Pending'}
                        onChange={(decision) =>
                          updateFollowUpSuggestionJudgment(followUp.id, { decision })
                        }
                      />
                    </div>
                    <div className="review-comment">
                      <label htmlFor={commentId}>Commentary</label>
                      <textarea
                        id={commentId}
                        value={review?.comment ?? ''}
                        onChange={(event) =>
                          updateFollowUpSuggestionJudgment(followUp.id, {
                            comment: event.target.value,
                          })
                        }
                        placeholder="Add commentary"
                      />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">No follow-up suggestions</div>
            )}
          </div>
        </section>
      </aside>
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
