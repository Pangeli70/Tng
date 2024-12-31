/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/05/04]
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";
import { ApgTng_IComponent } from "../interfaces/ApgTng_IComponent.ts";
import { ApgTng_IHyperlink } from "../interfaces/ApgTng_IHyperlink.ts";



export class ApgTng_Component_PageMenu implements ApgTng_IComponent {


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
