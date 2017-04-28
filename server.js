var express = require("express"), proxy = require("express-http-proxy"), app = express();

app.use(express.static(__dirname)); // serve files in current directory

function getIpFromReq (req) { // get the client's IP address from request
    var bareIP = ":" + ((req.connection.socket && req.connection.socket.remoteAddress)
        || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "");
    return (bareIP.match(/:([^:]+)$/) || [])[1] || "127.0.0.1";
}

// proxying requests from /analytics to www.google-analytics.com.
app.use("/analytics", proxy("www.google-analytics.com", {
    proxyReqPathResolver: function (req) {
        var url = req.url + (req.url.indexOf("?") === -1 ? "?" : "&")
            + "uip=" + encodeURIComponent(getIpFromReq(req));
        console.log("Proxying www.google-analytics.com" + url);
        return url;
    }
}));

app.listen(1280);
console.log("Web application ready on http://localhost:1280");