/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.1 APG 20241102 Alpha version
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
