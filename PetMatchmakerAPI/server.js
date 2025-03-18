const express = require("express");
const cors = require("cors");
const { db, knexDB } = require("./db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { format } = require("mysql2");
const app = express();
const port = 3000;
const petfinderAPI = require("./PetfinderAPI");

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

app.get("/api/user/profile-status/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT profile_completed FROM users WHERE id = ?",
    [userId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ message: "Server error" });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Ensure consistency between query result and response
      res.setHeader("Content-Type", "application/json");
      res.json({ profile_complete: rows[0].profile_completed }); // Changed to match the query field name
    }
  );
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
app.post("/api/save-progress", async (req, res) => {
  const { user_id, answers, free_responses } = req.body;

  try {
    await knexDB.transaction(async (trx) => {
      // Handle answers (insert or update only if different)
      for (const answer of answers) {
        const existingAnswer = await trx("responses")
          .where({ user_id, question_id: answer.question_id })
          .first();

        if (existingAnswer) {
          // Check if the new answer is different from the existing one
          if (existingAnswer.answer !== answer.answer) {
            // Only update if the answer has changed
            await trx("responses")
              .where({ user_id, question_id: answer.question_id })
              .update({ answer: answer.answer });
          }
        } else {
          // Otherwise, insert the new answer
          await trx("responses").insert({
            user_id,
            question_id: answer.question_id,
            answer: answer.answer,
          });
        }
      }

      // Handle free responses (insert or update only if different)
      for (const response of free_responses) {
        const existingResponse = await trx("freeresponses")
          .where({ user_id, question_id: response.question_id })
          .first();

        if (existingResponse) {
          // Check if the new response is different from the existing one
          if (existingResponse.response !== response.response) {
            // Only update if the response has changed
            await trx("freeresponses")
              .where({ user_id, question_id: response.question_id })
              .update({ response: response.response });
          }
        } else {
          // Otherwise, insert the new free response
          await trx("freeresponses").insert({
            user_id,
            question_id: response.question_id,
            response: response.response,
          });
        }
      }

      await trx.commit();
      res.status(200).json({ message: "Progress saved successfully!" });
    });
  } catch (error) {
    console.error("Error saving progress:", error);
    res.status(500).json({ message: "Error saving progress." });
  }
});

//Submit Questionnaire
app.post("/api/submit-questionnaire", (req, res) => {
  const { user_id, answers, free_responses } = req.body;

  knexDB.transaction(async (trx) => {
    try {
      await Promise.all(
        answers.map(async (answer) => {
          const existingAnswer = await trx("responses")
            .where({ user_id, question_id: answer.question_id })
            .first();

          if (existingAnswer) {
            // Only update if the new answer is different
            if (existingAnswer.answer !== answer.answer) {
              await trx("responses")
                .where({ user_id, question_id: answer.question_id })
                .update({ answer: answer.answer });
            }
          } else {
            // Insert if the answer doesn't already exist
            await trx("responses").insert({
              user_id,
              question_id: answer.question_id,
              answer: answer.answer,
            });
          }
        })
      );

      // Handling free responses similarly
      await Promise.all(
        free_responses.map(async (response) => {
          const existingResponse = await trx("freeresponses")
            .where({ user_id, question_id: response.question_id })
            .first();

          if (existingResponse) {
            // Only update if the new response is different
            if (existingResponse.response !== response.response) {
              await trx("freeresponses")
                .where({ user_id, question_id: response.question_id })
                .update({ response: response.response });
            }
          } else {
            // Insert if the response doesn't already exist
            await trx("freeresponses").insert({
              user_id,
              question_id: response.question_id,
              response: response.response,
            });
          }
        })
      );

      await trx("users")
        .where({ id: user_id })
        .update({ profile_completed: 1 });

      await trx.commit();
      res
        .status(200)
        .json({ message: "Questionnaire submitted successfully!" });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ message: "Error submitting questionnaire." });
    }
  });
});

app.get("/api/questionnaire/progress/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT question_id, answer FROM responses WHERE user_id = ? ORDER BY id DESC`,
    [userId],
    (error, responseResults) => {
      if (error) {
        return res.status(500).json({ error: "Failed to fetch responses" });
      }

      db.query(
        `SELECT question_id, response FROM freeresponses WHERE user_id = ?`,
        [userId],
        (error, freeResponseResults) => {
          if (error) {
            return res
              .status(500)
              .json({ error: "Failed to fetch free responses" });
          }

          const combinedResponses = [...responseResults];

          freeResponseResults.forEach((freeResponse) => {
            combinedResponses.push({
              question_id: freeResponse.question_id,
              response: freeResponse.response,
            });
          });

          combinedResponses.sort((a, b) => a.question_id - b.question_id);

          const lastQuestionId = Math.max(
            ...combinedResponses.map((response) => response.question_id)
          );

          res.json({
            lastQuestionId: lastQuestionId,
            responses: combinedResponses,
          });
        }
      );
    }
  );
});

app.get("/api/pets", async (req, res) => {
  try {
    const page = req.query.page || 1; // Default to page 1 if not provided
    const data = await petfinderAPI.getAvailablePets(page);

    res.json({
      animals: data.animals,
      pagination: {
        current_page: data.pagination.current_page,
        total_pages: data.pagination.total_pages,
        next_page:
          data.pagination.current_page < data.pagination.total_pages
            ? `/api/pets?page=${data.pagination.current_page + 1}`
            : null,
        prev_page:
          data.pagination.current_page > 1
            ? `/api/pets?page=${data.pagination.current_page - 1}`
            : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pets" });
  }
});

// Endpoint to search for pets by name
app.get("/api/searchPets", async (req, res) => {
  try {
    const { name, page = 1 } = req.query;
    const response = await petfinderAPI.getSearchedPets(name, page);
    res.json(response);
  } catch (error) {
    console.error("Error searching for pets:", error);
    res.status(500).json({ error: "Failed to search for pets" });
  }
});

// Endpoint to get breeds for a specific animal type
app.get("/api/breeds/:type", async (req, res) => {
  try {
    const animalType = req.params.type; // Get animal type (dog, cat, etc.)
    const breeds = await petfinderAPI.getBreedsByType(animalType); // Call the function that fetches breeds from Petfinder

    res.json({ breeds }); // Send the breeds back to the frontend
  } catch (error) {
    console.error("Error fetching breeds:", error);
    res.status(500).json({ error: "Failed to fetch breeds" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
