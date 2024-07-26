const express = require("express");
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');

module.exports = (port) => {

    const options = {

        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),

    };

    app.use('/', express.static(path.join(__dirname, "../client")));

    app.get('/broadcast/*', (req, res) => {

        res.sendFile(path.join(__dirname, '../client/broadcast.html'));

    })

    app.get('/watch/*', (req, res) => {

        res.sendFile(path.join(__dirname, '../client/watch.html'));

    })

    return https.createServer(options, app).listen(port, "0.0.0.0", () => {

        console.log(`HTTPS server running on port ${port}`);

    });

}