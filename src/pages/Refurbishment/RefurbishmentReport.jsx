// import React, { useState } from "react";
// import { Button, Card, Container, Form, Table } from "react-bootstrap";
// import { FaEye, FaTrashAlt } from "react-icons/fa";
// import moment from "moment";
// import Pagination from "../../components/Pagination";
// import { useNavigate } from "react-router-dom";

// const dummyRefurbishments = Array.from({ length: 25 }, (_, i) => ({
//   id: i + 1,
//   orderId: `ORD${String(i + 1).padStart(3, "0")}`,
//   floorManager: `Manager ${i + 1}`,
//   shippingAddress: `123 Street ${i + 1}, City`,
//   createdAt: moment().subtract(i, "days").toISOString(),
// }));

// const RefurbishmentReport = () => {
//   const [refurbs, setRefurbs] = useState(dummyRefurbishments);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;
//   const navigate = useNavigate();
//   const filteredRefurbs = refurbs.filter((item) =>
//     `${item.orderId} ${item.floorManager} ${item.shippingAddress}`
//       .toLowerCase()
//       .includes(searchQuery.toLowerCase())
//   );

//   const totalPages = Math.ceil(filteredRefurbs.length / itemsPerPage);
//   const paginatedRefurbs = filteredRefurbs.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handleDelete = (id) => {
//     const confirm = window.confirm(
//       "Are you sure you want to delete this entry?"
//     );
//     if (confirm) {
//       setRefurbs((prev) => prev.filter((item) => item.id !== id));
//     }
//   };

//   const handleView = (id) => {
//     // alert(`Viewing details for Order ID: ${id}`);
//     navigate("/refurbishment-invoice")
//   };

//   return (
//     <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
//       <div className="d-flex justify-content-between mb-3">
//         <Form.Control
//           type="text"
//           placeholder="Search by Order ID, Manager, Address"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           style={{ width: "300px", fontSize: "12px" }}
//         />
//       </div>

//       <Card className="border-0 shadow-sm">
//         <div
//           className="table-responsive bg-white rounded-lg"
//           style={{ maxHeight: "65vh", overflowY: "auto" }}
//         >
//           <Table className="table table-hover align-middle">
//             <thead
//               className="text-white text-center"
//               style={{ backgroundColor: "#323D4F", fontSize: "12px" }}
//             >
//               <tr>
//                 <th>S.No.</th>
//                 <th>Order ID</th>
//                 <th>Floor Manager</th>
//                 <th>Shipping Address</th>
//                 <th>Created</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedRefurbs.map((item, index) => (
//                 <tr
//                   key={item.id}
//                   className="text-center"
//                   style={{ fontSize: "12px" }}
//                 >
//                   <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
//                   <td>{item.orderId}</td>
//                   <td>{item.floorManager}</td>
//                   <td>{item.shippingAddress}</td>
//                   <td>{moment(item.createdAt).format("MM/DD/YYYY hh:mm A")}</td>
//                   <td>
//                     <Button
//                       variant="outline-primary"
//                       size="sm"
//                       onClick={() => handleView(item.orderId)}
//                       className="me-2"
//                     >
//                       <FaEye />
//                     </Button>
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       onClick={() => handleDelete(item.id)}
//                     >
//                       <FaTrashAlt />
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//               {paginatedRefurbs.length === 0 && (
//                 <tr>
//                   <td colSpan="6" className="text-center text-muted">
//                     No refurbishment records found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </Table>
//         </div>
//       </Card>

//       {/* Pagination */}
//       <Pagination totalItems={totalPages} />

//       {/* {totalPages > 1 && (
//         <div className="d-flex justify-content-end mt-3">
//           <div className="d-flex gap-2">
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               disabled={currentPage === 1}
//               onClick={() => setCurrentPage((prev) => prev - 1)}
//             >
//               Previous
//             </Button>
//             <span style={{ fontSize: "12px", lineHeight: "32px" }}>
//               Page {currentPage} of {totalPages}
//             </span>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               disabled={currentPage === totalPages}
//               onClick={() => setCurrentPage((prev) => prev + 1)}
//             >
//               Next
//             </Button>
//           </div>
//         </div>
//       )} */}
//     </Container>
//   );
// };

// export default RefurbishmentReport;

import React, { useState, useEffect } from "react";
import { Button, Card, Container, Form, Table } from "react-bootstrap";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import moment from "moment";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ApiURL } from "../../api";
import Pagination from "../../components/Pagination";

const itemsPerPage = 10;

const RefurbishmentReport = () => {
  const [refurbs, setRefurbs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRefurbishment();
    // eslint-disable-next-line
  }, []);

  const fetchRefurbishment = async () => {
    try {
      const res = await axios.get(`${ApiURL}/refurbishment/all`);
      if (res.status === 200) {
        setRefurbs(res.data);
      }
    } catch (error) {
      console.error("Error fetching Refurbishment:", error);
      toast.error("Failed to fetch Refurbishment");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (confirmDelete) {
      try {
        const response = await axios.delete(`${ApiURL}/refurbishment/${id}`);
        if (response.status === 200) {
          toast.success("Refurbishment deleted successfully");
          fetchRefurbishment();
          setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
        }
      } catch (error) {
        console.error("Error deleting refurbishment:", error);
        toast.error("Failed to delete refurbishment");
      }
    }
  };

  // Filtered and paginated data
  const filteredRefurbs = refurbs.filter((item) =>
    `${item.orderId} ${item.floorManager} ${item.shippingAddress}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRefurbs.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredRefurbs.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRows([]);
  };

  const handleView = (orderId) => {
    navigate(`/refurbishment-invoice/${orderId}`);
  };

  // Row selection
  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (
      selectedRows.length === currentItems.length &&
      currentItems.length > 0
    ) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentItems.map((item) => item._id || item.id));
    }
  };

  // Delete selected refurbishments
  const handleDeleteSelected = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRows.length} selected refurbishment(s)?`
      )
    )
      return;
    try {
      await Promise.all(
        selectedRows.map((id) => axios.delete(`${ApiURL}/refurbishment/${id}`))
      );
      toast.success("Selected refurbishments deleted.");
      fetchRefurbishment();
      setSelectedRows([]);
    } catch {
      toast.error("Failed to delete selected refurbishments.");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [searchQuery]);

  return (
    <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
      <Toaster />
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          type="text"
          placeholder="Search by Order ID, Manager, Address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "300px", fontSize: "12px" }}
        />
        {selectedRows.length > 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleDeleteSelected}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            <FaTrashAlt className="me-1" />
            Delete {selectedRows.length} Selected
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <div
          className="table-responsive bg-white rounded-lg"
          style={{ maxHeight: "65vh", overflowY: "auto" }}
        >
          <Table className="table table-hover align-middle">
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F", fontSize: "12px" }}
            >
              <tr>
                <th style={{ width: "5%" }}>
                  <Form.Check
                    type="checkbox"
                    checked={
                      selectedRows.length === currentItems.length &&
                      currentItems.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>S.No.</th>
                <th>Order ID</th>
                <th>Floor Manager</th>
                <th>Shipping Address</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No refurbishment records found.
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => {
                  const id = item._id || item.id;
                  return (
                    <tr
                      key={id}
                      className="text-center"
                      style={{ fontSize: "12px" }}
                    >
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedRows.includes(id)}
                          onChange={() => handleSelectRow(id)}
                        />
                      </td>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{item.orderId}</td>
                      <td>{item.floorManager}</td>
                      <td>{item.shippingAddress}</td>
                      <td>
                        {moment(item.createdAt).format("MM/DD/YYYY hh:mm A")}
                      </td>
                      <td>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() =>
                            navigate(`/refurbishment-invoice/${item.orderId}`)
                          }
                          className="me-2 icon-btn"
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(id)}
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
        <Pagination
          totalItems={filteredRefurbs.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </Container>
  );
};

export default RefurbishmentReport;
