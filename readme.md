# Google Tag Manager (Google Analytics) Proxy

Back end for proxying Google Analytics / Google Tag Manager stuff, which primarily allows ad-blockers to not block your client-side analytics.

```
docker pull zitros/analytics-saviour
```

**Note**: this repository contains an open-source alternative (former PoC) of [**dataunlocker.com**](https://dataunlocker.com/). [DataUnlocker](https://dataunlocker.com/) is a SaaS, "smart" proxy solution for fixing "any failing or blocked requests", including requests to Google Analytics, Google Tag Manager and other analytics tools, also without code changes in your web application. [DataUnlocker](https://dataunlocker.com/) uses a completely different (and a better) approach to what this repository offers. [DataUnlocker](https://dataunlocker.com/) is currently in closed beta, and you can request early access on its [landing page](https://dataunlocker.com/#subscribe).

Originally introduced as an example in my Medium article ["Save Your Analytics from Content Blockers"](https://medium.com/@zitro/save-your-analytics-from-content-blockers-7ee08c6ec7ee), this open-sourced application is now a complete stand-alone solution for Google Tag Manager and Google Analytics.

## How It Works

Google Tag Manager (or plain Google Analytics) is a set of scripts used on the **front end** to track user actions (button clicks, page hits, device analytics, etc). Google's out-of-the-box solution works well, however, almost all ad-blocking software block Google tag manager / Google analytics by default. Hence, companies that are just on their start may loose a big
portion of valuable information about their customers - how to they use the product? What do they like/dislike? Where do they stuck? And so on - an individual precision in analytics is crucial to understand the behavior of users.

In order to solve ad-blocking issues, we have to introduce **a proxy which will forward front-end requests to Google domain through our own domain**. Also, we have to modify Google Tag Manager scripts "on-the-fly" to request our own domains instead of Google's ones, because all ad-blocking software block requests to domains (and some particular URLs!) which they have in their filters. Furthermore, some requests require additional data modifications which can't be done using standard proxying.

The next diagram demonstrates the problem with Google Tag Manager / Google Analytics being blocked by ad blockers.

<p align="center">
  <img width="50%" alt="Google Tag Manager Proxy - Without Proxy" src="https://user-images.githubusercontent.com/4989256/55686876-52fc0200-596f-11e9-8d17-399b97486a02.png"></img>
</p>

In general, all ad blocks work the same way: they block requests to Google Analytics servers and some URLs which match their blacklists. In order to avoid blocking Google analytics, all such requests must be proxied through URLs that aren't blacklisted. Furthermore, some URLs have to be masked in order for ad-blocker not to recognize the URL.

Thus, this proxy service:

1. Works as a proxy for configured domains (see below).
2. Modifies the response when proxying scripts to replace Google domains with custom ones.
3. Modifies the response and replaces URLs containing blacklisted paths like `/google-analytics`.
4. Modifies proxied request to Google Measurement Protocol and overwrites user's IP address.

<p align="center">
  <img width="80%" alt="Google Tag Manager Proxy - With Proxy" src="https://user-images.githubusercontent.com/4989256/55686879-542d2f00-596f-11e9-8313-5837af75cc2e.png"></img>
</p>

This repository contains a NodeJS-based proxy server which does the smart proxying magic for you. All you need is to
run this proxy server on your end and figure out how to combine it with your application. Read more on this below.

Technically, NodeJS proxy API works as follows:

1. Request to `/` returns sample application (see [src/static-test/index.html](src/static-test/index.html)) if enabled (see config).
2. Request to `/domain-name-or-masked-name/*` proxies requests to `domain-name-or-masked-name` with path `*`.
3. You can run the application using `npm install && npm run start` and request [http://localhost/www.googletagmanager.com/gtag/js?id=GTM-1234567](http://localhost/www.googletagmanager.com/gtag/js?id=GTM-1234567) (replace `GTM-1234567` with your GTM tag). That's it!

## Prerequisites

In order to enable analytics proxying, you have to perform some DevOps in your infrastructure. Assuming you're using microservices:

1. Run a dedicated back end (container) with proxy (NodeJS application / container in this repository) - see setup instructions below.
2. Create forwarding rule from your front end to hit this back end.
    1. For instance, proxy all calls requesting `/gtm-proxy/*` to this back end. In this case you must also specify env variable `APP__STRIPPED_PATH=/gtm-proxy`. Ultimately, the request path `https://your-domain.com/gtm-proxy/www.google-analytics.com/analytics.js` should land as `/www.google-analytics.com/analytics.js` at the NodeJS proxy application/container (this repository), stripping `/gtm-proxy` from the URL.
    2. It is important to use your own domain, as using centralized domains might one day appear at the ad-blocking databases.
3. **Modify your initial Google Tag Manager / Google Analytics script to request the proxied file**
    1. Replace `https://www.googletagmanager.com/gtag/js?id=UA-123456-7` there to use `https://your-domain.com/gtm-proxy/www.googletagmanager.com/gtag/js?id=UA-123456-7` (or whatever path you've set up). Also, mask the URL by running `npm run mask <YOUR_URL>` in this repository so that ad-blockers won't block it right away.
    2. For instance, if you run `npm run mask www.google-analytics.com/analytics.js`, you get this masked URL: `*(d3d3Lmdvb2dsZS1hbmFseXRpY3MuY29t)*/*(YW5hbHl0aWNzLmpz)*`. Use it in your script tag now: `<script src="/gtm-proxy/*(d3d3Lmdvb2dsZS1hbmFseXRpY3MuY29t)*/*(YW5hbHl0aWNzLmpz)*" async></script>`.
    3. The [example](src/static-test/index.html) in this repository uses unmasked `/www.googletagmanager.com/gtm.js` (which is equivalent of `http://localhost/www.googletagmanager.com/gtm.js`).
4. Test the thing!

**This to consider before implementing the solution**:

1. Your third-parties in Google Tag Manager can rate-limit your requests if you have many users, as now they're all going from the same IP address (your back end). If you've faced rate-limiting, please let me know by creating an issue in this repository! So far, we didn't.
2. Some third-parties like owox.com (yet) does not support IP overriding like Google Analytics does, meaning that all the users in your reports may appear on a map near your office/server. That's apparently their fault, but anyway you have to deal with this somehow.
3. Not all the third-parties are covered by the current solution. This repository is open for your PRs if you've found more third-parties that require proxying!

## Setup

### In Docker

The [light Docker container](https://hub.docker.com/r/zitros/analytics-saviour) of 41.5MB is available and ready to be run in your infrastructure.

```bash
docker pull zitros/analytics-saviour
docker run -p 80:80 zitros/analytics-saviour
# Now open http://localhost and check the proxy.
```

Available environment variables:

```bash
# Below are the environment variables that can configure this proxy.
# The proxy URL requested by the browser is expected to be
# protocol://$APP__PROXY_DOMAIN$APP__STRIPPED_PATH/*(masked-url)*.

APP__STRIPPED_PATH=/gtm-proxy
# A prefix which has been stripped in the request path reaching analytics-saviour.
# If your ingress/router/etc strips the prefix you are required to set this variable.
#
# On your website, most likely you'll decide to route analytics using f.e. `/gtm-proxy`
# prefix. Your "entry URL" in case of Google Analytics case will be
# example.com/gtm-proxy/*(d3d3Lmdvb2dsZS1hbmFseXRpY3MuY29t)*/*(YW5hbHl0aWNzLmpz)*
# (masked example.com/gtm-proxy/www.google-analytics.com/analytics.js).
# Your ingress/router/etc must strip the `/gtm-proxy` path and thus analytics-saviour
# gets localhost/*(d3d3Lmdvb2dsZS1hbmFseXRpY3MuY29t)*/*(YW5hbHl0aWNzLmpz)* hit.
# However, many scripts which are proxied reference external domains. Normally, these
# domains are blocked by adblockers, but luckily analytics-saviour finds and replaces
# those domains with your (request) domain and the appropriate path to handle again later.
# THE ONLY THING it cannot figure out is which part of the URL has been stripped before
# reaching analytics-saviour so that next front end requests land to the same prefixed path
# on your domain e.g. example.com/gtm-proxy/*(d3d3Lmdvb2dsZS1hbmFseXRpY3MuY29t)*/collect?..
# Because of this, the path you strip must be explicitly provided.

APP__PROXY_DOMAIN=
# The domain name used as a proxy for analytics scripts (optional). 
# When set, the traffic will be proxied via this domain.
# When not set, the current request domain (host) is used as a proxy domain.
# This is useful to proxy traffic via f.e. subdomain or another domain, so that you don't need to
# strip the prefix path.

APP__ENV_NAME=local
# APP__ENV_NAME=local or APP__ENV_NAME=test (default for local NodeJS app)
# will display static content from `static-test`.
# APP__ENV_NAME=prod is used inside the Docker container unless overwritten.

APP__HOSTS_WHITELIST_REGEX="^(example\\.com|mysecondwebsite\\.com)$"
# A JavaScript regular expression that the host must match. By default, it matches ANY HOST, MAKING
# YOUR PROXY AVAILABLE TO ANYONE. Make sure you screen all special regexp characters here. Examples:
# APP__HOSTS_WHITELIST_REGEX="^example\\.com$" (only the domain example.com is allowed to access the proxy)
# APP__HOSTS_WHITELIST_REGEX="^.*\\.example\\.com$" (only subdomains of example.com are allowed)
# APP__HOSTS_WHITELIST_REGEX="^.*\\.?example\\.com$" (example.com and all its subdomains are allowed)
# APP__HOSTS_WHITELIST_REGEX="^(example\\.com|mysecondwebsite\\.com)$" (multiple specified domains are allowed)
```

### NodeJS Application

To run the NodeJS application, simply clone the repository, navigate to its directory and run:

```bash
npm install && npm run start
```

By default, this will run a proxy with a test front end on [http://localhost](http://localhost). You can get there and check how the request `http://localhost/www.google-analytics.com/collect?v=1&_v=j73&a=...` was proxied and that the ad-blocker didn't block the request. If the start is successful, after visiting [http://localhost](http://localhost) you'll see this:

```
Web server is listening on port 80
Proxied: www.google-analytics.com/analytics.js
Proxied: www.google-analytics.com/collect?v=1&_v=j73&a=531530768&t=pageview&_s=1&dl=http%3A%2F%2Flocalhost%2F&ul=ru&de=UTF-8&dt=Test&sd=24-bit&sr=1500x1000&vp=744x880&je=0&_u=AACAAEAB~&jid=&gjid=&cid=2E31579F-EE30-482F-9888-554A248A9495&tid=UA-98253329-1&_gid=1276054211.1554658225&z=1680756830&uip=1
```

Check the [static-test/index.html](static-test/index.html) file's code to see how to bind the proxied analytics to your front end.

### Proxy in Front of the Proxy

Before the request hits this NodeJS app / container, you have to proxy/assign some useful headers to it (`host` and `x-real-ip` or `x-forwarded-for`). Below is the example of the minimal Nginx proxy configuration.

```
location /gtm-proxy/ {
    proxy_set_header Host $host;
    proxy_set_header x-real-ip $remote_addr;
    proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for;
    proxy_pass http://app-address-running-in-your-infrastructure;
}
```

## Configuration

You can configure which third-parties to proxy/replace and how to do it in the config file. Find the actual configuration in [config.js](config.js) file:

```javascript
    proxy: {
        domains: [ // These domains are replaced in any proxied response (they are prefixed with your domain)
            "adservice.google.com",
            "www.google-analytics.com",
            "www.googleadservices.com",
            "www.googletagmanager.com",
            "google-analytics.bi.owox.com",
            "stats.g.doubleclick.net",
            "ampcid.google.com",
            "www.google.%",
            "www.google.com"
        ],
        ipOverrides: { // IP override rules for domains (which query parameter to add overriding IP with X-Forwarded-For header)
            "www.google-analytics.com": {
                urlMatch: /\/collect/,
                queryParameterName: "uip"
            }
        },
        maskPaths: [ // Which paths to mask in URLs. Can be regular expressions as strings
            "/google-analytics",
            "/r/collect",
            "/j/collect",
            "/pageread/conversion",
            "/pagead/conversion"
        ]
    }
```

## License

[MIT](LICENSE) © [Nikita Savchenko](https://nikita.tk/developer)

## Contributions

Any contributions are very welcome!
