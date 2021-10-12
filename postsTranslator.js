const marked = require("marked");
const fs = require("fs");
// const axiosRequest = require("axios").default;
const axiosRequest = require("axios-https-proxy-fix").default;
const tokenGenerator = require("translate-google-api/src/token");
// const tunnel = require("tunnel")
// const tunnelProxy = tunnel.httpsOverHttp({
//     proxy: {
//         host: "127.0.0.1",
//         port: 7890
//     }
// })

const G_API = "https://translate.google.cn/translate_a/single";
const proxy = {
    host: "127.0.0.1",
    port: 7890,
};
const sourceLanguage = "en";
const destLanguage = "zh-CN";
const insertAutoTransMark = true
const autoTranslationMark = "auto_translation: true\n"
const isDebug = true;



const articlePath = "./README.md";
const newArticlePath = "./";
translate(articlePath, newArticlePath);

/**
 * @param  {string} articlePath
 * @param  {string} newArticlePath
 * @returns {boolean}
 */
function translate(articlePath, newArticlePath) {
    fs.readFile(articlePath, "utf-8", (err, data) => {
        if (err) {
            console.error(err);
            return false;
        }
        if (isDebug) console.log("Read markdown file:\n ", data);
        articleTranslator(data).then((res) => {
            if (isDebug) console.log("translated markdown:\n ", res);
            fs.writeFile(
                newArticlePath +
                articlePath.split("/").pop().split(".")[0] +
                `-${destLanguage}.md`,
                res,
                { flag: "w+" },
                (err) => {
                    if (err) {
                        console.error(err);
                        return false;
                    }
                }
            );
            return true;
        });
    });
}

/**
 * @param  {string} article
 * @returns {Promise(string)}
 */
async function articleTranslator(article) {
    const paragraphRegex = /([^\n]+)\n/g;
    const headingRegex = /(#+)([^\n]+)/g;
    const inlineCodeRegex = /`{1,2}[^`](.*?)`{1,2}/g;
    const codeBlockRegex = /```([\s\S]*?)```[\s]?/g;
    const frontMatterRegex = /---([\s\S]*?)---[\s]?/g;
    const listRegex = /[-|*|+][ ]+([^\s]*)/g;
    const numberedListRegex = /^[\\s]*[0-9]+\\.(.*)/g;
    const htmlTagRegex = /<("[^"]*"|'[^']*'|[^'">])*>/g
    if (isDebug) console.log("Starting Translation");
    const protectedAreas = [];
    article
        .replace(codeBlockRegex, (match, p, offset, raw) => {
            console.log(`Found Code Block ${match}`)
            protectedAreas.push({ start: offset, end: offset + match.length, type: "codeBlock", ref: match })
            return match
        })
        .replace(frontMatterRegex, (match, p, offset, raw) => {
            console.log(`Found Front Matter ${match}`)
            protectedAreas.push({ start: offset, end: offset + match.length, type: "frontMatter", ref: match })
            return match
        })
        .replace(inlineCodeRegex, (match, p, offset, raw) => {
            console.log(`Found Inline Code ${match}`)
            // protectedAreas.push({ start: offset, end: offset + match.length, type: "inlineCode" })
            return match
        })
        .replace(htmlTagRegex, (match, p, offset, raw) => {
            console.log(`Found Code Block ${match}`)
            protectedAreas.push({ start: offset, end: offset + match.length, type: "htmlTag", ref: match })
            return match
        })

    let translatedArticle = await replaceAsync(
        article,
        paragraphRegex,
        async (match, body, offset, raw) => {
            var failed = false
            var protected = false
            protectedAreas.forEach(protection => {
                if (offset >= protection.start && offset < protection.end) {
                    if (isDebug) console.log(`protected: ${body}`)
                    protected = true
                }
            })
            if (protected) return match
            if (body.match(headingRegex)) {
                let heading = headingRegex.exec(body)
                if (isDebug) console.log(`Found a title ${heading[1]} with content ${heading[2]}`);
                let dest = await translateG(
                    heading[2],
                    sourceLanguage,
                    destLanguage
                ).catch(e => {
                    if (isDebug) console.log(`Translate ${heading[2]} failed`)
                    failed = true
                })
                if (failed) dest = heading;
                return [heading[1], " ", dest, '\n'].join("");
            } else if (body.match(listRegex)) {
                let listItem = listRegex.exec(body)
                if (isDebug) console.log(`Found list item with content ${listItem[1]}`)
                let dest = await translateG(listItem[1], sourceLanguage, destLanguage).catch(e => {
                    if (isDebug) console.log(`Translate ${listItem[1]} failed`)
                    failed = true
                })
                if (failed) dest = listItem[1]
                return '- ' + dest + '\n';
            } else {
                let dest = await translateG(body, sourceLanguage, destLanguage).catch(e => {
                    if (isDebug) console.log(`Translate ${body} failed`, e)
                    failed = true
                })
                if (failed) dest = body
                return dest + '\n'
            }
        }
    );
    return insertAutoTransMark ? translatedArticle.slice(0, 4) + autoTranslationMark + translatedArticle.slice(4) : translatedArticle
}
/**
 * @param  {string} str
 * @param  {RegExp} reg
 * @param  {async function} callback
 */
async function replaceAsync(str, regex, callback) {
    const promiseQueue = [];
    str.replace(regex, (...args) => {
        promiseQueue.push(callback(...args));
    });
    let replaces = await Promise.all(promiseQueue);
    return str.replace(regex, () => replaces.shift());
}

/**
 * @param  {string} snippet
 * @param  {string} sl
 * @param  {string} tl
 * @returns {Promise}
 */
async function translateG(snippet, sl, tl) {
    if (isDebug) console.log(`Translating Text: ${snippet}`);
    let token = await tokenGenerator.get(snippet, { tld: "cn" });
    let resp = await axiosRequest.get(G_API, {
        params: {
            client: "gtx",
            sl: sl,
            tl: tl,
            dt: "t",
            q: snippet,
            otf: 1,
            ssel: 0,
            tsel: 0,
            kc: 7,
            [token.name]: token.value,
        },
        proxy: proxy,
    });
    //   if (isDebug) console.log(`Raw response: ${resp}`);
    let destBody = resp.data[0].map((resultStruct) => resultStruct[0]).join("");
    if (isDebug) console.log(`Reconstructed paragraph: ${destBody}`);
    return destBody;
}
