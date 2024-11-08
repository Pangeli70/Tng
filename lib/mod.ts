/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20220909 Alpha version
 * @version 0.2 APG 20230416 Moved to its own microservice
 * @version 0.3 APG 20230712 Components
 * @version 0.4 APG 20240504 Page menu component + renaming
 * @version 0.5 APG 20240630 ApgTng_IPageData
 * @version 0.6 APG 2024ii07 IPagination
 * ----------------------------------------------------------------------------
 */

export { ApgTng_Service } from "./services/ApgTng_Service.ts";

export { ApgTng_Component_FormButtons } from "./components/ApgTng_FormButtons_Component.ts";
export { ApgTng_HiddenValue_Component } from "./components/ApgTng_HiddenValue_Component.ts";
export { ApgTng_NumericValue_Component } from "./components/ApgTng_NumericValue_Component.ts";
export { ApgTng_PageMenu_Component } from "./components/ApgTng_PageMenu_Component.ts";
export { ApgTng_Select_Component } from "./components/ApgTng_Select_Component.ts";
export { ApgTng_TextValue_Component } from "./components/ApgTng_TextValue_Component.ts";
export { ApgTng_Title_Component } from "./components/ApgTng_Title_Component.ts";

export type { ApgTng_IChunk } from "./interfaces/ApgTng_IChunk.ts";
export type { ApgTng_IComponent } from "./interfaces/ApgTng_IComponent.ts";
export type { ApgTng_IHyperlink } from "./interfaces/ApgTng_IHyperlink.ts";
export type { ApgTng_IPageData } from "./interfaces/ApgTng_IPageData.ts";
export type { ApgTng_IPagination } from "./interfaces/ApgTng_IPagination.ts";
export type { ApgTng_ISelectOption } from "./interfaces/ApgTng_ISelectOption.ts";

