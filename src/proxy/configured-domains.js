import { createDefaultProxy } from "../modules/proxy";
import config from "../../config";
import { unmask } from "../modules/mask";
import { info } from "../logger";

const domains = new Set(config.proxy.domains);
const proxies = new Map(Array.from(domains).map((domain) => {
    return [domain, createDefaultProxy(`https://${ domain }`, {
        proxyReqPathResolver: (_, path) => path.replace(`/${ domain }`, "") // Strip domain from URL
    })];
}));

export function enableDefaultProxy (expressApp) {
    expressApp.use("/", (req, res, next) => {
        if (!req.headers || !req.headers.host || !config.hostsWhitelistRegex.test(req.headers.host)) {
            info(`FORBIDDEN: proxy request from host "${req.headers.host}" was canceled as it doesn't match with ${config.hostsWhitelistRegex}.`);
            return res.status(403).send({
                error: `Requests from host ${req.headers.host} are restricted.`
            });
        }
        const domain = unmask(req.url.split(/\//g)[1]);
        return domains.has(domain)
            ? proxies.get(domain)(req, res, next) // Use proxy for configured domains
            : req.url === "/"
                ? next()
                : res.status(404).send({
                    error: `Proxy error: domain "${domain}" is not proxied. Requested URL: ${req.url}`
                });
    });
}