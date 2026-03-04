import { useState } from "react";

const API = import.meta.env.VITE_API_BASE;
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

export default function App() {

  const [password,setPassword] = useState("");
  const [token,setToken] = useState("");
  const [name,setName] = useState("");
  const [price,setPrice] = useState("");
  const [image,setImage] = useState("");

  const login = async () => {

    const res = await fetch(`${API}/api/admin/login`,{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify({ password })
    });

    const data = await res.json();

    if(data.token){
      setToken(data.token);
      alert("Login OK");
    }else{
      alert("Login failed");
    }

  };

  const addProduct = async () => {

    await fetch(`${API}/api/products`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify({
        name,
        price,
        image_url:image
      })
    });

    alert("Ürün eklendi");

  };

  return (

    <div style={{padding:40,fontFamily:"Arial"}}>

      <h1>DRESSERP Admin</h1>

      <h2>Admin Login</h2>

      <input
        placeholder="Admin şifre"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button onClick={login}>
        Giriş Yap
      </button>

      <hr/>

      <h2>Ürün Ekle</h2>

      <input
        placeholder="Ürün adı"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <input
        placeholder="Fiyat"
        value={price}
        onChange={(e)=>setPrice(e.target.value)}
      />

      <input
        placeholder="Görsel URL"
        value={image}
        onChange={(e)=>setImage(e.target.value)}
      />

      <button onClick={addProduct}>
        EKLE
      </button>

    </div>

  );
}