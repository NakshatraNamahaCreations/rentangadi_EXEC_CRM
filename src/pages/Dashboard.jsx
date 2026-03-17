// import React from "react";
// import { Card } from "react-bootstrap";
// import {
//   AiOutlineUser,
//   AiOutlinePhone,
//   AiOutlineDollarCircle,
//   AiOutlineCalendar,
//   AiOutlineTool,
// } from "react-icons/ai";
// import {
//   FaUsers,
//   FaWarehouse,
//   FaTruckLoading,
//   FaIndustry,
//   FaUserCog,
//   FaCheckCircle,
//   FaPencilAlt,
//   FaMoneyCheckAlt,
//   FaBoxOpen,
//   FaBox,
// } from "react-icons/fa";

// // Importing chart.js and react-chartjs-2 for the bar chart
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// // Registering the necessary chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const Dashboard = () => {
//   const preProductionData = [
//     {
//       title: "Orders",
//       count: 45,
//       icon: <FaBoxOpen size={40} />,
//     },
//     {
//       title: "Clients",
//       count: 10,
//       icon: <FaUsers size={40} />,
//     },
//     {
//       title: "Quotations",
//       count: 25,
//       icon: <FaWarehouse size={40} />,
//     },
//   ];

//   // Sample data for the bar chart (Orders in different months)
//   const orderData = {
//     labels: ["January", "February", "March", "April", "May", "June"], // Months
//     datasets: [
//       {
//         label: "Orders",
//         data: [10, 20, 15, 30, 25, 40],
//         backgroundColor: "#4e73df",
//         borderColor: "#2e59d9",
//         borderWidth: 1,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       title: {
//         display: true,
//         text: "Orders per Month",
//       },
//       tooltip: {
//         callbacks: {
//           // Customize tooltip to show the count of orders in the tooltip
//           label: (context) => `Orders: ${context.raw}`,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           stepSize: 5,
//         },
//       },
//     },
//   };

//   return (
//     <div className="container p-4 rounded " style={{ background: "#F4F4F4" }}>
//       <div className="row mt-4 justify-content-start">
//         {preProductionData.map((item, index) => (
//           <div className="col-4 mb-2 px-1" key={index}>
//             <Card className="shadow border-0 p-2 text-center card-hover">
//               <Card.Body className="d-flex flex-column align-items-center justify-content-center">
//                 <div className="mb-1 icon">{item.icon}</div>
//                 <h6 className="fw-bold mb-1" style={{ fontSize: "12px" }}>
//                   {item.title}
//                 </h6>
//                 <p className="fw-bold mb-0" style={{ fontSize: "18px" }}>
//                   {item.count}
//                 </p>
//                 <small className="text-muted" style={{ fontSize: "10px" }}>
//                   {item.subtitle}
//                 </small>
//               </Card.Body>
//             </Card>
//           </div>
//         ))}
//       </div>

//       {/* Bar Chart for Orders */}
//       <div className="mt-4">
//         <Card className="shadow border-0 p-2">
//           <Card.Body>
//             <h6 className="fw-bold mb-3" style={{ fontSize: "16px" }}>
//               Orders Per Month
//             </h6>
//             <Bar data={orderData} options={options} />
//           </Card.Body>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { FaUsers, FaWarehouse, FaBoxOpen } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import moment from "moment";
import { ApiURL } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [counts, setCounts] = useState({
    Orders: 0,
    Clients: 0,
    Quotations: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState("Orders");
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchMonthlyData(selectedCategory);
  }, [selectedCategory]);

  const fetchCounts = async () => {
    try {
      const [ordersRes, clientsRes, quotationsRes] = await Promise.all([
        axios.get(`${ApiURL}/order/TotalNumberOfOrder`),
        axios.get(`${ApiURL}/client/TotalNumberOfClients`),
        axios.get(`${ApiURL}/quotations/TotalNumberOfquotation`),
      ]);
      setCounts({
        Orders: ordersRes.data.totalorderCount || 0,
        Clients: clientsRes.data.clientCount || 0,
        Quotations: quotationsRes.data.totalQuotationCount || 0,
      });
    } catch (error) {
      // handle error
    }
  };

  const fetchMonthlyData = async (category) => {
    try {
      let apiUrl = "";
      if (category === "Orders") {
        apiUrl = `${ApiURL}/order/getallorder`;
      } else if (category === "Clients") {
        apiUrl = `${ApiURL}/client/getallclients`;
      } else if (category === "Quotations") {
        apiUrl = `${ApiURL}/quotations/getallquotations`;
      }
      const res = await axios.get(apiUrl);
      const data =
        res.data.orderData ||
        res.data.Client ||
        res.data.quoteData ||
        res.data.data ||
        [];
      // Group by month
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthly = {};
      months.forEach((m) => (monthly[m] = 0));
      data.forEach((item) => {
        if (item.createdAt) {
          const month = moment(item.createdAt).format("MMMM");
          if (monthly[month] !== undefined) monthly[month] += 1;
        }
      });
      setMonthlyData(months.map((month) => monthly[month]));
    } catch (error) {
      setMonthlyData([]);
    }
  };

  const preProductionData = [
    {
      title: "Orders",
      count: counts.Orders,
      icon: <FaBoxOpen size={40} />,
      color: "#BD5525",
      border: "#2e59d9",
    },
    {
      title: "Clients",
      count: counts.Clients,
      icon: <FaUsers size={40} />,
      color: "#BD5525",
      border: "#16a34a",
    },
    {
      title: "Quotations",
      count: counts.Quotations,
      icon: <FaWarehouse size={40} />,
      color: "#BD5525",
      border: "#f59e42",
    },
  ];

  const barColors = {
    Orders: "#4e73df",
    Clients: "#22c55e",
    Quotations: "#f59e42",
  };

  const orderData = {
    labels: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
    datasets: [
      {
        label: `${selectedCategory} per Month`,
        data: monthlyData,
        backgroundColor: barColors[selectedCategory],
        borderColor: barColors[selectedCategory],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: "#6366f1",
        hoverBorderColor: "#6366f1",
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    animation: {
      duration: 1200,
      easing: "easeOutBounce",
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `${selectedCategory} Per Month`,
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${selectedCategory}: ${context.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: "#e5e7eb" },
      },
      x: {
        grid: { color: "#f3f4f6" },
      },
    },
  };

  return (
    <div className="container p-4 rounded" style={{ background: "#F4F4F4" }}>
      <div className="row mt-4 justify-content-start">
        {preProductionData.map((item, index) => (
          <div className="col-4 mb-2 px-1" key={index}>
            <Card
              className={`shadow border-0 p-2 text-center card-hover transition-all ${
                selectedCategory === item.title
                  ? "border-primary border-2 scale-105"
                  : ""
              }`}
              style={{
                cursor: "pointer",
                boxShadow:
                  selectedCategory === item.title
                    ? `0 0 0 2px ${item.color}33`
                    : undefined,
                transition: "all 0.2s",
              }}
              onClick={() => setSelectedCategory(item.title)}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div
                  className="mb-1 icon"
                  style={{
                    color: item.color,
                    filter:
                      selectedCategory === item.title
                        ? "drop-shadow(0 0 8px #a5b4fc)"
                        : undefined,
                  }}
                >
                  {item.icon}
                </div>
                <h6 className="fw-bold mb-1" style={{ fontSize: "12px" }}>
                  {item.title}
                </h6>
                <p className="fw-bold mb-0" style={{ fontSize: "18px" }}>
                  {item.count}
                </p>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Bar Chart for Selected Category */}
      <div className="mt-4">
        <Card className="shadow border-0 p-2">
          <Card.Body>
            <Bar data={orderData} options={options} />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;