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
        <div className="col-md-2">
          <Sidebars />
        </div>
        <div className="col-md-10">
          <div className="flex-grow-1 ms-5" style={{ marginLeft: "320px" }}>
            <Header />
            <div className="px-4">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
