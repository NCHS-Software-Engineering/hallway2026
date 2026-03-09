const http = require("http");
const express = require("express");
const path = require("path");
const app = express();
const server = http.createServer(app);
const dotenv = require("dotenv");
dotenv.config({path: ".env"});
const port = process.env.Port || 8080;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 
        'http://localhost:3000'
    );
    next();
});
app.use(express.json());

app.use(express.static(path.join(__dirname, "../client/build")));

server.listen(port, () => {
    console.log(`The server is listening on port ${port}`);
});

const readline = require('readline');

// Create a readline interface and keep the last scanned value
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let lastBarcode = null;
rl.on('line', (input) => {
    console.log(`Scanned barcode: ${input}`);
    lastBarcode = input;
});

app.get("/barcode", (req, res) => {
    // return the most recent barcode (or 204 No Content if none yet)
    if (lastBarcode !== null) {
        res.json({ barcode: lastBarcode });
        lastBarcode = null; // clear after reading if desired
    } else {
        res.status(204).end();
    }
});