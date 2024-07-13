/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240630
 * @version 0.2 APG 20240716 Logo JS
 * ----------------------------------------------------------------------------
 */




export interface BrdTng_IPageData {

    microservice: {
        name: string;
        title: string;
    }

    page: {

        /** Template file */
        template: string;

        /** Logo js for templates */
        logoJs?: string //@0.2

        /** Non usare la cache per questo template */
        noCache?: boolean;

        /** Title of the page */
        title: string;

        /** Date Time when the paga was created */
        rendered: string;

        /** Map of pre rendered components by Id */
        components?: Record<string, string>
        
        /** Raw data for the template interpolation*/
        data?: Record<string, any>
    },

    user: {

        /** User email */
        email?: string

        /** User role */
        role: string
    }

}