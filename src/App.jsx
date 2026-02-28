// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_API_BASE =
  (import.meta.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim()) || "";

if (!DEFAULT_API_BASE) {
  // İstersen bunu throw yapabilirsin ama geliştirmede bazen rahatsız eder.
  // Ben net olayım diye throw bırakıyorum:
  throw new Error("VITE_API_BASE tanımlı değil. .env dosyasını kontrol et.");
}

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "");
  const pp = p.startsWith("/") ? p : `/${p}`;
  return `${b}${pp}`;
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export default function App() {
  // ✅ API base: önce localStorage, yoksa .env
  const [apiBase, setApiBase] = useState(() => {
    return localStorage.getItem("API_BASE") || DEFAULT_API_BASE;
  });

  // ✅ Admin token
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem("ADMIN_TOKEN") || "";
  });

  // UI states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
  });

  // ✅ localStorage persist
  useEffect(() => {
    localStorage.setItem("API_BASE", apiBase);
  }, [apiBase]);

  useEffect(() => {
    localStorage.setItem("ADMIN_TOKEN", adminToken);
  }, [adminToken]);

  // API endpoints
  const HEALTH_URL = useMemo(() => joinUrl(apiBase, "/api/health"), [apiBase]);
  const PRODUCTS_URL = useMemo(() => joinUrl(apiBase, "/api/products"), [apiBase]);

  async function healthCheck() {
    const res = await fetch(HEALTH_URL, { method: "GET" });
    if (!res.ok) {
      const t = await safeText(res);
      throw new Error(`Health failed (${res.status}) ${t}`);
    }
    return res.json();
  }

  async function fetchProducts() {
    setLoading(true);
    setMsg("");
    try {
      await healthCheck();

      const res = await fetch(PRODUCTS_URL, {
        method: "GET",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Products failed (${res.status}) ${t}`);
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setMsg("✅ Ürünler yüklendi.");
    } catch (e) {
      console.error(e);
      setMsg(`❌ Hata: ${e.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    setLoading(true);
    setMsg("");
    try {
      // basit validation
      const name = String(form.name || "").trim();
      const price = String(form.price || "").trim();
      const imageUrl = String(form.imageUrl || "").trim();

      if (!name) throw new Error("Ürün adı boş olamaz.");
      if (!price) throw new Error("Fiyat boş olamaz.");

      const res = await fetch(PRODUCTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ name, price, image_url: imageUrl }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `Add failed (${res.status})`);
      }

      setMsg("✅ Ürün eklendi.");
      setForm({ name: "", price: "", imageUrl: "" });
      await fetchProducts();
    } catch (e) {
      console.error(e);
      setMsg(`❌ Hata: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ilk açılışta otomatik listele
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Dresserp Admin</h1>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <b>API URL</b>
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://... (Render backend url)"
          />
          <small>
            Env: <code>VITE_API_BASE</code> = <code>{DEFAULT_API_BASE}</code>
          </small>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <b>ADMIN TOKEN</b>
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="admin token"
          />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={fetchProducts} disabled={loading}>
            {loading ? "Yükleniyor..." : "Listeyi Yenile"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("API_BASE");
              setApiBase(DEFAULT_API_BASE);
              setMsg("✅ API_BASE sıfırlandı (env değerine döndü).");
            }}
            disabled={loading}
          >
            API URL Reset (Env)
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("ADMIN_TOKEN");
              setAdminToken("");
              setMsg("✅ ADMIN_TOKEN temizlendi.");
            }}
            disabled={loading}
          >
            Token Temizle
          </button>
        </div>

        <div style={{ opacity: 0.9 }}>
          <div>
            Health: <code>{HEALTH_URL}</code>
          </div>
          <div>
            Products: <code>{PRODUCTS_URL}</code>
          </div>
        </div>

        {msg && (
          <div
            style={{
              background: msg.startsWith("✅") ? "#0b2b14" : "#2b0a0a",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {msg}
          </div>
        )}
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2>Ürün Ekle</h2>
      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <input
          placeholder="Ürün adı"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
        <input
          placeholder="Fiyat (örn 1500)"
          value={form.price}
          onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
        />
        <input
          placeholder="Resim URL (opsiyonel)"
          value={form.imageUrl}
          onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
        />

        <button onClick={addProduct} disabled={loading}>
          {loading ? "Bekle..." : "EKLE"}
        </button>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <h2>Ürün Listesi ({products.length})</h2>

      {products.length === 0 ? (
        <p>Ürün yok</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {products.map((p, i) => {
            const id = p.id ?? p._id ?? i;
            const name = p.name ?? p.title ?? "Ürün";
            const price = p.price ?? "";
            const img = p.image_url ?? p.imageUrl ?? p.img ?? "";

            return (
              <div
                key={id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 12,
                  border: "1px solid #333",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 90,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    opacity: 0.8,
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    "Resim yok"
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                  <div style={{ opacity: 0.85 }}>{price ? `${price} TL` : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}