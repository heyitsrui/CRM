// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // your mariadb user
    password: '12202003',
    database: 'crm'
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (result.length > 0) {
            res.status(200).json({ success: true, message: "Logged in" });
        } else {
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));