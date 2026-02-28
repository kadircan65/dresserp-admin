// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_API_BASE = String(import.meta.env.VITE_API_BASE || "").trim();
const ADMIN_TOKEN = String(import.meta.env.VITE_ADMIN_TOKEN || "").trim();

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Yükleniyor...");
  const [error, setError] = useState("");

  // API base sadece ENV'den (kilitli)
  const apiBase = useMemo(() => DEFAULT_API_BASE, []);

  const healthCheck = async () => {
    const r = await fetch(joinUrl(apiBase, "/health"));
    if (!r.ok) throw new Error(`Health failed: ${r.status}`);
    return r.json();
  };

  const getProducts = async () => {
    const r = await fetch(joinUrl(apiBase, "/api/products"));
    if (!r.ok) throw new Error(`Products failed: ${r.status}`);
    return r.json();
  };

  const addProduct = async (payload) => {
    const r = await fetch(joinUrl(apiBase, "/api/products"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data.error || `Add failed: ${r.status}`);
    }
    return data;
  };

  useEffect(() => {
    const run = async () => {
      setError("");
      try {
        if (!apiBase) {
          setStatus("HATA");
          setError("VITE_API_BASE boş. Vercel ENV'e backend URL gir.");
          return;
        }

        await healthCheck();
        const data = await getProducts();

        setProducts(Array.isArray(data) ? data : []);
        setStatus("OK");
      } catch (err) {
        console.error(err);
        setStatus("HATA");
        setError(
          `Backend bağlantı hatası. API: ${apiBase} | Detay: ${err?.message || err}`
        );
      }
    };

    run();
  }, [apiBase]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const onAdd = async () => {
    setError("");
    try {
      if (!ADMIN_TOKEN) {
        throw new Error("VITE_ADMIN_TOKEN boş. Vercel ENV'de tanımla.");
      }

      const payload = { name: name.trim(), price: Number(price) || 0 };
      if (!payload.name) throw new Error("Ürün adı boş olamaz.");

      await addProduct(payload);

      // tekrar listele
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);

      setName("");
      setPrice("");
      setStatus("OK");
    } catch (err) {
      console.error(err);
      setStatus("HATA");
      setError(err?.message || String(err));
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>DRESSERP Admin</h1>

      <p>
        Durum: <b>{status}</b>
      </p>

      <p style={{ opacity: 0.9 }}>
        API (env): <b>{apiBase || "-"}</b>
      </p>

      {error && (
        <div
          style={{
            background: "#2b0a0a",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          {error}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürün Ekle</h2>

      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <input
          placeholder="Ürün adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Fiyat (örn 1500)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={onAdd}>EKLE</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürünler ({products.length})</h2>

      {products.length === 0 ? (
        <p>Ürün yok</p>
      ) : (
        <ul>
          {products.map((p, i) => (
            <li key={p.id ?? i}>
              {p.name ?? p.title ?? "Ürün"}{" "}
              {p.price !== undefined && p.price !== null ? `- ${p.price}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}