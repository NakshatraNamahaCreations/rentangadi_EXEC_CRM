// import React, { useState } from "react";
// import { Modal, Button, Form, Card, Table, Container } from "react-bootstrap";
// import { FaEdit, FaTrashAlt } from "react-icons/fa";
// import Pagination from "../../components/Pagination";

// const TermsAndConditions = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [terms, setTerms] = useState([
//     {
//       id: 1,
//       category: "Sofa",
//       header: "Rental Period",
//       description: "The sofa must be rented for a minimum of 3 months.",
//     },
//     {
//       id: 2,
//       category: "Bed",
//       header: "Damage Charges",
//       description:
//         "Any physical damage to the bed will incur repair or replacement costs.",
//     },
//     {
//       id: 3,
//       category: "Dining Table",
//       header: "Return Policy",
//       description:
//         "The dining table must be returned in good condition within 7 days after rental ends.",
//     },
//     {
//       id: 4,
//       category: "Office Chair",
//       header: "Maintenance",
//       description:
//         "Basic maintenance is covered. Customers must report issues within 24 hours.",
//     },
//   ]);
//   const [newTerm, setNewTerm] = useState({
//     category: "",
//     header: "",
//     description: "",
//   });
//   const [error, setError] = useState("");
//   const [isEditing, setIsEditing] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedRows, setSelectedRows] = useState([]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setNewTerm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleAddTerm = () => {
//     const { category, header, description } = newTerm;
//     if (category && header && description) {
//       if (isEditing) {
//         const updated = [...terms];
//         updated[editingIndex] = {
//           ...newTerm,
//           id: terms[editingIndex].id,
//         };
//         setTerms(updated);
//         setIsEditing(false);
//         setEditingIndex(null);
//       } else {
//         const newId = terms.length ? terms[terms.length - 1].id + 1 : 1;
//         setTerms([...terms, { ...newTerm, id: newId }]);
//       }
//       setShowModal(false);
//       setNewTerm({ category: "", header: "", description: "" });
//       setError("");
//     } else {
//       setError("Please fill all fields.");
//     }
//   };

//   const handleEditTerm = (index) => {
//     setIsEditing(true);
//     setEditingIndex(index);
//     setNewTerm(terms[index]);
//     setShowModal(true);
//   };

//   const handleDeleteTerm = (index) => {
//     const updated = terms.filter((_, i) => i !== index);
//     setTerms(updated);
//   };

//   const handleDeleteSelected = () => {
//     const updated = terms.filter((_, index) => !selectedRows.includes(index));
//     setTerms(updated);
//     setSelectedRows([]);
//   };

//   const handleSelectRow = (index) => {
//     const updated = [...selectedRows];
//     if (updated.includes(index)) {
//       updated.splice(updated.indexOf(index), 1);
//     } else {
//       updated.push(index);
//     }
//     setSelectedRows(updated);
//   };

//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//   };

//   const filteredTerms = terms.filter((term) =>
//     term.header.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
//       <div className="d-flex justify-content-between mb-3">
//         <Form.Control
//           type="text"
//           placeholder="Search Header"
//           value={searchQuery}
//           onChange={handleSearchChange}
//           className="shadow-sm"
//           style={{ width: "250px", fontSize: "12px" }}
//         />
//         <div className="d-flex gap-2">
//           <Button
//             onClick={() => {
//               setNewTerm({ category: "", header: "", description: "" });
//               setShowModal(true);
//             }}
//             variant="primary"
//             className="fw-bold rounded-1 shadow-lg"
//             style={{
//               fontSize: "12px",
//               padding: "6px 12px",
//               background: "#5c6bc0",
//               borderColor: "#5c6bc0",
//             }}
//           >
//             + Add Terms and Conditions
//           </Button>
//           {selectedRows.length > 0 && (
//             <Button
//               variant="outline-danger"
//               onClick={handleDeleteSelected}
//               style={{ fontSize: "12px", padding: "6px 12px" }}
//             >
//               Delete {selectedRows.length} Selected
//             </Button>
//           )}
//         </div>
//       </div>

//       <Card className="border-0 p-3 shadow-sm">
//         <div
//           className="table-responsive bg-white rounded-lg"
//           style={{ maxHeight: "65vh", overflowY: "auto" }}
//         >
//           <Table
//             className="table table-hover align-middle"
//             style={{
//               borderRadius: "8px",
//               fontSize: "14px",
//               border: "1px solid #e0e0e0",
//             }}
//           >
//             <thead
//               className="text-white text-center"
//               style={{ backgroundColor: "#323D4F" }}
//             >
//               <tr>
//                 <th>
//                   <input
//                     type="checkbox"
//                     onChange={(e) =>
//                       setSelectedRows(
//                         e.target.checked ? filteredTerms.map((_, i) => i) : []
//                       )
//                     }
//                   />
//                 </th>
//                 <th className="text-start">Category</th>
//                 <th className="text-start">Header</th>
//                 <th className="text-start">Description</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredTerms.map((term, index) => (
//                 <tr key={index} className="text-center">
//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={selectedRows.includes(index)}
//                       onChange={() => handleSelectRow(index)}
//                     />
//                   </td>
//                   <td className="text-start">{term.category}</td>
//                   <td className="text-start">{term.header}</td>
//                   <td className="text-start" style={{ whiteSpace: "pre-line" }}>
//                     {term.description}
//                   </td>

//                   <td>
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       className="me-2"
//                       onClick={() => handleDeleteTerm(index)}
//                     >
//                       <FaTrashAlt style={{ width: "12px", height: "12px" }} />
//                     </Button>
//                     <Button
//                       variant="outline-success"
//                       size="sm"
//                       onClick={() => handleEditTerm(index)}
//                     >
//                       <FaEdit style={{ width: "12px", height: "12px" }} />
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </div>
//       </Card>

//       {/* Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: "16px" }}>
//             {isEditing ? "Edit Term" : "Add Term"}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <p className="text-danger">{error}</p>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Category</Form.Label>
//               <Form.Select
//                 name="category"
//                 value={newTerm.category}
//                 onChange={handleChange}
//                 style={{ fontSize: "12px" }}
//               >
//                 <option value="">Select Category</option>
//                 <option value="Sofa">Sofa</option>
//                 <option value="Chair">Chair</option>
//                 <option value="Dining Table">Dining Table</option>
//               </Form.Select>
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Header</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="header"
//                 value={newTerm.header}
//                 onChange={handleChange}
//                 placeholder="Enter Header"
//                 style={{ fontSize: "12px" }}
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Description</Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={3}
//                 name="description"
//                 value={newTerm.description}
//                 onChange={handleChange}
//                 placeholder="Enter Description"
//                 style={{ fontSize: "12px" }}
//               />
//             </Form.Group>
//           </Form>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="dark"
//             onClick={handleAddTerm}
//             style={{ fontSize: "12px" }}
//           >
//             {isEditing ? "Update" : "Add"}
//           </Button>
//           <Button
//             variant="outline-secondary"
//             onClick={() => setShowModal(false)}
//             style={{ fontSize: "12px" }}
//           >
//             Cancel
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <Pagination totalItems={filteredTerms.length} />
//     </Container>
//   );
// };

// export default TermsAndConditions;

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Table, Container } from "react-bootstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Pagination from "../../components/Pagination";
import axios from "axios";
import { ApiURL } from "../../api";
import { toast } from "react-hot-toast";

const itemsPerPage = 5;

const TermsAndConditions = () => {
  const [showModal, setShowModal] = useState(false);
  const [terms, setTerms] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [newTerm, setNewTerm] = useState({
    category: "",
    header: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch terms and categories on mount
  useEffect(() => {
    fetchTerms();
    fetchCategories();
  }, []);

  const fetchTerms = async () => {
    try {
      const res = await axios.get(
        `${ApiURL}/termscondition/allTermsandCondition`
      );
      if (res.status === 200) {
        setTerms(
          (res.data.TermsandConditionData || []).map((item) => ({
            ...item,
            description: (item.points || []).map((p) => p.desc).join("\n"),
          }))
        );
      }
    } catch (error) {
      toast.error("Failed to fetch terms and conditions");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${ApiURL}/category/getcategory`);
      if (res.status === 200) {
        setCategoryData(res.data.category || []);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTerm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTerm = async () => {
    const { category, header, description } = newTerm;
    if (category && header && description) {
      if (isEditing) {
        try {
          await axios.put(
            `${ApiURL}/termscondition/edittermscondition/${editingId}`,
            {
              header,
              points: description.split("\n").map((desc) => ({ desc })),
              category,
            }
          );
          toast.success("Term updated");
          fetchTerms();
        } catch {
          toast.error("Failed to update term");
        }
        setIsEditing(false);
        setEditingId(null);
      } else {
        try {
          await axios.post(`${ApiURL}/termscondition/addtermscondition`, {
            header,
            points: description.split("\n").map((desc) => ({ desc })),
            category,
          });
          toast.success("Term added");
          fetchTerms();
        } catch {
          toast.error("Failed to add term");
        }
      }
      setShowModal(false);
      setNewTerm({ category: "", header: "", description: "" });
      setError("");
    } else {
      setError("Please fill all fields.");
    }
  };

  const handleEditTerm = (index) => {
    setIsEditing(true);
    setEditingId(filteredTerms[index]._id);
    setNewTerm({
      category: filteredTerms[index].category,
      header: filteredTerms[index].header,
      description: filteredTerms[index].description,
    });
    setShowModal(true);
  };

  const handleDeleteTerm = async (index) => {
    const id = filteredTerms[index]._id;
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete?")) return;
    try {
      await axios.delete(`${ApiURL}/termscondition/deleteTC/${id}`); // <-- changed to delete
      toast.success("Term deleted");
      fetchTerms();
      setSelectedRows((prev) => prev.filter((i) => i !== index));
    } catch {
      toast.error("Failed to delete term");
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Delete selected terms?")) return;
    try {
      await Promise.all(
        selectedRows.map(
          (index) =>
            axios.delete(
              `${ApiURL}/termscondition/deleteTC/${filteredTerms[index]._id}`
            ) // <-- changed to delete
        )
      );
      toast.success("Selected terms deleted");
      fetchTerms();
      setSelectedRows([]);
    } catch {
      toast.error("Failed to delete selected terms");
    }
  };

  const handleSelectRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllRows = (checked) => {
    if (checked) {
      setSelectedRows(currentItems.map((_, idx) => idx + indexOfFirstItem));
    } else {
      setSelectedRows((prev) =>
        prev.filter(
          (i) =>
            !currentItems.map((_, idx) => idx + indexOfFirstItem).includes(i)
        )
      );
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedRows([]);
  };

  // Filtering and pagination logic
  const filteredTerms = terms.filter((term) =>
    term.header.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTerms.slice(indexOfFirstItem, indexOfLastItem);

  // For select all on current page
  const allCurrentSelected =
    currentItems.length > 0 &&
    currentItems.every((_, idx) =>
      selectedRows.includes(idx + indexOfFirstItem)
    );

  return (
    <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          type="text"
          placeholder="Search Header"
          value={searchQuery}
          onChange={handleSearchChange}
          className="shadow-sm"
          style={{ width: "250px", fontSize: "12px" }}
        />
        <div className="d-flex gap-2">
          <Button
            onClick={() => {
              setNewTerm({ category: "", header: "", description: "" });
              setIsEditing(false);
              setEditingId(null);
              setShowModal(true);
            }}
            variant="primary"
            className="fw-bold rounded-1 shadow-lg"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              background: "#BD5525",
              borderColor: "#BD5525",
            }}
          >
            + Add Terms and Conditions
          </Button>
          {selectedRows.length > 0 && (
            <Button
              variant="outline-danger"
              onClick={handleDeleteSelected}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Delete {selectedRows.length} Selected
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 p-3 shadow-sm">
        <div
          className="table-responsive bg-white rounded-lg"
          style={{ maxHeight: "65vh", overflowY: "auto" }}
        >
          <Table
            className="table table-hover align-middle"
            style={{
              borderRadius: "8px",
              fontSize: "14px",
              border: "1px solid #e0e0e0",
            }}
          >
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F" }}
            >
              <tr>
                <th style={{ width: "5%" }}>
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={(e) => handleSelectAllRows(e.target.checked)}
                  />
                </th>
                <th className="text-start" style={{ width: "15%" }}>
                  Category
                </th>
                <th className="text-start" style={{ width: "15%" }}>
                  Header
                </th>
                <th className="text-start" style={{ width: "55%" }}>
                  Description
                </th>
                <th style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((term, idx) => {
                const globalIndex = idx + indexOfFirstItem;
                return (
                  <tr key={globalIndex} className="text-center">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(globalIndex)}
                        onChange={() => handleSelectRow(globalIndex)}
                      />
                    </td>
                    <td className="text-start">{term.category}</td>
                    <td className="text-start">{term.header}</td>
                    <td
                      className="text-start"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {term.description}
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-2"
                        onClick={() => handleDeleteTerm(globalIndex)}
                      >
                        <FaTrashAlt style={{ width: "12px", height: "12px" }} />
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleEditTerm(globalIndex)}
                      >
                        <FaEdit style={{ width: "12px", height: "12px" }} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No terms found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            {isEditing ? "Edit Term" : "Add Term"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-danger">{error}</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={newTerm.category}
                onChange={handleChange}
                style={{ fontSize: "12px" }}
              >
                <option value="">Select Category</option>
                {categoryData.map((cat) => (
                  <option key={cat._id} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Header</Form.Label>
              <Form.Control
                type="text"
                name="header"
                value={newTerm.header}
                onChange={handleChange}
                placeholder="Enter Header"
                style={{ fontSize: "12px" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newTerm.description}
                onChange={handleChange}
                placeholder="Enter Description (use new line for multiple points)"
                style={{ fontSize: "12px" }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="dark"
            onClick={handleAddTerm}
            style={{ fontSize: "12px" }}
          >
            {isEditing ? "Update" : "Add"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            style={{ fontSize: "12px" }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Pagination
        totalItems={filteredTerms.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default TermsAndConditions;
