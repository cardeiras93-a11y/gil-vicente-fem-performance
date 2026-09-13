export * from './matchRegistry';
import { getMatchById } from './matchRegistry';
import type { MatchInfo } from './matchRegistry';

export function getDefaultMatchData(): MatchInfo {
  return getMatchById('match_20260910_gvfc_gil_u14');
}
