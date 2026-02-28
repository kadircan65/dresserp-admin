// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getProducts, healthCheck, addProduct } from "./api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Yükleniyor...");
  const [error, setError] = useState("");

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("ADMIN_TOKEN") || ""
  );

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Token değişince localStorage’a yaz (URL değil, sadece token)
  useEffect(() => {
    localStorage.setItem("ADMIN_TOKEN", adminToken);
  }, [adminToken]);

  const apiInfo = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE || "";
    return base ? base : "(VITE_API_BASE yok)";
  }, []);

  const load = async () => {
    setError("");
    setStatus("Yükleniyor...");
    try {
      await healthCheck();
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
      setStatus("OK");
    } catch (err) {
      console.error(err);
      setStatus("HATA");
      setError("Backend bağlantı hatası. VITE_API_BASE ve backend endpointlerini kontrol et.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async () => {
    setError("");
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
      };

      if (!payload.name) throw new Error("Ürün adı boş olamaz");
      if (!payload.price || Number.isNaN(payload.price)) throw new Error("Fiyat geçersiz");

      await addProduct(payload, adminToken);
      setName("");
      setPrice("");
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Ürün ekleme hatası");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>DRESSERP Admin</h1>

      <p>
        Durum: <b>{status}</b>
      </p>

      <p style={{ opacity: 0.8, fontSize: 14 }}>
        API (env): <code>{apiInfo}</code>
      </p>

      {error && (
        <div style={{ background: "#2b0a0a", padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Admin Token</h2>
      <input
        style={{ width: "100%", padding: 10 }}
        value={adminToken}
        onChange={(e) => setAdminToken(e.target.value)}
        placeholder="ADMIN TOKEN"
      />

      <hr style={{ margin: "16px 0" }} />

      <h2>Ürün Ekle</h2>
      <input
        style={{ width: "100%", padding: 10, marginBottom: 8 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ürün adı"
      />
      <input
        style={{ width: "100%", padding: 10, marginBottom: 8 }}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Fiyat (örn: 1500)"
      />
      <button onClick={onAdd} style={{ padding: "10px 16px", cursor: "pointer" }}>
        EKLE
      </button>

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