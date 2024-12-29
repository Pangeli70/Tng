/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.1 APG 20240504
 * @version 0.2 APG 20240804 Reserved flag
 * @version 0.3 APG 20240813 Only for anonymous flag
 * @version 0.4 APG 20240912 Children
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

    isReserved: boolean; // @0.2

    isAnonymousOnly?: boolean; // @0.3

    children?: ApgTng_IHyperlink[]; // @0.4
}