/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/05/04]
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

import { ApgTng_IComponent } from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_Component_HiddenValue implements ApgTng_IComponent {

    private _id: string;
    private _value: string;
    private _hasLabel: boolean;

    private _label?: string;
    set Label(alabel: string) { this._label = alabel }
    
    private _post?: string;
    set Post(apost: string) { this._post = apost }

    constructor(
        aid: string,
        avalue: string,
        ahasLabel: boolean
    ) {
        this._id = aid;
        this._value = avalue;
        this._hasLabel = ahasLabel;
    }

    render() {

        const r: string[] = [];
        r.push(`<input type="hidden" id="${this._id}" name="${this._id}" value="${this._value}">`);

        if (this._hasLabel) {
            const post = (this._post) ? ` ${this._post}` : "";
            const label = (this._label) ? this._label : this._id;
            r.push(`<label>${label}: ${this._value}${post}</label>`);
        }

        return r.join("\n");

    }


}
