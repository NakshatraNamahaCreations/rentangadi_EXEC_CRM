
import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Container, Form, Table, Spinner } from "react-bootstrap";
import { FaTrashAlt, FaEdit } from "react-icons/fa";
import { MdVisibility } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ApiURL } from "../../api";
import Pagination from "../../components/Pagination";
import { toast } from "react-hot-toast";
import { AuthManager } from "../../utils/auth";

const EnquiryList = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchEnquiries = async () => {
      setLoading(true);
      try {
        // ✅ same logic as your first component
        const { user } = AuthManager.getAuthData() || {};
        let clientId = "";

        if (user?.role === "client") clientId = user?._id;
        else clientId = user?.clientId;

        if (!clientId) {
          toast.error("Client id not found. Please login again.");
          setEnquiries([]);
          setLoading(false);
          return;
        }

        // ✅ fetch only logged in user's enquiries
        const res = await axios.get(`${ApiURL}/Enquiry/my-enquiries/${clientId}`);

        if (res.status === 200) {
          // ✅ match your first API response shape
          setEnquiries(res.data.enquiryData || []);
        }
      } catch (error) {
        console.error("Error fetching enquiries:", error);
        toast.error("Failed to fetch enquiries");
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  // ✅ reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedEnquiries([]);
  }, [searchQuery]);

  // Filter
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enquiries.filter((e) => {
      return (
        (e.enquiryId && String(e.enquiryId).toLowerCase().includes(q)) ||
        (e.clientName && e.clientName.toLowerCase().includes(q)) ||
        (e.GrandTotal && String(e.GrandTotal).toLowerCase().includes(q)) ||
        (e.executivename && e.executivename.toLowerCase().includes(q)) ||
        (e.enquiryDate && String(e.enquiryDate).toLowerCase().includes(q))
      );
    });
  }, [enquiries, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`${ApiURL}/Enquiry/deleteEnquiry/${id}`);
      if (response.status === 200) {
        setEnquiries((prev) => prev.filter((enq) => enq._id !== id));
        setSelectedEnquiries((prev) => prev.filter((x) => x !== id));
        toast.success("Successfully Deleted");
      }
    } catch (error) {
      toast.error("Enquiry Not Deleted");
      console.error("Error deleting the Enquiry:", error);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedEnquiries((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEnquiries.length === currentItems.length && currentItems.length > 0) {
      setSelectedEnquiries([]);
    } else {
      setSelectedEnquiries(currentItems.map((e) => e._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete selected enquiries?")) return;

    try {
      for (const id of selectedEnquiries) {
        await axios.delete(`${ApiURL}/Enquiry/deleteEnquiry/${id}`);
      }

      setEnquiries((prev) => prev.filter((enq) => !selectedEnquiries.includes(enq._id)));
      setSelectedEnquiries([]);
      toast.success("Selected enquiries deleted");
    } catch (err) {
      toast.error("Failed to delete some enquiries.");
      console.error(err);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedEnquiries([]); // ✅ clear selection when page changes
  };

  return (
    <Container className="my-4">
      <Card className="shadow-sm mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Enquiry List
          </h5>

          <Button
            size="sm"
            style={{ backgroundColor: "#BD5525", border: "none", transition: "background 0.2s" }}
            onClick={() => navigate("/add-new-enquiry")}
            className="add-btn"
          >
            Create Enquiry
          </Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <div className="mb-3">
            <Form.Control
              size="sm"
              style={{ fontSize: "0.92rem", maxWidth: 300 }}
              placeholder="Search by Enquiry Id, Company, Executive, or Date"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
            <Table striped bordered hover className="mb-0" style={{ fontSize: "0.82rem" }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ width: "5%" }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedEnquiries.length === currentItems.length && currentItems.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ width: "10%" }}>Enquiry Id</th>
                  <th style={{ width: "12%" }}>Enquiry Date</th>
                  <th style={{ width: "12%" }}>Time</th>
                  <th style={{ width: "18%" }}>Company Name</th>
                  <th style={{ width: "15%" }}>Executive Name</th>
                  <th style={{ width: "10%" }}>GrandTotal</th>
                  <th style={{ width: "10%" }} className="text-center">Status</th>
                  <th style={{ width: "10%" }} className="text-center">
                    Actions
                  </th>
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
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((enq) => (
                    <tr key={enq._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.includes(enq._id)}
                          onChange={() => handleSelectRow(enq._id)}
                        />
                      </td>
                      <td>{enq.enquiryId}</td>
                      <td>{enq.enquiryDate}</td>
                      <td>{enq.enquiryTime}</td>
                      <td>{enq.clientName}</td>
                      <td>{enq.executivename}</td>
                      <td>{enq.GrandTotal}</td>
                      <td className="text-center">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#fff",
                            backgroundColor: enq.status === "sent" ? "#28a745" : "#f0ad4e",
                          }}
                        >
                          {enq.status === "sent" ? "Confirmed" : "Pending"}
                        </span>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                          onClick={() => navigate(`/edit-enquiry/${enq._id}`)}
                          title="Edit"
                        >
                          <FaEdit />
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-2"
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                          onClick={() => handleDelete(enq._id)}
                          title="Delete"
                        >
                          <FaTrashAlt />
                        </Button>

                        <Button
                          variant="outline-dark"
                          size="sm"
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                          onClick={() => navigate(`/enquiry-details/${enq._id}`)}
                          title="View"
                        >
                          <MdVisibility />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <Pagination
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </Container>
  );
};

export default EnquiryList;

