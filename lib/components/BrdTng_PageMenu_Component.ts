/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504 Page menu
 * ----------------------------------------------------------------------------
 */

import {
    Uts
} from "../deps.ts";
import {
    BrdTng_IComponent
} from "../interfaces/BrdTng_IComponent.ts";
import {
    BrdTng_IHyperlink
} from "../interfaces/BrdTng_IHyperlink.ts";



export class BrdTng_PageMenu_Component implements BrdTng_IComponent {


    private _items: BrdTng_IHyperlink[];

    constructor(aoptions: BrdTng_IHyperlink[]) {
        this._items = aoptions;
    }

    render(alang: Uts.BrdUts_TLanguage) {

        const r: string[] = [];

        r.push(`<p style="text-align: right;" >`);

        for (const item of this._items) {

            const label = Uts.BrdUts_Translate(item.label, alang);

            const icon = (item.icon !== undefined) ? `<img src="${item.icon}" alt="${label}" /> ` : "";

            const title = item.title ?
                Uts.BrdUts_Translate(item.title, alang) :
                label;

            r.push(`  <a href="${item.url}" role="button" title="${title}" >`);
            r.push(`    ${icon}${label}`);
            r.push(`  </a>`);
        }
        r.push("  </p>");

        return r.join("\n\r");

    }


}
