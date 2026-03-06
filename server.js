 require("dotenv").config();
  const express = require("express");
  const nodemailer = require("nodemailer");
  const otpGenerator = require("otp-generator");
  const cors = require("cors");
  const mariadb = require("mariadb");
  const bcrypt = require('bcrypt');

  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const PizZip = require("pizzip");
  const Docxtemplater = require("docxtemplater");

  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cors());
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  BigInt.prototype.toJSON = function() {
    return this.toString();
  };

  // Create storage logic
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = './uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  const upload = multer({ storage });

  app.use('/uploads', express.static('uploads'));
  

  // MariaDB Connection
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "ritzqt",
    database: process.env.DB_NAME || "crm",
    dateStrings: true,
    connectionLimit: 5,
  });

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

  // OTP Storage
  const otpStore = {}; 

  // Email Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

    // SEND OTP
  app.post("/send-otp", async (req, res) => {
    try {
      let { email, type } = req.body;
      if (!type) type = 'signup'; 

      // Check if user exists
      const existingUser = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
      const userExists = existingUser.length > 0;

      // Logic for Resetting Password
      if (type === 'reset') {
        if (!userExists) {
          return res.status(404).json({ 
            success: false, 
            message: "Email not found. Please register first." 
          });
        }
      } 
      // Logic for New Registration
      else if (type === 'signup') {
        if (userExists) {
          return res.status(400).json({ 
            success: false, 
            message: "Email already registered. Please login instead." 
          });
        }
      } 
      else {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request type. Use 'signup' or 'reset'." 
        });
      }

      // OTP Generation and Sending Logic
      const otp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        specialChars: false, 
        lowerCaseAlphabets: false 
      });

      await queryDB(
        `INSERT INTO otp_table (email, otp, expires_at)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)`,
        [email, otp, new Date(Date.now() + 5 * 60 * 1000)]
      );

      await transporter.sendMail({
        from: `"noreply-visible" <no-reply@yourdomain.com>`,
        to: email,
        subject: "Your OTP Code",
        html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`,
      });

      res.json({ success: true, message: "OTP sent" });
    } catch (err) {
      console.error("OTP Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // VERIFY OTP
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

  // REGISTER USER
  app.post("/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    const existing = await queryDB("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ success: false, message: "Email already registered" });

    // HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    await queryDB(
      "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, hashedPassword, role]
    );

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

  // LOGIN USER
  app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await queryDB(
      "SELECT id, name, email, password, role, phone, about, avatar FROM users WHERE email = ?", 
      [email]
    );
    
    if (users.length === 0)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    const user = users[0];

    // COMPARE THE PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        about: user.about,
        avatar: user.avatar
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

  // RESET PASSWORD
  app.post("/reset-password", async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("New Hashed Password:", hashedPassword);

        await queryDB("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error("Hashing Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
  });

  // USERS
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
    const { name, email, phone, role, about, avatar } = req.body;
    if (avatar && avatar.length > 7_000_000) {
      return res.status(400).json({
        success: false,
        message: "Profile image too large. Please upload a smaller image."
      });
    }
    try {
      await queryDB(
        "UPDATE users SET name=?, email=?, phone=?, role=?, about=?, avatar=? WHERE id=?",
        [name, email, phone, role, about, avatar, id]
      );
      const updatedUser = await queryDB(
        "SELECT id, name, email, phone, role, about, avatar FROM users WHERE id=?",
        [id]
      );
      res.json({ success: true, user: updatedUser[0] });
    } catch (err) {
      console.error("Update Error:", err.message);
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

    // API ROUTES
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
          COUNT(CASE WHEN status = 'Proposal' THEN 1 END) as proposal,
          COUNT(CASE WHEN status = 'Purchase Order' THEN 1 END) as purchaseorder,
          COUNT(CASE WHEN status = 'Site Survey-POC' THEN 1 END) as sitesurveypoc,
          COUNT(CASE WHEN status = 'Closed Lost' THEN 1 END) as closedlost,
          COUNT(CASE WHEN status = 'Completed Project' THEN 1 END) as completedproject,
          COUNT(CASE WHEN status = 'Inactive Project' THEN 1 END) as inactiveproject,
          COUNT(CASE WHEN status = 'Renewal Support' THEN 1 END) as renewalsupport,
          COUNT(CASE WHEN status = 'Previous Year Project' THEN 1 END) as previousyearproject,
          COUNT(CASE WHEN status = 'Recovered Project' THEN 1 END) as recoveredproject,
          SUM(paid_amount) as totalPaid,
          SUM(due_amount) as totalDue
        FROM projects
      `);
      const data = stats[0];
      res.json({
        success: true,
        stats: {
          leads: Number(data.leads),
          proposal: Number(data.proposal),
          purchaseorder: Number(data.purchaseorder),
          sitesurveypoc: Number(data.sitesurveypoc),
          closedlost: Number(data.closedlost),
          completedproject: Number(data.completedproject),
          inactiveproject: Number(data.inactiveproject),
          renewalsupport: Number(data.renewalsupport),
          previousyearproject: Number(data.previousyearproject),
          recoveredproject: Number(data.recoveredproject),
          totalPaid: Number(data.totalPaid || 0),
          totalDue: Number(data.totalDue || 0),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
// PROJECTS / DEALS API
app.get("/api/projects", async (req, res) => {
  try {
    const rows = await queryDB(`
      SELECT id, deal_name, status, paid_amount, due_amount, total_amount, 
             deal_owner, description, contact, company, closed_date, created_at
      FROM projects
      ORDER BY created_at DESC
    `);
    res.json({ success: true, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/projects", async (req, res) => {
  const { 
    deal_name, deal_owner, status, description, 
    contact, company, total_amount, paid_amount, closed_date 
  } = req.body;

  const finalDate = (closed_date && closed_date !== "") ? closed_date : null;
  
  if (!deal_name) {
    return res.status(400).json({ success: false, message: "Deal Name is required" });
  }

  try {
    const total = parseFloat(total_amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const due = total - paid;

    const result = await queryDB(
      `INSERT INTO projects
      (deal_name, deal_owner, status, paid_amount, due_amount, total_amount, description, contact, company, closed_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, 
      [
        deal_name, 
        deal_owner || "", 
        status || 'Lead', 
        paid, 
        due, 
        total, 
        description || "", 
        contact || "", 
        company || "",
        closed_date || null
      ]
    );

    const newId = result.insertId !== undefined ? Number(result.insertId) : result.id;
    const project = await queryDB("SELECT * FROM projects WHERE id = ?", [newId]);
    
    res.json({ success: true, project: project[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    deal_name, deal_owner, status, description, 
    contact, company, total_amount, paid_amount, closed_date 
  } = req.body;

  try {
    const total = parseFloat(total_amount) || 0;
    const paid = parseFloat(paid_amount) || 0;
    const due = total - paid;

    await queryDB(
      `UPDATE projects 
      SET deal_name=?, deal_owner=?, status=?, description=?, contact=?, 
          company=?, total_amount=?, paid_amount=?, due_amount=?, closed_date=?
      WHERE id=?`,
      [
        deal_name, 
        deal_owner || "", 
        status || 'Lead',
        description || "", 
        contact || "", 
        company || "", 
        total,
        paid,
        due,
        closed_date || null,
        id
      ]
    );
    res.json({ success: true, message: "Project updated successfully" });
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

app.delete("/api/projects/:id", async (req, res) => {
  try {
    await queryDB("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/projects/bulk", async (req, res) => {
  const { deals } = req.body;

  if (!deals || deals.length === 0) {
    return res.status(400).json({ success: false, message: "No data found" });
  }

  const allowedStatuses = [
    'Lead', 'Proposal', 'Purchase Order', 'Site Survey-POC', 
    'Closed Lost', 'Completed Project', 'Inactive Project', 
    'Renewal Support', 'Previous Year Project', 'Recovered Project'
  ];

  try {
    const values = [];
    const placeholders = deals.map((d, index) => {
      let rawStatus = d.status ? d.status.trim() : 'Lead';
      const status = allowedStatuses.includes(rawStatus) ? rawStatus : 'Lead';

      const total = parseFloat(d.total_amount) || 0;
      const paid = 0; 
      const due = total;

      values.push(
        d.deal_name || `Untitled Deal ${index + 1}`,
        d.deal_owner || "Unassigned",
        status,
        paid,
        due,
        total,
        "Excel Bulk Import",
        "",
        "",
        d.closed_date || null
      );

      return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    }).join(", ");

    const sql = `INSERT INTO projects 
      (deal_name, deal_owner, status, paid_amount, due_amount, total_amount, description, contact, company, closed_date, created_at) 
      VALUES ${placeholders}`;

    await queryDB(sql, values);

    res.json({ success: true, message: `Imported ${deals.length} deals successfully!` });
  } catch (err) {
    console.error("Critical Bulk Error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Database rejection. Check row 159 for special characters or invalid status." 
    });
  }
});

  // CLIENTS
  app.get("/api/clients", async (req, res) => {
    try {
      const rows = await queryDB("SELECT record_id, first_name, last_name, email, phone, contact_owner, assoc_company, lead_status, created_at FROM clients ORDER BY record_id ASC");
      res.json({ success: true, clients: rows });
    } catch (err) {
      console.error("Fetch Clients Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/clients", async (req, res) => {
    const { first_name, last_name, email, phone, contact_owner, assoc_company, lead_status } = req.body;
    
    try {
      await queryDB(
        `INSERT INTO clients (first_name, last_name, email, phone, contact_owner, assoc_company, lead_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, phone || null, contact_owner || null, assoc_company || null, lead_status || 'New']
      );
      res.json({ success: true, message: "Client added successfully" });
    } catch (err) {
      console.error("Add Client Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await queryDB("DELETE FROM clients WHERE record_id = ?", [id]);
      if (result.affectedRows > 0) {
        res.json({ success: true, message: "Client deleted" });
      } else {
        res.status(404).json({ success: false, error: "Client not found" });
      }
    } catch (err) {
      console.error("Delete Client Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

app.post('/api/clients/bulk', async (req, res) => {
    const { clients } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = `
            INSERT INTO clients (record_id, first_name, last_name, email, phone, contact_owner, assoc_company, lead_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                contact_owner = VALUES(contact_owner),
                assoc_company = VALUES(assoc_company),
                lead_status = VALUES(lead_status)
        `;

        const values = clients.map(c => [
            c.record_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone || null,
            c.contact_owner || null,
            c.assoc_company || null,
            c.lead_status || 'New'
        ]);

        const result = await conn.batch(sql, values);
        res.json({ success: true, count: result.affectedRows });
    } catch (err) {
        console.error("Client Bulk Import Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

  // TASKS API
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await queryDB("SELECT * FROM tasks ORDER BY created_at DESC");
      res.json({ success: true, tasks });
    } catch (err) {
      console.error("Fetch Tasks Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/tasks", async (req, res) => {
    const { title, description, priority, deadline, user_id } = req.body;

    console.log("Adding Task for User ID:", user_id, "Priority:", priority);

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "Task Title is required" });
    }

    try {
      const formattedPriority = priority 
        ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase() 
        : 'Low';

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

      const newId = result.insertId !== undefined ? Number(result.insertId) : result.id;

      if (!newId) {
          throw new Error("Failed to retrieve Insert ID from Database.");
      }

      const newTask = await queryDB("SELECT * FROM tasks WHERE id = ?", [newId]);
      res.json({ success: true, task: newTask[0] });

    } catch (err) {
      console.error("Add Task DB Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/tasks/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      await queryDB("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true, message: "Task status updated" });
    } catch (err) {
      console.error("DB Update Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, user_id } = req.body;

    try {
      await queryDB(
        "UPDATE tasks SET title = ?, description = ?, priority = ?, user_id = ? WHERE id = ?",
        [title, description, priority, user_id, id]
      );
      res.json({ success: true, message: "Task updated successfully" });
    } catch (err) {
      console.error("Update Task Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

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

  // PROJECT COMMENTS API
    app.get("/api/projects-detailed", async (req, res) => {
      try {
        const projects = await queryDB("SELECT * FROM projects ORDER BY created_at DESC");
        
        const projectsWithDetails = await Promise.all(projects.map(async (proj) => {
          const comments = await queryDB(
            "SELECT * FROM project_comments WHERE project_id = ? ORDER BY created_at ASC", 
            [proj.id]
          );
          
          const attachments = await queryDB(
            "SELECT * FROM project_attachments WHERE project_id = ?",
            [proj.id]
          );

          return { 
            ...proj, 
            comments: comments || [], 
            attachments: attachments || [] 
          };
        }));

        res.json({ success: true, projects: projectsWithDetails });

      } catch (err) {
        console.error("Fetch Projects Error:", err);
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
      console.error("Post Comment Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

    app.post('/api/projects/:id/attachments', upload.single('file'), async (req, res) => {
      const { id } = req.params;
      const { uploaded_by } = req.body;
      const { originalname, filename } = req.file;
      try {
        await queryDB(
          "INSERT INTO project_attachments (project_id, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?)",
          [id, originalname, filename, uploaded_by]
        );
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.delete('/api/attachments/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const rows = await queryDB("SELECT file_path FROM project_attachments WHERE id = ?", [id]);
        if (rows.length > 0) {
          const filePath = path.join(__dirname, 'uploads', rows[0].file_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await queryDB("DELETE FROM project_attachments WHERE id = ?", [id]);
          res.json({ success: true });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

  // =FINANCE API
  app.get("/api/finance/projects", async (req, res) => {
    try {
      const rows = await queryDB(`
        SELECT id, deal_name, company, total_amount, paid_amount, due_amount, status 
        FROM projects 
        ORDER BY created_at DESC
      `);
      res.json({ success: true, projects: rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

app.put("/api/finance/update/:id", async (req, res) => {
  const { id } = req.params;
  const { paid_amount, role } = req.body;

  if (role !== 'admin' && role !== 'finance') {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    const project = await queryDB("SELECT total_amount, status FROM projects WHERE id = ?", [id]);
    if (project.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

    const total = parseFloat(project[0].total_amount);
    const currentStatus = project[0].status;
    const paid = parseFloat(paid_amount) || 0;
    const due = total - paid;

    const sql = "UPDATE projects SET paid_amount = ?, due_amount = ?, status = ? WHERE id = ?";
    const values = [paid, due, currentStatus, id];

    await queryDB(sql, values);

    res.json({ 
      success: true, 
      balance: due.toFixed(2),
      message: "Payment updated successfully" 
    });
  } catch (err) {
    console.error("FINANCE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// FINANCE SPECIFIC DATA
app.get("/api/finance/projects", async (req, res) => {
  try {
    const rows = await queryDB("SELECT id, deal_name, company, total_amount, paid_amount, due_amount, status FROM projects ORDER BY created_at DESC");
    res.json({ success: true, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

 // COMPANIES API
app.get('/api/companies', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        
        const rows = await conn.query(`
            SELECT 
                CAST(record_id AS CHAR) as record_id, 
                company_name AS name, 
                company_owner AS owner, 
                industry, 
                phone, 
                city, 
                country 
            FROM company 
            ORDER BY created_at DESC
        `);

        console.log(`Successfully fetched ${rows.length} companies.`);
        res.json({ success: true, companies: rows });
    } catch (err) {
        console.error("Database Fetch Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// POST a new company
app.post("/api/companies", async (req, res) => {
  const { name, owner, phone, city, country, industry } = req.body;
  
  try {
    await queryDB(
      `INSERT INTO company (company_name, company_owner, phone, city, country, industry) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, owner, phone, city, country, industry]
    );
    res.json({ success: true, message: "Company added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/companies/bulk', async (req, res) => {
    const { companies } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        
        const sql = `
            INSERT INTO company (record_id, company_name, company_owner, phone, city, country, industry) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                company_name = VALUES(company_name),
                company_owner = VALUES(company_owner),
                phone = VALUES(phone),
                city = VALUES(city),
                country = VALUES(country),
                industry = VALUES(industry)
        `;

        const values = companies.map(c => [
            (c.record_id && !isNaN(c.record_id)) ? c.record_id : null, 
            c.company_name, 
            c.company_owner || null, 
            c.phone || null, 
            c.city || null, 
            c.country || null, 
            c.industry || 'Other'
        ]);

        const result = await conn.batch(sql, values);
        res.json({ success: true, count: result.affectedRows });
    } catch (err) {
        console.error("Bulk Import Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

app.post('/api/clients/bulk', async (req, res) => {
  console.log("Received data:", req.body.clients);
    const { clients } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = `
            INSERT INTO clients (record_id, first_name, last_name, email, phone, contact_owner, assoc_company, lead_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                contact_owner = VALUES(contact_owner),
                assoc_company = VALUES(assoc_company),
                lead_status = VALUES(lead_status)
        `;

        const values = clients.map(c => [
            c.record_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone || null,
            c.contact_owner || null,
            c.assoc_company || null,
            c.lead_status || 'New'
        ]);

        const result = await conn.batch(sql, values);
        res.json({ success: true, count: result.affectedRows });
    } catch (err) {
        console.error("Client Bulk Import Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// TIMETREE EVENTS API
app.get("/api/timetree/users", async (req, res) => {
    try {
        const users = await queryDB("SELECT id, name, email FROM users");
        return res.json({ success: true, users });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/timetree/events", async (req, res) => {
    try {
        await queryDB(`
            UPDATE timetree_events 
            SET status = 'completed' 
            WHERE status = 'pending' 
            AND deadline_date IS NOT NULL 
            AND (
                deadline_date < CURDATE() 
                OR (deadline_date = CURDATE() AND deadline_time < CURTIME())
            )
        `);
        const events = await queryDB("SELECT id, title, event_date, start_time, deadline_date, deadline_time, status FROM timetree_events ORDER BY event_date ASC, start_time ASC");

        for (let event of events) {
            const chats = await queryDB("SELECT * FROM event_chats WHERE event_id = ?", [event.id]);
            event.chats = chats;
        }

        return res.json({ success: true, events });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/api/timetree/events", async (req, res) => {
    try {
        const { title, date, startTime, deadline_date, deadlineTime } = req.body;

        if (!title || !date) {
            return res.status(400).json({ success: false, error: "Title and Date are required." });
        }

        const finalStartTime = (startTime && startTime.length === 5) ? `${startTime}:00` : startTime;
        const finalDeadlineTime = (deadlineTime && deadlineTime.length === 5) ? `${deadlineTime}:00` : deadlineTime;
        const finalDate = date.split('T')[0]; 
        const finalDeadlineDate = (deadline_date && deadline_date.trim() !== "") ? deadline_date : null;

        const result = await queryDB(
            "INSERT INTO timetree_events (title, event_date, start_time, deadline_date, deadline_time, status) VALUES (?, ?, ?, ?, ?, ?)",
            [title, finalDate, finalStartTime, finalDeadlineDate, finalDeadlineTime || null, 'pending']
        );

        return res.json({ 
            success: true, 
            insertId: result.insertId.toString() 
        });

    } catch (err) {
        console.error("MARIADB ERROR:", err.sqlMessage || err.message);
        return res.status(500).json({ success: false, error: err.sqlMessage || err.message });
    }
});

app.post("/api/timetree/events/:id/chat", async (req, res) => {
    const { id } = req.params;
    const { sender_id, sender_name, sender_email, message_text } = req.body; 

    try {
        await queryDB(
            "INSERT INTO event_chats (event_id, sender_id, sender_name, sender_email, message_text) VALUES (?, ?, ?, ?, ?)",
            [id, sender_id, sender_name, sender_email, message_text]
        );
        res.json({ success: true, message: "Chat saved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

app.put("/api/timetree/events/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await queryDB("UPDATE timetree_events SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true, message: "Status updated" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete("/api/timetree/events/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await queryDB("DELETE FROM event_chats WHERE event_id = ?", [id]); 
        await queryDB("DELETE FROM timetree_events WHERE id = ?", [id]);
        res.json({ success: true, message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete("/api/timetree/chat/:chatId", async (req, res) => {
    const { chatId } = req.params;
    try {
        await queryDB("DELETE FROM event_chats WHERE id = ?", [chatId]);
        res.json({ success: true, message: "Message deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put("/api/timetree/chat/:chatId", async (req, res) => {
    const { chatId } = req.params;
    const { message_text } = req.body;
    try {
        await queryDB("UPDATE event_chats SET message_text = ? WHERE id = ?", [message_text, chatId]);
        res.json({ success: true, message: "Message updated" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/generate-document", (req, res) => {

  const templatePath = path.join(__dirname, "templates", "Sample_Template.docx");

  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip);

  doc.setData({
    prefix: req.body.prefix,
    client_name: req.body.client_name,
    company_name: req.body.company_name,
    salesrep_name: req.body.salesrep_name,
    contact_number: req.body.contact_number,
    position: req.body.position,
    project_name: req.body.project_name,
    date: req.body.date
  });

  try {

    doc.render();

    const buf = doc.getZip().generate({
      type: "nodebuffer"
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Generated_Proposal.docx"
    );

    res.send(buf);

  } catch (error) {

    console.error(error);
    res.status(500).send("Error generating document");

  }

});

// ================================================================
// =================== BOM MODULE ROUTES ==========================
// ================================================================
// Paste this entire block into your server.js, just before the
// last two lines:
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(...));
//
// NOTE: No extra imports needed — you already have everything.
// Your frontend must send { userId, userRole } in the request
// body (POST/PATCH) or as query params (GET) so the server knows
// who is making the call (matching your existing auth pattern).
// ================================================================

// ── Helper: map product_category → frontend categoryKey ─────────
function getBomCategoryKey(productCategory) {
  if (!productCategory) return 'OTHER';
  const c = productCategory.toLowerCase();
  // Ruijie
  if (c.includes('router'))                               return 'ROUTER';
  if (c.includes('wireless') || c.includes('/ ap'))      return 'ACCESS_POINT';
  if (c.includes('access controller'))                    return 'ACCESS_POINT';
  if (c.includes('firewall') || c.includes('security'))  return 'FIREWALL';
  if (c.includes('software'))                             return 'SOFTWARE';
  if (c.includes('accessory'))                            return 'ACCESSORY';
  // Sundray
  if (c.includes('access point') || c.includes('ap'))    return 'ACCESS_POINT';
  if (c.includes('gateway'))                              return 'ROUTER';
  if (c.includes('management'))                           return 'SOFTWARE';
  if (c.includes('x-link'))                               return 'OTHER';
  // shared
  if (c.includes('switch'))                               return 'SWITCHES';
  return 'OTHER';
}

// ================================================================
// PRODUCTS
// ================================================================

// GET /api/bom/products
// Query params: vendor, category, subcategory, search
app.get('/api/bom/products', async (req, res) => {
  const { vendor = 'ruijie', category, subcategory, search } = req.query;
  try {
    let sql    = 'SELECT * FROM bom_products WHERE vendor = ?';
    const params = [vendor];

    if (category && category !== 'ALL') {
      const catMap = {
        ROUTER:       ['Router'],
        SWITCHES:     ['Switch'],
        ACCESS_POINT: ['Wireless / AP', 'Access Controller'],
        FIREWALL:     ['Firewall / Security'],
        SOFTWARE:     ['Software'],
        ACCESSORY:    ['Switch Accessory'],
      };
      const mapped = catMap[category];
      if (mapped) {
        sql += ` AND product_category IN (${mapped.map(() => '?').join(',')})`;
        params.push(...mapped);
      }
    }

    if (subcategory && subcategory !== 'ALL') {
      sql += ' AND sub_category = ?';
      params.push(subcategory);
    }

    if (search && search.trim()) {
      sql += ' AND (model LIKE ? OR sub_category LIKE ? OR notes LIKE ?)';
      const like = `%${search.trim()}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY product_category, sub_category, model';

    const rows = await queryDB(sql, params);
    const products = rows.map(p => ({
      ...p,
      tag_dc:         Number(p.tag_dc),
      tag_enterprise: Number(p.tag_enterprise),
      tag_sme:        Number(p.tag_sme),
      categoryKey:    getBomCategoryKey(p.product_category),
    }));

    res.json({ success: true, products });
  } catch (err) {
    console.error('GET /api/bom/products error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bom/products/categories
// Returns distinct category → subcategory tree for filter pills
app.get('/api/bom/products/categories', async (req, res) => {
  const { vendor = 'ruijie' } = req.query;
  try {
    const rows = await queryDB(
      `SELECT DISTINCT product_category, sub_category
       FROM bom_products WHERE vendor = ?
       ORDER BY product_category, sub_category`,
      [vendor]
    );

    const tree = {};
    for (const row of rows) {
      const key = getBomCategoryKey(row.product_category);
      if (!tree[key]) tree[key] = { label: row.product_category, subcategories: [] };
      if (row.sub_category && !tree[key].subcategories.includes(row.sub_category)) {
        tree[key].subcategories.push(row.sub_category);
      }
    }
    res.json({ success: true, categories: tree });
  } catch (err) {
    console.error('GET /api/bom/products/categories error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// BOM DRAFTS
// ================================================================

// GET /api/bom/drafts?userId=123
// Returns all drafts belonging to this user
app.get('/api/bom/drafts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    const drafts = await queryDB(
      `SELECT d.*,
              u.name    AS creator_name,
              u.email   AS creator_email,
              u.role    AS creator_role,
              u.avatar  AS creator_avatar
       FROM bom_drafts d
       JOIN users u ON u.id = d.created_by
       WHERE d.created_by = ?
       ORDER BY d.updated_at DESC`,
      [userId]
    );

    // Attach item count + total units to each draft
    for (const draft of drafts) {
      const cnt = await queryDB(
        'SELECT COUNT(*) AS item_count, IFNULL(SUM(quantity),0) AS total_units FROM bom_draft_items WHERE draft_id = ?',
        [draft.id]
      );
      draft.item_count  = Number(cnt[0].item_count);
      draft.total_units = Number(cnt[0].total_units);
    }

    res.json({ success: true, drafts });
  } catch (err) {
    console.error('GET /api/bom/drafts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bom/drafts/:id?userId=123
// Returns one full draft with all its line items
app.get('/api/bom/drafts/:id', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    const rows = await queryDB(
      `SELECT d.*,
              u.name   AS creator_name,
              u.email  AS creator_email,
              u.role   AS creator_role,
              u.avatar AS creator_avatar,
              rv.name  AS reviewer_name,
              rv.email AS reviewer_email
       FROM bom_drafts d
       JOIN users u ON u.id = d.created_by
       LEFT JOIN users rv ON rv.id = d.reviewed_by
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, error: 'Draft not found' });
    const draft = rows[0];

    // Security: only the owner can load their own draft
    if (String(draft.created_by) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const items = await queryDB(
      `SELECT di.id, di.quantity, di.note,
              p.id AS product_id, p.model, p.vendor,
              p.product_category, p.sub_category, p.segment,
              p.poe, p.wireless_standard, p.management_type,
              p.tag_dc, p.tag_enterprise, p.tag_sme,
              p.switch_role, p.switch_port_speed, p.notes AS product_notes
       FROM bom_draft_items di
       JOIN bom_products p ON p.id = di.product_id
       WHERE di.draft_id = ?
       ORDER BY di.id`,
      [draft.id]
    );

    const enrichedItems = items.map(i => ({
      ...i,
      tag_dc:         Number(i.tag_dc),
      tag_enterprise: Number(i.tag_enterprise),
      tag_sme:        Number(i.tag_sme),
      categoryKey:    getBomCategoryKey(i.product_category),
    }));

    res.json({ success: true, draft: { ...draft, items: enrichedItems } });
  } catch (err) {
    console.error('GET /api/bom/drafts/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bom/drafts
// Body: { userId, name, items: [{ product_id, quantity, note }] }
// Creates a new draft or overwrites an existing draft with the same name for this user
app.post('/api/bom/drafts', async (req, res) => {
  const { userId, name, items } = req.body;
  if (!userId || !name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'userId, name, and items[] are required' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Check if a draft with same name already exists for this user
    const existing = await conn.query(
      'SELECT id FROM bom_drafts WHERE name = ? AND created_by = ? AND status = "draft"',
      [name, userId]
    );

    let draftId;
    if (existing.length) {
      draftId = Number(existing[0].id);
      await conn.query('UPDATE bom_drafts SET updated_at = NOW() WHERE id = ?', [draftId]);
      await conn.query('DELETE FROM bom_draft_items WHERE draft_id = ?', [draftId]);
    } else {
      const result = await conn.query(
        'INSERT INTO bom_drafts (name, created_by, status) VALUES (?, ?, "draft")',
        [name, userId]
      );
      draftId = Number(result.insertId);
    }

    for (const item of items) {
      await conn.query(
        'INSERT INTO bom_draft_items (draft_id, product_id, quantity, note) VALUES (?, ?, ?, ?)',
        [draftId, item.product_id, item.quantity || 1, item.note || null]
      );
    }

    await conn.commit();
    res.json({ success: true, draft_id: draftId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('POST /api/bom/drafts error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/bom/drafts/:id
// Body: { userId, userRole }
app.delete('/api/bom/drafts/:id', async (req, res) => {
  const { userId, userRole } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    const rows = await queryDB('SELECT id, created_by FROM bom_drafts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });

    if (String(rows[0].created_by) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await queryDB('DELETE FROM bom_drafts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Draft deleted' });
  } catch (err) {
    console.error('DELETE /api/bom/drafts/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// FORWARD TO FINANCE
// ================================================================

// POST /api/bom/drafts/:id/forward
// Body: { userId, finance_note }
app.post('/api/bom/drafts/:id/forward', async (req, res) => {
  const { userId, finance_note } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    const rows = await queryDB(
      'SELECT id, created_by, status FROM bom_drafts WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Draft not found' });
    if (String(rows[0].created_by) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (rows[0].status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Only drafts can be forwarded' });
    }

    await queryDB(
      `UPDATE bom_drafts
       SET status = 'forwarded', forwarded_at = NOW(), finance_note = ?
       WHERE id = ?`,
      [finance_note || null, req.params.id]
    );

    res.json({ success: true, message: 'Purchase order forwarded to Finance.' });
  } catch (err) {
    console.error('POST /api/bom/drafts/:id/forward error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// PURCHASE ORDERS  (Finance + Admin view)
// ================================================================

// GET /api/bom/purchase-orders?userRole=admin  (or finance)
// Returns all forwarded/approved/rejected POs with full creator info
app.get('/api/bom/purchase-orders', async (req, res) => {
  const { userRole, status } = req.query;

  try {
    let sql = `
      SELECT d.*,
             u.id     AS creator_id,
             u.name   AS creator_name,
             u.email  AS creator_email,
             u.role   AS creator_role,
             u.avatar AS creator_avatar,
             rv.name  AS reviewer_name,
             rv.email AS reviewer_email
      FROM bom_drafts d
      JOIN users u ON u.id = d.created_by
      LEFT JOIN users rv ON rv.id = d.reviewed_by
      WHERE d.status != 'draft'
    `;
    const params = [];
    if (status) { sql += ' AND d.status = ?'; params.push(status); }
    sql += ' ORDER BY d.forwarded_at DESC';

    const pos = await queryDB(sql, params);

    for (const po of pos) {
      const cnt = await queryDB(
        'SELECT COUNT(*) AS item_count, IFNULL(SUM(quantity),0) AS total_units FROM bom_draft_items WHERE draft_id = ?',
        [po.id]
      );
      po.item_count  = Number(cnt[0].item_count);
      po.total_units = Number(cnt[0].total_units);
    }

    res.json({ success: true, purchase_orders: pos });
  } catch (err) {
    console.error('GET /api/bom/purchase-orders error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bom/purchase-orders/:id/items?userRole=admin
// Returns all line items for a specific PO (for the expandable view)
app.get('/api/bom/purchase-orders/:id/items', async (req, res) => {
  const { userRole } = req.query;
  try {
    const items = await queryDB(
      `SELECT di.id, di.quantity, di.note,
              p.id AS product_id, p.model, p.vendor,
              p.product_category, p.sub_category, p.segment,
              p.poe, p.wireless_standard, p.management_type,
              p.notes AS product_notes
       FROM bom_draft_items di
       JOIN bom_products p ON p.id = di.product_id
       WHERE di.draft_id = ?
       ORDER BY di.id`,
      [req.params.id]
    );

    const enriched = items.map(i => ({
      ...i,
      categoryKey: getBomCategoryKey(i.product_category),
    }));

    res.json({ success: true, items: enriched });
  } catch (err) {
    console.error('GET /api/bom/purchase-orders/:id/items error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// ADMIN — Approve / Reject
// ================================================================

// PATCH /api/bom/purchase-orders/:id/approve
// Body: { userId, userRole }  — admin only
app.patch('/api/bom/purchase-orders/:id/approve', async (req, res) => {
  const { userId, userRole } = req.body;
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const rows = await queryDB('SELECT id, status FROM bom_drafts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    if (rows[0].status !== 'forwarded') {
      return res.status(400).json({ success: false, error: 'Only forwarded POs can be approved' });
    }

    await queryDB(
      `UPDATE bom_drafts
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [userId, req.params.id]
    );
    res.json({ success: true, message: 'Purchase order approved.' });
  } catch (err) {
    console.error('PATCH /approve error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/bom/purchase-orders/:id/reject
// Body: { userId, userRole, reason }
app.patch('/api/bom/purchase-orders/:id/reject', async (req, res) => {
  const { userId, userRole, reason } = req.body;
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const rows = await queryDB('SELECT id, status FROM bom_drafts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    if (rows[0].status !== 'forwarded') {
      return res.status(400).json({ success: false, error: 'Only forwarded POs can be rejected' });
    }

    await queryDB(
      `UPDATE bom_drafts
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), reject_reason = ?
       WHERE id = ?`,
      [userId, reason || null, req.params.id]
    );
    res.json({ success: true, message: 'Purchase order rejected.' });
  } catch (err) {
    console.error('PATCH /reject error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================================================================
// CSV IMPORT  — Admin only
// POST /api/bom/products/import
// Accepts multipart/form-data with fields: "file" (CSV) and "vendor"
// Uses your existing `upload` multer instance
// ================================================================
app.post('/api/bom/products/import', upload.single('file'), async (req, res) => {
  const { userRole, vendor = 'ruijie' } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const csvText = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path); // clean up temp file

    // Parse CSV manually (no extra library needed)
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: 'CSV file appears to be empty or invalid' });
    }

    // ── Sundray: column-based format ──────────────────────────────
    if (vendor === 'sundray') {
      const SUNDRAY_SQL = `
        INSERT INTO bom_products
          (model, vendor, segment, product_category, sub_category, management_type, notes)
        VALUES (?, 'sundray', 'Enterprise', ?, ?, 'Cloud-Managed', ?)
        ON DUPLICATE KEY UPDATE
          product_category = VALUES(product_category),
          sub_category     = VALUES(sub_category),
          management_type  = VALUES(management_type)
      `;

      // Sundray column map (0-indexed):
      // 0=Access Points, 1=Switches, 2=Gateway and Controller, 3=Management Platform, 4=X-LINK
      const colMap = [
        { cat: 'Access Points',           sub: (model) => getSundrayAPSub(model) },
        { cat: 'Switch',                  sub: (model) => getSundraySwitchSub(model) },
        { cat: 'Gateway and Controller',  sub: (model) => getSundrayGWSub(model) },
        { cat: 'Management Platform',     sub: () => 'Network Management Center' },
        { cat: 'X-LINK',                  sub: (model) => getSundrayXLinkSub(model) },
      ];

      let inserted = 0, skipped = 0;
      const seen = new Set();

      // Data rows start at index 1 (row 0 is header)
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        for (let c = 0; c < 5; c++) {
          const model = cols[c] ? cols[c].trim() : '';
          if (!model) continue;
          if (seen.has(model)) continue;
          seen.add(model);
          const { cat, sub } = colMap[c];
          try {
            await queryDB(SUNDRAY_SQL, [model, cat, sub(model), null]);
            inserted++;
          } catch (e) {
            console.warn(`Skipped Sundray "${model}":`, e.message);
            skipped++;
          }
        }
      }

      return res.json({
        success: true,
        message: `Sundray import complete: ${inserted} products imported, ${skipped} skipped.`,
        inserted, skipped,
      });
    }
    // ── End Sundray branch ────────────────────────────────────────

    // Parse header row (index 1) — Ruijie format
    const headers = parseCSVLine(lines[1]);

    const COL = {
      model:     headers.indexOf('Product Model / Series'),
      segment:   headers.indexOf('Segment'),
      category:  headers.indexOf('Product Category'),
      sub:       headers.indexOf('Sub-Category'),
      wifi:      headers.indexOf('Wireless Standard'),
      deploy:    headers.indexOf('Deployment / Mounting'),
      mgmt:      headers.indexOf('Management Type'),
      poe:       headers.indexOf('PoE'),
      tagDC:     headers.indexOf('Data Center Tag'),
      tagEnt:    headers.indexOf('Enterprise Tag'),
      tagSME:    headers.indexOf('SME Tag'),
      role:      headers.indexOf('Switch Role / Tier'),
      speed:     headers.indexOf('Switch Port Speed'),
      notes:     headers.indexOf('Notes / URL'),
    };

    const sql = `
      INSERT INTO bom_products
        (model, vendor, segment, product_category, sub_category,
         wireless_standard, deployment, management_type, poe,
         tag_dc, tag_enterprise, tag_sme,
         switch_role, switch_port_speed, notes)
      VALUES (?, 'ruijie', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        segment           = VALUES(segment),
        product_category  = VALUES(product_category),
        sub_category      = VALUES(sub_category),
        wireless_standard = VALUES(wireless_standard),
        deployment        = VALUES(deployment),
        management_type   = VALUES(management_type),
        poe               = VALUES(poe),
        tag_dc            = VALUES(tag_dc),
        tag_enterprise    = VALUES(tag_enterprise),
        tag_sme           = VALUES(tag_sme),
        switch_role       = VALUES(switch_role),
        switch_port_speed = VALUES(switch_port_speed),
        notes             = VALUES(notes)
    `;

    const clean = (v) => {
      if (!v) return null;
      const t = v.trim();
      return (t === '-' || t === 'N/A' || t === '') ? null : t;
    };
    const checkmark = (v) => (v && v.trim() === '✓') ? 1 : 0;

    let inserted = 0, skipped = 0;
    const seen = new Set();

    // Data starts at line index 2
    for (let i = 2; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const model = clean(cols[COL.model]);
      if (!model || model === 'Product Model / Series') continue;
      if (seen.has(model)) continue;
      seen.add(model);

      try {
        await queryDB(sql, [
          model,
          clean(cols[COL.segment]),
          clean(cols[COL.category]),
          clean(cols[COL.sub]),
          clean(cols[COL.wifi]),
          clean(cols[COL.deploy]),
          clean(cols[COL.mgmt]),
          clean(cols[COL.poe]),
          checkmark(cols[COL.tagDC]),
          checkmark(cols[COL.tagEnt]),
          checkmark(cols[COL.tagSME]),
          clean(cols[COL.role]),
          clean(cols[COL.speed]),
          clean(cols[COL.notes]),
        ]);
        inserted++;
      } catch (e) {
        console.warn(`Skipped row "${model}":`, e.message);
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${inserted} products imported, ${skipped} skipped.`,
      inserted,
      skipped,
    });

  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Sundray subcategory helpers ──────────────────────────────────
function getSundrayAPSub(model) {
  const m = model.toUpperCase();
  if (m.startsWith('S5') || m.startsWith('S8') || m.startsWith('S3') || m.startsWith('S582') || m.startsWith('S372') || m.startsWith('S853') || m.startsWith('S822')) return 'Scenario AP';
  if (m.includes('IOT')) return 'IoT Fusion AP';
  if (m.includes('ILINK')) return 'Inwall AP';
  if (m.startsWith('NAP')) return 'Ceiling AP';
  return 'Access Point';
}
function getSundraySwitchSub(model) {
  const m = model.toUpperCase();
  if (m.startsWith('TS'))  return 'Chassis Switches';
  if (m.startsWith('RS68')) return 'V-Sec Distribution Switch';
  if (m.startsWith('RS63')) return 'V-Sec Distribution Switch';
  if (m.startsWith('RS53') || m.startsWith('RS52')) return 'V-Sec PoE Switch';
  if (m.startsWith('RS33') || m.startsWith('RS32')) return 'V-Sec Access Switch';
  if (m.startsWith('NS'))  return 'Neuron Sense AI Switch';
  if (m.startsWith('HS'))  return 'Hummer Switch';
  return 'Switch';
}
function getSundrayGWSub(model) {
  const m = model.toUpperCase();
  if (m.startsWith('NAC'))  return 'Network Access Controller';
  if (m.startsWith('SAC'))  return 'Network Access Controller';
  if (m.startsWith('SFG') || m.startsWith('SIG')) return 'Gateway';
  return 'Gateway and Controller';
}
function getSundrayXLinkSub(model) {
  const m = model.toUpperCase();
  if (m.startsWith('XMG'))  return 'X-LINK Gateway';
  if (m.startsWith('XAP') || m.startsWith('RL-XRT')) return 'X-LINK Access Points';
  if (m.startsWith('XS') || m.startsWith('RL-XS')) return 'X-LINK Switches';
  return 'X-LINK';
}

// Helper: parse one CSV line respecting quoted commas
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ================================================================
// END OF BOM MODULE
// ================================================================

  // SERVER
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


