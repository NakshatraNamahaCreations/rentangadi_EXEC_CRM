import React, { useEffect, useState } from "react";
import { Button, Card, Table, Container, Form, Spinner } from "react-bootstrap";
import Pagination from "../../components/Pagination";
import { FaTrashAlt } from "react-icons/fa";
import { MdVisibility } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { ApiURL } from "../../api";

const itemsPerPage = 10;

const Quotation = () => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch quotations from API
  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ApiURL}/quotations/getallquotations`);
      if (res.status === 200) {
        setQuotations(res.data.quoteData || []);
        setFilteredQuotations(res.data.quoteData || []);
      }
    } catch (error) {
      toast.error("Failed to fetch quotations");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    const filtered = quotations.filter(
      (q) =>
        (q.clientName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(q.GrandTotal || "").includes(searchQuery) ||
        String(q._id || "").includes(searchQuery) ||
        (q.status || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredQuotations(filtered);
    setCurrentPage(1);
  }, [searchQuery, quotations]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handle row selection
  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Handle select all rows on current page
  const handleSelectAllRows = (checked) => {
    const currentPageIds = currentItems.map((q) => q._id);
    if (checked) {
      setSelectedRows([...new Set([...currentPageIds])]);
    } else {
      const remaining = selectedRows.filter(
        (id) => !currentPageIds.includes(id)
      );
      setSelectedRows(remaining);
    }
  };

  // Delete single quotation
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quotation?"
    );
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${ApiURL}/quotations/deletequotation/${id}`);
      fetchQuotations();
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    } catch {
      toast.error("Failed to delete quotation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete selected quotations
  const handleDeleteSelected = async () => {
    const confirmDelete = window.confirm("Delete selected quotations?");
    if (!confirmDelete) return;
    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(`${ApiURL}/quotations/deletequotation/${id}`)
        )
      );
      fetchQuotations();
      setSelectedRows([]);
    } catch {
      toast.error("Failed to delete selected quotations");
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
      <Toaster />
      <div className="d-flex justify-content-between mb-3">
        <div>
          <Form.Control
            type="text"
            placeholder="Search Quotation"
            value={searchQuery}
            onChange={handleSearchChange}
            className="shadow-sm"
            style={{ width: "250px", fontSize: "12px" }}
          />
        </div>
        <div className="d-flex gap-2">
          {selectedRows.length > 0 && (
            <Button
              variant="outline-danger"
              onClick={handleDeleteSelected}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
              }}
            >
              Delete {selectedRows.length} Selected
            </Button>
          )}
        </div>
      </div>

      {isDeleting && (
        <div className="text-center mb-4">
          <Spinner animation="border" variant="primary" />
          <p>Deleting the quotation...</p>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <div
          className="table-responsive bg-white rounded-lg"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          <Table
            className="table table-hover align-middle"
            style={{
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
          >
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F", fontSize: "12px" }}
            >
              <tr>
                <th style={{ width: "5%" }}>
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAllRows(e.target.checked)}
                    checked={
                      currentItems.length > 0 &&
                      currentItems.every((item) =>
                        selectedRows.includes(item._id)
                      )
                    }
                  />
                </th>
                <th className="text-start">Quote Id</th>
                <th className="text-start">Quote Date</th>
                <th className="text-start">Time</th>
                <th className="text-start">Client Name</th>
                <th className="text-start">GST</th>
                {/* <th className="text-start">Round off</th> */}
                <th className="text-start">GrandTotal</th>
                <th className="text-start">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                currentItems.map((q) => (
                  <tr key={q._id} className="text-center hover-row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(q._id)}
                        onChange={() => handleSelectRow(q._id)}
                      />
                    </td>
                    <td className="text-start">{q.quoteId}</td>
                    <td className="text-start">{q.quoteDate}</td>
                    <td className="text-start">{q.quoteTime}</td>
                    <td className="text-start">{q.clientName}</td>
                    <td className="text-start">{q.GST}</td>
                    {/* <td className="text-start">{q.adjustments || q.roundOff}</td> */}
                    <td className="text-start">{q.GrandTotal || q.grandTotal}</td>
                    <td className="text-start">{q.status}</td>
                    <td className="">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="me-2 icon-btn"
                        style={{ padding: "4px 8px", fontSize: "10px" }}
                        onClick={() => navigate(`/quotation-details/${q._id}`)}
                      >
                        <MdVisibility />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="icon-btn"
                        style={{ padding: "4px 8px", fontSize: "10px" }}
                        onClick={() => handleDelete(q._id)}
                      >
                        <FaTrashAlt style={{ width: "12px", height: "12px" }} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Pagination Component */}
      <Pagination
        totalItems={filteredQuotations.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default Quotation;

// import React, { useEffect, useState } from "react";
// import { Button, Card, Table, Container, Form, Spinner } from "react-bootstrap";
// import Pagination from "../../components/Pagination";
// import { FaTrashAlt } from "react-icons/fa";
// import { MdVisibility } from "react-icons/md";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { toast, Toaster } from "react-hot-toast";
// import { ApiURL } from "../../api";

// const itemsPerPage = 10;

// const Quotation = () => {
//   const navigate = useNavigate();
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [quotations, setQuotations] = useState([]);
//   const [filteredQuotations, setFilteredQuotations] = useState([]);

//   // Fetch quotations from API
//   const fetchQuotations = async () => {
//     try {
//       const res = await axios.get(`${ApiURL}/quotations/getallquotations`);
//       if (res.status === 200) {
//         setQuotations(res.data.quoteData || []);
//         setFilteredQuotations(res.data.quoteData || []);
//         console.log("Quoatation", res.data.quoteData);
//       }
//     } catch (error) {
//       toast.error("Failed to fetch quotations");
//     }
//   };

//   useEffect(() => {
//     fetchQuotations();
//   }, []);

//   useEffect(() => {
//     const filtered = quotations.filter(
//       (q) =>
//         (q.clientName || "")
//           .toLowerCase()
//           .includes(searchQuery.toLowerCase()) ||
//         String(q.GrandTotal || "").includes(searchQuery) ||
//         String(q._id || "").includes(searchQuery) ||
//         (q.status || "").toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredQuotations(filtered);
//     setCurrentPage(1);
//   }, [searchQuery, quotations]);

//   // Pagination logic
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredQuotations.slice(
//     indexOfFirstItem,
//     indexOfLastItem
//   );

//   // Handle row selection
//   const handleSelectRow = (id) => {
//     setSelectedRows((prev) =>
//       prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
//     );
//   };

//   // Handle select all rows on current page
//   const handleSelectAllRows = (checked) => {
//     const currentPageIds = currentItems.map((q) => q._id);
//     if (checked) {
//       setSelectedRows([...new Set([...currentPageIds])]);
//     } else {
//       const remaining = selectedRows.filter(
//         (id) => !currentPageIds.includes(id)
//       );
//       setSelectedRows(remaining);
//     }
//   };

//   // Delete single quotation
//   const handleDelete = async (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this quotation?"
//     );
//     if (!confirmDelete) return;
//     setIsDeleting(true);
//     try {
//       await axios.delete(`${ApiURL}/quotations/deletequotation/${id}`);
//       fetchQuotations();
//       setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
//     } catch {
//       toast.error("Failed to delete quotation");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   // Delete selected quotations
//   const handleDeleteSelected = async () => {
//     const confirmDelete = window.confirm("Delete selected quotations?");
//     if (!confirmDelete) return;
//     try {
//       await Promise.all(
//         selectedRows.map((id) =>
//           axios.delete(`${ApiURL}/quotations/deletequotation/${id}`)
//         )
//       );
//       fetchQuotations();
//       setSelectedRows([]);
//     } catch {
//       toast.error("Failed to delete selected quotations");
//     }
//   };

//   // Handle search input change
//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   return (
//     <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
//       <Toaster />
//       <div className="d-flex justify-content-between mb-3">
//         <div>
//           <Form.Control
//             type="text"
//             placeholder="Search Quotation"
//             value={searchQuery}
//             onChange={handleSearchChange}
//             className="shadow-sm"
//             style={{ width: "250px", fontSize: "12px" }}
//           />
//         </div>
//         <div className="d-flex gap-2">
//           {selectedRows.length > 0 && (
//             <Button
//               variant="outline-danger"
//               onClick={handleDeleteSelected}
//               style={{
//                 fontSize: "12px",
//                 padding: "6px 12px",
//               }}
//             >
//               Delete {selectedRows.length} Selected
//             </Button>
//           )}
//         </div>
//       </div>

//    {isDeleting && (
//         <div className="text-center mb-4">
//           <Spinner animation="border" variant="primary" />
//           <p>Deleting the quotation...</p>
//         </div>
//       )}
      
//       <Card className="border-0 shadow-sm">
//         <div
//           className="table-responsive bg-white rounded-lg"
//           style={{ maxHeight: "70vh", overflowY: "auto" }}
//         >
//           <Table
//             className="table table-hover align-middle"
//             style={{
//               borderRadius: "8px",
//               border: "1px solid #e0e0e0",
//               boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
//               fontSize: "12px",
//             }}
//           >
//             <thead
//               className="text-white text-center"
//               style={{ backgroundColor: "#323D4F", fontSize: "12px" }}
//             >
//               <tr>
//                 <th style={{ width: "5%" }}>
//                   <input
//                     type="checkbox"
//                     onChange={(e) => handleSelectAllRows(e.target.checked)}
//                     checked={
//                       currentItems.length > 0 &&
//                       currentItems.every((item) =>
//                         selectedRows.includes(item._id)
//                       )
//                     }
//                   />
//                 </th>
//                 <th className="text-start">Quote Id</th>
//                 <th className="text-start">Quote Date</th>
//                 <th className="text-start">Time</th>
//                 <th className="text-start">Client Name</th>
//                 <th className="text-start">GST</th>
//                 {/* <th className="text-start">Round off</th> */}
//                 <th className="text-start">GrandTotal</th>
//                 <th className="text-start">Status</th>
//                 <th className="text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentItems.map((q) => (
//                 <tr key={q._id} className="text-center hover-row">
//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={selectedRows.includes(q._id)}
//                       onChange={() => handleSelectRow(q._id)}
//                     />
//                   </td>
//                   <td className="text-start">{q.quoteId}</td>
//                   <td className="text-start">{q.quoteDate}</td>
//                   <td className="text-start">{q.quoteTime}</td>
//                   <td className="text-start">{q.clientName}</td>
//                   <td className="text-start">{q.GST}</td>
//                   {/* <td className="text-start">{q.adjustments || q.roundOff}</td> */}
//                   <td className="text-start">{q.GrandTotal || q.grandTotal}</td>
//                   <td className="text-start">{q.status}</td>
//                   <td className="">
//                     <Button
//                       variant="outline-dark"
//                       size="sm"
//                       className="me-2 icon-btn"
//                       style={{ padding: "4px 8px", fontSize: "10px" }}
//                       onClick={() => navigate(`/quotation-details/${q._id}`)}
//                     >
//                       <MdVisibility />
//                     </Button>
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       className="icon-btn"
//                       style={{ padding: "4px 8px", fontSize: "10px" }}
//                       onClick={() => handleDelete(q._id)}
//                     >
//                       <FaTrashAlt style={{ width: "12px", height: "12px" }} />
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//           {currentItems.length === 0 && (
//             <Container
//               className="text-center d-flex justify-content-center align-items-center"
//               style={{ width: "100%", height: "60vh" }}
//             >
//               <Spinner animation="border" />
//             </Container>
//           )}
//         </div>
//       </Card>

//       {/* Pagination Component */}
//       <Pagination
//         totalItems={filteredQuotations.length}
//         itemsPerPage={itemsPerPage}
//         currentPage={currentPage}
//         onPageChange={setCurrentPage}
//       />
//     </Container>
//   );
// };

// export default Quotation;
