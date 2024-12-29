/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.1 APG 20230712
 * ----------------------------------------------------------------------------
 */

import {ApgTng_IComponent} from "../interfaces/ApgTng_IComponent.ts";
import {ApgTng_ISelectOption} from "../interfaces/ApgTng_ISelectOption.ts";



export class ApgTng_Select_Component implements ApgTng_IComponent {

    private _id: string;
    private _options: ApgTng_ISelectOption[];
    private _label: string;
    private _isRequired: boolean;

    constructor(
        aid: string,
        aoptions: ApgTng_ISelectOption[],
        alabel: string,
        aisRequired: boolean,
    ) {
        this._id = aid;
        this._options = aoptions;
        this._label = alabel;
        this._isRequired = aisRequired;

    }

    render() {

        const r: string[] = [];

        const required = (this._isRequired) ? " required" : "";

        r.push(`
            <label for="${this._id}">${this._label}</label>`);
        
        r.push(`
            <select id="${this._id}" name="${this._id}"${required}>`);
        
        r.push(`
                <option value="">...</option>`);
        
        for (const option of this._options) {

            r.push(`
                <option value="${option.value}" ${option.selected ? " selected" : ''}>`)
            r.push(`
                    ${option.label}`);
            r.push(` 
                </option>`)
        }

        r.push(`
            </select>`);
        
        return r.join("\n\r");
    }


    
    select(avalue: string) {

        for (const option of this._options) {
            if (option.value == avalue) {
                option.selected = true;
            }
            else {
                option.selected = undefined;
            }

        }
    }

}


