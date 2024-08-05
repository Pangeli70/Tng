/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * @version 0.1 APG 20240804 Reserved flag
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

    reserved: boolean; // @0.2
}