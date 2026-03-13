import { useState } from "react";
import axios from "axios";

const T = {
  primary:"#3b0764",
  accent:"#9333ea",
  text:"#1e0a3c",
  muted:"#7c3aed",
  border:"#ede9fe",
  bg:"#f5f3ff",
};

export default function AuthPage({ setUser }) {

  const [mode,setMode] = useState("login");

  const [form,setForm] = useState({
    name:"",
    email:"",
    password:"",
    phone:"",
    logo:""
  });

  const [logoFile,setLogoFile] = useState(null);

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  const handleLogoChange = (e)=>{
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e)=>{
    e.preventDefault();

    setLoading(true);
    setError("");

    try{

      let logoUrl="";

      // 🔹 Upload logo first
      if(mode==="register" && logoFile){

        const fd = new FormData();
        fd.append("logo",logoFile);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/upload/logo",
          fd
        );

        logoUrl = uploadRes.data.logoUrl;
      }

      const url =
        mode==="login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/signup";

      const data =
        mode==="login"
        ? {email:form.email,password:form.password}
        : {...form,logo:logoUrl};

      const res = await axios.post(url,data);

      localStorage.setItem("user",JSON.stringify(res.data.user));

      setUser(res.data.user);

    }catch(err){

      console.log(err.response?.data);
      setError(err.response?.data?.msg || "Login failed");

    }

    setLoading(false);

  };

  const inp={
    width:"100%",
    padding:"11px 14px",
    border:"1.5px solid #ede9fe",
    borderRadius:10,
    fontSize:14,
    color:T.text,
    background:"#faf5ff",
    outline:"none",
    marginBottom:12
  };

  return(

<div style={{
  minHeight:"100vh",
  background:"linear-gradient(135deg,#f5f3ff,#faf5ff,#f3e8ff)",
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  fontFamily:"sans-serif"
}}>

<div style={{
  background:"#fff",
  borderRadius:24,
  padding:"40px",
  width:"100%",
  maxWidth:420,
  boxShadow:"0 24px 60px rgba(147,51,234,0.15)"
}}>

<h2 style={{textAlign:"center",marginBottom:20}}>
M Business Suite
</h2>

<div style={{display:"flex",marginBottom:20}}>

<button
onClick={()=>setMode("login")}
style={{flex:1,padding:10}}
>
Login
</button>

<button
onClick={()=>setMode("register")}
style={{flex:1,padding:10}}
>
Register
</button>

</div>

<form onSubmit={handleSubmit}>

{mode==="register" && (
<input
placeholder="Full Name"
value={form.name}
onChange={e=>setForm({...form,name:e.target.value})}
style={inp}
/>
)}

<input
placeholder="Email"
value={form.email}
onChange={e=>setForm({...form,email:e.target.value})}
style={inp}
/>

{mode==="register" && (
<input
placeholder="Phone"
value={form.phone}
onChange={e=>setForm({...form,phone:e.target.value})}
style={inp}
/>
)}

<input
type="password"
placeholder="Password"
value={form.password}
onChange={e=>setForm({...form,password:e.target.value})}
style={inp}
/>

{/* 🔹 LOGO UPLOAD */}

{mode==="register" && (
<input
type="file"
accept="image/*"
onChange={handleLogoChange}
style={{marginBottom:15}}
/>
)}

{error && (
<div style={{color:"red",marginBottom:10}}>
{error}
</div>
)}

<button
type="submit"
disabled={loading}
style={{
width:"100%",
padding:12,
background:"#9333ea",
color:"#fff",
border:"none",
borderRadius:10,
fontWeight:700
}}
>

{loading
? "Please wait..."
: mode==="login"
? "Login"
: "Create Account"
}

</button>

</form>

</div>

</div>

  );

}