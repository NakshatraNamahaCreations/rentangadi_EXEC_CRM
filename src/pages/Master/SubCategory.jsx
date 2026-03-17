import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Card, Table, Container } from "react-bootstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { ApiURL, ImageApiURL } from "../../api";
import Pagination from "../../components/Pagination";

const SubCategory = () => {
  const [showModal, setShowModal] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState({
    subcategory: "",
    subcatimg: null,
    category: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    getSubcategory();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${ApiURL}/category/getcategory`);
      if (res.status === 200) {
        setCategories(res.data.category);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
    }
  };

  const getSubcategory = async () => {
    try {
      const res = await axios.get(`${ApiURL}/subcategory/getappsubcat`);
      console.log("res: ", res.data);
      if (res.status === 200) {
        const sortedData = res.data.subcategory.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA; 
        });

        setSubCategories(sortedData);
      } else {
        console.warn("Unexpected response structure:", res.data);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to fetch subcategories"); // Optional user feedback
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSubCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewSubCategory((prev) => ({
        ...prev,
        subcatimg: file,
      }));
    }
  };

  const resetForm = () => {
    setNewSubCategory({ subcategory: "", subcatimg: null, category: "" });
    setSelectedCategory("");
    setError("");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleAddSubCategory = async () => {
    if (
      !newSubCategory.subcategory ||
      (!newSubCategory.subcatimg && !isEditing) ||
      !selectedCategory
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("subcategory", newSubCategory.subcategory);
    formData.append("category", selectedCategory); // category name
    if (newSubCategory.subcatimg) {
      formData.append("subcatimg", newSubCategory.subcatimg);
    }

    try {
      const url = isEditing
        ? `${ApiURL}/subcategory/editappsubcat/${editingId}`
        : `${ApiURL}/subcategory/addappsubcat`;

      const response = isEditing
        ? await axios.put(url, formData)
        : await axios.post(url, formData);

      if (response.status === 200) {
        toast.success(`Successfully ${isEditing ? "updated" : "added"}`);
        getSubcategory();
        resetForm();
        setShowModal(false);
      } else {
        toast.error("Failed to save subcategory");
      }
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  const handleEditSubCategory = (subCategory) => {
    setIsEditing(true);
    setEditingId(subCategory._id);
    setNewSubCategory({
      subcategory: subCategory.subcategory,
      subcatimg: null,
      category: subCategory.category,
    });
    setSelectedCategory(subCategory.category);
    setShowModal(true);
    setError("");
  };

  const handleDeleteSubCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete?")) {
      try {
        const response = await axios.delete(
          `${ApiURL}/subcategory/deleteappsubcat/${id}`
        );
        if (response.status === 200) {
          toast.success("Successfully deleted");
          getSubcategory();
          setSelectedRows((prev) =>
            prev.filter((idx) => subCategories[idx]._id !== id)
          );
        } else {
          toast.error("Failed to delete subcategory");
        }
      } catch (error) {
        console.error(error.message);
        toast.error("Deletion failed");
      }
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const handleSelectAllRows = (checked) => {
    const currentPageIds = currentItems.map((item) => item._id);
    if (checked) {
      const updated = [...new Set([...selectedRows, ...currentPageIds])];
      setSelectedRows(updated);
    } else {
      const remaining = selectedRows.filter(
        (id) => !currentPageIds.includes(id)
      );
      setSelectedRows(remaining);
    }
  };

  const handleDeleteSelected = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete selected sub-categories?"
    );
    if (!confirmDelete) return;

    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(`${ApiURL}/subcategory/deleteappsubcat/${id}`)
        )
      );
      toast.success("Selected sub-categories deleted");
      getSubcategory();
      setSelectedRows([]); // clear selection after delete
    } catch (err) {
      console.error(err);
      toast.error("Error deleting selected sub-categories");
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const filteredSubCategories = subCategories.filter((subCategory) =>
    (subCategory.subcategory || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <Container>
      {/* Search & Buttons */}
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          type="text"
          placeholder="Search Sub-Category"
          value={searchQuery}
          onChange={handleSearchChange}
          className="shadow-sm"
          style={{ width: "250px", fontSize: "12px" }}
        />
        <div className="d-flex gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            variant="primary"
            className="fw-semibold "
            style={{
              fontSize: "12px",
              background: "#BD5525",
              borderColor: "#BD5525",
            }}
          >
            + Add Sub-Category
          </Button>
          {selectedRows.length > 0 && (
            <Button
              variant="outline-danger"
              onClick={handleDeleteSelected}
              style={{ fontSize: "12px" }}
            >
              Delete {selectedRows.length} Selected
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 p-3 shadow-sm">
        <div
          className="table-responsive"
          style={{ maxHeight: "65vh", overflowY: "auto", fontSize: "12px " }}
        >
          <Table className="table table-hover align-middle">
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F" }}
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
                <th className="text-start">Sub-Category Name</th>
                <th className="text-start">Category</th>
                <th className="text-start">Sub-Category Image</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((subCategory, index) => (
                <tr key={subCategory._id} className="text-center">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(subCategory._id)}
                      onChange={() => handleSelectRow(subCategory._id)}
                    />
                  </td>
                  <td className="text-start">{subCategory.subcategory}</td>
                  <td className="text-start">{subCategory.category}</td>
                  <td className="text-start">
                    {subCategory.subcatimg ? (
                      <img
                        src={`${ImageApiURL}/subcategory/${subCategory.subcatimg}`}
                        alt={subCategory.subcategory}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="me-2"
                      onClick={() => handleDeleteSubCategory(subCategory._id)}
                    >
                      <FaTrashAlt />
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleEditSubCategory(subCategory)}
                    >
                      <FaEdit />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredSubCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    No sub-categories found.
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
            {isEditing ? "Edit Sub-Category" : "Add Sub-Category"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-danger">{error}</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sub-Category Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Sub-Category Name"
                name="subcategory"
                value={newSubCategory.subcategory}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Sub-Category Image {isEditing && "(Optional)"}
              </Form.Label>
              <Form.Control type="file" onChange={handleImageChange} />
              {isEditing && newSubCategory.subcatimg && (
                <img
                  src={URL.createObjectURL(newSubCategory.subcatimg)}
                  alt="Preview"
                  style={{ width: "80px", marginTop: "10px" }}
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleAddSubCategory}>
            {isEditing ? "Update" : "Add"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              resetForm();
              setShowModal(false);
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Pagination
        totalItems={filteredSubCategories.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default SubCategory;
