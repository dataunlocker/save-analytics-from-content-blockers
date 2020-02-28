import { createDefaultProxy } from "../modules/proxy";
import config from "../../config";
import { unmask } from "../modules/mask";

const domains = new Set(config.proxy.domains);
const proxies = new Map(Array.from(domains).map((domain) => {
    return [domain, createDefaultProxy(`https://${ domain }`, {
        proxyReqPathResolver: (_, path) => path.replace(`/${ domain }`, "") // Strip domain from URL
    })];
}));

export function enableDefaultProxy (expressApp) {
    expressApp.use("/", (req, res, next) => {
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