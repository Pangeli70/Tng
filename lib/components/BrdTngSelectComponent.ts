/** ---------------------------------------------------------------------------
 * @module Brd/Tng
 * @author APG
 * @version 0.3 APG 20230712 Components
 * ----------------------------------------------------------------------------
 */

import { IBrdTngComponent } from "../interfaces/IBrdTngComponent.ts";
import { IBrdTngSelectOption } from "../interfaces/IBrdTngSelectOption.ts";

export class BrdTngSelectComponent implements IBrdTngComponent {

    private _id: string;
    private _options: IBrdTngSelectOption[];

    constructor(aid: string, aoptions: IBrdTngSelectOption[]) {
        this._id = aid;
        this._options = aoptions;
    }

    render() {
        const r: string[] = [];
        r.push(`  <select id="${this._id}" name="${this._id}"required>`);
        for (const option of this._options) {
            r.push(`  <option value="${option.value}" ${option.selected ? "selected" : ''}>`)
            r.push(`    ${option.label}`);
            r.push(`  </option>`)
        }
        r.push("  </select>");
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