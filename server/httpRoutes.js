const express = require("express");
const app = express();
const http = require('http');

module.exports = (port) => {

    app.use((req, res, next) => {
        if (req.secure) {
            next();
        } else {
            res.redirect('https://' + req.headers.host + req.url);
        }
    });

    http.createServer(app).listen(port, () => {

        console.log(`HTTP server running on port ${port}`);

    });

}