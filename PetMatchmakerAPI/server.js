const express = require("express");
const cors = require("cors");
const { db, knexDB } = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { format } = require("mysql2");
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

      // Return profile_completed status along with other details
      res.json({
        token,
        isAdmin,
        role: user.role_id,
        profile_completed: user.profile_completed, // Send profile completion status
      });
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
  const query = `
    SELECT q.id AS question_id, q.section_id, q.question, q.format, q.answer_type, 
           c.id AS choice_id, c.choice, c.next_question_id
    FROM questions q
    LEFT JOIN choices c ON q.id = c.question_id
    ORDER BY q.id, c.id`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }

    // Organize the data into a structured JSON format
    const questionsMap = new Map();

    results.forEach((row) => {
      if (!questionsMap.has(row.question_id)) {
        questionsMap.set(row.question_id, {
          id: row.question_id,
          section_id: row.section_id,
          question: row.question,
          format: row.format,
          answer_type: row.answer_type,
          choices: [],
        });
      }
      if (row.choice) {
        questionsMap.get(row.question_id).choices.push({
          id: row.choice_id,
          choice: row.choice,
          next_question_id: row.next_question_id,
        });
      }
    });

    res.json(Array.from(questionsMap.values()));
  });
});

//Save Questionnaire progress
app.post("/api/save-progress", (req, res) => {
  const { user_id, question_id, answer } = req.body;

  knexDB.transaction(async (trx) => {
    try {
      // If the answer is a string with multiple choices (like "Dog, Apartment"),
      // split it into separate items
      const answers = answer.split(",").map((a) => a.trim()); // Split by comma and remove extra spaces

      // Insert or update each answer as a separate record
      await Promise.all(
        answers.map(async (answerItem) => {
          // Check if an answer already exists for the user and question
          const existingAnswer = await trx("responses")
            .where({ user_id, question_id, answer: answerItem })
            .first();

          if (existingAnswer) {
            // If it exists, update the answer
            await trx("responses")
              .where({ user_id, question_id, answer: answerItem })
              .update({
                answer: answerItem,
              });
          } else {
            // If it doesn't exist, insert a new answer
            await trx("responses").insert({
              user_id,
              question_id,
              answer: answerItem,
            });
          }
        })
      );

      // Commit the transaction
      await trx.commit();
      res.status(200).json({ message: "Progress saved successfully!" });
    } catch (error) {
      await trx.rollback();
      console.error("Transaction error:", error);
      res.status(500).json({ message: "Error saving progress." });
    }
  });
});

//Submit Questionnaire
app.post("/api/submit-questionnaire", (req, res) => {
  const { user_id, answers, free_responses } = req.body;

  knexDB.transaction(async (trx) => {
    try {
      // Insert or update answers
      await Promise.all(
        answers.map(async (answer) => {
          // Check if the answer already exists for this user and question
          const existingAnswer = await trx("responses")
            .where({ user_id, question_id: answer.question_id })
            .first();

          if (existingAnswer) {
            // If it exists, update the answer
            await trx("responses")
              .where({ user_id, question_id: answer.question_id })
              .update({
                answer: answer.answer,
              });
          } else {
            // If it doesn't exist, insert a new answer
            await trx("responses").insert({
              user_id,
              question_id: answer.question_id,
              answer: answer.answer,
            });
          }
        })
      );

      // Insert or update free responses
      await Promise.all(
        free_responses.map(async (response) => {
          // Check if the free response already exists for this user and question
          const existingResponse = await trx("freeresponses")
            .where({ user_id, question_id: response.question_id })
            .first();

          if (existingResponse) {
            // If it exists, update the response
            await trx("freeresponses")
              .where({ user_id, question_id: response.question_id })
              .update({
                response: response.response,
              });
          } else {
            // If it doesn't exist, insert a new free response
            await trx("freeresponses").insert({
              user_id,
              question_id: response.question_id,
              response: response.response,
            });
          }
        })
      );

      // Update `profile_completed` column to 1 (true) if necessary
      await trx("users")
        .where({ id: user_id })
        .update({ profile_completed: 1 });

      // Commit the transaction
      await trx.commit();
      res
        .status(200)
        .json({ message: "Questionnaire submitted successfully!" });
    } catch (error) {
      await trx.rollback();
      console.error("Transaction error:", error);
      res.status(500).json({ message: "Error submitting questionnaire." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
