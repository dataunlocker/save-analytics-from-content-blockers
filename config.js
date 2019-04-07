const env = process.env.APP__ENV_NAME || "local";
const isLocal = env === "local" || env === "test";
const proxyDomain = process.env.PROXY_DOMAIN || "localhost";

export default {
    isLocalEnv: isLocal,
    httpPort: process.env.PORT || 80,
    proxyDomain: proxyDomain, // Your domain
    proxy: {                  // Proxy configuration is here
        domains: [            // These domains are replaced in any proxied response (including scripts, URLs and redirects)
            "adservice.google.com",
            "www.google-analytics.com",
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
                    replace: `"https://${ proxyDomain }/s","http://${ proxyDomain }/a",".adroll.com`
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
                queryParameterName: "uip"
            }
        },
        maskPaths: [ // Paths which are masked in URLs and redirects in order to avoid firing ad-blocking rules
            "/google-analytics",
            "/r/collect",
            "/j/collect",
            "/pageread/conversion",
            "/pagead/conversion",
            "/googleads",
            "/prum",
            "/beacon",
            "/pixel",
            "/AdServer",
            "/ads/",
            "openx\\."
        ],
    }
};