/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/11/02]
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 /** ---------------------------------------------------------------------------
*/

export interface ApgTng_IPagination {

    pages: number;


    page: number;


    from: number;


    to: number;


    items: number;


    next: string;


    prev: string;


    first: string;

    
    last: string;
}
