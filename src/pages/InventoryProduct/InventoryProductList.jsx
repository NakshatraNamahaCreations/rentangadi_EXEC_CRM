import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Table,
} from "react-bootstrap";
import axios from "axios";
import Select from "react-select"; // Import react-select
import { ApiURL, ImageApiURL } from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const exportToExcel = (data, filename = 'InventoryData.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(file, filename);
};


const InventoryProduct = () => {
  const [deliveryDate, setDeliveryDate] = useState("");
  const [dismantleDate, setDismantleDate] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${ApiURL}/product/getProducts`);
        console.log("product: ", response.data.Product);
        const productOptions = response.data.Product.map((product) => ({
          value: product._id,
          label: product.ProductName,
          image: product.ProductIcon,
        }));
        setProducts([
          { value: "ALL_PRODUCTS", label: "All Products" },
          ...productOptions,
        ]);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Handle product selection
  const handleProductSelect = (selectedOptions) => {
    if (!selectedOptions) {
      setSelectedProducts([]);
      return;
    }
    // If "All Products" is selected, select all except "All Products"
    const isAllSelected = selectedOptions.some(opt => opt.value === "ALL_PRODUCTS");
    if (isAllSelected) {
      setSelectedProducts(
        products
          .filter((opt) => opt.value !== "ALL_PRODUCTS")
          .map((opt) => opt.value)
      );
    } else {
      setSelectedProducts(selectedOptions.map((option) => option.value));
    }
  };
  // Handle fetching inventory based on selected products and dates
  const handleFetchInventory = async () => {
    if (!deliveryDate || !dismantleDate) {
      alert("Please select both Start Date and End Date.");
      return;
    }

    try {
      const response = await axios.get(`${ApiURL}/inventory/filter/`, {
        params: {
          startDate: format(deliveryDate, 'dd-MM-yyyy'),
          endDate: format(dismantleDate, 'dd-MM-yyyy'),
          products: selectedProducts.join(","),
        },
      });
      console.log("inventory: ", response.data);
      setInventory(response.data.stock);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleExport = () => {
    const dataToExport = inventory.map(item => ({
      'Product Name': item.productName,
      'Available Stock': item.availableStock,
      'Blocked Stock': item.reservedStock,
      'Total Stock': item.totalStock,
      'Price': item.price
    }));

    exportToExcel(dataToExport);
  };

  return (
    <Container className="my-4">
      <Card className="shadow-sm p-4">
        <h5 className="mb-4 text-dark">Filter Inventory</h5>
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Group controlId="deliveryDate">
            <h6 className="text-dark">Start Date</h6>
              {/* <Form.Control
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                size="sm"
              /> */}
              <DatePicker
                selected={deliveryDate} // Default to initial quoteDate
                onChange={(date) => {
                  setDeliveryDate(date);
                }}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="DD/MM/YYYY"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="dismantleDate">
            <h6 className="text-dark">End Date</h6>
              <DatePicker
                selected={dismantleDate} // Default to initial quoteDate
                onChange={(date) => {
                  setDismantleDate(date);
                }}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="DD/MM/YYYY"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            {/* Product selection */}
            <h6 className="text-dark">Select Products</h6>
            <Select
              isMulti
              options={products}
              value={
                selectedProducts.length === products.length - 1 && products.length > 1
                  ? products
                  : products.filter((product) => selectedProducts.includes(product.value))
              }
              onChange={handleProductSelect}
              placeholder="Select products"
              getOptionLabel={(e) => e.label}
              getOptionValue={(e) => e.value}
              styles={{
                valueContainer: (base) => ({
                  ...base,
                  maxHeight: 80,
                  overflowY: "auto",
                  flexWrap: "wrap",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </Col>
        </Row>

        <div className=" d-flex justify-content-end gap-2 mt-4">
          <Button
            variant="success"
            size="sm"
            // className="w-100"
            style={{
              backgroundColor: "#BD5525",
              border: "none",
              color: "white",
              transition: "background 0.2s",
            }}          
            onClick={handleFetchInventory}
          >
            Fetch Filtered Inventory
          </Button>
          <Button
            variant="success"
            size="sm"
            style={{
              backgroundColor: "#BD5525",
              border: "none",
              color: "white",
              transition: "background 0.2s",
            }}          
            // className="w-100"
            onClick={handleExport}
          >
            Download Excel
          </Button>
        </div>

        {/* Display the selected inventory */}
        {inventory.length > 0 && (
          <Row className="mt-4">
            <Col md={12}>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Product Icon</th>
                    <th>Available Stock</th>
                    <th>Blocked Stock</th>
                    <th>Total Stock</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    // Find the product in the products array to get the icon
                    const productOption = products.find(p => p.value === item.productId);
                    const icon = productOption?.image;
                    return (
                      <tr key={item.productId}>
                        <td>{item.productName}</td>
                        <td>
                          {icon && (
                            <img
                              src={`${ImageApiURL}/product/${icon}`}
                              alt={item.productName}
                              style={{ width: "64px", height: "32px", marginRight: 8, objectFit: "contain" }}
                            />
                          )}

                        </td>
                        <td>{item.availableStock}</td>
                        <td>{item.reservedStock}</td>
                        <td>{item.totalStock}</td>
                        <td>{item.price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Col>
          </Row>
        )}
      </Card>
    </Container>
  );
};

export default InventoryProduct;
