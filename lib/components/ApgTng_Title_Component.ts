/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * ----------------------------------------------------------------------------
 */

import {ApgTng_IComponent} from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_Title_Component implements ApgTng_IComponent {

    private _texts: string[];
    private _level: 1 | 2 | 3 | 4 | 5 | 6;

    constructor(
        atexts: string[],
        alevel: 1 | 2 | 3 | 4 | 5 | 6
    ) {
        this._level = alevel;
        this._texts = atexts;
    }

    render() {

        const r: string[] = [];

        const tag=`h${this._level}`

        r.push(`  <${tag}>`);

        for (const item of this._texts) {

            r.push(`    ${item} `);

        }
        r.push(`  </${tag}>`);

        return r.join("\n\r");

    }


}
