/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/05/04]
 * @version 0.9.2 [APG 2024/08/04] Reserved flag
 * @version 0.9.3 [APG 2024/08/13] Only for anonymous flag
 * @version 0.9.4 [APG 2024/09/12] Children
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";


/**
 * Mutilanguage Hyperlink to manage menus and lists of links
 */
export interface ApgTng_IHyperlink {

    url: string;

    label: Uts.ApgUts_IMultilanguage;

    title?: Uts.ApgUts_IMultilanguage;

    icon?: string;

    isReserved: boolean; // @0.9.2

    isAnonymousOnly?: boolean; // @0.9.3

    children?: ApgTng_IHyperlink[]; // @0.9.4
}