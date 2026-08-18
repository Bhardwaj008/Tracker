const nodemailer = require('nodemailer');

// Provider-agnostic SMTP transporter: host/port/user/pass/from are all
// env-driven so any standard SMTP provider works, not just Gmail.
// See server/.env.example and server/README.md for setup.
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

/**
 * sendOtpEmail - emails a 6-digit verification code to the given address.
 * Throws if sending fails; callers decide how to respond to that.
 */
async function sendOtpEmail(toEmail, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from,
    to: toEmail,
    subject: 'Your Momentum verification code',
    text: `Your Momentum verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Momentum verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });
}

module.exports = { sendOtpEmail };
