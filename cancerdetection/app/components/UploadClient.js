"use client";
import { useState } from "react";

const CLASS_MAP = {
  nv: "Melanocytic Nevus (Benign)",
  mel: "Melanoma (Malignant)",
  bkl: "Benign Keratosis-like Lesion",
  bcc: "Basal Cell Carcinoma",
  akiec: "Actinic Keratoses / Intraepithelial Carcinoma",
  vasc: "Vascular Lesion",
  df: "Dermatofibroma",
};

function SeverityCard({ pred }) {
  const isMalignant = ["mel", "bcc"].includes(pred.class);
  const bg = isMalignant ? "#ffecec" : "#f3fff0";
  const border = isMalignant ? "1px solid #f5c2c2" : "1px solid #cfeccf";

  return (
    <li
      style={{
        listStyle: "none",
        marginBottom: 12,
        padding: 12,
        borderRadius: 10,
        background: bg,
        border,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {CLASS_MAP[pred.class] || pred.class}
        </div>
        <div style={{ color: "#555", marginTop: 6 }}>
          Confidence: {(pred.confidence * 100).toFixed(2)}%
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 90 }}>
        <div style={{ fontSize: 12, color: "#666" }}>Class ID</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{pred.class_id ?? "—"}</div>
      </div>
    </li>
  );
}

export default function UploadClient() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append("image", file);

    try {
      const r = await fetch("/api/roboflow", {
        method: "POST",
        body: form,
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Server returned ${r.status}: ${text}`);
      }

      const data = await r.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Skin Cancer Detection — Demo</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Upload an image and the model will return predicted lesion classes with confidence scores.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 12, marginBottom: 18 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginRight: 8 }}
        />
        <button
          type="submit"
          disabled={loading || !file}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#a00", marginBottom: 12 }}>Error: {error}</div>
      )}

      {result ? (
        <section style={{ marginTop: 10 }}>
          <h2 style={{ marginBottom: 8 }}>Analysis Result</h2>

          {result.predictions && result.predictions.length > 0 ? (
            <ul style={{ padding: 0, maxWidth: 800 }}>
              {result.predictions.map((pred, i) => (
                <SeverityCard key={i} pred={pred} />
              ))}
            </ul>
          ) : (
            <div style={{ color: "#444" }}>No predictions returned.</div>
          )}

          {result.predictions && result.predictions.length > 1 && (
            <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
              Showing {result.predictions.length} predictions — primary result is the first
              item.
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
