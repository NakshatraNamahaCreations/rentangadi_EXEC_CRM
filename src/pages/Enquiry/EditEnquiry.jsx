

import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Container,
  Form,
  Table,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
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

const parseDDMMYYYYToDate = (str) => {
  try {
    if (!str) return null;
    const d = moment(str, ["DD-MM-YYYY", "DD/MM/YYYY"], true);
    return d.isValid() ? d.toDate() : null;
  } catch (e) {
    return null;
  }
};

// ✅ helper to safely extract _id if populated, else string
const getId = (val) => {
  try {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val._id) return String(val._id);
    return "";
  } catch (e) {
    return "";
  }
};

const EditEnquiry = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [clientData, setClientData] = useState([]);

  // Form state (same as Add)
  const [companyId, setCompanyId] = useState("");
  const [executiveId, setExecutiveId] = useState("");
  const [executivename, setExecutivename] = useState(""); // for fallback display

  const [deliveryDate, setDeliveryDate] = useState(null); // Date object
  const [dismantleDate, setDismantleDate] = useState(null); // Date object
  const [venue, setVenue] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [discount, setDiscount] = useState(0);
  const [GST, setGST] = useState(0);
  const [placeaddress, setPlaceaddress] = useState("");

  // Selected products (persisted)
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Loading
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const chosenClient = useMemo(() => {
    try {
      return (
        clientData.find((c) => String(c._id) === String(companyId)) || null
      );
    } catch (e) {
      return null;
    }
  }, [clientData, companyId]);

  // Fetch subcategories
  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const res = await axios.get(`${ApiURL}/subcategory/getappsubcat/`);
        if (res.status === 200 && Array.isArray(res.data.subcategory)) {
          setSubCategories(res.data.subcategory);
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };

    try {
      fetchSubCategories();
    } catch (e) { }
  }, []);

  const fetchClients = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${ApiURL}/client/getallClients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setClientData(res.data.Client || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${ApiURL}/product/quoteproducts`);
      if (res.status === 200) {
        setAllProducts(res.data.QuoteProduct || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch master data
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchClients(), fetchProducts()]);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Prefetch enquiry
  useEffect(() => {
    const fetchEnquiryDetails = async () => {
      setPageLoading(true);
      try {
        const res = await axios.get(`${ApiURL}/enquiry/enquiry-details/${id}`);

        const enq =
          res?.data?.enrichedResponse || res?.data?.enquiry || res?.data;

        if (!enq?._id) {
          toast.error("Enquiry not found");
          navigate("/enquiry-list");
          return;
        }

        // ✅ FIX: clientId is populated object sometimes; set ONLY _id string
        const clientIdStr = getId(enq.clientId);
        setCompanyId(clientIdStr);

        // ✅ FIX: executiveId may be string or populated object
        const executiveIdStr = getId(enq.executiveId);
        setExecutiveId(executiveIdStr);

        setExecutivename(enq.executivename || "");

        setDeliveryDate(parseDDMMYYYYToDate(enq.enquiryDate));
        setDismantleDate(parseDDMMYYYYToDate(enq.endDate));

        setSelectedSlot(enq.enquiryTime || "");
        setVenue(enq.address || "");
        setSubCategory(enq.category || "");
        setDiscount(enq.discount || 0);
        setGST(enq.GST || 0);
        setPlaceaddress(enq.placeaddress || "");

        // Map products from API response (name/qty/price/stock)
        const mapped = (enq.products || []).map((p) => ({
          _id: p.productId,
          id: p.productId,

          ProductName: p.name,
          name: p.name,

          ProductPrice: p.price,
          price: p.price,

          // stock might come in response, else fallback 0
          ProductStock: p.stock ?? 0,
          qty: p.qty,
          total: p.total,
          ProductIcon: p.ProductIcon, // if exists, harmless
        }));

        setSelectedProducts(mapped);
      } catch (error) {
        console.error("Error fetching enquiry:", error);
        toast.error("Failed to load enquiry");
      } finally {
        setPageLoading(false);
      }
    };

    try {
      if (id) fetchEnquiryDetails();
    } catch (e) {
      console.error(e);
    }
  }, [id, navigate]);

  // When subCategory changes OR master products arrive, build filtered products dropdown list
  useEffect(() => {
    try {
      if (!subCategory) {
        setFilteredProducts([]);
        return;
      }

      const list = allProducts.filter(
        (product) =>
          String(product.ProductSubcategory || "").trim() ===
          String(subCategory || "").trim()
      );

      const selectedIds = new Set(
        selectedProducts.map((x) => String(x._id || x.id))
      );
      setFilteredProducts(list.filter((x) => !selectedIds.has(String(x._id))));
    } catch (e) {
      console.error(e);
    }
  }, [subCategory, allProducts, selectedProducts]);

  // ✅ don't auto-clear executive incorrectly
  useEffect(() => {
    try {
      if (!companyId) return;
      if (!Array.isArray(clientData) || clientData.length === 0) return;

      const client = clientData.find((c) => String(c._id) === String(companyId));
      if (!client || !Array.isArray(client.executives)) return;

      if (!executiveId) return;

      const ok = client.executives.some(
        (ex) => String(ex._id) === String(executiveId)
      );

      // if you want to auto-clear when not found, enable:
      // if (!ok) setExecutiveId("");
    } catch (e) {
      console.error(e);
    }
  }, [companyId, clientData, executiveId]);

  const handleSubcategorySelection = (e) => {
    try {
      const subcategory = e.target.value;
      setSubCategory(subcategory);
      setFilteredProducts(
        allProducts?.filter(
          (product) =>
            String(product.ProductSubcategory || "").trim() ===
            String(subcategory || "").trim()
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Grand total calculation
  const grandTotal = useMemo(() => {
    try {
      return selectedProducts.reduce((sum, p) => {
        const q = parseInt(p.qty, 10) || 0;
        const pr = p.ProductPrice || p.price || 0;
        return sum + q * pr;
      }, 0);
    } catch (e) {
      return 0;
    }
  }, [selectedProducts]);

  // Add product
  const handleSelectProduct = (product) => {
    try {
      setSelectedProducts((prev) => [
        ...prev,
        { ...product, qty: 1, total: product.ProductPrice || product.price || 0 },
      ]);
      setFilteredProducts((prevProducts) =>
        prevProducts.filter((item) => item._id !== product._id)
      );
      setProductSearch("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveProduct = (id) => {
    try {
      setSelectedProducts((prev) =>
        prev.filter((p) => String(p.id || p._id) !== String(id))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleQtyChange = (id, qty) => {
    try {
      let val = qty;
      const product = selectedProducts.find(
        (p) => String(p.id || p._id) === String(id)
      );

      const stock = parseFloat(product?.ProductStock || 0);
      const num = parseFloat(val || 0);

      if (product && stock > 0 && num > stock) {
        val = stock;
        toast.warning(`Quantity cannot exceed available stock (${stock})`);
      }

      setSelectedProducts((prev) =>
        prev.map((p) =>
          String(p.id || p._id) === String(id)
            ? {
              ...p,
              qty: val,
              total:
                (parseFloat(val) || 0) * (p.ProductPrice || p.price || 0),
            }
            : p
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductDropdown = (open) => {
    try {
      setShowProductDropdown(open);
      setProductSearch("");
    } catch (e) { }
  };

  // ✅ UPDATE enquiry using your PUT endpoint
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      if (
        !companyId ||
        !deliveryDate ||
        !dismantleDate ||
        !selectedSlot ||
        !venue ||
        selectedProducts.length === 0
      ) {
        toast.error(
          "Please fill all required fields and select at least one product."
        );
        return;
      }

      const chosenClientNow = clientData.find(
        (c) => String(c._id) === String(companyId)
      );
      if (!chosenClientNow) {
        toast.error("Invalid company selection");
        return;
      }

      const executives = chosenClientNow.executives || [];
      const chosenExecutive = executives.find(
        (ex) => String(ex._id) === String(executiveId)
      );

      const hasInvalidQty = selectedProducts.some((p) => {
        const q = parseInt(p.qty, 10);
        return !p.qty || Number.isNaN(q) || q < 1;
      });
      if (hasInvalidQty) {
        toast.error("Each product must have quantity of at least 1");
        return;
      }

      const Products = selectedProducts.map((p) => {
        const qty = parseInt(p.qty, 10) || 1;
        const price = p.ProductPrice || p.price || 0;
        return {
          productId: p._id || p.id,
          name: p.ProductName || p.name,
          qty,
          price,
          total: qty * price,
        };
      });

      const payload = {
        clientName: chosenClientNow.name,
        clientId: companyId, // ✅ always string now

        executiveId: chosenExecutive?._id || executiveId || "",
        executivename: chosenExecutive?.name || executivename || "",

        products: Products,
        category: subCategory,
        discount: discount,
        GrandTotal: grandTotal,
        GST,

        clientNo: chosenExecutive?.phoneNumber || "",

        address: venue,
        enquiryDate: deliveryDate
          ? moment(deliveryDate).format("DD-MM-YYYY")
          : "",
        endDate: dismantleDate
          ? moment(dismantleDate).format("DD-MM-YYYY")
          : "",
        enquiryTime: selectedSlot,
        placeaddress: placeaddress,
      };

      setSaving(true);

      const resp = await axios.put(
        `${ApiURL}/enquiry/update-enquiry/${id}`,
        payload,
        { headers: { "content-type": "application/json" } }
      );

      if (resp.status === 200) {
        toast.success("Enquiry updated successfully");
        setTimeout(() => navigate("/enquiry-list"), 800);
      } else {
        toast.error("Failed to update enquiry");
      }
    } catch (error) {
      console.error("error: ", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.message
          ? `Error: ${error.message}`
          : "An unexpected error occurred");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <Container className="my-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" />
            <div style={{ marginTop: 10 }}>Loading enquiry...</div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="my-4" style={{ fontSize: 14 }}>
      <Card className="shadow-sm">
        <Card.Body>
          <h4
            className="mb-4"
            style={{ fontWeight: 700, fontSize: 20, color: "#2d3e50" }}
          >
            Edit Enquiry
          </h4>

          <Form onSubmit={handleUpdate}>
            {/* Section 1: Client & Event Info */}
            <Card className="mb-4 border-0" style={{ background: "#f8fafc" }}>
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Company Name</Form.Label>

                      {/* ✅ FIXED: even if clients load late, show selected company */}
                      <Select
                        options={clientData.map((c) => ({
                          value: c._id,
                          label: c.name,
                        }))}
                        value={
                          companyId
                            ? {
                              value: companyId,
                              label:
                                clientData.find(
                                  (c) => String(c._id) === String(companyId)
                                )?.name || "Selected Company",
                            }
                            : null
                        }
                        onChange={(selected) =>
                          setCompanyId(selected ? selected.value : "")
                        }
                        placeholder="Search Company Name..."
                        isClearable
                        isSearchable
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Executive Name</Form.Label>
                      <Form.Select
                        value={executiveId}
                        onChange={(e) => setExecutiveId(e.target.value)}
                        disabled={!companyId}
                      >
                        <option value="">Select Executive Name</option>

                        {/* ✅ fallback: show current executive even if not in list */}
                        {executiveId &&
                          companyId &&
                          !clientData
                            .find(
                              (c) => String(c._id) === String(companyId)
                            )
                            ?.executives?.some(
                              (ex) =>
                                String(ex._id) === String(executiveId)
                            ) && (
                            <option value={executiveId}>
                              {` ${executivename || "Selected Executive"}`}
                            </option>
                          )}

                        {companyId &&
                          clientData
                            .find(
                              (c) => String(c._id) === String(companyId)
                            )
                            ?.executives?.map((ex) => (
                              <option key={ex._id} value={ex._id}>
                                {ex.name}
                              </option>
                            ))}
                      </Form.Select>
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
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Dismantle Date</Form.Label>
                      <DatePicker
                        selected={dismantleDate}
                        onChange={(date) => setDismantleDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        className="form-control"
                        minDate={deliveryDate || undefined}
                      />
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
                        onClick={() =>
                          subCategory && handleProductDropdown(true)
                        }
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
                            {console.log("prod", p)}
                            {/* {console.log( `${p.ProductIcon}`)} */}
                            <img
                              src={
                                p.ProductIcon
                                  ? `${p.ProductIcon}`
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
                          onFocus={() =>
                            subCategory && handleProductDropdown(true)
                          }
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
                                  (prod.ProductName || "")
                                    .toLowerCase()
                                    .includes(productSearch.toLowerCase())
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
                                      src={`${prod?.ProductIcon}`}
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
                <div
                  style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}
                >
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
                            <td>{p.ProductName || p.name}</td>
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
                            <td>₹{p.ProductPrice || p.price}</td>
                            <td>
                              ₹
                              {(parseInt(p.qty, 10) || 1) *
                                (p.ProductPrice || p.price || 0)}
                            </td>
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
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/enquiry-list")}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  style={{
                    backgroundColor: "#BD5525",
                    border: "none",
                    transition: "background 0.2s",
                  }}
                  className="add-btn"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? "Updating..." : "Update"}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditEnquiry;
