import React, { useState } from "react";
import Tesseract from "tesseract.js";

const DB = {
  "coconut oil": { risk: "High", note: "Highly comedogenic, can clog pores" },
  "sodium lauryl sulfate": { risk: "High", note: "Can irritate skin and worsen acne" },
  "isopropyl myristate": { risk: "High", note: "Strong pore-clogging ingredient" },
  "cocoa butter": { risk: "High", note: "Heavy, can block pores" },
  "lanolin": { risk: "High", note: "Can trap oil and debris" },

  "stearic acid": { risk: "Medium", note: "Can clog pores for some skin types" },
  "glyceryl stearate": { risk: "Medium", note: "Moderately comedogenic" },
  "soybean oil": { risk: "Medium", note: "May trigger breakouts" },
  "propylene glycol": { risk: "Medium", note: "Can irritate sensitive skin" },

  "cetyl alcohol": { risk: "Some", note: "Generally safe but may clog for some" },
  "cetearyl alcohol": { risk: "Some", note: "Low risk fatty alcohol" },
  "dimethicone": { risk: "Some", note: "Debated, may trap oil" },
  "tocopherol": { risk: "Some", note: "Vitamin E, can break out some users" }
};

export default function IngredientScanner() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [verdict, setVerdict] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [stats, setStats] = useState({ total: 0, flagged: 0 });

  const handleImage = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResults([]);
    setScore(null);
    setVerdict("");
    setConfidence(null);
    setExtractedText("");
    setStats({ total: 0, flagged: 0 });
  };

  const runOCR = async () => {
    if (!image) return { text: "", confidence: 0 };
    setLoading(true);
    try {
      const result = await Tesseract.recognize(image, "eng");
      const text = result.data.text.toLowerCase();
      const conf = result.data.confidence;
      setExtractedText(text);
      return { text, confidence: conf };
    } catch (err) {
      console.error(err);
      return { text: "", confidence: 0 };
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    const { text, confidence: conf } = await runOCR();
    setConfidence(conf);

    const ingredients = text
      .split(/,|\n/)
      .map((i) => i.trim())
      .filter(Boolean);

    const foundMap = new Map();
    let totalScore = 100;

    ingredients.forEach((ingredient) => {
      Object.keys(DB).forEach((key) => {
        if (ingredient.includes(key)) {
          if (!foundMap.has(key)) {
            const item = DB[key];
            foundMap.set(key, { ingredient: key, ...item });

            if (item.risk === "High") totalScore -= 30;
            if (item.risk === "Medium") totalScore -= 15;
            if (item.risk === "Some") totalScore -= 5;
          }
        }
      });
    });

    const finalResults = Array.from(foundMap.values());
    setResults(finalResults);

    const finalScore = Math.max(totalScore, 0);
    setScore(finalScore);

    setStats({ total: ingredients.length, flagged: finalResults.length });

    if (finalScore < 40) {
      setVerdict("This product is likely to cause breakouts for acne-prone skin.");
    } else if (finalScore < 70) {
      setVerdict("This product may cause breakouts depending on your skin.");
    } else {
      setVerdict("This product is unlikely to cause breakouts for most people.");
    }
  };

  const getRiskLabel = () => {
    if (score === null) return "";
    if (score < 40) return "High Risk";
    if (score < 70) return "Medium Risk";
    return "Low Risk";
  };

  const getGradient = () => {
    if (score < 40) return "linear-gradient(135deg, #ef4444, #b91c1c)";
    if (score < 70) return "linear-gradient(135deg, #f59e0b, #d97706)";
    return "linear-gradient(135deg, #10b981, #047857)";
  };

  const getConfidenceColor = () => {
    if (confidence > 80) return "#16a34a";
    if (confidence > 50) return "#f59e0b";
    return "#ef4444";
  };

  const getScanTip = () => {
    if (confidence === null) return "";
    if (confidence > 80) return "Great scan quality";
    if (confidence > 50) return "Decent scan — try better lighting";
    return "Low quality scan — try a clearer photo";
  };

  const highlightText = (text, results) => {
    let highlighted = text;
    results.forEach((r) => {
      const regex = new RegExp(`(${r.ingredient})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark style="background:#fde68a">$1</mark>'
      );
    });
    return highlighted;
  };

  const topOffender =
    results.find((r) => r.risk === "High") ||
    results.find((r) => r.risk === "Medium") ||
    results[0];

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 500, margin: "0 auto" }}>

      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 24
        }}>
          Scanning...
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1>Break Free</h1>
        <p style={{ color: "#666" }}>Know before it breaks you out</p>
      </div>

      {!image && (
        <div style={{ marginBottom: 15, padding: 12, background: "#f9f9f9", borderRadius: 10 }}>
          📸 Pro tip: snap the ingredients straight-on in good lighting for best results
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImage(e.target.files[0])}
      />

      {preview && (
        <img src={preview} alt="preview" style={{ width: "100%", marginTop: 15, borderRadius: 10 }} />
      )}

      <button
        onClick={handleScan}
        disabled={!image || loading}
        style={{
          marginTop: 15,
          padding: 12,
          width: "100%",
          borderRadius: 8,
          border: "none",
          background: !image ? "#ccc" : "black",
          color: "white"
        }}
      >
        Scan Ingredients
      </button>

      {confidence !== null && (
        <p style={{ marginTop: 10, fontSize: 12, color: getConfidenceColor() }}>
          {getScanTip()} ({Math.round(confidence)}%)
        </p>
      )}

      {score !== null && (
        <div style={{
          marginTop: 25,
          padding: 25,
          borderRadius: 16,
          background: getGradient(),
          color: "white",
          textAlign: "center"
        }}>
          <h2 style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 48, marginBottom: 5 }}>
              {score < 40 ? "💀🔥" : score < 70 ? "😬⚠️" : "😌✨"}
            </div>
            <div style={{ fontSize: 20, opacity: 0.9 }}>
              {getRiskLabel()}
            </div>
          </h2>

          <div style={{ marginTop: 15, height: 10, background: "rgba(255,255,255,0.3)", borderRadius: 10 }}>
            <div style={{ height: "100%", width: `${score}%`, background: "white" }} />
          </div>

          <div style={{ fontSize: 42, fontWeight: "bold", marginTop: 10 }}>{score}</div>
          <p style={{ fontSize: 14, opacity: 0.9 }}>{verdict}</p>

          <p style={{ fontSize: 12 }}>
            {stats.flagged} of {stats.total} ingredients flagged
          </p>
        </div>
      )}

      {topOffender && (
        <div style={{ marginTop: 15, padding: 12, background: "#fff", borderRadius: 8 }}>
          ⚠️ Biggest concern: <strong>{topOffender.ingredient}</strong>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 25 }}>
          <h3>What’s going on here 👇</h3>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => setOpenIndex(i === openIndex ? null : i)}
              style={{ marginTop: 10, padding: 12, background: "#fff", borderRadius: 8, cursor: "pointer" }}
            >
              <strong>{r.ingredient}</strong>
              {openIndex === i && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>{r.note}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {extractedText && (
        <div style={{ marginTop: 20 }}>
          <h4>Scanned text</h4>
          <div
            style={{ fontSize: 12 }}
            dangerouslySetInnerHTML={{ __html: highlightText(extractedText, results) }}
          />
        </div>
      )}

      {image && (
        <button
          onClick={() => {
            setImage(null);
            setPreview(null);
            setResults([]);
            setScore(null);
            setVerdict("");
            setConfidence(null);
            setExtractedText("");
          }}
          style={{ marginTop: 20, padding: 10, width: "100%" }}
        >
          Scan another product
        </button>
      )}

    </div>
  );
}
