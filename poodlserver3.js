const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database connection ---
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'CitAd31l#FotesSsS,#KabEe',
  database: 'poodlmembership',
  waitForConnections: true,
  connectionLimit: 10,
});

// --- WRITE: insert a row ---
app.post('/saveBonus', async (req, res) => {
  try {
        const { userAddress ,usdtAmount, poodlAmount, paidBonus } = req.body;

        if (!userAddress) {
        return res.status(400).json({ error: 'userAddress is required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO poodlbonus
                (userAddress, usdtAmount, poodlAmount, paidBonus, payDateTime)
            VALUES (?, ?, ?, ?, NOW())`,
            [userAddress, usdtAmount, poodlAmount, paidBonus]
        );

        res.json({ success: true, insertId: result.insertId });
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- FETCH: get rows for one user address ---
app.get('/getBonus', async (req, res) => {
  try {
    
    const [rows] = await pool.execute(
      `SELECT * FROM poodlbonus  ORDER BY payDateTime DESC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// --- FETCH: update for one user address ---
app.post('/updateBonus', async (req, res) => {
  try {
    const { userAddresses } = req.body;   // expect an array of addresses

    if (!Array.isArray(userAddresses) || userAddresses.length === 0) {
      return res.status(400).json({ error: 'userAddresses array is required' });
    }

    // Build the right number of placeholders: (?, ?, ?)
    const placeholders = userAddresses.map(() => '?').join(', ');

    const [result] = await pool.execute(
      `UPDATE poodlbonus
         SET paidBonus = 1
       WHERE userAddress IN (${placeholders})`,
      userAddresses
    );

    res.json({ success: true, updated: result.affectedRows });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.listen(3000, () => console.log('Server running on http://localhost:3000'));