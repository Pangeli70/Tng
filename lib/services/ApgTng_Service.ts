/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] Angeli Paolo Giusto
 * @version 0.1 APG 20220909 Alpha version
 * @version 0.2 APG 20230416 Moved to its own microservice
 * @version 0.3 APG 20230712 Improved Regex for JS recognition
 * @version 0.4 APG 20240630 ApgTng_IPageData
 * @version 0.5 APG 20240804 Chunk cache management
 * ----------------------------------------------------------------------------
 */

import {
    Uts
} from "../deps.ts";
import {
    ApgTng_IChunk
} from "../interfaces/ApgTng_IChunk.ts";
import {
    ApgTng_IPageData
} from "../interfaces/ApgTng_IPageData.ts";

type ApgTng_TemplateFunction = (a: any) => string;


/**
 * Modified by APG, starting from the original Drash Template Engine named Jae
 */
export class ApgTng_Service extends Uts.ApgUts_BaseService {


    static override InitModuleName() {
        return this.ModuleFromUrl(import.meta.url)
    }

    static readonly REMOTE_PREFIX = "http";

    /**
     * Master and partials files cache. It is useful only for debugging
     */
    static #filesCache: Map<string, string> = new Map();

    /**
     * Html chunks Cache by hash. The cache is always filled and
     * maintained, but it is effectively used only if the UseCache flag is enabled
     */
    static #chunksCache: Map<number, ApgTng_IChunk> = new Map();

    /**
     * Processed javascript templatefunctions 
     */
    static #functionsCache: Map<string, ApgTng_TemplateFunction> = new Map();

    /**
     * Path to the templates folder, can be local or remote
     */
    static TemplatesPath = "./srv/templates";

    /**
     * Minimum size of the chunk in chararacters to get in the cache. Default is 100
     */
    static ChunkSize = 100

    /**
     * Caching mechanisms flag. Default is false.
     */
    static UseCache = false;



    static Init(
        atemplatesPath: string,
        auseCache = false,
        acacheChunksLongerThan = 100
    ) {
        this.TemplatesPath = atemplatesPath;
        this.ChunkSize = acacheChunksLongerThan;
        this.UseCache = auseCache;
    }


    /**
     * This method is not referenced directly!
     * It is used by the interpolator to create the template function
     */
    static #getChunk(achunkHash: number) {
        const maybeChunk = this.#chunksCache.get(achunkHash);
        if (!maybeChunk) {
            return `<p>Chunk with hash ${achunkHash} is not present in the ApgTngService chunks' Cache</p>`
        }
        else {
            return maybeChunk.content;
        }
    }



    static async Render(
        atemplateData: ApgTng_IPageData,
        arenderingEvents: Uts.ApgUts_ILogEvent[]
    ) {
        let result = "";
        let templateFunction: ApgTng_TemplateFunction;
        let weHaveNewFunctionToStoreInCache = false;

        const isLocalTemplate = !atemplateData.page.template.startsWith(this.REMOTE_PREFIX);

        const noCache = atemplateData.cache.useIt == undefined ? false : atemplateData.cache.useIt;

        const templateFile = (isLocalTemplate) ?
            this.#normalizeTemplateFile(this.TemplatesPath, atemplateData.page.template) :
            atemplateData.page.template;


        if (this.UseCache && noCache == false && this.#functionsCache.has(templateFile)) {

            templateFunction = this.#functionsCache.get(templateFile)!;

            const message = "Retrieved from cache the function for " + templateFile;
            const event = Uts.ApgUts_LogService.LogInfo(import.meta.url, this.Render, message);
            arenderingEvents.push(event);

        }
        else {

            const master = atemplateData.page.master ?? "";

            const r = await this.#getTemplateAsJavascript(templateFile, noCache, master);

            if (!r.ok) { 

                const event = Uts.ApgUts_LogService.LogInfo(import.meta.url, this.Render, r.getMessages());
                arenderingEvents.push(event);

                result = r.payload as string;
                return result
            }

            const maybeJs = r.payload as string;

            try {

                templateFunction = new Function("templateData", maybeJs) as ApgTng_TemplateFunction;
                weHaveNewFunctionToStoreInCache = true;

                const message = "Rebuilt the function for " + templateFile;
                const event = Uts.ApgUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

            } catch (err) {

                const message = "Error in Js conversion:" + err.message;
                const event = Uts.ApgUts_LogService.LogError(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

                return this.#handleJsConversionError(err, templateFile, maybeJs);
            }
        }


        try {

            if (this.UseCache) {
                atemplateData.cache = {
                    useIt: true,
                    chunks: this.#chunksCache
                }
            }

            result = templateFunction!.apply(this, [atemplateData]);
            // now we are sure that works so we can store! And we store even if use cache flag is false
            // if (this.#useCache && weHaveNewFunctionToStoreInCache) {
            if (weHaveNewFunctionToStoreInCache) {

                this.#functionsCache.set(templateFile, templateFunction!);

                let message = "Stored in cache the function for " + templateFile;
                let event = Uts.ApgUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

                message = "Cache now contains " + this.#functionsCache.size.toString() + " functions.";
                event = Uts.ApgUts_LogService.LogInfo(import.meta.url, this.Render, message);
                arenderingEvents.push(event);

            }
        } catch (err) {

            const message = "Error in JS evaluation:" + err.message;
            const event = Uts.ApgUts_LogService.LogError(import.meta.url, this.Render, message);
            arenderingEvents.push(event);

            result = this.#handleJsInterpolationError(err, templateFile, templateFunction!.toString());
        }
        return result;
    }



    static async #getTemplateAsJavascript(
        atemplateFile: string,
        anoCache: boolean,
        amaster: string = ""
    ) {

        let r = await this.#getTemplate(atemplateFile, anoCache, amaster);
        if(!r.ok) {
            return r;
        }
        const templateHtml = r.payload as string;
        const rawJs: string[] = [];
        rawJs.push("with(templateData) {");
        rawJs.push("const r=[];");

        r = this.#convertTemplateInJs(atemplateFile, templateHtml, rawJs);
        if (!r.ok) {
            return r;
        }
        
        rawJs.push('return r.join("");');
        rawJs.push('}');

        const js = rawJs.join("\r\n");

        r.setPayload(js, 'string')

        return r;
    }



    static #normalizeTemplateFile(
        atemplatesPath: string,
        atemplateFile: string
    ) {
        if (this.TemplatesPath.endsWith("/") && atemplateFile.startsWith("/")) {
            atemplatesPath += atemplateFile.slice(1);
        }
        else if (!this.TemplatesPath.endsWith("/") && !atemplateFile.startsWith("/")) {
            atemplatesPath += `/${atemplateFile}`;
        }
        else {
            atemplatesPath += atemplateFile;
        }
        return atemplatesPath;
    }



    static async #getTemplate(
        atemplateFile: string,
        anoCache: boolean,
        amaster = ""
    ) {
        const METHOD = this.Method(this.#getTemplate);
        let r = new Uts.ApgUts_Result<string>();

        let templateHtml: string = "";

        if (atemplateFile.startsWith(this.REMOTE_PREFIX)) {
            r = await this.#getTemplateFileFromUrl(atemplateFile, anoCache);
        }
        else {
            r = await this.#getTemplateFileFromDisk(atemplateFile, anoCache);
        }
        if (!r.ok) {
            return r;
        }

        templateHtml = r.payload as string;

        let masterTemplate = "";

        // Check if the template extends another template typically a master page
        const extended = templateHtml.match(/<% extends.* %>/g);

        if (extended) {
            // Look for all the ancestors
            for (let i = 0; i < extended.length; i++) {

                const match = extended[i];
                templateHtml = templateHtml.replace(match, "");
                masterTemplate = match.replace('<% extends("', "").replace('") %>', "");

            }
        }

        if (amaster !== "") {
            masterTemplate = amaster;
        }
        else {
            if (masterTemplate == "") {
                const message = "Template " + atemplateFile + " does not extend a master template";
                return r.error(METHOD, message);
            }

        }

        let masterHtml = ""
        if (masterTemplate.startsWith(this.REMOTE_PREFIX)) {
            r = await this.#getTemplateFileFromUrl(masterTemplate, anoCache)
        }
        else {
            const masterViewName = this.TemplatesPath + masterTemplate
            r = await this.#getTemplateFileFromDisk(masterViewName, anoCache);
        }
        if (!r.ok) {
            return r;
        }

        masterHtml = r.payload as string;
        // insert the current template in the ancestor's
        templateHtml = masterHtml.replace("<% yield %>", templateHtml);


        // Check recursively for partials means this template has child templates or component views
        let partials;
        while ((partials = templateHtml.match(/<% partial.* %>/g))) {
            for (let i = 0; i < partials.length; i++) {
                const match = partials[i];
                const partialName = match
                    .replace('<% partial("', "")
                    .replace('") %>', "");
                const partialView = this.TemplatesPath + partialName
                r = await this.#getTemplateFileFromDisk(partialView, anoCache);

                if(!r.ok) {
                    return r;
                }
                const partialHtml = r.payload as string;
                //insert the partial html inside the template
                templateHtml = templateHtml.replace(match, partialHtml);
            }
        }

        r.setPayload(templateHtml, 'string');
        return r;
    }



    static async #getTemplateFileFromDisk(
        atemplateFile: string,
        anoCache: boolean
    ) {
        const METHOD = this.Method(this.#getTemplateFileFromDisk);
        const r = new Uts.ApgUts_Result<string>();

        let templateContent = ""

        if (this.UseCache && anoCache == false && this.#filesCache.has(atemplateFile)) {

            templateContent = this.#filesCache.get(atemplateFile)!;

        }
        else {

            const ERROR_TYPE = "Template local fetching";

            try {
                templateContent = await Deno.readTextFile(atemplateFile);
                this.#filesCache.set(atemplateFile, templateContent);
            } catch (e) {
                r.error(METHOD, e.message)
                templateContent = this.#geErrorTemplate(atemplateFile, ERROR_TYPE, e.message);
            }

        }

        r.setPayload(
            templateContent,
            'string'
        );

        return r;
    }



    static async #getTemplateFileFromUrl(
        aurl: string,
        anoCache: boolean,

    ) {
        const METHOD = this.Method(this.#getTemplateFileFromUrl);
        const r = new Uts.ApgUts_Result<string>();

        let templateContent = ""

        if (this.UseCache && anoCache == false && this.#filesCache.has(aurl)) {

            templateContent = this.#filesCache.get(aurl)!

        }
        else {

            const ERROR_TYPE = "Template remote fetching";

            try {
                const response = await fetch(aurl);
                if (response.status !== 200) {
                    throw new Error(`HTTP error! fetching ${aurl} - status: ${response.status}`);
                }
                templateContent = await response.text();
                this.#filesCache.set(aurl, templateContent);
            } catch (e) {
                r.error(METHOD, e.message)
                templateContent = this.#geErrorTemplate(aurl, ERROR_TYPE, e.message);
            }

        }

        r.setPayload(
            templateContent,
            'string'
        );

        return r;

    }



    static #convertTemplateInJs(
        asource: string,
        atemplateHtml: string,
        arawJSCode: string[]
    ) {
        const METHOD = this.Method(this.#convertTemplateInJs);
        const r = new Uts.ApgUts_Result<string>();

        const firstSplitChunks = atemplateHtml.split("<%");
        let first = true;

        for (const chunk of firstSplitChunks) {

            if (first) {
                const html = this.#convertHtmlToJs(chunk, asource);
                arawJSCode.push(html); // html
                first = false;
            }
            else {
                const secondSplit = chunk.split("%>");
                if (secondSplit.length != 2) {
                    const message = `The chunk does not contain a properly formatted end markup ( %> ) symbol: ${chunk}`;
                    return r.error(METHOD, message);
                }
                const js = this.#convertJsToJs(secondSplit[0])
                arawJSCode.push(js);
                const html = this.#convertHtmlToJs(secondSplit[1], asource)
                arawJSCode.push(html);
            }
        }
        return r;
    }



    static #convertJsToJs(
        achunk: string,
    ) {

        let r = "";
        const regExp =
            // Original from jay
            // /(^( )?(function|var|let|const|=|if|else|switch|case|break|for|do|while|push|{|}|;))(.*)?/g;
            // Modified version by APG
            // /      (function|    let|const|for|while|in|do|of|if|else|switch|case|break|\{|\}|;|=|\(|\))/g;
            // got by chatGpt 2023/01/15 
            // /(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|push|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|\{|\}|;)/g
            // Simplified by previous 
            /(break|case|const|continue|do|else|for|function|if|instanceof|let|new|push|return|switch|this|typeof|var|while|\{|\}|;|=)/g

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


        return r;
    }



    static #convertHtmlToJs(
        achunk: string,
        asource: string
    ) {
        let r = "";

        let chunkHash = 0;
        // If longer than cache threshold, Create and store cacheable chunk anyways
        if (achunk.length > this.ChunkSize) {
            chunkHash = this.#brycHash(achunk);
            if (!this.#chunksCache.has(chunkHash)) {

                const chunk: ApgTng_IChunk = {
                    hash: chunkHash,
                    content: achunk,
                    source: asource,
                    usage: 1
                }
                this.#chunksCache.set(chunkHash, chunk);
            }
        }

        if (this.UseCache && this.#chunksCache.has(chunkHash)) {

            const chunk = this.#chunksCache.get(chunkHash)!;
            chunk.usage++;

            // Insert html chunk as reference to the chunks Hash
            r = `r.push( cache.chunks.get(${chunkHash})?.content )`;
        }
        else {
            // Insert html chunk as string
            r = 'r.push(`' + achunk + '`);'
        }

        return r;
    }



    static #geErrorTemplate(
        atemplateFile: string,
        aerrorType: string,
        aerror: string,
        aprintableJs = ""
    ) {
        const r = `
        <!doctype html>
        <html>
            <head>
                <meta charset=utf-8>
                <title>ERROR</title>
            </head>
            <body style="margin-left:20%; margin-right:20%; font-family: 'Segoe UI', 'Verdana';">
                <h1>${this.NAME} ${aerrorType} error!</h1>
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


    static #printableJs(aJsString: string) {
        return aJsString
            .replaceAll(">", "&gt")
            .replaceAll("<", "&lt")
            .replaceAll("%", "&amp")
            .replaceAll(" ", "&nbsp;")
            .replaceAll("\n", "\n&nbsp;&nbsp;");
    }


    static #handleJsConversionError(
        aerror: Error,
        atemplateName: string,
        ainvalidJs: string
    ) {
        const ERROR_TYPE = "Template conversion";
        let printableJS = this.#printableJs(ainvalidJs);
        printableJS = `function rawJavascript (templateData){\n${printableJS}\n}`;

        const r = this.#geErrorTemplate(atemplateName, ERROR_TYPE, aerror.message, printableJS);

        return r;
    }




    static #handleJsInterpolationError(
        aerror: Error,
        atemplateName: string,
        ainvalidInterpolation: string
    ) {
        const ERROR_TYPE = "Template interpolation";
        let printableJS = this.#printableJs(ainvalidInterpolation);
        printableJS = `function compiledJavascript (templateData){\n${printableJS}\n}`;

        const notDefIndex = (<string>aerror.message).indexOf(" is not defined");
        if (notDefIndex != -1) {
            const missingItem = (<string>aerror.message).substring(0, notDefIndex);
            const missingmarkup = `<span style="color:red"><b>${missingItem}</b></span>`;
            printableJS = printableJS.replaceAll(missingItem, missingmarkup);
        }

        const r = this.#geErrorTemplate(atemplateName, ERROR_TYPE, aerror.message, printableJS);

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



    static GetCaches() {


        const chunks: {
            key: string, label: string
        }[] = [];
        for (const [key, value] of this.#chunksCache) {
            chunks.push({
                key: key.toString(),
                label: value.source + " - " + key + " - " + value.content.length + " - " + value.usage
            });
        }
        chunks.sort((a: {
            key: string, label: string
        }, b: {
            key: string, label: string
        }) => b.label.localeCompare(a.label));


        const functions: {
            key: string, label: string
        }[] = [];
        for (const [key, value] of this.#functionsCache) {
            functions.push({
                key: key.toString(),
                label: key + " - " + value.toString().length
            });
        }
        functions.sort((a: {
            key: string, label: string
        }, b: {
            key: string, label: string
        }) => b.label.localeCompare(a.label));


        const files: {
            key: string, label: string
        }[] = [];
        for (const [key, value] of this.#filesCache) {
            files.push({
                key: key.toString(),
                label: key + " - " + value.toString().length
            });
        }
        files.sort((a: {
            key: string, label: string
        }, b: {
            key: string, label: string
        }) => b.label.localeCompare(a.label));

        const r = {

            chunks,

            functions,

            files

        }

        return r;
    }



    static GetFileFromCache(afileId: string) {

        const r = {
            id: afileId,
            content: this.#filesCache.get(afileId) ?? "File not found",
        }

        return r
    }



    static GetFunctionFromCache(afunctionId: string) {

        const r = {
            id: afunctionId,
            content: this.#functionsCache.get(afunctionId) ?? "Function not found"
        }

        return r
    }



    static GetChunkFromCache(achunkId: number) {

        const r = {
            id: achunkId,
            content: this.#chunksCache.get(achunkId)?.content ?? "Chunk not found",
        }

        return r
    }



    static ClearCache() {

        this.#chunksCache.clear();
        this.#functionsCache.clear();
        this.#filesCache.clear();
        
    }

}


