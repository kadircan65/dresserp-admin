// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = (import.meta.env.VITE_API_BASE || "").trim();

// .env boşsa deploy kırılmasın diye ekrana net hata basalım
if (!API_BASE) {
  console.error("VITE_API_BASE eksik! Vercel/Local env ayarla.");
}

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

export default function App() {
  const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "";
  const apiBase = useMemo(() => API_BASE, []);

  const [status, setStatus] = useState("Yükleniyor...");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const healthCheck = async () => {
    const r = await fetch(joinUrl(apiBase, "/health"), { cache: "no-store" });
    if (!r.ok) throw new Error(`Health failed: ${r.status}`);
    return r.json();
  };

  const fetchProducts = async () => {
    const r = await fetch(joinUrl(apiBase, "/api/products"), {
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Products failed: ${r.status}`);
    return r.json();
  };

  const addProduct = async () => {
    const payload = { name, price: Number(price) || 0 };

    const r = await fetch(joinUrl(apiBase, "/api/products"), {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "x-admin-token": ADMIN_TOKEN,
},
        // backend senin tokeni hangi header ile bekliyorsa onu kullan:
        // çoğunlukla: Authorization: Bearer <token>
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Add failed: ${r.status}`);

    return data;
  };

  useEffect(() => {
    const run = async () => {
      setError("");
      try {
        if (!apiBase) {
          setStatus("HATA");
          setError("VITE_API_BASE yok. Vercel env ayarla.");
          return;
        }

        await healthCheck();
        const list = await fetchProducts();
        setProducts(Array.isArray(list) ? list : []);
        setStatus("OK");
      } catch (err) {
        console.error(err);
        setStatus("HATA");
        setError(
          "Backend bağlantı hatası. VITE_API_BASE, /health ve /api/products kontrol."
        );
      }
    };
    run();
  }, [apiBase]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addProduct();
      setName("");
      setPrice("");
      const list = await fetchProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Ürün ekleme hatası");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1>DRESSERP Admin</h1>

      <p>
        Durum: <b>{status}</b>
      </p>

      <p style={{ opacity: 0.9 }}>
        API (env): <code>{apiBase || "(VITE_API_BASE yok)"}</code>
      </p>

      {error && (
        <div style={{ background: "#2b0a0a", padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />


      <hr style={{ margin: "16px 0" }} />

      <h2>Ürün Ekle</h2>
      <form onSubmit={onSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ürün adı"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Fiyat (örn 1500)"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />
        <button type="submit" style={{ padding: "10px 16px" }}>
          EKLE
        </button>
      </form>

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürünler ({products.length})</h2>
      {products.length === 0 ? (
        <p>Ürün yok</p>
      ) : (
        <ul>
          {products.map((p, i) => (
            <li key={p.id ?? i}>
              {p.name ?? p.title ?? "Ürün"} {p.price ? `- ${p.price}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}