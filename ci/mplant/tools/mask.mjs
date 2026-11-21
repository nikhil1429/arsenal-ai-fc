// unit mplant · THE NAME MASK. One non-LIVE organ's file name carries a person's name (the mlaw2 census masked its row by
// hand). This mask holds no name: it holds the 16-hex sha256 prefix of the organ name, and every tool of ci/mplant/ passes an
// organ name through mask() before it writes or prints it.
import { createHash } from "node:crypto";
const MASKED = new Set(["a99ba3218aa43543"]);
const h = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
/** @param {string} organ */
export const mask = (organ) => MASKED.has(h(organ)) ? `<masked organ ${h(organ).slice(0, 6)}>` : organ;
/** @param {string} text */
export const maskText = (text, organs) => organs.reduce((t, o) => (MASKED.has(h(o)) ? t.split(o).join(mask(o)) : t), text);
