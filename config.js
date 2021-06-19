const MATCH_EVERYTHING_STRING = '.*';
const env = process.env.APP__ENV_NAME || "local";
const isLocal = env === "local" || env === "test";
const proxyDomain = process.env.APP__PROXY_DOMAIN || '';
const strippedPath = process.env.APP__STRIPPED_PATH || '';
const hostsWhitelistRegex = (() => {
    try {
        return new RegExp(process.env.APP__HOSTS_WHITELIST_REGEX || MATCH_EVERYTHING_STRING);
    } catch (e) {
        console.error(`APP__HOSTS_WHITELIST_REGEX=${process.env.APP__HOSTS_WHITELIST_REGEX} cannot be converted to RegExp:`, e, '\nUsing the default.');
        return new RegExp(MATCH_EVERYTHING_STRING);
    }
})();

console.log("Environment variables:");
console.log(`APP__STRIPPED_PATH=${strippedPath} (a prefix path added to the original host, which will be removed in the proxy request)`);
console.log(`APP__PROXY_DOMAIN=${proxyDomain} (an optional proxy domain which will be used for client-side requests instead of the current domain)`);
console.log(`APP__ENV_NAME=${env} (should not be local nor test in production)`);
console.log(`APP__HOSTS_WHITELIST_REGEX=${hostsWhitelistRegex}${hostsWhitelistRegex.toString() === `/${MATCH_EVERYTHING_STRING}/` ? ' (YAY!! Anyone can use your proxy!)' : ''}`);

export default {
    isLocalEnv: isLocal,
    httpPort: process.env.PORT || 80,
    strippedPath,
    hostsWhitelistRegex: hostsWhitelistRegex,
    proxyDomain,        // Domain to proxy calls through. Leave it empty to use the requested domain as a proxy domain
    proxy: {            // Proxy configuration is here
        domains: [      // These domains are replaced in any proxied response (including scripts, URLs and redirects)
            "adservice.google.com",
            "www.google-analytics.com",
            "analytics.google.com",
            "www.googleadservices.com",
            "www.googletagmanager.com",
            "google-analytics.bi.owox.com",
            "googleads.g.doubleclick.net",
            "stats.g.doubleclick.net",
            "ampcid.google.com",
            "www.google.%",
            "www.google.com",
            "bat.bing.com",
            "static.hotjar.com",
            "trackcmp.net",
            "connect.facebook.net",
            "www.facebook.com",
            "rum-static.pingdom.net",
            "s.adroll.com",
            "d.adroll.com",
            "bid.g.doubleclick.net",
            "rum-collector-2.pingdom.net",
            "script.hotjar.com",
            "vars.hotjar.com",
            "pixel.advertising.com",
            "dsum-sec.casalemedia.com",
            "pixel.rubiconproject.com",
            "sync.outbrain.com",
            "simage2.pubmatic.com",
            "trc.taboola.com",
            "eb2.3lift.com",
            "ads.yahoo.com",
            "x.bidswitch.net",
            "ib.adnxs.com",
            "idsync.rlcdn.com",
            "us-u.openx.net",
            "cm.g.doubleclick.net"
        ],
        specialContentReplace: { // Special regex rules for domains
            "www.googletagmanager.com": [
                {
                    regex: /"https\:\/\/s","http:\/\/a","\.adroll\.com/,
                    replace: ({ host }) => `"https://${ host }/s","http://${ host }/a",".adroll.com`
                }
            ],
            "eb2.3lift.com": [
                { // Because eb2.3lift.com/xuid?mid=_&xuid=_&dongle=_ redirects to "/xuid" which doesn't exists
                    regex: /^\/xuid/,
                    replace: "https://eb2.3lift.com/xuid" // eb2.3lift.com is replaced then again with the correct proxy
                }
            ]
        },
        ipOverrides: { // IP override rules for domains
            "google-analytics.bi.owox.com": { // Currently, this is useless as owox.com is having problems with overriding IP addresses, even though they state that they support everything from the Google Measurement Protocol.
                urlMatch: /\/collect/,
                queryParameterName: ["uip", "device.ip"]
            },
            "www.google-analytics.com": {
                urlMatch: /\/collect/,
                queryParameterName: ["uip", "_uip"]
            }
        },
        maskPaths: [ // Paths which are masked in URLs and redirects in order to avoid firing ad-blocking rules
            "/google-analytics",
            "/www.google-analytics.com",
            "/adsbygoogle",
            "/gtag/js",
            "/googleads",
            "/log_event\\?",
            "/r/collect",
            "/j/collect",
            "/g/collect", // As of Dec 2020, Google Measurement Protocol v2 doesn't yet support location overwriting.
            "/collect",
            "/pageread/conversion",
            "/pagead/conversion",
            "/googleads",
            "/prum",
            "/beacon",
            "/pixel",
            "/AdServer",
            "/ads/",
            "/gtm.js",
            "openx\\."
        ],
    }
};
