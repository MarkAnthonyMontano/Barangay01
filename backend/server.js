// server.js
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



// Serve uploaded files
app.use('/uploads', express.static('uploads'));


// ====== Multer setup for official signatures ======
const signaturesDir = 'uploads/signatures';
fs.mkdirSync(signaturesDir, { recursive: true });

// FIX: Create needed upload folders
fs.mkdirSync('uploads/profile_pictures', { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, signaturesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'signature') {
      cb(null, 'uploads/signatures');
    } else if (file.fieldname === 'profile_img') {
      cb(null, 'uploads/profile_pictures');
    } else {
      cb(null, 'uploads/others');
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: multerStorage });



// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ===== Helper: token from header =====
function getTokenFromHeader(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

// ===== Middleware: verify token =====
function verifyToken(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, full_name }
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}



// ===================== AUTH =====================

// ===================== MULTER =====================
const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];

const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid file type. Only PNG, JPG, JPEG, or PDF allowed."));
    }

    if (file.fieldname === "logo") cb(null, "Logo" + ext);
    else if (file.fieldname === "bg_image") cb(null, "Background" + ext);
    else cb(null, Date.now() + ext);
  },
});

const settingsUpload = multer({ storage: settingsStorage });

const deleteOldFile = (fileUrl) => {
  if (!fileUrl) return;
  const filePath = path.join(__dirname, fileUrl.replace(/^\//, ""));
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Error deleting old file: ${err.message}`);
    else console.log(`Deleted old file: ${filePath}`);
  });
};

// ===================== ROUTES =====================
// GET settings
app.get("/api/settings", verifyToken, async (req, res) => {
  try {
    const rows = await query("SELECT * FROM company_settings WHERE id = 1");
    if (rows.length === 0) {
      return res.json({
        company_name: "",
        address: "",
        header_color: "#ffffff",
        footer_text: "",
        footer_color: "#ffffff",
        logo_url: null,
        bg_image: null,
        main_button_color: "#ffffff",
        sidebar_button_color: "#000000",
      });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST settings
app.post("/api/settings", verifyToken,
  settingsUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "bg_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        company_name,
        address,
        header_color,
        footer_text,
        footer_color,
        main_button_color,
        sidebar_button_color,
      } = req.body;

      const logoUrl = req.files["logo"] ? `/uploads/${req.files["logo"][0].filename}` : null;
      const bgImageUrl = req.files["bg_image"] ? `/uploads/${req.files["bg_image"][0].filename}` : null;

      const rows = await query("SELECT * FROM company_settings WHERE id = 1");

      if (rows.length > 0) {
        const oldLogo = rows[0].logo_url;
        const oldBg = rows[0].bg_image;

        let sql = `
          UPDATE company_settings 
          SET company_name=?, address=?, header_color=?, footer_text=?, footer_color=?, main_button_color=?, sidebar_button_color=?`;

        const params = [
          company_name || "",
          address || "",
          header_color || "#ffffff",
          footer_text || "",
          footer_color || "#ffffff",
          main_button_color || "#ffffff",
          sidebar_button_color || "#000000",
        ];

        if (logoUrl) {
          sql += ", logo_url=?";
          params.push(logoUrl);
        }

        if (bgImageUrl) {
          sql += ", bg_image=?";
          params.push(bgImageUrl);
        }

        sql += " WHERE id = 1";

        await query(sql, params);

        if (logoUrl && oldLogo && oldLogo !== logoUrl) deleteOldFile(oldLogo);
        if (bgImageUrl && oldBg && oldBg !== bgImageUrl) deleteOldFile(oldBg);

        return res.json({ success: true, message: "Settings updated successfully." });
      } else {
        const insertSql = `
          INSERT INTO company_settings 
          (company_name, address, header_color, footer_text, footer_color, logo_url, bg_image, main_button_color, sidebar_button_color)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await query(insertSql, [
          company_name || "",
          address || "",
          header_color || "#ffffff",
          footer_text || "",
          footer_color || "#ffffff",
          logoUrl,
          bgImageUrl,
          main_button_color || "#ffffff",
          sidebar_button_color || "#000000",
        ]);

        res.json({ success: true, message: "Settings created successfully." });
      }
    } catch (err) {
      console.error("❌ Error in /api/settings:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res
        .status(400)
        .json({ message: 'username, password, and full_name are required.' });
    }

    // Check if username exists
    const existing = await query('SELECT id FROM users WHERE username = ?', [
      username,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES (?, ?, ?, ?)`,
      [username, password_hash, full_name, role || 'Staff']
    );

    const created = await query('SELECT id, username, full_name, role FROM users WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'username and password are required.' });
    }

    const users = await query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// GET /api/auth/me (current user)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  res.json(req.user);
});

// ===================== RESIDENTS =====================

// GET /api/residents - public view
app.get('/api/residents', async (req, res) => {
  try {
    const residents = await query(
      'SELECT * FROM residents ORDER BY last_name, first_name'
    );
    res.json(residents);
  } catch (err) {
    console.error('Error fetching residents:', err);
    res.status(500).json({ message: 'Error fetching residents' });
  }
});

// POST /api/residents - create (protected)
app.post('/api/residents', verifyToken, async (req, res) => {
  try {
    const {
      last_name,
      first_name,
      middle_name,
      suffix,
      sex,
      birthdate,
      civil_status,
      contact_no,
      address,
    } = req.body;

    if (!last_name || !first_name || !sex) {
      return res
        .status(400)
        .json({ message: 'last_name, first_name, and sex are required.' });
    }

    const result = await query(
      `INSERT INTO residents
       (last_name, first_name, middle_name, suffix, sex, birthdate,
        civil_status, contact_no, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        last_name,
        first_name,
        middle_name || null,
        suffix || null,
        sex,
        birthdate || null,
        civil_status || null,
        contact_no || null,
        address || null,
      ]
    );

    const created = await query('SELECT * FROM residents WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating resident:', err);
    res.status(500).json({ message: 'Error creating resident' });
  }
});

// PUT /api/residents/:id - update (protected)
app.put('/api/residents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      last_name,
      first_name,
      middle_name,
      suffix,
      sex,
      birthdate,
      civil_status,
      contact_no,
      address,
    } = req.body;

    await query(
      `UPDATE residents
       SET last_name = ?, first_name = ?, middle_name = ?, suffix = ?,
           sex = ?, birthdate = ?, civil_status = ?, contact_no = ?, address = ?
       WHERE id = ?`,
      [
        last_name,
        first_name,
        middle_name || null,
        suffix || null,
        sex,
        birthdate || null,
        civil_status || null,
        contact_no || null,
        address || null,
        id,
      ]
    );

    const updated = await query('SELECT * FROM residents WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating resident:', err);
    res.status(500).json({ message: 'Error updating resident' });
  }
});

// ===================== HOUSEHOLDS =====================

// GET /api/households
app.get('/api/households', async (req, res) => {
  try {
    const households = await query(
      `SELECT h.*,
              COUNT(hm.id) AS member_count
       FROM households h
       LEFT JOIN household_members hm ON hm.household_id = h.id
       GROUP BY h.id
       ORDER BY h.household_name`
    );
    res.json(households);
  } catch (err) {
    console.error('Error fetching households:', err);
    res.status(500).json({ message: 'Error fetching households' });
  }
});

// POST /api/households (protected)
app.post('/api/households', verifyToken, async (req, res) => {
  try {
    const { household_name, address, purok } = req.body;

    if (!household_name || !address) {
      return res
        .status(400)
        .json({ message: 'household_name and address are required.' });
    }

    const result = await query(
      `INSERT INTO households (household_name, address, purok)
       VALUES (?, ?, ?)`,
      [household_name, address, purok || null]
    );

    const created = await query('SELECT * FROM households WHERE id = ?', [
      result.insertId,
    ]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating household:', err);
    res.status(500).json({ message: 'Error creating household' });
  }
});

// PUT /api/households/:id (protected)
app.put('/api/households/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { household_name, address, purok } = req.body;

    await query(
      `UPDATE households
       SET household_name = ?, address = ?, purok = ?
       WHERE id = ?`,
      [household_name, address, purok || null, id]
    );

    const updated = await query('SELECT * FROM households WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating household:', err);
    res.status(500).json({ message: 'Error updating household' });
  }
});

// GET /api/households/:id/members
app.get('/api/households/:id/members', async (req, res) => {
  try {
    const householdId = req.params.id;
    const members = await query(
      `SELECT hm.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              hm.relation_to_head
       FROM household_members hm
       JOIN residents r ON r.id = hm.resident_id
       WHERE hm.household_id = ?
       ORDER BY r.last_name, r.first_name`,
      [householdId]
    );
    res.json(members);
  } catch (err) {
    console.error('Error fetching household members:', err);
    res.status(500).json({ message: 'Error fetching household members' });
  }
});

// POST /api/households/:id/members (protected)
app.post('/api/households/:id/members', verifyToken, async (req, res) => {
  try {
    const householdId = req.params.id;
    const { resident_id, relation_to_head } = req.body;

    if (!resident_id) {
      return res
        .status(400)
        .json({ message: 'resident_id is required to add member.' });
    }

    const result = await query(
      `INSERT INTO household_members (household_id, resident_id, relation_to_head)
       VALUES (?, ?, ?)`,
      [householdId, resident_id, relation_to_head || null]
    );

    const created = await query(
      `SELECT hm.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              hm.relation_to_head
       FROM household_members hm
       JOIN residents r ON r.id = hm.resident_id
       WHERE hm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error adding household member:', err);
    res.status(500).json({ message: 'Error adding household member' });
  }
});

// ===================== INCIDENTS =====================

// GET /api/incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await query(
      `SELECT i.*,
              c.first_name AS complainant_first_name,
              c.last_name AS complainant_last_name,
              r.first_name AS respondent_first_name,
              r.last_name AS respondent_last_name
       FROM incidents i
       LEFT JOIN residents c ON c.id = i.complainant_id
       LEFT JOIN residents r ON r.id = i.respondent_id
       ORDER BY i.incident_date DESC`
    );
    res.json(incidents);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).json({ message: 'Error fetching incidents' });
  }
});

// POST /api/incidents (protected)
app.post('/api/incidents', verifyToken, async (req, res) => {
  try {
    const {
      incident_date,
      incident_type,
      location,
      description,
      complainant_id,
      respondent_id,
      status,
    } = req.body;

    if (!incident_date || !incident_type) {
      return res
        .status(400)
        .json({ message: 'incident_date and incident_type are required.' });
    }

    const result = await query(
      `INSERT INTO incidents
       (incident_date, incident_type, location, description,
        complainant_id, respondent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        incident_date,
        incident_type,
        location || null,
        description || null,
        complainant_id || null,
        respondent_id || null,
        status || 'Open',
      ]
    );

    const created = await query('SELECT * FROM incidents WHERE id = ?', [
      result.insertId,
    ]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ message: 'Error creating incident' });
  }
});

// PUT /api/incidents/:id (protected)
app.put('/api/incidents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      incident_date,
      incident_type,
      location,
      description,
      complainant_id,
      respondent_id,
      status,
    } = req.body;

    await query(
      `UPDATE incidents
       SET incident_date = ?, incident_type = ?, location = ?,
           description = ?, complainant_id = ?, respondent_id = ?, status = ?
       WHERE id = ?`,
      [
        incident_date,
        incident_type,
        location || null,
        description || null,
        complainant_id || null,
        respondent_id || null,
        status || 'Open',
        id,
      ]
    );

    const updated = await query('SELECT * FROM incidents WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ message: 'Error updating incident' });
  }
});

// ===================== SERVICES =====================

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const services = await query(
      `SELECT s.*,
              COUNT(sb.id) AS beneficiary_count
       FROM services s
       LEFT JOIN service_beneficiaries sb ON sb.service_id = s.id
       GROUP BY s.id
       ORDER BY s.service_date DESC, s.service_name`
    );
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// POST /api/services (protected)
app.post('/api/services', verifyToken, async (req, res) => {
  try {
    const { service_name, description, service_date, location } = req.body;

    if (!service_name) {
      return res.status(400).json({ message: 'service_name is required.' });
    }

    const result = await query(
      `INSERT INTO services (service_name, description, service_date, location)
       VALUES (?, ?, ?, ?)`,
      [service_name, description || null, service_date || null, location || null]
    );

    const created = await query('SELECT * FROM services WHERE id = ?', [
      result.insertId,
    ]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Error creating service' });
  }
});

// PUT /api/services/:id (protected)
app.put('/api/services/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, description, service_date, location } = req.body;

    await query(
      `UPDATE services
       SET service_name = ?, description = ?, service_date = ?, location = ?
       WHERE id = ?`,
      [service_name, description || null, service_date || null, location || null, id]
    );

    const updated = await query('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Error updating service' });
  }
});

// GET /api/services/:id/beneficiaries
app.get('/api/services/:id/beneficiaries', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const beneficiaries = await query(
      `SELECT sb.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              sb.notes
       FROM service_beneficiaries sb
       JOIN residents r ON r.id = sb.resident_id
       WHERE sb.service_id = ?
       ORDER BY r.last_name, r.first_name`,
      [serviceId]
    );
    res.json(beneficiaries);
  } catch (err) {
    console.error('Error fetching beneficiaries:', err);
    res.status(500).json({ message: 'Error fetching beneficiaries' });
  }
});

// POST /api/services/:id/beneficiaries (protected)
app.post('/api/services/:id/beneficiaries', verifyToken, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { resident_id, notes } = req.body;

    if (!resident_id) {
      return res
        .status(400)
        .json({ message: 'resident_id is required for beneficiary.' });
    }

    const result = await query(
      `INSERT INTO service_beneficiaries (service_id, resident_id, notes)
       VALUES (?, ?, ?)`,
      [serviceId, resident_id, notes || null]
    );

    const created = await query(
      `SELECT sb.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              sb.notes
       FROM service_beneficiaries sb
       JOIN residents r ON r.id = sb.resident_id
       WHERE sb.id = ?`,
      [result.insertId]
    );

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error adding beneficiary:', err);
    res.status(500).json({ message: 'Error adding beneficiary' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('Barangay System API running...');
});
// ===================== BARANGAY PROFILE =====================

// GET /api/barangay-profile
app.get('/api/barangay-profile', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, barangay_name, municipality, province, place_issued FROM barangay_profile LIMIT 1'
    );

    if (rows.length === 0) {
      // No record yet – send some defaults (optional)
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching barangay profile:', err);
    res.status(500).json({ message: 'Error fetching barangay profile' });
  }
});

// PUT /api/barangay-profile (protected, upsert)
app.put('/api/barangay-profile', verifyToken, async (req, res) => {
  try {
    const { barangay_name, municipality, province, place_issued } = req.body;

    if (!barangay_name || !municipality || !province) {
      return res.status(400).json({
        message: 'barangay_name, municipality, and province are required.',
      });
    }

    const existing = await query(
      'SELECT id FROM barangay_profile LIMIT 1'
    );

    if (existing.length > 0) {
      const id = existing[0].id;
      await query(
        `UPDATE barangay_profile
         SET barangay_name = ?, municipality = ?, province = ?, place_issued = ?
         WHERE id = ?`,
        [barangay_name, municipality, province, place_issued || null, id]
      );
    } else {
      await query(
        `INSERT INTO barangay_profile
         (barangay_name, municipality, province, place_issued)
         VALUES (?, ?, ?, ?)`,
        [barangay_name, municipality, province, place_issued || null]
      );
    }

    const rows = await query(
      'SELECT id, barangay_name, municipality, province, place_issued FROM barangay_profile LIMIT 1'
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error saving barangay profile:', err);
    res.status(500).json({ message: 'Error saving barangay profile' });
  }
});


// ===================== OFFICIALS =====================

// GET /api/officials
app.get('/api/officials', async (req, res) => {
  try {
    const officials = await query(
      `SELECT id, full_name, position, order_no,
              is_captain, is_secretary, signature_path,
              profile_img
       FROM officials
       ORDER BY order_no, position, full_name`
    );
    res.json(officials);
  } catch (err) {
    console.error('Error fetching officials:', err);
    res.status(500).json({ message: 'Error fetching officials' });
  }
});


// POST /api/officials (protected, with signature upload)
app.post(
  '/api/officials',
  verifyToken,
  upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'profile_img', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { full_name, position, order_no, is_captain, is_secretary } = req.body;

      const signature_path = req.files?.signature
        ? `/uploads/signatures/${req.files.signature[0].filename}`
        : null;

      const profile_img = req.files?.profile_img
        ? `/uploads/profile_pictures/${req.files.profile_img[0].filename}`
        : null;

      const result = await query(
        `INSERT INTO officials
         (full_name, position, order_no, is_captain, is_secretary, signature_path, profile_img)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          full_name,
          position,
          order_no || 0,
          is_captain === '1' ? 1 : 0,
          is_secretary === '1' ? 1 : 0,
          signature_path,
          profile_img
        ]
      );

      const created = await query('SELECT * FROM officials WHERE id = ?', [result.insertId]);
      res.status(201).json(created[0]);
    } catch (err) {
      console.error('Error creating official:', err);
      res.status(500).json({ message: 'Error creating official' });
    }
  }
);



// PUT /api/officials/:id (protected, optional new signature/profile)
app.put(
  '/api/officials/:id',
  verifyToken,
  upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'profile_img', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, position, order_no, is_captain, is_secretary } = req.body;

      const signature_path = req.files?.signature
        ? `/uploads/signatures/${req.files.signature[0].filename}`
        : null;

      const profile_img = req.files?.profile_img
        ? `/uploads/profile_pictures/${req.files.profile_img[0].filename}`
        : null;

      let updateSQL = `UPDATE officials SET full_name=?, position=?, order_no=?, is_captain=?, is_secretary=?`;
      const params = [full_name, position, order_no || 0, is_captain === '1' ? 1 : 0, is_secretary === '1' ? 1 : 0];

      if (signature_path) {
        updateSQL += `, signature_path=?`;
        params.push(signature_path);
      }

      if (profile_img) {
        updateSQL += `, profile_img=?`;
        params.push(profile_img);
      }

      updateSQL += ` WHERE id=?`;
      params.push(id);

      await query(updateSQL, params);
      const updated = await query('SELECT * FROM officials WHERE id = ?', [id]);
      res.json(updated[0]);
    } catch (err) {
      console.error('Error updating official:', err);
      res.status(500).json({ message: 'Error updating official' });
    }
  }
);


// DELETE /api/officials/:id (protected)
app.delete('/api/officials/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM officials WHERE id = ?', [id]);
    res.json({ message: 'Official deleted successfully' });
  } catch (err) {
    console.error('Error deleting official:', err);
    res.status(500).json({ message: 'Error deleting official' });
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
