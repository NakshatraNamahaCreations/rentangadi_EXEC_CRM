// import React, { useState } from "react";
// import Services from "./Master/Services";
// import Packages from "./Master/Packages";
// import Category from "./Master/Category";
// import Equipment from "./Master/Equipment";
// import PresetQuotation from "./Master/PresetQuotation";


// const Master = () => {
//   const [activeTab, setActiveTab] = useState("category");


//   const renderContent = () => {
//     switch (activeTab) {

//       case "subcategory":
//         return <Services />;
//       default:
//         return <Category />;
//     }
//   };

//   return (
//     <div className="container py-2 rounded " style={{ background: "#F4F4F4"  }} >
//       <div className="d-flex gap-3 mb-4">
//         <button
//           className={`btn rounded-1 shadow-sm  w-25 ${activeTab === "category" ? "btn-dark" : "btn-white"}`}
//           onClick={() => setActiveTab("category")}
//           style={{ fontSize: "12px" }}
//         >
//           Category
//         </button>
//         <button
//           className={`btn rounded-1 shadow-sm  w-25 ${activeTab === "subcategory" ? "btn-dark" : "btn-white"}`}
//           onClick={() => setActiveTab("subcategory")}
//           style={{ fontSize: "12px" }}
//         >
//           Sub Category
//         </button>
//       </div>
//       <div>{renderContent()}</div>
//     </div>
//   );
// };

// export default Master;


import React, { useState } from "react";

import Category from "./Master/Category";
import SubCategory from "./Master/SubCategory";


const Master = () => {
  const [activeTab, setActiveTab] = useState("category");

  const renderContent = () => {
    switch (activeTab) {
      case "subcategory":
        return <SubCategory />;
      default:
        return <Category />;
    }
  };

  return (
    <div className="px-2 py-2 rounded" style={{ background: "#F4F4F4" }}>
      <div className="d-flex gap-3 mb-4">
        <button
          className={`btn rounded-5 shadow-sm w-25 ${activeTab === "category" ? "btn-custom text-white" : "btn-outline-custom"}`}
          onClick={() => setActiveTab("category")}
          style={{
            fontSize: "14px",
            // padding: "10px",
            transition: "all 0.3s ease",
            borderRadius: "8px",
            backgroundColor: activeTab === "category" ? "#BD5525" : "transparent",
            color: activeTab === "category" ? "#fff" : "#323D4F",
            borderColor: "#ccc", // Light border for inactive tabs
          }}
        >
          Category
        </button>
        <button
          className={`btn rounded-5 shadow-sm w-25 ${activeTab === "subcategory" ? "btn-custom text-white" : "btn-outline-custom"}`}
          onClick={() => setActiveTab("subcategory")}
          style={{
            fontSize: "14px",
            // padding: "10px",
            transition: "all 0.3s ease",
            borderRadius: "8px",
            backgroundColor: activeTab === "subcategory" ? "#BD5525" : "transparent",
            color: activeTab === "subcategory" ? "#fff" : "#323D4F",
            borderColor: "#ccc", // Light border for inactive tabs
          }}
        >
          Sub Category
        </button>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default Master;
