const express = require("express");
const cors = require("cors");
const db = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Test database connection
app.get("/api/test-db", (req, res) => {
  db.query("SELECT 1", (err, results) => {
    if (err) {
      console.error("Database connection failed:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }
    res.json({ message: "Database connection successful" });
  });
});

// Helper function to hash the password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Helper function to check if username/email exists
const checkIfExists = (username, email) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email],
      (err, result) => {
        if (err) reject("Database error");
        resolve(result.length > 0);
      }
    );
  });
};

// Sign up route (auto-login)
app.post("/api/signup", async (req, res) => {
  const { first_name, last_name, email, username, password } = req.body;

  // Hash the password before saving to the database
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into the database
  const query = `
    INSERT INTO users (first_name, last_name, email, username, password, role_id, profile_completed, access_level)
    VALUES (?, ?, ?, ?, ?, 2, 0, 'standard')`;
  db.query(
    query,
    [first_name, last_name, email, username, hashedPassword],
    (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        return res.status(500).json({ message: "Error signing up" });
      }

      // Fetch the newly created user details (including the id for JWT)
      const userId = result.insertId;
      const token = jwt.sign({ userId }, "your_jwt_secret", {
        expiresIn: "1h",
      });

      // Send back the token and user role
      res.json({ token, role: 2 }); // role 2 (adopter by default)
    }
  );
});

// User login route (for general site access)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (result.length === 0)
        return res.status(400).json({ message: "User not found" });

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(400).json({ message: "Invalid credentials" });

      // Check if the user is an admin (example role_id check)
      const isAdmin = user.role_id === 1;

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role_id, isAdmin },
        "your_jwt_secret",
        {
          expiresIn: "1h",
        }
      );

      res.json({ token, isAdmin, role: user.role_id });
    }
  );
});

// Admin Login route
app.post("/api/login/admin", (req, res) => {
  const { username, password } = req.body;

  // Query the database to find the admin user
  db.query(
    "SELECT * FROM users WHERE username = ? AND role_id = 1",
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0)
        return res
          .status(401)
          .json({ message: "Invalid credentials or not an admin" });

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ message: "Login Error" });

        if (!isMatch)
          return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
          { username: user.username, role_id: user.role_id },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );

        res.json({ token, role_id: user.role_id });
      });
    }
  );
});

// Logout route
app.post("/api/logout", (req, res) => {
  // Token-based authentication is stateless
  res.json({ message: "Logged out successfully" });
});

// Profile page
app.get("/api/profile", (req, res) => {
  const userId = req.user.userId;
  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Error fetching user profile" });
    res.json(result[0]);
  });
});

// Example of a protected route (Home page or other pages)
app.get("/", (req, res) => {
  res.send("Welcome to the Pet Matchmaker Application!");
});

// Get all users
app.get("/api/users", (req, res) => {
  const query = "SELECT * FROM users";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// Get all questions
app.get("/api/questions", (req, res) => {
  const query = "SELECT question FROM questions";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
