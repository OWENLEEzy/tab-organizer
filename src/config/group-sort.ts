import type { GroupSortOption } from '../types';

export const DEFAULT_GROUP_SORT: GroupSortOption = 'count';

const GROUP_SORT_OPTIONS = new Set<GroupSortOption>([
  'count',
  'name',
  'lastAccessed',
]);

export function isGroupSortOption(value: unknown): value is GroupSortOption {
  return typeof value === 'string' && GROUP_SORT_OPTIONS.has(value as GroupSortOption);
}

export function normalizeGroupSortBy(value: unknown): GroupSortOption {
  return isGroupSortOption(value) ? value : DEFAULT_GROUP_SORT;
}
