/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2022/09/09] Alpha version
 * @version 0.9.2 [APG 2023/04/16] Moved to its own microservice
 * @version 0.9.3 [APG 2023/07/12] Components
 * @version 0.9.4 [APG 2024/05/04] Page menu component + renaming
 * @version 0.9.5 [APG 2024/06/30] ApgTng_IPageData
 * @version 0.9.6 [APG 2024/11/07] IPagination
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

export { ApgTng_Service } from "./services/ApgTng_Service.ts";

export { ApgTng_Component_FormButtons } from "./components/ApgTng_Component_FormButtons.ts";
export { ApgTng_Component_HiddenValue } from "./components/ApgTng_Component_HiddenValue.ts";
export { ApgTng_Component_NumericValue } from "./components/ApgTng_Component_NumericValue.ts";
export { ApgTng_Component_PageMenu } from "./components/ApgTng_Component_PageMenu.ts";
export { ApgTng_Component_Select } from "./components/ApgTng_Component_Select.ts";
export { ApgTng_Component_TextValue } from "./components/ApgTng_Component_TextValue.ts";
export { ApgTng_Component_Title } from "./components/ApgTng_Component_Title.ts";

export type { ApgTng_IChunk } from "./interfaces/ApgTng_IChunk.ts";
export type { ApgTng_IComponent } from "./interfaces/ApgTng_IComponent.ts";
export type { ApgTng_IHyperlink } from "./interfaces/ApgTng_IHyperlink.ts";
export type { ApgTng_IPageData } from "./interfaces/ApgTng_IPageData.ts";
export type { ApgTng_IPagination } from "./interfaces/ApgTng_IPagination.ts";
export type { ApgTng_ISelectOption } from "./interfaces/ApgTng_ISelectOption.ts";

