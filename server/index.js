// server/index.js
const express = require('express');
const path = require('path');
const cors = require('cors'); // optional but helpful if client runs on different origin

const app = express();
const PORT = process.env.PORT || 5000;

// Allow cross-origin requests during development / if needed (adjust origin as needed)
app.use(cors());

// Serve static files from server/public
app.use(express.static(path.join(__dirname, 'public')));

// Mount upload endpoint
app.use('/api', require('./uploadSnapshot'));

// (other routes here)

// Start the server listening on all interfaces so LAN phones can reach it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});