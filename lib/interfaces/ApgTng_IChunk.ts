/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2024/08/04]
 * @version 1.0.0 [APG 2024/12/30] Moving to Deno 2
 * ----------------------------------------------------------------------------
 */

/**
 * Data structure for html shared chunks cache
 */
export interface ApgTng_IChunk {

    /**
     * Bryck hash of the chunk
     */
    hash: number,

    /**
     * Content of the chunk
     */
    content: string,

    /**
     * Template file that is the source of the chunk
     */
    source: string

    /**
     * Number of times the chunk has been used
     */
    usage: number
}
