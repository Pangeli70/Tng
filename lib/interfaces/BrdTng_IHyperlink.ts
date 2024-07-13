/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504 Page menu
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";


/**
 * Hyperlink multilingua per gestire menu e liste di collegamenti
 */
export interface BrdTng_IHyperlink {

    url: string;

    label: Uts.BrdUts_IMultilanguage;

    title?: Uts.BrdUts_IMultilanguage;

    icon?: string;
}