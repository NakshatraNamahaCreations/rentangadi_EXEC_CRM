import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Card, Table, Container } from "react-bootstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { ApiURL, ImageApiURL } from "../../api.js";
import Pagination from "../../components/Pagination";

const Category = () => {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    categoryName: "",
    categoryImage: "",
    previewImage: "",
  });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${ApiURL}/category/getcategory`);
      if (res.status === 200) {
        setCategories(res.data.category);
        setFilterData(res.data.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    const filtered = categories.filter((category) =>
      category.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilterData(filtered);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCategory((prev) => ({
        ...prev,
        categoryImage: file,
        previewImage: URL.createObjectURL(file),
      }));
    }
  };

  const handleAddOrEditCategory = async () => {
    if (!newCategory.categoryName || !newCategory.categoryImage) {
      setError("Please fill in both category name and image.");
      return;
    }

    const formData = new FormData();
    formData.append("category", newCategory.categoryName);
    if (newCategory.categoryImage instanceof File) {
      formData.append("categoryImg", newCategory.categoryImage);
    }

    try {
      if (isEditing) {
        const response = await axios.put(
          `${ApiURL}/category/editcategory/${editingId}`,
          formData
        );
        toast.success("Category updated successfully");
      } else {
        const config = {
          url: "/category/addcategory",
          method: "post",
          baseURL: ApiURL,
          data: formData,
        };
        const response = await axios(config);
        toast.success("Category added successfully");
      }

      fetchCategories();
      setShowModal(false);
      setNewCategory({ categoryName: "", categoryImage: "", previewImage: "" });
      setIsEditing(false);
      setEditingId(null);
      setError("");
    } catch (error) {
      console.error("Error saving the category:", error);
      toast.error("An error occurred");
    }
  };

  const handleEditCategory = (id) => {
    const selected = filterData.find((item) => item._id === id);
    setNewCategory({
      categoryName: selected.category,
      categoryImage: selected.categoryImg,
      previewImage: `${ImageApiURL}/category/${selected.categoryImg}`,
    });
    setIsEditing(true);
    setEditingId(id);
    setShowModal(true);
  };

  const handleDeleteCategory = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (confirmDelete) {
      try {
        await axios.delete(`${ApiURL}/category/deletecategory/${id}`);
        toast.success("Category deleted successfully");
        fetchCategories();
      } catch (error) {
        console.error("Error deleting the category:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const handleDeleteSelected = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete selected categories?"
    );
    if (!confirmDelete) return;

    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(`${ApiURL}/category/deletecategory/${id}`)
        )
      );
      toast.success("Selected categories deleted");
      fetchCategories();
      setSelectedRows([]);
    } catch {
      toast.error("Error deleting selected categories");
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

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filterData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container>
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          type="text"
          placeholder="Search Category"
          value={searchQuery}
          onChange={handleSearchChange}
          className="shadow-sm"
          style={{ width: "250px", fontSize: "12px" }}
        />

        <div className="d-flex gap-2">
          <Button
            onClick={() => {
              setShowModal(true);
              setNewCategory({
                categoryName: "",
                categoryImage: "",
                previewImage: "",
              });
              setIsEditing(false);
              setEditingId(null);
              setError("");
            }}
            variant="primary"
            className="fw-semibold  rounded-1 shadow-lg"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              background: "#BD5525",
              borderColor: "#BD5525",
            }}
          >
            + Add Category
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
          style={{ maxHeight: "65vh", overflowY: "auto", fontSize: "12px " }}
        >
          <Table className="table table-hover align-middle ">
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F" }}
            >
              <tr>
                <th>
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
                <th className="text-start">Category Name</th>
                <th className="text-start">Category Image</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((categoryItem) => (
                <tr key={categoryItem._id} className="text-center">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(categoryItem._id)}
                      onChange={() => handleSelectRow(categoryItem._id)}
                    />
                  </td>
                  <td className="text-start">{categoryItem.category}</td>
                  <td className="text-start">
                    <img
                      src={`${ImageApiURL}/category/${categoryItem.categoryImg}`}
                      alt={categoryItem.category}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="me-2"
                      style={{ fontSize: "10px" }}
                      onClick={() => handleDeleteCategory(categoryItem._id)}
                    >
                      <FaTrashAlt style={{ width: "12px", height: "12px" }} />
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      style={{ fontSize: "10px" }}
                      onClick={() => handleEditCategory(categoryItem._id)}
                    >
                      <FaEdit style={{ width: "12px", height: "12px" }} />
                    </Button>
                  </td>
                </tr>
              ))}

              {filterData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    No Categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            {isEditing ? "Edit Category" : "Add Category"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-danger">{error}</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Category Name"
                value={newCategory.categoryName}
                onChange={handleChange}
                name="categoryName"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>
              <Form.Control type="file" onChange={handleImageChange} />
              {newCategory.previewImage && (
                <img
                  src={newCategory.previewImage}
                  alt="Preview"
                  style={{ marginTop: "10px", width: "100px", height: "100px" }}
                />
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleAddOrEditCategory}>
            {isEditing ? "Update" : "Add"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Pagination
        totalItems={filterData.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default Category;
