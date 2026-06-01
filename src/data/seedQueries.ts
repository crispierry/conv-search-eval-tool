import rawQuerySet from './seedQueries.json';
import type { SeedQuery } from '../types';

type RawSeedQuery = {
  id: string;
  query: string;
  category: SeedQuery['category'];
  expected_media_type: SeedQuery['expectedMediaType'];
  expected_result_count?: SeedQuery['expectedResultCount'];
  constraints?: string[];
  golden_set?: string[];
  notes?: string;
};

type RawSeedQuerySet = {
  name: string;
  version: string;
  description?: string;
  queries: RawSeedQuery[];
};

const querySet = rawQuerySet as RawSeedQuerySet;

export const querySetName = querySet.name;
export const querySetVersion = querySet.version;
export const querySetDescription = querySet.description;

export const seedQueries: SeedQuery[] = querySet.queries.map((seed) => ({
  id: seed.id,
  query: seed.query,
  category: seed.category,
  expectedMediaType: seed.expected_media_type,
  expectedResultCount: seed.expected_result_count,
  constraints: seed.constraints ?? [],
  goldenSet: seed.golden_set ?? [],
  notes: seed.notes ?? '',
}));

export const allSeedIds = seedQueries.map((seed) => seed.id);

const seedQueryTextById = Object.fromEntries(
  seedQueries.map((seed) => [seed.id, seed.query]),
) as Record<string, string>;

export function starterTextFor(seedId: string) {
  return seedQueryTextById[seedId] ?? seedId;
}
