// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = String(import.meta.env.VITE_API_BASE || "").trim();

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
  const apiBase = API_BASE;

  // ✅ Token otomatik saklanacak
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("ADMIN_TOKEN") || ""
  );

  // ✅ Login için sadece password
  const [adminPassword, setAdminPassword] = useState("");

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Kontrol ediliyor...");
  const [err, setErr] = useState("");

  useEffect(() => {
    localStorage.setItem("ADMIN_TOKEN", adminToken);
  }, [adminToken]);

  const headers = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (adminToken) h["Authorization"] = `Bearer ${adminToken}`; // ✅ standart
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

  // ✅ OTOMATİK LOGIN
  async function login() {
    if (!apiBase) return setErr("VITE_API_BASE boş.");
    setErr("");
    setLoading(true);

    try {
      const url = joinUrl(apiBase, "api/admin/login");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Login ${res.status} ${t}`);
      }

      const data = await res.json();
      const token = data?.token;

      if (!token) throw new Error("Login başarılı ama token gelmedi.");

      setAdminToken(token);
      setAdminPassword("");
    } catch (e) {
      setAdminToken("");
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAdminToken("");
    localStorage.removeItem("ADMIN_TOKEN");
  }

  async function addProduct() {
    if (!apiBase) return;
    if (!adminToken) return setErr("Önce admin login yap (token yok).");

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
      if (!apiBase) {
        setStatusMsg("HATA");
        setErr("VITE_API_BASE boş. Vercel Environment Variables kontrol.");
        return;
      }
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
        <div style={{ marginTop: 8, opacity: 0.9 }}>
          Yetki:{" "}
          <b>{adminToken ? "✅ Login OK (token var)" : "❌ Login gerek"}</b>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      <hr />

      {/* ✅ LOGIN BLOĞU */}
      <h2>Admin Login</h2>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Admin şifre"
        />
        <button onClick={login} disabled={loading || !adminPassword.trim()}>
          {loading ? "Bekle..." : "Giriş Yap"}
        </button>
        <button onClick={logout} disabled={loading || !adminToken}>
          Çıkış
        </button>
      </div>

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