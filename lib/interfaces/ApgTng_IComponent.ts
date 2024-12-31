/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2023/07/12] Components
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";



export interface ApgTng_IComponent {

    render(alang?: Uts.ApgUts_TLanguage): string;

}