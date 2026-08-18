const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getTodayPayload } = require('../lib/today');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const payload = await getTodayPayload(req.userId);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
