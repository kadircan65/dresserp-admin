import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

function App() {

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  // Ürünleri yükle
  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }

    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Ürün ekle
  const addProduct = async () => {

    if (!name || !price) return;

    await fetch(`${API}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN
      },
      body: JSON.stringify({
        name,
        price: Number(price)
      })
    });

    setName("");
    setPrice("");
    loadProducts();
  };

  // Ürün sil
  const deleteProduct = async (id) => {

    await fetch(`${API}/admin/products/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-token": ADMIN_TOKEN
      }
    });

    loadProducts();
  };

  return (
    <div style={{padding:20}}>

      <h1>DRESSERP ADMIN</h1>

      <h2>Ürün Ekle</h2>

      <input
        placeholder="Ürün adı"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        placeholder="Fiyat"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <button onClick={addProduct}>
        EKLE
      </button>

      <h2>Ürün Listesi</h2>

      {products.map(p => (
        <div key={p.id}>
          {p.name} - {p.price}
          <button onClick={() => deleteProduct(p.id)}>
            Sil
          </button>
        </div>
      ))}

    </div>
  );
}

export default App;