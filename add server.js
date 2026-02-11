// ================= PROJECTS / DEALS (PROPOSALS) =================
// GET Projects: Added 'amount' to the SELECT statement
app.get("/api/projects", async (req, res) => {
  try {
    const rows = await queryDB(`
      SELECT id, deal_name, deal_owner, address, status, amount, paid_amount, due_amount,
             description, contact, company, created_at
      FROM projects
      ORDER BY created_at DESC
    `);
    res.json({ success: true, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Project: Fixed to store the input 'amount' into the 'amount' column
app.post("/api/projects", async (req, res) => {
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  if (!deal_name) return res.json({ success: false, message: "Deal Name is required" });
  
  try {
    const totalContract = parseFloat(amount) || 0;

    const result = await queryDB(
      `INSERT INTO projects
       (deal_name, deal_owner, address, status, amount, paid_amount, due_amount, description, contact, company, created_at)
       VALUES (?, ?, ?, 'Lead', ?, 0, ?, ?, ?, ?, NOW())`,
      [
        deal_name, 
        deal_owner || "", 
        address || "", 
        totalContract, // This saves to the 'amount' column (Total)
        totalContract, // Initial due_amount is the same as total amount
        description || "", 
        contact || "", 
        company || ""
      ]
    );
    const project = await queryDB("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    res.json({ success: true, project: project[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// FINANCE UPDATE: Performs the math (amount - paid_amount = due_amount)
app.put("/api/finance/update/:id", async (req, res) => {
  const { id } = req.params;
  const { paid_amount } = req.body;

  try {
    // 1. Fetch the stored 'amount' (Total) for this specific project
    const projectRows = await queryDB("SELECT amount FROM projects WHERE id = ?", [id]);
    if (projectRows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

    const totalAmount = parseFloat(projectRows[0].amount) || 0;
    const paidAmount = parseFloat(paid_amount) || 0;
    
    // 2. The Logic: Total - Paid = Due
    const remainingDue = totalAmount - paidAmount;

    // 3. Update the database with new paid and due values
    await queryDB(
      "UPDATE projects SET paid_amount = ?, due_amount = ?, status = 'Approved' WHERE id = ?",
      [paidAmount, remainingDue, id]
    );

    res.json({ success: true, message: "Finance record updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Project: 'amount' from body now updates 'due_amount'
app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  try {
    await queryDB(
      `UPDATE projects SET deal_name=?, deal_owner=?, address=?, description=?, contact=?, company=?, due_amount=? WHERE id=?`,
      [
        deal_name, 
        deal_owner || "", 
        address || "", 
        description || "", 
        contact || "", 
        company || "", 
        parseFloat(amount) || 0, // Update due_amount instead
        id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});// GET Projects - Updated to include the original 'amount' (Total)
app.get("/api/projects", async (req, res) => {
  try {
    const rows = await queryDB(`
      SELECT id, deal_name, deal_owner, address, status, paid_amount, due_amount,
             amount, description, contact, company, created_at
      FROM projects
      ORDER BY created_at DESC
    `);
    res.json({ success: true, projects: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Project: 'amount' maps to the total contract value. due_amount starts at 0.
app.post("/api/projects", async (req, res) => {
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  if (!deal_name) return res.json({ success: false, message: "Deal Name is required" });
  
  try {
    const totalAmount = parseFloat(amount) || 0;
    const result = await queryDB(
      `INSERT INTO projects
       (deal_name, deal_owner, address, status, paid_amount, due_amount, amount, description, contact, company, created_at)
       VALUES (?, ?, ?, 'Lead', 0, 0, ?, ?, ?, ?, NOW())`, 
      [
        deal_name, 
        deal_owner || "", 
        address || "", 
        totalAmount,    // Storing as the reference Total Amount
        description || "", 
        contact || "", 
        company || ""
      ]
    );
    const project = await queryDB("SELECT * FROM projects WHERE id = ?", [result.insertId]);
    res.json({ success: true, project: project[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Project: Updates the basic details and the base Total Amount
app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const { deal_name, deal_owner, address, description, contact, company, amount } = req.body;
  try {
    await queryDB(
      `UPDATE projects SET deal_name=?, deal_owner=?, address=?, description=?, contact=?, company=?, amount=? WHERE id=?`,
      [
        deal_name, 
        deal_owner || "", 
        address || "", 
        description || "", 
        contact || "", 
        company || "", 
        parseFloat(amount) || 0, 
        id
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});





// ================= FINANCE ROUTES sa baba katabi ng server (CALCULATION INTEGRATED) =================

app.get("/api/finance/projects", async (req, res) => {
  try {
    const rows = await queryDB(`
      SELECT id, deal_name, company, deal_owner, paid_amount, due_amount, amount, status 
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
  const { paid_amount } = req.body; 

  try {
    // 1. Fetch the total amount (amount) from the database for this project
    const rows = await queryDB("SELECT amount FROM projects WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

    const totalContract = parseFloat(rows[0].amount) || 0;
    const valPaid = parseFloat(paid_amount) || 0;
    
    // 2. LOGIC: Total - Paid = Due
    const valDue = totalContract - valPaid;

    // 3. Update the database
    const result = await queryDB(
      "UPDATE projects SET paid_amount = ?, due_amount = ?, status = 'Approved' WHERE id = ?",
      [valPaid, valDue, id]
    );

    res.json({ success: true, message: "Finance and Balance updated", balance: valDue });
  } catch (err) {
    console.error("FINANCE DATABASE ERROR:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
