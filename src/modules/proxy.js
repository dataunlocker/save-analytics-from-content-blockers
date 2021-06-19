import proxy from "express-http-proxy";
import config from "../../config";
import url from "url";
import { mask, unmask } from "./mask";
import { info } from "../logger";

const proxyDomains = new Set(config.proxy.domains);
const maskPaths = new Set(config.proxy.maskPaths);

const replaceDomainRegex = new RegExp(
    Array.from(proxyDomains).join("|").replace(/\./g, "\\."),
    "gi"
);
const maskRegex = new RegExp(
    Array.from(maskPaths).join("|").replace(/\//g, "\\/"),
    "gi"
);
const replaceDomainsForHost = (host) => (match, pos, str) => {
    const escapedSlashes = str[pos - 2] === "\\" && str[pos - 2] === "/" // wat?
    const r = `${
        escapedSlashes
            ? (config.proxyDomain || host).replace(/\//g, "\\/") + "\\"
            : (config.proxyDomain || host)
    }${ config.strippedPath }/${ mask(match) }`;
    return r;
};

export function createDefaultProxy (targetDomain, proxyOptionsOverride = {}) {
    let servername = targetDomain.replace(/^https?\:\/\//, "");
    return proxy(targetDomain, {
        proxyReqOptDecorator: (proxyRequest, originalRequest) => {
            proxyRequest.headers["accept-encoding"] = "identity";
            if (proxyRequest.headers["authorization"]) {
                delete proxyRequest.headers["authorization"];
            }
            return proxyOptionsOverride["proxyReqOptDecorator"] instanceof Function
                ? proxyOptionsOverride["proxyReqOptDecorator"](proxyRequest, originalRequest)
                : proxyRequest;
        },
        userResHeaderDecorator: (proxyHeaders, origninalHeaders) => {
            const { headers: { host } } = origninalHeaders;
            if (proxyHeaders.location) {
                if (config.proxy.specialContentReplace[servername]) { // Keep before other replacements
                    const replacements = config.proxy.specialContentReplace[servername];
                    for (const r of replacements) {
                        proxyHeaders.location = proxyHeaders.location.replace(r.regex, r.replace);
                    }
                }
                proxyHeaders.location = proxyHeaders.location
                    .replace(replaceDomainRegex, replaceDomainsForHost(host))
                    .replace(maskRegex, match => mask(match));
            }
            return proxyHeaders;
        },
        userResDecorator: (_, proxyResData, { headers: { host } }) => {
            if (_.req.res && _.req.res.client && _.req.res.client.servername) {
                servername = _.req.res.client.servername;
            }
            let pre = proxyResData.toString().replace(replaceDomainRegex, replaceDomainsForHost(host));
            if (config.proxy.specialContentReplace[servername]) {
                const replacements = config.proxy.specialContentReplace[servername];
                for (const r of replacements) {
                    pre = pre.replace(r.regex, r.replace instanceof Function ? r.replace({ host }) : r.replace);
                }
            }
            pre = pre.replace(maskRegex, (match) => { // Mask configured URLs
                const r = /\\|\//.test(match[0])
                    ? match[0] + mask(match.slice(1))
                    : mask(match);
                return r;
            });
            return pre;
        },
        proxyReqPathResolver: (req) => {

            // Unmask URL parts that were masked
            let unmasked = unmask(req.url);

            // For Google measurement protocol hits, overwrite user's IP address in order for Google to determine location
            if (
                config.proxy.ipOverrides[servername]
                && config.proxy.ipOverrides[servername].urlMatch instanceof RegExp
                && config.proxy.ipOverrides[servername].queryParameterName
                && config.proxy.ipOverrides[servername].urlMatch.test(unmasked)
            ) {

                const parsedUrl = url.parse(unmasked);
                const overwrittenIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"];
                const clientIp = overwrittenIp
                    ? overwrittenIp.split(/,\s?/g)[0]
                    : req.connection.remoteAddress.split(":").pop();
                const encodedIp = encodeURIComponent(clientIp);

                unmasked = parsedUrl.path + `${
                    parsedUrl.search ? "&" : "?"
                }${ 
                    config.proxy.ipOverrides[servername].queryParameterName instanceof Array
                        ? config.proxy.ipOverrides[servername].queryParameterName.map(name => `_${ name }=${ encodedIp }`).join("&")
                        : `_${ config.proxy.ipOverrides[servername].queryParameterName }=${ encodedIp }`
                }`;

            }

            // Apply overrides
            const finalPath = proxyOptionsOverride["proxyReqPathResolver"] instanceof Function
                ? proxyOptionsOverride["proxyReqPathResolver"](req, unmasked)
                : unmasked;

            info(`proxied: ${ servername }${ finalPath }`);

            return finalPath;

        }
    });
}
