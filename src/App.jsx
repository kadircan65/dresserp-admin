import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_BASE;
const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || "";

function getStoreFromQuery() {
  const p = new URLSearchParams(window.location.search);
  return (p.get("store") || "").trim().toLowerCase();
}

export default function App() {
  const [apiStatus, setApiStatus] = useState(false);

  const [store, setStore] = useState(getStoreFromQuery() || "main");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [tokenStore, setTokenStore] = useState(localStorage.getItem("admin_store") || "");

  const [storeName, setStoreName] = useState("");
  const [whats, setWhats] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  // yeni mağaza oluşturma
  const [newSlug, setNewSlug] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newWhats, setNewWhats] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isAuthed = useMemo(() => !!token && tokenStore === store, [token, tokenStore, store]);

  const api = (path) => `${API}${path}`;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (store) url.searchParams.set("store", store);
    else url.searchParams.delete("store");
    window.history.replaceState({}, "", url.toString());
  }, [store]);

  useEffect(() => {
    checkApi();
    if (store) {
      fetchStore();
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkApi() {
    try {
      const r = await fetch(`${API}/health`);
      setApiStatus(r.ok);
    } catch {
      setApiStatus(false);
    }
  }

  async function fetchStore() {
    if (!store) return;

    try {
      const r = await fetch(api(`/api/s/${store}/store`));
      const data = await r.json();

      if (!r.ok) {
        setMsg(`Store hata: ${data?.error || r.status}`);
        return;
      }

      setStoreName(data.store_name || "");
      setWhats(data.whatsapp_number || "");
    } catch {
      setMsg("Store fetch failed");
    }
  }

  async function fetchProducts() {
    if (!store) return;

    try {
      const r = await fetch(api(`/api/s/${store}/products`));
      const data = await r.json();

      if (!r.ok) {
        setMsg(`Ürün hata: ${data?.error || r.status}`);
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Products fetch failed");
    }
  }

  async function loadStore() {
    setMsg("");
    await checkApi();
    await fetchStore();
    await fetchProducts();
  }

  async function createStore() {
    setMsg("");

    try {
      const r = await fetch(api(`/api/s/create`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-master-key": MASTER_KEY,
        },
        body: JSON.stringify({
          slug: newSlug,
          store_name: newStoreName,
          whatsapp_number: newWhats,
          admin_password: newPassword,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        setMsg(`Mağaza oluşturma hata: ${data?.error || r.status}`);
        return;
      }

      setMsg(`Mağaza oluşturuldu ✅ slug: ${data.store.slug}`);
      setStore(data.store.slug);

      setNewSlug("");
      setNewStoreName("");
      setNewWhats("");
      setNewPassword("");

      await checkApi();
      await fetchStore();
      await fetchProducts();
    } catch {
      setMsg("Mağaza oluşturma failed");
    }
  }

  async function login() {
    setMsg("");

    try {
      const r = await fetch(api(`/api/s/${store}/admin/login`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await r.json();

      if (!r.ok) {
        setMsg(`Login hata: ${data?.error || r.status}`);
        return;
      }

      setToken(data.token);
      setTokenStore(store);
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_store", store);

      setMsg("Login OK ✅");
    } catch {
      setMsg("Login failed");
    }
  }

  function logout() {
    setToken("");
    setTokenStore("");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_store");
    setMsg("Çıkış yapıldı");
  }

  async function saveStoreSettings() {
    setMsg("");
    if (!isAuthed) {
      setMsg("Önce login ol");
      return;
    }

    try {
      const r = await fetch(api(`/api/s/${store}/store`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          store_name: storeName,
          whatsapp_number: whats,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        setMsg(`Ayar kaydetme hata: ${data?.error || r.status}`);
        return;
      }

      setStoreName(data.store_name || "");
      setWhats(data.whatsapp_number || "");
      setMsg("Ayarlar kaydedildi ✅");
    } catch {
      setMsg("Ayar kaydetme failed");
    }
  }

  async function addProduct() {
    setMsg("");
    if (!isAuthed) {
      setMsg("Önce login ol");
      return;
    }

    try {
      const r = await fetch(api(`/api/s/${store}/products`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price,
          image_url: imageUrl,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        setMsg(`Ürün ekleme hata: ${data?.error || r.status}`);
        return;
      }

      setName("");
      setPrice("");
      setImageUrl("");
      setMsg("Ürün eklendi ✅");

      await fetchProducts();
    } catch {
      setMsg("Ürün ekleme failed");
    }
  }

  return (
    <div className="wrap">
      <h1>DRESSERP Admin</h1>
      <div className="sub">API: {API}</div>
      <div className="sub">Durum: {apiStatus ? "✅ API erişiliyor" : "❌ API erişilemiyor"}</div>

      <hr />

      <div className="card">
        <h2>Yeni Mağaza Oluştur</h2>
        <div className="row">
          <input
            placeholder="slug (örn omurhobi)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.trim().toLowerCase())}
          />
          <input
            placeholder="mağaza adı"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
          />
        </div>

        <div className="row">
          <input
            placeholder="whatsapp (905...)"
            value={newWhats}
            onChange={(e) => setNewWhats(e.target.value)}
          />
          <input
            type="password"
            placeholder="admin şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={createStore}>Mağaza Aç</button>
        </div>
      </div>

      <hr />

      <div className="card">
        <h2>Admin Login</h2>
        <div className="row">
          <input
            placeholder="store slug"
            value={store}
            onChange={(e) => setStore(e.target.value.trim().toLowerCase())}
          />
          <button onClick={loadStore}>Yükle</button>
        </div>

        <div className="row">
          <input
            type="password"
            placeholder="admin şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={login}>Giriş Yap</button>
          <button onClick={logout}>Çıkış</button>
        </div>

        <div className="sub">{isAuthed ? "✅ Giriş var" : "⛔ Giriş yok"}</div>
      </div>

      <hr />

      <div className="card">
        <h2>Mağaza Ayarları</h2>
        <div className="row">
          <input
            placeholder="mağaza adı"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <input
            placeholder="whatsapp"
            value={whats}
            onChange={(e) => setWhats(e.target.value)}
          />
          <button onClick={saveStoreSettings}>Kaydet</button>
        </div>
      </div>

      <hr />

      <div className="card">
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
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <button onClick={addProduct}>EKLE</button>
        </div>
      </div>

      <hr />

      <div className="card">
        <h2>Ürünler</h2>
        <button onClick={fetchProducts}>Yenile</button>

        <div className="list">
          {items.length === 0 ? (
            <p>Ürün yok.</p>
          ) : (
            items.map((p) => (
              <div key={p.id} className="item">
                <div><b>{p.name}</b></div>
                <div>{Number(p.price).toLocaleString("tr-TR")} ₺</div>
                <div>{p.image_url ? "görsel var" : "görsel yok"}</div>
                <div>store_id: {p.store_id}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {msg ? <div className="msg">{msg}</div> : null}
    </div>
  );
}