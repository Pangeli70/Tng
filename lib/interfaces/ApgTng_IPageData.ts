/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240630
 * @version 0.2 APG 20240716 Logo JS
 * @version 0.3 APG 20240727 Master file
 * @version 0.4 APG 20240731 Languange and translations
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";


/**
 * Template page data
 */
export interface ApgTng_IPageData {

    microservice: {
        name: string;
        title: string;
    }

    page: {

        /**
         * Host for assets can be "" for "http://localhost" or a CDN
         */
        assetsHost?: string; // @0.3

        /** Master file */
        // TODO Move this as non optional parameter -- APG 20240727
        master?: string;

        /** Template file */
        template: string;

        /** Favicon for templates */
        favicon?: string // @0.3

        /** Logo js for templates */
        logoJs: string // @0.2

        /** Do not use the cache for this template. It is useful when you are in development */
        noCache?: boolean;

        /** Title of the page */
        title: string;

        /** Language */
        lang: Uts.ApgUts_TLanguage; // @0.4

        /** Date Time when the page was created */
        rendered: string;

        /** Map of pre rendered components by Id */
        components?: Record<string, string>

        /** Raw data for the template interpolation*/
        data?: Record<string, any>

        /** Translations by id */
        translations?: Record<string, Uts.ApgUts_IMultilanguage> // @0.4
    },

    user: {

        /** User email */
        email?: string

        /** User role */
        role: string
    }

}