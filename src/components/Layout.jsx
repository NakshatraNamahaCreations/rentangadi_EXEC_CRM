import { useState } from "react";
import Sidebars from "./Sidebars";
import Header from "./Header";

function Layout({ children, handleLogout, roles }) {
  // Convert roles object to array of kebab-case keys
  const userAccess = Object.entries(roles || {}).reduce((acc, [key, value]) => {
    if (value) {
      const kebabKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      acc.push(kebabKey);
    }
    return acc;
  }, []);

  return (
    <>
      <div className="d-flex hide-scrollbar ">
        <Sidebars />
        <div style={{ flex: 1, marginLeft: "210px" }}>
          <Header />
          <div className="px-4">{children}</div>
        </div>
      </div>
    </>
  );
};

export default Layout;
