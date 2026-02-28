import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || "";

function joinUrl(base, path) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export default function App() {
  // API base artık ENV’den geliyor, kullanıcı değiştiremez
  const apiBase = useMemo(() => DEFAULT_API_BASE.trim(), []);

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("ADMIN_TOKEN") || ""
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    imageUrl: "",
  });

  // Token kalıcı
  useEffect(() => {
    localStorage.setItem("ADMIN_TOKEN", adminToken);
  }, [adminToken]);

  // ENV yoksa erken uyarı
  useEffect(() => {
    if (!apiBase) {
      setMsg("HATA: VITE_API_BASE tanımlı değil (Vercel env kontrol et).");
    }
  }, [apiBase]);

  async function safeText(res) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  async function healthCheck() {
    const url = joinUrl(apiBase, "/health");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Health failed: ${res.status}`);
    return res.json();
  }

  async function fetchProducts() {
    setLoading(true);
    setMsg("");
    try {
      await healthCheck();

      const url = joinUrl(apiBase, "/api/products");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Products failed: ${res.status}`);

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMsg(`HATA: ${String(e.message || e)}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!form.name.trim()) throw new Error("Ürün adı boş olamaz");
      if (!form.price) throw new Error("Fiyat boş olamaz");
      if (!form.imageUrl.trim()) throw new Error("Resim URL boş olamaz");

      const url = joinUrl(apiBase, "/api/products");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          imageUrl: form.imageUrl.trim(),
        }),
      });

      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Add failed: ${res.status} ${t}`);
      }

      setForm({ name: "", price: "", imageUrl: "" });
      setMsg("OK: Ürün eklendi");
      fetchProducts();
    } catch (e2) {
      console.error(e2);
      setMsg(`HATA: ${String(e2.message || e2)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Dresserp Admin</h1>

      <div style={{ padding: 12, border: "1px solid #333", borderRadius: 8 }}>
        <div>
          <b>API (ENV kilitli):</b>{" "}
          <span style={{ opacity: 0.85 }}>
            {apiBase || "— TANIMSIZ —"}
          </span>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            <b>Admin Token</b>
          </label>
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={fetchProducts} disabled={loading || !apiBase}>
            Listeyi Yenile
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: msg.startsWith("OK") ? "#0b2b0b" : "#2b0a0a",
          }}
        >
          {msg}
        </div>
      )}

      <hr style={{ margin: "18px 0" }} />

      <h2>Ürün Ekle</h2>
      <form onSubmit={addProduct} style={{ display: "grid", gap: 10 }}>
        <input
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          placeholder="Ürün adı"
          style={{ padding: 10 }}
        />
        <input
          value={form.price}
          onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
          placeholder="Fiyat"
          type="number"
          style={{ padding: 10 }}
        />
        <input
          value={form.imageUrl}
          onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
          placeholder="Resim URL"
          style={{ padding: 10 }}
        />
        <button type="submit" disabled={loading || !apiBase}>
          Ekle
        </button>
      </form>

      <hr style={{ margin: "18px 0" }} />

      <h2>Ürün Listesi ({products.length})</h2>
      {loading ? (
        <p>Yükleniyor…</p>
      ) : products.length === 0 ? (
        <p>Ürün yok</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {products.map((p, i) => (
            <div
              key={p.id ?? i}
              style={{
                border: "1px solid #333",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>{p.name || "Ürün"}</div>
              <div style={{ opacity: 0.85 }}>{p.price ? `${p.price}₺` : ""}</div>
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name || "urun"}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    marginTop: 8,
                    height: 140,
                    display: "grid",
                    placeItems: "center",
                    border: "1px dashed #444",
                    borderRadius: 8,
                    opacity: 0.7,
                  }}
                >
                  Resim yok
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}