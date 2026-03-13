// import React from "react";
// import theme from "../config/theme";

// export default function Button({ text, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         width: "100%",
//         padding: theme.spacing.medium,
//         marginTop: theme.spacing.medium,
//         border: "none",
//         borderRadius: theme.borderRadius,
//         background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
//         color: theme.colors.buttonText,
//         fontWeight: "bold",
//         fontSize: "16px",
//         cursor: "pointer",
//         transition: "all 0.3s ease",
//         boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
//       }}
//       onMouseEnter={(e) =>
//         (e.target.style.transform = "translateY(-3px) scale(1.02)")
//       }
//       onMouseLeave={(e) => (e.target.style.transform = "translateY(0) scale(1)")}
//     >
//       {text}
//     </button>
//   );
// }