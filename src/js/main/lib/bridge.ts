import { evalTS } from "../../lib/utils/bolt";
import type { RehyleDocument } from "../schema/types";

/**
 * Send a validated Rehyle document to ExtendScript for creation in AE.
 */
export async function createInAE(doc: RehyleDocument) {
  return evalTS("createFromDocument", doc as any);
}

/**
 * Read the active composition (or selection) from AE and return as JSON.
 */
export async function generateFromAE(selectionOnly: boolean) {
  return evalTS("generateFromComp", selectionOnly);
}
