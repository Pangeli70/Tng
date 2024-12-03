/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240504
 * ----------------------------------------------------------------------------
 */

import {ApgTng_IComponent} from "../interfaces/ApgTng_IComponent.ts";



export class ApgTng_NumericValue_Component implements ApgTng_IComponent {

    private _id: string;
    private _label: string;
    private _isRequired?: boolean;

    private _value?: number;
    set Value(avalue: number) { this._value = avalue };
    private _min?: number;
    set Min(avalue: number) { this._min = avalue };
    private _max?: number;
    set Max(avalue: number) { this._max = avalue };
    private _step?: number;
    set Step(avalue: number) { this._step = avalue };
    private _post?: string;
    set Post(avalue: string) { this._post = avalue };


    constructor(
        aid: string,
        alabel: string,
        aisRequired: boolean,
    ) {
        this._id = aid;
        this._label = alabel;
        this._isRequired = aisRequired;
    }



    render() {

        const r: string[] = []

        const required = (this._isRequired) ? " required" : "";

        const value = (this._value) ? ` value="${this._value}"` : "";

        const min = (this._min) ? ` min="${this._min}"` : "";
        const max = (this._max) ? ` max="${this._max}"` : "";
        const step = (this._step) ? ` step="${this._step}"` : "";

        const post = (this._post) ? ` ${this._post}` : "";

        let limits = "";
        if (this._min) limits += ` min:${this._min}`;
        if (this._max) limits += ` max:${this._max}`;
        if (this._step) limits += ` step:${this._step}`;
        if (limits != "") limits = ` <span style="font-size: 0.8rem; font-style:italic">(${limits} )</span>`

        r.push(`<label for="${this._id} ">${this._label}${post}${limits}</label>`);
        r.push(`
            <input type="number" id="${this._id}" name="${this._id}"
                ${value}${min}${max}${step}${required}>`);

        return r.join("\n");

    }


}
