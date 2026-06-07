// TODO: replace static imports with API calls to the backend once it is set up.
// Each of these datasets should be fetched via a GET endpoint (e.g. GET /api/parts/blades)
// so that the frontend always reflects the latest data from the database.

import bladesRaw       from "./seeds/blades.json";
import bitsRaw         from "./seeds/bits.json";
import ratchetsRaw     from "./seeds/ratchets.json";
import lockChipsRaw    from "./seeds/lock_chips.json";
import metalBladesRaw  from "./seeds/metal_blades.json";
import assistBladesRaw from "./seeds/assist_blades.json";
import overBladesRaw   from "./seeds/over_blades.json";

export type Part = {
  name: string;
  imageUrl: string;
};

function toParts(raw: { name: string; image_url: string }[]): Part[] {
  return raw.map(({ name, image_url }) => ({ name, imageUrl: image_url }));
}

export const BLADES       = toParts(bladesRaw);
export const BITS         = toParts(bitsRaw);
export const RATCHETS     = toParts(ratchetsRaw);
export const LOCK_CHIPS   = toParts(lockChipsRaw);
export const METAL_BLADES = toParts(metalBladesRaw);
export const ASSIST_BLADES = toParts(assistBladesRaw);
export const OVER_BLADES  = toParts(overBladesRaw);
