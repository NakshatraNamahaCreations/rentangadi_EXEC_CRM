import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { ImageApiURL, ApiURL } from "../../api";
import { Container, Spinner, Button } from "react-bootstrap";
import axios from "axios";
// import { parseDate } from "../Quatation/QuotationDetails";
import { parseDate } from "../../utils/parseDates";
import { compressImageToBase64, safeImageToBase64 } from "../../utils/createPdf";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = [189, 85, 37]; // #BD5525


const OrderSheet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [productDays, setProductDays] = useState({});
  const [loading, setLoading] = useState(false)

  // ✅ Fetch order details directly from backend
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${ApiURL}/order/getOrder/${id}`);
        console.log(`res.data.order: `, res.data.order);
        const data = res.data.order;

        setOrder(data);
        if (data.slots) {
          const allItems = data.slots.flatMap((slot) => slot.products || []);
          setItems(allItems);

          // Calculate days for each product
          const daysObj = {};
          allItems.forEach((item) => {
            const start = parseDate(item.productQuoteDate);
            const end = parseDate(item.productEndDate);
            console.log(`item.name `, item.productName, `start: `, start, 'end: ', end);
            if (start && end) {
              const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
              daysObj[item.productId] = diff > 0 ? diff : 1;
            }
          });
          setProductDays(daysObj);
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchOrderDetails();
  }, [id]);

  // const parseDate = (str) => {
  //   if (!str) return null;
  //   const [day, month, year] = str.split("-");
  //   return new Date(`${year}-${month}-${day}`);
  // };

  const makeSafe = (val, fallback = "NA") => {
    if (!val && val !== 0) return fallback;
    return String(val)
      .trim()
      .replace(/[\/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 120) || fallback;
  };

  const buildFilename = (parts = [], ext = "pdf") => {
    const name = parts.map((p) => makeSafe(p)).join("-").replace(/_+/g, "_");
    return `${name}.${ext}`;
  };

  const formatDateToMonthName = (dateString) => {
    if (!dateString) return "";
    const [day, month] = dateString.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day}_${months[month - 1]}`;
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { left: 40, right: 40 };
      const usableWidth = pageWidth - margins.left - margins.right;
      let y = 40;

      // --- Title ---
      doc.setFontSize(16);
      doc.text("Order Sheet", pageWidth / 2, y, { align: "center" });
      y += 25;

      // --- Header Info ---
      const colWidths = [
        usableWidth * 0.22,
        usableWidth * 0.28,
        usableWidth * 0.22,
        usableWidth * 0.28,
      ];

      autoTable(doc, {
        body: [
          ["Company Name", order.clientName || "—", "Client Name", order.executivename || "—"],
          ["Slot", order?.slots?.[0]?.slotName || "—", "Venue", order.Address || "—"],
          ["Delivery Date", order?.slots?.[0]?.quoteDate || "—", "Dismantle Date", order?.slots?.[0]?.endDate || "—"],
          ["Incharge Name", order.inchargeName || "N/A", "Incharge Phone", order.inchargePhone || "N/A"],
        ],
        startY: y,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, valign: "middle", lineColor: [180, 180, 180] },
        margin: margins,
        tableWidth: usableWidth,
        columnStyles: {
          0: { cellWidth: colWidths[0], fontStyle: "bold" },
          1: { cellWidth: colWidths[1] },
          2: { cellWidth: colWidths[2], fontStyle: "bold" },
          3: { cellWidth: colWidths[3] },
        },
      });

      // --- Build product rows with safeImageToBase64 ---
      const rows = await Promise.all(
        items.map(async (p, i) => {
          const url = p.ProductIcon ? `${ImageApiURL}/product/${p.ProductIcon}` : null;
          const img64 = url ? await safeImageToBase64(url, 80) : null; // ✅ White BG, max 80px
          return [
            i + 1,
            p.productName,
            p.productSlot || order?.quoteTime,
            img64,
            p.quantity,
            productDays[p.productId] || 1,
          ];
        })
      );

      // --- Product table ---
      autoTable(doc, {
        head: [["#", "Product", "Slot", "Image", "Units", "Days"]],
        body: rows,
        startY: doc.lastAutoTable.finalY + 20,
        theme: "grid",
        rowPageBreak: "avoid",
        pageBreak: "auto",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: BRAND,
          textColor: 0,
        },
        headStyles: {
          fillColor: BRAND,
          textColor: 255,
          minCellHeight: 22,
        },
        columnStyles: {
          0: { cellWidth: usableWidth * 0.06 },
          1: { cellWidth: usableWidth * 0.3 },
          2: { cellWidth: usableWidth * 0.2 },
          3: { cellWidth: usableWidth * 0.2, halign: "center" },
          4: { cellWidth: usableWidth * 0.12 },
          5: { cellWidth: usableWidth * 0.12 },
        },
        didParseCell(data) {
          if (data.row.section === "body" && data.column.index === 3) {
            data.cell.text = "";
            data.cell.styles.minCellHeight = 70;
          }
        },
        didDrawCell(data) {
          if (
            data.row.section === "body" &&
            data.column.index === 3 &&
            typeof data.cell.raw === "string" &&
            data.cell.raw.startsWith("data:image")
          ) {
            const img = data.cell.raw;
            const { x, y, width, height } = data.cell;
            const imgSize = Math.min(width * 0.9, height * 0.9);
            const imgX = x + (width - imgSize) / 2;
            const imgY = y + (height - imgSize) / 2;
            doc.addImage(img, "PNG", imgX, imgY, imgSize, imgSize); // PNG for white BG
          }
        },
      });

      // --- Notes ---
      let noteY = doc.lastAutoTable.finalY + 35;
      const notes = [
        "1. Additional elements would be charged on actuals, transportation would be additional.",
        "2. 100% Payment for confirmation of event.",
        "3. Costing is merely for estimation purposes. Requirements are blocked post payment in full.",
        "4. If inventory is not reserved with payments, we are not committed to keep it.",
        "5. The nature of the rental industry that our furniture is frequently moved and transported, which can lead to scratches on glass, minor chipping of paintwork, & minor stains etc. We ask you to visit the warehouse to inspect blocked furniture if you wish.",
      ];

      const requiredHeight = 5 * 15 + 40;
      if (noteY + requiredHeight > pageHeight - 40) {
        doc.addPage();
        noteY = 40;
      }

      doc.setFontSize(10);
      doc.text("Notes:", 40, noteY);

      let currentY = noteY + 15;
      notes.forEach((line) => {
        const split = doc.splitTextToSize(line, 500);
        doc.text(split, 60, currentY);
        currentY += split.length * 12;
      });

      const filename = buildFilename([
        formatDateToMonthName(order?.slots?.[0]?.quoteDate),
        formatDateToMonthName(order?.slots?.[0]?.endDate),
        order?.executivename,
        order?.Address,
        order?.clientName,
      ]);

      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };


  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!order)
    return (
      <div className="container my-5">
        <h3>No Order Found</h3>
        <button className="btn btn-primary" onClick={() => navigate("/orders")}>
          Go Back
        </button>
      </div>
    );

  const startStr = order?.slots?.[0]?.quoteDate || order?.quoteDate;
  const endStr = order?.slots?.[0]?.endDate || order?.endDate;
  const startMoment = startStr ? moment(startStr, "DD-MM-YYYY", true) : null;
  const endMoment = endStr ? moment(endStr, "DD-MM-YYYY", true) : null;
  const numDays =
    startMoment && endMoment && startMoment.isValid() && endMoment.isValid()
      ? Math.max(1, endMoment.diff(startMoment, "days") + 1)
      : 1;

  return (
    <div className="container my-5">
      <Button
        onClick={handleDownloadPDF}
        variant="success"
        className="my-1 d-flex ms-auto"
      >
        Download Order Sheet
      </Button>

      <div
        ref={invoiceRef}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          Order Sheet
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          <tbody>
            <tr>
              <td style={tdLabel}>Company Name</td>
              <td style={tdValue}>{order.clientName}</td>
              <td style={tdLabel}>Client Name</td>
              <td style={tdValue}>{order.executivename}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Slot</td>
              <td style={tdValue}>{order?.slots?.[0]?.slotName}</td>
              <td style={tdLabel}>Venue</td>
              <td style={tdValue}>{order.Address}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Delivery Date</td>
              <td style={tdValue}>{order?.slots?.[0]?.quoteDate}</td>
              <td style={tdLabel}>Dismantle Date</td>
              <td style={tdValue}>{order?.slots?.[0]?.endDate}</td>
            </tr>
            <tr>
              <td style={tdLabel}>Incharge Name</td>
              <td style={tdValue}>{order.inchargeName || "N/A"}</td>
              <td style={tdLabel}>Incharge Phone</td>
              <td style={tdValue}>{order.inchargePhone || "N/A"}</td>
            </tr>
          </tbody>
        </table>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 24,
            fontSize: "13px",
          }}
        >
          <thead style={{ backgroundColor: '#BD5525', color: "#fff" }}>
            <tr>
              <th style={th}>S.No</th>
              <th style={th}>Product Name</th>
              <th style={th}>Slot</th>
              <th style={th}>Image</th>
              <th style={th}>Units</th>
              <th style={th}>Days</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product, idx) => (
              <tr key={idx}>
                <td style={td}>{idx + 1}</td>
                <td style={td}>{product.productName}</td>
                <td style={td}>{product.productSlot || order?.quoteTime}</td>
                <td style={td}>
                  {product.ProductIcon && (
                    <img
                      src={`${ImageApiURL}/product/${product.ProductIcon}`}
                      alt={product.productName}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </td>
                <td style={td}>{product.quantity}</td>
                <td style={td}>{productDays[product.productId] || 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: "11px", marginTop: 30 }}>
          <strong>Note:</strong>
          <ol style={{ paddingLeft: 16 }}>
            <li>
              Additional elements would be charged on actuals, transportation
              would be additional.
            </li>
            <li>100% Payment for confirmation of event.</li>
            <li>
              Costing is merely for estimation purposes. Requirements are blocked
              post payment in full.
            </li>
            <li>
              If inventory is not reserved with payments, we are not committed to
              keep it.
            </li>
            <li>
              <strong>
                The nature of the rental industry that our furniture is frequently
                moved and transported, which can lead to scratches on glass,
                minor chipping of paintwork, & minor stains etc. We ask you to
                visit the warehouse to inspect blocked furniture if you wish.
              </strong>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Common styles
const th = { border: "1px solid #666", padding: 8, textAlign: "center" };
const td = { border: "1px solid #666", padding: 8, textAlign: "center" };
const tdLabel = { border: "1px solid #ccc", padding: "6px", fontWeight: 600 };
const tdValue = { border: "1px solid #ccc", padding: "6px" };

export default OrderSheet;
