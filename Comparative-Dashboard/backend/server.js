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

  if (country) {
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

  if (fee) {
    query += " AND tuition_fee <= ?";
    values.push(fee);
  }

  if (ielts) {
    query += " AND ielts_requirement <= ?";
    values.push(ielts);
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(result);
  });
});

// START SERVER
const PORT = 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});