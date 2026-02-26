import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  // 1) API URL (Vercel/Vite env varsa onu kullan, yoksa Railway backend'e düş)
  const API_BASE = useMemo(() => {
    return (
      import.meta?.env?.VITE_API_URL ||
      "https://dresserp-backend-production.up.railway.app"
    );
  }, []);

  // 2) Token (env varsa al, yoksa localStorage’dan al, yoksa kullanıcı girsin)
  const [token, setToken] = useState(() => {
    return (
      import.meta?.env?.VITE_ADMIN_TOKEN ||
      localStorage.getItem("ADMIN_TOKEN") ||
      ""
    );
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  function authHeaders(extra = {}) {
    return {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...extra,
    };
  }

  async function fetchProducts() {
    setError("");
    setOkMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(
          `Products alınamadı (${res.status}). ${txt || "Token/URL kontrol et."}`
        );
      }

      const data = await res.json();
      // Backend array dönüyorsa direkt, {rows:[]} dönüyorsa onu al
      const list = Array.isArray(data) ? data : data?.rows || [];
      setProducts(list);
    } catch (e) {
      setError(e.message || "Bir hata oldu.");
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    setError("");
    setOkMsg("");

    const trimmed = name.trim();
    if (!trimmed) return setError("Ürün adı boş olamaz.");

    // fiyatı sayıya çevir
    const priceNum = Number(String(price).replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return setError("Fiyat sayı olmalı ve 0'dan büyük olmalı.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: trimmed,
          price: priceNum,
          image: image.trim() || null,
        }),
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(
          `Ekleme başarısız (${res.status}). ${txt || "Token/DB kontrol et."}`
        );
      }

      setName("");
      setPrice("");
      setImage("");
      setOkMsg("✅ Ürün eklendi.");

      await fetchProducts();
    } catch (e) {
      setError(e.message || "Ekleme sırasında hata oldu.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    setError("");
    setOkMsg("");

    if (!id && id !== 0) return setError("Silinecek ürün id bulunamadı.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(
          `Silme başarısız (${res.status}). ${txt || "Token/ID kontrol et."}`
        );
      }

      setOkMsg("🗑️ Ürün silindi.");
      await fetchProducts();
    } catch (e) {
      setError(e.message || "Silme sırasında hata oldu.");
    } finally {
      setLoading(false);
    }
  }

  function saveToken() {
    localStorage.setItem("ADMIN_TOKEN", token);
    setOkMsg("🔐 Token kaydedildi.");
    setError("");
  }

  useEffect(() => {
    // Token varsa otomatik çek
    if (token) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, API_BASE]);

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h2>Dresserp Admin</h2>

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ minWidth: 95 }}>API URL</label>
          <input
            value={API_BASE}
            readOnly
            style={{ flex: 1, minWidth: 280, padding: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
          <label style={{ minWidth: 95 }}>ADMIN TOKEN</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="x-admin-token değeri"
            style={{ flex: 1, minWidth: 280, padding: 8 }}
          />
          <button onClick={saveToken} style={{ padding: "8px 12px" }}>
            Kaydet
          </button>
          <button onClick={fetchProducts} style={{ padding: "8px 12px" }}>
            Yenile
          </button>
        </div>

        {error ? (
          <div style={{ marginTop: 10, color: "crimson" }}>❌ {error}</div>
        ) : null}
        {okMsg ? (
          <div style={{ marginTop: 10, color: "green" }}>{okMsg}</div>
        ) : null}
        {loading ? (
          <div style={{ marginTop: 10 }}>⏳ İşleniyor...</div>
        ) : null}
      </div>

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>Ürün Ekle</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="Ürün adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Fiyat (örn: 1500)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Resim URL (opsiyonel)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            style={{ padding: 8 }}
          />
          <button onClick={addProduct} style={{ padding: "10px 12px", width: 160 }}>
            EKLE
          </button>
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>Ürün Listesi ({products.length})</h3>

        {products.length === 0 ? (
          <div>Liste boş (ya gerçekten boş ya da yetki/endpoint sorunu var).</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 10,
                  border: "1px solid #eee",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}

                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ opacity: 0.8 }}>
                      ID: {p.id} · Fiyat: {p.price}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    padding: "8px 12px",
                    background: "#ffe6e6",
                    border: "1px solid #ffb3b3",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  SİL
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// küçük yardımcı: hata body’sini patlatmadan oku
async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}