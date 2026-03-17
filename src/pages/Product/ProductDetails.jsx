import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { ApiURL, ImageApiURL } from "../../api";

// const ProductDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchProductDetails();
//   }, [id]);

//   const fetchProductDetails = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(`${ApiURL}/product/product-details/${id}`);
//       if (res.status === 200 && res.data.Product) {
//         setProduct(res.data.Product);
//         console.log("prod",res.data)
//       }
//     } catch (error) {
//       setProduct(null);
//     }
//     setLoading(false);
//   };

//   if (loading) {
//     return (
//       <Container className="my-5">
//         <Card className="shadow-lg border-0 rounded-4 p-5 text-center">
//           <h5>Loading product details...</h5>
//         </Card>
//       </Container>
//     );
//   }

//   if (!product) {
//     return (
//       <Container className="my-5">
//         <Card className="shadow-lg border-0 rounded-4 p-5 text-center">
//           <h5>Product not found.</h5>
//           <Button variant="secondary" onClick={() => navigate(-1)}>
//             Go Back
//           </Button>
//         </Card>
//       </Container>
//     );
//   }

//   return (
//     <Container className="my-5">
//       <Card className="shadow-lg border-0 rounded-4">
//         <div
//           className="py-3 px-4 rounded-top"
//           style={{
//             background: "linear-gradient(90deg, #323D4F, rgb(154, 155, 156))",
//             color: "#fff",
//           }}
//         >
//           <h4 className="mb-0 text-center">Product Details</h4>
//         </div>
//         <Card.Body className="p-4">
//           <Row>
//             <Col md={4} className="text-center mb-4 mb-md-0">
//               <img
//                 src={`${ImageApiURL}product/${product.ProductIcon}`}
//                 alt={product.ProductName}
//                 style={{
//                   width: "200px",
//                   height: "200px",
//                   objectFit: "cover",
//                   borderRadius: "8px",
//                   border: "1px solid #e0e0e0",
//                 }}
//               />
//             </Col>
//             <Col md={8}>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Product Name:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductName}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Category:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductCategory}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Subcategory:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductSubcategory}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Stock:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductStock}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Price:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductPrice}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Seater:</strong>
//                 </Col>
//                 <Col xs={6}>{product.seater || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Material:</strong>
//                 </Col>
//                 <Col xs={6}>{product.Material || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Color:</strong>
//                 </Col>
//                 <Col xs={6}>{product.Color || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Size & Weight:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductSize || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Quantity:</strong>
//                 </Col>
//                 <Col xs={6}>{product.qty || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Min Quantity:</strong>
//                 </Col>
//                 <Col xs={6}>{product.minqty || "N/A"}</Col>
//               </Row>
//               <Row className="mb-2">
//                 <Col xs={6}>
//                   <strong>Description:</strong>
//                 </Col>
//                 <Col xs={6}>{product.ProductDesc}</Col>
//               </Row>
//             </Col>
//           </Row>
//           <div className="mt-4 text-center">
//             <Button variant="secondary" onClick={() => navigate(-1)}>
//               Back
//             </Button>
//           </div>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// };

// export default ProductDetails;



const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ApiURL}/product/product-details/${id}`);
      if (res.status === 200 && res.data.product) {
        setProduct(res.data.product);
        console.log("Product:", res.data);
      }
    } catch (error) {
      setProduct(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Container className="my-5">
        <Card className="shadow-lg border-0 rounded-4 p-5 text-center">
          <h5>Loading product details...</h5>
        </Card>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="my-5">
        <Card className="shadow-lg border-0 rounded-4 p-5 text-center">
          <h5>Product not found.</h5>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Card className="shadow-lg border-0 rounded-4">
        <div
          className="py-3 px-4 rounded-top"
          style={{
            background: "linear-gradient(90deg, #323D4F, rgb(154, 155, 156))",
            color: "#fff",
          }}
        >
          <h4 className="mb-0 text-center">Product Details</h4>
        </div>
        <Card.Body className="p-4">
          <Row>
            <Col md={4} className="text-center mb-4 mb-md-0">
              <img
                // src={`${ImageApiURL}product/${product.ProductIcon}`}
                src={`${ImageApiURL}/product/${product.ProductIcon}`}
                alt={product.ProductName}
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                }}
              />
            </Col>
            <Col md={8}>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Product Name:</strong>
                </Col>
                <Col xs={6}>{product.ProductName}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Category:</strong>
                </Col>
                <Col xs={6}>{product.ProductCategory}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Subcategory:</strong>
                </Col>
                <Col xs={6}>{product.ProductSubcategory}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Stock:</strong>
                </Col>
                <Col xs={6}>{product.ProductStock}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Price:</strong>
                </Col>
                <Col xs={6}>{product.ProductPrice}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Seater:</strong>
                </Col>
                <Col xs={6}>{product.seater || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Material:</strong>
                </Col>
                <Col xs={6}>{product.Material || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Color:</strong>
                </Col>
                <Col xs={6}>{product.Color || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Size & Weight:</strong>
                </Col>
                <Col xs={6}>{product.ProductSize || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Quantity:</strong>
                </Col>
                <Col xs={6}>{product.qty || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Min Quantity:</strong>
                </Col>
                <Col xs={6}>{product.minqty || "N/A"}</Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}>
                  <strong>Description:</strong>
                </Col>
                <Col xs={6}>{product.ProductDesc || "N/A"}</Col>
              </Row>
            </Col>
          </Row>
          <div className="mt-4 text-center">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductDetails;
