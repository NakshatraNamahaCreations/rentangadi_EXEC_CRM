// import React from "react";
// import { Container, Row, Col, Table, Button, Card } from "react-bootstrap";

// const RefurbishmentInvoice = () => {
//   const invoiceData = {
//     orderId: "6842c506a4ace71e97bac90a",
//     refurbishmentId: "6843d5bfa4ace71e97bb07fe",
//     date: "07-06-2025",
//     from: {
//       name: "Rent Angadi",
//       phone: "+91 9619686262",
//     },
//     products: [
//       {
//         product: "Vintage Pink Sofa (1 Seater)",
//         quantity: 1,
//         price: 1200,
//         total: 1200,
//         damageDescription: "Minor scratch on leg",
//       },
//     ],
//     shippingAddress: "No. 45, MG Road, Bengaluru, Karnataka",
//     floorManager: "Rajesh Sharma",
//   };

//   const totalAmount = invoiceData.products.reduce((sum, p) => sum + p.total, 0);

//   return (
//     <Container className="my-4" style={{ fontSize: "14px" }}>
//       <Card className="shadow-sm border-0">
//         <Card.Body className="p-4">
//           {/* Header */}
//           <Row className="mb-3">
//             <Col>
//               <h5 className="text-primary fw-bold mb-1">Refurbishment Invoice</h5>
//               <div className="text-muted" style={{ fontSize: "13px" }}>
//                 <div>
//                   <strong>Order ID:</strong> <span>{invoiceData.orderId}</span>
//                 </div>
//                 <div>
//                   <strong>Refurbishment ID:</strong> <span>{invoiceData.refurbishmentId}</span>
//                 </div>
//                 <div>
//                   <strong>Date:</strong> <span>{invoiceData.date}</span>
//                 </div>
//               </div>
//             </Col>
//             <Col md="auto" className="text-end text-muted" style={{ fontSize: "13px" }}>
//               <div><strong>From:</strong></div>
//               <div>{invoiceData.from.name}</div>
//               <div>{invoiceData.from.phone}</div>
//             </Col>
//           </Row>

//           <hr />

//           {/* Product Table */}
//           <h6 className="fw-bold mb-3">Refurbishment Products</h6>
//           <div className="table-responsive">
//             <Table bordered hover size="sm" className="mb-4">
//               <thead className="table-light text-center">
//                 <tr>
//                   <th>S.No.</th>
//                   <th>Product</th>
//                   <th>Quantity</th>
//                   <th>Price (₹)</th>
//                   <th>Total (₹)</th>
//                   <th>Damage Description</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoiceData.products.map((item, index) => (
//                   <tr key={index} className="text-center align-middle">
//                     <td>{index + 1}</td>
//                     <td className="text-start">{item.product}</td>
//                     <td>{item.quantity}</td>
//                     <td>{item.price}</td>
//                     <td>{item.total}</td>
//                     <td className="text-start">{item.damageDescription}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           </div>

//           {/* Total */}
//           <div className="text-end fw-bold text-muted mb-3" style={{ fontSize: "14px" }}>
//             Total Amount: ₹{totalAmount}
//           </div>

//           <hr />

//           {/* Shipping Info */}
//           <h6 className="fw-bold mb-3">Shipping Information</h6>
//           <Row className="text-muted" style={{ fontSize: "13px" }}>
//             <Col>
//               <strong>Shipping Address:</strong>
//               <div>{invoiceData.shippingAddress}</div>
//             </Col>
//             <Col>
//               <strong>Floor Manager:</strong>
//               <div>{invoiceData.floorManager}</div>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {/* Download Button */}
//       <div className="text-end mt-3">
//         <Button size="sm" variant="primary">
//           Download Invoice PDF
//         </Button>
//       </div>
//     </Container>
//   );
// };

// export default RefurbishmentInvoice;

import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Table, Button, Card } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { ApiURL } from "../../api";
import moment from "moment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const RefurbishmentInvoice = () => {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${ApiURL}/refurbishment/${id}`);
        const data = await res.json();
        setInvoiceData(data);
      } catch (error) {
        setInvoiceData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!invoiceRef.current) return;

    setTimeout(() => {
      html2canvas(invoiceRef.current, { scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save(
            `Refurbishment_Invoice_${
              invoiceData?.orderId?.slice(-5) || "Invoice"
            }.pdf`
          );
        })
        .catch((err) => {
          console.error("Failed to generate PDF:", err);
        });
    }, 200);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <span className="text-muted">Loading invoice...</span>
      </Container>
    );
  }

  if (
    !invoiceData ||
    !invoiceData.products ||
    invoiceData.products.length === 0
  ) {
    return (
      <Container className="my-5 text-center">
        <span className="text-danger fw-bold">
          No Refurbishment Invoice Available
        </span>
      </Container>
    );
  }

  const totalAmount = invoiceData.products.reduce(
    (sum, p) => sum + (p.total || p.quantity * p.price),
    0
  );

  return (
    <Container className="my-4" style={{ fontSize: "14px" }}>
      <div ref={invoiceRef}>
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            {/* Header */}
            <Row className="mb-3">
              <Col>
                <h5 className="text-primary fw-bold mb-1">
                  Refurbishment Invoice
                </h5>
                <div className="text-muted" style={{ fontSize: "13px" }}>
                  <div>
                    <strong>Order ID:</strong>{" "}
                    <span>{invoiceData.orderId}</span>
                  </div>
                  <div>
                    <strong>Refurbishment ID:</strong>{" "}
                    <span>{invoiceData._id}</span>
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    <span>
                      {moment(invoiceData.createdAt || invoiceData.date).format(
                        "DD-MM-YYYY"
                      )}
                    </span>
                  </div>
                </div>
              </Col>
              <Col
                md="auto"
                className="text-end text-muted"
                style={{ fontSize: "13px" }}
              >
                <div>
                  <strong>From:</strong>
                </div>
                <div>Rent Angadi</div>
                <div>+91 9619686262</div>
              </Col>
            </Row>

            <hr />

            {/* Product Table */}
            <h6 className="fw-bold mb-3">Refurbishment Products</h6>
            <div className="table-responsive">
              <Table bordered hover size="sm" className="mb-4">
                <thead className="table-light text-center">
                  <tr>
                    <th>S.No.</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price (₹)</th>
                    <th>Total (₹)</th>
                    <th>Damage Description</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.products.map((item, index) => (
                    <tr key={index} className="text-center align-middle">
                      <td>{index + 1}</td>
                      <td className="text-start">
                        {item.productName || item.product}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.price}</td>
                      <td>{item.total || item.quantity * item.price}</td>
                      <td className="text-start">
                        {item.damage || item.damageDescription || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Total */}
            <div
              className="text-end fw-bold text-muted mb-3"
              style={{ fontSize: "14px" }}
            >
              Total Amount: ₹{totalAmount}
            </div>

            <hr />

            {/* Shipping Info */}
            {/* <h6 className="fw-bold mb-3">Shipping Information</h6>
            <Row className="text-muted" style={{ fontSize: "13px" }}>
              <Col>
                <strong>Shipping Address:</strong>
                <div>{invoiceData.shippingAddress || "N/A"}</div>
              </Col>
              <Col>
                <strong>Floor Manager:</strong>
                <div>{invoiceData.floorManager || "N/A"}</div>
              </Col>
            </Row> */}
          </Card.Body>
        </Card>
      </div>

      {/* Download Button */}
      <div className="text-end mt-3">
        <Button size="sm" variant="success" onClick={handleDownloadPDF}>
          Download Invoice PDF
        </Button>
      </div>
    </Container>
  );
};

export default RefurbishmentInvoice;
