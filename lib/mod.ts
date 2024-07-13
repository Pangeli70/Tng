/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20220909 Alpha version
 * @version 0.2 APG 20230416 Moved to its own microservice
 * @version 0.3 APG 20230712 Components
 * @version 0.4 APG 20240504 Page menu component + renaming
 * @version 0.5 APG 20240630 BrdTng_IPageData
 * ----------------------------------------------------------------------------
 */

export { BrdTng_Service } from "./services/BrdTng_Service.ts";

export { BrdTng_FormButtons_Component } from "./components/BrdTng_FormButtons_Component.ts";
export { BrdTng_HiddenValue_Component } from "./components/BrdTng_HiddenValue_Component.ts";
export { BrdTng_NumericValue_Component } from "./components/BrdTng_NumericValue_Component.ts";
export { BrdTng_PageMenu_Component } from "./components/BrdTng_PageMenu_Component.ts";
export { BrdTng_Select_Component } from "./components/BrdTng_Select_Component.ts";
export { BrdTng_TextValue_Component } from "./components/BrdTng_TextValue_Component.ts";
export { BrdTng_Title_Component } from "./components/BrdTng_Title_Component.ts";

export type { BrdTng_IComponent } from "./interfaces/BrdTng_IComponent.ts";
export type { BrdTng_IHyperlink } from "./interfaces/BrdTng_IHyperlink.ts";
export type { BrdTng_IPageData } from "./interfaces/BrdTng_IPageData.ts";
export type { BrdTng_ISelectOption } from "./interfaces/BrdTng_ISelectOption.ts";

