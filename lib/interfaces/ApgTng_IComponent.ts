/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.1 APG 20230712 Components
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";



export interface ApgTng_IComponent {

    render(alang?: Uts.ApgUts_TLanguage): string;

}