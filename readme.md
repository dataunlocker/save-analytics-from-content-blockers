# Google Tag Manager (Google Analytics) Proxy

Back end for proxying Google Analytics / Google Tag Manager stuff, which primarily enables ad-blocking avoidance.

> Save your analytics from content blockers!
>
> This is the repository with the application code for [my Medium article "Save Your Analytics from Content Blockers"](https://medium.com/@zitro/save-your-analytics-from-content-blockers-7ee08c6ec7ee), which allows you to launch a proxy of Google Tag Manager / Google Analytics stuff avoiding ad-blocking.

## How Does It Work

Google Tag Manager (or plain Google Analytics) is a set of scripts used on the **front end** to track user actions (button clicks, page hits, device analytics, etc). Google's out-of-the-box solution works well, however, almost all ad-blocking software block Google tag manager / Google analytics by default. Hence, companies that are just on their start may loose a big
portion of valuable information about their customers - how to they use the product? What do they like/dislike? Where do they stuck? And so on - an individual precision in analytics is crucial to understand the behavior of users.

In order to solve ad-blocking issues, we have to introduce **a proxy which will forward front-end requests to Google domain through our own domain**. Also, we have to modify Google Tag Manager scripts "on-the-fly" to request our own domains instead of Google's ones, because all ad-blocking software block requests to domains (and some particular URLs!) which they have in their filters. Furthermore, some requests require additional data modifications which can't be done using standard proxying.

The next diagram demonstrates the problem with Google Tag Manager / Google Analytics being blocked by ad blockers.

![Google Tag Manager Proxy - No proxy](https://user-images.githubusercontent.com/4989256/55686876-52fc0200-596f-11e9-8d17-399b97486a02.png)

In general, all ad blocks work the same way: they block requests to Google Analytics servers and some URLs which match their blacklists. In order to avoid blocking Google analytics, all such requests must be proxied through URLs that aren't blacklisted. Furthermore, some URLs have to be masked in order for ad-blocker not to recognize the URL.

Thus, this proxy service:

1. Works as a proxy for configured domains (see below).
2. Modifies the response when proxying scripts to replace Google domains with custom ones.
3. Modifies the response and replaces URLs containing blacklisted paths like `/google-analytics`.
4. Modifies proxied request to Google Measurement Protocol and overwrites user's IP address.

![Google Tag Manager Proxy - With Proxy](https://user-images.githubusercontent.com/4989256/55686879-542d2f00-596f-11e9-8313-5837af75cc2e.png)

## Prerequisites

In order to enable analytics proxying, you need two things:

1. A dedicated back end to launch your own proxy (NodeJS application in this repository).
2. To forward a particular path (for example, `/gtm-proxy*`) within your domain to this back end (stripping the path itself). Ultimately, for example, the request path `https://your-domain.com/gtm-proxy/www.google-analytics.com/analytics.js` should resolve to `/www.google-analytics.com/analytics.js` request to the NodeJS proxy application (this repository).
3. Modify your front end Google Tag Manager / Google Analytics script to request the proxied file - you're all set!

**This to consider before implementing the solution**:

1. Your third-parties in Google Tag Manager can rate-limit your requests if you have many users, as now they're all going from the same IP address (your back end). If you've faced rate-limiting, please let me know by creating an issue in this repository!
2. Some third-parties like owox.com (yet) does not support IP overriding like Google Analytics does, meaning that all the users in your reports may appear on a map near your office/server. That's apparently their fault, but anyway you have to deal with this somehow.
3. Not all the third-parties are covered by the current solution. This repository is open for your PRs if you've found more third-parties that require proxying!

## Setup

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

Check the [test-static/index.html](test-static/index.html) file's code to see how to bind the proxied analytics to your front end.

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

[MIT](LICENSE) © [Nikita Savchenko](https://nikita.tk)

## Contributions

Any contributions are very welcome!
