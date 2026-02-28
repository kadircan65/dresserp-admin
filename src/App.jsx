// src/App.jsx
import React, { useEffect, useState } from "react";
import "./App.css";

const API_BASE = (import.meta.env.VITE_API_BASE || "").trim();
const ADMIN_TOKEN = (import.meta.env.VITE_ADMIN_TOKEN || "").trim();

function joinUrl(base, path) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Yükleniyor...");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const hasEnv = Boolean(API_BASE);

  const healthCheck = async () => {
    const r = await fetch(joinUrl(API_BASE, "/health"));
    if (!r.ok) throw new Error("Health failed");
    return r.json();
  };

  const getProducts = async () => {
    const r = await fetch(joinUrl(API_BASE, "/api/products"));
    if (!r.ok) throw new Error("Products failed");
    return r.json();
  };

  const addProduct = async () => {
    setError("");

    if (!ADMIN_TOKEN) {
      setError("VITE_ADMIN_TOKEN ENV eksik. Vercel'e ekle ve redeploy et.");
      return;
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
    };

    if (!payload.name) {
      setError("Ürün adı boş olamaz.");
      return;
    }
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      setError("Fiyat geçersiz.");
      return;
    }

    const r = await fetch(joinUrl(API_BASE, "/api/products"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const txt = await safeText(r);
    let data;
    try {
      data = txt ? JSON.parse(txt) : null;
    } catch {
      data = { raw: txt };
    }

    if (!r.ok) {
      throw new Error(data?.error || "Add failed");
    }

    // başarılıysa listeyi tazele
    const list = await getProducts();
    setProducts(Array.isArray(list) ? list : []);
    setName("");
    setPrice("");
  };

  useEffect(() => {
    const run = async () => {
      setError("");

      if (!hasEnv) {
        setStatus("HATA");
        setError("VITE_API_BASE ENV yok. Vercel Environment Variables kontrol.");
        return;
      }

      try {
        await healthCheck();
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
        setStatus("OK");
      } catch (err) {
        console.error(err);
        setStatus("HATA");
        setError("Backend bağlantı hatası. /health ve /products kontrol.");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>DRESSERP Admin</h1>

      <p>
        Durum: <b>{status}</b>
      </p>

      <p style={{ opacity: 0.9 }}>
        API (env): <code>{API_BASE || "(yok)"}</code>
      </p>

      {!ADMIN_TOKEN && (
        <div style={{ background: "#2b0a0a", padding: 12, borderRadius: 8 }}>
          <b>Uyarı:</b> <code>VITE_ADMIN_TOKEN</code> ENV yok. Ürün ekleme çalışmaz.
        </div>
      )}

      {error && (
        <div style={{ background: "#2b0a0a", padding: 12, borderRadius: 8, marginTop: 12 }}>
          {error}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürün Ekle</h2>

      <input
        placeholder="Ürün adı"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        placeholder="Fiyat (örn 1500)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={addProduct} style={{ padding: "10px 16px", cursor: "pointer" }}>
        EKLE
      </button>

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürünler ({products.length})</h2>

      {products.length === 0 ? (
        <p>Ürün yok</p>
      ) : (
        <ul>
          {products.map((p, i) => (
            <li key={p._id || p.id || i}>
              {p.name || p.title || "Ürün"} {p.price ? `- ${p.price}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}