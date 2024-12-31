/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/05/04]
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

import { ApgTng_IComponent } from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_Component_FormButtons implements ApgTng_IComponent {


    private _submit: string;
    private _cancel?: string;

    constructor(
        asubmit: string,
        acancel?: string,
    ) {
        this._submit = asubmit;
        this._cancel = acancel;
    }

    render() {

        const r: string[] = [];

        r.push(`  <p style="text-align: right;">`);

        const cancel = (this._cancel) ? this._cancel : "";
        const submit = (this._submit) ? this._submit : "";

        if (cancel != "") {
            r.push(`
            <button
                type="reset"
                onclick="window.history.back()"
                style="width: 10rem; display: inline-block;"
            >${cancel}</button>`);
        }

        if (submit != "") {
            r.push(`
            <button
                type="submit"
                style="width: 10rem; display: inline-block;"
            >${this._submit}</button>`);
        }

        r.push("  </p>");

        return r.join("\n\r");

    }


}
