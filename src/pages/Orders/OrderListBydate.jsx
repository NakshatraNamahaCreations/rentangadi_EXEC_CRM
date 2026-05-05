// import React, { useState, useEffect } from "react";
// import { Table, Button, Card, Container } from "react-bootstrap";
// import { MdVisibility } from "react-icons/md";
// import moment from "moment";
// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import { ApiURL } from "../../api"; // Adjust the path as necessary

// const OrderListBydate = () => {
//   const navigate = useNavigate();
//   const { date } = useParams(); // Get the selected date from the URL
//   const [orders, setOrders] = useState([]);

//   useEffect(() => {
//     fetchOrdersForDate(date); // Fetch orders based on the selected date
//   }, [date]);

//   // Fetch orders based on the selected date
//   // Fetch orders based on the selected date
//   const fetchOrdersForDate = async (selectedDate) => {
//     try {
//       const res = await axios.get(`${ApiURL}/order/getallorder`);
//       if (res.status === 200) {
//         const allOrders = res.data.orderData;

//         // Filter the orders based on the selected date (compare only date part)
//         const filteredOrders = allOrders.filter(
//           (order) =>
//             moment(order.createdAt).format("YYYY-MM-DD") === selectedDate
//         );

//         // Map data to match the table's required fields
//         const formattedOrders = filteredOrders.map((order) => {
//           const quoteDate =
//             order.slots && order.slots.length > 0
//               ? order.slots[0].quoteDate
//               : "";

//           return {
//             id: order._id,
//             companyName: order.clientName || "",
//             executiveName: order.executivename || "",
//             grandTotal: order.GrandTotal || 0,
//             bookingDate: order.createdAt,
//             deliveryDate: quoteDate, // <-- use quoteDate here
//             address: order.Address || "",
//           };
//         });

//         setOrders(formattedOrders);
//       }
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//     }
//   };
//   // Navigate to the details page
//   const navigateToDetails = (_id) => {
//     navigate("/orders/details", { state: { id: _id } });
//   };

//   return (
//     <Container className="my-4">
//       <Card className="shadow-sm mb-4">
//         <Card.Body>
//           <h5 className="mb-3">
//             Orders for {date && moment(date).format("MMMM DD, YYYY")}
//           </h5>
//           <div className="table-responsive">
//             <Table
//               striped
//               hover
//               bordered
//               className="mb-0"
//               style={{ fontSize: "0.85rem" }}
//             >
//               <thead style={{ backgroundColor: "#f8f9fa" }}>
//                 <tr>
//                   <th style={{ width: "15%" }}>Book Date/Time</th>
//                   <th style={{ width: "15%" }}>Company Name</th>
//                   <th style={{ width: "15%" }}>Executive Name</th>
//                   <th style={{ width: "10%" }}>Grand Total</th>
//                   <th style={{ width: "10%" }}>Start Date</th>
//                   <th style={{ width: "25%" }}>Address</th>
//                   <th style={{ width: "5%" }} className="text-center">
//                     Action
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orders.length > 0 ? (
//                   orders.map((order) => (
//                     <tr key={order.id} style={{ verticalAlign: "middle" }}>
//                       <td>
//                         {moment(order.bookingDate).format("MM/DD/YYYY hh:mm A")}
//                       </td>
//                       <td>{order.companyName}</td>
//                       <td>{order.executiveName}</td>
//                       <td>{order.grandTotal}</td>
//                       <td>{moment(order.startDate).format("MM/DD/YYYY")}</td>
//                       <td>{order.address}</td>
//                       <td className="text-center">
//                         <Button
//                           variant="outline-dark"
//                           size="sm"
//                           onClick={() => navigateToDetails(order.id)}
//                         >
//                           <MdVisibility />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="7" className="text-center text-muted">
//                       No orders found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </Table>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// };

// export default OrderListBydate;

import React, { useState, useEffect } from "react";
import { Table, Button, Card, Container } from "react-bootstrap";
import { MdVisibility } from "react-icons/md";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ApiURL } from "../../api";

const DISPLAY_DATE_FORMAT = "DD-MM-YYYY";

const OrderListBydate = () => {
  const navigate = useNavigate();
  const { date } = useParams(); // Get the selected date from the URL
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrdersForDate(date);
  }, [date]);

  const fetchOrdersForDate = async (selectedDate) => {
    try {
      const res = await axios.get(`${ApiURL}/order/getallorder`);
      if (res.status === 200) {
        const allOrders = res.data.orderData;

        // Filter orders by slot.quoteDate matching the selected date
        const filteredOrders = allOrders.filter((order) =>
          order.slots?.some(
            (slot) =>
              moment(slot.quoteDate, "DD-MM-YYYY").format("YYYY-MM-DD") ===
              selectedDate
          )
        );

        const formattedOrders = filteredOrders.map((order) => {
          const quoteDate =
            order.slots && order.slots.length > 0
              ? order.slots[0].quoteDate
              : "";

          return {
            id: order._id,
            companyName: order.clientName || "",
            executiveName: order.executivename || "",
            grandTotal: order.GrandTotal || 0,
            bookingDate: order.createdAt,
            deliveryDate: quoteDate,
            address: order.Address || "",
          };
        });

        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const navigateToDetails = (_id) => {
    navigate(`/orders-details/${_id}`, { state: { id: _id } });
  };

  return (
    <Container className="my-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="mb-3">
            Orders with Quote Date: {date && moment(date).format(DISPLAY_DATE_FORMAT)}
          </h5>
          <div className="table-responsive">
            <Table
              striped
              hover
              bordered
              className="mb-0"
              style={{ fontSize: "0.85rem" }}
            >
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th style={{ width: "15%" }}>Booking Date</th>
                  <th style={{ width: "15%" }}>Company Name</th>
                  <th style={{ width: "15%" }}>Executive Name</th>
                  <th style={{ width: "10%" }}>Grand Total</th>
                  <th style={{ width: "10%" }}>Quote Date</th>
                  <th style={{ width: "25%" }}>Address</th>
                  <th style={{ width: "5%" }} className="text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} style={{ verticalAlign: "middle" }}>
                      <td>{moment(order.bookingDate).format(DISPLAY_DATE_FORMAT)}</td>
                      <td>{order.companyName}</td>
                      <td>{order.executiveName}</td>
                      <td>{order.grandTotal}</td>
                      <td>{order.deliveryDate}</td>
                      <td>{order.address}</td>
                      <td className="text-center">
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => navigateToDetails(order.id)}
                        >
                          <MdVisibility />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderListBydate;
