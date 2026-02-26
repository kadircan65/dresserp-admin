import { useEffect, useMemo, useState } from "react";

export default function App() {
  const API_BASE_RAW = import.meta.env.VITE_API_BASE || "";
  const [adminToken, setAdminToken] = useState(import.meta.env.VITE_ADMIN_TOKEN || "");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // --- URL builder: API_BASE "/api" ile bitse de bitmese de doğru endpoint üretir
  const api = useMemo(() => {
    const base = (API_BASE_RAW || "").trim().replace(/\/+$/, ""); // sondaki / temizle
    const hasApi = /\/api$/i.test(base);

    const withApi = hasApi ? base : `${base}/api`;

    const join = (path) => {
      const p = String(path || "").trim();
      if (!p.startsWith("/")) return `${withApi}/${p}`;
      return `${withApi}${p}`;
    };

    return { base, withApi, join };
  }, [API_BASE_RAW]);

  const authHeaders = () => {
    const t = (adminToken || "").trim();
    if (!t) return {};
    // Backend senin önceki ekranlarında x-admin-token bekliyor gibiydi
    return { "x-admin-token": t };
  };

  const fetchProducts = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(api.join("/products"), {
        method: "GET",
        headers: {
          ...authHeaders(),
        },
      });

      const txt = await res.text();
      if (!res.ok) {
        throw new Error(`Products alınamadı (${res.status}): ${txt}`);
      }

      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        throw new Error(`JSON parse edilemedi: ${txt}`);
      }

      // Backend bazen {products:[...]} bazen direkt [...] döndürüyor olabilir:
      const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
      setProducts(list);
      setMsg(`Ürünler geldi: ${list.length}`);
    } catch (e) {
      setError(e?.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    setError("");
    setMsg("");

    const n = name.trim();
    const p = Number(price);

    if (!n) return setError("Ürün adı boş olamaz.");
    if (!Number.isFinite(p) || p <= 0) return setError("Fiyat geçersiz.");
    if (!adminToken.trim()) return setError("ADMIN TOKEN boş. Token girmen lazım.");

    setLoading(true);
    try {
      const res = await fetch(api.join("/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: n,
          price: p,
          image: image.trim() || "",
        }),
      });

      const txt = await res.text();
      if (!res.ok) {
        throw new Error(`Ekleme başarısız (${res.status}): ${txt}`);
      }

      setMsg("Ürün eklendi.");
      setName("");
      setPrice("");
      setImage("");
      await fetchProducts();
    } catch (e) {
      setError(e?.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    setError("");
    setMsg("");

    if (!id) return setError("Silinecek ürün id yok.");
    if (!adminToken.trim()) return setError("ADMIN TOKEN boş. Token girmen lazım.");

    const ok = window.confirm("Bu ürünü silmek istediğine emin misin?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(api.join(`/products/${id}`), {
        method: "DELETE",
        headers: {
          ...authHeaders(),
        },
      });

      const txt = await res.text();
      if (!res.ok) {
        throw new Error(`Silme başarısız (${res.status}): ${txt}`);
      }

      setMsg("Ürün silindi.");
      await fetchProducts();
    } catch (e) {
      setError(e?.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // sayfa açılır açılmaz listeyi çek
    if (api.base) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api.withApi]);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>DressERP Admin</h1>

      <div style={{ marginBottom: 14, padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>API BASE</div>
            <input
              value={API_BASE_RAW}
              readOnly
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555", background: "#111", color: "#ddd" }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Çözülen base: <b>{api.withApi || "-"}</b>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>ADMIN TOKEN</div>
            <input
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="ADMIN TOKEN"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555", background: "#111", color: "#ddd" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => fetchProducts()} disabled={loading} style={btnStyle}>
                Yenile
              </button>
            </div>
          </div>
        </div>

        {loading && <div style={{ marginTop: 10, opacity: 0.85 }}>Yükleniyor...</div>}
        {msg && <div style={{ marginTop: 10, color: "#6ee7b7" }}>{msg}</div>}
        {error && <div style={{ marginTop: 10, color: "#fb7185", whiteSpace: "pre-wrap" }}>{error}</div>}
      </div>

      <div style={{ marginBottom: 14, padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <h2>Ürün Ekle</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ürün adı"
            style={inpStyle}
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Fiyat (örn 1500)"
            style={inpStyle}
          />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Resim URL (opsiyonel)"
            style={inpStyle}
          />
          <button onClick={addProduct} disabled={loading} style={btnStyle}>
            EKLE
          </button>
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <h2>Ürün Listesi ({products.length})</h2>

        {products.length === 0 ? (
          <div style={{ opacity: 0.8 }}>Liste boş (ya gerçekten boş ya da endpoint/token sorunu var).</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {products.map((p) => (
              <div key={p._id || p.id} style={{ border: "1px solid #555", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ opacity: 0.85 }}>ID: {p._id || p.id}</div>
                    <div style={{ opacity: 0.85 }}>Fiyat: {p.price}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10 }} />
                    ) : null}
                    <button
                      onClick={() => deleteProduct(p._id || p.id)}
                      disabled={loading}
                      style={{ ...btnStyle, background: "#2a0f14", borderColor: "#7f1d1d" }}
                    >
                      SİL
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.8 }}>
        Debug: products endpoint =&gt; <b>{api.join("/products")}</b>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #555",
  background: "#111",
  color: "#ddd",
  cursor: "pointer",
};

const inpStyle = {
  flex: 1,
  minWidth: 220,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #555",
  background: "#111",
  color: "#ddd",
};