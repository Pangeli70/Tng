/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20240804
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
