
// import React, { useState } from "react";
// import { Button, Card, Container, Table } from "react-bootstrap";
// import { MdVisibility } from "react-icons/md";
// import { FaTrashAlt } from "react-icons/fa";
// import { useNavigate, useLocation } from "react-router-dom";
// import Pagination from "../../components/Pagination";

// const EnquiryByDate = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { date, enquiries } = location.state || {};

//   // Pagination state
//   const itemsPerPage = 10;
//   const [currentPage, setCurrentPage] = useState(1);

//   // Local state for deleting rows
//   const [localEnquiries, setLocalEnquiries] = useState(enquiries || []);

//   // Delete handler
//   const handleDelete = (id) => {
//     setLocalEnquiries((prev) =>
//       prev.filter((e) => (e._id || e.id) !== id)
//     );
//   };

//   // Pagination logic
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = localEnquiries.slice(indexOfFirstItem, indexOfLastItem);

//   if (!date || !enquiries) {
//     return (
//       <Container className="my-4">
//         <Card className="shadow-sm mb-4">
//           <Card.Body>
//             <h5>No enquiry data found for this date.</h5>
//             <Button
//               size="sm"
//               style={{
//                 backgroundColor: "#323D4F",
//                 border: "none",
//                 transition: "background 0.2s",
//               }}
//               onClick={() => navigate("/enquiry-calender")}
//               className="add-btn"
//             >
//               Back to Calendar
//             </Button>
//           </Card.Body>
//         </Card>
//       </Container>
//     );
//   }

//   return (
//     <Container className="my-4">
//       <Card className="shadow-sm mb-4">
//         <Card.Body className="d-flex justify-content-between align-items-center">
//           <h5 className="mb-0" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
//             Enquiries on {date}
//           </h5>
//           <Button
//             size="sm"
//             style={{
//               backgroundColor: "#323D4F",
//               border: "none",
//               transition: "background 0.2s",
//             }}
//             onClick={() => navigate("/enquiry-calender")}
//             className="add-btn"
//           >
//             Back to Calendar
//           </Button>
//         </Card.Body>
//       </Card>

//       <Card className="shadow-sm">
//         <Card.Body>
//           <div className="table-responsive">
//             <Table
//               striped
//               bordered
//               hover
//               className="mb-0"
//               style={{ fontSize: "0.82rem" }}
//             >
//               <thead style={{ background: "#f8f9fa" }}>
//                 <tr>
//                   <th style={{ width: "5%" }}>S.No.</th>
//                   <th style={{ width: "10%" }}>Enquiry Date</th>
//                   <th style={{ width: "12%" }}>Time</th>
//                   <th style={{ width: "18%" }}>Enq Time</th>
//                   <th style={{ width: "18%" }}>Company Name</th>
//                   <th style={{ width: "15%" }}>Executive Name</th>
//                   <th style={{ width: "10%" }}>GrandTotal</th>
//                   <th style={{ width: "12%" }} className="text-center">
//                     Action
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentItems.length > 0 ? (
//                   currentItems.map((enq, idx) => (
//                     <tr key={enq._id || enq.id || idx}>
//                       <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
//                       <td>{enq.enquiryDate || "-"}</td>
//                       <td>{enq.enquiryTime || enq.time || "-"}</td>
//                       <td>{enq.enqTime || "-"}</td>
//                       <td>{enq.clientName || enq.companyName || "-"}</td>
//                       <td>{enq.executivename || enq.executiveName || "-"}</td>
//                       <td>{enq.GrandTotal || enq.grandTotal || "-"}</td>
//                       <td className="text-center">
//                         <Button
//                           variant="outline-danger"
//                           size="sm"
//                           className="me-2"
//                           style={{ padding: "4px 8px", fontSize: "10px" }}
//                           onClick={() => handleDelete(enq._id || enq.id)}
//                         >
//                           <FaTrashAlt />
//                         </Button>
//                         <Button
//                           variant="outline-dark"
//                           size="sm"
//                           className="icon-btn"
//                           style={{ padding: "4px 8px", fontSize: "10px" }}
//                           onClick={() =>
//                             navigate(`/enquiry-details/${enq._id}`, {
//                               state: { enquiryId: enq._id },
//                             })
//                           }
//                         >
//                           <MdVisibility />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={8} className="text-center text-muted">
//                       No enquiries found for this date.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </Table>
//           </div>
//         </Card.Body>
//       </Card>
//       <Pagination
//         totalItems={localEnquiries.length}
//         itemsPerPage={itemsPerPage}
//         currentPage={currentPage}
//         onPageChange={setCurrentPage}
//       />
//     </Container>
//   );
// };

// export default EnquiryByDate;


import React, { useEffect, useState } from "react";
import { Button, Card, Container, Table } from "react-bootstrap";
import { MdVisibility } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../components/Pagination";
import axios from "axios";
import { ApiURL } from "../../api";

const EnquiryByDate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { date, enquiries } = location.state || {};

  const [selectedEnquiries, setSelectedEnquiries] = useState([]); // Track selected rows
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // If navigated directly, show a message
  if (!date || !enquiries) {
    return (
      <Container className="my-4">
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <h5>No enquiry data found for this date.</h5>
            <Button
              size="sm"
              style={{
                backgroundColor: "#323D4F",
                border: "none",
                transition: "background 0.2s",
              }}
              onClick={() => navigate("/enquiry-calender")}
              className="add-btn"
            >
              Back to Calendar
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = enquiries.slice(indexOfFirstItem, indexOfLastItem);

  const handleSelectRow = (id) => {
    setSelectedEnquiries((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEnquiries.length === currentItems.length) {
      setSelectedEnquiries([]); // Deselect all if already all are selected
    } else {
      setSelectedEnquiries(currentItems.map((e) => e._id)); // Select all current page items
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete selected enquiries?"))
      return;
    for (const id of selectedEnquiries) {
      try {
        await axios.delete(`${ApiURL}/Enquiry/deleteEnquiry/${id}`);
      } catch (err) {
        alert("Failed to delete some enquiries.");
      }
    }
    // Update the enquiries state after deletion
    setSelectedEnquiries([]);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (confirmDelete) {
      try {
        const response = await axios.delete(
          `${ApiURL}/Enquiry/deleteEnquiry/${id}`
        );
        if (response.status === 200) {
          window.location.reload();
          toast.success("Successfully Deleted");
        }
      } catch (error) {
        toast.error("Enquiry Not Deleted");
        console.error("Error deleting the Enquiry:", error);
      }
    }
  };

  return (
    <Container className="my-4">
      <Card className="shadow-sm mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Enquiries on {date}
          </h5>
          <Button
            size="sm"
            style={{
              backgroundColor: "#323D4F",
              border: "none",
              transition: "background 0.2s",
            }}
            onClick={() => navigate("/enquiry-calender")}
            className="add-btn"
          >
            Back to Calendar
          </Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          {/* Display Delete Selected Button only when there are selected rows */}
          {selectedEnquiries.length > 0 && (
            <div className="text-end mb-3">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDeleteSelected}
                style={{ marginBottom: "20px" }}
              >
                Delete {selectedEnquiries.length} Selected Enquiries
              </Button>
            </div>
          )}

          <div className="table-responsive">
            <Table
              striped
              bordered
              hover
              className="mb-0"
              style={{ fontSize: "0.82rem" }}
            >
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ width: "5%" }}>
                    <input
                      type="checkbox"
                      checked={selectedEnquiries.length === currentItems.length}
                      onChange={handleSelectAll} // Select/Deselect all items
                    />
                  </th>
                  <th style={{ width: "10%" }}>S.No.</th>
                  <th style={{ width: "10%" }}>Enquiry Date</th>
                  <th style={{ width: "12%" }}>Time</th>
                  <th style={{ width: "18%" }}>Company Name</th>
                  <th style={{ width: "15%" }}>Executive Name</th>
                  <th style={{ width: "10%" }}>GrandTotal</th>
                  <th style={{ width: "12%" }} className="text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((enq, idx) => (
                    <tr key={enq._id || enq.id || idx}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.includes(enq._id)} // Individual row selection
                          onChange={() => handleSelectRow(enq._id)} // Select/unselect individual row
                        />
                      </td>
                      <td>{idx + 1}</td>
                      <td>{enq.enquiryDate}</td>
                      <td>{enq.enquiryTime || enq.time}</td>
                      <td>{enq.clientName || enq.companyName}</td>
                      <td>{enq.executivename || "-"}</td>
                      <td>{enq.GrandTotal || enq.grandTotal}</td>
                      <td className="text-center">
                        <Button
                          variant="outline-dark"
                          size="sm"
                          className="icon-btn"
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                          onClick={() =>
                            navigate(`/enquiry-details/${enq._id}`, {
                              state: { enquiryId: enq._id },
                            })
                          }
                        >
                          <MdVisibility />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(enq._id)}
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                        >
                          <FaTrashAlt />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      No enquiries found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Pagination
        totalItems={enquiries.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default EnquiryByDate;
