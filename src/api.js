// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE eksik! .env veya Vercel Environment Variables kontrol et.");
}

const joinUrl = (base, path) => {
  const b = String(base).replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return `${b}/${p}`;
};

export const healthCheck = async () => {
  const r = await fetch(joinUrl(API_BASE, "health"));
  if (!r.ok) throw new Error("Health failed");
  return r.json();
};

export const getProducts = async () => {
  const r = await fetch(joinUrl(API_BASE, "api/products"));
  if (!r.ok) throw new Error("Products failed");
  return r.json();
};

export const addProduct = async (payload, adminToken) => {
  const r = await fetch(joinUrl(API_BASE, "api/products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { "x-admin-token": adminToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Add failed");
  return data;
};