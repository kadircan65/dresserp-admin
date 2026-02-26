import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  // API URL + Token'ı kalıcı tutalım
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem("API_URL") ||
      import.meta.env.VITE_API_BASE ||
      "http://localhost:3000"
  );

  const [token, setToken] = useState(localStorage.getItem("ADMIN_TOKEN") || "");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [logs, setLogs] = useState("");

  const API_BASE = useMemo(() => (apiUrl || "").replace(/\/+$/, ""), [apiUrl]);

  function saveSettings() {
    localStorage.setItem("API_URL", apiUrl);
    localStorage.setItem("ADMIN_TOKEN", token);
    setLogs((p) => p + `\n✅ Ayarlar kaydedildi. API_BASE=${API_BASE}\n`);
  }

  function resetSettings() {
    localStorage.removeItem("API_URL");
    localStorage.removeItem("ADMIN_TOKEN");
    setApiUrl(import.meta.env.VITE_API_BASE || "http://localhost:3000");
    setToken("");
    setLogs((p) => p + "\n🧹 Ayarlar sıfırlandı.\n");
  }

  // Header: backend tarafında ne isimle kontrol ediyorsan onu kullan.
  // Ben en yaygın olanı koydum: x-admin-token
  function buildHeaders(extra = {}) {
    const h = {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {}),
      ...extra,
    };
    return h;
  }

  async function safeReadText(res) {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }

  function looksLikeHtml(txt) {
    if (!txt) return false;
    const t = txt.trim().toLowerCase();
    return t.startsWith("<!doctype html") || t.startsWith("<html");
  }

  // ---- AKILLI REQUEST ----
  // Önce /products dener, 404 gelirse otomatik /api/products dener.
  async function apiRequest(path, options = {}) {
    const tryUrls = [
      `${API_BASE}${path}`,
      `${API_BASE}/api${path}`, // fallback
    ];

    let last = null;

    for (const url of tryUrls) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: buildHeaders(options.headers || {}),
        });

        // 404 ise bir sonraki denemeye geç (özellikle /products vs /api/products farkı için)
        if (res.status === 404) {
          const txt404 = await safeReadText(res);
          // HTML 404 veya JSON 404 fark etmez, fallback deneyeceğiz
          last = { res, bodyText: txt404, url };
          continue;
        }

        // başarılı veya başka hata: buradan döndür
        const txt = await safeReadText(res);
        return { res, bodyText: txt, url };
      } catch (e) {
        last = { err: e, url };
        // network error ise diğer url'i de deneyelim
        continue;
      }
    }

    // Hepsi başarısız
    if (last?.err) throw last.err;

    // 404'lerden geldiysek elimizde bodyText var
    return last;
  }

  async function fetchProducts() {
    setError("");
    setLoading(true);
    try {
      const { res, bodyText, url } = await apiRequest("/products", {
        method: "GET",
      });

      if (!res || !res.ok) {
        const msg = `❌ Ürün çekme başarısız (${res?.status || "?"}) via ${url}\n${bodyText || ""}`;
        setError(msg);
        setLogs((p) => p + "\n" + msg + "\n");
        return;
      }

      if (looksLikeHtml(bodyText)) {
        const msg = `❌ Backend HTML döndürdü. Yanlış endpoint olabilir.\nvia ${url}\n${bodyText.slice(0, 120)}...`;
        setError(msg);
        setLogs((p) => p + "\n" + msg + "\n");
        return;
      }

      const data = bodyText ? JSON.parse(bodyText) : [];
      const list = Array.isArray(data) ? data : data.products || [];
      setProducts(list);
      setLogs((p) => p + `\n✅ Ürünler geldi (${list.length}) via ${url}\n`);
    } catch (e) {
      const msg = `❌ fetchProducts hata: ${String(e)}`;
      setError(msg);
      setLogs((p) => p + "\n" + msg + "\n");
    } finally {
      setLoading(false);
    }
  }

  async function addProduct() {
    setError("");
    if (!name.trim()) return setError("❗ Ürün adı boş olamaz.");
    if (!price || isNaN(Number(price))) return setError("❗ Fiyat sayısal olmalı.");

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        imageUrl: imageUrl.trim() || undefined,
      };

      const { res, bodyText, url } = await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        const msg = `❌ Ürün ekleme başarısız (${res?.status || "?"}) via ${url}\n${bodyText || ""}`;
        setError(msg);
        setLogs((p) => p + "\n" + msg + "\n");
        return;
      }

      setName("");
      setPrice("");
      setImageUrl("");
      setLogs((p) => p + `\n✅ Ürün eklendi via ${url}\n`);
      await fetchProducts();
    } catch (e) {
      const msg = `❌ addProduct hata: ${String(e)}`;
      setError(msg);
      setLogs((p) => p + "\n" + msg + "\n");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id) {
    setError("");
    setBusyId(id);

    try {
      const { res, bodyText, url } = await apiRequest(`/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res || !res.ok) {
        const msg = `❌ Silme başarısız (${res?.status || "?"}) via ${url}\n${bodyText || ""}`;
        setError(msg);
        setLogs((p) => p + "\n" + msg + "\n");
        return;
      }

      setLogs((p) => p + `\n🗑️ Silindi: id=${id} via ${url}\n`);
      await fetchProducts();
    } catch (e) {
      const msg = `❌ deleteProduct hata: ${String(e)}`;
      setError(msg);
      setLogs((p) => p + "\n" + msg + "\n");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basit stil
  const box = {
    maxWidth: 900,
    margin: "20px auto",
    padding: 16,
    border: "1px solid #444",
    borderRadius: 12,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  };

  const row = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
  const input = {
    flex: "1 1 260px",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #555",
    background: "#111",
    color: "#fff",
  };
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #666",
    background: "#1b1b1b",
    color: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>DresserP Admin</h2>

      <div style={{ ...row, marginBottom: 10 }}>
        <input
          style={input}
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="API URL (örn: https://...up.railway.app)"
        />
        <input
          style={input}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN TOKEN"
        />
        <button style={btn} onClick={saveSettings}>
          Kaydet
        </button>
        <button style={btn} onClick={resetSettings}>
          Yenile
        </button>
      </div>

      {error ? (
        <div style={{ color: "#ff6b6b", whiteSpace: "pre-wrap", marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <div style={{ borderTop: "1px solid #333", paddingTop: 12, marginTop: 12 }}>
        <h3>Ürün Ekle</h3>
        <div style={row}>
          <input
            style={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ürün adı"
          />
          <input
            style={input}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Fiyat (örn: 1500)"
          />
          <input
            style={input}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Resim URL (opsiyonel)"
          />
          <button style={btn} onClick={addProduct} disabled={loading}>
            {loading ? "Bekle..." : "EKLE"}
          </button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #333", paddingTop: 12, marginTop: 12 }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Ürün Listesi ({products.length})</h3>
          <button style={btn} onClick={fetchProducts} disabled={loading}>
            {loading ? "Yükleniyor..." : "Listeyi Yenile"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {products.map((p) => (
            <div
              key={p.id ?? p._id ?? JSON.stringify(p)}
              style={{
                border: "1px solid #333",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ opacity: 0.85 }}>
                  ID: {p.id ?? p._id} · Fiyat: {p.price}
                </div>
                {p.imageUrl ? (
                  <div style={{ marginTop: 6 }}>
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 10 }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <button
                style={{
                  ...btn,
                  borderColor: "#ff6b6b",
                  opacity: busyId === (p.id ?? p._id) ? 0.6 : 1,
                }}
                disabled={busyId === (p.id ?? p._id)}
                onClick={() => deleteProduct(p.id ?? p._id)}
              >
                {busyId === (p.id ?? p._id) ? "Siliniyor..." : "SİL"}
              </button>
            </div>
          ))}
          {products.length === 0 ? (
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              Liste boş (ya gerçekten boş, ya da endpoint sorunu var).
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #333", paddingTop: 12, marginTop: 12 }}>
        <h3>Log</h3>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#0b0b0b",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 12,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {logs || "(log yok)"}
        </pre>
      </div>
    </div>
  );
}