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
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // ✅ admin login password (sadece sen girersin)
  const [password, setPassword] = useState("");

  // ✅ jwt token (1 saatlik)
  const [token, setToken] = useState(localStorage.getItem("ADMIN_JWT") || "");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Kontrol ediliyor...");
  const [err, setErr] = useState("");

  const apiBase = API_BASE;

  useEffect(() => {
    localStorage.setItem("ADMIN_JWT", token);
  }, [token]);

  const headers = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  async function healthCheck() {
    if (!apiBase) return false;
    setErr("");
    try {
      const res = await fetch(joinUrl(apiBase, "health"));
      if (!res.ok) throw new Error(`Health ${res.status} ${await safeText(res)}`);
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
      const res = await fetch(joinUrl(apiBase, "api/products"));
      if (!res.ok) throw new Error(`Products ${res.status} ${await safeText(res)}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e?.message || e));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (!apiBase) return setErr("VITE_API_BASE boş.");
    if (!password.trim()) return setErr("Admin şifresi boş olamaz.");

    setErr("");
    setLoading(true);
    try {
      const res = await fetch(joinUrl(apiBase, "api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!res.ok) throw new Error(`Login ${res.status} ${await safeText(res)}`);

      const data = await res.json();
      if (!data?.token) throw new Error("Login response token yok.");
      setToken(data.token);
      setPassword("");
    } catch (e) {
      setErr(String(e?.message || e));
      setToken("");
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    if (!apiBase) return;
    if (!token) return setErr("Önce admin giriş yap (token yok).");

    setErr("");
    const n = name.trim();
    const p = Number(price);

    if (!n) return setErr("Ürün adı boş olamaz.");
    if (!Number.isFinite(p) || p <= 0) return setErr("Fiyat geçersiz.");

    setLoading(true);
    try {
      const res = await fetch(joinUrl(apiBase, "api/products"), {
        method: "POST",
        headers,
        body: JSON.stringify({ name: n, price: p }),
      });

      if (!res.ok) throw new Error(`Add ${res.status} ${await safeText(res)}`);

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
          Admin Oturum: <b>{token ? "✅ Açık" : "❌ Kapalı"}</b>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      <hr />

      <h2>Admin Giriş</h2>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin şifresi"
        type="password"
      />
      <button onClick={login} disabled={loading}>
        {loading ? "Bekle..." : "GİRİŞ"}
      </button>

      <button
        onClick={() => {
          setToken("");
          localStorage.removeItem("ADMIN_JWT");
        }}
        disabled={loading}
        style={{ marginLeft: 8 }}
      >
        Çıkış
      </button>

      <hr />

      <h2>Ürün Ekle</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ürün adı" />
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