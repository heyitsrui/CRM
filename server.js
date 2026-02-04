const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- EMAIL SETUP ---------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------------- TEMP OTP STORE ---------------- */
// For production use DB or Redis
const otpStore = {};

/* ---------------- SEND OTP ---------------- */
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit

  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 min
  };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- VERIFY OTP ---------------- */
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "No OTP found" });

  if (Date.now() > record.expires)
    return res.status(400).json({ message: "OTP expired" });

  if (record.otp != otp)
    return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email];

  res.json({ success: true });
});

app.listen(5000, () => console.log("Server running on port 5000"));
