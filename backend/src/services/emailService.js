const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

let transporter = null;

if (env.smtp.host && env.smtp.user && env.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = 'Reset your Task Manager password';
  const html = `
    <p>You requested a password reset.</p>
    <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in ${env.resetPasswordTokenExpiresMinutes} minutes.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  if (!transporter) {
    logger.info(`[email:dev-fallback] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
};

module.exports = { sendPasswordResetEmail };
