function getNavForRole(role) {
  const r = (role || "").toLowerCase().trim();

  if (r === "subadmin" || r === "sub_admin" || r === "sub-admin" || r === "subadmin") {
    return NAV.filter(n =>
      ["dashboard","clients","projects","invoices",
       "tracking","tasks","calendar","reports"].includes(n.key)
    );
  }
  if (r === "manager") {
    return NAV.filter(n =>
      ["dashboard","projects","tracking","tasks","calendar","reports"].includes(n.key)
    );
  }
  if (r === "employee") {
    return NAV.filter(n =>
      ["dashboard","tasks","calendar"].includes(n.key)
    );
  }
  return NAV;
}