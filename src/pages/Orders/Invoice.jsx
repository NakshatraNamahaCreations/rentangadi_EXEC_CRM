import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import logo from "../../assets/RentangadiLogo.jpg";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import { ApiURL, ImageApiURL } from "../../api";
import html2pdf from "html2pdf.js";

// Function to parse date from DD-MM-YYYY format
const parseDate = (str) => {
  if (!str) return null; // If date is undefined or null, return null.
  const [day, month, year] = str.split("-"); // Assuming date format is DD-MM-YYYY
  return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for JavaScript Date
};

const Invoice = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null); // Order state
  const [productDays, setProductDays] = useState({}); // State for storing days for each product
  const invoiceRef = useRef(); // Ref for the invoice element to capture
  console.log(`location: `, location.state);
  const grandTotal = location.state.grandTotal

  useEffect(() => {
    if (location.state?.orderData) {
      setOrder(location.state.orderData);
    } else {
      fetchOrderDetails();
    }
  }, [location.state, id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${ApiURL}/order/getOrderDetails/${id}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  };

  // Parse and calculate the days for each product
  useEffect(() => {
    if (order?.slots) {
      const daysObj = {};
      order.slots.forEach((slot) => {
        slot.products.forEach((item) => {
          const quoteDate = item.productQuoteDate;
          const endDate = item.productEndDate;
          if (quoteDate && endDate) {
            const start = parseDate(quoteDate);
            const end = parseDate(endDate);
            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            daysObj[item.productId] = days >= 1 ? days : 1;
          }
        });
      });
      setProductDays(daysObj);
    }
  }, [order]); // Re-run the effect whenever order changes

  if (!order) return <div>Loading invoice...</div>; // Ensure order is set before rendering the invoice

  // // Destructure product details from order
  const items = order.slots.flatMap((slot) => slot.products) || [];
  // // order.discount = 0
  // // order.GST = 0
  // // order.refurbishment = 0

  const discount = Number(order?.discount || 0);
  // // const discount = 0
  const transport = Number(order?.transportcharge || 0);
  const manpower = Number(order?.labourecharge || 0);
  const gst = Number(order?.GST || 0);
  const refurbishment = Number(order?.refurbishmentAmount || 0);

  // // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const days = productDays[item.productId] || 1; // Get days for each product
    return sum + (item.total || 0); // Multiply total by days for each product
  }, 0);

  const discountAmt = (subtotal * discount) / 100;
  const totalBeforeCharges = subtotal - discountAmt;
  const totalAfterCharges = totalBeforeCharges + manpower + transport + refurbishment;
  const gstAmt = (totalAfterCharges * gst) / 100;
  // const grandTotal = totalAfterCharges + gstAmt;
  const roundOff = Number(order?.roundOff || 0);

  const invoice = {
    invoiceNo: order.invoiceId || "-",
    invoiceDate: order.slots?.[0]?.quoteDate || "-",
    reverseCharge: "N",
    state: "Karnataka",
    code: "29",
    billTo: {
      name: order.clientName || "-",
      address: order.Address || "-",
      gstin: "29ABUFS6629Q1ZS",
      state: "Karnataka",
      code: "29",
    },
    items,
    labourecharge: manpower,
    transportcharge: transport,
    discount,
    gst,
    amountWords: "-",
    bankDetails: {
      account: "50200099507304",
      ifsc: "HDFC0004051",
      name: "HDFC, CMH Road",
    },
  };

  // Function to handle PDF download with proper margins
  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;

    // Wait for all images inside the invoice to load
    const images = element.querySelectorAll("img");
    const promises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    );
    await Promise.all(promises);

    const opt = {
      margin: [0.5, 0.5, 0.8, 0.5],
      filename: `${invoice.invoiceNo || "invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, // useCORS is important!
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <Container ref={invoiceRef} className="p-4 border" style={{ fontSize: "12px" }}>
      <Button
        onClick={handleDownloadPDF}
        variant="success"
        className="my-3 d-flex ms-auto" // ms-auto will push the button to the right
      >
        Download Invoice
      </Button>

      <Row className="mb-4">
        <Col md={3}>
          <img src={logo} alt="Rent Angadi Logo" style={{ width: "100%" }} />
        </Col>
        <Col
          md={9}
          className="text-center"
          style={{ backgroundColor: "#0c4472", color: "#fff", padding: "10px" }}
        >
          <h4>Rent Angadi</h4>
          <p>Sy No 258/8, Old Sy No 258/1 Battahalasur Jala Hobli</p>
          <p>Bettahalasur, Bangalore, Karnataka - 560001</p>
          <p>Tel: +91 9619886262</p>
          <p>GSTIN: 29ABJFR2437E1Z3</p>
        </Col>
      </Row>

      <h5
        className="text-center text-white py-2"
        style={{ backgroundColor: "#0c4472" }}
      >
        Tax Invoice
      </h5>

      <Table bordered size="sm">
        <tbody>
          <tr>
            <td>
              <b>Invoice No:</b> {invoice.invoiceNo}
            </td>
          </tr>
          <tr>
            <td>
              <b>Invoice Date:</b> {invoice.invoiceDate}
            </td>
          </tr>
          <tr>
            <td>
              <b>Reverse Charge (Y/N):</b> {invoice.reverseCharge}
            </td>
          </tr>
          <tr>
            <td>
              <b>State:</b> {invoice.state}
            </td>
            <td>
              <b>Code:</b> {invoice.code}
            </td>
          </tr>
        </tbody>
      </Table>

      <Table bordered className="mb-4" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th
              colSpan={2}
              style={{
                backgroundColor: "#1f497d",
                color: "white",
                textAlign: "center",
              }}
            >
              Bill to Party
            </th>
            <th
              colSpan={2}
              style={{
                backgroundColor: "#1f497d",
                color: "white",
                textAlign: "center",
              }}
            >
              Ship to Party
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ width: "15%" }}>Name :</td>
            <td style={{ width: "35%" }}>{invoice.billTo.name}</td>
            <td style={{ width: "15%" }}>Name:</td>
            <td style={{ width: "35%" }}>-</td>
          </tr>
          <tr>
            <td>Address :</td>
            <td>{invoice.billTo.address}</td>
            <td>Address:</td>
            <td>-</td>
          </tr>
          <tr>
            <td>GSTIN :</td>
            <td>{invoice.billTo.gstin}</td>
            <td>GSTIN:</td>
            <td>-</td>
          </tr>
          <tr>
            <td>State :</td>
            <td>
              {invoice.billTo.state}{" "}
              <strong className="ms-3">Code : {invoice.billTo.code}</strong>
            </td>
            <td>State:</td>
            <td>Code:</td>
          </tr>
        </tbody>
      </Table>

      <Table bordered className="mt-4" size="sm">
        <thead className="bg-secondary text-white text-center">
          <tr>
            <th>S. No.</th>
            <th>Date</th>
            <th>Slot</th>
            <th>Product Name</th>
            <th>Product Image</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Days</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => {
            const days = productDays[item.productId] || 1; // Use stored days for product
            return (
              <tr key={idx}>
                <td className="text-center">{idx + 1}</td>
                <td className="text-center">
                  {item.productQuoteDate && item.productEndDate ? (
                    <>
                      {item.productQuoteDate}
                      <br />
                      to
                      <br />
                      {item.productEndDate}
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="text-center">{item.productSlot || "-"}</td>
                <td>{item.productName || "-"}</td>
                <td>
                  <img
                    src={`${ImageApiURL}/product/${item.ProductIcon}`}
                    alt={item.productName}
                    style={{ width: "50px", height: "50px" }}
                    crossOrigin="anonymous"
                  />
                </td>
                <td className="text-center">998596</td>
                <td className="text-center">{item.quantity || "-"}</td>
                <td className="text-center">₹{item.ProductPrice}</td>
                <td className="text-center">{days}</td>
                <td>₹{(item.total).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Table bordered size="sm" className="mt-3">
        <tbody>
          <tr>
            <td>
              <b>{discount != 0 ? "Total Amount before discount" : "Total Amount"}</b>
            </td>
            <td>₹ {subtotal.toFixed(2)}</td>
          </tr>
          {discount != 0 && (
            <tr>
              <td>
                <b>Discount ({discount}%)</b>
              </td>
              <td>₹ {discountAmt.toFixed(2)}</td>
            </tr>
          )}
          {discount !== 0 && <tr>
            <td>
              <b>Total amount after discount</b>
            </td>
            <td>₹ {totalBeforeCharges.toFixed(2)}</td>
          </tr>}
          <tr>
            <td>
              <b>Labour Charges</b>
            </td>
            <td>₹ {manpower.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <b>Transport Charges</b>
            </td>
            <td>₹ {transport.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <b>{"Refurbishment Charges"}</b>
            </td>
            <td>₹ {refurbishment.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <b>GST @ {gst}%</b>
            </td>
            <td>₹ {gstAmt.toFixed(2)}</td>
          </tr>
          <tr className="bg-primary text-white">
            <td>
              <b>Grand Total</b>
            </td>
            <td>
              <b>₹ {grandTotal?.toFixed(2)}</b>
            </td>
          </tr>
          <tr className="bg-primary text-white">
            <td>
              <b>RoundOff</b>
            </td>
            <td>
              <b>₹ {roundOff.toFixed(2)}</b>
            </td>
          </tr>
          <tr className="bg-primary text-white">
            <td>
              <b>Net Total</b>
            </td>
            <td>
              <b>₹ {(grandTotal - roundOff).toFixed(2)}</b>
            </td>
          </tr>
        </tbody>
      </Table>

      <p className="text-center fst-italic">{invoice.amountWords}</p>

      <h6>Bank Details</h6>
      <p>
        <b>Bank A/C:</b> {invoice.bankDetails.account}
      </p>
      <p>
        <b>IFSC:</b> {invoice.bankDetails.ifsc}
      </p>
      <p>
        <b>Bank Name:</b> {invoice.bankDetails.name}
      </p>

      <div className="mt-5 d-flex justify-content-between">
        <p>GST on Reverse Charge: -</p>
        <div className="text-end">
          <p>For Rent Angadi</p>
          <p className="mt-5">
            <b>Authorised Signatory</b>
          </p>
        </div>
      </div>

      <p className="text-center mt-3 small">
        All cheques to be drawn in the name of Rent Angadi
      </p>
    </Container>
  );
};

export default Invoice;
