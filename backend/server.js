const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running...");
});


// GET ALL UNIVERSITIES
app.get("/universities", (req, res) => {
  const query = "SELECT * FROM universities";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(result);
  });
});


// FILTER UNIVERSITIES
app.get("/filter", (req, res) => {
  const { country, ranking } = req.query;

  let query = "SELECT * FROM universities WHERE 1=1";
  let values = [];

  if (country && country !== "All") {
    query += " AND country = ?";
    values.push(country);
  }

  if (ranking) {
    query += " AND ranking <= ?";
    values.push(ranking);
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(result);
  });
});

// GET ALL PROGRAMS
app.get("/programs", (req, res) => {
  const query = "SELECT * FROM programs";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(result);
  });
});

// FILTER PROGRAMS
app.get("/programs/filter", (req, res) => {
  const { fee, ielts } = req.query;

  let query = "SELECT * FROM programs WHERE 1=1";
  let values = [];

  if (fee && fee !== "") {
    query += " AND tuition_fee <= ?";
    values.push(Number(fee));
  }

  if (ielts && ielts !== "") {
    query += " AND ielts_requirement <= ?";
    values.push(Number(ielts));
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(result);
  });
});

// STUDENT REGISTRATION
app.post("/api/register", (req, res) => {
  const { name, email, password, country, ielts, budget } = req.body;

  const query = `
    INSERT INTO students 
    (name, email, password, country, ielts, budget) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [name, email, password, country, ielts, budget];

  db.query(query, values, (err, result) => {
    if (err) {
      console.log(err);

      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .send("Email already exists. Please use another email.");
      }

      return res.status(500).send("Database error");
    }

    res.json({
      success: true,
      message: "Registration successful"
    });
  });
});

// STUDENT LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const query =
    "SELECT * FROM students WHERE email = ? AND password = ?";

  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    if (result.length > 0) {
      res.json({
        success: true,
        user: result[0]
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
  });
});

// GET RECOMMENDATIONS
app.post("/api/recommendations", (req, res) => {
  const { country, ielts, budget } = req.body;

  const query = `
    SELECT 
      u.*, 
      p.course_name, 
      p.tuition_fee, 
      p.ielts_requirement, 
      p.duration
    FROM universities u
    JOIN programs p 
      ON u.id = p.university_id
    WHERE 
      u.country = ?
      AND p.ielts_requirement <= ?
      AND p.tuition_fee <= ?
  `;

  db.query(query, [country, ielts, budget], (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .send("Error fetching recommendations");
    }

    res.json(result);
  });
});

// GET ALL REVIEWS

app.get("/api/reviews", (req, res) => {
  const query =
    "SELECT * FROM reviews ORDER BY created_at DESC";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .send("Error fetching reviews");
    }

    res.json(result);
  });
});


// POST A NEW REVIEW

app.post("/api/reviews", (req, res) => {
  const { universityName, userName, reviewText } = req.body;

  const query = `
    INSERT INTO reviews
    (university_name, student_name, review_text)
    VALUES (?, ?, ?)
  `;

  db.query(
    query,
    [universityName, userName, reviewText],
    (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send("Error saving review");
      }

      // Return updated reviews list after saving
      db.query(
        "SELECT * FROM reviews ORDER BY created_at DESC",
        (err2, finalResult) => {
          if (err2) {
            return res.status(500).send("Error");
          }

          res.json({
            success: true,
            reviews: finalResult
          });
        }
      );
    }
  );
});

// START SERVER
const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});