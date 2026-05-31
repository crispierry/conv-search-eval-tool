import type {
  ConversationNode,
  EvaluationRun,
  FollowUpSuggestion,
  QualityAssessment,
  SearchResult,
  SeedQuery,
  Stage1Finding,
} from '../types';

const starterQueryText = {
  smartScifi: "I'm looking for smart sci-fi movies that are emotional but not too bleak",
  keanuAction: 'What are some Keanu Reeves action movies with clever stories?',
  workplaceMystery: 'Can you recommend unsettling mystery shows set around a workplace or institution?',
} as const;

export const seedQueries: SeedQuery[] = [
  {
    id: 'seed-smart-scifi',
    query: starterQueryText.smartScifi,
    category: 'mood',
    expectedMediaType: 'movie',
    expectedResultCount: { min: 7, max: 7 },
    constraints: ['movie results', 'science fiction', 'emotionally resonant'],
    goldenSet: ['tmdb-movie-329865', 'tmdb-movie-157336'],
    notes: 'Mood-led query where ranking and blurb usefulness matter.',
  },
  {
    id: 'seed-keanu-action',
    query: starterQueryText.keanuAction,
    category: 'cast',
    expectedMediaType: 'movie',
    expectedResultCount: { min: 7, max: 7 },
    constraints: ['movie results', 'cast includes Keanu Reeves', 'action tone'],
    goldenSet: ['tmdb-movie-603', 'tmdb-movie-245891'],
    notes: 'Cast constraint should be strict across every returned result.',
  },
  {
    id: 'seed-workplace-mystery',
    query: starterQueryText.workplaceMystery,
    category: 'compound',
    expectedMediaType: 'series',
    expectedResultCount: { min: 7, max: 7 },
    constraints: ['series results', 'mystery or thriller tone', 'workplace or institution setting'],
    goldenSet: ['tmdb-tv-95396', 'tmdb-tv-62560'],
    notes: 'Compound intent where the tool should spot partial-but-weak matches.',
  },
];

const passFinding = (
  id: string,
  title: string,
  message: string,
  evidence: string,
): Stage1Finding => ({
  id,
  outcome: 'Pass',
  title,
  scope: 'Node',
  message,
  evidence,
  source: 'TMDB',
});

const warningFinding = (
  id: string,
  title: string,
  message: string,
  evidence: string,
  mediaId?: string,
): Stage1Finding => ({
  id,
  outcome: 'Warning',
  title,
  scope: mediaId ? 'Result' : 'Node',
  message,
  evidence,
  source: 'TMDB',
  mediaId,
});

const failFinding = (
  id: string,
  title: string,
  message: string,
  evidence: string,
  mediaId?: string,
): Stage1Finding => ({
  id,
  outcome: 'Fail',
  title,
  scope: mediaId ? 'Result' : 'Node',
  message,
  evidence,
  source: 'TMDB',
  mediaId,
});

const result = (
  mediaId: string,
  rank: number,
  relevance: SearchResult['relevance'],
  expected: string,
  actual: string,
): SearchResult => ({
  mediaId,
  rank,
  relevance,
  metadataChecks: [
    {
      id: `${mediaId}-media-type`,
      outcome: actual.includes(expected) ? 'Pass' : 'Warning',
      field: 'media type and intent',
      expected,
      actual,
      source: 'TMDB',
      mediaId,
    },
  ],
});

const quality = (
  area: QualityAssessment['area'],
  label: QualityAssessment['label'],
  rationale: string,
): QualityAssessment => ({ area, label, rationale });

const followUp = (
  id: string,
  text: string,
  type: FollowUpSuggestion['type'],
  patternKey: string,
  targetNodeId?: string,
): FollowUpSuggestion => ({ id, text, type, patternKey, targetNodeId });

const targetResultCount = 7;

type ResultBackfill = {
  mediaId: string;
  relevance: SearchResult['relevance'];
  actual: string;
  description: string;
};

const smartScifiBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-329865',
    relevance: 'Excellent',
    actual: 'movie, science fiction, emotional drama',
    description: 'Arrival leads with language, grief, and first contact rather than spectacle.',
  },
  {
    mediaId: 'tmdb-movie-157336',
    relevance: 'Excellent',
    actual: 'movie, science fiction, family drama',
    description: 'Interstellar pairs cosmic scale with a clear emotional through-line.',
  },
  {
    mediaId: 'tmdb-movie-152601',
    relevance: 'Good',
    actual: 'movie, science fiction romance',
    description: 'Her keeps the speculative premise intimate and reflective.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Good',
    actual: 'movie, science fiction adventure',
    description: 'Dune is epic, but its family and destiny stakes keep it grounded.',
  },
  {
    mediaId: 'tmdb-movie-300668',
    relevance: 'Good',
    actual: 'movie, cerebral science fiction horror',
    description: 'Annihilation brings a quieter, unsettling kind of wonder.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Good',
    actual: 'movie, reflective science fiction drama',
    description: 'Blade Runner 2049 is moody and cerebral, with emotional stakes under the noir shell.',
  },
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Needs Work',
    actual: 'movie, science fiction action',
    description: 'The Matrix is smart sci-fi, though more action-forward than the mood asks.',
  },
  {
    mediaId: 'tmdb-movie-604',
    relevance: 'Needs Work',
    actual: 'movie, science fiction action sequel',
    description: 'The Matrix Reloaded keeps the ideas big but is a less emotional fit.',
  },
];

const newerScifiBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-693134',
    relevance: 'Good',
    actual: 'movie, 2024 science fiction',
    description: 'Dune: Part Two is the newest large-scale continuation in the set.',
  },
  {
    mediaId: 'tmdb-movie-670292',
    relevance: 'Good',
    actual: 'movie, 2023 science fiction',
    description: 'The Creator adds recent AI conflict with a human emotional center.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Good',
    actual: 'movie, 2021 science fiction',
    description: 'Dune gives the newest high-profile option in the set.',
  },
  {
    mediaId: 'tmdb-movie-577922',
    relevance: 'Good',
    actual: 'movie, 2020 science fiction thriller',
    description: 'Tenet is recent, clever, and more puzzle-driven than emotional.',
  },
  {
    mediaId: 'tmdb-movie-300668',
    relevance: 'Good',
    actual: 'movie, 2018 science fiction',
    description: 'Annihilation is recent, cerebral, and eerie.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Good',
    actual: 'movie, 2017 science fiction',
    description: 'Blade Runner 2049 keeps the reflective tone with a more recent release date.',
  },
  {
    mediaId: 'tmdb-movie-329865',
    relevance: 'Good',
    actual: 'movie, 2016 science fiction',
    description: 'Arrival is slightly older than the rest but still inside the newer window.',
  },
];

const baselineScifiBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-157336',
    relevance: 'Good',
    actual: 'movie, science fiction',
    description: 'A space movie with emotion.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Good',
    actual: 'movie, science fiction',
    description: 'A futuristic movie with mystery.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Good',
    actual: 'movie, science fiction',
    description: 'A large-scale sci-fi adventure.',
  },
  {
    mediaId: 'tmdb-movie-577922',
    relevance: 'Good',
    actual: 'movie, science fiction',
    description: 'A twisty time-bending action movie.',
  },
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Good',
    actual: 'movie, science fiction action',
    description: 'A famous simulated-reality action movie.',
  },
  {
    mediaId: 'tmdb-movie-670292',
    relevance: 'Good',
    actual: 'movie, science fiction action',
    description: 'A recent AI war movie.',
  },
  {
    mediaId: 'tmdb-movie-300668',
    relevance: 'Good',
    actual: 'movie, science fiction horror',
    description: 'A strange science fiction thriller.',
  },
];

const keanuBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Excellent',
    actual: 'movie, Keanu Reeves cast, action sci-fi',
    description: 'The Matrix is the strongest clever-action match and includes Keanu Reeves.',
  },
  {
    mediaId: 'tmdb-movie-245891',
    relevance: 'Excellent',
    actual: 'movie, Keanu Reeves cast, action thriller',
    description: 'John Wick adds precise action craft with Keanu in the lead.',
  },
  {
    mediaId: 'tmdb-movie-604',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, action sci-fi',
    description: 'The Matrix Reloaded keeps the same cast and action-forward premise.',
  },
  {
    mediaId: 'tmdb-movie-1637',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, action thriller',
    description: 'Speed is a clean Keanu action match with a clever pressure-cooker premise.',
  },
  {
    mediaId: 'tmdb-movie-1089',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, action thriller',
    description: 'Point Break adds undercover tension and kinetic action with Keanu in the lead.',
  },
  {
    mediaId: 'tmdb-movie-561',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, supernatural action',
    description: 'Constantine is more occult than cerebral, but it keeps Keanu in action mode.',
  },
  {
    mediaId: 'tmdb-movie-605',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, action sci-fi sequel',
    description: 'The Matrix Revolutions keeps the sci-fi action thread but is another sequel.',
  },
  {
    mediaId: 'tmdb-movie-9886',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, science fiction action',
    description: 'Johnny Mnemonic fits the sci-fi/action metadata, but is a rougher quality match.',
  },
  {
    mediaId: 'tmdb-movie-64686',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, fantasy action',
    description: '47 Ronin has Keanu and action, though it is less clever and less modern.',
  },
];

const keanuScifiBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Excellent',
    actual: 'movie, Keanu Reeves cast, science fiction action',
    description: 'The Matrix remains the best match for clever sci-fi action.',
  },
  {
    mediaId: 'tmdb-movie-604',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, science fiction action',
    description: 'The Matrix Reloaded fits the sci-fi action request, with a sequel caveat.',
  },
  {
    mediaId: 'tmdb-movie-605',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, science fiction action sequel',
    description: 'The Matrix Revolutions keeps the sci-fi action franchise in scope.',
  },
  {
    mediaId: 'tmdb-movie-9886',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, science fiction action',
    description: 'Johnny Mnemonic fits the metadata but is a shakier recommendation.',
  },
  {
    mediaId: 'tmdb-movie-561',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, supernatural action',
    description: 'Constantine has Keanu and action, but the sci-fi fit is adjacent.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Fail',
    actual: 'movie, science fiction action without Keanu Reeves',
    description: 'Blade Runner 2049 is cerebral sci-fi action but misses the actor constraint.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Fail',
    actual: 'movie, science fiction action without Keanu Reeves',
    description: 'Dune broadens into sci-fi action but does not include Keanu Reeves.',
  },
];

const keanuOriginalBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Excellent',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'The Matrix is an original title and the best clever-action fit.',
  },
  {
    mediaId: 'tmdb-movie-245891',
    relevance: 'Excellent',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'John Wick is an original title with a clear action focus.',
  },
  {
    mediaId: 'tmdb-movie-1637',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'Speed is an original, high-concept action match.',
  },
  {
    mediaId: 'tmdb-movie-1089',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'Point Break keeps the original-film filter and adds undercover action.',
  },
  {
    mediaId: 'tmdb-movie-561',
    relevance: 'Good',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'Constantine is original and action-led, though more supernatural than clever.',
  },
  {
    mediaId: 'tmdb-movie-9886',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, original film',
    description: 'Johnny Mnemonic is original and sci-fi/action, but weaker as a quality match.',
  },
  {
    mediaId: 'tmdb-movie-64686',
    relevance: 'Needs Work',
    actual: 'movie, Keanu Reeves cast, original film',
    description: '47 Ronin is original and action-oriented, but less aligned with the clever ask.',
  },
];

const baselineKeanuBackfill: ResultBackfill[] = [
  ...keanuBackfill.filter((item) => item.mediaId !== 'tmdb-movie-245891'),
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Fail',
    actual: 'movie, no Keanu Reeves cast match',
    description: 'Dune is stylish sci-fi action.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Fail',
    actual: 'movie, no Keanu Reeves cast match',
    description: 'Blade Runner 2049 is moody sci-fi action.',
  },
];

const workplaceBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-tv-95396',
    relevance: 'Excellent',
    actual: 'series, workplace mystery',
    description: 'Severance is the clearest workplace mystery match.',
  },
  {
    mediaId: 'tmdb-tv-62560',
    relevance: 'Good',
    actual: 'series, institutional thriller',
    description: 'Mr. Robot uses workplaces and systems as pressure points.',
  },
  {
    mediaId: 'tmdb-tv-80335',
    relevance: 'Good',
    actual: 'series, institutional mystery thriller',
    description: 'Homecoming has a clinical workplace mystery with buried institutional motives.',
  },
  {
    mediaId: 'tmdb-tv-63646',
    relevance: 'Good',
    actual: 'series, workplace-adjacent spy thriller',
    description: 'Counterpart starts from an office-like agency and opens into paranoid sci-fi.',
  },
  {
    mediaId: 'tmdb-tv-66276',
    relevance: 'Good',
    actual: 'series, institutional crime mystery',
    description: 'The Night Of shifts the institution to the justice system while keeping the dread.',
  },
  {
    mediaId: 'tmdb-tv-54344',
    relevance: 'Good',
    actual: 'series, mystery drama',
    description: 'The Leftovers brings unsettling mystery, though less workplace structure.',
  },
  {
    mediaId: 'tmdb-tv-70523',
    relevance: 'Good',
    actual: 'series, mystery thriller',
    description: 'Dark is strong on mystery and dread, but less workplace-specific.',
  },
  {
    mediaId: 'tmdb-tv-66732',
    relevance: 'Needs Work',
    actual: 'series, mystery but weaker workplace fit',
    description: 'Stranger Things is eerie and serialized, though its workplace fit is weak.',
  },
  {
    mediaId: 'tmdb-tv-1396',
    relevance: 'Needs Work',
    actual: 'series, crime drama not workplace mystery',
    description: 'Breaking Bad is grounded crime drama but misses the workplace mystery intent.',
  },
];

const baselineWorkplaceBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-tv-66732',
    relevance: 'Needs Work',
    actual: 'series, mystery but weak workplace fit',
    description: 'A supernatural mystery with teen characters.',
  },
  {
    mediaId: 'tmdb-tv-70523',
    relevance: 'Good',
    actual: 'series, mystery thriller',
    description: 'A dense mystery with a dark tone.',
  },
  {
    mediaId: 'tmdb-tv-1396',
    relevance: 'Needs Work',
    actual: 'series, crime drama',
    description: 'A serious crime drama with high tension.',
  },
  {
    mediaId: 'tmdb-tv-80335',
    relevance: 'Good',
    actual: 'series, mystery thriller',
    description: 'A paranoid thriller with secrets.',
  },
  {
    mediaId: 'tmdb-tv-63646',
    relevance: 'Good',
    actual: 'series, science fiction thriller',
    description: 'A twisty parallel-world spy story.',
  },
  {
    mediaId: 'tmdb-tv-66276',
    relevance: 'Good',
    actual: 'series, crime mystery',
    description: 'A dark legal mystery.',
  },
  {
    mediaId: 'tmdb-tv-54344',
    relevance: 'Good',
    actual: 'series, mystery drama',
    description: 'A somber mystery drama.',
  },
];

function resultBackfillFor(node: ConversationNode) {
  if (node.id === 'node-current-scifi-newer') {
    return newerScifiBackfill;
  }

  if (node.id === 'node-current-keanu-scifi') {
    return keanuScifiBackfill;
  }

  if (node.id === 'node-current-keanu-no-sequels') {
    return keanuOriginalBackfill;
  }

  if (node.runId === 'run-baseline' && node.seedId === 'seed-smart-scifi') {
    return baselineScifiBackfill;
  }

  if (node.runId === 'run-baseline' && node.seedId === 'seed-keanu-action') {
    return baselineKeanuBackfill;
  }

  if (node.runId === 'run-baseline' && node.seedId === 'seed-workplace-mystery') {
    return baselineWorkplaceBackfill;
  }

  if (node.seedId === 'seed-keanu-action') {
    return keanuBackfill;
  }

  if (node.seedId === 'seed-workplace-mystery') {
    return workplaceBackfill;
  }

  return smartScifiBackfill;
}

function expectedMediaTypeFor(node: ConversationNode) {
  const expected = seedQueries.find((seed) => seed.id === node.seedId)?.expectedMediaType;
  return expected === 'series' ? 'series' : 'movie';
}

function withSevenResults(node: ConversationNode): ConversationNode {
  const baseResults = node.resultSet.slice(0, targetResultCount);
  const existingIds = new Set(baseResults.map((item) => item.mediaId));
  const backfill = resultBackfillFor(node);
  const expected = expectedMediaTypeFor(node);
  const additions = backfill
    .filter((item) => !existingIds.has(item.mediaId))
    .slice(0, Math.max(0, targetResultCount - baseResults.length))
    .map((item, index) =>
      result(item.mediaId, baseResults.length + index + 1, item.relevance, expected, item.actual),
    );
  const customDescriptions = Object.fromEntries(
    backfill.map((item) => [item.mediaId, item.description]),
  );

  return {
    ...node,
    resultSet: [...baseResults, ...additions],
    customDescriptions: {
      ...customDescriptions,
      ...node.customDescriptions,
    },
  };
}

const conversationNodeFixtures: ConversationNode[] = [
  {
    id: 'node-current-scifi-root',
    seedId: 'seed-smart-scifi',
    runId: 'run-current',
    depth: 0,
    query: starterQueryText.smartScifi,
    path: [starterQueryText.smartScifi],
    resultSet: [
      result('tmdb-movie-329865', 1, 'Excellent', 'movie', 'movie, science fiction, emotional drama'),
      result('tmdb-movie-157336', 2, 'Excellent', 'movie', 'movie, science fiction, family drama'),
      result('tmdb-movie-152601', 3, 'Good', 'movie', 'movie, science fiction romance'),
      result('tmdb-movie-438631', 4, 'Good', 'movie', 'movie, science fiction adventure'),
    ],
    blurb:
      'These picks keep the sci-fi ideas big while still landing on character stakes, grief, memory, and connection.',
    customDescriptions: {
      'tmdb-movie-329865':
        'Arrival leads with language, grief, and first contact rather than spectacle.',
      'tmdb-movie-157336':
        'Interstellar pairs cosmic scale with a clear emotional through-line.',
      'tmdb-movie-152601':
        'Her is intimate and reflective, with its speculative premise focused on loneliness.',
      'tmdb-movie-438631':
        'Dune is the most epic option, but its family and destiny stakes keep it grounded.',
    },
    followUps: [
      followUp('fu-scifi-1', 'Make it a little lighter', 'refine', 'tone-lighter', 'node-current-scifi-lighter'),
      followUp('fu-scifi-2', 'More first-contact stories', 'filter', 'first-contact', 'node-current-scifi-first-contact'),
      followUp('fu-scifi-3', 'Only newer releases', 'filter', 'release-window', 'node-current-scifi-newer'),
    ],
    stage1Findings: [
      passFinding(
        'gate-scifi-posters',
        'Poster coverage',
        'Every returned title has a TMDB poster path.',
        '7 of 7 results include poster_path.',
      ),
      passFinding(
        'gate-scifi-golden',
        'Golden-set coverage',
        'Required titles are present.',
        'Arrival and Interstellar are both in the top 2.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Excellent', 'The golden titles are ranked first and second, with adjacent picks still on intent.'),
      quality('Blurb', 'Good', 'Clear and grounded, though it could name one example title.'),
      quality('Custom Descriptions', 'Excellent', 'Descriptions explain why each title fits the mood.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions cover tone, subgenre, and recency without repeating.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-scifi-root',
  },
  {
    id: 'node-current-scifi-lighter',
    seedId: 'seed-smart-scifi',
    runId: 'run-current',
    parentId: 'node-current-scifi-root',
    depth: 1,
    query: 'Make it a little lighter',
    path: [starterQueryText.smartScifi, 'Make it a little lighter'],
    resultSet: [
      result('tmdb-movie-152601', 1, 'Good', 'movie', 'movie, gentle speculative romance'),
      result('tmdb-movie-329865', 2, 'Good', 'movie', 'movie, thoughtful first-contact drama'),
      result('tmdb-movie-438631', 3, 'Needs Work', 'movie', 'movie, heavier epic adventure'),
    ],
    blurb:
      'This narrows toward quieter, character-first stories, though one heavier epic still remains in the set.',
    customDescriptions: {
      'tmdb-movie-152601': 'Her is the softest tonal fit in this branch.',
      'tmdb-movie-329865': 'Arrival remains reflective without becoming action-heavy.',
      'tmdb-movie-438631': 'Dune keeps the sci-fi credibility but is less light than requested.',
    },
    followUps: [
      followUp('fu-scifi-light-1', 'More romantic picks', 'filter', 'romance'),
      followUp('fu-scifi-light-2', 'Less epic, more intimate', 'refine', 'intimate-scale'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-scifi-lighter-tone',
        'Tone fit',
        'One returned title is heavier than the follow-up requested.',
        'Dune is valid sci-fi but weaker for "a little lighter."',
        'tmdb-movie-438631',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Mostly follows the tone shift, with one weaker ranked result.'),
      quality('Blurb', 'Good', 'Acknowledges the tradeoff clearly.'),
      quality('Custom Descriptions', 'Good', 'Specific enough to support review.'),
      quality('Follow-Up Suggestions', 'Good', 'Keeps the branch moving with useful refinements.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-scifi-lighter',
  },
  {
    id: 'node-current-scifi-first-contact',
    seedId: 'seed-smart-scifi',
    runId: 'run-current',
    parentId: 'node-current-scifi-root',
    depth: 1,
    query: 'More first-contact stories',
    path: [starterQueryText.smartScifi, 'More first-contact stories'],
    resultSet: [
      result('tmdb-movie-329865', 1, 'Excellent', 'movie', 'movie, first-contact science fiction'),
      result('tmdb-movie-157336', 2, 'Good', 'movie', 'movie, cosmic science fiction'),
    ],
    blurb:
      'The response understands first contact, but the full set includes adjacent sci-fi mood picks below the direct matches.',
    customDescriptions: {
      'tmdb-movie-329865': 'Arrival is the clearest match for the follow-up.',
      'tmdb-movie-157336': 'Interstellar is adjacent through cosmic discovery rather than first contact.',
    },
    followUps: [followUp('fu-scifi-contact-1', 'Keep it grounded', 'refine', 'grounded')],
    stage1Findings: [
      warningFinding(
        'gate-scifi-contact-precision',
        'First-contact precision',
        'Several lower-ranked titles are adjacent rather than direct first-contact stories.',
        'Arrival is the clearest direct match; later results broaden into cosmic or speculative mood fits.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The top title is right, but the full set broadens past first-contact intent.'),
      quality('Blurb', 'Good', 'Accurately names the precision tradeoff.'),
      quality('Custom Descriptions', 'Good', 'Descriptions distinguish direct and adjacent matches.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Only one suggestion limits exploration.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-scifi-first-contact',
  },
  {
    id: 'node-current-scifi-newer',
    seedId: 'seed-smart-scifi',
    runId: 'run-current',
    parentId: 'node-current-scifi-root',
    depth: 1,
    query: 'Only newer releases',
    path: [starterQueryText.smartScifi, 'Only newer releases'],
    resultSet: [
      result('tmdb-movie-438631', 1, 'Good', 'movie', 'movie, 2021 science fiction'),
      result('tmdb-movie-335984', 2, 'Good', 'movie', 'movie, 2017 science fiction'),
      result('tmdb-movie-329865', 3, 'Good', 'movie', 'movie, 2016 science fiction'),
    ],
    blurb:
      'The branch shifts to more recent science fiction while keeping the thoughtful mood mostly intact.',
    customDescriptions: {
      'tmdb-movie-438631': 'Dune gives the newest high-profile option in the set.',
      'tmdb-movie-335984': 'Blade Runner 2049 keeps the reflective tone with a more recent release date.',
      'tmdb-movie-329865': 'Arrival is slightly older but still a strong fit.',
    },
    followUps: [
      followUp('fu-scifi-new-1', 'More Denis Villeneuve', 'filter', 'creator-villeneuve'),
      followUp('fu-scifi-new-2', 'Less intense', 'refine', 'tone-lighter'),
    ],
    stage1Findings: [
      passFinding(
        'gate-scifi-newer-window',
        'Release window',
        'Returned titles are all from 2016 or later.',
        'TMDB release years range from 2016 through 2024.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The newer-release filter is followed, with a mild mood drift.'),
      quality('Blurb', 'Good', 'Clear and appropriately cautious.'),
      quality('Custom Descriptions', 'Good', 'Descriptions cite release recency and fit.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions offer creator and tone refinements.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-scifi-newer',
  },
  {
    id: 'node-current-keanu-root',
    seedId: 'seed-keanu-action',
    runId: 'run-current',
    depth: 0,
    query: starterQueryText.keanuAction,
    path: [starterQueryText.keanuAction],
    resultSet: [
      result('tmdb-movie-603', 1, 'Excellent', 'movie', 'movie, Keanu Reeves cast, action sci-fi'),
      result('tmdb-movie-245891', 2, 'Excellent', 'movie', 'movie, Keanu Reeves cast, action thriller'),
      result('tmdb-movie-604', 3, 'Good', 'movie', 'movie, Keanu Reeves cast, action sci-fi'),
      result('tmdb-movie-335984', 4, 'Fail', 'movie', 'movie, no Keanu Reeves cast match'),
    ],
    blurb:
      'The top picks correctly anchor on Keanu Reeves action roles, but one ranked result fails the cast constraint.',
    customDescriptions: {
      'tmdb-movie-603': 'The Matrix is the strongest clever-action match and includes Keanu Reeves.',
      'tmdb-movie-245891': 'John Wick adds precise action craft with Keanu in the lead.',
      'tmdb-movie-604': 'The Matrix Reloaded keeps the same cast and action-forward premise.',
      'tmdb-movie-335984': 'Blade Runner 2049 is cerebral action sci-fi but does not match the actor constraint.',
    },
    followUps: [
      followUp('fu-keanu-1', 'More sci-fi action', 'filter', 'sci-fi-action', 'node-current-keanu-scifi'),
      followUp('fu-keanu-2', 'Skip sequels', 'filter', 'no-sequels', 'node-current-keanu-no-sequels'),
      followUp('fu-keanu-3', 'More like The Matrix', 'compare', 'more-like-matrix'),
    ],
    stage1Findings: [
      failFinding(
        'gate-keanu-cast',
        'Cast constraint',
        'Every result should include Keanu Reeves in TMDB cast metadata.',
        'Blade Runner 2049 cast does not include Keanu Reeves.',
        'tmdb-movie-335984',
      ),
      passFinding(
        'gate-keanu-golden',
        'Golden-set coverage',
        'Required titles are present.',
        'The Matrix and John Wick are ranked first and second.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Top 3 are strong, but one hard constraint miss appears in the set.'),
      quality('Blurb', 'Good', 'The blurb calls out the weakness without hiding it.'),
      quality('Custom Descriptions', 'Good', 'Descriptions are specific and surface the cast mismatch.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions support refinement and comparison.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-keanu-root',
  },
  {
    id: 'node-current-keanu-scifi',
    seedId: 'seed-keanu-action',
    runId: 'run-current',
    parentId: 'node-current-keanu-root',
    depth: 1,
    query: 'More sci-fi action',
    path: [starterQueryText.keanuAction, 'More sci-fi action'],
    resultSet: [
      result('tmdb-movie-603', 1, 'Excellent', 'movie', 'movie, Keanu Reeves cast, science fiction action'),
      result('tmdb-movie-604', 2, 'Good', 'movie', 'movie, Keanu Reeves cast, science fiction action'),
    ],
    blurb:
      'The branch correctly starts with Matrix films, then broadens into adjacent sci-fi action picks.',
    customDescriptions: {
      'tmdb-movie-603': 'The Matrix remains the best match for clever sci-fi action.',
      'tmdb-movie-604': 'The Matrix Reloaded fits the sci-fi action request, with a sequel caveat.',
    },
    followUps: [
      followUp('fu-keanu-scifi-1', 'Skip sequels', 'filter', 'no-sequels'),
      followUp('fu-keanu-scifi-2', 'More like The Matrix', 'compare', 'more-like-matrix'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-keanu-scifi-precision',
        'Sci-fi action precision',
        'Several lower-ranked titles broaden beyond Keanu-led sci-fi action.',
        'The Matrix films are direct; later results are adjacent or cast misses.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The top Matrix titles are accurate, while lower ranks broaden the strict ask.'),
      quality('Blurb', 'Good', 'Names the mixed precision plainly.'),
      quality('Custom Descriptions', 'Good', 'Brief but specific.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Suggestions repeat patterns already shown at the parent node.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-keanu-scifi',
  },
  {
    id: 'node-current-keanu-no-sequels',
    seedId: 'seed-keanu-action',
    runId: 'run-current',
    parentId: 'node-current-keanu-root',
    depth: 1,
    query: 'Skip sequels',
    path: [starterQueryText.keanuAction, 'Skip sequels'],
    resultSet: [
      result('tmdb-movie-603', 1, 'Excellent', 'movie', 'movie, Keanu Reeves cast, original film'),
      result('tmdb-movie-245891', 2, 'Excellent', 'movie', 'movie, Keanu Reeves cast, original film'),
    ],
    blurb:
      'The branch removes sequels cleanly and keeps seven original-film matches.',
    customDescriptions: {
      'tmdb-movie-603': 'The Matrix is an original title and the best clever-action fit.',
      'tmdb-movie-245891': 'John Wick is an original title with a clear action focus.',
    },
    followUps: [followUp('fu-keanu-original-1', 'Lean more cerebral', 'refine', 'cerebral-action')],
    stage1Findings: [
      passFinding(
        'gate-keanu-no-sequels',
        'Sequel filter',
        'Returned titles are original entries.',
        'All seven returned titles are original entries rather than sequels.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Strong original-film matches with a broader action range lower in the set.'),
      quality('Blurb', 'Good', 'Clear and concise.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain the filter.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Only one continuation is offered.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-keanu-no-sequels',
  },
  {
    id: 'node-current-workplace-root',
    seedId: 'seed-workplace-mystery',
    runId: 'run-current',
    depth: 0,
    query: starterQueryText.workplaceMystery,
    path: [starterQueryText.workplaceMystery],
    resultSet: [
      result('tmdb-tv-95396', 1, 'Excellent', 'series', 'series, workplace mystery'),
      result('tmdb-tv-62560', 2, 'Good', 'series', 'series, institutional thriller'),
      result('tmdb-tv-70523', 3, 'Good', 'series', 'series, mystery thriller'),
      result('tmdb-tv-66732', 4, 'Needs Work', 'series', 'series, mystery but weaker workplace fit'),
    ],
    blurb:
      'These series lean into offices, systems, and institutions that hide something unsettling.',
    customDescriptions: {
      'tmdb-tv-95396': 'Severance is the clearest workplace mystery match.',
      'tmdb-tv-62560': 'Mr. Robot uses workplaces and systems as pressure points.',
      'tmdb-tv-70523': 'Dark is strong on mystery and dread, but less workplace-specific.',
      'tmdb-tv-66732': 'Stranger Things is eerie and serialized, though its workplace fit is weak.',
    },
    followUps: [
      followUp('fu-work-1', 'More like Severance', 'compare', 'more-like-severance', 'node-current-workplace-severance'),
      followUp('fu-work-2', 'More like Severance', 'compare', 'more-like-severance', 'node-current-workplace-severance'),
      followUp('fu-work-3', 'Less supernatural', 'filter', 'less-supernatural', 'node-current-workplace-grounded'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-workplace-repetition',
        'Follow-up repetition',
        'Two suggestions repeat the same phrase.',
        '"More like Severance" appears twice at this node.',
      ),
      warningFinding(
        'gate-workplace-fit',
        'Constraint strength',
        'One lower-ranked title weakly matches the workplace part of the query.',
        'Stranger Things is relevant to mystery but not workplace-led.',
        'tmdb-tv-66732',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The top 2 are strong, with weaker intent fit lower in the list.'),
      quality('Blurb', 'Good', 'The blurb frames the common thread well.'),
      quality('Custom Descriptions', 'Good', 'Descriptions identify direct and adjacent matches.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Duplicate phrasing reduces usefulness.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-workplace-root',
  },
  {
    id: 'node-current-workplace-severance',
    seedId: 'seed-workplace-mystery',
    runId: 'run-current',
    parentId: 'node-current-workplace-root',
    depth: 1,
    query: 'More like Severance',
    path: [starterQueryText.workplaceMystery, 'More like Severance'],
    resultSet: [
      result('tmdb-tv-95396', 1, 'Excellent', 'series', 'series, workplace mystery'),
      result('tmdb-tv-62560', 2, 'Good', 'series', 'series, psychological tech thriller'),
      result('tmdb-tv-70523', 3, 'Good', 'series', 'series, mystery conspiracy'),
    ],
    blurb:
      'The branch keeps the institutional unease, but it should avoid returning the same anchor title first.',
    customDescriptions: {
      'tmdb-tv-95396': 'Severance is the reference title, so repeating it is less useful.',
      'tmdb-tv-62560': 'Mr. Robot matches paranoia around work, systems, and identity.',
      'tmdb-tv-70523': 'Dark adds layered conspiracy and dread.',
    },
    followUps: [
      followUp('fu-work-sev-1', 'More corporate thrillers', 'filter', 'corporate-thriller'),
      followUp('fu-work-sev-2', 'Keep it psychological', 'refine', 'psychological'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-workplace-anchor-repeat',
        'Anchor repetition',
        'The branch repeats the reference title as rank 1.',
        'Severance appears again after "More like Severance."',
        'tmdb-tv-95396',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The set is relevant but repeats the anchor title.'),
      quality('Blurb', 'Good', 'The blurb correctly identifies the weakness.'),
      quality('Custom Descriptions', 'Good', 'Descriptions are useful for reviewer judgment.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions move toward adjacent subgenres.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-workplace-severance',
  },
  {
    id: 'node-current-workplace-grounded',
    seedId: 'seed-workplace-mystery',
    runId: 'run-current',
    parentId: 'node-current-workplace-root',
    depth: 1,
    query: 'Less supernatural',
    path: [starterQueryText.workplaceMystery, 'Less supernatural'],
    resultSet: [
      result('tmdb-tv-62560', 1, 'Good', 'series', 'series, grounded tech thriller'),
      result('tmdb-tv-95396', 2, 'Good', 'series', 'series, workplace mystery'),
      result('tmdb-tv-1396', 3, 'Needs Work', 'series', 'series, crime drama not workplace mystery'),
    ],
    blurb:
      'The branch lowers the supernatural angle, but the third result drifts away from workplace mystery.',
    customDescriptions: {
      'tmdb-tv-62560': 'Mr. Robot stays grounded and paranoid.',
      'tmdb-tv-95396': 'Severance keeps the workplace setting while remaining uncanny.',
      'tmdb-tv-1396': 'Breaking Bad is grounded crime drama but misses the workplace mystery intent.',
    },
    followUps: [
      followUp('fu-work-ground-1', 'More tech paranoia', 'filter', 'tech-paranoia'),
      followUp('fu-work-ground-2', 'No crime dramas', 'filter', 'no-crime'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-workplace-grounded-drift',
        'Intent drift',
        'One result is grounded but weak for workplace mystery.',
        'Breaking Bad matches grounded drama more than the requested setup.',
        'tmdb-tv-1396',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Strong top 2, weak third result.'),
      quality('Blurb', 'Good', 'Accurately calls out the drift.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain the tradeoff.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions give clear next filters.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-current-workplace-grounded',
  },
  {
    id: 'node-baseline-scifi-root',
    seedId: 'seed-smart-scifi',
    runId: 'run-baseline',
    depth: 0,
    query: starterQueryText.smartScifi,
    path: [starterQueryText.smartScifi],
    resultSet: [
      result('tmdb-movie-157336', 1, 'Good', 'movie', 'movie, science fiction'),
      result('tmdb-movie-335984', 2, 'Good', 'movie', 'movie, science fiction'),
      result('tmdb-movie-438631', 3, 'Good', 'movie', 'movie, science fiction'),
    ],
    blurb:
      'Here are popular sci-fi movies with big ideas and serious tones.',
    customDescriptions: {
      'tmdb-movie-157336': 'A space movie with emotion.',
      'tmdb-movie-335984': 'A futuristic movie with mystery.',
      'tmdb-movie-438631': 'A large-scale sci-fi adventure.',
    },
    followUps: [
      followUp('fu-base-scifi-1', 'More like this', 'compare', 'generic-more'),
      followUp('fu-base-scifi-2', 'More like this', 'compare', 'generic-more'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-scifi-golden',
        'Golden-set coverage',
        'Required golden-set title is missing.',
        'Arrival is not returned.',
        'tmdb-movie-329865',
      ),
      warningFinding(
        'gate-base-scifi-copy',
        'Generic description',
        'Descriptions do not explain the emotional fit.',
        'Custom descriptions use broad phrases such as "space movie."',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Relevant but misses a required title.'),
      quality('Blurb', 'Needs Work', 'Generic and does not help with the mood.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions are too thin.'),
      quality('Follow-Up Suggestions', 'Fail', 'Suggestions are repetitive and generic.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-baseline-scifi-root',
  },
  {
    id: 'node-baseline-keanu-root',
    seedId: 'seed-keanu-action',
    runId: 'run-baseline',
    depth: 0,
    query: starterQueryText.keanuAction,
    path: [starterQueryText.keanuAction],
    resultSet: [
      result('tmdb-movie-603', 1, 'Excellent', 'movie', 'movie, Keanu Reeves cast'),
      result('tmdb-movie-438631', 2, 'Fail', 'movie', 'movie, no Keanu Reeves cast match'),
      result('tmdb-movie-335984', 3, 'Fail', 'movie', 'movie, no Keanu Reeves cast match'),
    ],
    blurb:
      'These action-heavy movies blend sci-fi and stylish set pieces.',
    customDescriptions: {
      'tmdb-movie-603': 'The Matrix fits both Keanu and clever action.',
      'tmdb-movie-438631': 'Dune is stylish sci-fi action.',
      'tmdb-movie-335984': 'Blade Runner 2049 is moody sci-fi action.',
    },
    followUps: [
      followUp('fu-base-keanu-1', 'More action', 'filter', 'more-action'),
      followUp('fu-base-keanu-2', 'More sci-fi', 'filter', 'more-scifi'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-keanu-cast-dune',
        'Cast constraint',
        'Every result should include Keanu Reeves in TMDB cast metadata.',
        'Dune cast does not include Keanu Reeves.',
        'tmdb-movie-438631',
      ),
      failFinding(
        'gate-base-keanu-cast-blade',
        'Cast constraint',
        'Every result should include Keanu Reeves in TMDB cast metadata.',
        'Blade Runner 2049 cast does not include Keanu Reeves.',
        'tmdb-movie-335984',
      ),
      failFinding(
        'gate-base-keanu-golden',
        'Golden-set coverage',
        'Required golden-set title is missing.',
        'John Wick is not returned.',
        'tmdb-movie-245891',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Fail', 'Multiple hard constraint misses.'),
      quality('Blurb', 'Needs Work', 'Avoids the actor constraint and overgeneralizes.'),
      quality('Custom Descriptions', 'Needs Work', 'Does not call out actor mismatch.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions are simple but usable.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-baseline-keanu-root',
  },
  {
    id: 'node-baseline-workplace-root',
    seedId: 'seed-workplace-mystery',
    runId: 'run-baseline',
    depth: 0,
    query: starterQueryText.workplaceMystery,
    path: [starterQueryText.workplaceMystery],
    resultSet: [
      result('tmdb-tv-66732', 1, 'Needs Work', 'series', 'series, mystery but weak workplace fit'),
      result('tmdb-tv-70523', 2, 'Good', 'series', 'series, mystery thriller'),
      result('tmdb-tv-1396', 3, 'Needs Work', 'series', 'series, crime drama'),
    ],
    blurb:
      'These shows are dark, twisty, and full of secrets.',
    customDescriptions: {
      'tmdb-tv-66732': 'A supernatural mystery with teen characters.',
      'tmdb-tv-70523': 'A dense mystery with a dark tone.',
      'tmdb-tv-1396': 'A serious crime drama with high tension.',
    },
    followUps: [
      followUp('fu-base-work-1', 'More dark shows', 'filter', 'dark-shows'),
      followUp('fu-base-work-2', 'More dark shows', 'filter', 'dark-shows'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-work-golden-severance',
        'Golden-set coverage',
        'Required golden-set title is missing.',
        'Severance is not returned.',
        'tmdb-tv-95396',
      ),
      failFinding(
        'gate-base-work-golden-robot',
        'Golden-set coverage',
        'Required golden-set title is missing.',
        'Mr. Robot is not returned.',
        'tmdb-tv-62560',
      ),
      warningFinding(
        'gate-base-work-intent',
        'Intent drift',
        'The set favors dark shows but misses the workplace part of the query.',
        'No returned description mentions workplace or institution fit.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Some mystery fit, but golden titles are absent.'),
      quality('Blurb', 'Needs Work', 'Too broad for the compound query.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not explain workplace fit.'),
      quality('Follow-Up Suggestions', 'Fail', 'Duplicate phrase and broad filter.'),
    ],
    metadataSource: 'TMDB',
    rawPayloadId: 'tmdb-fixture-baseline-workplace-root',
  },
];

export const conversationNodes: ConversationNode[] = conversationNodeFixtures.map(withSevenResults);

export const evaluationRuns: EvaluationRun[] = [
  {
    id: 'run-current',
    label: 'Fixture Run 2026.05.31',
    date: '2026-05-31T09:30:00-07:00',
    systemLabel: 'Conv Search Mock v0.1',
    querySetName: 'Product Smoke Set',
    querySetVersion: 'seed-v1',
    configVersion: 'eval-config-v1',
    seedIds: ['seed-smart-scifi', 'seed-keanu-action', 'seed-workplace-mystery'],
    nodeIds: [
      'node-current-scifi-root',
      'node-current-scifi-lighter',
      'node-current-scifi-first-contact',
      'node-current-scifi-newer',
      'node-current-keanu-root',
      'node-current-keanu-scifi',
      'node-current-keanu-no-sequels',
      'node-current-workplace-root',
      'node-current-workplace-severance',
      'node-current-workplace-grounded',
    ],
    snapshot: {
      status: 'Needs Review',
      stage1FailureRate: 10,
      stage2Average: 3.1,
      seedCount: 3,
      exploredPaths: 7,
      goldenCoverage: 100,
    },
  },
  {
    id: 'run-baseline',
    label: 'Fixture Run 2026.05.17',
    date: '2026-05-17T11:00:00-07:00',
    systemLabel: 'Conv Search Mock baseline',
    querySetName: 'Product Smoke Set',
    querySetVersion: 'seed-v1',
    configVersion: 'eval-config-v1',
    seedIds: ['seed-smart-scifi', 'seed-keanu-action', 'seed-workplace-mystery'],
    nodeIds: [
      'node-baseline-scifi-root',
      'node-baseline-keanu-root',
      'node-baseline-workplace-root',
    ],
    snapshot: {
      status: 'Failing',
      stage1FailureRate: 100,
      stage2Average: 1.9,
      seedCount: 3,
      exploredPaths: 3,
      goldenCoverage: 33,
    },
  },
];

export const seedById = Object.fromEntries(
  seedQueries.map((seed) => [seed.id, seed]),
) as Record<string, SeedQuery>;

export const nodeById = Object.fromEntries(
  conversationNodes.map((node) => [node.id, node]),
) as Record<string, ConversationNode>;

export const runById = Object.fromEntries(
  evaluationRuns.map((run) => [run.id, run]),
) as Record<string, EvaluationRun>;
