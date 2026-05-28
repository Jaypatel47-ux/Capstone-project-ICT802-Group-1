"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, LineElement, PointElement, } from "chart.js";
import { Bar, Doughnut, Line, } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const API = "http://localhost:5000";

type University = {
  id: number;
  name: string;
  country: string;
  ranking: number;
  location: string;
};

type Program = {
  id: number;
  university_id: number;
  course_name: string;
  tuition_fee: number;
  ielts_requirement: number;
  duration: string;
};

type RecommendedUni = University & {
  course_name: string;
  tuition_fee: number;
  ielts_requirement: number;
  duration: string;
};

type Review = {
  id: number;
  university_name: string;
  student_name: string;
  review_text: string;
};

export default function Home() {

  const [universities, setUniversities] = useState<University[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<University[]>([]);
  const [country, setCountry] = useState("All");
  const [ranking, setRanking] = useState("");
  const [fee, setFee] = useState("");
  const [ielts, setIelts] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "", country: "", ielts: "", budget: "" });

  const [recommendedUnis, setRecommendedUnis] = useState<RecommendedUni[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewInput, setReviewInput] = useState({ universityName: "", reviewText: "" });

  // LOAD DATA
  useEffect(() => {
    fetchData();
    fetchReviews();
  }, []);

  const fetchData = async () => {

    try {

      const uniRes = await fetch(`${API}/universities`);
      const uniData = await uniRes.json();
      setUniversities(uniData);
      const progRes = await fetch(`${API}/programs`);
      const progData = await progRes.json();
      setPrograms(progData);

    } catch (error) {
      console.error(error);
    }
  };

  // Get Program
  const getProgram = (uniId: number) => { return programs.find((p) => p.university_id === uniId); };
  const applyAllFilters = async () => {
    try {
      const uniParams = new URLSearchParams();

      if (country && country !== "All") {
        uniParams.append("country", country);
      }

      if (ranking) {
        uniParams.append("ranking", ranking);
      }

      const progParams = new URLSearchParams();

      if (fee) {
        progParams.append("fee", fee);
      }

      if (ielts) {
        progParams.append("ielts", ielts);
      }

      const [uniRes, progRes] = await Promise.all([
        fetch(`${API}/filter?${uniParams.toString()}`),
        fetch(`${API}/programs/filter?${progParams.toString()}`),
      ]);

      const filteredUnis = await uniRes.json();
      const filteredPrograms = await progRes.json();

      setPrograms(filteredPrograms);

      const programUniIds = filteredPrograms.map(
        (p: Program) => p.university_id
      );

      const finalUnis = filteredUnis.filter(
        (u: University) => programUniIds.includes(u.id)
      );

      setUniversities(finalUnis);
      setSelected([]);
    } catch (error) {
      console.error(error);
    }
  };

  // RESET
  const handleReset = () => {
    setCountry("All");
    setRanking("");
    setFee("");
    setIelts("");
    setSelected([]);
    fetchData();
  };

  // SELECT UNIVERSITY
  const handleSelect = (uni: University) => {

    if (selected.find((u) => u.id === uni.id)) {
      setSelected(selected.filter((u) => u.id !== uni.id));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, uni,]);
      } else {
        alert("Maximum 3 universities can be selected");
      }
    }
  };

  // Get Top Universities
  const topUniversities = [...universities,]
    .sort((a, b) => a.ranking - b.ranking)
    .slice(0, 4);

  // Calculate Average Fees
  const filteredPrograms = programs.filter((p) => universities.some((u) => u.id === p.university_id));

  const avgFee =
    filteredPrograms.length > 0
      ? Math.round(
        filteredPrograms.reduce(
          (acc, curr) =>
            acc + curr.tuition_fee,
          0
        ) / filteredPrograms.length
      )
      : "N/A";

  // BAR CHART
  const chartData = {
    labels: selected.map((u) => u.name),

    datasets: [
      {
        label: "Ranking",
        data: selected.map((u) => u.ranking),
        backgroundColor: "#2563eb",
        borderRadius: 10,
        yAxisID: "y",
      },

      {
        label: "Tuition Fee",
        data: selected.map((u) => {
          const p = getProgram(u.id);
          return p?.tuition_fee || 0;
        }),

        backgroundColor: "#8eed3a",
        borderRadius: 10,
        yAxisID: "y1",
      },
    ],
  };

  // IELTS CHART
  const ieltsChartData = {
    labels: selected.map((u) => u.name),

    datasets: [
      {
        data: selected.map((u) => {
          const p = getProgram(u.id);

          return (
            p?.ielts_requirement || 0
          );
        }),

        backgroundColor: ["#2563eb", "#7c3aed", "#ec4899",],
      },
    ],
  };

  // LINE CHART
  const lineChartData = {
    labels: selected.map((u) => u.name),

    datasets: [
      {
        label: "Tuition Fee Trend",

        data: selected.map((u) => {
          const p = getProgram(u.id);
          return p?.tuition_fee || 0;
        }),

        borderColor: "#7c3aed",
        backgroundColor: "#cbf14c",
        tension: 0.5,
      },
    ],
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API}/api/reviews`);
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();

      if (data.success) {
        setIsLoggedIn(true);
        setLoggedInUser(data.user);
        setShowForm(false);
        fetchRecommendations(data.user.country, data.user.ielts, data.user.budget);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      if (res.ok) {
        alert("Registration successfully! Please Login");
        setAuthMode("login");
      } else {
        const txt = await res.text();
        alert(txt);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRecommendations = async (country: string, ielts: any, budget: any) => {
    try {
      const res = await fetch(`${API}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, ielts: parseFloat(ielts), budget: parseInt(budget) })
      });
      const data = await res.json();
      setRecommendedUnis(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewInput.universityName || !reviewInput.reviewText) return;
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: reviewInput.universityName,
          userName: loggedInUser?.name || "Student",
          reviewText: reviewInput.reviewText
        })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setReviewInput({ universityName: "", reviewText: "" });
        alert("Review posted successfully!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">

      {/* TITLE */}
      <h1>
        Comparative Analytics Dashboard
      </h1>

      <div className="register-box">
        <h2>Student Profile Insights</h2>
        <p>Register to get personalised university recommendations.</p>
        {!isLoggedIn ? (
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Hide Form" : "Launch Your Insight Portal"}
          </button>
        ) : (
          <div className="success-message">
            Welcome <strong>{loggedInUser?.name}</strong>. Personalized insights unlocked below
            <button onClick={() => { setIsLoggedIn(false); setLoggedInUser(null); setRecommendedUnis([]); }} style={{ marginLeft: '15px', background: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>Logout</button>
          </div>
        )}
      </div>

      {showForm && !isLoggedIn && (
        <div className="registration-section">
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button type="button" onClick={() => setAuthMode("login")} style={{ background: authMode === "login" ? "#2563eb" : "#94a3b8" }}>Login</button>
            <button type="button" onClick={() => setAuthMode("register")} style={{ background: authMode === "register" ? "#2563eb" : "#94a3b8" }}>Register</button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="registration-form" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
              <input type="email" placeholder="Email" required value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
              <input type="password" placeholder="Password" required value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
              <button type="submit" style={{ background: "#16a34a" }}>Sign In</button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="registration-form">
              <input type="text" placeholder="Name" required value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} />
              <input type="email" placeholder="Email" required value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
              <input type="password" placeholder="Password" required value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
              <select
                value={registerData.country}
                onChange={(e) =>
                  setRegisterData({ ...registerData, country: e.target.value })
                }
                required
              >
                <option value="">Select Country</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
              </select>
              <input type="number" step="0.1" placeholder="IELTS Score" required value={registerData.ielts} onChange={(e) => setRegisterData({ ...registerData, ielts: e.target.value })} />
              <input type="number" placeholder="Budget ($)" required value={registerData.budget} onChange={(e) => setRegisterData({ ...registerData, budget: e.target.value })} />
              <button type="submit" style={{ background: "#2563eb" }}>Submit & Register</button>
            </form>
          )}
        </div>
      )}

      {isLoggedIn && (
        <div className="insights-section" style={{ marginTop: "30px" }}>
          <h2>Personalized Recommended Universities</h2>
          {recommendedUnis.length > 0 ? (
            <div className="card-grid" style={{ marginBottom: "30px" }}>
              {recommendedUnis.map((u) => (
                <div key={u.id} className="card insight-card">
                  <h2>{u.name}</h2>
                  <div className="info"><span>Course</span><p>{u.course_name}</p></div>
                  <div className="info"><span>Tuition Fee</span><p>${u.tuition_fee}</p></div>
                  <div className="info"><span>IELTS Match</span><p>{u.ielts_requirement} (Required)</p></div>
                  <div className="info"><span>Location</span><p>{u.location}, {u.country}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results" style={{ background: "#fff", borderRadius: "18px", marginBottom: "20px" }}>No universities match your custom profile parameters.</div>
          )}

          <div className="registration-section">
            <h2>Enter Review for Recommended University</h2>
            <form onSubmit={handleReviewSubmit} className="registration-form" style={{ gridTemplateColumns: "1fr 2fr auto" }}>
              <select value={reviewInput.universityName} onChange={(e) => setReviewInput({ ...reviewInput, universityName: e.target.value })} required>
                <option value="">Choose University</option>
                {recommendedUnis.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
              <input type="text" placeholder="Write your review here..." required value={reviewInput.reviewText} onChange={(e) => setReviewInput({ ...reviewInput, reviewText: e.target.value })} />
              <button type="submit" style={{ background: "#7c3aed" }}>Post Review</button>
            </form>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="insights-section" style={{ marginTop: "30px" }}>
          <h2> Student Reviews</h2>
          <div className="card-grid">
            {reviews.map((r) => (
              <div key={r.id} className="card" style={{ borderLeft: "6px solid #7c3aed", background: "#ffffff" }}>
                <h3 style={{ color: "#2563eb", fontSize: "18px" }}>{r.university_name}</h3>
                <p style={{ margin: "10px 0", color: "#4b5563", fontStyle: "italic" }}>"{r.review_text}"</p>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#111827" }}>— By {r.student_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card blue">
          <h3>Total Universities</h3>

          <p>{universities.length}</p>
        </div>

        <div className="stat-card purple">
          <h3>Top Ranked</h3>

          <p>
            {topUniversities[0]?.name ||
              "N/A"}
          </p>
        </div>

        <div className="stat-card pink">
          <h3>Average Tuition Fee</h3>

          <p>${avgFee}</p>
        </div>

      </div>

      {/* FILTERS */}
      <div className="filters">

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Australia">Australia</option>
          <option value="Canada">Canada</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
        </select>

        <input
          placeholder="Max Ranking"
          type="number"
          value={ranking}
          onChange={(e) =>
            setRanking(e.target.value)
          }
        />

        <input
          placeholder="Max Fee"
          type="number"
          value={fee}
          onChange={(e) =>
            setFee(e.target.value)
          }
        />

        <input
          placeholder="Max IELTS"
          type="number"
          value={ielts}
          onChange={(e) =>
            setIelts(e.target.value)
          }
        />

        <button
          onClick={applyAllFilters}
        >
          Apply Filters
        </button>

        <button onClick={handleReset}>
          Reset
        </button>

      </div>

      {/* INFO */}
      <div className="compare-info">

        <h3>
          University Comparison
        </h3>

        <p>
          Select up to 3 universities
          using the checkbox to compare
          rankings, tuition fees,
          IELTS requirements,
          and analytics charts.
        </p>

      </div>

      {/* UNIVERSITY CARDS */}
      <div className="card-grid">

        {universities.length > 0 ? (

          universities.map((u) => {

            const program = getProgram(u.id);

            return (
              <div
                key={u.id}
                className={`card ${selected.some(
                  (item) => item.id === u.id
                )
                  ? "selected-card"
                  : ""
                  }`}
              >

                <div className="card-top">
                  <input
                    type="checkbox"
                    checked={
                      selected.some(
                        (item) => item.id === u.id
                      )
                    }
                    onChange={() =>
                      handleSelect(u)
                    }
                  />
                </div>

                <h2>{u.name}</h2>

                <div className="info">
                  <span>Country</span>
                  <p>{u.country}</p>
                </div>

                <div className="info">
                  <span>Ranking</span>
                  <p>{u.ranking}</p>
                </div>

                <div className="info">
                  <span>Location</span>
                  <p>{u.location}</p>
                </div>

                <div className="info">
                  <span>Course</span>
                  <p>
                    {program?.course_name || "N/A"}
                  </p>
                </div>

                <div className="info">
                  <span>Tuition Fee</span>
                  <p>
                    ${program?.tuition_fee || "N/A"}
                  </p>
                </div>

                <div className="info">
                  <span>IELTS</span>
                  <p>
                    {program?.ielts_requirement || "N/A"}
                  </p>
                </div>

                <div className="info">
                  <span>Duration</span>
                  <p>
                    {program?.duration || "N/A"}
                  </p>
                </div>

              </div>
            );
          })

        ) : (

          <div className="no-results">
            No universities match your current filters.
          </div>

        )}

      </div>

      {/* TOP RATED */}
      <div className="top-rated">

        <div className="section-header">

          <h2>
            Top Rated Universities
          </h2>

          <p>
            Best ranked universities
            based on QS ranking
          </p>

        </div>

        <div className="top-list">

          {topUniversities.map(
            (u, index) => (

              <div
                key={u.id}
                className="top-card"
              >

                <div className="top-rank">
                  {index + 1}
                </div>

                <div className="top-details">

                  <h3>{u.name}</h3>

                  <p>{u.country}</p>

                  <div className="top-footer">

                    <span>
                      QS Ranking
                    </span>

                    <strong>
                      {u.ranking}
                    </strong>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      </div>

      {/* CHARTS */}
      {selected.length > 0 && (

        <div className="chart-section">

          {/* BAR CHART */}
          <div className="chart">

            <h2>
              Ranking & Tuition Fee
            </h2>

            <Bar
              data={chartData}

              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },

                scales: {

                  y: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "University Ranking", },
                    ticks: { stepSize: 5, },
                  },

                  y1: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    title: {
                      display: true, text: "Tuition Fee ($)",
                    },

                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />

          </div>

          {/* IELTS */}
          <div className="chart">

            <h2>
              IELTS Requirement
            </h2>

            <Doughnut
              data={ieltsChartData}

              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />

          </div>

          {/* LINE */}
          <div className="chart">

            <h2>
              Tuition Fee Trend
            </h2>

            <Line
              data={lineChartData}

              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />

          </div>

        </div>
      )}

    </div>
  );
}