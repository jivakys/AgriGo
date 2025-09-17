const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL_USER,
    pass: process.env.NODEMAILER_EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: process.env.NODEMAILER_EMAIL_USER,
    to,
    subject,
    text,
  });
};

module.exports = { sendEmail };
