/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * @version 0.2 APG 20240804 Reserved flag
 * @version 0.3 APG 20240813 Only for guest flag
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

    isReserved: boolean; // @0.2

    isGuestOnly?: boolean; // @0.3
}