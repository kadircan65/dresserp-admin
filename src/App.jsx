import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_BASE; // örn: https://dresserp-backend.onrender.com

export default function App() {
  const [apiOk, setApiOk] = useState(null);

  // login
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [loginMsg, setLoginMsg] = useState("");

  // product form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image_url, setImageUrl] = useState("");

  // products list
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // API health check
    const check = async () => {
      try {
        const r = await fetch(`${API}/api/health`);
        const j = await r.json();
        setApiOk(!!j?.ok);
      } catch (e) {
        setApiOk(false);
      }
    };
    if (API) check();
  }, []);

  const login = async () => {
    setLoginMsg("");
    setErr("");
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoginMsg(`Login failed: ${data?.error || "unknown_error"}`);
        return;
      }

      if (data?.token) {
        setToken(data.token);
        localStorage.setItem("admin_token", data.token);
        setLoginMsg("✅ Login OK (token alındı)");
      } else {
        setLoginMsg("Login failed: token gelmedi");
      }
    } catch (e) {
      setLoginMsg("Login failed: network_error");
    }
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("admin_token");
    setLoginMsg("Çıkış yapıldı.");
  };

  const fetchProducts = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(`Ürünleri çekemedi: ${data?.error || "unknown_error"}`);
        setProducts([]);
        return;
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Ürünleri çekemedi: network_error");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    setErr("");
    if (!token) {
      setErr("Önce admin login ol (token yok).");
      return;
    }
    if (!name.trim()) {
      setErr("Ürün adı boş olamaz.");
      return;
    }

    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      setErr("Fiyat geçersiz.");
      return;
    }

    try {
      const res = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          price: p,
          image_url: image_url.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(`Ekleme hatası: ${data?.error || "unknown_error"}`);
        return;
      }

      setName("");
      setPrice("");
      setImageUrl("");
      await fetchProducts();
      alert("✅ Ürün eklendi");
    } catch (e) {
      setErr("Ekleme hatası: network_error");
    }
  };

  return (
    <div className="container">
      <h1>DRESSERP Admin</h1>

      <div className="muted">
        API: <b>{API || "(VITE_API_BASE yok)"}</b>
      </div>
      <div className="muted">
        Durum:{" "}
        {apiOk === null
          ? "Kontrol ediliyor..."
          : apiOk
          ? "✅ API OK"
          : "❌ API erişilemiyor"}
      </div>

      <hr />

      <h2>Admin Login</h2>
      {!token ? (
        <div className="row">
          <input
            type="password"
            placeholder="Admin şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={login}>Giriş Yap</button>
          {loginMsg && <div className="msg">{loginMsg}</div>}
        </div>
      ) : (
        <div className="row">
          <div className="msg">✅ Token var (login OK)</div>
          <button onClick={logout}>Çıkış</button>
        </div>
      )}

      <hr />

      <h2>Ürün Ekle</h2>
      <div className="row">
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
          value={image_url}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button onClick={addProduct}>EKLE</button>
      </div>

      <hr />

      <h2>Ürünler</h2>
      <div className="row">
        <button onClick={fetchProducts}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {err && <div className="error">Hata: {err}</div>}

      <div className="list">
        {products.length === 0 ? (
          <div className="muted">Ürün yok.</div>
        ) : (
          products.map((p) => (
            <div className="card" key={p.id}>
              <div>
                <b>{p.name}</b>
              </div>
              <div className="muted">₺ {p.price}</div>
              {p.image_url ? (
                <a href={p.image_url} target="_blank" rel="noreferrer">
                  görsel
                </a>
              ) : (
                <span className="muted">görsel yok</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="footer">© 2026 Dresserp</div>
    </div>
  );
}