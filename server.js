require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const cors = require("cors");
const mariadb = require("mariadb");

const app = express();
app.use(express.json());
app.use(cors());

// ================= MariaDB Connection =================
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'crm',
  connectionLimit: 5
});

// Helper function to query database
async function queryDB(sql, params) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ================= OTP Storage =================
// In-memory fallback (optional: can use DB)
const otpStore = {};

// ================= Email Transporter =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP in memory
    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // Store OTP in DB (optional)
    await queryDB(
      `INSERT INTO otp_table (email, otp, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`,
      [email, otp, new Date(Date.now() + 5 * 60 * 1000)]
    );

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check in DB
    const rows = await queryDB("SELECT * FROM otp_table WHERE email = ?", [email]);
    if (!rows || rows.length === 0) return res.json({ success: false });

    const record = rows[0];
    if (new Date() > record.expires_at) {
      await queryDB("DELETE FROM otp_table WHERE email = ?", [email]);
      return res.json({ success: false, message: "Expired" });
    }

    if (record.otp === otp) {
      await queryDB("DELETE FROM otp_table WHERE email = ?", [email]);
      return res.json({ success: true });
    }

    res.json({ success: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= REGISTER USER =================
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existing = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "Email already registered" });

    // Insert user into DB (plain text password)
    await queryDB(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role]
    );

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= LOGIN USER =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await queryDB("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    if (users.length === 0) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const user = users[0];

    // Return user info including role for role-based routing
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
