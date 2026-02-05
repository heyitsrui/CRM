// ================= API ROUTES =================

// 1. Get Admin Profile (For Top Nav)
app.get("/api/admin-profile", async (req, res) => {
  try {
    const users = await queryDB("SELECT name, email FROM users WHERE role = 'admin' LIMIT 1");
    if (users.length === 0) return res.json({ success: true, user: { name: 'Admin', email: 'admin@test.com' } });
    
    // Format name if needed or return as is
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Dashboard Stats (For Cards & Money)
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
    
    // MariaDB returns BigInt for counts, convert to Number for JSON
    const data = stats[0];
    const cleanStats = {
      leads: Number(data.leads),
      bidding: Number(data.bidding),
      signature: Number(data.signature),
      hold: Number(data.hold),
      approved: Number(data.approved),
      totalPaid: Number(data.totalPaid || 0),
      totalDue: Number(data.totalDue || 0)
    };

    res.json({ success: true, stats: cleanStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Recent Activity
app.get("/api/recent-activity", async (req, res) => {
  try {
    const rows = await queryDB(
      "SELECT title, description, DATE_FORMAT(created_at, '%d/%m/%Y') as date FROM activities ORDER BY created_at DESC LIMIT 5"
    );
    res.json({ success: true, activities: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- PROJECT / PROPOSAL ROUTES ---
app.get("/api/projects", async (req, res) => {
  try {
    const rows = await queryDB("SELECT * FROM projects ORDER BY created_at DESC");
    res.json({ success: true, projects: rows });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/projects", async (req, res) => {
  const { title, client, address, status } = req.body;
  try {
    await queryDB(
      "INSERT INTO projects (title, client, address, status) VALUES (?, ?, ?, ?)",
      [title, client, address, status || 'Lead']
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.put("/api/projects/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await queryDB("UPDATE projects SET status = ? WHERE id = ?", [status, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
