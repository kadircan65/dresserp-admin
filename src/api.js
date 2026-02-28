const BASE = import.meta.env.VITE_API_URL;

if (!BASE) {
  throw new Error("VITE_API_URL yok. dresserp-admin/.env dosyasını kontrol et.");
}

export const healthCheck = async () => {
  const r = await fetch(`${BASE}/health`);
  if (!r.ok) throw new Error("Health failed");
  return r.json();
};

export const getProducts = async () => {
  const r = await fetch(`${BASE}/api/products`);
  if (!r.ok) throw new Error("Products failed");
  return r.json();
};

export const addProduct = async (payload) => {
  const r = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Add failed");
  return data;
};