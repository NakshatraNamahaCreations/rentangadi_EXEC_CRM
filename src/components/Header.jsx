// import { useEffect, useState, useRef } from "react";
// import { useLocation, matchPath, useNavigate } from "react-router-dom";
// import {
//   FaUserCircle,
//   FaArrowLeft,
//   FaSignOutAlt,
//   FaUser,
// } from "react-icons/fa";
// import { Button, Card } from "react-bootstrap";

// const Header = () => {
//   const location = useLocation();
//   const [currentTab, setCurrentTab] = useState("Dashboard");
//   const [showUserCard, setShowUserCard] = useState(false);
//   const userCardRef = useRef(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (userCardRef.current && !userCardRef.current.contains(event.target)) {
//         setShowUserCard(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     const path = location.pathname;
//     // Using matchPath to match dynamic paths
//     if (matchPath("/dashboard", path)) {
//       setCurrentTab("Dashboard");
//     } else if (matchPath("/master", path)) {
//       setCurrentTab("Master");
//     } else if (matchPath("/banner", path)) {
//       setCurrentTab("Banner");
//     } else if (matchPath("/customer", path)) {
//       setCurrentTab("Customer");
//     } else if (matchPath("/quotation", path)) {
//       setCurrentTab("Quotation");
//     } else if (matchPath("/booking", path)) {
//       setCurrentTab("Booking");
//     } else if (matchPath("/vendors", path)) {
//       setCurrentTab("Vendors");
//     } else if (matchPath("/inventory", path)) {
//       setCurrentTab("Inventory");
//     } else if (matchPath("/payment", path)) {
//       setCurrentTab("Payment");
//     } else if (matchPath("/post-production", path)) {
//       setCurrentTab("Post Production");
//     } else if (matchPath("/booking/booking-details/:id", path)) {
//       setCurrentTab("Booking Details");
//     } else if (matchPath("/vendors/vendor-assign/:id", path)) {
//       setCurrentTab("Vendor Assign");
//     } else if (matchPath("/booking/finished-events", path)) {
//       setCurrentTab("Finished Events");
//     } else if (matchPath("/booking/calender-events", path)) {
//       setCurrentTab("Calendar Events");
//     } else if (matchPath("/customer/addLeads", path)) {
//       setCurrentTab("Add Leads");
//     } else if (matchPath("/customer/leadsDetails/:id", path)) {
//       setCurrentTab("Leads Details");
//     } else if (matchPath("/customer/editleads-details/:id", path)) {
//       setCurrentTab("Edit Leads Details");
//     } else if (matchPath("/customer/create-quote/:id", path)) {
//       setCurrentTab("Create Quotation");
//     } else if (matchPath("/customer/quote/:id", path)) {
//       setCurrentTab("Quotation Payments");
//     } else if (matchPath("/customer/final-quotation/:id", path)) {
//       setCurrentTab("Final Quotation");
//     } else if (matchPath("/customer/editleads-details/:id", path)) {
//       setCurrentTab("Edit Leads Details");
//     } else if (matchPath("/vendors/assign/:id", path)) {
//       setCurrentTab("Assign");
//     } else if (matchPath("/inventory/inventory-list", path)) {
//       setCurrentTab("Inventory List");
//     } else if (matchPath("/inventory/add-inventory", path)) {
//       setCurrentTab("Add Inventory");
//     } else if (matchPath("/inventory/maintenance", path)) {
//       setCurrentTab("Maintenance");
//     } else if (matchPath("/inventory/add-maintenance", path)) {
//       setCurrentTab("Add Maintenance");
//     } else if (matchPath("/inventory/equipment-details", path)) {
//       setCurrentTab("Equipment Details");
//     } else if (matchPath("/inventory/assigned-inventory", path)) {
//       setCurrentTab("Assigned Inventory");
//     } else if (matchPath("/post-production/post-production-detail/:id", path)) {
//       setCurrentTab("Post Production Vendor Assign");
//     } else if (matchPath("/vendors/vendor-details/:id", path)) {
//       setCurrentTab("Vendor Details");
//     } else if (matchPath("/settings/add-User", path)) {
//       setCurrentTab("Add User");
//     } else if (matchPath("/vendors/available-vendors", path)) {
//       setCurrentTab("Available Vendors");
//     } else if (matchPath("/vendors/assigned-vendor", path)) {
//       setCurrentTab("Assigned Vendor");
//     } else if (matchPath("/inventory/assigned-inventory", path)) {
//       setCurrentTab("Assigned Inventory");
//     } else if (matchPath("/payment/installment-details/:id", path)) {
//       setCurrentTab("Installment Details");
//     } else if (matchPath("/settings", path)) {
//       setCurrentTab("Settings");
//     } else if (matchPath("/profile", path)) {
//       setCurrentTab("Profile");
//     } else {
//       setCurrentTab("Dashboard");
//     }
//   }, [location.pathname]);

//   const handleBackClick = () => {
//     if (window.history.length > 1) {
//       navigate(-1);
//     } else {
//       navigate("/");
//     }
//   };

//   const handleLogout = () => {
//     setShowUserCard(false);
//   };

//   const excludedPaths = [
//     "/dashboard",
//     "/master",
//     "/customer",
//     "/quotation",
//     "/booking",
//     "/vendors",
//     "/inventory",
//     "/payment",
//     "/post-production",
//   ];

//   return (
//     <div className="d-flex justify-content-between align-items-center p-3 bg-white px-4 position-relative">
//       <div className="d-flex align-items-center">
//         {!excludedPaths.includes(location.pathname) && (
//           <FaArrowLeft
//             className="fs-4 me-2"
//             style={{ cursor: "pointer" }}
//             onClick={handleBackClick}
//           />
//         )}
//         <p className="fs-5 fw-bold mb-0">{currentTab}</p>
//       </div>

//       <div className="position-relative">
//         <FaUserCircle
//           className="fs-3"
//           style={{ cursor: "pointer" }}
//           onClick={() => setShowUserCard(!showUserCard)}
//         />

//         {showUserCard && (
//           <Card
//             ref={userCardRef}
//             className="shadow border-0 position-absolute top-100  mt-2"
//             style={{ width: "200px", zIndex: 1000, right: "0px" }}
//           >
//             <Card.Body>
//               <div className="text-center mb-3">
//                 <img
//                   src="https://images.unsplash.com/photo-1619895862022-09114b41f16f?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//                   alt="user"
//                   className="rounded-circle mb-2"
//                   style={{ width: "50px", height: "50px", objectFit: "cover" }}
//                 />
//                 <p className="fs-5 fw-bold mb-0">Amrita Singh</p>
//                 <p className="fs-6 mb-0 text-muted">amrita@gmail.com</p>
//               </div>

//               <div className="d-grid gap-2">
//                 <Button
//                   variant="outline-dark"
//                   className="d-flex align-items-center justify-content-center gap-2"
//                   onClick={() => {
//                     navigate("/profile");
//                     setShowUserCard(false);
//                   }}
//                 >
//                   <FaUser /> Profile
//                 </Button>
//                 <Button
//                   variant="outline-danger"
//                   className="d-flex align-items-center justify-content-center gap-2"
//                   onClick={handleLogout}
//                 >
//                   <FaSignOutAlt /> Logout
//                 </Button>
//               </div>
//             </Card.Body>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Header;

import { useEffect, useState, useRef } from "react";
import { useLocation, matchPath, useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaArrowLeft,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { Button, Card, Dropdown } from "react-bootstrap";

const Header = () => {
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const [showUserCard, setShowUserCard] = useState(false);
  const userCardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userCardRef.current && !userCardRef.current.contains(event.target)) {
        setShowUserCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const path = location.pathname;
    // Using matchPath to match dynamic paths
    if (matchPath("/view-orders", path)) {
      setCurrentTab("View Orders");
    } else if (matchPath("/orders-details/:id", path)) {
      setCurrentTab("Orders Details");
    } else if (matchPath("/enquiry-list", path)) {
      setCurrentTab("Enquiry List");
    } else if (matchPath("/add-new-enquiry", path)) {
      setCurrentTab("Add New Enquiry");
    } else if (matchPath("/enquiry-details/:id", path)) {
      setCurrentTab("Enquiry Details");
    } else if (matchPath("/enquiries-by-date/:date", path)) {
      setCurrentTab("Enquiries by Date");
    } else if (matchPath("/orders-by-date/:date", path)) {
      setCurrentTab("Orders by Date");
    } else if (matchPath("/quotation", path)) {
      setCurrentTab("Quotation");
    } else if (matchPath("/quotation-details/:id", path)) {
      setCurrentTab("Quotation Details");
    } else if (matchPath("/quotation/invoice/:id", path)) {
      setCurrentTab("Quotation Invoice");
    } else if (matchPath("/executive-management", path)) {
      setCurrentTab("Executive Management");
    } else if (matchPath("/order-sheet/:id", path)) {
      setCurrentTab("Order Sheet");
    } else {
      setCurrentTab("Dashboard");
    }
  }, [location.pathname]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/view-orders");
    }
  };

  const handleLogout = () => {
    setShowUserCard(false);
  };

  const excludedPaths = [
    "/dashboard",
    "/master",
    "/banner",
    "/prdoduct-management",
    "/client",
    "/view-orders",
    "/add-new-enquiry",
    "/executive-management",
    "/enquiry-list",
    "/enquiry-calender",
    "/quotation",
    "/terms-conditions",
    "/payment-report",
    "/refurbihsment-report",
    "/inventory-product-list",
  ];

  return (
    <div className="d-flex justify-content-between align-items-center p-3 bg-white px-4 position-relative">
      <div className="d-flex align-items-center">
        {!excludedPaths.includes(location.pathname) && (
          <FaArrowLeft
            className="fs-4 me-2"
            style={{ cursor: "pointer" }}
            onClick={handleBackClick}
          />
        )}
        <p className="fs-5 fw-bold mb-0">{currentTab}</p>
      </div>

      {/* <div className="position-relative">
        <FaUserCircle className="fs-3" style={{ cursor: "pointer" }} />
      </div> */}

      <Dropdown>
        <Dropdown.Toggle
          variant=""
          className="position-relative"
          style={{ padding: "0.5rem", cursor: "pointer" }}
          id="user-dropdown"
        >
          <FaUserCircle className="fs-3" />
        </Dropdown.Toggle>

        <Dropdown.Menu align="end">
          <Dropdown.Item onClick={() => {
            sessionStorage.clear();
            window.location.reload()
          }}>
            <FaSignOutAlt className="me-2" />
            Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default Header;
