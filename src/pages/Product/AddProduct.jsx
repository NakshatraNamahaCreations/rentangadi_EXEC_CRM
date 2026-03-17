

import React, { useEffect, useState } from "react";
import { Form, Button, Row, Col, Container, Card } from "react-bootstrap";
import { FaUpload, FaDownload, FaPlus } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ApiURL, ImageApiURL } from "../../api";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [productData, setProductData] = useState({
    productName: "",
    category: "",
    subCategory: "",
    availableStock: "",
    pricing: "",
    sizeAndWeight: "",
    quantity: "",
    minQuantity: "",
    seater: "",
    color: "",
    material: "",
    description: "",
    productIcon: null,
    repairCount: 0,
  });

  const [iconPreview, setIconPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subCategoryData, setSubCategoryData] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (id) {
      setIsEditMode(true);
      fetchProductById(id);
    }
  }, [id]);

  useEffect(() => {
    if (productData.category) {
      fetchSubcategoriesByCategoryName(productData.category);
    } else {
      setSubCategoryData([]);
    }
  }, [productData.category]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ApiURL}/category/getcategory`);
      if (res.status === 200) {
        setCategoryData(res.data?.category || []);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Error fetching categories");
    }
  };

  const fetchSubcategoriesByCategoryName = async (category) => {
    try {
      const response = await axios.post(`${ApiURL}/subcategory/postappsubcat`, {
        category,
      });
      if (response.status === 200 && response.data.subcategories) {
        setSubCategoryData(response.data.subcategories);
      } else {
        setSubCategoryData([]);
      }
    } catch (error) {
      setSubCategoryData([]);
    }
  };

  // Fetch product data for editing
  const fetchProductById = async (id) => {
    try {
      const res = await axios.get(`${ApiURL}/product/product-details/${id}`);
      if (res.status === 200 && res.data.product) {
        const p = res.data.product;
        setProductData({
          productName: p.ProductName || "",
          category: p.ProductCategory || "",
          subCategory: p.ProductSubcategory || "",
          availableStock: p.ProductStock || "",
          pricing: p.ProductPrice || "",
          sizeAndWeight: p.ProductSize || "",
          quantity: p.qty || "",
          minQuantity: p.minqty || "",
          seater: p.seater || "",
          color: p.Color || "",
          material: p.Material || "",
          description: p.ProductDesc || "",
          productIcon: p.ProductIcon || null, // Use existing icon if available
          repairCount: p.repairCount || 0,
        });
        if (p.ProductIcon) {
          setIconPreview(`${ImageApiURL}/product/${p.ProductIcon}`);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch product details");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? { subCategory: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData((prev) => ({ ...prev, productIcon: file }));
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "ProductName,ProductDesc,ProductCategory,ProductSubcategory,ProductStock,ProductPrice,seater,Material,ProductSize,Color,qty,minqty\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    setExcelFile(file);
  };

  const handleExcelAdd = async () => {
    if (!excelFile) {
      toast.error("Please select a file");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const mappedData = jsonData.map((item) => ({
          ProductName: item["ProductName"],
          ProductDesc: item["ProductDesc"],
          ProductCategory: item["ProductCategory"],
          ProductSubcategory: item["ProductSubcategory"],
          ProductStock: item["ProductStock"],
          ProductPrice: item["ProductPrice"],
          seater: item["seater"],
          Material: item["Material"],
          ProductSize: item["ProductSize"],
          Color: item["Color"],
          qty: item["qty"],
          minqty: item["minqty"],
        }));

        const response = await axios.post(
          `${ApiURL}/product/bulkuploadproduct`,
          mappedData
        );

        if (response.status === 200) {
          toast.success("Products Added Successfully!");
          window.location.reload();
        }
      } catch (error) {
        toast.error("Failed to add products. Please try again.");
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!productData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!productData.subCategory) {
      toast.error("Please select a subcategory");
      return;
    }
    if (!productData.productName) {
      toast.error("Please enter a product name");
      return;
    }
    // if (!productData.description) {
    //   toast.error("Please enter a product description");
    //   return;
    // }
    if (!productData.pricing) {
      toast.error("Please enter a product price");
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("ProductCategory", productData.category);
    formData.append("ProductSubcategory", productData.subCategory);
    formData.append("ProductName", productData.productName);
    formData.append("ProductDesc", productData.description);
    formData.append("ProductPrice", productData.pricing);
    formData.append("ProductStock", productData.availableStock);
    formData.append("seater", productData.seater);
    formData.append("Material", productData.material);
    formData.append("ProductSize", productData.sizeAndWeight);
    formData.append("Color", productData.color);
    formData.append("qty", productData.quantity);
    formData.append("minqty", productData.minQuantity);
    formData.append("repairCount", productData.repairCount); // <-- Add this line

    // Only append icon if new file selected or adding
    if (productData.productIcon) {
      formData.append("ProductIcon", productData.productIcon);
    }

    try {
      setLoading(true);
      let response;
      if (isEditMode) {
        // Update product
        response = await axios.put(
          `${ApiURL}/product/editProducts/${id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        // Add product
        if (!productData.productIcon) {
          toast.error("Please upload a product icon");
          setLoading(false);
          return;
        }
        response = await axios.post(`${ApiURL}/product/addProducts`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.status === 200) {
        toast.success(
          isEditMode
            ? "Product updated successfully"
            : "Product added successfully"
        );
        setSuccessMessage(
          isEditMode
            ? "Product updated successfully!"
            : "Product added successfully!"
        );
        setTimeout(() => setSuccessMessage(""), 3000);
        setProductData({
          productName: "",
          category: "",
          subCategory: "",
          availableStock: "",
          pricing: "",
          sizeAndWeight: "",
          quantity: "",
          minQuantity: "",
          seater: "",
          color: "",
          material: "",
          description: "",
          productIcon: null,
          repairCount: "", // <-- Add this line
        });
        setIconPreview(null);
        setTimeout(() => navigate("/product-management"), 1000);
      } else {
        toast.error("Failed to submit product");
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("An error occurred while submitting the product");
    }
  };

  return (
    <Container className="my-5">
      <Toaster />
      <Card className="shadow-lg border-0 rounded-4">
        <div
          className="py-3 px-4 rounded-top"
          style={{
            background: "linear-gradient(90deg, #323D4F, rgb(154, 155, 156))",
            color: "#fff",
          }}
        >
          <h4 className="mb-0 flex-grow-1" style={{ fontSize: 18 }}>
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h4>
        </div>

        <Card.Body className="p-4">
          <Form
            onSubmit={handleSubmit}
            style={{ fontSize: "14px" }}
            autoComplete="off"
          >
            {/* Product Name */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: 14 }}>
                Product Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="productName"
                value={productData.productName}
                onChange={handleChange}
                required
                className="rounded-3 shadow-sm"
                style={{ fontSize: 14 }}
              />
            </Form.Group>

            {/* Category + Subcategory */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label style={{ fontSize: 14 }}>
                  Category <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="category"
                  value={productData.category}
                  onChange={handleChange}
                  required
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                >
                  <option value="">Select Category</option>
                  {categoryData.map((cat) => (
                    <option key={cat._id} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label style={{ fontSize: 14 }}>
                  Subcategory <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="subCategory"
                  value={productData.subCategory}
                  onChange={handleChange}
                  required
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                  disabled={!productData.category}
                >
                  <option value="">Select Subcategory</option>
                  {subCategoryData.map((subcat) => (
                    <option key={subcat._id} value={subcat.subcategory}>
                      {subcat.subcategory}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {/* Stock + Pricing + Size & Weight */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Available Stock 
                  {/* <span className="text-danger">*</span> */}
                </Form.Label>
                <Form.Control
                  type="number"
                  name="availableStock"
                  value={productData.availableStock}
                  onChange={handleChange}
                  // required
                  disabled
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Pricing <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="pricing"
                  value={productData.pricing}
                  onChange={handleChange}
                  required
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Size & Weight (optional)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="sizeAndWeight"
                  value={productData.sizeAndWeight}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
            </Row>

            {/* Quantity + Min Quantity + Seater */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Quantity <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={productData.quantity}
                  onChange={handleChange}
                  required
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>Min Quantity</Form.Label>
                <Form.Control
                  type="number"
                  name="minQuantity"
                  value={productData.minQuantity}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Seater (optional)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="seater"
                  value={productData.seater}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
            </Row>
            {/* <Row className="mb-3">
              <Col md={4}>
                <Form.Label style={{ fontSize: 14 }}>
                  Repair Count
                </Form.Label>
                <Form.Control
                  type="number"
                  name="repairCount"
                  value={productData.repairCount}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                  min={0}
                />
              </Col>
            </Row> */}

            {/* Color + Material */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label style={{ fontSize: 14 }}>Color</Form.Label>
                <Form.Control
                  type="text"
                  name="color"
                  value={productData.color}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
              <Col md={6}>
                <Form.Label style={{ fontSize: 14 }}>Material</Form.Label>
                <Form.Control
                  type="text"
                  name="material"
                  value={productData.material}
                  onChange={handleChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                />
              </Col>
            </Row>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: 14 }}>
                Product Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={productData.description}
                onChange={handleChange}
                // required
                className="rounded-3 shadow-sm"
                style={{ fontSize: 14 }}
              />
            </Form.Group>

            {/* Product Icon Upload */}
            <Form.Group className="mb-4">
              <Form.Label style={{ fontSize: 14 }}>
                Upload Product Icon
                {!isEditMode && <span className="text-danger">*</span>}
              </Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="rounded-3 shadow-sm"
                  style={{ fontSize: 14 }}
                  required={!isEditMode}
                />
                <FaUpload style={{ fontSize: "18px", color: "#323D4F" }} />
              </div>
              {(iconPreview ||
                (isEditMode && !iconPreview && productData.productIcon === null && iconPreview !== null)) && (
                  <div className="mt-3">
                    <img
                      src={iconPreview}
                      alt="Preview"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
            </Form.Group>

            {/* Add/Update Product Button */}
            <Button
              type="submit"
              className="w-100 py-2 rounded-3"
              style={{
                backgroundColor: "#323D4F",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
              disabled={loading}
            >
              <FaPlus className="mb-1" />{" "}
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Adding..."
                : isEditMode
                  ? "Update Product"
                  : "Add Product"}
            </Button>

            {/* Success Message */}
            {successMessage && (
              <div
                className="text-success text-center mt-3 fade-in"
                style={{ fontSize: "13px", transition: "opacity 0.5s ease-in" }}
              >
                {successMessage}
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddProduct;
