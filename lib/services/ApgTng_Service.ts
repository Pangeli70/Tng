/** ---------------------------------------------------------------------------
 * @module [ApgTng]
 * @author [APG] ANGELI Paolo Giusto
 * @version 0.9.1 [APG 2022/09/09] Alpha version
 * @version 0.9.2 [APG 2023/04/16] Moved to its own microservice
 * @version 0.9.3 [APG 2023/07/12] Improved Regex for JS recognition
 * @version 0.9.4 [APG 2024/06/30] ApgTng_IPageData
 * @version 0.9.5 [APG 2024/08/04] Chunk cache management
 * @version 1.0.0 [APG 2024/11/07] Updated to state of art of ApgUts
 * @version 1.0.1 [APG 2024/12/30] Moving to Deno 2 + Better events tracing
 * @version 1.0.2 [APG 2025/03/09] Corrected partials loading from CDN
 * ----------------------------------------------------------------------------
 */

import { Uts } from "../deps.ts";
import { ApgTng_IChunk } from "../interfaces/ApgTng_IChunk.ts";
import { ApgTng_IPageData } from "../interfaces/ApgTng_IPageData.ts";

type ApgTng_TemplateFunction = (a: any) => string;


/**
 * Modified by APG, starting from the original Drash Template Engine named Jae
 */
export class ApgTng_Service extends Uts.ApgUts_Service {


    static override InitServiceName() {
        return ApgTng_Service.name
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
     * Path to the templates folder
     */
    static LocalTemplatesPath = "./srv/templates";

    /**
     * Minimum size of the chunk in chararacters to get in the cache. Default is 100
     */
    static ChunkSize = 100

    /**
     * Caching mechanisms flag. Default is false.
     */
    static UseCache = false;

    /**
     * Log events flag. Default is false.
     */
    static LogInfoEvents = false; //@ V1.0.1



    static Setup(
        atemplatesPath: string,
        auseCache = false,
        acacheChunksLongerThan = 100
    ) {
        this.LocalTemplatesPath = atemplatesPath;
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
    ) {
        const METHOD = this.Render.name;
        const events: Uts.ApgUts_ILoggableEvent[] = [];

        let html = "";
        let templateFunction: ApgTng_TemplateFunction;
        let weHaveNewFunctionToStoreInCache = false;

        const useCache = atemplateData.cache.useIt == undefined ? false : atemplateData.cache.useIt;

        const templateFile = atemplateData.page.template;


        if (this.UseCache && useCache && this.#functionsCache.has(templateFile)) {

            templateFunction = this.#functionsCache.get(templateFile)!;
            events.push(this.#newEvent_jsFunctionRetrievedFromCache(templateFile, METHOD));

        }
        else {

            const r = await this.#getTemplateAsJavascript(atemplateData, useCache);

            if (!r.ok) {

                events.push(this.#newEvent_getTemplateAsJsError(r.joinMessages(), METHOD));
                html = r.payload!;
                return { html, events }

            }

            const maybeJs = r.payload as string;

            try {

                templateFunction = new Function("templateData", maybeJs) as ApgTng_TemplateFunction;
                weHaveNewFunctionToStoreInCache = true;
                events.push(this.#newEvent_jsFunctionCreated(templateFile, METHOD));

            } catch (e) {

                const err = e as Error;
                events.push(this.#newEvent_jsFunctionCreationError(err, METHOD));
                html = this.#handleJsConversionError(err, templateFile, maybeJs);
                return { html, events }

            }
        }


        try {

            if (this.UseCache) {
                atemplateData.cache = {
                    useIt: true,
                    chunks: this.#chunksCache
                }
            }

            html = templateFunction!.apply(this, [atemplateData]);
            // NOTE: No error since here, the funcion is valid JS and we applied it
            // so now we are sure that we can store! And we store even if use cache flag is false
            // because we want to inspect the results -- APG 20241230
            if (weHaveNewFunctionToStoreInCache) {

                this.#functionsCache.set(templateFile, templateFunction!);

                events.push(this.#newEvent_jsFunctionInCache(templateFile, METHOD));
                events.push(this.#newEvent_CacheStatus(METHOD));

            }
        } catch (e) {

            const err = e as Error;
            events.push(this.#newEvent_jsEvaluationError(err, METHOD));
            html = this.#handleJsInterpolationError(err, templateFile, templateFunction!.toString());

        }
        return { html, events };
    }



    static #newEvent_jsEvaluationError(
        aerr: Error,
        amethod: string
    ) {
        const message = "Error in JS evaluation:" + aerr.message;
        const event = Uts.ApgUts_EventFactory.Error(this.name, amethod, message);
        this.LogEvent(event);
        return event;
    }



    static #newEvent_CacheStatus(
        amethod: string
    ) {
        const message = "Cache now contains " + this.#functionsCache.size.toString() + " functions.";
        const event = Uts.ApgUts_EventFactory.Info(this.name, amethod, message);
        if (this.LogInfoEvents) this.LogEvent(event);
        return event;
    }



    static #newEvent_jsFunctionRetrievedFromCache(
        atemplateFile: string,
        amethod: string
    ) {
        const message = "Retrieved from cache the function for " + atemplateFile;
        const event = Uts.ApgUts_EventFactory.Info(this.name, amethod, message);
        if (this.LogInfoEvents) this.LogEvent(event);
        return event;
    }



    static #newEvent_jsFunctionInCache(
        atemplateFile: string,
        amethod: string
    ) {
        const message = "Stored in cache the function for " + atemplateFile;
        const event = Uts.ApgUts_EventFactory.Info(this.name, amethod, message);
        if (this.LogInfoEvents) this.LogEvent(event);
        return event;
    }



    static #newEvent_jsFunctionCreationError(
        aerr: Error,
        amethod: string
    ) {
        const message = "Error in Js conversion:" + aerr.message;
        const event = Uts.ApgUts_EventFactory.Error(this.name, amethod, message);
        this.LogEvent(event);
        return event;
    }



    static #newEvent_jsFunctionCreated(
        atemplateFile: string,
        amethod: string
    ) {
        const message = "Rebuilt the function for " + atemplateFile;
        const event = Uts.ApgUts_EventFactory.Info(this.name, amethod, message);
        if (this.LogInfoEvents) this.LogEvent(event);
        return event;
    }



    static #newEvent_getTemplateAsJsError(
        amessage: string,
        amethod: string
    ) {
        const event = Uts.ApgUts_EventFactory.Info(this.name, amethod, amessage);
        if (this.LogInfoEvents) this.LogEvent(event);
        return event;
    }



    static async #getTemplateAsJavascript(
        atemplateData: ApgTng_IPageData,
        auseCache: boolean,
    ) {

        const atemplateFile = atemplateData.page.template;

        let r = await this.#getTemplateHtml(atemplateData, auseCache);
        if (!r.ok) {
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

        r.setPayload(js)

        return r;
    }




    static #normalizeTemplatePath(
        ahost: string,
        aroot: string,
        afile: string
    ) {
        let r = ahost;

        if (ahost.endsWith("/") && aroot.startsWith("/")) {
            r += aroot.slice(1);
        }
        else if (!ahost.endsWith("/") && !aroot.startsWith("/")) {
            r += `/${aroot}`;
        }
        else {
            r += aroot;
        }

        if (r.endsWith("/") && afile.startsWith("/")) {
            r += afile.slice(1);
        }
        else if (!r.endsWith("/") && !afile.startsWith("/")) {
            r += `/${afile}`;
        }
        else {
            r += afile;
        }

        return r;
    }




    static async #getTemplateHtml(
        atemplateData: ApgTng_IPageData,
        auseCache: boolean,
    ) {
        let r = new Uts.ApgUts_Result<string>();


        r = await ApgTng_Service.#getMaster(atemplateData, auseCache);
        if (!r.ok) {
            return r;
        }
        let masterHtml = r.payload as string;


        r = await this.#getPartials(
            masterHtml,
            atemplateData.page.masterHost,
            atemplateData.page.masterPath,
            atemplateData.page.isCdnMaster,
            auseCache
        )
        if (!r.ok) {
            return r;
        }
        masterHtml = r.payload as string;


        r = await ApgTng_Service.#getTemplate(atemplateData, auseCache);
        if (!r.ok) {
            return r;
        }
        let templateHtml = r.payload as string;

        r = await this.#getPartials(
            templateHtml,
            atemplateData.page.templateHost,
            atemplateData.page.templatePath,
            atemplateData.page.isCdnTemplate,
            auseCache
        )
        if (!r.ok) {
            return r;
        }
        templateHtml = r.payload as string;


        // insert the page template in the master template
        const mergedHtml = masterHtml.replace("<% yield %>", templateHtml);


        r.setPayload(mergedHtml);

        return r;
    }



    static async #getTemplate(
        atemplateData: ApgTng_IPageData,
        auseCache: boolean,
    ) {

        let r: Uts.ApgUts_Result<string>;

        const atemplateFile = this.#normalizeTemplatePath(
            atemplateData.page.templateHost,
            atemplateData.page.templatePath,
            atemplateData.page.template
        );

        if (atemplateData.page.isCdnTemplate) {
            r = await this.#getTemplateFileFromUrl(atemplateFile, auseCache);
        }
        else {
            r = await this.#getTemplateFileFromDisk(atemplateFile, auseCache);
        }
        return r;
    }



    static async #getMaster(
        atemplateData: ApgTng_IPageData,
        auseCache: boolean,
    ) {

        let r: Uts.ApgUts_Result<string>;

        const amasterFile = this.#normalizeTemplatePath(
            atemplateData.page.masterHost,
            atemplateData.page.masterPath,
            atemplateData.page.master
        );

        if (atemplateData.page.isCdnMaster) {
            r = await this.#getTemplateFileFromUrl(amasterFile, auseCache);
        }
        else {
            r = await this.#getTemplateFileFromDisk(amasterFile, auseCache);
        }
        return r;
    }



    static async #getPartial(
        ahost: string,
        apath: string,
        afile: string,
        aisCdn: boolean,
        auseCache: boolean,
    ) {

        let r: Uts.ApgUts_Result<string>;

        const apartialFile = this.#normalizeTemplatePath(
            ahost,
            apath,
            afile
        );

        if (aisCdn) {
            r = await this.#getTemplateFileFromUrl(apartialFile, auseCache);
        }
        else {
            r = await this.#getTemplateFileFromDisk(apartialFile, auseCache);
        }
        return r;
    }




    static async #getTemplateFileFromDisk(
        atemplateFile: string,
        auseCache: boolean
    ) {
        const METHOD = this.Method(this.#getTemplateFileFromDisk);
        const r = new Uts.ApgUts_Result<string>();

        let templateContent = ""

        if (this.UseCache && auseCache && this.#filesCache.has(atemplateFile)) {

            templateContent = this.#filesCache.get(atemplateFile)!;

        }
        else {

            const ERROR_TYPE = "Template local fetching";

            try {

                templateContent = await Deno.readTextFile(atemplateFile);
                this.#filesCache.set(atemplateFile, templateContent);

            } catch (e) {
                const err = e as Error;
                r.error(METHOD, err.message)
                templateContent = this.#geErrorTemplate(atemplateFile, ERROR_TYPE, err.message);

            }

        }

        r.setPayload(templateContent);

        return r;
    }



    static async #getTemplateFileFromUrl(
        aurl: string,
        auseCache: boolean,

    ) {
        const METHOD = this.Method(this.#getTemplateFileFromUrl);
        const r = new Uts.ApgUts_Result<string>();

        let templateContent = ""

        if (this.UseCache && auseCache && this.#filesCache.has(aurl)) {

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

                const err = e as Error;
                r.error(METHOD, err.message)
                templateContent = this.#geErrorTemplate(aurl, ERROR_TYPE, err.message);

            }

        }

        r.setPayload(templateContent);

        return r;

    }



    static async #getPartials(
        acurrentHtml: string,
        ahost: string,
        apath: string,
        aisCdn: boolean,
        auseCache: boolean,

    ) {

        let r = new Uts.ApgUts_Result<string>();

        // Check recursively for partials
        // Do in a while loop because the partials can be nested
        let partials;
        while ((partials = acurrentHtml.match(/<% partial.* %>/g))) {

            for (let i = 0; i < partials.length; i++) {

                const match = partials[i];
                const partialFile = match
                    .replace('<% partial("', "")
                    .replace('") %>', "");

                r = await this.#getPartial(ahost, apath, partialFile, aisCdn, auseCache)
                if (!r.ok) {
                    return r;
                }
                const partialHtml = r.payload as string;

                //insert the partial template inside the currente template
                acurrentHtml = acurrentHtml.replace(match, partialHtml);
            }
        }

        r.setPayload(acurrentHtml);

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
                    return this.Error(r, METHOD, message);
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
                <h1>${this.name} ${aerrorType} error!</h1>
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


