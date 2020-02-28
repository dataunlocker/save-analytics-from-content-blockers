import express from "express";
import config from "../config";
import { info, error } from "./logger";
import { enableDefaultProxy } from "./proxy/configured-domains";

const brokenApp = {};

let isReady = false,
    app;

init();

/**
 * Initializes an express app and resolves once the app is initialized. It is safe to call this function
 * multiple times: It will always resolve to the same ready-to-use app or throw.
 * @returns {Object} - Express app.
 */
export async function init () {

    if (isReady) {
        return app;
    } else if (app) {
        await ready();
        return app;
    }

    try {

        app = express();
        app.disable("x-powered-by");

        enableDefaultProxy(app);

        if (config.isLocalEnv) {
            app.use("/", express.static(`${ __dirname }/../test-static`));
        } else {
            app.use("/", (_, res) => res.status(200).set("Content-Type", "text/html").send(
                "<html><head><title>Proxy API</title></head><body>It works! Try requesting something like <a href=\"www.google-analytics.com/analytics.js\">www.google-analytics.com/analytics.js</a>.</body></html>"
            ));
        }

        app.use((err, _, res, next) => { // Express error handler
            if (res.headersSent) {
                return next(err);
            }
            error(err);
            return res.status(500).send({ error: "An error ocurred. Error info was logged." });
        });

        app.listen(config.httpPort, function onReady () {
            info(`Web server is listening on port ${ config.httpPort }`);
            isReady = true;
        });

        await new Promise((resolve) => setTimeout(() => isReady && resolve(), 25));

    } catch (e) {
        error(e);
        isReady = false;
        app = brokenApp;
        throw e;
    }

    return app;

}

export async function ready () {
    return new Promise((resolve, reject) => {
        const tm = setTimeout(() => reject(), 60000);
        const int = setInterval(() => {
            if (app === brokenApp) {
                clearInterval(int);
                clearTimeout(tm);
                return reject(new Error("Express app failed to start"));
            }
            if (isReady) {
                clearInterval(int);
                clearTimeout(tm);
                return resolve();
            }
        }, 200);
    });
}