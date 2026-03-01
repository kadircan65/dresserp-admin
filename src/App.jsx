import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("Hazır");
  const [error, setError] = useState("");

  const [adminPassword, setAdminPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function healthCheck() {
    setError("");
    try {
      const r = await fetch(`${API_BASE}/health`);
      if (!r.ok) throw new Error("Health başarısız");
      setStatus("API OK");
    } catch (e) {
      setStatus("API HATA");
      setError("Backend bağlantı hatası. VITE_API_BASE / Render kontrol et.");
    }
  }

  async function fetchProducts() {
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/products`);
      if (!r.ok) throw new Error("Ürünler çekilemedi");
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Ürünler çekilemedi.");
    }
  }

  async function adminLogin() {
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Login başarısız");

      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setAdminPassword("");
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setToken("");
  }

  async function addProduct() {
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          image_url: imageUrl || null,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Ürün eklenemedi");

      setName("");
      setPrice("");
      setImageUrl("");
      await fetchProducts();
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    healthCheck();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>DRESSERP Admin</h1>

      <div style={{ marginBottom: 12 }}>
        <div>API (env): {API_BASE}</div>
        <div>Durum: {status}</div>
      </div>

      {error ? (
        <div style={{ padding: 10, background: "#ffe5e5", marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <hr />

      <h2>Admin Login</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="password"
          placeholder="Admin şifre"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
        <button onClick={adminLogin}>Giriş Yap</button>
        <button onClick={logout} disabled={!token}>
          Çıkış
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        Yetki: {token ? "✅ Login OK (token var)" : "❌ Token yok"}
      </div>

      <hr />

      <h2>Ürün Ekle</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input
          placeholder="Ürün adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Fiyat"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          placeholder="Görsel URL (opsiyonel)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button onClick={addProduct} disabled={!token}>
          EKLE
        </button>
      </div>

      <hr />

      <h2>Ürünler ({products.length})</h2>
      <button onClick={fetchProducts}>Yenile</button>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}