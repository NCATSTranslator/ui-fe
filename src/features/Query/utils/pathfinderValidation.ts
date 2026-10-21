import { AutocompleteItem } from '@/features/Query/types/querySubmission';

export type PathfinderValidation =
  | { ok: true; itemOne: AutocompleteItem; itemTwo: AutocompleteItem }
  | { ok: false; error: string };

/** Checks that both pathfinder terms are selected, returning the message to show when one is not. */
export const validatePathfinderTerms = (itemOne: AutocompleteItem | null, itemTwo: AutocompleteItem | null): PathfinderValidation => {
  if (!itemOne && !itemTwo)
    return { ok: false, error: "No terms selected, please select two search terms." };
  if (!itemOne || itemOne.id === "")
    return { ok: false, error: "First search term is not selected, please select a valid term." };
  if (!itemTwo || itemTwo.id === "")
    return { ok: false, error: "Second search term is not selected, please select a valid term." };
  return { ok: true, itemOne, itemTwo };
};
