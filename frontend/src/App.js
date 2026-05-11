import React, {
  useState,
  useCallback
} from "react";

import axios from "axios";


// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

function getRiskColor(level) {

  return (
    {
      CRITICAL: "#ff2b2b",
      HIGH: "#ff7b00",
      MEDIUM: "#f0c000",
      LOW: "#00d68f",
    }[level] || "#888"
  );
}

function getRiskBg(level, darkMode) {

  if (darkMode) {

    return (
      {
        CRITICAL: "rgba(255,43,43,0.13)",
        HIGH: "rgba(255,123,0,0.13)",
        MEDIUM: "rgba(240,192,0,0.10)",
        LOW: "rgba(0,214,143,0.10)",
      }[level] || "rgba(255,255,255,0.05)"
    );

  }

  return (
    {
      CRITICAL: "#ffe5e5",
      HIGH: "#fff0e0",
      MEDIUM: "#fff9d9",
      LOW: "#e7fff5",
    }[level] || "#f5f5f5"
  );
}


// ─────────────────────────────────────────────
// CSV Export
// ─────────────────────────────────────────────

function exportCSV(transactions) {

  const headers = [
    "txn_id",
    "payer_id",
    "payee_id",
    "amount",
    "timestamp",
    "location",
    "device_id",
    "risk_score",
    "risk_level",
    "reasons",
  ];

  const rows = transactions.map((t) =>
    [
      t.txn_id,
      t.payer_id,
      t.payee_id,
      t.amount,
      t.timestamp,
      t.location,
      t.device_id,
      t.score,
      t.riskLevel,
      `"${t.reasons.join("; ")}"`,
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "flagged_transactions.csv";

  a.click();

  URL.revokeObjectURL(url);
}


// ─────────────────────────────────────────────
// Transaction Card
// ─────────────────────────────────────────────

function TxnCard({
  txn,
  darkMode
}) {

  const color = getRiskColor(txn.riskLevel);

  const bg = getRiskBg(
    txn.riskLevel,
    darkMode
  );

  return (

    <div
      style={{
        background: bg,
        border: `1px solid ${color}`,
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}
      >

        <div>

          <div
            style={{
              color: darkMode
                ? "#fff"
                : "#111",
              fontWeight: "bold",
              fontSize: "18px"
            }}
          >
            {txn.payee_id}
          </div>

          <div
            style={{
              color: darkMode
                ? "#ddd"
                : "#333",
              marginTop: "6px"
            }}
          >
            ₹{txn.amount}
          </div>

          <div
            style={{
              color: darkMode
                ? "#888"
                : "#555",
              marginTop: "4px"
            }}
          >
            {txn.location}
          </div>

          <div
            style={{
              color: darkMode
                ? "#666"
                : "#777",
              fontSize: "12px",
              marginTop: "4px"
            }}
          >
            {new Date(
              txn.timestamp
            ).toLocaleString()}
          </div>

        </div>

        <div style={{ textAlign: "right" }}>

          <div
            style={{
              color,
              fontSize: "34px",
              fontWeight: "bold"
            }}
          >
            {txn.score}
          </div>

          <div
            style={{
              color,
              fontWeight: "bold"
            }}
          >
            {txn.riskLevel}
          </div>

        </div>

      </div>

      <div style={{ marginTop: "10px" }}>

        {
          txn.reasons.map((r, i) => (

            <span
              key={i}
              style={{
                display: "inline-block",
                background: color + "22",
                padding: "5px 10px",
                margin: "4px",
                borderRadius: "6px",
                color: darkMode
                  ? "#ddd"
                  : "#222",
                fontSize: "12px"
              }}
            >
              {r}
            </span>

          ))
        }

      </div>

    </div>
  );
}


// ─────────────────────────────────────────────
// User Transaction Group
// ─────────────────────────────────────────────

function UserTransactionGroup({
  payerId,
  transactions,
  darkMode
}) {

  const [open, setOpen] =
    useState(false);

  const highestRisk =
    transactions.reduce((max, t) =>
      t.score > max.score ? t : max
    );

  const color = getRiskColor(
    highestRisk.riskLevel
  );

  return (

    <div
      style={{
        marginBottom: "18px",
        borderRadius: "14px",
        overflow: "hidden",
        border: `1px solid ${color}`
      }}
    >

      {/* Header */}

      <div
        onClick={() => setOpen(!open)}
        style={{
          background: darkMode
            ? "#111827"
            : "#f3f4f6",
          padding: "18px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >

        <div>

          <div
            style={{
              color: darkMode
                ? "#fff"
                : "#111",
              fontWeight: "bold",
              fontSize: "22px"
            }}
          >
            👤 {payerId}
          </div>

          <div
            style={{
              color: darkMode
                ? "#888"
                : "#555",
              marginTop: "4px"
            }}
          >
            Transactions:
            {" "}
            {transactions.length}
          </div>

        </div>

        <div style={{ textAlign: "right" }}>

          <div
            style={{
              color,
              fontWeight: "bold",
              fontSize: "18px"
            }}
          >
            Highest Risk:
            {" "}
            {highestRisk.riskLevel}
          </div>

          <div
            style={{
              color: darkMode
                ? "#666"
                : "#777",
              marginTop: "4px"
            }}
          >
            {open
              ? "▲ Hide Transactions"
              : "▼ Show Transactions"}
          </div>

        </div>

      </div>

      {/* Dropdown */}

      {
        open && (

          <div
            style={{
              background: darkMode
                ? "#030712"
                : "#fff",
              padding: "14px"
            }}
          >

            {
              transactions.map((txn) => (

                <TxnCard
                  key={txn.txn_id}
                  txn={txn}
                  darkMode={darkMode}
                />

              ))
            }

          </div>

        )
      }

    </div>
  );
}


// ─────────────────────────────────────────────
// Stats Bar
// ─────────────────────────────────────────────

function StatsBar({
  all,
  darkMode
}) {

  const total = all.length;

  const flagged = all.filter(
    (t) => t.flagged
  ).length;

  const critical = all.filter(
    (t) =>
      t.riskLevel === "CRITICAL"
  ).length;

  const avgRisk =
    total === 0
      ? 0
      : Math.round(
          all.reduce(
            (s, t) => s + t.score,
            0
          ) / total
        );

  const statBox = {
    background: darkMode
      ? "rgba(255,255,255,0.05)"
      : "#f3f4f6",
    padding: "16px 24px",
    borderRadius: "12px",
    color: darkMode
      ? "#fff"
      : "#111",
    fontSize: "18px"
  };

  return (

    <div
      style={{
        display: "flex",
        gap: "14px",
        marginBottom: "24px",
        flexWrap: "wrap"
      }}
    >

      <div style={statBox}>
        Total: {total}
      </div>

      <div style={statBox}>
        Flagged: {flagged}
      </div>

      <div style={statBox}>
        Critical: {critical}
      </div>

      <div style={statBox}>
        Avg Risk: {avgRisk}
      </div>

    </div>
  );
}


// ─────────────────────────────────────────────
// Input Form
// ─────────────────────────────────────────────

function InputForm({
  onSubmit,
  loading,
  darkMode
}) {

  const [form, setForm] = useState({
    payer_id: "9988776655",
    payee_id: "MERCHANT121",
    amount: "9500",
    timestamp: new Date()
      .toISOString()
      .slice(0, 16),
    location: "Delhi",
    device_id: "ABC123",
  });

  const inputStyle = {
    background: darkMode
      ? "#111827"
      : "#fff",
    border: "1px solid #374151",
    borderRadius: "8px",
    padding: "12px",
    color: darkMode
      ? "#fff"
      : "#111",
    fontSize: "14px",
    outline: "none"
  };

  const handleSubmit = () => {

    const txn = {
      txn_id:
        "TXN" +
        Date.now(),

      ...form,

      amount: parseFloat(
        form.amount
      ),

      timestamp:
        new Date(
          form.timestamp
        ).toISOString(),
    };

    onSubmit(txn);
  };

  return (

    <div
      style={{
        background: darkMode
          ? "rgba(255,255,255,0.04)"
          : "#f9fafb",
        padding: "24px",
        borderRadius: "16px",
        marginBottom: "28px"
      }}
    >

      <h2
        style={{
          color: darkMode
            ? "#fff"
            : "#111",
          marginBottom: "20px"
        }}
      >
        ⚡ Submit Transaction
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "14px"
        }}
      >

        <input
          style={inputStyle}
          placeholder="Payer ID"
          value={form.payer_id}
          onChange={(e) =>
            setForm({
              ...form,
              payer_id:
                e.target.value
            })
          }
        />

        <input
          style={inputStyle}
          placeholder="Merchant ID"
          value={form.payee_id}
          onChange={(e) =>
            setForm({
              ...form,
              payee_id:
                e.target.value
            })
          }
        />

        <input
          style={inputStyle}
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) =>
            setForm({
              ...form,
              amount:
                e.target.value
            })
          }
        />

        <input
          style={inputStyle}
          type="datetime-local"
          value={form.timestamp}
          onChange={(e) =>
            setForm({
              ...form,
              timestamp:
                e.target.value
            })
          }
        />

        <input
          style={inputStyle}
          placeholder="Location"
          value={form.location}
          onChange={(e) =>
            setForm({
              ...form,
              location:
                e.target.value
            })
          }
        />

        <input
          style={inputStyle}
          placeholder="Device ID"
          value={form.device_id}
          onChange={(e) =>
            setForm({
              ...form,
              device_id:
                e.target.value
            })
          }
        />

      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "20px",
          background: "#2563eb",
          border: "none",
          padding: "12px 22px",
          borderRadius: "10px",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "15px"
        }}
      >
        {loading
          ? "Analyzing..."
          : "⚡ Evaluate Transaction"}
      </button>

    </div>
  );
}


// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────

export default function App() {

  const [transactions,
    setTransactions] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const [darkMode,
    setDarkMode] =
    useState(true);


  const addTransaction =
    useCallback(async (txn) => {

      try {

        setLoading(true);

        const response =
          await axios.post(
            "http://127.0.0.1:5000/transaction",
            txn
          );

        const enriched =
          response.data;

        setTransactions(
          (prev) =>
            [
              enriched,
              ...prev
            ].slice(0, 200)
        );

        setLoading(false);

      } catch (error) {

        setLoading(false);

        alert(
          "Backend connection failed"
        );

        console.error(error);

      }

    }, []);


  const flagged =
    transactions.filter(
      (t) => t.flagged
    );


  // Group By User

  const groupedTransactions = {};

  transactions.forEach((txn) => {

    if (
      !groupedTransactions[
        txn.payer_id
      ]
    ) {

      groupedTransactions[
        txn.payer_id
      ] = [];

    }

    groupedTransactions[
      txn.payer_id
    ].push(txn);

  });


  return (

    <div
      style={{
        minHeight: "100vh",
        background: darkMode
          ? "#030712"
          : "#f3f4f6",
        padding: "24px",
        fontFamily: "Arial"
      }}
    >

      {/* Navbar */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "28px",
          flexWrap: "wrap"
        }}
      >

        <h1
          style={{
            color: darkMode
              ? "#fff"
              : "#111",
            fontSize: "42px"
          }}
        >
          🛡️ UPI Fraud Detector
        </h1>

        <button
          onClick={() =>
            setDarkMode(
              !darkMode
            )
          }
          style={{
            background: darkMode
              ? "#fff"
              : "#111",
            color: darkMode
              ? "#111"
              : "#fff",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {darkMode
            ? "☀ Light Mode"
            : "🌙 Dark Mode"}
        </button>

      </div>

      <StatsBar
        all={transactions}
        darkMode={darkMode}
      />

      <InputForm
        onSubmit={addTransaction}
        loading={loading}
        darkMode={darkMode}
      />

      {/* Export Button */}

      <button
        onClick={() =>
          exportCSV(flagged)
        }
        style={{
          marginBottom: "24px",
          padding: "12px 18px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          background: "#2563eb",
          color: "#fff",
          fontWeight: "bold"
        }}
      >
        ⬇ Export CSV
      </button>

      {

        transactions.length === 0 ? (

          <div
            style={{
              color: darkMode
                ? "#888"
                : "#555",
              textAlign: "center",
              marginTop: "100px",
              fontSize: "24px"
            }}
          >
            📭 No Transactions Yet
          </div>

        ) : (

          Object.entries(
            groupedTransactions
          ).map(
            ([payerId, txns]) => (

              <UserTransactionGroup
                key={payerId}
                payerId={payerId}
                transactions={txns}
                darkMode={darkMode}
              />

            )
          )

        )

      }

    </div>
  );
}