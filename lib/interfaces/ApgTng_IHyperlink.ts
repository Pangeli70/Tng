/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504 Page menu
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";


/**
 * Hyperlink multilingua per gestire menu e liste di collegamenti
 */
export interface ApgTng_IHyperlink {

    url: string;

    label: Uts.ApgUts_IMultilanguage;

    title?: Uts.ApgUts_IMultilanguage;

    icon?: string;
}