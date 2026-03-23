// server/uploadSnapshot.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// snapshots dir: server/public/snapshots
const snapshotsDir = path.join(__dirname, 'public', 'snapshots');
fs.mkdirSync(snapshotsDir, { recursive: true });

// Accept JSON { imageBase64: "data:image/png;base64,..." }
// Returns { url: "https://<host>/snapshots/<uuid>.png" }
router.post('/uploadSnapshot', express.json({ limit: '25mb' }), (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 required' });
    }

    const m = imageBase64.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: 'invalid image data' });

    const ext = m[1] === 'image/jpeg' ? 'jpg' : 'png';
    const buffer = Buffer.from(m[2], 'base64');
    const id = uuidv4();
    const filename = `${id}.${ext}`;
    const outPath = path.join(snapshotsDir, filename);

    fs.writeFileSync(outPath, buffer);

    // Build public host: prefer env SNAPSHOT_HOST (e.g. snapshots.example.com or 192.168.1.42:5000)
    // Fallback to req.get('host') (works for same-origin requests)
    const publicHost = process.env.SNAPSHOT_HOST || req.get('host');
    const protocol = process.env.SNAPSHOT_PROTO || req.protocol || 'http';
    const publicUrl = `${protocol}://${publicHost}/snapshots/${filename}`;

    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('uploadSnapshot error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;