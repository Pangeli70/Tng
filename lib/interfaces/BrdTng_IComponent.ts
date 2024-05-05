/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20230712 Components
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";



export interface BrdTng_IComponent {

    render(alang?: Uts.BrdUts_TLanguage): string;

}