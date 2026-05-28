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

export default function Home() {

  const [universities, setUniversities] = useState<University[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<University[]>([]);
  const [country, setCountry] = useState("Australia");
  const [ranking, setRanking] = useState("");
  const [fee, setFee] = useState("");
  const [ielts, setIelts] = useState("");

  // LOAD DATA
  useEffect(() => { fetchData(); }, []);

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

      const [uniRes, progRes] =
        await Promise.all([

          fetch(
            `${API}/filter?country=${country}&ranking=${ranking}`
          ),

          fetch(
            `${API}/programs/filter?fee=${fee}&ielts=${ielts}`
          ),
        ]);

      const filteredUnis = await uniRes.json();
      const filteredPrograms = await progRes.json();
      setPrograms(filteredPrograms);
      const programUniIds =
        filteredPrograms.map(
          (p: Program) => p.university_id
        );

      const finalUnis =
        filteredUnis.filter(
          (u: University) =>
            programUniIds.includes(u.id)
        );

      setUniversities(finalUnis);

    } catch (error) {
      console.error(error);
    }
  };

  // RESET
  const handleReset = () => {

    setCountry("Australia");
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

  return (
    <div className="container">

      {/* TITLE */}
      <h1>
        Comparative Analytics Dashboard
      </h1>

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
          onChange={(e) =>
            setCountry(e.target.value)
          }
        >
          <option value="Australia">
            Australia
          </option>

          <option value="Canada">
            Canada
          </option>

          <option value="USA">
            USA
          </option>

          <option value="UK">
            UK
          </option>
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