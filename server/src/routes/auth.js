const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, hashOtp, otpMatches } = require('../lib/otp');
const { sendOtpEmail } = require('../lib/mailer');

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_ATTEMPTS = 5;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function shapeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

async function issueOtp(user) {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpSentAt = new Date();
  await user.save();
  await sendOtpEmail(user.email, otp);
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, emailVerified: false });

    try {
      await issueOtp(user);
    } catch (sendErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', sendErr);
      return res.status(500).json({ error: 'Could not send verification email, try again' });
    }

    res.status(201).json({ message: 'Verification code sent to your email', email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'email and otp are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'No account found for that email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Code expired, request a new one' });
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(400).json({ error: 'Too many attempts, request a new code' });
    }

    if (!otpMatches(otp, user.otpHash)) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Incorrect code' });
    }

    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: shapeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'No account found for that email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Wait a bit before requesting another code' });
    }

    try {
      await issueOtp(user);
    } catch (sendErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', sendErr);
      return res.status(500).json({ error: 'Could not send verification email, try again' });
    }

    res.json({ message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email first',
        needsVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id);
    res.json({ token, user: shapeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
