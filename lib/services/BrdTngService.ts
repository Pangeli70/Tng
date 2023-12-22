/** ---------------------------------------------------------------------------
 * @module Brd/Tng
 * @author APG
 * @version 0.1 APG 20220909 Alpha version
 * @version 0.2 APG 20230416 Moved to its own microservice
 * @version 0.3 APG 20230712 Imporved Regex for JS recognition
 * ----------------------------------------------------------------------------
 */

type TBrdTngTemplateFunction = (a: any) => string;


/**
 * Modified by APG, starting from the original Drash Template Engine named Jae
 */
export class BrdTngService {

    /** Master and partials files */
    static #filesCache: Map<string, string> = new Map();

    /** Html chunks hash Cache */
    static #chunksCache: Map<number, string> = new Map();

    /** Processed javascript functions */
    static #functionsCache: Map<string, TBrdTngTemplateFunction> = new Map();

    /** Path to the templates folder  */
    static #templatesPath = "./srv/templates";

    /** Dimension of the chached chunks */
    static #cacheChunksLongerThan = 100

    /** Chaching mechanisms are enabled*/
    static #useCache = false;


    static Init(aviewsPath: string, auseCache = false, acacheChunksLongerThan = 100) {
        this.#templatesPath = aviewsPath;
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


    static async Render(atemplateFile: string, atemplateData: unknown) {

        if (!atemplateData) {
            atemplateData = {};
        }

        const templateName = this.#normalizeTemplateName(this.#templatesPath, atemplateFile);

        const noCache = (<any>atemplateData).noCache ? (<any>atemplateData).noCache : false;

        let templateFunction: TBrdTngTemplateFunction;

        let weHaveNewFunctionToStoreInCache = false;

        if (this.#useCache && noCache == false && this.#functionsCache.has(templateName)) {
            templateFunction = this.#functionsCache.get(templateName)!;
            console.log("BrdTngService - Retrieved from cache the function for " + templateName);
        }
        else {
            const js = await this.#getTemplateAsJavascript(templateName, noCache);
            try {
                templateFunction = new Function("templateData", js) as TBrdTngTemplateFunction;
                weHaveNewFunctionToStoreInCache = true;
                console.log("BrdTngService - Rebuilt the function for " + templateName);
            } catch (err) {
                return this.#handleJSError(err, templateName, js);
            }
        }

        let result = "";
        try {
            result = templateFunction!.apply(this, [atemplateData]);
            // now we are sure that works so we can store!
            if (this.#useCache && weHaveNewFunctionToStoreInCache) {
                this.#functionsCache.set(templateName, templateFunction!);
                console.log("BrdTngService - Stored in cache the function for " + templateName);
                console.log("BrdTngService - Cache now contains " + this.#functionsCache.size.toString() + " functions.");
            }
        } catch (err) {
            result = this.#handleJSError(err, templateName, templateFunction!.toString());
        }
        return result;
    }


    static async #getTemplateAsJavascript(aviewName: string, anoCache: boolean) {
        const templateHtml = await this.#getTemplate(aviewName, anoCache);

        const rawJs: string[] = [];
        rawJs.push("with(templateData) {");
        rawJs.push("const r=[];");

        this.#convertTemplateInJs(templateHtml, rawJs);

        rawJs.push('return r.join("");');
        rawJs.push('}');

        const js = rawJs.join("\r\n");
        return js;
    }


    static #normalizeTemplateName(aviewsPath: string, atemplateFile: string,) {
        if (this.#templatesPath.endsWith("/") && atemplateFile.startsWith("/")) {
            aviewsPath += atemplateFile.slice(1);
        }
        else if (!this.#templatesPath.endsWith("/") && !atemplateFile.startsWith("/")) {
            aviewsPath += `/${atemplateFile}`;
        }
        else {
            aviewsPath += atemplateFile;
        }
        return aviewsPath;
    }


    static async #getTemplate(aviewName: string, anoCache: boolean) {

        let templateHtml: string = await this.#getTemplateFile(aviewName, anoCache);

        // Check if the template extends another template typically a master page
        const extended = templateHtml.match(/<% extends.* %>/g);
        if (extended) {
            // Look for all the ancestors
            for (let i = 0; i < extended.length; i++) {
                const match = extended[i];
                templateHtml = templateHtml.replace(match, "");
                const masterTemplate = match.replace('<% extends("', "").replace('") %>', "");
                const masterViewName = this.#templatesPath + masterTemplate
                const masterHtml = await this.#getTemplateFile(masterViewName, anoCache);
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
                const partialHtml = await this.#getTemplateFile(partialView, anoCache);
                //insert the partial html inside the template
                templateHtml = templateHtml.replace(match, partialHtml);
            }
        }

        return templateHtml;
    }


    static async #getTemplateFile(aviewName: string, anoCache: boolean) {

        if (this.#useCache && anoCache == false && this.#filesCache.has(aviewName)) {
            return this.#filesCache.get(aviewName)!;
        }
        else {

            let templateContent = ""
            try {
                templateContent = await Deno.readTextFile(aviewName);
            } catch (e) {
                console.log(e.message)
                templateContent = this.#geErrorTemplate(aviewName, e.message);
            }
            // TODO Could be redundant in some cases if we overwite the cache. 
            // Or we waste memory since cache wont be used
            // -- APG 20220802
            this.#filesCache.set(aviewName, templateContent);
            return templateContent;
        }

    }


    static #convertTemplateInJs(atemplateHtml: string, arawJSCode: string[]) {
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


    static #convertToJs(achunk: string, isJs: boolean) {
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


    static #geErrorTemplate(aviewName: string, aerror: string, aprintableJs = ""){
        const r = `
        <!doctype html>
        <html lang=it-IT>
            <head>
                <meta charset=utf-8>
                <title>ERROR</title>
            </head>
            <body style="margin-left:20%; margin-right:20%; font-family: 'Segoe UI', 'Verdana';">
                <h1>BrdTngService Error!</h1>
                <h2>In the view: ${aviewName}</h2>
                <h3 style="color:red;">${aerror}</h3>
                <p>Cut and paste following code as potentially invalid javascript.</p>
                <hr>
                <pre style="font-family: 'Lucida console','Courier new'">${aprintableJs}</pre>
            </body>
        </html>
        `;
        return r;
    }

    static #handleJSError(aerr: Error, aviewName: string, ajs: string) {
        const notDefIndex = (<string>aerr.message).indexOf(" is not defined");

        console.error("Template engine error: " + aerr.message);
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


