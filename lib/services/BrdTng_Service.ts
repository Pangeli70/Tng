/** ---------------------------------------------------------------------------
 * @module [BrdTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20220909 Alpha version
 * @version 0.2 APG 20230416 Moved to its own microservice
 * @version 0.3 APG 20230712 Improved Regex for JS recognition
 * @version 0.4 APG 20240630 BrdTng_IPageData
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";
import { BrdTng_IPageData } from "../interfaces/BrdTng_IPageData.ts";

type BrdTng_TemplateFunction = (a: any) => string;


/**
 * Modified by APG, starting from the original Drash Template Engine named Jae
 */
export class BrdTng_Service {

    static readonly REMOTE_PREFIX = "http"; 

    /** Master and partials files */
    static #filesCache: Map<string, string> = new Map();

    /** Html chunks hash Cache */
    static #chunksCache: Map<number, string> = new Map();

    /** Processed javascript functions */
    static #functionsCache: Map<string, BrdTng_TemplateFunction> = new Map();

    /** Path to the templates folder  */
    static #templatesPath = "./srv/templates";

    /** Dimension of the chached chunks */
    static #cacheChunksLongerThan = 100

    /** Chaching mechanisms are enabled*/
    static #useCache = false;


    static Init(
        atemplatesPath: string,
        auseCache = false,
        acacheChunksLongerThan = 100
    ) {
        this.#templatesPath = atemplatesPath;
        this.#cacheChunksLongerThan = acacheChunksLongerThan;
        this.#useCache = auseCache;
    }


    static #getChunk(achunkHash: number) {
        const maybeChunk = this.#chunksCache.get(achunkHash);
        if (!maybeChunk) {
            return `<p>Chunk with hash ${achunkHash} is not present in the BrdTngService chunks' Cache</p>`
        }
        else {
            return maybeChunk!;
        }
    }



    static async Render(
        atemplateData: BrdTng_IPageData,
        arenderingEvents: Uts.BrdUts_ILogEvent[]
    ) {

        let templateFunction: BrdTng_TemplateFunction;
        let weHaveNewFunctionToStoreInCache = false;

        const isLocalTemplate = !atemplateData.page.template.startsWith(this.REMOTE_PREFIX);

        const noCache = atemplateData.page.noCache == undefined ? false : atemplateData.page.noCache;

        const templateFile = (isLocalTemplate) ?
            this.#normalizeTemplateFile(this.#templatesPath, atemplateData.page.template) :
            atemplateData.page.template;


        if (this.#useCache && noCache == false && this.#functionsCache.has(templateFile)) {

            templateFunction = this.#functionsCache.get(templateFile)!;

            const message = "Retrieved from cache the function for " + templateFile;
            const event = Uts.BrdUts_LogService.LogInfo(import.meta.url, this.Render, message);
            arenderingEvents.push(event);

        }
        else {
            const js = await this.#getTemplateAsJavascript(templateFile, noCache);
            try {

                templateFunction = new Function("templateData", js) as BrdTng_TemplateFunction;
                weHaveNewFunctionToStoreInCache = true;

                const message = "Rebuilt the function for " + templateFile;
                const event = Uts.BrdUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

            } catch (err) {

                const message = "Error in JS conversion:" + err.message;
                const event = Uts.BrdUts_LogService.LogError(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

                return this.#handleJSError(err, templateFile, js);
            }
        }

        let result = "";
        try {
            result = templateFunction!.apply(this, [atemplateData]);
            // now we are sure that works so we can store!
            if (this.#useCache && weHaveNewFunctionToStoreInCache) {

                this.#functionsCache.set(templateFile, templateFunction!);

                let message = "Stored in cache the function for " + templateFile;
                let event = Uts.BrdUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

                message = "Cache now contains " + this.#functionsCache.size.toString() + " functions.";
                event = Uts.BrdUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

            }
        } catch (err) {

            const message = "Error in JS evaluation:" + err.message;
            const event = Uts.BrdUts_LogService.LogError(import.meta.url, this.Render, message);
            arenderingEvents.push(event);

            result = this.#handleJSError(err, templateFile, templateFunction!.toString());
        }
        return result;
    }



    static async #getTemplateAsJavascript(
        atemplateFile: string,
        anoCache: boolean
    ) {
        const templateHtml = await this.#getTemplate(atemplateFile, anoCache);

        const rawJs: string[] = [];
        rawJs.push("with(templateData) {");
        rawJs.push("const r=[];");

        this.#convertTemplateInJs(templateHtml, rawJs);

        rawJs.push('return r.join("");');
        rawJs.push('}');

        const js = rawJs.join("\r\n");
        return js;
    }



    static #normalizeTemplateFile(
        atemplatesPath: string,
        atemplateFile: string
    ) {
        if (this.#templatesPath.endsWith("/") && atemplateFile.startsWith("/")) {
            atemplatesPath += atemplateFile.slice(1);
        }
        else if (!this.#templatesPath.endsWith("/") && !atemplateFile.startsWith("/")) {
            atemplatesPath += `/${atemplateFile}`;
        }
        else {
            atemplatesPath += atemplateFile;
        }
        return atemplatesPath;
    }



    static async #getTemplate(
        atemplateFile: string,
        anoCache: boolean
    ) {

        let templateHtml: string = "";
        if (atemplateFile.startsWith(this.REMOTE_PREFIX)) {
            templateHtml = await this.#getTemplateFileFromUrl(atemplateFile, anoCache);
        }
        else {
            templateHtml = await this.#getTemplateFileFromDisk(atemplateFile, anoCache);
        }

        // Check if the template extends another template typically a master page
        const extended = templateHtml.match(/<% extends.* %>/g);
        if (extended) {
            // Look for all the ancestors
            for (let i = 0; i < extended.length; i++) {
                const match = extended[i];
                templateHtml = templateHtml.replace(match, "");
                const masterTemplate = match.replace('<% extends("', "").replace('") %>', "");

                let masterHtml = ""
                if (masterTemplate.startsWith(this.REMOTE_PREFIX)) {
                    masterHtml = await this.#getTemplateFileFromUrl(masterTemplate, anoCache)
                }
                else {
                    const masterViewName = this.#templatesPath + masterTemplate
                    masterHtml = await this.#getTemplateFileFromDisk(masterViewName, anoCache);
                }
                // insert the current template in the ancestor's
                templateHtml = masterHtml.replace("<% yield %>", templateHtml);
            }
        }

        // Check recursively for partials means this template has child templates or component views
        let partials;
        while ((partials = templateHtml.match(/<% partial.* %>/g))) {
            for (let i = 0; i < partials.length; i++) {
                const match = partials[i];
                const partialName = match
                    .replace('<% partial("', "")
                    .replace('") %>', "");
                const partialView = this.#templatesPath + partialName
                const partialHtml = await this.#getTemplateFileFromDisk(partialView, anoCache);
                //insert the partial html inside the template
                templateHtml = templateHtml.replace(match, partialHtml);
            }
        }

        return templateHtml;
    }



    static async #getTemplateFileFromDisk(
        atemplateFile: string,
        anoCache: boolean
    ) {

        if (this.#useCache && anoCache == false && this.#filesCache.has(atemplateFile)) {
            return this.#filesCache.get(atemplateFile)!;
        }
        else {

            let templateContent = ""
            try {
                templateContent = await Deno.readTextFile(atemplateFile);
            } catch (e) {
                templateContent = this.#geErrorTemplate(atemplateFile, e.message);
            }
            // TODO Could be redundant in some cases if we overwite the cache. 
            // Or we waste memory since cache wont be used
            // -- APG 20220802
            this.#filesCache.set(atemplateFile, templateContent);
            return templateContent;
        }

    }



    static async #getTemplateFileFromUrl(
        aurl: string,
        anoCache: boolean
    ) {

        if (this.#useCache && anoCache == false && this.#filesCache.has(aurl)) {

            return this.#filesCache.get(aurl)!;

        }
        else {

            let templateContent = ""

            try {
                const response = await fetch(aurl);
                if (response.status !== 200) {
                    throw new Error(`HTTP error! fetching ${aurl} - status: ${response.status}`);
                }
                templateContent = await response.text();
            } catch (e) {
                templateContent = this.#geErrorTemplate(aurl, e.message);
            }

            // TODO Could be redundant in some cases if we overwite the cache. 
            // Or we waste memory since cache wont be used
            // -- APG 20220802
            this.#filesCache.set(aurl, templateContent);
            return templateContent;
        }

    }


    static #convertTemplateInJs(
        atemplateHtml: string,
        arawJSCode: string[]
    ) {

        const firstSplit = atemplateHtml.split("<%");
        let first = true;

        for (const split of firstSplit) {

            if (first) {
                arawJSCode.push(this.#convertToJs(split, false)); // html
                first = false;
            }
            else {
                const secondSplit = split.split("%>");
                arawJSCode.push(this.#convertToJs(secondSplit[0], true)); // js
                arawJSCode.push(this.#convertToJs(secondSplit[1], false));
            }
        }

    }



    static #convertToJs(
        achunk: string,
        isJs: boolean
    ) {

        let r = "";

        if (isJs) {
            const regExp = /(function |let |const |for |while |in |do |of |if |else |switch |case |break|\{|\}|;|=|\(|\))/g;
            const chunk = achunk.replaceAll("\r\n", " ").trim();
            const matches = chunk.match(regExp);
            if (matches != null) {
                // we expect supported js code, so insert js chunk as is
                r = chunk;
            }
            else {
                // instead insert interpolated value
                r = `r.push(${achunk});`
            }
        }
        else {
            if (this.#useCache && achunk.length > this.#cacheChunksLongerThan) {
                const chunkHash = this.#brycHash(achunk);
                if (!this.#chunksCache.has(chunkHash)) {
                    this.#chunksCache.set(chunkHash, achunk)
                }
                // Insert html chunk as reference to the chunks Hash
                r = `r.push( this.#getChunk(${chunkHash}))`;
            }
            else {
                // Insert html chunk as string
                r = 'r.push(`' + achunk + '`);'
            }
        }

        return r;
    }



    static #geErrorTemplate(
        atemplateFile: string,
        aerror: string,
        aprintableJs = ""
    ) {
        const r = `
        <!doctype html>
        <html lang=it-IT>
            <head>
                <meta charset=utf-8>
                <title>ERROR</title>
            </head>
            <body style="margin-left:20%; margin-right:20%; font-family: 'Segoe UI', 'Verdana';">
                <h1>BrdTngService Error!</h1>
                <h2>In the view: ${atemplateFile}</h2>
                <h3 style="color:red;">${aerror}</h3>
                <p>Cut and paste following code as potentially invalid javascript.</p>
                <hr>
                <pre style="font-family: 'Lucida console','Courier new'">${aprintableJs}</pre>
            </body>
        </html>
        `;
        return r;
    }



    static #handleJSError(
        aerr: Error,
        aviewName: string,
        ajs: string
    ) {


        const notDefIndex = (<string>aerr.message).indexOf(" is not defined");

        let printableJS = ajs
            .replaceAll(">", "&gt")
            .replaceAll("<", "&lt")
            .replaceAll("%", "&amp");

        if (notDefIndex != -1) {
            const missingItem = (<string>aerr.message).substring(0, notDefIndex);
            const missingmarkup = `<span style="color:red"><b>${missingItem}</b></span>`;
            printableJS = printableJS.replaceAll(missingItem, missingmarkup);
        }

        printableJS = `function anonymous (templateData){\n${printableJS}\n}`;

        const r = this.#geErrorTemplate(aviewName, aerr.message, printableJS);

        return r;
    }



    static #brycHash(astr: string, aseed = 0) {

        let h1 = 0xdeadbeef ^ aseed;
        let h2 = 0x41c6ce57 ^ aseed;
        for (let i = 0; i < astr.length; i++) {
            const ch = astr.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
        return hash;

    }

}


