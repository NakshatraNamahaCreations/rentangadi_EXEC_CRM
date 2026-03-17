

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Modal,
  Form,
  Spinner,
  Container,
} from "react-bootstrap";
import { useFetcher, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { FaEdit, FaTrashAlt, FaCheck, FaTimes } from "react-icons/fa";
import { ApiURL, ImageApiURL } from "../../api";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const labelStyle = {
  color: "#666",
  fontWeight: 500,
  fontSize: 16,
  minWidth: 110,
};
const valueStyle = { color: "#222", fontSize: 16, fontWeight: 400 };

const parseDate = (str) => {
  // console.log("parseDate str error: ", str)
  if (!str) return null; // If date is undefined or null, return null.
  const [day, month, year] = str.split("-"); // Assuming date format is DD-MM-YYYY
  return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for JavaScript Date
};

const formatDateToDDMMYYYY = (date) => {
  if (!date) return null; // If date is null or undefined, return null.
  if (!(date instanceof Date) || isNaN(date)) {
    // console.log("formatDateToDDMMYYYY date:", date);
    return null;
  }
  const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero if needed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`; // Return in dd-mm-yyyy format
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States for order details
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [showRefModal, setShowRefModal] = useState(false);

  // Add Product Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [addProductId, setAddProductId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [selectedAddProduct, setSelectedAddProduct] = useState(null);

  // Edit product states
  const [editIdx, setEditIdx] = useState(null);
  const [editQty, setEditQty] = useState(1);

  // Refurbishment modal states
  const [refProduct, setRefProduct] = useState("");
  const [refQty, setRefQty] = useState("");
  const [refPrice, setRefPrice] = useState("");
  const [refDamage, setRefDamage] = useState("");
  const [addedRefProducts, setAddedRefProducts] = useState([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [floorManager, setFloorManager] = useState("");
  const [refurbishmentdata, setRefurbishmentdata] = useState({});
  const [productDates, setProductDates] = useState({});
  const pdfRef = useRef();
  const [pdfMode, setPdfMode] = useState(false);
  const [productDays, setProductDays] = useState({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    status: "Online",
    amount: 0,
    mode: "",
    comments: "",
    date: new Date().toLocaleDateString("en-GB").split("/").join("-"),
  });
  const [amountPaid, setAmountPaid] = useState(0)
  const [amountPending, setAmountPending] = useState(0)

  // Add roundOff state
  const [roundOff, setRoundOff] = useState(0);
  const [isEditingRoundOff, setIsEditingRoundOff] = useState(false);

  const [additionalTransportation, setAdditionalTransportation] = useState(0);
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [isSavingTransport, setIsSavingTransport] = useState(false);



  const handleShowGenerateModal = () => setShowGenerateModal(true);
  const handleCloseGenerateModal = () => setShowGenerateModal(false);

  const handleRefurbishment = async () => {
    try {
      if (addedRefProducts.length === 0) {
        toast.error("Please add at least one product");
        return;
      }

      const payload = {
        products: addedRefProducts,
        // shippingAddress,
        // floorManager,
        status: "sent",
        orderId: order._id,
      };

      const response = await axios.post(
        `${ApiURL}/refurbishment/create`,
        payload
      );
      if (response.status === 201) {
        toast.success("Refurbishment submitted successfully");
        handleCloseRefModal();
      } else {
        toast.error("Failed to submit refurbishment");
      }
    } catch (error) {
      console.error("Error submitting refurbishment:", error);
      toast.error("Error occurred while adding refurbishment");
    }
  };

  // Fetching filtered inventory for the order details
  const fetchFilteredInventoryForOrder = async () => {
    console.log("order before fetch call: ", order);
    console.log("products: ", products);
    try {
      const response = await axios.get(`${ApiURL}/inventory/filter`, {
        params: {
          startDate: order?.slots[0].quoteDate,
          endDate: order?.slots[0].endDate,
          products: order?.slots[0].products.map((p) => p.productId).join(","),
        },
      });

      console.log(`${ApiURL}/inventory/filter: `, response.data.stock);
      let filtered = response.data.stock || [];
      console.log("filtered: ", filtered);

      if (order?.slots?.length && filtered?.length) {
        // Loop through each slot in the order
        order.slots = order.slots.map((slot) => {
          if (slot?.products?.length) {
            // Loop through each product in the slot's products
            slot.products = slot.products.map((product) => {
              const stock = filtered.find(
                (item) => item.productId === product.productId
              );

              // If stock is found, inject availableStock into the product, otherwise default to 0
              return {
                ...product,
                availableStock: stock ? stock.availableStock : 0,
              };
            });
          }
          return slot;
        });

        console.log("order.slots[0].products: ", order.slots[0].products);

        // You can also update the top-level `products` if you want
        if (order?.products?.length) {
          order.products = order.products.map((product) => {
            const stock = filtered.find(
              (item) => item.productId === product.productId
            );

            // Update the top-level product with available stock
            return {
              ...product,
              availableStock: stock ? stock.availableStock : 0,
            };
          });
        }

        console.log("Updated order with available stock: ", order);
      }

      // // Directly inject available stock into each product in the order
      // if (order?.products?.length && filtered?.length) {
      //   order.products = order.products.map((product) => {
      //     const stock = filtered.find((item) => item.productId === product.productId);
      //     return {
      //       ...product,
      //       availableStock: stock ? stock.availableStock : 0, // If stock found, add availableStock, else 0
      //     };
      //   });
      //   console.log("order after fetch: ",  order)

      //   // Now you can do anything with the updated order object
      //   console.log("Updated order with available stock: ", order);
      // }

      // // Directly inject available stock into each product in the order
      // // if (filtered?.length) {
      //   const updatedOrder = { ...order };  // Clone the order object

      //   updatedOrder.products = updatedOrder.products.map((product) => {
      //     const stock = filtered.find((item) => item.productId === product.productId);
      //     return {
      //       ...product,
      //       availableStock: stock ? stock.availableStock : 0, // If stock found, add availableStock, else 0
      //     };
      //   });

      //   // Use `setOrder` to update the state with the modified order
      //   setOrder(updatedOrder);

      // console.log("Updated order with available stock: ", updatedOrder);
      // }
    } catch (error) {
      console.error("Error fetching inventory for order:", error);
    }
  };

  // Fetch Order Details
  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${ApiURL}/order/getOrder/${id}`);
      console.log("fetchorder details: ", res.data.order);
      console.log("fetchorder details products only: ", res.data.order.slots[0].products);
      if (res.status === 200) {
        setOrder(res.data.order); // <-- Make sure your backend returns the order details
        setAdditionalTransportation(res.data.order?.additionalTransportation || 0);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(`${ApiURL}/product/quoteproducts`);
      if (res.status === 200) {
        setAllProducts(res.data.QuoteProduct || []);
      }
    } catch (error) {
      console.error("Error fetching all products:", error);
    }
  };

  // Fetch order details by id
  // **************previous working
  // useEffect(() => {
  //   const fetchOrderDetails = async () => {
  //     setLoading(true);
  //     try {
  //       const response = await axios.get(`${ApiURL}/order/getOrder/${id}`);
  //       console.log("fetchOrderDetails res data: ", response.data);

  //       if (response.data.order) {
  //         // First, set the order data
  //         setOrder(response.data.order);

  //         let mergedProducts = [];

  //         // Process order slots to merge products
  //         if (
  //           Array.isArray(response.data.order.slots) &&
  //           response.data.order.slots.length > 0
  //         ) {
  //           response.data.order.slots.forEach((slot) => {
  //             if (Array.isArray(slot.products)) {
  //               slot.products.forEach((p) => {
  //                 mergedProducts.push({
  //                   ...p,
  //                   unitPrice: p.total / (p.quantity),
  //                 });
  //               });
  //             }
  //           });
  //         }

  //         // If no products in slots, use products directly from the order
  //         if (
  //           mergedProducts.length === 0 &&
  //           Array.isArray(response.data.order.products) &&
  //           response.data.order.products[0]?.productName
  //         ) {
  //           mergedProducts = response.data.order.products.map((p) => ({
  //             ...p,
  //             unitPrice: p.total / (p.quantity),
  //           }));
  //         }

  //         console.log("mergedProducts: ", mergedProducts)
  //         // Fetch available stock for all products and inject it into the mergedProducts array
  //         const stockMap = await fetchAvailableStockForAllProducts(mergedProducts);

  //         // Merge the stock data with products
  //         const mergedWithStock = mergedProducts.map((prod) => ({
  //           ...prod,
  //           availableStock: stockMap[prod.productId || prod._id] ?? prod.availableStock ?? 0,
  //         }));

  //         // Now, set the products after the order is fully set
  //         setProducts(mergedWithStock);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching order details", error);
  //     }
  //     setLoading(false);
  //   };

  //   fetchOrderDetails();
  // }, [id]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        if (order) {
          // First, set the order data
          setOrder(order);

          let mergedProducts = [];

          // Process order slots to merge products
          if (Array.isArray(order.slots) && order.slots.length > 0) {
            order.slots.forEach((slot) => {
              if (Array.isArray(slot.products)) {
                slot.products.forEach((p) => {
                  mergedProducts.push({
                    ...p,
                    unitPrice: p.total / p.quantity,
                  });
                });
              }
            });
          }

          // If no products in slots, use products directly from the order
          if (
            mergedProducts.length === 0 &&
            Array.isArray(order.products) &&
            order.products[0]?.productName
          ) {
            mergedProducts = order.products.map((p) => ({
              ...p,
              unitPrice: p.total / p.quantity,
            }));
          }

          console.log("mergedProducts: ", mergedProducts);
          // Fetch available stock for all products and inject it into the mergedProducts array
          const stockMap = await fetchAvailableStockForAllProducts(
            mergedProducts
          );

          // Merge the stock data with products
          const mergedWithStock = mergedProducts.map((prod) => ({
            ...prod,
            availableStock:
              stockMap[prod.productId || prod._id] ?? prod.availableStock ?? 0,
          }));

          // Now, set the products after the order is fully set
          setProducts(mergedWithStock);
        }
      } catch (error) {
        console.error("Error fetching order details", error);
      }
      setLoading(false);
    };

    fetchOrderDetails();
  }, [order]);

  // useEffect(() => {
  //   console.log({products})
  // }, [products])

  // useEffect(() => {
  //   fetchAllProducts();
  // }, []);
  // Calculate grand total based on products
  // const grandTotal = products.reduce((sum, p) => sum + Number(p.total || 0), 0);

  // Add Product Modal logic
  const addedProductIds = products.map((p) => String(p.productId || p._id));
  const availableToAdd = allProducts.filter(
    (p) => !addedProductIds.includes(String(p._id))
  );

  const handleShowAdd = () => {
    setShowAdd(true);
    setAddProductId("");
    setAddQty(1);
    setSelectedAddProduct(null);
  };

  const handleCloseAdd = () => {
    setShowAdd(false);
    setAddProductId("");
    setAddQty(1);
    setSelectedAddProduct(null);
  };

  const handleProductSelect = async (selected) => {
    if (selected) {
      const productId = selected.value;
      setAddProductId(productId);
      setAddQty(1);

      const productObj = allProducts.find(
        (p) => String(p._id) === String(productId)
      );

      try {
        console.log("order quotedate: ", order.slots[0].quoteDate);
        console.log("order enddate: ", order.slots[0].endDate);
        const res = await axios.post(
          `${ApiURL}/inventory/product/filter/${productId}`,
          {},
          {
            params: {
              startDate: order.slots[0].quoteDate,
              endDate: order.slots[0].endDate,
              productId,
            },
          }
        );

        console.log("inventory/product/filter res.data: ", res.data);

        if (res.data?.availableStock) {
          console.log("res.data?.avaiableStock");
          setSelectedAddProduct({
            ...productObj,
            availableStock: res.data.availableStock,
          });
        } else {
          setSelectedAddProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setSelectedAddProduct(null);
      }
    } else {
      // Handle clearing
      setAddProductId("");
      setSelectedAddProduct(null);
      setAddQty(0);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedAddProduct || !addQty) return;
    // console.log("selectedAddProduct: ", selectedAddProduct)
    // const productSlot = productDates[selectedAddProduct._id]?.productSlot || order.slots[0].quoteTime;

    // Prepare new product object
    const newProduct = {
      productId: selectedAddProduct._id,
      productName: selectedAddProduct.ProductName,
      quantity: addQty,
      unitPrice: Number(selectedAddProduct.ProductPrice),
      total: addQty * Number(selectedAddProduct.ProductPrice),
      ProductIcon: selectedAddProduct.ProductIcon,
      availableStock: selectedAddProduct.availableStock,
    };

    const requestData = {
      productId: selectedAddProduct._id, // ID of the selected product to update
      productName: selectedAddProduct.ProductName,
      unitPrice: Number(selectedAddProduct.ProductPrice),
      quantity: addQty, // Updated quantity for the product
      quoteDate: order.slots[0].quoteDate, // Start date from the first slot
      endDate: order.slots[0].endDate, // End date from the first slot
      isNewProduct: true, // Flag to mark it as a new product addition
      productQuoteDate: order.slots[0].quoteDate,
      productEndDate: order.slots[0].endDate,
      productSlot: "Slot 1: 7:00 AM to 11:00 PM",
    };

    // Log the request data to console
    console.log("Request Data to be sent:", requestData);
    setAddProductLoading(true)

    try {
      // Send the updated quantity to the backend for processing
      const response = await axios.put(
        `${ApiURL}/order/addNewProductToOrderById/${order._id}`,
        {
          productId: selectedAddProduct._id,
          productName: selectedAddProduct.ProductName,
          unitPrice: Number(selectedAddProduct.ProductPrice),
          quantity: addQty, // The new quantity
          quoteDate: order.slots[0].quoteDate, // Start date of the slot
          endDate: order.slots[0].endDate, // End date of the slot
          isNewProduct: true,
          productQuoteDate: order.slots[0].quoteDate,
          productEndDate: order.slots[0].endDate,
          productSlot: "Slot 1: 7:00 AM to 11:00 PM",
        }
      );
      if (response.status === 200) {
        console.log(`response is 200. added successfully`);
        fetchOrderDetails();
        // setProducts((prev) => [...prev, newProduct]);
      }
    } catch (error) {
      console.error("Error setting up the request:", error.message);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setShowAdd(false);
      setAddProductLoading(false)
    }
  };

  // Edit product logic
  const handleEdit = (idx, qty) => {
    setEditIdx(idx);
    setEditQty(qty);
  };

  const handleEditSave = async (idx) => {
    // Ensure the quantity is valid based on the available stock
    const availableStock = order.slots[0].products[idx].availableStock;
    const currentQuantity = order.slots[0].products[idx].quantity;

    if (editQty < 1 || editQty > (availableStock + currentQuantity || 1)) {
      toast.error("Quantity must be between 1 and available stock!");
      return;
    }

    const productObj = allProducts.find(
      (p) => String(p._id) === String(order.slots[0].products[idx].productId)
    );

    // console.log(`productObj edited: `, productObj);
    // console.log("productDates.productSlot: ", productDates.productSlot);

    try {
      // Send the updated quantity to the backend for processing
      // console.log("productDates: ", productDates);
      // Sample logic to create the response object
      const productId = order.slots[0].products[idx].productId; // The product ID being updated
      // const editQty = 5; // New quantity value (for example)
      // const editQty = order.slots[0].products[idx].; // New quantity value (for example)
      const productSlot =
        productDates[order.slots[0].products[idx].productId]?.productSlot ||
        order.slots[0].products[idx].productSlot;
      const productQuoteDate = formatDateToDDMMYYYY(
        productDates[order.slots[0].products[idx].productId]
          ?.productQuoteDate || order.slots[0].quoteDate
      );
      const productEndDate = formatDateToDDMMYYYY(
        productDates[order.slots[0].products[idx].productId]?.productEndDate ||
        order.slots[0].endDate
      );

      const responseObj = {
        productId, // The ID of the product being updated
        quantity: editQty, // The new quantity
        quoteDate: order.slots[0].quoteDate, // Start date of the slot
        endDate: order.slots[0].endDate, // End date of the slot
        productSlot, // Slot information
        productQuoteDate, // Quote date for the product
        productEndDate, // End date for the product
      };

      console.log("Generated response object:", responseObj);

      const response = await axios.put(
        `${ApiURL}/order/updateExistingOrderById/${order._id}`,
        {
          productId: order.slots[0].products[idx].productId, // The ID of the product being updated
          // unitPrice: productObj.ProductPrice,
          quantity: editQty, // The new quantity
          quoteDate: order.slots[0].quoteDate, // Start date of the slot
          endDate: order.slots[0].endDate, // End date of the slot
          productQuoteDate: productQuoteDate || order.slots[0].products[idx]?.productQuoteDate || order.slots[0].quoteDate,
          productEndDate: productEndDate || order.slots[0].products[idx]?.productEndDate || order.slots[0].endDate,
          productSlot, // Slot information
        }
      );

      if (response.status === 200) {
        // const updatedAvailableStock = response.data.availableStock; // Get the latest available stock
        // order.slots[0].products[idx].availableStock=
        fetchOrderDetails();

        // Update the products state with the new quantity and total
        setProducts((prev) =>
          prev.map((prod, i) =>
            i === idx
              ? {
                ...prod,
                quantity: editQty, // Set the updated quantity
                total: editQty * prod.unitPrice, // Recalculate the total based on the new quantity
              }
              : prod
          )
        );

        toast.success("Quantity updated successfully!");
      } else {
        // If the response is not successful, show an error
        toast.error("Failed to update order. Please try again.");
      }
    } catch (error) {
      // Handle any errors during the Axios request
      console.error("Error updating order:", error);
      toast.error(error?.response?.data?.message || "An error occurred while updating the order.");
    }

    // Reset the editing state after successful update
    setEditIdx(null);
    setEditQty(1);
  };

  // // Delete product logic
  // const handleDelete = (idx) => {
  //   if (!window.confirm("Delete this product?")) return;
  //   setProducts((prev) => prev.filter((_, i) => i !== idx));
  // };

  const handleDelete = async (idx) => {
    const product = order.slots[0].products[idx]; // Get the product to delete
    const productId = product.productId;
    const quantity = product.quantity;
    const quoteDate = order.slots[0].quoteDate;
    const endDate = order.slots[0].endDate;

    // Ask for confirmation before deleting
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return; // If user cancels, do nothing

    try {
      // Send the delete request to the backend
      const response = await axios.delete(
        `${ApiURL}/order/deleteProductInOrderById/${order._id}`,
        {
          data: {
            productId, // Product ID to delete
            quantity, // Quantity of the product being removed
            quoteDate, // Start date of the slot
            endDate, // End date of the slot
          },
        }
      );

      if (response.status === 200) {
        // Successfully deleted, fetch the updated order details from the backend
        fetchOrderDetails();

        toast.success("Product deleted successfully!");
      } else {
        // If the response is not successful, show an error
        toast.error("Failed to delete product. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("An error occurred while deleting the product.");
    }
  };

  // Refurbishment modal handlers
  const handleAddRefProduct = () => {
    if (!refProduct || !refQty || !refPrice) return;
    console.log("refProduct :", refProduct);
    console.log("refQTy :", refQty);
    console.log("refPrice :", refPrice);
    setAddedRefProducts((prev) => [
      ...prev,
      {
        productName: refProduct,
        quantity: Number(refQty),
        price: refPrice,
        damage: refDamage,
      },
    ]);
    setRefProduct("");
    setRefQty("");
    setRefPrice("");
    setRefDamage("");
  };

  const handleCloseRefModal = () => {
    setShowRefModal(false);
    setRefProduct("");
    setRefQty("");
    setRefPrice("");
    setRefDamage("");
    setAddedRefProducts([]);
    setShippingAddress("");
    setFloorManager("");
  };

  const fetchAvailableStockForAllProducts = async (products) => {
    const productIds = Array.from(
      new Set(products?.map((prod) => prod.productId || prod._id))
    );
    if (productIds.length === 0) return {};

    // console.log("order.slots.products: ", order.slots[0].products);
    // console.log("startDate: ", order?.slots[0].quoteDate);
    // console.log("endDate: ", order?.slots[0].endDate);

    try {
      const response = await axios.get(`${ApiURL}/inventory/filter`, {
        params: {
          products: productIds.join(","),
          startDate: order?.slots[0].quoteDate,
          endDate: order?.slots[0].endDate,
        },
      });
      // Assume response.data.stock is [{ productId, availableStock }]
      const stockMap = {};
      (response.data.stock || []).forEach((item) => {
        stockMap[item.productId] = item.availableStock;
      });
      console.log("stockmap: ", stockMap);
      return stockMap;
    } catch (error) {
      console.error("Error fetching available stock for all products:", error);
      return {};
    }
  };

  const getRefurbishmentByOrderId = async () => {
    try {
      const response = await fetch(`${ApiURL}/refurbishment/${id}`);
      // console.log(response, "response");
      const data = await response.json();
      setRefurbishmentdata(data);
    } catch (error) {
      console.error("Error fetching refurbishment:", error);
    }
  };

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

  const calculateGrandTotal = (order) => {
    // const productTotal = (order?.slots[0]?.products || []).reduce((sum, item) => {
    //   // console.log("item: ", item);
    //   const days = productDays[item.productId] || 1; // Get days for each product
    //   return sum + (item.total || 0); // Multiply total by days for each product
    // }, 0);

    products.forEach((prod, idx) => {
      console.log(`calculateGrandTotal prods: `, products);

      if (idx === 0) console.log("prod order:", prod);
      let days = 1;
      const quoteDate = prod.productQuoteDate || slot.quoteDate;
      const endDate = prod.productEndDate || slot.endDate;

      if (quoteDate && endDate) {
        const start =
          quoteDate instanceof Date
            ? quoteDate
            : parseDate(quoteDate);
        const end =
          endDate instanceof Date ? endDate : parseDate(endDate);
        days =
          Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (isNaN(days) || days < 1) days = 1;
      }

      const price = prod.productPrice || 0;
      prod.days = days;
      prod.productTotal = price * days * prod.quantity;
      console.log(`${prod.productName} productTotal: ${prod.productTotal}`)

      if (idx === 0) console.log("date difference fr prod.prodname: ", prod.productName, days);
    })

    const allProductsTotal = products.reduce((sum, prod) => sum + (prod.productTotal || 0), 0)

    // console.log("order.slots.prods: ", order.slots[0].products)
    // console.log("productTotal: ", productTotal)

    const labour = order.labourecharge || 0;
    const transport = order.transportcharge || 0;
    const discountPercent = order.discount || 0;
    const refurbishmentAmount = order.refurbishmentAmount || 0;
    const gstPercent = order.GST || 0;
    const additionalTransportation = order.additionalTransportation || 0;
    // const adjustments = order.adjustments || 0;

    // const subtotal = productTotal + labour + transport - adjustments;
    const discountAmount = (allProductsTotal * discountPercent) / 100;
    const totalBeforeCharges = allProductsTotal - discountAmount;
    const totalAfterCharges = totalBeforeCharges + labour + transport + refurbishmentAmount + additionalTransportation;
    const gstAmount = ((totalAfterCharges) * gstPercent) / 100;
    const grandTotal = Math.round(totalAfterCharges + gstAmount);

    // console.log("calc: ", subtotal - discountAmount + gstAmount)


    // console.log("allProductsTotal: ", allProductsTotal)
    // console.log("transport: ", transport)
    // console.log("labour: ", labour)
    // console.log("discountPercent: ", discountPercent)
    // console.log("discountAmount: ", discountAmount)
    // console.log("totalBeforeCharges: ", totalBeforeCharges)
    // console.log("totalAfterCharges: ", totalAfterCharges)
    // console.log("refurbishmentAmount: ", refurbishmentAmount)
    // console.log("gstPercent: ", gstPercent)
    // console.log("gstAmount: ", gstAmount)

    // return Math.round(totalAfterCharges + gstAmount);
    return {
      grandTotal,
      discountAmount,
      totalBeforeCharges,
      totalAfterCharges,
      gstAmount,
      allProductsTotal,
    };

  };

  const {
    grandTotal,
    discountAmount,
    totalBeforeCharges,
    totalAfterCharges,
    gstAmount,
    allProductsTotal,
  } = order ? calculateGrandTotal(order) : {};


  useEffect(() => {
    // const paid = order?.payments.reduce((acc, curr) => acc + curr?.advancedAmount, 0)
    const paid = (order?.payments || []).reduce((acc, curr) => acc + curr?.advancedAmount, 0);
    setAmountPaid(paid)

    if (order?.roundOff !== 0) {
      console.log(`order?.roundOff === 0: `, order?.roundOff);
      const pending = grandTotal - order?.roundOff - paid
      setAmountPending(pending)
    } else {
      console.log(`order?.grandTotal === 0: `, grandTotal);
      const pending = grandTotal - paid
      setAmountPending(pending)
    }
  }, [order, grandTotal])

  useEffect(() => {
    console.log("useeffect");
    fetchOrderDetails();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    fetchAvailableStockForAllProducts();
  }, [products]);

  useEffect(() => {
    if (order) {
      fetchFilteredInventoryForOrder();
    }
  }, [order]);

  useEffect(() => {
    getRefurbishmentByOrderId();
  }, [id]);

  useEffect(() => {
    if (order) {
      setRoundOff(order.roundOff || 0);
    }
  }, [order]);

  const navigateToDetails = (_id) => {
    // Navigate to the next page and pass the `_id` in state
    navigate("/invoice", { state: { id: _id } });
  };

  const handleDateChange = (productId, dateType, date, productData) => {
    console.log({ productId, dateType, date, productData });
    // Update the productDates state with the new date and slot value
    setProductDates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [dateType]: date,
        productData,
      },
    }));
  };

  // console.log("productDates: ", productDates);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await axios.post(`${ApiURL}/order/cancel-slot`, {
        orderId: order._id,
      });
      if (res.status === 200) {
        setOrder(res.data.order); // <-- Make sure your backend returns the order details
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const handleDownloadPDF = async () => {
    // Navigate to dedicated Order Sheet view with prepared data
    if (!order) return;
    const derivedItems = (order?.slots?.[0]?.products || []).map((p) => {
      // derive days from per-product dates
      let days = 1;
      const start = parseDate(p.productQuoteDate);
      const end = parseDate(p.productEndDate);
      if (start && end) {
        const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        days = isNaN(diff) || diff < 1 ? 1 : diff;
      }
      return {
        productId: p.productId,
        productName: p.productName,
        productSlot: p.productSlot || order?.slots?.[0]?.quoteTime,
        image: p.ProductIcon,
        // pricePerUnit: Number((p.total || 0) / (p.quantity || 1)) || 0,
        quantity: p.quantity,
        days,
        // amount: Number((p.total || 0) / (p.quantity || 1)) || 0,    
      };
    });
    navigate(`/order-sheet/${order._id}`, { state: { order, items: derivedItems, productDates } });
  };

  const handlePaymentInputChange = async (e) => {
    // const numericValue = parseFloat(value) || 0;
    // const maxAmount = parseFloat(quotation?.finalTotal) || 0;
    // const finalValue = Math.min(numericValue, maxAmount);

    // setPaymentData((prev) => ({ ...prev, amount: e.target.value }))

    console.log(`paymentData: `, paymentData);
    const { name, value } = e.target;

    if (name === 'amount') {
      console.log(`changing amount: `, paymentData.amount);
      const numericValue = parseFloat(value) || 0;
      const maxAmount = parseFloat(amountPending) || 0;
      const finalValue = Math.min(numericValue, maxAmount);
      console.log(`grandTotal: `, grandTotal);
      console.log(`numericValue: `, numericValue);
      console.log(`finalValue: `, finalValue);
      setPaymentData((prev) => ({ ...prev, amount: finalValue.toString() }));
    } else {
      setPaymentData((prev) => ({ ...prev, [name]: value }));
    }
  }

  const handleAddPayment = async () => {

    // if (!paymentData.amount || paymentData.amount === '' || paymentData.amount === '0' || paymentData.amount === 0) {
    //   console.log(`typeof payment.amount `, typeof paymentData.amount);
    //   toast.error("Amount cannot be empty or zero")
    //   return
    // } else if (!paymentData.mode) {
    //   toast.error("Please select a payment mode")
    //   return
    // }
    if (!paymentData.amount || paymentData.amount === '' || paymentData.amount === '0' || paymentData.amount === 0) {
      console.log(`typeof payment.amount `, typeof paymentData.amount);
      toast.error("Amount cannot be empty or zero")
      return
    } else if (paymentData.amount > order?.GrandTotal) {
      toast.error(`Max allowed to be paid is: ${order?.GrandTotal}`)
      return
    }

    if (paymentData.status === 'Online' && (!paymentData.mode)) {
      toast.error("Please enter a payment mode")
      return
    }

    // toast.success(`executed total: Rs. ${order?.GrandTotal}`)
    // return

    setAddPaymentLoading(true)

    try {
      // First, make the API call to fetch payment data
      const orderDetails = {
        quotationId: order?.quoteId,
        totalAmount: order?.GrandTotal,
        advancedAmount: paymentData.amount,
        paymentMode: paymentData.status, // Send selected payment mode
        paymentRemarks:
          paymentData.status === "Offline" ? "cash" : paymentData.mode,
        comment: paymentData.comments,
        status: "Completed",
      };

      // Make the POST request to add payment
      const response = await axios.post(`${ApiURL}/payment/`, orderDetails);

      // // If the API call is successful, update the payment data state
      if (response.status === 200) {
        console.log("payment successful: ", response.data);
        toast.success("payment added successfully!");
        window.location.reload();
        // setGetPayment(response.data);
      }
      console.log("payment details: ", orderDetails);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      // Optionally handle any errors that occur during the API request
    } finally {
      handleCloseGenerateModal();
      setAddPaymentLoading(false);
    }
  };

  const handleGoToOrderInvoice = () => {
    try {
      if (!order?._id) return;
      navigate(`/order-pdf/${order._id}`);
    } catch (e) {
      console.error(e);
    }
  };


  const handleRoundOffChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setRoundOff(value);
  };

  const handleSaveRoundOff = async () => {
    try {
      const response = await axios.put(`${ApiURL}/order/updateOrderFields`, {
        orderId: order._id,
        roundOff,
      });

      if (response.status === 200) {
        toast.success("RoundOff updated successfully");
        setIsEditingRoundOff(false);
        // Update order state with new roundOff value
        setOrder(prev => ({
          ...prev,
          roundOff
        }));
      } else {
        toast.error("Failed to update roundOff");
      }
    } catch (error) {
      console.error("Error updating roundOff:", error);
      toast.error("Error occurred while updating roundOff");
    }
  };

  const handleCancelRoundOff = () => {
    setRoundOff(order.roundOff || 0);
    setIsEditingRoundOff(false);
  };

  const handleTransportChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setAdditionalTransportation(value);
  };

  const handleSaveTransport = async () => {
    try {
      setIsSavingTransport(true);
      const response = await axios.put(`${ApiURL}/order/updateOrderFields`, {
        orderId: order._id,
        additionalTransportation,
      });

      if (response.status === 200) {
        toast.success("Transportation charge updated successfully!");
        setIsEditingTransport(false);
        // fetchOrderDetails(); // refresh order
        window.location.reload();
      } else {
        toast.error("Failed to update transportation charge");
      }
    } catch (error) {
      console.error("Error updating transport:", error);
      toast.error("Error occurred while updating transportation charge");
    } finally {
      setIsSavingTransport(false);
    }
  };

  const handleCancelTransportEdit = () => {
    setAdditionalTransportation(order.additionalTransportation || 0);
    setIsEditingTransport(false);
  };



  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!order) {
    return <div>Loading...</div>;
  }

  const deliveryDismantleSlots = [
    "Select Slots",
    "Slot 1: 7:00 AM to 11:00 PM",
    "Slot 2: 11:00 PM to 11:45 PM",
    "Slot 3: 7:30 AM to 4:00 PM",
    "Slot 4: 2:45 PM to 11:45 PM",
  ];

  return (
    <div className="p-3" style={{ background: "#f6f8fa", minHeight: "100vh" }}>
      <div ref={pdfRef}>
        <Card className="shadow-sm mb-4" style={{ borderRadius: 12 }}>
          {/* <Button variant="secondary" onClick={handleDownloadPDF} style={{ width: "150px", margin: "10px" }}>
            Download PDF
          </Button> */}
          {!pdfMode && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                margin: "10px",
                flexWrap: "wrap",
              }}
            >

              <Button
                variant="dark"
                onClick={handleGoToOrderInvoice}
                style={{
                  width: 200,
                  borderRadius: 8,
                  fontWeight: 600,
                }}
                disabled={order && order.orderStatus === "cancelled"}
              >
                PDF
              </Button>
            </div>

          )}

          <Card.Body>
            <h6 className="mb-3" style={{ fontWeight: 700, fontSize: 17 }}>
              Order Details
            </h6>

            <Row className="mb-2">
              <Col xs={12} md={6} >
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Client Id:</span>
                  <span style={valueStyle}>{order.clientId}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Company Name: </span>
                  <span style={valueStyle}>{order.clientName}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Phone No: </span>
                  <span style={valueStyle}>{order.clientNo}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Executive Name: </span>
                  <span style={valueStyle}>{order.executivename}</span>
                </div>
                {/* <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>Address: </span>
                  <span style={valueStyle}>{order.placeaddress}</span>
                </div> */}
                {!pdfMode && (
                  <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                    <span style={labelStyle}>Order Status: </span>
                    <span
                      style={{ ...valueStyle, color: order.orderStatus === "Confirm" ? "#1dbf73" : "#E53935", fontWeight: 600 }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                )}
              </Col>
              <Col xs={12} md={6}>
                {/* {!pdfMode && ( */}
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Venue address:</span>
                  <span style={valueStyle}>{order.Address}</span>
                </div>
                {/* <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>Sub total:</span>
                  <span style={valueStyle}>₹ {totalBeforeCharges || 0}</span>
                </div> */}
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Man power: </span>
                  <span style={valueStyle}>₹ {order.labourecharge}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px", }}>
                  <span style={labelStyle}>Transport: </span>
                  <span style={valueStyle}>₹ {order.transportcharge}</span>
                </div>
                {/* <div
                  className="mb-1"
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <span style={labelStyle}>Additional Transportation:</span>

                  {!isEditingTransport ? (
                    <>
                      <span style={valueStyle}>
                        ₹ {order.additionalTransportation ?? 0}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        style={{
                          padding: "0",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={() => setIsEditingTransport(true)}
                        disabled={order && order.orderStatus === "cancelled"} // ✅ correct placement
                      >
                        <FaEdit style={{ fontSize: "14px", margin: "0" }} />
                      </Button>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Form.Control
                        type="number"
                        step="1"
                        value={additionalTransportation}
                        onChange={handleTransportChange}
                        style={{ maxWidth: "100px", height: "30px" }}
                        disabled={order && order.orderStatus === "cancelled"} // ✅ also disable input
                      />
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveTransport}
                        disabled={
                          isSavingTransport || (order && order.orderStatus === "cancelled")
                        } // ✅ disable when cancelled
                      >
                        {isSavingTransport ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaCheck />
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancelTransportEdit}
                        disabled={order && order.orderStatus === "cancelled"} // ✅ disable cancel too
                      >
                        <FaTimes />
                      </Button>
                    </div>
                  )}
                </div> */}
                {/* <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>Total:</span>
                  <span style={valueStyle}>₹ {totalAfterCharges || 'N/A'}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>GSt(18%):</span>
                  <span style={valueStyle}>₹ {gstAmount || 'N/A'}</span>
                </div> */}
                <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>Grand Total: </span>
                  {/* <span style={valueStyle}>₹ {grandTotal}</span> */}
                  <span style={valueStyle}>₹ {order?.GrandTotal || "N/A"}</span>
                </div>
                {/* )} */}



                {/* <div
                  className="mb-1"
                  style={{ display: "flex", gap: "10px", alignItems: "center", lineHeight: "1.2" }}
                >
                  <span style={labelStyle}>Roundoff:</span>
                  {!isEditingRoundOff ? (
                    <>
                      <span style={valueStyle}>₹ {roundOff}</span>
                      <Button
                        variant="link"
                        size="sm"
                        style={{ padding: "0", height: "20px", display: "flex", alignItems: "center" }}
                        onClick={() => setIsEditingRoundOff(true)}
                      >
                        <FaEdit style={{ fontSize: "14px", margin: "0" }} />
                      </Button>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={roundOff}
                        onChange={handleRoundOffChange}
                        style={{ maxWidth: "100px", height: "30px" }}
                      />
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleSaveRoundOff}
                      >
                        <FaCheck className="fa-1x" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancelRoundOff}
                      >
                        <FaTimes />
                      </Button>
                    </div>
                  )}
                </div> */}
                {/* <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>paid so far:</span>
                  <span style={valueStyle}>₹ {amountPaid}</span>
                </div>
                <div className="mb-1" style={{ display: "flex", gap: "10px" }}>
                  <span style={labelStyle}>remaining pay:</span>
                  <span style={valueStyle}>₹ {amountPending}</span>
                </div> */}
              </Col>
            </Row>
            <hr className="my-3" />
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Products</span>
              {!pdfMode && (
                <div>
                  <Button
                    variant="outline-success"
                    size="sm"
                    style={{ fontSize: 12, padding: "2px 14px", marginRight: 8 }}
                    onClick={handleShowAdd}
                    disabled={order && order.orderStatus === "cancelled"}
                  >
                    {addProductLoading ? "Adding Product..." : "Add Product"}
                  </Button>
                  {/* <Button
                    variant="outline-success"
                    size="sm"
                    style={{ fontSize: 12, padding: "2px 14px" }}
                    onClick={() => setShowRefModal(true)}
                    disabled={order && order.orderStatus === "cancelled"}
                  >
                    Add Refurbishment
                  </Button> */}
                </div>
              )}
            </div>


            {/* products table */}
            <div className="table-responsive mb-3">
              <Table
                bordered
                size="sm"
                style={{ background: "#fff", fontSize: 13, borderRadius: 8 }}
              >
                <thead>
                  <tr style={{ background: "#f3f6fa" }}>
                    <th>Slot Date</th>
                    <th>Product Name</th>
                    <th>Product img</th>
                    {!pdfMode && <th>Remaining Stock</th>}
                    <th>Selected Qty</th>
                    <th>Days</th>
                    {/* you have t comment these 2 */}
                    {/* <th>Price/Qty</th> */}
                    {/* <th>Total</th> */}
                    {!pdfMode && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => {
                    // const slotDate =
                    //   order.slots && order.slots.length > 0
                    //     ? `${order.slots[0].quoteDate} to ${order.slots[0].endDate}`
                    //     : "No Slot";

                    // see if grandottal calc works here too
                    // if (idx === 0) console.log("prod order:", prod);
                    // let days = 1;
                    // const quoteDate = prod.productQuoteDate || slot.quoteDate;
                    // const endDate = prod.productEndDate || slot.endDate;

                    // if (quoteDate && endDate) {
                    //   const start =
                    //     quoteDate instanceof Date
                    //       ? quoteDate
                    //       : parseDate(quoteDate);
                    //   const end =
                    //     endDate instanceof Date ? endDate : parseDate(endDate);
                    //   days =
                    //     Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    //   if (isNaN(days) || days < 1) days = 1;
                    // }

                    // const price = prod.ProductPrice || 0;
                    // prod.days = days;
                    // prod.productTotal = price * days * prod.quantity;
                    // console.log(`${prod.productName} productTotal: ${prod.productTotal}`)

                    // if (idx === 0) console.log("date difference fr prod.prodname: ", prod.productName, days);

                    return (
                      <tr key={idx}>
                        <td style={{ verticalAlign: "middle", width: "25%" }}>
                          {editIdx === idx ? (
                            <>
                              <div className="d-flex">
                                <DatePicker
                                  selected={
                                    productDates[prod.productId]
                                      ?.productQuoteDate ||
                                    parseDate(prod.productQuoteDate)
                                  }
                                  onChange={(date) =>
                                    handleDateChange(
                                      prod.productId,
                                      "productQuoteDate",
                                      date,
                                      prod.productQuoteDate ||
                                      order?.slots[0]?.quoteTime
                                    )
                                  }
                                  dateFormat="dd/MM/yyyy"
                                  className="form-control"
                                  minDate={parseDate(order.slots[0].quoteDate)} // Ensure date is within range
                                  maxDate={parseDate(order.slots[0].endDate)} // Ensure date is within range
                                  disabled={
                                    order && order.orderStatus === "cancelled"
                                  }
                                />
                                {console.log("end date: ", productDates[prod.productId])}
                                <DatePicker
                                  selected={
                                    productDates[prod.productId]
                                      ?.productEndDate ||
                                    parseDate(prod.productEndDate)
                                  }
                                  onChange={(date) =>
                                    handleDateChange(
                                      prod.productId,
                                      "productEndDate",
                                      date,
                                      prod.productEndDate ||
                                      order?.slots[0]?.endTime
                                    )
                                  }
                                  dateFormat="dd/MM/yyyy"
                                  className="form-control"
                                  minDate={parseDate(order.slots[0].quoteDate)}
                                  maxDate={parseDate(order.slots[0].endDate)}
                                  disabled={
                                    order && order.orderStatus === "cancelled"
                                  }
                                />
                              </div>
                              <Form.Select
                                className="m-0 mt-1"
                                value={
                                  productDates[prod.productId]?.productSlot ||
                                  prod.productSlot
                                }
                                onChange={(e) =>
                                  handleDateChange(
                                    prod.productId,
                                    "productSlot",
                                    e.target.value,
                                    e.target.value
                                  )
                                }
                                disabled={
                                  order && order.orderStatus === "cancelled"
                                }
                              >
                                {deliveryDismantleSlots.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </Form.Select>
                            </>
                          ) : (
                            <>
                              {/* If not in edit mode, just show the date and slot */}
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: "#444",
                                  marginRight: "10px",
                                }}
                              >
                                {/* Show productQuoteDate */}
                                {/* {productDates[prod.productId]?.productQuoteDate
                                ? formatDateToDDMMYYYY(
                                    productDates[prod.productId]
                                      ?.productQuoteDate
                                  )
                                : order?.slots[0]?.quoteDate ||
                                  "No date available"}
                              {"    "} */}

                                {prod.productQuoteDate}
                                <span style={{ paddingLeft: "10px" }}>To</span>
                              </span>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  color: "#444",
                                }}
                              >
                                {/* Show productEndDate */}
                                {/* {productDates[prod.productId]?.productEndDate
                                ? formatDateToDDMMYYYY(
                                    productDates[prod.productId]?.productEndDate
                                  )
                                : order?.slots[0]?.endDate ||
                                  "No date available"} */}

                                {prod.productEndDate}
                              </span>
                              {/* Show productSlot */}
                              <div>
                                {productDates[prod.productId]?.productSlot ||
                                  prod.productSlot}
                              </div>
                            </>
                          )}
                        </td>

                        <td>{prod.productName}</td>
                        <td>
                          <img
                            src={`${ImageApiURL}/product/${prod.ProductIcon}`}
                            alt={prod.productName}
                            style={{ width: "50px", height: "50px" }}
                            crossOrigin="anonymous"
                          />
                        </td>
                        {!pdfMode && (
                          <td style={{ color: "#1a73e8", fontWeight: 500 }}>
                            {prod.availableStock}
                          </td>
                        )}
                        <td>
                          {editIdx === idx ? (
                            <Form.Control
                              type="number"
                              min={1}
                              max={prod.availableStock + prod.quantity}
                              value={editQty}
                              onChange={(e) => {
                                let val = e.target.value.replace(/^0+/, "");
                                setEditQty(
                                  val === ""
                                    ? ""
                                    : Math.max(
                                      1,
                                      Math.min(
                                        Number(val),
                                        prod.availableStock + prod.quantity
                                      )
                                    )
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
                            prod.quantity
                          )}
                        </td>
                        <td>{prod.days}</td>
                        {/* you have t comment these 2 */}
                        {/* <td>₹{(prod.productPrice)}</td> */}
                        {/* <td>₹{prod.productTotal}</td> */}
                        {/* {(idx === 0) && console.log(`prod.total * days: ${prod.total * days} prod.productName: ${prod.productName}prod.total: ${prod.total}`)} */}
                        {!pdfMode && (
                          <td>
                            {editIdx === idx ? (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  style={{ padding: "2px 6px", marginRight: 4 }}
                                  onClick={() => handleEditSave(idx)}
                                >
                                  <FaCheck />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  style={{ padding: "2px 6px" }}
                                  onClick={() => setEditIdx(null)}
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
                                  onClick={() => handleEdit(idx, prod.quantity)}
                                  disabled={
                                    order && order.orderStatus === "cancelled"
                                  }
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
                                  onClick={() => handleDelete(idx)}
                                  disabled={
                                    order && order.orderStatus === "cancelled"
                                  }
                                >
                                  <FaTrashAlt />
                                </Button>
                              </>
                            )}
                          </td>)}
                      </tr>
                    );
                  })}
                  {console.log(`*** products: `, products)}
                  {/* {
                    (
                      <tr>
                        <td colSpan={6} className="text-end">
                          <strong>Products Total:</strong>
                        </td>
                        <td className="text-end">
                          <strong>₹{products.reduce((acc, curr) => acc + curr?.productTotal, 0)}</strong>
                        </td>
                      </tr>
                    )}
                  {
                    (
                      <tr>
                        <td colSpan={6} className="text-end">
                          <strong>Paid Total:</strong>
                        </td>
                        <td className="text-end">
                          <strong>₹{order?.payments.reduce((acc, curr) => acc + curr?.advancedAmount, 0)}</strong>
                        </td>
                      </tr>
                    )} */}
                </tbody>
              </Table>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e9ecef",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: "#1a73e8",
                    }}
                  />
                  <h6 style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#1f2937" }}>
                    Remarks
                  </h6>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  Order Notes
                </span>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #dbe4ee",
                  borderRadius: 10,
                  padding: 12,
                  color: "#111827",
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap", // keeps new lines
                  wordBreak: "break-word",
                  minHeight: 44,
                }}
              >
                {order?.remarks?.trim()
                  ? order.remarks
                  : (
                    <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                      No remarks added yet.
                    </span>
                  )}
              </div>
            </div>
            {!pdfMode && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {/* <Button
                  variant="primary"
                  size="sm"
                  style={{ fontSize: 13, fontWeight: 600 }}
                  onClick={() => navigate(`/invoice/${id}`, { state: { orderData: order, grandTotal } })}
                  disabled={order && order.orderStatus === "cancelled"}
                >
                  Generate Invoice
                </Button> */}
                {/* <Button
                  variant="info"
                  size="sm"
                  style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}
                  onClick={() => navigate(`/refurbishment-invoice/${id}`)}
                  disabled={order && order.orderStatus === "cancelled"}
                >
                  Refurbishment Invoice
                </Button> */}
               {/* <Button
                  variant="primary"
                  size="sm"
                  style={{ fontSize: 13, fontWeight: 600 }}
                  onClick={handleShowGenerateModal}
                  disabled={order && order.orderStatus === "cancelled"}
                >
                  Pay Amount
                </Button> */}
                <Button
                  variant="danger"
                  size="sm"
                  style={{ fontSize: 13, fontWeight: 600 }}
                  onClick={handleCancelOrder}
                  disabled={order && order.orderStatus === "cancelled"}
                  className="ml-auto"
                >
                  Cancel Order
                </Button>
              </div>
            )}

          </Card.Body>
        </Card>

        {/* Add Product Modal */}
        <Modal show={showAdd} onHide={handleCloseAdd} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Product</Modal.Title>
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
                    addProductId
                      ? availableToAdd
                        .map((p) => ({ value: p._id, label: p.ProductName }))
                        .find(
                          (opt) => String(opt.value) === String(addProductId)
                        )
                      : null
                  }
                  onChange={handleProductSelect}
                  isClearable
                  placeholder="Search product..."
                />
              </Form.Group>
              <Row>
                <Col xs={6}>
                  <Form.Group className="mb-3" controlId="addProductStock">
                    <Form.Label>Available Stock</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        selectedAddProduct ? selectedAddProduct.availableStock : 0
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
                      max={selectedAddProduct?.availableStock || 1}
                      value={addQty}
                      disabled={!addProductId}
                      onChange={(e) => {
                        let val = e.target.value.replace(/^0+/, "");
                        let qty = val === "" ? "" : Math.max(1, Number(val));
                        if (
                          selectedAddProduct &&
                          qty > selectedAddProduct.availableStock
                        ) {
                          qty = selectedAddProduct.availableStock;
                        }
                        setAddQty(qty);
                      }}
                    />
                    {selectedAddProduct &&
                      addQty > selectedAddProduct.availableStock && (
                        <div style={{ color: "red", fontSize: 12 }}>
                          Cannot exceed available stock (
                          {selectedAddProduct.availableStock})
                        </div>
                      )}
                  </Form.Group>
                </Col>
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
                {/* <Col xs={6}>
                <Form.Group className="mb-3" controlId="addProductTotal">
                  <Form.Label>choose slot</Form.Label>
                  <Form.Select
                    className="m-0 mt-1"
                    value={
                      productDates[selectedAddProduct?.productId]?.productSlot ||
                      selectedAddProduct?.productSlot
                    } // Default to initial slot value
                    onChange={(e) =>
                      handleDateChange(
                        selectedAddProduct._id,
                        "productSlot",
                        e.target.value,
                        e.target.value
                      )
                    }
                  >
                    {deliveryDismantleSlots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col> */}
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              size="sm"
              disabled={
                !addProductId ||
                !addQty ||
                addQty < 1 ||
                (selectedAddProduct && addQty > selectedAddProduct.availableStock)
              }
              onClick={handleAddProduct}
            >
              Add
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Refurbishment Modal */}
        <Modal show={showRefModal} onHide={handleCloseRefModal} centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: 18, fontWeight: 600 }}>
              Add Refurbishment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: 14, fontWeight: 500 }}>
                  Select Product Name <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  value={refProduct}
                  onChange={(e) => {
                    setRefProduct(e.target.value);
                    setRefQty("");
                    setRefPrice("");
                    setRefDamage("");
                  }}
                >
                  <option value="">Select products...</option>
                  {products.map((prod, idx) => (
                    <option key={idx} value={prod.productName}>
                      {prod.productName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {refProduct && (
                <div
                  className="mb-3"
                  style={{
                    background: "#f8f9fa",
                    borderRadius: 8,
                    padding: 10,
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 120, fontWeight: 500 }}>
                    {refProduct}
                  </div>
                  <div className="d-flex gap-2 my-2">
                    <Form.Control
                      type="number"
                      min={1}
                      max={
                        products.find((p) => p.productName === refProduct)
                          ?.availableStock || 1
                      }
                      placeholder="Quantity"
                      value={refQty}
                      style={{ width: 80, fontSize: 13 }}
                      onChange={(e) => {
                        let maxQty =
                          products.find((p) => p.productName === refProduct)
                            ?.availableStock || 1;
                        let val = e.target.value.replace(/^0+/, "");
                        if (val === "") setRefQty("");
                        else
                          setRefQty(Math.max(1, Math.min(Number(val), maxQty)));
                      }}
                    />
                    <Form.Control
                      type="number"
                      min={1}
                      placeholder="Price"
                      value={refPrice}
                      style={{ width: 80, fontSize: 13 }}
                      onChange={(e) =>
                        setRefPrice(e.target.value.replace(/^0+/, ""))
                      }
                    />
                    <Form.Control
                      type="text"
                      placeholder="Description"
                      value={refDamage}
                      style={{ width: 100, fontSize: 13 }}
                      onChange={(e) => setRefDamage(e.target.value)}
                    />
                    <Button
                      variant="success"
                      size="sm"
                      style={{ fontWeight: 600, minWidth: 60 }}
                      onClick={handleAddRefProduct}
                      disabled={
                        !refProduct ||
                        !refQty ||
                        !refPrice ||
                        Number(refQty) < 1 ||
                        Number(refPrice) < 1
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              {/* <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: 14, fontWeight: 500 }}>
                  Shipping Address <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter shipping address"
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: 14, fontWeight: 500 }}>
                  Floor Manager
                </Form.Label>
                <Form.Control
                  type="text"
                  value={floorManager}
                  onChange={(e) => setFloorManager(e.target.value)}
                  placeholder="Enter floor manager"
                />
              </Form.Group> */}
              <div
                style={{ fontWeight: 600, fontSize: 15, margin: "12px 0 6px" }}
              >
                Added Products
              </div>
              <div className="table-responsive">
                <Table
                  bordered
                  size="sm"
                  style={{ background: "#fff", fontSize: 13 }}
                >
                  <thead>
                    <tr style={{ background: "#f3f6fa" }}>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedRefProducts.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.productName}</td>
                        <td>{item.qty}</td>
                        <td>₹{item.price}</td>
                        <td>{item.damage}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseRefModal}>
              Close
            </Button>
            <Button
              variant="primary"
              disabled={addedRefProducts.length === 0}
              onClick={handleRefurbishment}
            >
              Submit
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showGenerateModal} onHide={handleCloseGenerateModal} centered>
          <Modal.Header style={{ borderBottom: "none", padding: "20px 20px 0" }}>
            <Modal.Title style={{ fontWeight: "600", color: "#2c3e50" }}>
              Payment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: "20px" }}>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Payment
                </Form.Label>
                <div>
                  <Form.Check
                    inline
                    label="Offline"
                    type="checkbox"
                    checked={paymentData.status === "Offline"}
                    onChange={() => setPaymentData((prev) => ({ ...prev, status: "Offline" }))}
                    style={{ marginRight: "20px" }}
                  />
                  <Form.Check
                    inline
                    label="Online"
                    type="checkbox"
                    checked={paymentData.status === "Online"}
                    onChange={() => setPaymentData((prev) => ({ ...prev, status: "Online" }))}
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Amount
                </Form.Label>
                <div className="d-flex align-items-center">
                  <span
                    style={{
                      marginRight: "10px",
                      fontSize: "1.2rem",
                      color: "#34495e",
                    }}
                  >
                    ₹
                  </span>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    max={order?.GrandTotal}
                    onChange={handlePaymentInputChange}
                    placeholder="0"
                    style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                  />
                </div>
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Amount already Paid
                </Form.Label>
                {/* {console.log("payments: ", order?.payments?.reduce((acc, curr) => acc + curr?.advancedAmount, 0))} */}
                {console.log("payments: ", (order?.payments || []).reduce((acc, curr) => acc + curr?.advancedAmount, 0))}
                <div className="d-flex align-items-center">
                  <span
                    style={{
                      marginRight: "10px",
                      fontSize: "1.2rem",
                      color: "#34495e",
                    }}
                  >
                    ₹
                  </span>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={amountPaid}
                    max={order?.GrandTotal}
                    // onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    disabled
                    style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                  />
                </div>
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Amount Pending
                </Form.Label>
                {/* {console.log("payments: ", order?.payments?.reduce((acc, curr) => acc + curr?.advancedAmount, 0))} */}
                {console.log("payments: ", (order?.payments || []).reduce((acc, curr) => acc + curr?.advancedAmount, 0))}
                <div className="d-flex align-items-center">
                  <span
                    style={{
                      marginRight: "10px",
                      fontSize: "1.2rem",
                      color: "#34495e",
                    }}
                  >
                    ₹
                  </span>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={amountPending}
                    max={order?.GrandTotal}
                    // onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    disabled
                    style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                  />
                </div>
              </Form.Group>
              {paymentData.status !== "Offline" && (
                // <Form.Group className="mb-3">
                //   <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                //     Payment Mode
                //   </Form.Label>
                //   <Form.Select
                //     name="mode"
                //     value={paymentData.mode}
                //     onChange={(e) => setPaymentData((prev) => ({ ...prev, mode: e.target.value }))}
                //     style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                //   >
                //     <option value="">Select Payment Mode</option>
                //     {/* <option value="Googlepay">Googlepay</option> */}
                //     {/* <option value="Phonepay">Phonepay</option> */}
                //     {/* <option value="Paytm">Paytm</option> */}
                //     <option value="UPI">UPI</option>
                //     <option value="Account">Account</option>
                //     <option value="Other">Other</option>
                //   </Form.Select>
                // </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                    Payment Mode
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="mode"
                    value={paymentData.mode}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, mode: e.target.value }))}
                    placeholder="Enter Payment Mode"
                    style={{
                      borderRadius: "6px",
                      borderColor: "#e0e0e0",
                    }}
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Comments
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="comments"
                  value={paymentData.comments}
                  onChange={(e) => setPaymentData((prev) => ({ ...prev, comments: e.target.value }))}
                  placeholder="Add any comments or remarks"
                  style={{
                    borderRadius: "6px",
                    borderColor: "#e0e0e0",
                    resize: "none",
                  }}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "none", padding: "0 20px 20px" }}>
            <Button
              style={{
                background: "linear-gradient(45deg, #27ae60, #2ecc71)",
                border: "none",
                borderRadius: "8px",
                padding: "6px 10px",
                fontWeight: "500",
                transition: "transform 0.2s",
                width: "100px",
              }}
              className="btn-sm"
              onClick={() => {
                // TODO: Implement payment submission logic here
                handleAddPayment();
              }}
              disabled={addPaymentLoading}
            >
              Add
            </Button>
            <Button
              style={{
                background: "linear-gradient(45deg, #2980b9, #3498db)",
                border: "none",
                borderRadius: "8px",
                padding: "6px 20px",
                fontWeight: "500",
                transition: "transform 0.2s",
              }}
              className="btn-sm"
              onClick={handleCloseGenerateModal}
              disabled={addPaymentLoading}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div >
  );
};

export default OrderDetails;
