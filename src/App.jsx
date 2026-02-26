import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE =
  (import.meta?.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim()) ||
  `${window.location.origin}`; // aynı origin; proxy/route ile kullanacaksan

function joinUrl(base, path) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export default function App() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem("ADMIN_TOKEN") || "");
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", imageUrl: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // API_BASE artık localStorage’dan okunmuyor.
  // İstersen kullanıcı değiştirebilsin diye input var ama default ENV.
  const API = useMemo(() => apiBase.trim().replace(/\/+$/, ""), [apiBase]);

  useEffect(() => {
    localStorage.setItem("ADMIN_TOKEN", adminToken);
  }, [adminToken]);

  async function safeText(res) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  async function fetchProducts() {
    setLoading(true);
    setMsg("");
    try {
      const url = joinUrl(API, "/api/products");
      const res = await fetch(url, {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`GET /api/products failed: ${res.status} ${txt}`);
      }

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (e) {
      setMsg(String(e.message || e));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    setLoading(true);
    setMsg("");
    try {
      const url = joinUrl(API, "/api/products");
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`POST /api/products failed: ${res.status} ${txt}`);
      }

      setForm({ name: "", price: "", imageUrl: "" });
      await fetchProducts();
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm(`Silinsin mi? (id=${id})`)) return;
    setLoading(true);
    setMsg("");
    try {
      const url = joinUrl(API, `/api/products/${id}`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`DELETE /api/products/${id} failed: ${res.status} ${txt}`);
      }

      await fetchProducts();
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function resetClient() {
    // localhost saplanmalarını kökten bitirir
    localStorage.removeItem("API_BASE");
    localStorage.removeItem("ADMIN_TOKEN");
    localStorage.clear();
    window.location.reload();
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui" }}>
      <h2>Dresserp Admin</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <label>
          API URL
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://YOUR-BACKEND.up.railway.app"
            style={{ width: "100%" }}
          />
        </label>

        <label>
          ADMIN TOKEN
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="token"
            style={{ width: "100%" }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={fetchProducts} disabled={loading}>Listeyi Yenile</button>
          <button onClick={resetClient} type="button">Local Reset</button>
        </div>

        {msg ? (
          <pre style={{ background: "#2a0000", color: "#ffb3b3", padding: 10, borderRadius: 8 }}>
            {msg}
          </pre>
        ) : null}
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h3>Ürün Ekle</h3>
      <div style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <input
          placeholder="Ürün adı"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <input
          placeholder="Fiyat (örn 1500)"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
        />
        <input
          placeholder="Resim URL (opsiyonel)"
          value={form.imageUrl}
          onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
        />
        <button onClick={addProduct} disabled={loading}>EKLE</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h3>Ürün Listesi ({products.length})</h3>
      {loading ? <div>Yükleniyor...</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {products.map((p) => (
          <div key={p.id || p._id} style={{ border: "1px solid #444", padding: 10, borderRadius: 10 }}>
            <div><b>{p.name}</b></div>
            <div>ID: {p.id || p._id}</div>
            <div>Fiyat: {p.price}</div>
            <button onClick={() => deleteProduct(p.id || p._id)}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}