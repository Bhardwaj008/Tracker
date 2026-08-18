# Momentum server

Express/Mongoose API for the Momentum goal tracker.

## Setup

```
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, SMTP_* (see below)
npm run dev
```

## Email OTP verification (SMTP setup)

Signup sends a 6-digit verification code by email before an account can log
in. Sending is done via [nodemailer](https://nodemailer.com/) configured
entirely from env vars, so any standard SMTP provider works — nothing
provider-specific is hardcoded in the app.

Required env vars (see `.env.example`):

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — usually `587` (STARTTLS) or `465` (implicit TLS)
- `SMTP_USER` — SMTP login/username
- `SMTP_PASS` — SMTP password / app password
- `SMTP_FROM` — the "from" address on outgoing mail (defaults to `SMTP_USER` if unset)

### Default free option: Gmail SMTP

1. Turn on **2-Step Verification** on the Google account you want to send from
   (Google Account → Security → 2-Step Verification).
2. Once 2-Step Verification is on, create an **App Password**: Google Account
   → Security → 2-Step Verification → App passwords. Choose "Mail" (or
   "Other") and generate a 16-character password.
3. Set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-address@gmail.com
   SMTP_PASS=<the 16-character app password, no spaces>
   SMTP_FROM=your-address@gmail.com
   ```
   Do not use your normal account password — Gmail requires an App Password
   for SMTP once 2-Step Verification is enabled.

Any other SMTP provider (SendGrid, Mailgun, SES, Postmark, your own mail
server, etc.) works the same way — just point the same four env vars at it.
