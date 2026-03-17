import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Container, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { ApiURL } from '../../api';
import { toast } from 'react-hot-toast';
import Pagination from "../../components/Pagination";
import Select from 'react-select';

const DamagedProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAddProduct, setSelectedAddProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [damagedCount, setDamagedCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [repairDescription, setRepairDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableToAdd, setAvailableToAdd] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${ApiURL}/product/quoteproducts`);
      setProducts(response.data.QuoteProduct || []);
      setAvailableToAdd(response.data.QuoteProduct || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setLoading(false);
    }
  };

  const handleProductSelect = (selected) => {
    if (selected) {
      const product = availableToAdd.find(p => p._id === selected.value);
      setSelectedAddProduct(product);
      setDamagedCount(product.repairCount || 0);
      setLostCount(product.lostCount || 0);
      setRepairDescription(product.repairDescription || '');
    } else {
      setSelectedAddProduct(null);
      setDamagedCount(0);
      setLostCount(0);
      setRepairDescription('');
    }
  };

  const handleAddDamaged = async () => {
    try {
      if (!selectedAddProduct) {
        toast.error('Please select a product');
        return;
      }

      console.log(`selectedAddProduct: `, selectedAddProduct);
      console.log(`damagedCount: ${damagedCount}`);
      console.log(`lostCount: ${lostCount}`);
      console.log(`repairDescription: ${repairDescription}`);

      const response = await axios.post(`${ApiURL}/product/damaged-products`, {
        productId: selectedAddProduct._id,
        repairCount: damagedCount,
        lostCount,
        repairDescription
      });

      if (response.status === 200) {
        toast.success('Damaged/Lost product added successfully');
        setShowAddModal(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding damaged product:', error);
      toast.error('Failed to add damaged/lost product');
    }
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    setSelectedAddProduct(null);
    setDamagedCount(0);
    setLostCount(0);
    setRepairDescription('');
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.ProductName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <h4>Damaged/Lost Products</h4>
        </Col>
        <Col className="text-end">
          <Button variant="primary" 
          style={{
            backgroundColor: "#BD5525",
            border: "none",
            color: "white",
            transition: "background 0.2s",
          }}
          onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" />Add Damaged/Lost Product
          </Button>
        </Col>
      </Row>

      <Modal show={showAddModal} onHide={handleCloseAdd} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Damaged/Lost Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="addProductSelect">
              <Form.Label>Product Name</Form.Label>
              <Select
                options={availableToAdd.map((p) => ({
                  value: p._id,
                  label: p.ProductName,
                }))}
                value={
                  selectedAddProduct
                    ? {
                      value: selectedAddProduct._id,
                      label: selectedAddProduct.ProductName,
                    }
                    : null
                }
                onChange={handleProductSelect}
                isClearable
                placeholder="Search product..."
              />
            </Form.Group>
            {selectedAddProduct && (
              <>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedAddProduct.ProductCategory}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Stock</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedAddProduct.qty}
                        disabled
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        value={repairDescription}
                        onChange={(e) => setRepairDescription(e.target.value)}
                        placeholder="Enter repair/damage description..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Damaged Count</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={damagedCount}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setDamagedCount(val);
                        }}
                      />
                      <Form.Text className="text-muted">
                        Current damaged count: {selectedAddProduct.repairCount || 0}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lost Count</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={lostCount}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setLostCount(val);
                        }}
                      />
                      <Form.Text className="text-muted">
                        Current lost count: {selectedAddProduct.lostCount || 0}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAdd}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleAddDamaged}
            disabled={!selectedAddProduct}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DamagedProductList;
