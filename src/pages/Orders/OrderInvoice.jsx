

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Spinner } from "react-bootstrap";
import axios from "axios";
import { ApiURL, ImageApiURL } from "../../api";

// ✅ PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { safeImageToBase64 } from "../../utils/createPdf";

// ✅ Brand color
const BRAND = "#BD5525";
const BRAND_RGB = [189, 85, 37];

// ✅ Helpers
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeNum(n));

const parseDDMMYYYY = (str) => {
  try {
    if (!str) return null;
    const [dd, mm, yyyy] = String(str).split("-");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

const calcDays = (startStr, endStr) => {
  try {
    const start = parseDDMMYYYY(startStr);
    const end = parseDDMMYYYY(endStr);
    if (!start || !end) return 1;
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return !Number.isFinite(diff) || diff < 1 ? 1 : diff;
  } catch (e) {
    return 1;
  }
};

// ✅ filename helpers
const makeSafe = (val, fallback = "NA") => {
  if (!val && val !== 0) return fallback;

  return String(val)
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100) || fallback;
};

const formatDateToMonthName = (dateString) => {
  if (!dateString) return "NA";

  const [day, month] = dateString.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return `${day}_${months[Number(month) - 1]}`;
};

const buildFilename = (parts = []) => {
  const name = parts.map((p) => makeSafe(p)).join("_");
  return `${name}.pdf`;
};

export default function OrderInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // ✅ Fetch Order by ID
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${ApiURL}/order/getOrder/${id}`);
        const o = res?.data?.order;

        if (!o) {
          setOrder(null);
          setItems([]);
          return;
        }

        const slot = o?.slots?.[0] || null;
        const slotProducts = Array.isArray(slot?.products) ? slot.products : [];

        const enriched = slotProducts.map((p) => {
          const qty = safeNum(p?.quantity);
          const unitPrice = safeNum(p?.ProductPrice ?? p?.productPrice ?? p?.productPrice);
          const days = calcDays(
            p?.productQuoteDate || slot?.quoteDate,
            p?.productEndDate || slot?.endDate
          );

          const amount = safeNum(p?.total) || unitPrice * qty * days;

          return {
            productId: p?.productId,
            productName: p?.productName,
            productSlot: p?.productSlot || slot?.slotName || "—",
            productQuoteDate: p?.productQuoteDate || slot?.quoteDate || "—",
            productEndDate: p?.productEndDate || slot?.endDate || "—",
            ProductIcon: p?.ProductIcon,
            unitPrice,
            quantity: qty,
            days,
            amount,
          };
        });

        setOrder(o);
        setItems(enriched);
      } catch (e) {
        console.error("Order fetch error:", e);
        setOrder(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ✅ Totals
  const totals = useMemo(() => {
    try {
      if (!order) return null;

      const productsTotal = items.reduce((sum, it) => sum + safeNum(it.amount), 0);

      const discountPercent = safeNum(order?.discount || 0);
      const discountAmount = (productsTotal * discountPercent) / 100;
      const totalBeforeCharges = productsTotal - discountAmount;

      const labour = safeNum(order?.labourecharge || 0);
      const transport = safeNum(order?.transportcharge || 0);
      const refurb = safeNum(order?.refurbishmentAmount || 0);
      const additionalTransportation = safeNum(order?.additionalTransportation || 0);

      const totalAfterCharges =
        totalBeforeCharges + labour + transport + refurb + additionalTransportation;

      const gstPercent = safeNum(order?.GST || 0);
      const gstAmount = (totalAfterCharges * gstPercent) / 100;

      const computedGrandTotal = Math.round(totalAfterCharges + gstAmount);

      return {
        totalBeforeCharges,
        labour,
        transport,
        additionalTransportation,
        totalAfterCharges,
        gstAmount: Math.round(gstAmount),
        grandTotalToShow: safeNum(order?.GrandTotal) || computedGrandTotal,
      };
    } catch (e) {
      return null;
    }
  }, [order, items]);

  // ✅ PDF download (fixed alignment + no remaining stock)
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      if (!order) return;

      const doc = new jsPDF("p", "pt", "a4");
      doc.setFont("helvetica", "normal"); // ✅ stable font

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margins = { left: 40, right: 40 };
      const usableWidth = pageWidth - margins.left - margins.right;

      let y = 40;

      // --- Title ---
      doc.setFontSize(16);
      doc.text("Order Details", pageWidth / 2, y, { align: "center" });
      y += 20;

      const slot = order?.slots?.[0] || null;

      // --- Header values ---
      const clientId = order?.clientId || "—";
      const companyName = order?.clientName || "—";
      const phoneNo = order?.clientNo || "—";
      const executiveName = order?.executivename || "—";
      const venueAddress = order?.Address || "—";
      const slotLabel = slot?.slotName || "—";
      const slotDateRange =
        slot?.quoteDate && slot?.endDate ? `${slot.quoteDate}  To  ${slot.endDate}` : "—";

      // --- Header table ---
      const headerColWidths = [
        usableWidth * 0.18,
        usableWidth * 0.32,
        usableWidth * 0.18,
        usableWidth * 0.32,
      ];

      autoTable(doc, {
        body: [
          ["Client Id", clientId, "Company Name", companyName],
          ["Phone No", phoneNo, "Executive Name", executiveName],
          ["Venue Address", venueAddress, "Slot", slotLabel],
          ["Slot Date", slotDateRange, "Order Status", order?.orderStatus || "—"],
        ],
        startY: y,
        theme: "grid",
        margin: margins,
        tableWidth: usableWidth,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
          lineColor: [180, 180, 180],
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: headerColWidths[0], fontStyle: "bold" },
          1: { cellWidth: headerColWidths[1] },
          2: { cellWidth: headerColWidths[2], fontStyle: "bold" },
          3: { cellWidth: headerColWidths[3] },
        },
      });

      // --- Product rows ---
      // --- Product rows (NOW includes Price/Qty) ---
      const productRows = await Promise.all(
        items.map(async (p, idx) => {
          const url = p?.ProductIcon ? `${ImageApiURL}/product/${p.ProductIcon}` : null;
          const img64 = url ? await safeImageToBase64(url, 80) : null;

          return [
            idx + 1,
            `${p.productQuoteDate}  To  ${p.productEndDate}\n${p.productSlot || "—"}`,
            p.productName || "—",
            img64,
            String(p.quantity ?? 0),
            `Rs. ${fmtMoney(p.unitPrice ?? 0)}`,  // ✅ Price/Qty
            String(p.days ?? 1),
            `Rs. ${fmtMoney(p.amount)}`,          // ✅ Amount
          ];
        })
      );
      // ✅ Better widths (Amount got more space)
      // ✅ Better widths (8 columns)
      const colW = {
        sn: usableWidth * 0.05,
        slot: usableWidth * 0.22,
        name: usableWidth * 0.20,
        img: usableWidth * 0.13,
        qty: usableWidth * 0.08,
        price: usableWidth * 0.10,
        days: usableWidth * 0.06,
        amt: usableWidth * 0.16,
      };

      autoTable(doc, {
        head: [[
          "S.No",
          "Slot Date",
          "Product Name",
          "Product img",
          "Selected Qty",
          "Price/Qty",     // ✅ new
          "Days",
          "Amount"
        ]],
        body: productRows,
        startY: doc.lastAutoTable.finalY + 16,
        theme: "grid",
        margin: margins,
        tableWidth: usableWidth,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          lineColor: BRAND_RGB,
          textColor: 0,
          overflow: "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: BRAND_RGB,
          textColor: 255,
          minCellHeight: 22,
        },
        columnStyles: {
          0: { cellWidth: colW.sn, halign: "center" },
          1: { cellWidth: colW.slot },
          2: { cellWidth: colW.name },
          3: { cellWidth: colW.img, halign: "center" },  // ✅ image col index = 3
          4: { cellWidth: colW.qty, halign: "center" },
          5: { cellWidth: colW.price, halign: "right" }, // ✅ Price/Qty col index = 5
          6: { cellWidth: colW.days, halign: "center" },
          7: { cellWidth: colW.amt, halign: "right" },   // ✅ Amount index = 7
        },
        didParseCell(data) {
          // ✅ image column index is still 3
          if (data.row.section === "body" && data.column.index === 3) {
            data.cell.text = "";
            data.cell.styles.minCellHeight = 62;
          }

          // ✅ keep Price/Qty and Amount within the cell
          if (data.row.section === "body" && (data.column.index === 5 || data.column.index === 7)) {
            data.cell.styles.overflow = "linebreak";
            data.cell.styles.halign = "right";
          }
        },
        didDrawCell(data) {
          // ✅ draw image at column 3
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
            doc.addImage(img, "PNG", imgX, imgY, imgSize, imgSize);
          }
        },
      });

      // --- Summary table (fixed boundary) ---
      const summaryRows = [
        ["Sub total", `Rs. ${fmtMoney(totals?.totalBeforeCharges)}`],
        ["Man power", `Rs. ${fmtMoney(totals?.labour)}`],
        ["Transport", `Rs. ${fmtMoney(totals?.transport)}`],
        ["Additional Transportation", `Rs. ${fmtMoney(totals?.additionalTransportation)}`],
        ["Total", `Rs. ${fmtMoney(totals?.totalAfterCharges)}`],
        [`GST (${safeNum(order?.GST)}%)`, `Rs. ${fmtMoney(totals?.gstAmount)}`],
        ["Grand Total", `Rs. ${fmtMoney(totals?.grandTotalToShow)}`],
      ];

      autoTable(doc, {
        body: summaryRows,
        startY: doc.lastAutoTable.finalY + 14,
        theme: "grid",
        margin: margins,
        tableWidth: usableWidth,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 4,
          overflow: "hidden",
        },
        columnStyles: {
          0: { cellWidth: usableWidth * 0.70, fontStyle: "bold" },
          1: { cellWidth: usableWidth * 0.30, halign: "right" }, // ✅ prevents spill
        },
        didParseCell(data) {
          if (data.row.index === summaryRows.length - 1) {
            data.cell.styles.fillColor = [248, 249, 250];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      // --- Notes ---
      let noteY = doc.lastAutoTable.finalY + 22;

      const notes = [
        "1. Additional elements would be charged on actuals, transportation would be additional.",
        "2. 100% Payment for confirmation of event.",
        "3. Costing is merely for estimation purposes. Requirements are blocked post payment in full.",
        "4. If inventory is not reserved with payments, we are not committed to keep it.",
        "5. The nature of the rental industry that our furniture is frequently moved and transported, which can lead to scratches on glass, minor chipping of paintwork, and minor stains etc. We ask you to visit the warehouse to inspect blocked furniture if you wish.",
      ];

      const approxHeight = 14 + notes.length * 14 + 30;
      if (noteY + approxHeight > pageHeight - 40) {
        doc.addPage();
        noteY = 40;
      }

      doc.setFontSize(10);
      doc.text("Note:", margins.left, noteY);

      let currentY = noteY + 14;
      doc.setFontSize(9);
      notes.forEach((line) => {
        const split = doc.splitTextToSize(line, usableWidth - 20);
        doc.text(split, margins.left + 18, currentY);
        currentY += split.length * 12;
      });

      // ✅ Remarks (only if exists)
      const remarks = order?.remarks?.trim();
      if (remarks) {
        // move to next line after notes
        let remY = currentY + 10;

        // if not enough space, add page
        const needed = 20 + 60; // title + some text space
        if (remY + needed > pageHeight - 40) {
          doc.addPage();
          remY = 40;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Remarks:", margins.left, remY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        const remText = doc.splitTextToSize(remarks, usableWidth);
        doc.text(remText, margins.left, remY + 14);

        // update currentY if you ever add more content later
        currentY = remY + 14 + remText.length * 12;
      }

      const filename = buildFilename([
        formatDateToMonthName(slot?.quoteDate),
        formatDateToMonthName(slot?.endDate),
        order?.Address,
        order?.clientName,
      ]);

      doc.save(filename);
    } catch (e) {
      console.error("PDF download error:", e);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container my-5">
        <h4>No order found</h4>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const slot = order?.slots?.[0] || null;

  const clientId = order?.clientId || "—";
  const companyName = order?.clientName || "—";
  const phoneNo = order?.clientNo || "—";
  const executiveName = order?.executivename || "—";
  const venueAddress = order?.Address || "—";

  const slotLabel = slot?.slotName || "—";
  const slotDateRange =
    slot?.quoteDate && slot?.endDate ? `${slot.quoteDate}  To  ${slot.endDate}` : "—";

  return (
    <div className="container my-5">
      <Button
        onClick={handleDownloadPdf}
        variant="success"
        className="my-1 d-flex ms-auto"
        disabled={downloading}
      >
        {downloading ? "Downloading..." : "Download PDF"}
      </Button>

      <div
        ref={invoiceRef}
        id="print-area"
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 0,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 12, textAlign: "center" }}>
          Order Details
        </h2>

        {/* HEADER TABLE (unchanged) */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Client Id</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{clientId}</td>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Company Name</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{companyName}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Phone No</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{phoneNo}</td>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Executive Name</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{executiveName}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Venue Address</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{venueAddress}</td>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Slot</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{slotLabel}</td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Slot Date</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{slotDateRange}</td>
              <td style={{ border: "1px solid #ccc", padding: 6, fontWeight: 600 }}>Order Status</td>
              <td style={{ border: "1px solid #ccc", padding: 6 }}>{order?.orderStatus || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* ✅ PRODUCT TABLE (UI alignment improved + no Remaining Stock) */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontSize: "13px" }}>
          <thead style={{ backgroundColor: BRAND, color: "#fff" }}>
            <tr>
              <th style={{ border: "1px solid #666", padding: 8, width: 55, textAlign: "center" }}>S.No</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 240, textAlign: "left" }}>Slot Date</th>
              <th style={{ border: "1px solid #666", padding: 8, textAlign: "left" }}>Product Name</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 95, textAlign: "center" }}>Product img</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 110, textAlign: "center" }}>Selected Qty</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 70, textAlign: "center" }}>Price/Qty</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 70, textAlign: "center" }}>Days</th>
              <th style={{ border: "1px solid #666", padding: 8, width: 140, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((p, idx) => (
              <tr key={p.productId || idx}>
                <td style={{ border: "1px solid #666", padding: 8, textAlign: "center" }}>{idx + 1}</td>

                <td style={{ border: "1px solid #666", padding: 8 }}>
                  <div style={{ fontWeight: 600 }}>
                    {p.productQuoteDate} &nbsp; To &nbsp; {p.productEndDate}
                  </div>
                  <div style={{ fontSize: 12, color: "#333" }}>{p.productSlot}</div>
                </td>

                <td style={{ border: "1px solid #666", padding: 8 }}>{p.productName}</td>

                <td style={{ border: "1px solid #666", padding: 8, textAlign: "center" }}>
                  {p.ProductIcon ? (
                    <img
                      src={`${ImageApiURL}/product/${p.ProductIcon}`}
                      alt={p.productName}
                      style={{ width: 55, height: 55, objectFit: "cover" }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                {console.log("order", p)}

                <td style={{ border: "1px solid #666", padding: 8, textAlign: "center" }}>{p.quantity}</td>
                <td style={{ border: "1px solid #666", padding: 8, textAlign: "center" }}> ₹ {p.unitPrice}</td>
                <td style={{ border: "1px solid #666", padding: 8, textAlign: "center" }}>{p.days}</td>

                <td style={{ border: "1px solid #666", padding: 8, textAlign: "right" }}>
                  ₹ {fmtMoney(p.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY TABLE (unchanged) */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>Sub total</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.totalBeforeCharges)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>Man power</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.labour)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>Transport</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.transport)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>Additional Transportation</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.additionalTransportation)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>Total</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.totalAfterCharges)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 700 }}>GST ({safeNum(order?.GST)}%)</td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right" }}>
                ₹ {fmtMoney(totals?.gstAmount)}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: 8, fontWeight: 800, background: "#f8f9fa" }}>
                Grand Total
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8, textAlign: "right", fontWeight: 800, background: "#f8f9fa" }}>
                ₹ {fmtMoney(totals?.grandTotalToShow)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* NOTES (unchanged) */}
        <div style={{ fontSize: 11, marginTop: 24 }}>
          <strong>Note:</strong>
          <ol style={{ paddingLeft: 16 }}>
            <li>Additional elements would be charged on actuals, transportation would be additional.</li>
            <li>100% Payment for confirmation of event.</li>
            <li>Costing is merely for estimation purposes. Requirements are blocked post payment in full.</li>
            <li>If inventory is not reserved with payments, we are not committed to keep it.</li>
            <li>
              <strong>
                The nature of the rental industry that our furniture is frequently moved and transported, which can lead to scratches on glass, minor chipping of paintwork, and minor stains etc. We ask you to visit the warehouse to inspect blocked furniture if you wish.
              </strong>
            </li>
          </ol>
        </div>


        {/* ✅ Remarks (plain text, only if exists) */}
        {order?.remarks?.trim() ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#111" }}>
              Remarks
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#111",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {order.remarks.trim()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
