// function ProfileModal({user,onClose,onLogout,companyLogo,onLogoChange}){
//   const logoRef = useRef();
//   const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
//   const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
//   return(
//     <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.6)",backdropFilter:"blur(10px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
//       <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(147,51,234,0.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

//         {/* TOP GRADIENT HEADER */}
//         <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7,#c084fc)",padding:"40px 32px 28px",textAlign:"center",position:"relative"}}>
//           <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.2)",border:"none",width:30,height:30,borderRadius:8,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
//           <div style={{width:76,height:76,borderRadius:"50%",background:"rgba(255,255,255,0.25)",border:"3px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,color:"#fff",margin:"0 auto 14px"}}>{initials}</div>
//           <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>{displayName}</h2>
//           <p style={{margin:"5px 0 0",fontSize:13,color:"rgba(255,255,255,0.7)"}}>{user?.email||"—"}</p>
//           <span style={{display:"inline-block",marginTop:10,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:100,padding:"3px 14px",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>{user?.role||"user"}</span>
//         </div>

//         <div style={{padding:"22px 28px"}}>

//           {/* ✅ COMPANY LOGO UPLOAD */}
//           <div style={{marginBottom:18,borderRadius:16,border:"1.5px solid #ede9fe",overflow:"hidden"}}>
//             <div style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)",padding:"10px 16px",borderBottom:"1px solid #ede9fe"}}>
//               <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:1}}>🏢 COMPANY LOGO</div>
//               <div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>Invoice-ல automatically வரும்</div>
//             </div>
//             <div style={{padding:16,display:"flex",alignItems:"center",gap:16}}>
//               {/* Logo box */}
//               <div
//                 onClick={()=>logoRef.current?.click()}
//                 style={{width:80,height:80,borderRadius:14,border:`2px dashed ${companyLogo?"#9333ea":"#c084fc"}`,background:companyLogo?"#f5f3ff":"#faf5ff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",flexShrink:0,transition:"all 0.2s"}}
//                 onMouseEnter={e=>e.currentTarget.style.borderColor="#9333ea"}
//                 onMouseLeave={e=>e.currentTarget.style.borderColor=companyLogo?"#9333ea":"#c084fc"}
//               >
//                 {companyLogo
//                   ?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:4}}/>
//                   :<>
//                     <span style={{fontSize:26}}>🖼️</span>
//                     <span style={{fontSize:9,color:"#a78bfa",marginTop:4,fontWeight:700,letterSpacing:0.5}}>CLICK TO UPLOAD</span>
//                   </>
//                 }
//               </div>

//               {/* Info */}
//               <div style={{flex:1}}>
//                 {companyLogo?(
//                   <>
//                     <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
//                       <span style={{width:18,height:18,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700,flexShrink:0}}>✓</span>
//                       <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>Logo uploaded!</span>
//                     </div>
//                     <div style={{fontSize:11,color:"#a78bfa",marginBottom:10}}>Invoice preview-ல உங்கள் logo வரும்</div>
//                     <div style={{display:"flex",gap:8}}>
//                       <button
//                         onClick={()=>logoRef.current?.click()}
//                         style={{fontSize:11,color:"#7c3aed",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}
//                       >🔄 Change</button>
//                       <button
//                         onClick={()=>onLogoChange(null)}
//                         style={{fontSize:11,color:"#ef4444",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}
//                       >✕ Remove</button>
//                     </div>
//                   </>
//                 ):(
//                   <>
//                     <div style={{fontSize:13,fontWeight:700,color:"#1e0a3c",marginBottom:4}}>Upload company logo</div>
//                     <div style={{fontSize:11,color:"#a78bfa",marginBottom:10,lineHeight:1.5}}>PNG or JPG • Invoice header-ல வரும் • Left-ஆ box-ஐ click பண்ணுங்க</div>
//                     <button
//                       onClick={()=>logoRef.current?.click()}
//                       style={{fontSize:12,color:"#fff",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:9,padding:"7px 16px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}
//                     >📤 Upload Logo</button>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* PROFILE INFO FIELDS */}
//           {[{icon:"👤",label:"Full Name",value:displayName},{icon:"📧",label:"Email",value:user?.email||"—"},{icon:"📱",label:"Phone",value:user?.phone||"—"},{icon:"🎭",label:"Role",value:user?.role||"user"},{icon:"🔑",label:"User ID",value:(user?.id||user?._id)?`#${String(user?.id||user?._id).slice(-8).toUpperCase()}`:"—"}].map(({icon,label,value})=>(
//             <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#faf5ff",borderRadius:10,border:"1px solid #ede9fe",marginBottom:8}}>
//               <div style={{width:34,height:34,borderRadius:9,background:"rgba(147,51,234,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icon}</div>
//               <div>
//                 <div style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</div>
//                 <div style={{fontSize:14,fontWeight:600,color:"#1e0a3c",marginTop:1}}>{value}</div>
//               </div>
//             </div>
//           ))}

//           {/* BUTTONS */}
//           <div style={{display:"flex",gap:10,marginTop:16}}>
//             <button onClick={onClose} style={{flex:1,padding:"11px",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:10,fontSize:14,fontWeight:600,color:"#1e0a3c",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
//             <button onClick={onLogout} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
//           </div>
//         </div>

//         {/* Hidden file input */}
//         <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}}
//           onChange={e=>{
//             const file=e.target.files[0];
//             if(!file)return;
//             const reader=new FileReader();
//             reader.onload=ev=>onLogoChange(ev.target.result);
//             reader.readAsDataURL(file);
//           }}/>
//       </div>
//     </div>
//   );
// }
