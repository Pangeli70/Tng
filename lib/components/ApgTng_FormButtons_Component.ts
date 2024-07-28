/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * ----------------------------------------------------------------------------
 */

import {
    ApgTng_IComponent
} from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_FormButtons_Component implements ApgTng_IComponent {


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

        if (cancel != "") {
            r.push(`
            <button
                type="reset"
                onclick="window.history.back()"
                style="width: 10rem; display: inline-block;"
            >${cancel}</button>`);
        }

        r.push(`
            <button
                type="submit"
                style="width: 10rem; display: inline-block;"
            >${this._submit}</button>`);


        r.push("  </p>");

        return r.join("\n\r");

    }


}
