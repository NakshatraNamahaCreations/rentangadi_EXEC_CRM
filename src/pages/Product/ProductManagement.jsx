import React, { useEffect, useState } from "react";
import { Button, Card, Table, Container, Modal, Form } from "react-bootstrap";
import Pagination from "../../components/Pagination";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ApiURL, ImageApiURL } from "../../api";
import { MdVisibility } from "react-icons/md";

const ProductManagement = () => {
  const navigate = useNavigate();
  // Load initial search state from localStorage
  const savedSearch = localStorage.getItem('productSearchQuery') || "";
  const [searchQuery, setSearchQuery] = useState(savedSearch);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${ApiURL}/product/getinventoryproducts`
      );
      if (response.status === 200) {
        setProducts(response.data.ProductsData);
        setFilteredProducts(response.data.ProductsData);
        console.log("producty", response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Save search query to localStorage
    localStorage.setItem('productSearchQuery', searchQuery);

    const filtered = products.filter((product) => {
      // Split the search query into words
      const searchWords = searchQuery.toLowerCase().split(' ').filter(word => word.trim());
      // Split product name into words
      const productWords = product.ProductName.toLowerCase().split(' ');
      const productWordsDesc = product.ProductDesc.toLowerCase().split(' ');

      // Check if all search words match either:
      // 1. As complete words, or
      // 2. As partial matches at the start of words
      return searchWords.every(searchWord =>
        productWords.some(productWord =>
          productWord === searchWord || productWord.startsWith(searchWord)
        ) || productWordsDesc.some(productWordDesc =>
          productWordDesc === searchWord || productWordDesc.startsWith(searchWord)
        )
      );
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);

    return () => {
      console.log("cleanup func: ", location.pathname);
      // Only clear search state when navigating away to a different module
      if (location.pathname !== '/product-management' &&
        !location.pathname.startsWith('/product-details/') &&
        !location.pathname.startsWith('/edit-product/')) {
        console.log("clearing search state: ", location.pathname);

        setSearchQuery("");
        localStorage.removeItem('productSearchQuery');
      }
    };
  }, [searchQuery, products]);

  const handleDeleteProduct = async (id) => {
    const confirmDelete = window.confirm("Are you sure you wanna delete?");
    if (!confirmDelete) return;
    try {
      await axios.delete(`${ApiURL}/product/deleteProducts/${id}`);
      fetchProducts(); // Refresh data
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (id) => {
    navigate(`/edit-product/${id}`);
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = (checked) => {
    const currentPageIds = currentItems.map((product) => product._id);
    if (checked) {
      // const newSelected = [...new Set([...selectedRows, ...currentPageIds])];
      // Replace selectedRows with only current page IDs (like sub category page)
      const newSelected = [...new Set([...currentPageIds])];
      setSelectedRows(newSelected);
    } else {
      const remaining = selectedRows.filter(
        (id) => !currentPageIds.includes(id)
      );
      setSelectedRows(remaining);
    }
  };

  const handleDeleteSelected = async () => {
    const confirmDelete = window.confirm("Delete selected products?");
    if (!confirmDelete) return;

    try {
      await Promise.all(
        selectedRows.map((id) =>
          axios.delete(`${ApiURL}/product/deleteProducts/${id}`)
        )
      );

      fetchProducts();
      setSelectedRows([]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected products");
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <Container style={{ background: "#F4F4F4", paddingBlock: "20px" }}>
      <div className="d-flex justify-content-between mb-3">
        <div>
          <Form.Control
            type="text"
            placeholder="Search Product"
            value={searchQuery}
            onChange={handleSearchChange}
            className="shadow-sm"
            style={{ width: "250px", fontSize: "12px" }}
          />
        </div>
        <div className="d-flex gap-2">
          <Button
            onClick={() => navigate("/add-product")}
            variant="primary"
            className="fw-bold rounded-1 shadow-lg"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              background: "#BD5525",
              borderColor: "#BD5525",
            }}
          >
            + Add Product
          </Button>
          {/* Selected Rows Count */}
          {selectedRows.length > 0 && (
            <div>
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
            </div>
          )}
        </div>
      </div>

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
            }}
          >
            <thead
              className="text-white text-center"
              style={{ backgroundColor: "#323D4F", fontSize: "12px" }}
            >
              <tr>
                <th className="" style={{ width: "5%" }}>
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
                <th className="text-start" style={{ width: "15%" }}>
                  Product Image
                </th>
                <th className="text-start" style={{ width: "20%" }}>
                  Product Name
                </th>
                <th className="text-start" style={{ width: "10%" }}>
                  Stock
                </th>
                <th className="text-start" style={{ width: "10%" }}>
                  Pricing
                </th>
                <th className="text-start" style={{ width: "10%" }}>
                  Seater
                </th>
                <th className="text-start" style={{ width: "10%" }}>
                  Material
                </th>
                {/* <th className="text-start" style={{ width: "10%" }}>
                  Description
                </th> */}
                <th className="text-center" style={{ width: "15%" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((product, index) => (
                <tr key={product._id} className="text-center hover-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(product._id)}
                      onChange={() => handleSelectRow(product._id)}
                    />
                  </td>
                  <td>
                    <img
                      // src={`${ImageApiURL}product/${product.ProductIcon}`}
                      src={`${ImageApiURL}/product/${product.ProductIcon}`}
                      alt={product.ProductIcon}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    />
                  </td>
                  <td
                    className="fw-semibold text-start"
                    style={{ fontSize: "12px" }}
                  >
                    {product.ProductName}
                  </td>
                  <td className="text-start" style={{ fontSize: "12px" }}>
                    {product.ProductStock ? product.ProductStock : "0"}
                  </td>
                  <td className="text-start" style={{ fontSize: "12px" }}>
                    {product.ProductPrice}
                  </td>
                  <td className="text-start" style={{ fontSize: "12px" }}>
                    {product.seater ? product.seater : "N/A"}
                  </td>
                  <td className="text-start" style={{ fontSize: "12px" }}>
                    {product.Material ? product.Material : "N/A"}
                  </td>
                  {/* <td className="text-start" style={{ fontSize: "12px" }}>
                    {product.ProductDesc}
                  </td> */}
                  <td className="">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      className="me-2 icon-btn"
                      style={{ padding: "4px 8px", fontSize: "10px" }}
                      onClick={() =>
                        navigate(`/product-details/${product._id}`)
                      }
                    >
                      <MdVisibility />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="me-2 icon-btn"
                      style={{ padding: "4px 8px", fontSize: "10px" }}
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      <FaTrashAlt style={{ width: "12px", height: "12px" }} />
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="icon-btn"
                      style={{ padding: "4px 8px", fontSize: "10px" }}
                      onClick={() => handleEditProduct(product._id)}
                    >
                      <FaEdit style={{ width: "12px", height: "12px" }} />
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center">
                    No Products found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Pagination Component */}
      <Pagination
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default ProductManagement;
