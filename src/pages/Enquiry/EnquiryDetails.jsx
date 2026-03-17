import React, { useEffect, useState } from "react";
import Select from "react-select";
import {
  Card,
  Container,
  Row,
  Col,
  Button,
  Form,
  InputGroup,
  Table,
  Modal,
} from "react-bootstrap";
import {
  FaEdit,
  FaTrashAlt,
  FaUser,
  FaBuilding,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { ApiURL } from "../../api";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import moment from "moment";

const EnquiryDetails = () => {
  const { id } = useParams();
  const [allProducts, setAllProducts] = useState([]);
  const [confirmed, setConfirmed] = useState({});
  const [search, setSearch] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [manpower, setManpower] = useState("");
  const [transport, setTransport] = useState("");
  const [discount, setDiscount] = useState("");
  const [gst, setGst] = useState("");
  const [roundOff, setRoundOff] = useState("");
  const [enquiry, setEnquiry] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Add Product Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addQty, setAddQty] = useState(1);

  const [adjustment, setAdjustment] = useState(0);
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [inchargeName, setInchargeName] = useState("");
  const [inchargePhone, setInchargePhone] = useState("");

  // const [availableToAdd, setAvailableToAdd] = useState([])

  const gstOptions = [{ value: "0", label: "0%" }, { value: "18", label: "18%" }];

  useEffect(() => {
    console.log("useeffect");
    fetchEnquiry();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (enquiry) {
      fetchFilteredInventory();
    }
  }, [enquiry]);

  // useEffect(() => {
  //   setAvailableToAdd(
  //     allProducts.filter(
  //       (p) => !enquiry?.products?.some((ep) => ep.id === p.id)
  //     )
  //   );
  // }, [allProducts])

  // Filtered products for confirm section
  const fetchFilteredInventory = async () => {
    console.log("enquiry before fetch call: ", enquiry);
    // const enquiry = enquirydata[0];
    try {
      const response = await axios.get(`${ApiURL}/inventory/filter`, {
        params: {
          startDate: enquiry?.enquiryDate,
          endDate: enquiry?.endDate,
          // slot: enquiry.enquiryTime,
          products: enquiry?.products.map((p) => p.productId).join(","),
        },
      });

      console.log(`${ApiURL}/inventory/filter: `, response.data);
      let filtered = response.data.stock;

      // Preserve order as in enquiry.products
      if (enquiry?.products?.length && filtered?.length) {
        const orderMap = enquiry.products.map((p) => p.productId);
        filtered = filtered
          .slice()
          .sort(
            (a, b) =>
              orderMap.indexOf(a.productId) - orderMap.indexOf(b.productId)
          );
      }

      setFilteredProducts(filtered);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      //   alert("Failed to fetch inventory. Please try again.");
    }
  };

  const handleUpdateQuantity = async () => {
    try {
      const response = await axios.put(
        `${ApiURL}/Enquiry/update-product-data/${enquiry.enquiryId}`,
        { productId: editProduct.productId, quantity: editQuantity }
      );
      if (response.status === 200) {
        toast.success("Product quantity updated successfully!");
        setModalIsOpen(false);
        fetchEnquiry();
      }
    } catch (err) {
      toast.error("Failed to update product quantity");
      console.error("Error updating quantity:", err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      toast.error("Product ID is missing!");
      return;
    }
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${ApiURL}/Enquiry/delete-product-data/${enquiry._id}`,
        { data: { productId } }
      );
      if (response.status === 200) {
        toast.success("Product deleted successfully!");
        fetchEnquiry();
      }
    } catch (err) {
      toast.error("Failed to delete product.");
      console.error("Error deleting product:", err);
    }
  };

  // const filteredProducts = enquiry?.products

  // Confirmed total
  const totalAmount = enquiry?.products?.reduce(
    (sum, p) => (confirmed[p.productId] ? sum + p.qty * p.price : sum),
    0
  );

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(`${ApiURL}/product/quoteproducts`);
      // console.log("fetch prods: ", res.data)
      if (res.status === 200) {
        setAllProducts(res.data.QuoteProduct || []);
      }
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  const fetchEnquiry = async () => {
    try {
      const res = await axios.get(`${ApiURL}/enquiry/enquiry-details/${id}`);
      // console.log(`enq res.data: `, res.data);
      if (res.status === 200) {
        setEnquiry(res.data.enrichedResponse); // <-- Make sure your backend returns this
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // console.log(`avaiableto add: `, availableToAdd);
  // console.log(`alprods : `, allProducts);
  console.log("enquiry: ", enquiry);
  console.log("filtered prods: ", filteredProducts);
  const clientNo = enquiry?.clientNo

  console.log(`clietnno:  `, clientNo);
  const dateFormat = (dateStr) => {
    const date = new Date(dateStr);

    // Format as DD-MM-YYYY
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getUTCFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    console.log(formattedDate); // Output: 09-06-2025
    return formattedDate;
  };

  // Edit handlers
  const handleEdit = (productId) => {
    console.log("product id: ", productId);
    const product = enquiry.products.find((p) => p.productId === productId);

    if (product) {
      setEditIdx(productId);
      setEditQty(product.qty);
    } else {
      console.warn(`Product with ID ${productId} not found in enquiry.`);
    }
  };

  const handleEditSave = (productId) => {
    let qty = Math.max(1, Number(editQty) || 1);

    const updatedProducts = enquiry.products.map((p) =>
      p.productId === productId ? { ...p, qty, total: qty * p.price } : p
    );

    setEnquiry((prev) => ({
      ...prev,
      products: updatedProducts,
    }));

    setEditIdx(null);
    setEditQty(1);
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditQty(1);
  };

  // Confirm button handler
  const handleConfirm = (productId) => {
    setConfirmed((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Delete handler
  const handleDelete = (productId) => {
    setEnquiry((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
    setConfirmed((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Add Product Modal handlers
  const handleShowAdd = () => {
    setShowAdd(true);
    setAddProductId("");
    setAddQty(1);
  };

  const handleCloseAdd = () => {
    setShowAdd(false);
    setAddProductId("");
    setAddQty(1);
  };

  // const handleAddProduct = () => {
  //   const prod = products.find((p) => p.id === Number(addProductId));
  //   if (!prod) return;
  //   // Only ensure at least 1 qty, no upper limit
  //   const qty = Math.max(1, Number(addQty) || 1);
  //   setProducts((prev) => [
  //     ...prev,
  //     {
  //       id: prod.id,
  //       name: prod.name,
  //       stock: prod.availableStock,
  //       qty,
  //       price: prod.price,
  //       total: qty * prod.price,
  //     },
  //   ]);
  //   handleCloseAdd();
  // };

  console.log("hello");

  // 3. For the modal, use allProducts for options, and filter out already-added ones:
  const availableToAdd = allProducts.filter(
    (p) =>
      !(enquiry?.products || []).some(
        (ep) => String(ep.productId || ep._id) === String(p._id)
      )
  );

  const selectedAddProduct = allProducts.find(
    (p) => p._id === String(addProductId)
  );

  // older code
  // const handleAddProduct = async () => {
  //   if (!selectedAddProduct) return;

  //   const qty = Math.max(1, Number(addQty) || 1);

  //   // Check if product already exists
  //   const existingIndex = (enquiry?.products || []).findIndex(
  //     (p) => String(p.productId) === String(selectedAddProduct._id)
  //   );

  //   let updatedProduct;

  //   if (existingIndex !== -1) {
  //     // If it exists, create the updated single product object
  //     const existing = enquiry.products[existingIndex];
  //     const newQty = Number(existing.qty) + qty;
  //     updatedProduct = {
  //       ...existing,
  //       qty: newQty,
  //       total: newQty * Number(existing.price),
  //     };
  //   } else {
  //     // If new, create new product object
  //     updatedProduct = {
  //       productId: selectedAddProduct._id,
  //       name: selectedAddProduct.ProductName,
  //       stock: selectedAddProduct.ProductStock,
  //       qty,
  //       price: Number(selectedAddProduct.ProductPrice),
  //       total: qty * Number(selectedAddProduct.ProductPrice),
  //     };
  //   }

  //   try {
  //     const config = {
  //       url: "/Enquiry/add-products",
  //       method: "post",
  //       baseURL: ApiURL,
  //       headers: { "content-type": "application/json" },
  //       data: {
  //         id: enquiry?._id, // Use MongoDB ObjectId (not enquiryId)
  //         products: [updatedProduct], // ✅ send only updated/new product
  //       },
  //     };

  //     const response = await axios(config);
  //     if (response.status === 200) {
  //       // Refresh whole enquiry (assumes backend updates & returns full data)
  //       fetchEnquiry();
  //       setShowAdd(false);
  //       setAddProductId("");
  //       setAddQty(1);
  //     }
  //   } catch (error) {
  //     console.error("Failed to add product:", error?.response || error);
  //     alert("Failed to add product");
  //   }
  // };

  const handleAddProduct = async () => {
    if (!selectedAddProduct) return;

    const qty = Math.max(1, Number(addQty) || 1);

    // Check if product already exists
    const existingIndex = (enquiry?.products || []).findIndex(
      (p) => String(p.productId) === String(selectedAddProduct._id)
    );

    let updatedProduct;

    if (existingIndex !== -1) {
      // If it exists, create the updated single product object
      const existing = enquiry.products[existingIndex];
      const newQty = Number(existing.qty) + qty;
      updatedProduct = {
        ...existing,
        qty: newQty,
        total: newQty * Number(existing.price),
      };
      // Update the product list with the updated product
      setEnquiry((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.productId === selectedAddProduct._id ? updatedProduct : p
        ),
      }));
    } else {
      // If new, create new product object
      updatedProduct = {
        productId: selectedAddProduct._id,
        name: selectedAddProduct.ProductName,
        stock: selectedAddProduct.ProductStock,
        qty,
        price: Number(selectedAddProduct.ProductPrice),
        total: qty * Number(selectedAddProduct.ProductPrice),
      };
      // Add the new product to the list
      setEnquiry((prev) => ({
        ...prev,
        products: [...prev.products, updatedProduct],
      }));
    }

    // try {
    //   const config = {
    //     url: "/Enquiry/add-products",
    //     method: "post",
    //     baseURL: ApiURL,
    //     headers: { "content-type": "application/json" },
    //     data: {
    //       id: enquiry?._id, // Use MongoDB ObjectId (not enquiryId)
    //       products: [updatedProduct], // ✅ send only updated/new product
    //     },
    //   };

    //   const response = await axios(config);
    //   if (response.status === 200) {
    //     // Refresh whole enquiry (assumes backend updates & returns full data)
    //     fetchEnquiry();
    //     setShowAdd(false);
    //     setAddProductId("");
    //     setAddQty(1);
    //   }
    // } catch (error) {
    //   console.error("Failed to add product:", error?.response || error);
    //   alert("Failed to add product");
    // }
    setShowAdd(false);
    setAddProductId("");
    setAddQty(1);
  };


  // const subtotal = totalAmount + Number(manpower || 0) + Number(transport || 0);
  const discountAmt = totalAmount * (Number(discount || 0) / 100);
  const totalBeforeCharges = totalAmount - discountAmt;
  const totalAfterCharges = totalBeforeCharges + Number(manpower || 0) + Number(transport || 0);
  const gstAmt = totalAfterCharges * (Number(gst || 0) / 100);
  const grandTotal = Math.round(totalAfterCharges + gstAmt + Number(roundOff || 0));

  const isAnyProductInsufficient = filteredProducts.some((p) => {
    const stock =
      enquiry?.products?.find((ep) => ep.productId === p.productId)?.qty || 0;
    return stock > p.availableStock;
  });

  const handleSubmitProducts = async (e) => {
    e.preventDefault();
    if (!products || allProducts?.length === 0) {
      alert("Please add at least one product");
      return;
    }
    try {
      const config = {
        url: "/Enquiry/add-products",
        method: "post",
        baseURL: ApiURL,
        headers: { "content-type": "application/json" },
        data: {
          id, // enquiry id from useParams
          products,
          adjustments: adjustment,
          GrandTotal: grandTotal,
        },
      };
      const response = await axios(config);
      if (response.status === 200) {
        toast.success("Products Updated Successfully");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        alert(error.response.data.error);
      } else {
        alert("An error occurred. Please try again later.");
      }
    }
  };

  return (
    <Container
      fluid
      className="py-4"
      style={{ background: "#f6f8fa", minHeight: "100vh" }}
    >
      <Row>
        {/* Left: Enquiry Details */}
        <Col md={5} lg={4}>
          <Card
            className="mb-4 shadow-sm"
            style={{ borderRadius: 16, fontSize: 13 }}
          >
            <Card.Body>
              <div className="mb-3 text-center">
                <FaBuilding size={28} color="#323D4F" />
                <h5
                  className="mt-2 mb-0"
                  style={{ fontWeight: 700, fontSize: 18 }}
                >
                  {enquiry?.clientName}
                </h5>
                {/* <div style={{ fontSize: 12, color: "#888" }}> */}
                {/* {enquiry?.clientId} */}
                {/* </div> */}
              </div>
              <hr />
              <div className="mb-2 d-flex align-items-center">
                <FaUser className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Executive:</span>
                <span className="ms-2">{enquiry?.executivename}</span>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaPhone className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Contact:</span>
                <span className="ms-2">{clientNo}</span>
              </div>
              {/* <div className="mb-2 d-flex align-items-center"> */}
              {/* <FaMapMarkerAlt className="me-2" />{" "} */}
              {/* <span style={{ fontWeight: 600 }}>Venue:</span> */}
              {/* <span className="ms-2">{enquiry?.venue}</span> */}
              {/* </div> */}
              <div className="mb-2 d-flex align-items-center">
                <FaCalendarAlt className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Enquiry Date:</span>
                {/* <span className="ms-2">{enquiry?.enquiryDate}</span> */}
                <span className="ms-2">
                  {moment(enquiry?.createdAt).format("DD-MM-YYYY")}
                </span>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaCalendarAlt className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Delivery Date:</span>
                <span className="ms-2">{enquiry?.enquiryDate}</span>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaCalendarAlt className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Dismantle Date:</span>
                <span className="ms-2">{enquiry?.endDate}</span>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaClock className="me-2" />{" "}
                <span style={{ fontWeight: 600 }}>Slot:</span>
                <span className="ms-2">{enquiry?.enquiryTime}</span>
              </div>
              <div className="mb-2">
                <span style={{ fontWeight: 600 }}>Address:</span>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {enquiry?.address}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right: Product Details */}
        <Col md={7} lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h4 style={{ fontWeight: 700, marginBottom: 0 }}>Products</h4>
            {/* {enquiry?.status === "not send" && (
              <Button
                size="sm"
                style={{
                  backgroundColor: "#BD5525",
                  border: "none",
                  transition: "background 0.2s",
                }}
                className="add-btn"
                onClick={handleShowAdd}
              >
                Add Product
              </Button>
            )} */}
          </div>

          <Table
            bordered
            hover
            responsive
            size="sm"
            style={{ background: "#fff", fontSize: 13, marginTop: "20px" }}
          >
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                {/* {enquiry?.status === "not send" && <th>Action</th>} */}
              </tr>
            </thead>
            <tbody>
              {enquiry?.products?.map((p, idx) => {
                const stock =
                  allProducts.find((ap) => ap.productId === p.productId)
                    ?.availableStock || p.stock;

                return (
                  <tr key={p._id}>
                    <td>{idx + 1}</td>
                    <td>{p.name || p.productName}</td>
                    <td>{stock}</td>
                    <td>
                      {editIdx === p.productId ? (
                        <Form.Control
                          type="number"
                          min={1}
                          value={editQty}
                          onChange={(e) => {
                            let val = e.target.value.replace(/^0+/, "");
                            setEditQty(
                              val === "" ? "" : Math.max(1, Number(val))
                            );
                          }}
                          style={{
                            width: 70,
                            padding: "2px 6px",
                            fontSize: 13,
                          }}
                          autoFocus
                        />
                      ) : (
                        p.qty
                      )}
                    </td>
                    <td>₹{p.price}</td>
                    <td>₹{p.qty * p.price}</td>
                    {/* {enquiry?.status === "not send" && (
                      <td>
                        {editIdx === p.productId ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              style={{ padding: "2px 6px", marginRight: 4 }}
                              onClick={() => handleEditSave(p.productId)}
                              disabled={confirmed[p.productId]} // Disable if confirmed
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              style={{ padding: "2px 6px" }}
                              onClick={handleEditCancel}
                              disabled={confirmed[p.productId]} // Disable if confirmed
                            >
                              <FaTimes />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              style={{ color: "#157347", padding: 0 }}
                              onClick={() => handleEdit(p.productId)}
                              disabled={confirmed[p.productId]} // Disable edit if confirmed
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              style={{
                                color: "#d00",
                                padding: 0,
                                marginLeft: 8,
                              }}
                              onClick={() => handleDelete(p.productId)}
                              disabled={confirmed[p.productId]} // Optionally disable delete if confirmed
                            >
                              <FaTrashAlt />
                            </Button>
                          </>
                        )}
                      </td>
                    )} */}
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* Confirm Products Section as List */}
          
        </Col>
      </Row>

      <Modal show={showAdd} onHide={handleCloseAdd} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="addProductSelect">
              <Form.Label>Product Name</Form.Label>
              <Select
                options={availableToAdd?.map((p) => ({
                  value: p._id,
                  label: p.ProductName,
                }))}
                value={
                  addProductId
                    ? availableToAdd
                      ?.map((p) => ({ value: p._id, label: p.ProductName }))
                      .find((opt) => opt.value === Number(addProductId))
                    : null
                }
                onChange={(selected) => {
                  setAddProductId(selected ? selected.value : "");
                  setAddQty(1);
                }}
                isClearable
                placeholder="Search product..."
              />
            </Form.Group>
            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="addProductStock">
                  <Form.Label>Stock</Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      selectedAddProduct ? selectedAddProduct.ProductStock : 0
                    }
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="addProductQty">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={addQty}
                    disabled={!addProductId}
                    onChange={(e) => {
                      let val = e.target.value.replace(/^0+/, "");
                      setAddQty(val === "" ? "" : Math.max(1, Number(val)));
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="addProductPrice">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="text"
                    value={`₹${selectedAddProduct ? selectedAddProduct.ProductPrice : 0
                      }`}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3" controlId="addProductTotal">
                  <Form.Label>Total Price</Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      selectedAddProduct
                        ? `₹${(addQty ? addQty : 1) *
                        selectedAddProduct.ProductPrice
                        }`
                        : "₹0"
                    }
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            size="sm"
            disabled={!addProductId || !addQty || addQty < 1}
            onClick={handleAddProduct}
          >
            Add
          </Button>
          <Button variant="secondary" size="sm" onClick={handleCloseAdd}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sticky Footer for Total and Create Quotation */}
      {/* {enquiry?.status === "not send" && ( */}
      {/* <div
        style={{
          // position: "fixed",
          // left: 280,
          // bottom: 0,
          // width: "calc(100% - 260px)",
          background: "#fff",
          borderTop: "1px solid #eee",
          zIndex: 100,
          padding: "12px 0",
          marginBottom: "60px",
        }}
      >
        <Container className="px-5">
          <Form>
            <Row className="align-items-end mb-2">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Manpower Cost/Labour Charge</Form.Label>
                  <Form.Control
                    type="number"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.labourecharge
                        : manpower
                    }
                    onChange={(e) => setManpower(e.target.value)}
                    disabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Transport Charge</Form.Label>
                  <Form.Control
                    type="number"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.transportcharge
                        : transport
                    }
                    onChange={(e) => setTransport(e.target.value)}
                    disabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.discount
                        : discount
                    }
                    placeholder="Discount in percentage"
                    onChange={(e) => setDiscount(e.target.value)}
                    disabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>
                    Grand Total <span style={{ color: "red" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.GrandTotal
                        : grandTotal
                    }
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>GST</Form.Label>
                  <Select
                    options={gstOptions}
                    value={
                      gstOptions.find(
                        (opt) =>
                          String(opt.value) ===
                          String(
                            enquiry?.status === "sent"
                              ? enquiry.quotationData.GST
                              : gst
                          )
                      ) || null
                    }
                    onChange={(opt) => setGst(opt ? opt.value : "")}
                    placeholder="Select GST"
                    isDisabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Incharge Name </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.inchargeName
                        : inchargeName
                    }
                    onChange={(e) => setInchargeName(e.target.value)}
                    disabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Incharge Phone (opt.)</Form.Label>
                  <Form.Control
                    type="number"
                    value={
                      enquiry?.status === "sent"
                        ? enquiry.quotationData.inchargePhone
                        : inchargePhone
                    }
                    onChange={(e) => setInchargePhone(e.target.value)}
                    disabled={enquiry?.status === "sent"}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Container>
      </div> */}
      {/* )} */}
      {/* <div
        style={{
          position: "fixed",
          left: "20%", // <-- Adjust this to your sidebar width
          bottom: 0,
          width: "calc(100% - 20%)", // <-- Adjust this to your sidebar width
          background: "#fff",
          borderTop: "1px solid #eee",
          zIndex: 100,
          padding: "12px 0",
        }}
      >
        <Container className="px-5">
          <Row className="align-items-center">
            <Col xs={12} md={8} lg={10}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>
                Total Confirmed Amount:{" "}
                <span style={{ color: "#28a745" }}>
                  ₹{" "}
                  {enquiry?.status === "sent"
                    ? enquiry?.quotationData?.GrandTotal
                    : grandTotal}
                </span>
              </span>
            </Col>
            <Col xs={12} md={4} lg={2} className="text-end">
              {enquiry?.status === "not send" && (
                <Button
                  variant="success"
                  size="sm"
                  style={{ fontWeight: 600, background: "#BD5525", border: "#BD5525" }}
                  disabled={totalAmount === 0 || isAnyProductInsufficient}
                  onClick={handleCreateQuote}
                >
                  Create Quotation
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </div> */}
    </Container>
  );
};

export default EnquiryDetails;
