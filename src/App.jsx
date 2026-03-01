// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// ✅ Sadece ENV'den gelecek
const API_BASE = String(import.meta.env.VITE_API_BASE || "").trim();
const ADMIN_TOKEN_ENV = String(import.meta.env.VITE_ADMIN_TOKEN || "").trim();

// URL birleştirici
function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
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
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Kontrol ediliyor...");
  const [err, setErr] = useState("");

  // ✅ API + Token sabit: sadece ENV
  const apiBase = API_BASE;
  const adminToken = ADMIN_TOKEN_ENV;

  // ENV kontrol
  useEffect(() => {
    if (!apiBase) {
      setStatusMsg("HATA");
      setErr("VITE_API_BASE boş. .env veya Vercel Environment Variables içine gir.");
      return;
    }
    if (!adminToken) {
      setStatusMsg("HATA");
      setErr("VITE_ADMIN_TOKEN boş. .env veya Vercel Environment Variables içine gir.");
      return;
    }
  }, [apiBase, adminToken]);

  const headers = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (adminToken) h["x-admin-token"] = adminToken;
    return h;
  }, [adminToken]);

  async function healthCheck() {
    if (!apiBase) return false;

    setErr("");
    try {
      const url = joinUrl(apiBase, "health");
      const res = await fetch(url);
      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Health ${res.status} ${t}`);
      }
      return true;
    } catch (e) {
      setErr(String(e?.message || e));
      return false;
    }
  }

  async function fetchProducts() {
    if (!apiBase) return;

    setErr("");
    setLoading(true);
    try {
      const url = joinUrl(apiBase, "api/products");
      const res = await fetch(url);

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Products ${res.status} ${t}`);
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e?.message || e));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    if (!apiBase) return;

    setErr("");

    const n = name.trim();
    const p = Number(price);

    if (!n) return setErr("Ürün adı boş olamaz.");
    if (!Number.isFinite(p) || p <= 0) return setErr("Fiyat geçersiz.");

    setLoading(true);
    try {
      const url = joinUrl(apiBase, "api/products");
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: n, price: p }),
      });

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Add ${res.status} ${t}`);
      }

      setName("");
      setPrice("");
      await fetchProducts();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await healthCheck();
      setStatusMsg(ok ? "OK" : "HATA");
      if (ok) await fetchProducts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  return (
    <div className="container">
      <h1>DRESSERP Admin</h1>

      <div className="status">
        <div>Durum: {statusMsg}</div>

        <div style={{ marginTop: 8, opacity: 0.9 }}>
          API (env): <b>{apiBase || "(tanımlı değil)"}</b>
        </div>

        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Admin Token: <b>{adminToken ? "✅ Tanımlı" : "❌ Yok"}</b>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      <hr />

      <h2>Ürün Ekle</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ürün adı"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Fiyat (örn 1500)"
      />
      <button onClick={addProduct} disabled={loading}>
        {loading ? "Bekle..." : "EKLE"}
      </button>

      <hr />

      <h2>Ürünler ({products.length})</h2>
      <button onClick={fetchProducts} disabled={loading}>
        {loading ? "Yükleniyor..." : "Yenile"}
      </button>

      <ul>
        {products.map((p) => (
          <li key={p.id ?? `${p.name}-${p.price}`}>
            {p.name} - {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}