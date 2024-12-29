/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.1 APG 20240504
 * ----------------------------------------------------------------------------
 */

import {ApgTng_IComponent} from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_TextValue_Component implements ApgTng_IComponent {

    private _id: string;
    private _label: string;
    private _value?: string | number;
    private _isRequired?: boolean


    constructor(
        aid: string,
        alabel: string,
        aisRequired: boolean,
        avalue?: string | number,
    ) {
        this._id = aid;
        this._label = alabel;
        this._value = avalue;
        this._isRequired = aisRequired;
    }



    render() {

        const r: string[] = []

        const required = (this._isRequired) ? " required" : "";

        const value = (this._value) ? ` value="${this._value}"` : "";

        r.push(`<label for="${this._id}">${this._label}</label>`);
        r.push(`<input type="text" id="${this._id}" name="${this._id}"${value}${required}">`);

        return r.join("\n");

    }


}
