import type {
  ConversationNode,
  EvaluationRun,
  FollowUpSuggestion,
  QualityAssessment,
  SearchResult,
  SeedQuery,
  Stage1Finding,
} from '../types';
import {
  allSeedIds,
  querySetName,
  querySetVersion,
  seedQueries,
  starterTextFor,
} from './seedQueries';

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

const villeneuveScifiBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-329865',
    relevance: 'Excellent',
    actual: 'movie, Denis Villeneuve, science fiction drama',
    description: 'Arrival is the strongest match for Villeneuve sci-fi with emotional scale.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Excellent',
    actual: 'movie, Denis Villeneuve, science fiction spectacle',
    description: 'Dune foregrounds Villeneuve visual scale and speculative worldbuilding.',
  },
  {
    mediaId: 'tmdb-movie-693134',
    relevance: 'Good',
    actual: 'movie, Denis Villeneuve, science fiction sequel',
    description: 'Dune: Part Two extends the same visual language and genre fit.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Good',
    actual: 'movie, Denis Villeneuve, science fiction noir',
    description: 'Blade Runner 2049 is a direct style and director match.',
  },
  {
    mediaId: 'tmdb-movie-577922',
    relevance: 'Needs Work',
    actual: 'movie, science fiction by Christopher Nolan',
    description: 'Tenet is visually ambitious sci-fi but misses the Villeneuve constraint.',
  },
  {
    mediaId: 'tmdb-movie-157336',
    relevance: 'Needs Work',
    actual: 'movie, science fiction by Christopher Nolan',
    description: 'Interstellar has scale and emotion but not the requested director.',
  },
  {
    mediaId: 'tmdb-movie-670292',
    relevance: 'Needs Work',
    actual: 'movie, science fiction by Gareth Edwards',
    description: 'The Creator is visually polished but not a Villeneuve film.',
  },
];

const aiEmotionalBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-152601',
    relevance: 'Excellent',
    actual: 'movie, artificial intelligence romance drama',
    description: 'Her makes the AI premise intimate, lonely, and human-scale.',
  },
  {
    mediaId: 'tmdb-movie-670292',
    relevance: 'Good',
    actual: 'movie, artificial intelligence war drama',
    description: 'The Creator adds AI conflict while keeping a protective emotional core.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Good',
    actual: 'movie, artificial life science fiction drama',
    description: 'Blade Runner 2049 treats synthetic life through identity and longing.',
  },
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Good',
    actual: 'movie, artificial reality action science fiction',
    description: 'The Matrix fits the machine-intelligence angle, though it is more action-forward.',
  },
  {
    mediaId: 'tmdb-movie-9886',
    relevance: 'Needs Work',
    actual: 'movie, cyberpunk technology action',
    description: 'Johnny Mnemonic has cyberpunk AI-adjacent ideas but less emotional depth.',
  },
  {
    mediaId: 'tmdb-movie-329865',
    relevance: 'Needs Work',
    actual: 'movie, communication-focused science fiction drama',
    description: 'Arrival fits the human tone more than the AI theme.',
  },
  {
    mediaId: 'tmdb-movie-577922',
    relevance: 'Needs Work',
    actual: 'movie, puzzle-driven science fiction action',
    description: 'Tenet is clever but not meaningfully about AI.',
  },
];

const ninetiesActionBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-1637',
    relevance: 'Excellent',
    actual: 'movie, 1990s action thriller',
    description: 'Speed is a tight 90s action thriller with a clean high-concept hook.',
  },
  {
    mediaId: 'tmdb-movie-1089',
    relevance: 'Excellent',
    actual: 'movie, 1990s action thriller',
    description: 'Point Break pairs undercover tension with memorable action set pieces.',
  },
  {
    mediaId: 'tmdb-movie-603',
    relevance: 'Good',
    actual: 'movie, 1990s science fiction action thriller',
    description: 'The Matrix is a 1999 action landmark that still feels smart.',
  },
  {
    mediaId: 'tmdb-movie-9886',
    relevance: 'Good',
    actual: 'movie, 1990s cyberpunk action',
    description: 'Johnny Mnemonic fits the decade and action mode, though it is a shakier recommendation.',
  },
  {
    mediaId: 'tmdb-movie-245891',
    relevance: 'Fail',
    actual: 'movie, 2010s action thriller',
    description: 'John Wick is smart action but misses the 90s release window.',
  },
  {
    mediaId: 'tmdb-movie-561',
    relevance: 'Fail',
    actual: 'movie, 2000s supernatural action',
    description: 'Constantine has action but misses both the decade and thriller shape.',
  },
  {
    mediaId: 'tmdb-movie-64686',
    relevance: 'Fail',
    actual: 'movie, 2010s fantasy action',
    description: '47 Ronin is action-oriented but not a 90s thriller.',
  },
];

const weekendSeriesBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-tv-66276',
    relevance: 'Excellent',
    actual: 'series, one-season dark mystery',
    description: 'The Night Of is compact, grim, and built for a focused weekend watch.',
  },
  {
    mediaId: 'tmdb-tv-73411',
    relevance: 'Excellent',
    actual: 'series, one-season dark smart drama',
    description: 'Maniac is a limited, off-kilter series with a brainy emotional spine.',
  },
  {
    mediaId: 'tmdb-tv-80335',
    relevance: 'Good',
    actual: 'series, short institutional mystery',
    description: 'Homecoming is short, tense, and easy to finish quickly.',
  },
  {
    mediaId: 'tmdb-tv-63646',
    relevance: 'Good',
    actual: 'series, two-season smart thriller',
    description: 'Counterpart is slightly longer but compact enough for a planned binge.',
  },
  {
    mediaId: 'tmdb-tv-95396',
    relevance: 'Good',
    actual: 'series, two-season dark workplace mystery',
    description: 'Severance is smart and dark, though less clearly a limited series.',
  },
  {
    mediaId: 'tmdb-tv-70523',
    relevance: 'Needs Work',
    actual: 'series, three-season dark mystery',
    description: 'Dark fits the intelligence and mood but is longer than a weekend-friendly ask.',
  },
  {
    mediaId: 'tmdb-tv-62560',
    relevance: 'Needs Work',
    actual: 'series, four-season tech thriller',
    description: 'Mr. Robot is smart and dark but too long for the viewing constraint.',
  },
];

const conspiracySeriesBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-tv-62560',
    relevance: 'Excellent',
    actual: 'series, technology conspiracy thriller',
    description: 'Mr. Robot has a strong conspiracy engine and paranoid mystery structure.',
  },
  {
    mediaId: 'tmdb-tv-63646',
    relevance: 'Good',
    actual: 'series, spy conspiracy science fiction',
    description: 'Counterpart builds conspiracy through intelligence agencies and parallel worlds.',
  },
  {
    mediaId: 'tmdb-tv-70523',
    relevance: 'Good',
    actual: 'series, time conspiracy mystery',
    description: 'Dark makes conspiracy part of its nested mystery machinery.',
  },
  {
    mediaId: 'tmdb-tv-80335',
    relevance: 'Good',
    actual: 'series, institutional conspiracy thriller',
    description: 'Homecoming keeps the conspiracy grounded in a secretive program.',
  },
  {
    mediaId: 'tmdb-tv-66732',
    relevance: 'Good',
    actual: 'series, government conspiracy mystery',
    description: 'Stranger Things has a conspiracy thread around experiments and coverups.',
  },
  {
    mediaId: 'tmdb-tv-66276',
    relevance: 'Good',
    actual: 'series, institutional crime mystery',
    description: 'The Night Of is conspiratorial in mood, though less explicit about a grand plot.',
  },
  {
    mediaId: 'tmdb-tv-95396',
    relevance: 'Needs Work',
    actual: 'series, workplace mystery with hidden systems',
    description: 'Severance has corporate secrecy but is less directly framed as conspiracy.',
  },
];

const contactDiscoveryBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-movie-329865',
    relevance: 'Excellent',
    actual: 'movie, first-contact communication science fiction',
    description: 'Arrival is the cleanest fit for contact, language, and emotional stakes.',
  },
  {
    mediaId: 'tmdb-movie-157336',
    relevance: 'Excellent',
    actual: 'movie, cosmic discovery science fiction',
    description: 'Interstellar centers discovery and communication across impossible distance.',
  },
  {
    mediaId: 'tmdb-movie-670292',
    relevance: 'Good',
    actual: 'movie, human-machine contact science fiction',
    description: 'The Creator reframes contact around AI and empathy.',
  },
  {
    mediaId: 'tmdb-movie-300668',
    relevance: 'Good',
    actual: 'movie, alien-zone discovery science fiction',
    description: 'Annihilation is discovery-led and serious, though more unsettling than warm.',
  },
  {
    mediaId: 'tmdb-movie-438631',
    relevance: 'Good',
    actual: 'movie, world-discovery science fiction',
    description: 'Dune gives discovery and communication across cultures, if not classic first contact.',
  },
  {
    mediaId: 'tmdb-movie-693134',
    relevance: 'Good',
    actual: 'movie, world-discovery science fiction sequel',
    description: 'Dune: Part Two continues the cultural-discovery angle.',
  },
  {
    mediaId: 'tmdb-movie-335984',
    relevance: 'Needs Work',
    actual: 'movie, identity-focused science fiction noir',
    description: 'Blade Runner 2049 is serious sci-fi but weaker for contact or discovery.',
  },
];

const techParanoiaBackfill: ResultBackfill[] = [
  {
    mediaId: 'tmdb-tv-62560',
    relevance: 'Excellent',
    actual: 'series, technology paranoia thriller',
    description: 'Mr. Robot directly matches tech paranoia and threatening systems.',
  },
  {
    mediaId: 'tmdb-tv-95396',
    relevance: 'Excellent',
    actual: 'series, corporate systems workplace thriller',
    description: 'Severance turns corporate structure into the central threat.',
  },
  {
    mediaId: 'tmdb-tv-80335',
    relevance: 'Good',
    actual: 'series, institutional technology-adjacent thriller',
    description: 'Homecoming keeps the threat inside a secretive organization.',
  },
  {
    mediaId: 'tmdb-tv-63646',
    relevance: 'Good',
    actual: 'series, bureaucratic science fiction paranoia',
    description: 'Counterpart makes systems and agencies feel quietly dangerous.',
  },
  {
    mediaId: 'tmdb-tv-73411',
    relevance: 'Good',
    actual: 'series, pharmaceutical experiment technology drama',
    description: 'Maniac is tech-and-institution adjacent with an unnerving experiment frame.',
  },
  {
    mediaId: 'tmdb-tv-66276',
    relevance: 'Needs Work',
    actual: 'series, institutional crime mystery',
    description: 'The Night Of has systemic threat but not much technology.',
  },
  {
    mediaId: 'tmdb-tv-70523',
    relevance: 'Needs Work',
    actual: 'series, science fiction mystery',
    description: 'Dark has systems and dread, though not corporate tech paranoia.',
  },
];

const seedBackfillById: Partial<Record<string, ResultBackfill[]>> = {
  'seed-villeneuve-scifi': villeneuveScifiBackfill,
  'seed-ai-emotional': aiEmotionalBackfill,
  'seed-nineties-action': ninetiesActionBackfill,
  'seed-weekend-series': weekendSeriesBackfill,
  'seed-conspiracy-series': conspiracySeriesBackfill,
  'seed-contact-discovery': contactDiscoveryBackfill,
  'seed-tech-paranoia': techParanoiaBackfill,
};

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

  const seedBackfill = seedBackfillById[node.seedId];
  if (seedBackfill) {
    return seedBackfill;
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

const nodeResults = (
  expected: string,
  entries: Array<[string, SearchResult['relevance'], string]>,
) => entries.map(([mediaId, relevance, actual], index) =>
  result(mediaId, index + 1, relevance, expected, actual),
);

type RootNodeInput = Omit<
  ConversationNode,
  'customDescriptions' | 'depth' | 'metadataSource' | 'parentId' | 'path' | 'query'
> & {
  customDescriptions?: Record<string, string>;
};

function makeRootNode({
  customDescriptions = {},
  ...node
}: RootNodeInput): ConversationNode {
  const query = starterTextFor(node.seedId);

  return {
    ...node,
    depth: 0,
    query,
    path: [query],
    customDescriptions,
    metadataSource: 'TMDB',
  };
}

const additionalRootNodeFixtures: ConversationNode[] = [
  makeRootNode({
    id: 'node-current-villeneuve-root',
    seedId: 'seed-villeneuve-scifi',
    runId: 'run-current',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-329865', 'Excellent', 'movie, Denis Villeneuve, science fiction drama'],
      ['tmdb-movie-438631', 'Excellent', 'movie, Denis Villeneuve, science fiction spectacle'],
      ['tmdb-movie-693134', 'Good', 'movie, Denis Villeneuve, science fiction sequel'],
      ['tmdb-movie-335984', 'Good', 'movie, Denis Villeneuve, science fiction noir'],
    ]),
    blurb:
      'These start with Villeneuve-directed sci-fi, then broaden into adjacent visually ambitious genre picks lower in the set.',
    followUps: [
      followUp('fu-villeneuve-1', 'More like Arrival', 'compare', 'more-like-arrival'),
      followUp('fu-villeneuve-2', 'Only the slower, moodier ones', 'refine', 'slower-moodier'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-villeneuve-lower-ranks',
        'Director precision',
        'Lower-ranked backfill includes visually ambitious sci-fi outside the requested director.',
        'Top four results are direct Villeneuve matches; later results broaden the set.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Top results are direct matches, with lower-rank broadening.'),
      quality('Blurb', 'Good', 'Accurately explains the ranking tradeoff.'),
      quality('Custom Descriptions', 'Good', 'Descriptions name why each film fits or drifts.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions support comparison and tone refinement.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-villeneuve-root',
  }),
  makeRootNode({
    id: 'node-baseline-villeneuve-root',
    seedId: 'seed-villeneuve-scifi',
    runId: 'run-baseline',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-438631', 'Excellent', 'movie, Denis Villeneuve, science fiction spectacle'],
      ['tmdb-movie-157336', 'Needs Work', 'movie, science fiction by Christopher Nolan'],
      ['tmdb-movie-577922', 'Needs Work', 'movie, science fiction by Christopher Nolan'],
      ['tmdb-movie-670292', 'Needs Work', 'movie, science fiction by Gareth Edwards'],
      ['tmdb-movie-300668', 'Needs Work', 'movie, science fiction by Alex Garland'],
      ['tmdb-movie-603', 'Needs Work', 'movie, science fiction by the Wachowskis'],
      ['tmdb-movie-693134', 'Good', 'movie, Denis Villeneuve, science fiction sequel'],
    ]),
    blurb: 'Here are stylish science fiction movies with big visuals.',
    followUps: [
      followUp('fu-base-villeneuve-1', 'More sci-fi', 'filter', 'more-scifi'),
      followUp('fu-base-villeneuve-2', 'More directors like this', 'compare', 'similar-directors'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-villeneuve-director',
        'Director constraint',
        'The response should prioritize Denis Villeneuve-directed results.',
        'Only two returned titles are direct Villeneuve matches.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The set over-indexes on general stylish sci-fi.'),
      quality('Blurb', 'Needs Work', 'The blurb ignores the director constraint.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not consistently cite director fit.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions are broad but usable.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-villeneuve-root',
  }),
  makeRootNode({
    id: 'node-current-ai-emotional-root',
    seedId: 'seed-ai-emotional',
    runId: 'run-current',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-152601', 'Excellent', 'movie, artificial intelligence romance drama'],
      ['tmdb-movie-670292', 'Good', 'movie, artificial intelligence war drama'],
      ['tmdb-movie-335984', 'Good', 'movie, artificial life science fiction drama'],
      ['tmdb-movie-603', 'Good', 'movie, artificial reality action science fiction'],
    ]),
    blurb:
      'These lean toward AI or artificial-life stories where identity, care, and loneliness matter more than jump scares.',
    followUps: [
      followUp('fu-ai-1', 'Less action, more intimate', 'refine', 'intimate-ai'),
      followUp('fu-ai-2', 'Newer picks only', 'filter', 'release-window'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-ai-theme-breadth',
        'AI theme breadth',
        'Some lower-ranked titles are AI-adjacent rather than direct AI stories.',
        'Arrival and Tenet support tone or intelligence but are not direct AI matches.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The top results match both AI and emotional tone.'),
      quality('Blurb', 'Good', 'The blurb clearly reflects the requested tone.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain theme and tone fit.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions cover intimacy and recency.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-ai-emotional-root',
  }),
  makeRootNode({
    id: 'node-baseline-ai-emotional-root',
    seedId: 'seed-ai-emotional',
    runId: 'run-baseline',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-603', 'Good', 'movie, artificial reality action science fiction'],
      ['tmdb-movie-577922', 'Needs Work', 'movie, puzzle-driven science fiction action'],
      ['tmdb-movie-9886', 'Needs Work', 'movie, cyberpunk technology action'],
      ['tmdb-movie-670292', 'Good', 'movie, artificial intelligence war drama'],
      ['tmdb-movie-335984', 'Good', 'movie, artificial life science fiction drama'],
      ['tmdb-movie-300668', 'Needs Work', 'movie, science fiction horror'],
      ['tmdb-movie-438631', 'Needs Work', 'movie, science fiction adventure'],
    ]),
    blurb: 'Here are science fiction movies about advanced technology.',
    followUps: [
      followUp('fu-base-ai-1', 'More robots', 'filter', 'robot-ai'),
      followUp('fu-base-ai-2', 'More action', 'filter', 'more-action'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-ai-golden',
        'Golden-set coverage',
        'Required emotionally centered AI title is missing.',
        'Her is not returned.',
        'tmdb-movie-152601',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Several results fit tech more than emotional AI.'),
      quality('Blurb', 'Needs Work', 'The blurb flattens the emotional ask into technology.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not explain the human tone.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Suggestions steer toward generic robots and action.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-ai-emotional-root',
  }),
  makeRootNode({
    id: 'node-current-nineties-action-root',
    seedId: 'seed-nineties-action',
    runId: 'run-current',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-1637', 'Excellent', 'movie, 1990s action thriller'],
      ['tmdb-movie-1089', 'Excellent', 'movie, 1990s action thriller'],
      ['tmdb-movie-603', 'Good', 'movie, 1990s science fiction action thriller'],
      ['tmdb-movie-9886', 'Good', 'movie, 1990s cyberpunk action'],
    ]),
    blurb:
      'The strongest picks keep the 90s release window and action-thriller shape, with a few broader action items lower down.',
    followUps: [
      followUp('fu-90s-action-1', 'Lean more thriller', 'refine', 'thriller-lean'),
      followUp('fu-90s-action-2', 'No sci-fi', 'filter', 'no-scifi'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-90s-lower-window',
        'Release window',
        'Lower-ranked items drift outside the 1990s release window.',
        'Top four results are 1990s releases; later backfill includes newer action movies.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Top results match the era and tone well.'),
      quality('Blurb', 'Good', 'The blurb calls out the lower-rank caveat.'),
      quality('Custom Descriptions', 'Good', 'Descriptions cite decade and tone fit.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions offer useful narrowing.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-nineties-action-root',
  }),
  makeRootNode({
    id: 'node-baseline-nineties-action-root',
    seedId: 'seed-nineties-action',
    runId: 'run-baseline',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-245891', 'Fail', 'movie, 2010s action thriller'],
      ['tmdb-movie-1637', 'Excellent', 'movie, 1990s action thriller'],
      ['tmdb-movie-561', 'Fail', 'movie, 2000s supernatural action'],
      ['tmdb-movie-64686', 'Fail', 'movie, 2010s fantasy action'],
      ['tmdb-movie-1089', 'Excellent', 'movie, 1990s action thriller'],
      ['tmdb-movie-603', 'Good', 'movie, 1990s science fiction action thriller'],
      ['tmdb-movie-604', 'Fail', 'movie, 2000s action sequel'],
    ]),
    blurb: 'Here are action movies with strong hooks and lots of momentum.',
    followUps: [
      followUp('fu-base-90s-1', 'More action', 'filter', 'more-action'),
      followUp('fu-base-90s-2', 'More action', 'filter', 'more-action'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-90s-window',
        'Release window',
        'Several returned titles are not 1990s releases.',
        'John Wick, Constantine, 47 Ronin, and The Matrix Reloaded miss the decade constraint.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The decade filter is inconsistent.'),
      quality('Blurb', 'Needs Work', 'The blurb ignores the 90s requirement.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions are not specific enough about release window.'),
      quality('Follow-Up Suggestions', 'Fail', 'Suggestions repeat and do not refine the weak constraint.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-nineties-action-root',
  }),
  makeRootNode({
    id: 'node-current-weekend-series-root',
    seedId: 'seed-weekend-series',
    runId: 'run-current',
    resultSet: nodeResults('series', [
      ['tmdb-tv-66276', 'Excellent', 'series, one-season dark mystery'],
      ['tmdb-tv-73411', 'Excellent', 'series, one-season dark smart drama'],
      ['tmdb-tv-80335', 'Good', 'series, short institutional mystery'],
      ['tmdb-tv-63646', 'Good', 'series, two-season smart thriller'],
      ['tmdb-tv-95396', 'Good', 'series, two-season dark workplace mystery'],
    ]),
    blurb:
      'These prioritize compact season counts while keeping a darker, smarter tone for a planned weekend watch.',
    followUps: [
      followUp('fu-weekend-1', 'Only one-season shows', 'filter', 'one-season'),
      followUp('fu-weekend-2', 'Less bleak', 'refine', 'tone-lighter'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-weekend-length',
        'Viewing length',
        'A few lower-ranked titles may be too long for a weekend watch.',
        'Dark and Mr. Robot fit mood but exceed the short-series preference.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'Top titles match short-form viewing and tone.'),
      quality('Blurb', 'Good', 'Clearly frames the viewing-plan constraint.'),
      quality('Custom Descriptions', 'Good', 'Descriptions mention season count or compactness.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions refine length and tone.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-weekend-series-root',
  }),
  makeRootNode({
    id: 'node-baseline-weekend-series-root',
    seedId: 'seed-weekend-series',
    runId: 'run-baseline',
    resultSet: nodeResults('series', [
      ['tmdb-tv-70523', 'Needs Work', 'series, three-season dark mystery'],
      ['tmdb-tv-62560', 'Needs Work', 'series, four-season tech thriller'],
      ['tmdb-tv-66732', 'Needs Work', 'series, four-season supernatural mystery'],
      ['tmdb-tv-66276', 'Excellent', 'series, one-season dark mystery'],
      ['tmdb-tv-1396', 'Needs Work', 'series, five-season dark crime drama'],
      ['tmdb-tv-80335', 'Good', 'series, short institutional mystery'],
      ['tmdb-tv-95396', 'Good', 'series, two-season dark workplace mystery'],
    ]),
    blurb: 'Here are dark shows with smart mysteries.',
    followUps: [
      followUp('fu-base-weekend-1', 'More dark shows', 'filter', 'dark-shows'),
      followUp('fu-base-weekend-2', 'More mysteries', 'filter', 'mystery'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-weekend-length',
        'Viewing length',
        'The response does not consistently respect the weekend or limited-series constraint.',
        'Several returned shows run three or more seasons.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Mood fit is decent, but length fit is weak.'),
      quality('Blurb', 'Needs Work', 'The blurb omits the weekend viewing constraint.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not help assess watch length.'),
      quality('Follow-Up Suggestions', 'Needs Work', 'Suggestions are generic genre filters.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-weekend-series-root',
  }),
  makeRootNode({
    id: 'node-current-conspiracy-series-root',
    seedId: 'seed-conspiracy-series',
    runId: 'run-current',
    resultSet: nodeResults('series', [
      ['tmdb-tv-62560', 'Excellent', 'series, technology conspiracy thriller'],
      ['tmdb-tv-63646', 'Good', 'series, spy conspiracy science fiction'],
      ['tmdb-tv-70523', 'Good', 'series, time conspiracy mystery'],
      ['tmdb-tv-80335', 'Good', 'series, institutional conspiracy thriller'],
    ]),
    blurb:
      'These shows keep mystery momentum tied to secret systems, institutional coverups, or hidden power structures.',
    followUps: [
      followUp('fu-conspiracy-1', 'Keep it grounded', 'filter', 'grounded'),
      followUp('fu-conspiracy-2', 'More sci-fi conspiracy', 'filter', 'sci-fi-conspiracy'),
    ],
    stage1Findings: [
      passFinding(
        'gate-conspiracy-top',
        'Conspiracy fit',
        'The top results all include an explicit conspiracy or hidden-system thread.',
        'Mr. Robot, Counterpart, Dark, and Homecoming directly support the requested pattern.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The ranking keeps conspiracy as the organizing pattern.'),
      quality('Blurb', 'Excellent', 'The blurb concisely names the common thread.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain the conspiracy angle.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions split grounded and sci-fi variants.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-conspiracy-series-root',
  }),
  makeRootNode({
    id: 'node-baseline-conspiracy-series-root',
    seedId: 'seed-conspiracy-series',
    runId: 'run-baseline',
    resultSet: nodeResults('series', [
      ['tmdb-tv-66732', 'Good', 'series, government conspiracy mystery'],
      ['tmdb-tv-54344', 'Needs Work', 'series, grief mystery drama'],
      ['tmdb-tv-1396', 'Needs Work', 'series, crime drama'],
      ['tmdb-tv-70523', 'Good', 'series, time conspiracy mystery'],
      ['tmdb-tv-95396', 'Needs Work', 'series, workplace mystery with hidden systems'],
      ['tmdb-tv-66276', 'Good', 'series, institutional crime mystery'],
      ['tmdb-tv-80335', 'Good', 'series, institutional conspiracy thriller'],
    ]),
    blurb: 'Here are dark mystery shows with secrets.',
    followUps: [
      followUp('fu-base-conspiracy-1', 'More dark shows', 'filter', 'dark-shows'),
      followUp('fu-base-conspiracy-2', 'More dark shows', 'filter', 'dark-shows'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-conspiracy-golden',
        'Golden-set coverage',
        'Required conspiracy anchors are missing.',
        'Mr. Robot and Counterpart are not returned.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The set favors general secrets over conspiracy structure.'),
      quality('Blurb', 'Needs Work', 'The blurb is too broad for the requested pattern.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not distinguish conspiracy from mystery.'),
      quality('Follow-Up Suggestions', 'Fail', 'Duplicate broad follow-ups reduce usefulness.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-conspiracy-series-root',
  }),
  makeRootNode({
    id: 'node-current-contact-discovery-root',
    seedId: 'seed-contact-discovery',
    runId: 'run-current',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-329865', 'Excellent', 'movie, first-contact communication science fiction'],
      ['tmdb-movie-157336', 'Excellent', 'movie, cosmic discovery science fiction'],
      ['tmdb-movie-670292', 'Good', 'movie, human-machine contact science fiction'],
      ['tmdb-movie-300668', 'Good', 'movie, alien-zone discovery science fiction'],
    ]),
    blurb:
      'These focus on communication, discovery, and awe rather than pure combat, with some adjacent world-discovery picks below.',
    followUps: [
      followUp('fu-contact-1', 'Less action-heavy', 'refine', 'less-action'),
      followUp('fu-contact-2', 'More alien communication', 'filter', 'alien-communication'),
    ],
    stage1Findings: [
      passFinding(
        'gate-contact-golden',
        'Golden-set coverage',
        'The strongest contact and discovery anchors are present.',
        'Arrival and Interstellar are ranked first and second.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The top results strongly match the theme.'),
      quality('Blurb', 'Good', 'The blurb captures the difference between discovery and action.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain direct and adjacent matches.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions clarify tone and subtheme.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-contact-discovery-root',
  }),
  makeRootNode({
    id: 'node-baseline-contact-discovery-root',
    seedId: 'seed-contact-discovery',
    runId: 'run-baseline',
    resultSet: nodeResults('movie', [
      ['tmdb-movie-438631', 'Good', 'movie, world-discovery science fiction'],
      ['tmdb-movie-603', 'Needs Work', 'movie, science fiction action'],
      ['tmdb-movie-577922', 'Needs Work', 'movie, puzzle-driven science fiction action'],
      ['tmdb-movie-335984', 'Needs Work', 'movie, identity-focused science fiction noir'],
      ['tmdb-movie-300668', 'Good', 'movie, alien-zone discovery science fiction'],
      ['tmdb-movie-670292', 'Good', 'movie, human-machine contact science fiction'],
      ['tmdb-movie-693134', 'Good', 'movie, world-discovery science fiction sequel'],
    ]),
    blurb: 'Here are serious science fiction movies with big ideas.',
    followUps: [
      followUp('fu-base-contact-1', 'More serious', 'refine', 'serious-tone'),
      followUp('fu-base-contact-2', 'More aliens', 'filter', 'aliens'),
    ],
    stage1Findings: [
      failFinding(
        'gate-base-contact-golden',
        'Golden-set coverage',
        'The strongest communication and discovery anchors are missing.',
        'Arrival and Interstellar are not returned.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'The set is sci-fi, but it misses the clearest contact anchors.'),
      quality('Blurb', 'Needs Work', 'The blurb is generic and does not mention contact or communication.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not clarify the requested theme.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions are usable, though broad.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-contact-discovery-root',
  }),
  makeRootNode({
    id: 'node-current-tech-paranoia-root',
    seedId: 'seed-tech-paranoia',
    runId: 'run-current',
    resultSet: nodeResults('series', [
      ['tmdb-tv-62560', 'Excellent', 'series, technology paranoia thriller'],
      ['tmdb-tv-95396', 'Excellent', 'series, corporate systems workplace thriller'],
      ['tmdb-tv-80335', 'Good', 'series, institutional technology-adjacent thriller'],
      ['tmdb-tv-63646', 'Good', 'series, bureaucratic science fiction paranoia'],
      ['tmdb-tv-73411', 'Good', 'series, pharmaceutical experiment technology drama'],
    ]),
    blurb:
      'These picks make systems, companies, experiments, or bureaucracies feel like the real source of danger.',
    followUps: [
      followUp('fu-tech-1', 'More corporate settings', 'filter', 'corporate-setting'),
      followUp('fu-tech-2', 'Less supernatural', 'filter', 'less-supernatural'),
    ],
    stage1Findings: [
      passFinding(
        'gate-tech-system-threat',
        'Systemic threat',
        'The top results keep technology or institutional systems central.',
        'Mr. Robot, Severance, Homecoming, Counterpart, and Maniac all tie threat to systems.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Good', 'The top set stays close to tech and systemic paranoia.'),
      quality('Blurb', 'Excellent', 'The blurb names the shared threat pattern well.'),
      quality('Custom Descriptions', 'Good', 'Descriptions explain the system or company angle.'),
      quality('Follow-Up Suggestions', 'Good', 'Suggestions refine setting and supernatural drift.'),
    ],
    rawPayloadId: 'tmdb-fixture-current-tech-paranoia-root',
  }),
  makeRootNode({
    id: 'node-baseline-tech-paranoia-root',
    seedId: 'seed-tech-paranoia',
    runId: 'run-baseline',
    resultSet: nodeResults('series', [
      ['tmdb-tv-70523', 'Needs Work', 'series, science fiction mystery'],
      ['tmdb-tv-66732', 'Needs Work', 'series, supernatural government mystery'],
      ['tmdb-tv-62560', 'Excellent', 'series, technology paranoia thriller'],
      ['tmdb-tv-1396', 'Fail', 'series, crime drama'],
      ['tmdb-tv-66276', 'Needs Work', 'series, institutional crime mystery'],
      ['tmdb-tv-95396', 'Excellent', 'series, corporate systems workplace thriller'],
      ['tmdb-tv-54344', 'Fail', 'series, grief mystery drama'],
    ]),
    blurb: 'Here are intense shows where people uncover disturbing secrets.',
    followUps: [
      followUp('fu-base-tech-1', 'More dark shows', 'filter', 'dark-shows'),
      followUp('fu-base-tech-2', 'More tech', 'filter', 'tech-paranoia'),
    ],
    stage1Findings: [
      warningFinding(
        'gate-base-tech-precision',
        'Tech paranoia precision',
        'Several results are dark mysteries without a strong technology or company-system angle.',
        'Breaking Bad and The Leftovers are especially weak for the requested technology/system threat.',
      ),
    ],
    qualityAssessments: [
      quality('Search Results', 'Needs Work', 'Some anchors are present, but the set drifts into general dark TV.'),
      quality('Blurb', 'Needs Work', 'The blurb omits technology and systemic threat.'),
      quality('Custom Descriptions', 'Needs Work', 'Descriptions do not consistently justify tech-paranoia fit.'),
      quality('Follow-Up Suggestions', 'Good', 'One suggestion can recover the tech angle.'),
    ],
    rawPayloadId: 'tmdb-fixture-baseline-tech-paranoia-root',
  }),
];

const currentAdditionalRootNodeIds = additionalRootNodeFixtures
  .filter((node) => node.runId === 'run-current')
  .map((node) => node.id);

const baselineAdditionalRootNodeIds = additionalRootNodeFixtures
  .filter((node) => node.runId === 'run-baseline')
  .map((node) => node.id);

const conversationNodeFixtures: ConversationNode[] = [
  {
    id: 'node-current-scifi-root',
    seedId: 'seed-smart-scifi',
    runId: 'run-current',
    depth: 0,
    query: starterTextFor('seed-smart-scifi'),
    path: [starterTextFor('seed-smart-scifi')],
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
    path: [starterTextFor('seed-smart-scifi'), 'Make it a little lighter'],
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
    path: [starterTextFor('seed-smart-scifi'), 'More first-contact stories'],
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
    path: [starterTextFor('seed-smart-scifi'), 'Only newer releases'],
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
    query: starterTextFor('seed-keanu-action'),
    path: [starterTextFor('seed-keanu-action')],
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
    path: [starterTextFor('seed-keanu-action'), 'More sci-fi action'],
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
    path: [starterTextFor('seed-keanu-action'), 'Skip sequels'],
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
    query: starterTextFor('seed-workplace-mystery'),
    path: [starterTextFor('seed-workplace-mystery')],
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
    path: [starterTextFor('seed-workplace-mystery'), 'More like Severance'],
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
    path: [starterTextFor('seed-workplace-mystery'), 'Less supernatural'],
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
    query: starterTextFor('seed-smart-scifi'),
    path: [starterTextFor('seed-smart-scifi')],
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
    query: starterTextFor('seed-keanu-action'),
    path: [starterTextFor('seed-keanu-action')],
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
    query: starterTextFor('seed-workplace-mystery'),
    path: [starterTextFor('seed-workplace-mystery')],
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
  ...additionalRootNodeFixtures,
];

export const conversationNodes: ConversationNode[] = conversationNodeFixtures.map(withSevenResults);

export const evaluationRuns: EvaluationRun[] = [
  {
    id: 'run-current',
    label: 'Fixture Run 2026.05.31',
    date: '2026-05-31T09:30:00-07:00',
    systemLabel: 'Conv Search Mock v0.1',
    querySetName,
    querySetVersion,
    configVersion: 'eval-config-v1',
    seedIds: [...allSeedIds],
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
      ...currentAdditionalRootNodeIds,
    ],
    snapshot: {
      status: 'Needs Review',
      stage1FailureRate: 10,
      stage2Average: 3.1,
      seedCount: 10,
      exploredPaths: 14,
      goldenCoverage: 100,
    },
  },
  {
    id: 'run-baseline',
    label: 'Fixture Run 2026.05.17',
    date: '2026-05-17T11:00:00-07:00',
    systemLabel: 'Conv Search Mock baseline',
    querySetName,
    querySetVersion,
    configVersion: 'eval-config-v1',
    seedIds: [...allSeedIds],
    nodeIds: [
      'node-baseline-scifi-root',
      'node-baseline-keanu-root',
      'node-baseline-workplace-root',
      ...baselineAdditionalRootNodeIds,
    ],
    snapshot: {
      status: 'Failing',
      stage1FailureRate: 100,
      stage2Average: 1.9,
      seedCount: 10,
      exploredPaths: 10,
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
