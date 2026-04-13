
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Container,
  Form,
  Table,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ApiURL, ImageApiURL } from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { toast } from "react-hot-toast";
import Select from "react-select";

const deliveryDismantleSlots = [
  "Select Delivery & Dismantle Slots",
  "Slot 1: 7:00 AM to 11:00 PM",
  "Slot 2: 11:00 PM to 11:45 PM",
  "Slot 3: 7:30 AM to 4:00 PM",
  "Slot 4: 2:45 PM to 11:45 PM",
];

const AddNewEnquiry = () => {
  const navigate = useNavigate();
  const [clientData, setClientData] = useState([]);
  // Form state
  const [company, setCompany] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [executive, setExecutive] = useState("");
  const [executiveId, setExecutiveId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [dismantleDate, setDismantleDate] = useState("");
  const [venue, setVenue] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]); // fetched from API

  const [discount, setDiscount] = useState(0);
  const [GST, setGST] = useState(0);
  const [ClientNo, setClientNo] = useState();
  const [clientName, setClientName] = useState("");
  const [Address, setAddress] = useState();
  const [enquiryDate, setEnquiryDate] = useState("06-09-2025");
  const [endDate, setEndDate] = useState("06-12-2025");
  const [ExecutiveName, setExecutiveName] = useState("");
  const [placeaddress, setPlaceaddress] = useState("");
  const [selectslots, setSelectslots] = useState("");
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [dismantleTimeSlot, setDismantleTimeSlot] = useState("");
  const [dismantleSlots, setDismantleSlots] = useState([]);
  const [availableDeliverySlots, setAvailableDeliverySlots] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const userRole = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}").role || "";
    } catch { return ""; }
  })();
  const [loading, setLoading] = useState(false);

  // ✅ NEW: confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // Selected products (persisted)
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Fetch subcategories from API
  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const res = await axios.get(`${ApiURL}/subcategory/getappsubcat/`);
        // Fix: use 'subcategory' not 'subcategories'
        if (res.status === 200 && Array.isArray(res.data.subcategory)) {
          setSubCategories(res.data.subcategory);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };
    fetchSubCategories();
  }, []);

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  // Reset executive if company changes and executive not in list
  useEffect(() => {
    const client = clientData.find((c) => c._id === companyId);
    if (
      client &&
      client.executives &&
      !client.executives.some((ex) => ex._id === executiveId)
    ) {
      setExecutive("");
    }
  }, [companyId, clientData, executive]);

  const fetchClients = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const res = await axios.get(`${ApiURL}/client/getallClients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const clients = res.data.Client || [];
        setClientData(clients);

        // Auto-select company when logged in as client or executive
        const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
        const currentRole = storedUser.role || "";
        if (currentRole === "client") {
          const myCompany = clients.find(
            (c) =>
              String(c._id) === String(storedUser.clientId || storedUser._id)
          );
          if (myCompany) {
            setCompanyId(myCompany._id);
          }
        } else if (currentRole === "executive") {
          // Executive belongs to a client — use clientId to find the company
          const myCompany = clients.find(
            (c) => String(c._id) === String(storedUser.clientId)
          );
          if (myCompany) {
            setCompanyId(myCompany._id);
            // Pre-select this executive in the dropdown
            const me = myCompany.executives?.find(
              (ex) => String(ex._id) === String(storedUser._id)
            );
            if (me) {
              setExecutiveId(me._id);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${ApiURL}/product/quoteproducts`);
      if (res.status === 200) {
        setAllProducts(res.data.QuoteProduct);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSubcategorySelection = (e) => {
    const subcategory = e.target.value;
    setSubCategory(subcategory);
    setFilteredProducts(
      allProducts?.filter(
        (product) => product.ProductSubcategory === subcategory.trim()
      )
    );
  };

  // Grand total calculation
  const grandTotal = selectedProducts.reduce(
    (sum, p) => sum + (parseInt(p.qty, 10) || 1) * (p.ProductPrice || p.price),
    0
  );

  // Add product to selection
  const handleSelectProduct = (product) => {
    setSelectedProducts((prev) => [
      ...prev,
      { ...product, qty: 1, total: product.ProductPrice },
    ]);
    setFilteredProducts((prevProducts) =>
      prevProducts.filter((item) => item._id !== product._id)
    );
    setProductSearch("");
  };

  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.id !== id && p._id !== id)
    );
  };

  const handleQtyChange = (id, qty) => {
    let val = qty;
    const product = selectedProducts.find((p) => p.id === id || p._id === id);

    if (product && product.ProductStock) {
      val = Math.min(parseFloat(val), product.ProductStock);
      if (parseFloat(val) > product.ProductStock) {
        toast.warning(
          `Quantity cannot exceed available stock (${product.ProductStock})`
        );
      }
    }

    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === id || p._id === id
          ? {
            ...p,
            qty: val,
            total: (parseFloat(val) || 0) * (p.ProductPrice || p.price),
          }
          : p
      )
    );
  };

  const handleProductDropdown = (open) => {
    setShowProductDropdown(open);
    setProductSearch("");
  };

  // ✅ NEW: helper for days count (inclusive)
  const getDaysDiffInclusive = (start, end) => {
    const s = moment(start);
    const e = moment(end);
    if (!s.isValid() || !e.isValid()) return 0;
    return Math.max(1, e.startOf("day").diff(s.startOf("day"), "days") + 1);
  };

  // ✅ NEW: actual API submit (runs only after confirm)
  const submitEnquiryToAPI = async (payload) => {
    setLoading(true);
    try {
      const config = {
        url: "/Enquiry/createEnquiry",
        method: "post",
        baseURL: ApiURL,
        headers: { "content-type": "application/json" },
        data: payload,
      };

      console.log(`config: `, config.data);

      const response = await axios(config);
      if (response.status === 200) {
        // Clear form state
        setCompany("");
        setExecutive("");
        setDeliveryDate("");
        setDismantleDate("");
        setVenue("");
        setSelectedSlot("");
        setSubCategory("");
        setSelectedProducts([]);
        setProductSearch("");
        setDiscount(0);
        setGST(0);
        setClientNo("");
        setClientName("");
        setAddress("");
        setExecutiveName("");
        setPlaceaddress("");
        setSelectslots("");
        setDeliveryTimeSlot("");
        setDeliverySlot("");
        setDismantleTimeSlot("");
        setDismantleSlots([]);
        setAvailableDeliverySlots([]);
        toast.success("Enquiry Created Successfully");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("error: ", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.message ? `Error: ${error.message}` : "An unexpected error occurred");
      console.log(`Error message: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /*
   * first we find company name then chekc fr exec if exists
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const chosenClient = clientData.find((c) => c._id === companyId);

    if (!chosenClient) {
      alert("Please fill all required fields");
      return;
    }

    // Validation (add more as needed)
    if (
      !companyId ||
      !deliveryDate ||
      !dismantleDate ||
      !selectedSlot ||
      !venue ||
      selectedProducts.length === 0
    ) {
      alert("Please fill all required fields and select at least one product.");
      return;
    }

    const deliveryDateOnly = new Date(deliveryDate);
    const dismantleDateOnly = new Date(dismantleDate);

    deliveryDateOnly.setHours(0, 0, 0, 0);
    dismantleDateOnly.setHours(0, 0, 0, 0);

    // Validate product quantities: must be >= 1 and not empty
    const hasInvalidQty = selectedProducts.some((p) => {
      const q = parseInt(p.qty, 10);
      return !p.qty || Number.isNaN(q) || q < 1;
    });
    if (hasInvalidQty) {
      toast.error("Each product must have quantity of at least 1");
      return;
    }

    // Prepare products array for API
    const Products = selectedProducts.map((p) => ({
      productId: p._id || p.id,
      name: p.ProductName || p.name,
      qty: p.qty,
      price: p.ProductPrice || p.price,
      total: (parseInt(p.qty, 10) || 1) * (p.ProductPrice || p.price),
    }));

    const executives = chosenClient.executives;

    let chosenExecutive = "";
    if (executives.length === 0) {
      chosenExecutive = "";
    } else {
      chosenExecutive = executives.find((e) => e._id === executiveId);
    }

    // ✅ Build final payload (same as before)
    const payload = {
      clientName: chosenClient.name,
      clientId: companyId,
      executiveId: chosenExecutive?._id,
      products: Products,
      category: subCategory,
      discount: discount,
      GrandTotal: grandTotal,
      GST,
      clientNo: chosenExecutive?.phoneNumber,
      executivename: chosenExecutive?.name,
      address: venue,
      enquiryDate: deliveryDate ? moment(deliveryDate).format("DD-MM-YYYY") : "",
      endDate: dismantleDate ? moment(dismantleDate).format("DD-MM-YYYY") : "",
      enquiryTime: selectedSlot,
      placeaddress: placeaddress,
    };

    // ✅ NEW: show confirmation modal first, do not create enquiry yet
    setPendingPayload(payload);
    setShowConfirmModal(true);
  };

  // ✅ NEW: confirm modal actions
  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setPendingPayload(null);
  };

  const handleConfirmCreate = async () => {
    if (!pendingPayload) return;
    setShowConfirmModal(false);
    await submitEnquiryToAPI(pendingPayload);
    setPendingPayload(null);
  };

  const daysCount =
    deliveryDate && dismantleDate
      ? getDaysDiffInclusive(deliveryDate, dismantleDate)
      : 0;

  return (
    <Container className="my-4" style={{ fontSize: 14 }}>
      <Card className="shadow-sm">
        <Card.Body>
          <h4
            className="mb-4"
            style={{ fontWeight: 700, fontSize: 20, color: "#2d3e50" }}
          >
            Create Enquiry
          </h4>

          {/* ✅ NEW: Confirmation Modal */}
          <Modal
            show={showConfirmModal}
            onHide={handleCancelConfirm}
            centered
            backdrop="static"
            keyboard={false}
          >
            <Modal.Header closeButton>
              <Modal.Title>Confirm Enquiry</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div style={{ fontSize: 14 }}>
                <div className="mb-2">
                  <b>Delivery Date:</b>{" "}
                  {pendingPayload?.enquiryDate || "—"}
                </div>
                <div className="mb-2">
                  <b>Dismantle Date:</b> {pendingPayload?.endDate || "—"}
                </div>
                <div className="mb-2">
                  <b>No. of Days:</b>{" "}
                  {deliveryDate && dismantleDate ? daysCount : "—"}
                </div>

                <hr />

                <div className="mb-2">
                  <b>Company:</b> {pendingPayload?.clientName || "—"}
                </div>
                <div className="mb-2">
                  <b>Slot:</b> {pendingPayload?.enquiryTime || "—"}
                </div>
                <div className="mb-2">
                  <b>Grand Total:</b> ₹{pendingPayload?.GrandTotal || 0}
                </div>

                <div className="mt-3" style={{ fontSize: 12, color: "#6c757d" }}>
                  Click <b>Confirm</b> to create enquiry. Click <b>Cancel</b> to
                  go back and edit.
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={handleCancelConfirm} disabled={loading}>
                Cancel
              </Button>
              <Button
                style={{ backgroundColor: "#BD5525", border: "none" }}
                onClick={handleConfirmCreate}
                disabled={loading}
              >
                {loading ? "Creating..." : "Confirm"}
              </Button>
            </Modal.Footer>
          </Modal>

          <Form onSubmit={handleSubmit}>
            {/* Section 1: Client & Event Info */}
            <Card className="mb-4 border-0" style={{ background: "#f8fafc" }}>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Company Name</Form.Label>

                       <Form.Control
                          type="text"
                          value={clientData.find((c) => c._id === companyId)?.name || ""}
                          readOnly
                          style={{ background: "#f8f9fa", cursor: "not-allowed" }}
                        />
                      {/* {userRole === "client" ? (
                        <Form.Control
                          type="text"
                          value={clientData.find((c) => c._id === companyId)?.name || ""}
                          readOnly
                          style={{ background: "#f8f9fa", cursor: "not-allowed" }}
                        />
                      ) : (
                        <Select
                          options={clientData.map((c) => ({
                            value: c._id,
                            label: c.name,
                          }))}
                          value={
                            clientData
                              .filter((c) => c._id === companyId)
                              .map((c) => ({ value: c._id, label: c.name }))[0] ||
                            null
                          }
                          onChange={(selected) =>
                            setCompanyId(selected ? selected.value : "")
                          }
                          placeholder="Search Company Name..."
                          isClearable
                          isSearchable
                        />
                      )} */}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Executive Name</Form.Label>
                      {userRole === "executive" ? (
                        <Form.Control
                          type="text"
                          value={
                            clientData
                              .find((c) => c._id === companyId)
                              ?.executives?.find((ex) => ex._id === executiveId)
                              ?.name || ""
                          }
                          readOnly
                          style={{ background: "#f8f9fa", cursor: "not-allowed" }}
                        />
                      ) : (
                        <Form.Select
                          value={executiveId}
                          onChange={(e) => setExecutiveId(e.target.value)}
                          disabled={!companyId}
                        >
                          <option value="">Select Executive Name</option>
                          {companyId &&
                            clientData
                              .find((c) => c._id === companyId)
                              ?.executives?.map((ex) => (
                                <option key={ex._id} value={ex._id}>
                                  {ex.name}
                                </option>
                              ))}
                        </Form.Select>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-2">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Delivery Date</Form.Label>
                      <DatePicker
                        selected={deliveryDate}
                        onChange={(date) => setDeliveryDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        className="form-control"
                        minDate={new Date()}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Dismantle Date</Form.Label>
                      <Form.Group>
                        <DatePicker
                          selected={dismantleDate}
                          onChange={(date) => setDismantleDate(date)}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="DD/MM/YYYY"
                          className="form-control"
                          minDate={deliveryDate || new Date()}
                        />
                      </Form.Group>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Select Slot</Form.Label>
                      <Form.Select
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                      >
                        {deliveryDismantleSlots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-4">
                  <Form.Label>Venue Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Section 2: Product Selection */}
            <Card className="mb-4 border-0" style={{ background: "#f8fafc" }}>
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Sub Category</Form.Label>
                      <Form.Select
                        value={subCategory}
                        onChange={handleSubcategorySelection}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map((cat) => (
                          <option key={cat._id} value={cat.subcategory}>
                            {cat.subcategory}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Select Products</Form.Label>
                      <div
                        className="border rounded px-2 py-1 bg-white"
                        style={{
                          minHeight: 38,
                          cursor: subCategory ? "pointer" : "not-allowed",
                          position: "relative",
                        }}
                        tabIndex={0}
                        onClick={() => subCategory && handleProductDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => handleProductDropdown(false), 200)
                        }
                      >
                        {selectedProducts.map((p) => (
                          <span
                            key={p.id || p._id}
                            className="badge bg-light text-dark border me-2 mb-1"
                            style={{
                              fontWeight: 500,
                              fontSize: 13,
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 6px",
                            }}
                          >
                            <img
                              src={
                                p.img
                                  ? p.img
                                  : p.ProductIcon
                                    ? `${ImageApiURL}/product/${p.ProductIcon}`
                                    : "https://via.placeholder.com/36x28?text=No+Img"
                              }
                              
                              alt={p.name || p.ProductName}
                              style={{
                                width: 28,
                                height: 22,
                                objectFit: "cover",
                                borderRadius: 3,
                                marginRight: 6,
                                border: "1px solid #eee",
                              }}
                            />
                            {p.name || p.ProductName}
                            <span
                              style={{
                                marginLeft: 6,
                                cursor: "pointer",
                                color: "#d00",
                                fontWeight: "bold",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProduct(p.id || p._id);
                              }}
                            >
                              ×
                            </span>
                          </span>
                        ))}

                        <input
                          type="text"
                          className="border-0"
                          style={{
                            outline: "none",
                            fontSize: 13,
                            minWidth: 80,
                            background: "transparent",
                          }}
                          placeholder={
                            subCategory
                              ? "Select products..."
                              : "Select sub category first"
                          }
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onFocus={() => subCategory && handleProductDropdown(true)}
                          disabled={!subCategory}
                        />

                        {showProductDropdown &&
                          filteredProducts.length > 0 &&
                          subCategory && (
                            <div
                              className="shadow"
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                background: "#fff",
                                maxHeight: 220,
                                overflowY: "auto",
                                border: "1px solid #eee",
                              }}
                            >
                              {filteredProducts
                                .filter((prod) =>
                                  prod.ProductName.toLowerCase().includes(
                                    productSearch.toLowerCase()
                                  )
                                )
                                .map((prod) => (
                                  <div
                                    key={prod.id || prod._id}
                                    className="d-flex align-items-center px-2 py-1"
                                    style={{
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f5f5f5",
                                      fontSize: 13,
                                    }}
                                    onClick={() => handleSelectProduct(prod)}
                                  >
                                    <img
                                      src={`${ImageApiURL}/product/${prod?.ProductIcon}`}
                                      alt={prod.ProductName}
                                      style={{
                                        width: 36,
                                        height: 28,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                        marginRight: 10,
                                        border: "1px solid #eee",
                                      }}
                                    />
                                    <span>{prod.ProductName}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Section 3: Products Table */}
            <Card className="mb-4 border-0" style={{ background: "#f8fafc" }}>
              <Card.Body>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
                  Products
                </div>
                <div className="table-responsive">
                  <Table
                    bordered
                    hover
                    size="sm"
                    style={{ fontSize: 14, background: "#fff" }}
                  >
                    <thead className="table-light">
                      <tr>
                        <th>Product Name</th>
                        <th>Stock</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.length > 0 ? (
                        selectedProducts.map((p) => (
                          <tr key={p._id}>
                            <td>{p.ProductName}</td>
                            <td>{p.ProductStock}</td>
                            <td style={{ width: 90 }}>
                              <Form.Control
                                type="number"
                                min={1}
                                value={p.qty}
                                onChange={(e) =>
                                  handleQtyChange(p._id, e.target.value)
                                }
                                style={{ fontSize: 14, padding: "2px 6px" }}
                              />
                            </td>
                            <td>₹{p.ProductPrice}</td>
                            <td>₹{(parseInt(p.qty, 10) || 1) * p.ProductPrice}</td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                style={{ color: "#d00", fontSize: 14 }}
                                onClick={() => handleRemoveProduct(p._id)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No products selected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            {/* Section 4: Grand Total & Actions */}
            <Row className="align-items-center mb-3">
              <Col md={4}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>
                  Grand Total <span style={{ color: "red" }}>*</span>
                </div>
                <Form.Control
                  type="text"
                  value={grandTotal}
                  readOnly
                  style={{
                    maxWidth: 200,
                    fontWeight: 600,
                    fontSize: 16,
                    marginTop: 4,
                  }}
                />
              </Col>
              <Col
                md={8}
                className="d-flex justify-content-end gap-2 mt-3 mt-md-0"
              >
                <Button
                  size="sm"
                  style={{
                    backgroundColor: "#BD5525",
                    border: "none",
                    transition: "background 0.2s",
                  }}
                  className=" add-btn"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddNewEnquiry;

