/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * ----------------------------------------------------------------------------
 */

import {
    Uts
} from "../deps.ts";
import {
    ApgTng_IComponent
} from "../interfaces/ApgTng_IComponent.ts";
import {
    ApgTng_IHyperlink
} from "../interfaces/ApgTng_IHyperlink.ts";



export class ApgTng_PageMenu_Component implements ApgTng_IComponent {


    private _items: ApgTng_IHyperlink[];

    constructor(aoptions: ApgTng_IHyperlink[]) {
        this._items = aoptions;
    }

    render(alang: Uts.ApgUts_TLanguage) {

        const r: string[] = [];

        r.push(`<p style="text-align: right;" >`);

        for (const item of this._items) {

            const label = Uts.ApgUts_Translator.Translate(item.label, alang);

            const icon = (item.icon !== undefined) ? `<img src="${item.icon}" alt="${label}" /> ` : "";

            const title = item.title ?
                Uts.ApgUts_Translator.Translate(item.title, alang) :
                label;

            r.push(`  <a href="${item.url}" role="button" title="${title}" >`);
            r.push(`    ${icon}${label}`);
            r.push(`  </a>`);
        }
        r.push("  </p>");

        return r.join("\n\r");

    }


}
