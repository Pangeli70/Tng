/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240630
 * @version 0.2 APG 20240716 Logo JS
 * @version 0.3 APG 20240727 Master file
 * @version 0.4 APG 20240731 Language and translations
 * @version 0.5 APG 20240804 Chunks cache + custom CSS
 * @version 1.0 APG 20240813 Custom Head, custom styles and use cache
 * @version 1.1 APG 20240814 Microservice
 * ----------------------------------------------------------------------------
 */


import {
    Uts
} from "../deps.ts";
import {
    ApgTng_IChunk
} from "./ApgTng_IChunk.ts";


/**
 * Template page data
 */
export interface ApgTng_IPageData {


    microservice: Uts.ApgUts_IMicroservice; // @1.1

    page: {

        /**
         * Host for assets. Can be "" for "http://localhost" or a CDN [master]
         */
        assetsHost: string; // @0.3

        /**
         * Master file to be used to build the page
         */
        master: string;

        /**
         * Template file of the page
         */
        template: string;

        /**
         * Template comes from CDN
         */
        isCdnTemplate: boolean;

        /**
         * Primary custom css referred to assets host [master]
         */
        customCss?: string // @0.4

        /**
         * Custom head. Insert other js or css files references here [master]
         */
        customHead?: string; // @1.0

        /**
         * Custom styles for current template [master]
         */
        customStyles?: string // @1.0

        /**
         * Favicon for templates referred to assets host [master]
         */
        favicon: string // @0.3

        /**
         * Logo js for templates referred to assets host [master]
         */
        logoJs: string // @0.2

        /**
         * Title of the page should be already translated [master]
         */
        title: string;

        /**
         * Language
         */
        lang: Uts.ApgUts_TLanguage; // @0.4

        /**
         * Date Time when the page was created
         */
        rendered: string;

        /**
         * Map by Id of pre rendered components to be used when interpolation
         * in the template is way too complex.
         */
        components?: Record<string, string>

        /**
         * Raw data for the template interpolation
         */
        data?: Record<string, any>

        /**
         * Translations by id for multilanguage support
         * 
         * This can be used like the following
         * <% page.translations['<id>'] %> or
         * <% page.translations.<id> %> or
         */
        translations?: Record<string, string> // @0.4
    },

    user: {

        /**
         * User email [master]
         */
        email?: string

        /**
         * User role [master]
         */
        role: string

    }

    cache: { // @0.5

        /** 
         * Do not use the cache for this template. 
         * It is useful when you are in development
         */
        useIt: boolean; // @1.0

        /**
         * Map by Bryc hash of pre memoized chunks. This is injected by the cache system
         * to allow interpolation 
         */
        chunks?: Map<number, ApgTng_IChunk>;
    }

}