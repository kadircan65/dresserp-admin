import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API;

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      if (!res.ok) throw new Error("API hata verdi");

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Ürünler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Ürünler yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dresserp</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
        gap: 20
      }}>
        {products.map((p) => (
          <div
            key={p._id}
            style={{
              border: "1px solid #ddd",
              padding: 15,
              borderRadius: 10
            }}
          >
            {p.image && (
              <img
                src={p.image}
                alt={p.name}
                style={{
                  width: "100%",
                  height: 250,
                  objectFit: "cover",
                  borderRadius: 6
                }}
              />
            )}

            <h3>{p.name}</h3>

            <p>{p.price} ₺</p>

            {p.image && (
              <a
                href={p.image}
                target="_blank"
                rel="noreferrer"
              >
                Detay
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}