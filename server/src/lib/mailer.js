const nodemailer = require('nodemailer');

// Two interchangeable ways to send mail, chosen purely by which env vars are
// set - no code change needed to switch:
//  - RESEND_API_KEY set -> send over HTTPS via Resend's API. Needed on hosts
//    (Render's free tier included) that block outbound SMTP ports (587/465)
//    as an anti-abuse measure - HTTPS/443 is never blocked.
//  - otherwise -> plain SMTP via nodemailer (SMTP_HOST/PORT/USER/PASS/FROM),
//    e.g. Gmail. This is what still works once self-hosted on a server with
//    no such port restriction.
// See server/.env.example and server/README.md for setup of either.
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendViaResend(toEmail, subject, text, html) {
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [toEmail], subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

async function sendViaSmtp(toEmail, subject, text, html) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await getTransporter().sendMail({ from, to: toEmail, subject, text, html });
}

/**
 * sendOtpEmail - emails a 6-digit verification code to the given address.
 * Throws if sending fails; callers decide how to respond to that.
 */
async function sendOtpEmail(toEmail, otp) {
  const subject = 'Your Momentum verification code';
  const text = `Your Momentum verification code is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your Momentum verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`;

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(toEmail, subject, text, html);
  } else {
    await sendViaSmtp(toEmail, subject, text, html);
  }
}

module.exports = { sendOtpEmail };
