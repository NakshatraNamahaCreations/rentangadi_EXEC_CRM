import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import "./App.css";
import "react-calendar/dist/Calendar.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
// import Dashboard from "./pages/Dashboard";
import Master from "./pages/Master";
import Login from "./pages/Login.jsx";
// import Banner from "./pages/Banner/Banner.jsx";
// import ProductManagement from "./pages/Product/ProductManagement.jsx";
// import AddProduct from "./pages/Product/AddProduct.jsx";
// import Client from "./pages/Client/Client.jsx";
// import AddClient from "./pages/Client/AddClient.jsx";
import Orders from "./pages/Orders/Orders.jsx";
import OrderDetails from "./pages/Orders/OrderDetails.jsx";
import EnquiryList from "./pages/Enquiry/EnquiryList.jsx";
import AddNewEnquiry from "./pages/Enquiry/AddNewEnquiry.jsx";
import OrderListBydate from "./pages/Orders/OrderListBydate.jsx";
import EnquiryDetails from "./pages/Enquiry/EnquiryDetails.jsx";
import EnquiryCalender from "./pages/Enquiry/EnquiryCalender.jsx";
import EnquiryByDate from "./pages/Enquiry/EnquiryByDate.jsx";
import TermsAndConditions from "./pages/Terms&Conditions/TermsAndConditions.jsx";
// import Quotation from "./pages/Quatation/Quotation.jsx";
// import PaymentReport from "./pages/Payment/PaymentReport.jsx";
// import RefurbishmentReport from "./pages/Refurbishment/RefurbishmentReport.jsx";
// import RefurbishmentInvoice from "./pages/Refurbishment/RefurbishmentInvoice.jsx";
import InventoryProduct from "./pages/InventoryProduct/InventoryProductList.jsx";
import Invoice from "./pages/Orders/Invoice.jsx";
// import ProductDetails from "./pages/Product/ProductDetails.jsx";
// import QuotationDetails from "./pages/Quatation/QuotationDetails.jsx";
// import ProductReports from "./pages/reports/ProductReports";
// import QuotationInvoice from "./pages/Quatation/QuotationInvoice.jsx";
// import ClientReports from "./pages/reports/ClientReports ";
// import Reports from "./pages/reports/Reports";
// import DamagedProductList from "./pages/Product/DamagedProductList.jsx";
import AdminRights from "./pages/Admin/AdminRights.jsx";
import AdminDetails from "./pages/Admin/AdminDetails.jsx";
import ExecutiveManagement from "./pages/Admin/ExecutiveManagement.jsx";
import { AuthManager } from "./utils/auth.js";
import OrderSheet from "./pages/Orders/OrderSheet.jsx";

import EditEnquiry from "./pages/Enquiry/EditEnquiry.jsx";
import OrderInvoice from "./pages/Orders/OrderInvoice.jsx";

function App() {
  // Use state to trigger re-render on login/logout
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("isLoggedIn"));

  // Listen for login changes from other tabs/windows
  useEffect(() => {
    const syncLogin = () => setIsLoggedIn(!!sessionStorage.getItem("isLoggedIn"));
    window.addEventListener("storage", syncLogin);
    return () => window.removeEventListener("storage", syncLogin);
  }, []);

  const handleLogin = (roles) => {
    try {
      const rolesString = JSON.stringify(roles);
      sessionStorage.setItem("isLoggedIn", true);
      sessionStorage.setItem("roles", rolesString);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error storing roles:", error);
      // Handle error appropriately
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("roles");
    setIsLoggedIn(false);
  };

  // PrivateRoute to protect routes
  const PrivateRoute = () => {
    const { user } = AuthManager.getAuthData() || {};
    const allowedRoles = ['client']
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" />;
    }

    // If the user is allowed, render the requested component
    return <Outlet />;
  };

  return (
    <Router>
      <Toaster position="top-right" />
      {isLoggedIn ? (
        <Layout handleLogout={handleLogout} roles={(() => {
          try {
            const rolesString = sessionStorage.getItem('roles');
            return rolesString ? JSON.parse(rolesString) : {};
          } catch (error) {
            console.error("Error parsing roles:", error);
            return {};
          }
        })()}>
          <Routes>
            {/* <Route path="/" element={<Dashboard />} /> */}

            {/* Protect the ExecutiveManagement route */}
            <Route element={<PrivateRoute redirectTo="/login" />}>
              <Route path="/executive-management" element={<ExecutiveManagement />} />
            </Route>

            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* <Route path="/product-management" element={<ProductManagement />} /> */}
            {/* <Route path="/add-product" element={<AddProduct />} /> */}
            {/* <Route path="/edit-product/:id" element={<AddProduct />} /> */}
            {/* <Route path="/product-details/:id" element={<ProductDetails />} /> */}
            {/* <Route path="/client" element={<Client />} /> */}
            {/* <Route path="/add-client" element={<AddClient />} /> */}
            <Route path="/view-orders" element={<Orders />} />
            <Route path="/orders-details/:id" element={<OrderDetails />} />
            <Route path="/order-sheet/:id" element={<OrderSheet />} />
            {/* <Route path="/invoice/:id" element={<Invoice />} /> */}
            <Route path="/enquiry-list" element={<EnquiryList />} />
            {/* <Route path="/enquiry-calender" element={<EnquiryCalender />} /> */}
            <Route path="/add-new-enquiry" element={<AddNewEnquiry />} />
            <Route path="/enquiry-details/:id" element={<EnquiryDetails />} />
            <Route path="/enquiries-by-date/:date" element={<EnquiryByDate />} />
            <Route path="/orders-by-date/:date" element={<OrderListBydate />} />
            {/* <Route path="/terms-conditions" element={<TermsAndConditions />} /> */}
            {/* <Route path="/quotation" element={<Quotation />} /> */}
            {/* <Route path="/quotation-details/:id" element={<QuotationDetails />} /> */}
            {/* <Route path="/payment-report" element={<PaymentReport />} /> */}
            {/* <Route path="/refurbihsment-report" element={<RefurbishmentReport />} /> */}
            {/* <Route path="/refurbishment-invoice/:id" element={<RefurbishmentInvoice />} /> */}
            {/* <Route path="/inventory-product-list" element={<InventoryProduct />} /> */}
            {/* <Route path="/reports" element={<Reports />} /> */}
            {/* <Route path="/damaged-products" element={<DamagedProductList />} /> */}
            {/* Redirect /login to dashboard if already logged in */}
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="/" element={<Navigate to="/view-orders" />} />
            <Route path="/edit-enquiry/:id" element={<EditEnquiry />} /> 
            <Route path="/order-pdf/:id" element={<OrderInvoice />} />         
            {/* No matching routes found */}
            <Route path="*" element={<Navigate to="/" />} />
            
            {/* <Route path="/quotation/invoice/:id" element={<QuotationInvoice />} /> */}
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<Login handleLogin={handleLogin} />} />
          {/* Redirect all other routes to login if not logged in */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
