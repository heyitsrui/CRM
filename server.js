require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const cors = require("cors");
const mariadb = require("mariadb");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ================= MariaDB Connection =================
const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Charles@123",
  database: process.env.DB_NAME || "crm",
  connectionLimit: 5,
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
    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (!users || users.length === 0)
      return res.json({ success: false, message: "Email is not registered" });

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

    await queryDB(
      `INSERT INTO otp_table (email, otp, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`,
      [email, otp, new Date(Date.now() + 5 * 60 * 1000)]
    );

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
    const rows = await queryDB("SELECT * FROM otp_table WHERE email = ?", [email]);
    if (!rows || rows.length === 0) return res.json({ success: false, message: "Invalid or expired OTP" });

    const record = rows[0];
    if (new Date() > record.expires_at) {
      await queryDB("DELETE FROM otp_table WHERE email = ?", [email]);
      return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp === otp) {
      await queryDB("DELETE FROM otp_table WHERE email = ?", [email]);
      return res.json({ success: true, message: "OTP verified" });
    }

    res.json({ success: false, message: "Invalid OTP" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= REGISTER USER =================
app.post("/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    const existing = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ success: false, message: "Email already registered" });

    await queryDB(
      "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, password, role]
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
    if (users.length === 0)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    const user = users[0];
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RESET PASSWORD =================
app.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (!users || users.length === 0)
      return res.json({ success: false, message: "Email not registered" });

    await queryDB("UPDATE users SET password = ? WHERE email = ?", [password, email]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= API ROUTES =================
app.get("/api/admin-profile", async (req, res) => {
  try {
    const users = await queryDB("SELECT name, email FROM users WHERE role = 'admin' LIMIT 1");
    if (users.length === 0) return res.json({ success: true, user: { name: "Admin", email: "admin@test.com" } });
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const stats = await queryDB(`
      SELECT 
        COUNT(CASE WHEN status = 'Lead' THEN 1 END) as leads,
        COUNT(CASE WHEN status = 'Bidding' THEN 1 END) as bidding,
        COUNT(CASE WHEN status = 'Signature' THEN 1 END) as signature,
        COUNT(CASE WHEN status = 'Hold' THEN 1 END) as hold,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
        SUM(paid_amount) as totalPaid,
        SUM(due_amount) as totalDue
      FROM projects
    `);
    const data = stats[0];
    res.json({
      success: true,
      stats: {
        leads: Number(data.leads),
        bidding: Number(data.bidding),
        signature: Number(data.signature),
        hold: Number(data.hold),
        approved: Number(data.approved),
        totalPaid: Number(data.totalPaid || 0),
        totalDue: Number(data.totalDue || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= USERS =================
app.get("/api/users", async (req, res) => {
  try {
    const users = await queryDB(
      "SELECT id, name, email, role, phone, about, avatar FROM users"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await queryDB(
      "SELECT id, name, email, phone, role, about, avatar FROM users WHERE id=?",
      [id]
    );
    if (!rows || rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/users/:id/profile", async (req, res) => {
  const { id } = req.params;
  const { name, phone, about, avatar } = req.body; 
  if (avatar && avatar.length > 7_000_000) {
    return res.status(400).json({
      success: false,
      message: "Profile image too large. Please upload a smaller image."
    });
  }
  try {
    await queryDB(
      "UPDATE users SET name=?, phone=?, about=?, avatar=? WHERE id=?",
      [name, phone, about, avatar, id]
    );
    const updatedUser = await queryDB(
      "SELECT id, name, email, phone, role, about, avatar FROM users WHERE id=?",
      [id]
    );
    res.json({ success: true, user: updatedUser[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await queryDB("DELETE FROM users WHERE id=?", [id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= PROJECTS / DEALS =================
app.get("/api/projects", async (req, res) => {
  try {
    const rows = await queryDB(`
      SELECT id, deal_name, deal_owner, address, status, paid_amount, due_amount,
             description, contact, company, amount, created_at
      FROM projects
      ORDER BY created_at DESC
    `);
    res.json({ success: true, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/projects", async (req, res) => {
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  if (!deal_name) return res.json({ success: false, message: "Deal Name is required" });
  try {
    const result = await queryDB(
      `INSERT INTO projects
       (deal_name, deal_owner, address, status, paid_amount, due_amount, description, contact, company, amount, created_at)
       VALUES (?, ?, ?, 'Lead', 0, 0, ?, ?, ?, ?, NOW())`,
      [deal_name, deal_owner || "", address || "", description || "", contact || "", company || "", amount || 0]
    );
    const project = await queryDB("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    res.json({ success: true, project: project[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/projects/:id/status", async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    await queryDB("UPDATE projects SET status=? WHERE id=?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  try {
    await queryDB(
      `UPDATE projects SET deal_name=?, deal_owner=?, address=?, description=?, contact=?, company=?, amount=? WHERE id=?`,
      [deal_name, deal_owner || "", address || "", description || "", contact || "", company || "", amount || 0, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    await queryDB("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= DELETE COMPANY =================
app.delete("/api/companies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await queryDB("DELETE FROM company WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Company deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "Company not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= CLIENTS =================
app.get("/api/clients", async (req, res) => {
  try {
    const rows = await queryDB("SELECT * FROM clients ORDER BY id ASC");
    res.json({ success: true, clients: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/clients", async (req, res) => {
  const { clientName, companyName, email, salesRep } = req.body;
  try {
    await queryDB(
      "INSERT INTO clients (clientName, companyName, email, salesRep) VALUES (?, ?, ?, ?)",
      [clientName, companyName, email, salesRep]
    );
    res.json({ success: true, message: "Client added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await queryDB("DELETE FROM clients WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Client deleted" });
    } else {
      res.status(404).json({ success: false, error: "Client not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= TASKS API =================

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await queryDB("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json({ success: true, tasks });
  } catch (err) {
    console.error("Fetch Tasks Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Add a new task
app.post("/api/tasks", async (req, res) => {
  // 1. Destructure all fields including 'description' sent from React
  const { title, description, priority, deadline, user_id } = req.body;

  // Debugging: Log the incoming payload
  console.log("Adding Task for User ID:", user_id, "Priority:", priority);

  // 2. Strict Validation
  if (!user_id) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  if (!title) {
    return res.status(400).json({ success: false, message: "Task Title is required" });
  }

  try {
    // 3. Fix Priority Capitalization to match your DB ENUM (Low, Medium, High)
    const formattedPriority = priority 
      ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() 
      : 'Low';

    // 4. Run Insert Query (Added 'description' here)
    const result = await queryDB(
      "INSERT INTO tasks (title, description, priority, deadline, user_id, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [
        title, 
        description || "", 
        formattedPriority, 
        deadline || null, 
        user_id
      ]
    );

    // 5. Correctly capture the New ID
    // MariaDB driver usually puts this in 'insertId' (BigInt)
    const newId = result.insertId !== undefined ? Number(result.insertId) : result.id;

    if (!newId) {
        throw new Error("Failed to retrieve Insert ID from Database.");
    }

    const newTask = await queryDB("SELECT * FROM tasks WHERE id = ?", [newId]);
    res.json({ success: true, task: newTask[0] });

  } catch (err) {
    console.error("Add Task DB Error:", err);
    // If the error mentions 'description', make sure you added the column in HeidiSQL
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update an existing task
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, user_id, status } = req.body;

  try {
    await queryDB(
      "UPDATE tasks SET title = ?, description = ?, priority = ?, user_id = ?, status = ? WHERE id = ?",
      [title, description || "", priority, user_id, status || 'Pending', id]
    );
    res.json({ success: true, message: "Task updated" });
  } catch (err) {
    console.error("Update Task DB Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await queryDB("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PROJECT COMMENTS API =================
app.get("/api/projects-detailed", async (req, res) => {
  try {
    const projects = await queryDB("SELECT * FROM projects ORDER BY created_at DESC");
    const projectsWithComments = await Promise.all(projects.map(async (proj) => {
      const comments = await queryDB(
        "SELECT * FROM project_comments WHERE project_id = ? ORDER BY created_at ASC", 
        [proj.id]
      );
      return { ...proj, comments: comments || [] };
    }));
    res.json({ success: true, projects: projectsWithComments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/projects/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { user_name, comment_text } = req.body;
  try {
    await queryDB(
      "INSERT INTO project_comments (project_id, user_name, comment_text) VALUES (?, ?, ?)",
      [id, user_name, comment_text]
    );
    res.json({ success: true, message: "Comment added to project" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PROJECTS API (Updated to match 'projects' table) =================

// 1. GET all projects with their comments
app.get("/api/projects-detailed", async (req, res) => {
  try {
    // Changed table name from 'proposals' to 'projects'
    const projects = await queryDB("SELECT * FROM projects ORDER BY created_at DESC");
    
    const projectsWithComments = await Promise.all(projects.map(async (proj) => {
      // Fetches comments linked to the project ID
      const comments = await queryDB(
        "SELECT * FROM project_comments WHERE project_id = ? ORDER BY created_at ASC", 
        [proj.id]
      );
      return { ...proj, comments: comments || [] };
    }));

    // success: true and projects: [...] matches your frontend's requirements
    res.json({ success: true, projects: projectsWithComments });
  } catch (err) {
    console.error("Fetch Projects Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST a new comment to a specific project
app.post("/api/projects/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { user_name, comment_text } = req.body;
  try {
    await queryDB(
      "INSERT INTO project_comments (project_id, user_name, comment_text) VALUES (?, ?, ?)",
      [id, user_name, comment_text]
    );
    res.json({ success: true, message: "Comment added to project" });
  } catch (err) {
    console.error("Post Comment Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= COMPANIES API =================

// GET all companies
app.get("/api/companies", async (req, res) => {
  try {
    // Note: We use aliases (AS) to match the names your React frontend expects
    const rows = await queryDB(`
      SELECT 
        id, 
        company_name AS name, 
        company_owner AS owner, 
        types, 
        email, 
        description 
      FROM company 
      ORDER BY id ASC
    `);
    res.json({ success: true, companies: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST a new company
app.post("/api/companies", async (req, res) => {
  const { name, owner, types, email, description } = req.body;
  try {
    await queryDB(
      "INSERT INTO company (company_name, company_owner, types, email, description) VALUES (?, ?, ?, ?, ?)",
      [name, owner, types, email, description]
    );
    res.json({ success: true, message: "Company added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
