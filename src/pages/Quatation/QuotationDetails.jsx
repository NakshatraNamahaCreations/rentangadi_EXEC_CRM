import React, { useState, useEffect } from "react";
import {
  Button,
  Col,
  Card,
  Container,
  Row,
  Form,
  Table,
  Modal,
  Spinner,
} from "react-bootstrap";
import logo from "../../assets/RentangadiLogo.jpg";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ApiURL, ImageApiURL } from "../../api";
import Select from "react-select";
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
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import { useLocation, useNavigate } from "react-router-dom";

const parseDate = (str) => {
  // console.log("parseDate str error: ", str)
  if (!str) return null; // If date is undefined or null, return null.
  const [day, month, year] = str.split("-"); // Assuming date format is DD-MM-YYYY
  return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for JavaScript Date
};

const formatDateToDDMMYYYY = (date) => {
  if (!date) return null; // If date is null or undefined, return null.
  if (!(date instanceof Date) || isNaN(date)) {
    console.log("formatDateToDDMMYYYY date:", date)
    return null;
  }
  const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if needed
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero if needed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`; // Return in dd-mm-yyyy format
};

const QuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    status: "Online",
    amount: 0,
    mode: "",
    comments: "",
    date: new Date().toLocaleDateString("en-GB").split("/").join("-"),
  });
  const [showAdd, setShowAdd] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [addProductId, setAddProductId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [selectedAddProduct, setSelectedAddProduct] = useState(null);
  const [getPayment, setGetPayment] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [productDates, setProductDates] = useState({});
  const [items, setItems] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [refurbishment, setRefurbishment] = useState(0);

  // const [grandTotal, setGrandTotal] = useState(0)

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

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const fetchQuotation = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${ApiURL}/quotations/getquotation/${id}`);
        console.log("getquotation/ quoteData: ", res.data.quoteData);
        // console.log("quoteData slots", res.data.quoteData.slots)
        setQuotation(res.data.quoteData);
      } catch (error) {
        setQuotation(null);
      }
      setLoading(false);
    };
    fetchQuotation();
  }, [id]);

  useEffect(() => {
    if (quotation) {
      console.log("quotain for isnide: ", quotation.slots[0].Products)
      if (quotation?.slots) {
        const initialProductDates = {};

        // Populate productDates for each product in each slot
        quotation.slots.forEach((slot) => {
          slot.Products.forEach((product) => {
            console.log("slots product:", product)
            console.log("formatDateToDDMMYYYY(product.productQuoteDate): ", formatDateToDDMMYYYY(product.productQuoteDate))
            // initialProductDates[product.productId] = {
            //   productQuoteDate: formatDateToDDMMYYYY(product.productQuoteDate), // Use slot's quoteDate
            //   productEndDate: formatDateToDDMMYYYY(product.productEndDate), // Use slot's endDate
            //   productSlot: product.productSlot, // Use slot's quoteTime
            // };
          });
        });

        // console.log("initialProductDates: ", initialProductDates)

        // setProductDates(initialProductDates);
      }

      const updatedItems =
        quotation?.slots && Array.isArray(quotation.slots)
          ? quotation.slots.flatMap((slot) =>
            (slot.Products || []).map((prod) => {
              let days = 1;
              const quoteDate = prod.productQuoteDate || slot.quoteDate;
              const endDate = prod.productEndDate || slot.endDate;

              if (quoteDate && endDate) {
                const start = quoteDate instanceof Date ? quoteDate : parseDate(quoteDate);
                const end = endDate instanceof Date ? endDate : parseDate(endDate);
                days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (isNaN(days) || days < 1) days = 1;
              }

              return {
                sNo: prod.sNo || "",
                productId: prod.productId,
                productName: prod.productName || "",
                image: prod.ProductIcon,
                units: prod.quantity || prod.qty,
                days,
                pricePerUnit: Number(prod.price) || 0,
                amount: Number(prod.total) || 0,
                available: prod.availableStock > 0 ? prod.availableStock : 0,
                quoteDate,
                endDate,
                quantity: prod.quantity || prod.qty,
                total: prod.total,
                productSlot: quotation?.quoteTime
              };
            })
          )
          : [];

      console.log("setting items again: ")
      setItems(updatedItems);

    }
  }, [quotation]);

  const handleShowGenerateModal = () => setShowGenerateModal(true);
  const handleCloseGenerateModal = () => setShowGenerateModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (status) => {
    setPaymentData((prev) => ({ ...prev, status }));
  };

  const handleAddPayment = async () => {
    try {
      // First, make the API call to fetch payment data
      const orderDetails = {
        quotationId: quotation?._id,
        totalAmount: quotation.finalTotal || quotation?.GrandTotal,
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
        // await handleUpdateQuotation();
        await handleGenerateOrder()
        setGetPayment(response.data);
      }
      console.log("payment details: ", orderDetails);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      // Optionally handle any errors that occur during the API request
    } finally {
      handleCloseGenerateModal();
    }
  };

  const handleUpdateQuotation = async () => {
    try {
      // Flatten all products from all slots for the Products array
      const allProducts = quotation?.slots
        ? quotation.slots.flatMap((slot) =>
          (slot.Products || []).map((product) => ({
            productId: product.productId,
            productName: product.productName,
            qty: product.qty || product.quantity,
            price: product.price,
            quantity: product.quantity || product.qty,
            total: product.total,
            StockAvailable: product.availableStock, // if needed by backend
          }))
        )
        : [];

      // Prepare the updated quotation details
      const updatedQuotationDetails = {
        enquiryObjectId: quotation._id, // Add this if your backend expects it
        enquiryId: quotation.enquiryId,
        GrandTotal: grandTotal, // updated GrandTotal
        status: quotation?.status,
        Products: allProducts, // Flat array for backend update logic
        slots:
          quotation?.slots?.map((slot) => ({
            slotName: slot.slotName,
            quoteDate: slot.quoteDate,
            endDate: slot.endDate,
            Products:
              slot.Products?.map((product) => ({
                productId: product.productId,
                productName: product.productName,
                qty: product.qty || product.quantity,
                price: product.price,
                quantity: product.quantity || product.qty,
                total: product.total,
                StockAvailable: product.availableStock, // if needed
              })) || [],
          })) || [],
      };

      console.log("Updated Quotation details: ", updatedQuotationDetails);

      // Make the API call to update the quotation
      const response = await axios.put(
        `${ApiURL}/quotations/updateQuotationOnOrder/${quotation._id}`,
        updatedQuotationDetails
      );

      if (response.status === 200) {
        console.log("Quotation updated successfully:", response.data.response);
        await handleGenerateOrder();
        // await handleAddPayment()
        // Optionally, update the state or show a success message
      } else {
        console.error(
          "Failed to update the quotation. Response status:",
          response.status
        );
      }
    } catch (error) {
      // Handle errors during the API call
      console.error(
        "Error updating quotation:",
        error?.response?.data?.error || error.message
      );
    } finally {
      handleCloseGenerateModal();
    }
  };

  const handleGenerateOrder = async () => {
    try {
      // Prepare the order details from quotationDetails
      const orderDetails = {
        quoteId: quotation.quoteId,
        userId: quotation.userId,
        clientId: quotation.clientId,
        executiveId: quotation?.executiveId,
        clientNo: quotation?.clientNo,
        GrandTotal: quotation.finalTotal || grandTotal,
        refurbishmentAmount: quotation?.refurbishment || 0,
        paymentStatus: quotation?.paymentStatus,
        clientName: quotation?.clientName,
        executivename: quotation?.executivename,
        Address: quotation?.address,
        labourecharge: quotation?.labourecharge,
        transportcharge: quotation?.transportcharge,
        GST: quotation?.GST,
        discount: quotation?.discount,
        placeaddress: quotation?.placeaddress,
        adjustments: quotation?.adjustments,
        products:
          quotation?.slots?.map((slot) => ({
            products: slot.Products?.map((product) => ({
              productId: product.productId,
              productName: product.productName,
              quantity: product.quantity || product.qty,
              total: product.total,
            })),
          })) || [], // Default to empty array if no slots found
        slots:
          quotation?.slots?.map((slot) => ({
            slotName: slot.slotName,
            quoteDate: slot.quoteDate,
            endDate: slot.endDate,
            // products: slot.Products?.map((product) => ({
            //   productId: product.productId,
            //   productName: product.productName,
            //   quantity: product.quantity || product.qty,
            //   total: product.total,

            // })),

            // items
            // products: items?.map((product) => {
            //   console.log("productData: ", productDates)
            //   const productData = productDates[product.productId]; // Find corresponding data from x
            //   console.log("product.productId: ", product.productId, "productData: ", productData, "format quote: ", productData?.productQuoteDate)

            //   return {
            //     productId: product.productId,
            //     productName: product.productName,
            //     quantity: product.quantity || product.qty,
            //     total: product.total,
            //     // Inject additional product data if found in x
            //     productQuoteDate: formatDateToDDMMYYYY(productData?.productQuoteDate) || quotation.quoteDate,
            //     productEndDate: formatDateToDDMMYYYY(productData?.productEndDate) || quotation.endDate,
            //     productSlot: productData?.productSlot || quotation.quoteTime,
            //   };
            // }),

            products: slot.Products?.map((product) => {
              console.log("productData: ", productDates)
              const productData = productDates[product.productId]; // Find corresponding data from x
              console.log("product.productId: ", product.productId, "productData: ", productData, "format quote: ", productData?.productQuoteDate)

              return {
                productId: product.productId,
                productName: product.productName,
                quantity: product.quantity || product.qty,
                total: product.total,
                // Inject additional product data if found in x
                productQuoteDate: formatDateToDDMMYYYY(productData?.productQuoteDate) || quotation.quoteDate,
                productEndDate: formatDateToDDMMYYYY(productData?.productEndDate) || quotation.endDate,
                productSlot: productData?.productSlot || quotation.quoteTime,
              };
            }),

          })) || [], // Default to empty array if no slots found
      };

      // console.log("orderdetails config: ", orderDetails);
      // console.log("orderdetails config enough: ", orderDetails.slots[0].products[0]);
      console.log("orderdetails config enough: ", orderDetails.slots[0].products);
      console.log("product: ", productDates)
      console.log("items: ", items)

      // Make the API call to create the order
      const response = await axios.post(
        `${ApiURL}/order/postaddorder`,
        orderDetails
      );

      // Check if the response is successful
      if (response.status === 201) {
        toast.success("Order created successfully");
        window.location.reload()
        console.log("Order created successfully:", response.data.response);
        // Optionally, update the state or show a success message
        // Example: setOrderDetails(response.data);
      }
    } catch (error) {
      toast.error("error creating order")
      // Handle errors during the API call
      console.error("Error creating order:", error);
    } finally {
      handleCloseGenerateModal();
    }
  };

  // console.log("selectedAddProduct: ", selectedAddProduct)
  // console.log("quotation: ", quotation)

  const handleDateChange = (productId, dateType, date, productSlot) => {
    // Update the productDates state with the new date and slot value
    setProductDates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [dateType]: date,
        productSlot: productSlot,
      },
    }));
  };

  // // Helper: flatten slots/products for table
  // const items =
  //   quotation?.slots && Array.isArray(quotation.slots)
  //     ? quotation.slots.flatMap((slot) =>
  //       (slot.Products || []).map((prod) => {
  //         let days = 1;
  //         // const quoteDate = prod.quoteDate || slot.quoteDate;
  //         // const endDate = prod.endDate || slot.endDate;
  //         const quoteDate = prod.productQuoteDate || slot.quoteDate;
  //         const endDate = prod.productEndDate || slot.endDate;
  //         // console.log("prod total", prod.total)

  //         if (quoteDate && endDate) {
  //           const start = quoteDate instanceof Date ? quoteDate : parseDate(quoteDate);
  //           const end = endDate instanceof Date ? endDate : parseDate(endDate);
  //           days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  //           if (isNaN(days) || days < 1) days = 1;
  //         }

  //         return {
  //           sNo: prod.sNo || "",
  //           productId: prod.productId,
  //           productName: prod.productName || "",
  //           image: prod.ProductIcon,
  //           units: prod.quantity || prod.qty,
  //           days,
  //           pricePerUnit: Number(prod.price) || 0,
  //           amount: Number(prod.total) || 0,
  //           available: prod.availableStock > 0 ? prod.availableStock : 0,
  //           quoteDate,
  //           endDate,
  //         };
  //       })
  //     )
  //     : []; // Return an empty array if no valid quotation or slots

  console.log("items", items)
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

  const addedProductIds = quotation?.slots
    ? quotation.slots.flatMap((slot) =>
      (slot.Products || []).map((p) => String(p.productId || p._id))
    )
    : [];

  const availableToAdd = allProducts.filter(
    (p) => !addedProductIds.includes(String(p._id))
  );

  const handleAddProduct = async () => {
    if (!selectedAddProduct || !addQty) return;

    // Prepare new product object
    const newProduct = {
      productId: selectedAddProduct._id,
      productName: selectedAddProduct.ProductName,
      qty: addQty,
      price: Number(selectedAddProduct.ProductPrice),
      total: addQty * Number(selectedAddProduct.ProductPrice),
      ProductIcon: selectedAddProduct.ProductIcon,
      availableStock: selectedAddProduct.availableStock,
    };

    // Add to first slot (or create slot if none)
    const updatedSlots = quotation.slots && quotation.slots.length > 0
      ? quotation.slots.map((slot, idx) =>
        idx === 0
          ? { ...slot, Products: [...(slot.Products || []), newProduct] }
          : slot
      )
      : [{
        slotName: "Default Slot",
        Products: [newProduct],
        quoteDate: quotation.quoteDate,
        endDate: quotation.endDate,
      }];

    // try {
    //   // Update on backend
    //   const res = await axios.put(`${ApiURL}/quotations/updateProducts/${quotation._id}`, {
    //     slots: updatedSlots,
    //   });
    //   if (res.status === 200) {
    setQuotation({ ...quotation, slots: updatedSlots });
    setShowAdd(false)
    //     handleCloseAdd();
    //   }
    // } catch (err) {
    //   alert("Failed to add product");
    // }
  };

  const handleProductSelect = async (selected) => {
    if (selected) {
      const productId = selected.value;
      setAddProductId(productId);
      setAddQty(1);

      const productObj = allProducts.find(p => String(p._id) === String(productId));
      console.log("items: ", items)

      try {
        const res = await axios.post(
          `${ApiURL}/inventory/product/filter/${productId}`,
          {},
          {
            params: {
              startDate: items[0].quoteDate,
              endDate: items[0].endDate,
              productId,
            },
          }
        );

        console.log("inventory/product/filter res.data: ", res.data)

        if (res.data?.availableStock) {
          console.log("res.data?.avaiableStock")
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

  // Calculate subtotal from all items
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Use values from quotation or 0 if not present
  const discount = Number(quotation?.discount || 0);
  const transport = Number(quotation?.transportcharge || 0);
  const manpower = Number(quotation?.labourecharge || 0);
  // const roundOff = Number(quotation?.adjustments || quotation?.roundOff || 0);
  const gst = Number(quotation?.GST || 0);

  // Add transport and manpower
  const afterCharges = subtotal + transport + manpower;

  // Calculate after discount
  const discountAmt = afterCharges * (discount / 100);
  const afterDiscount = afterCharges - discountAmt;

  // GST calculation (if GST is a percentage)
  const gstAmt = afterDiscount * (gst / 100);

  // Grand total
  const grandTotal = Math.round(afterDiscount + gstAmt);

  const handleEdit = (idx, qty) => {
    setEditIdx(idx);
    setEditQty(qty);
  };

  // Save the new qty (with API call)
  const handleEditSave = async (item) => {
    if (editQty < 1 || editQty > item.available) {
      toast.error("Quantity must be between 1 and less than available stock!");
      return;
    }

    const productDateDetails = productDates[item.productId] || {};

    // Update the quantity in the correct slot/product in local state
    const updatedSlots = quotation.slots.map((slot) => ({
      ...slot,
      Products: (slot.Products || []).map((prod) =>
        prod.productId === item.productId
          ? {
            ...prod,
            qty: editQty,
            quantity: editQty,
            total: editQty * (prod.price || item.pricePerUnit),
            productQuoteDate: formatDateToDDMMYYYY(productDateDetails.productQuoteDate),
            productEndDate: formatDateToDDMMYYYY(productDateDetails.productEndDate),
            productSlot: productDateDetails.productSlot,
          }
          : prod
      ),
    }));

    const updatedItems = items.map((currentItem) => {
      // Check if the current item is the one being edited
      if (currentItem.productId === item.productId) {
        return {
          ...currentItem,
          quantity: editQty, // Update the quantity
          total: editQty * currentItem.pricePerUnit, // Recalculate the total
          productQuoteDate: formatDateToDDMMYYYY(productDateDetails.productQuoteDate),
          productEndDate: formatDateToDDMMYYYY(productDateDetails.productEndDate),
          productSlot: productDateDetails.productSlot,
        };
      }
      // If the item is not the one being edited, return it unchanged
      return currentItem;
    });

    // Update the state with the new `updatedItems` array
    setItems(updatedItems);


    console.log("updatedSlots: ", updatedSlots)
    setQuotation({ ...quotation, slots: updatedSlots });
    setEditIdx(null);
    setEditQty(1);
  };

  // Delete a product (with API call)
  const handleDelete = async (item) => {
    if (!window.confirm("Delete this product?")) return;


    const updatedItems = items.filter((i) => i.productId !== item.productId);

    quotation.slots.forEach((slot) => {
      // Use filter to remove the product by productId
      slot.Products = slot.Products.filter((prod) => prod.productId !== item.productId);
    });

    console.log("quotation.slots: ", quotation?.slots[0].Products)
    console.log("items: ", items)

    // Update the state with the filtered list
    setItems(updatedItems);

  };
  console.log("**outside quotation.slots: ", quotation?.slots[0].Products)

  const handleCancelQuotation = async () => {
    console.log("quotation: ", quotation);
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this quotation?"
    );
    if (!confirmCancel) return; // User clicked "Cancel"

    try {
      const response = await axios.post(
        `${ApiURL}/quotations/cancel/${quotation._id}`
      );
      console.log("Quotation cancelled:", response.data);

      // Optionally update your UI or show a message
      toast.success("Quotation successfully cancelled.");
      if (response.status === 200) {
        setQuotation({ ...quotation, status: "cancelled" });
      }
    } catch (error) {
      console.error("Error cancelling quotation:", error);
      alert("Something went wrong while cancelling the quotation.");
    }
  };

  const handleDownloadPDF0 = () => {
    const doc = new jsPDF();

    const {
      quoteId,
      quoteDate,
      endDate,
      clientName,
      clientNo,
      executivename,
      placeaddress,
      address,
      status,
      slots = [],
      discount,
      transportcharge,
      labourecharge,
      GrandTotal,
      adjustments,
      GST,
    } = quotation;

    const slot = slots[0];
    const products = slot?.Products || [];

    const parseDate = (str) => {
      const [day, month, year] = str.split("-");
      return new Date(`${year}-${month}-${day}`);
    };

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("NNC Event Rentals", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Quotation", 105, 28, { align: "center" });

    // === INFO TABLE ===
    doc.setFontSize(11);
    const info = [
      ["Company Name", clientName],
      ["Contact Number", clientNo],
      ["Executive Name", executivename],
      ["Venue", placeaddress],
      ["Delivery Date", quoteDate],
      ["End Date", endDate],
      ["Address", address],
      ["Status", status],
    ];

    autoTable(doc, {
      startY: 36,
      head: [],
      body: info,
      theme: "plain",
      styles: { fontSize: 11 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
        1: { cellWidth: 120 },
      },
      tableLineWidth: 0,
    });

    // === PRODUCT TABLE ===
    const productRows = products.map((p) => {
      // const days =
      //   quoteDate && endDate
      //     ? (parseDate(endDate) - parseDate(quoteDate)) /
      //     (1000 * 60 * 60 * 24) +
      //     1
      //     : 1;
      const start = quoteDate instanceof Date ? quoteDate : parseDate(quoteDate);
      const end = endDate instanceof Date ? endDate : parseDate(endDate);
      let days = 1;
      days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (isNaN(days) || days < 1) days = 1;


      return [
        quoteDate,
        p.productName,
        "element",
        p.availableStock,
        p.quantity,
        days,
        `${Number(p.price).toLocaleString("en-IN")}`,
        `${Number(p.total).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 5,
      head: [
        [
          "Slot Date",
          "Product",
          "Image",
          "Available",
          "Qty",
          "Days",
          "Price/Qty",
          "Total",
        ],
      ],
      body: productRows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [50, 100, 200] },
    });

    // === COST SUMMARY ===
    const summary = [
      // ["Discount (%)", `${(discount || 0).toFixed(2)}`],
      ...(discount && discount !== 0
        ? [
          [`Discount (${discount}%)`, `${(quotation?.discountAmt || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}`,],
        ]
        : []),
      [
        "Transportation",
        `${Number(transportcharge || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
      ],
      [
        "Manpower Charge",
        `${Number(labourecharge || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
      ],

      // [
      //   "Round Off",
      //   `Rs. ${Number(adjustments || 0).toLocaleString("en-IN", {
      //     minimumFractionDigits: 2,
      //   })}`,
      // ],
      ["GST (%)", `${(quotation?.gstAmt || 0).toFixed(2)}`],
      [
        "Grand Total",
        `${Number(GrandTotal || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}`,
      ],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      body: summary,
      theme: "grid",
      styles: { fontSize: 11, halign: "right" },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold" },
        1: { fontStyle: "normal" },
      },
      tableLineColor: 230,
      tableLineWidth: 0.3,
    });

    doc.save(`${quoteId || "quotation"}.pdf`);
  };

  const handleDownloadPDFWorking = async () => {
    const doc = new jsPDF();

    const imageURL = 'https://api.rentangadi.in/product/1750839736747_Retro 1 seater.png'; // Image URL

    // Add the image to the PDF using URL
    doc.addImage(imageURL, 'PNG', 10, 10, 50, 50); // 50x50 px image size at position (10, 10)

    // Sample product data (just an example)
    const productRows = [
      ['Product 1', 'Retro 1 Seater', imageURL],
    ];

    // Add product table with image in the second column
    autoTable(doc, {
      startY: 60,
      head: [['Product', 'Name', 'Image']],
      body: productRows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [50, 100, 200] },
    });

    // Save PDF
    doc.save('quotation.pdf');
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const imageURL = 'https://api.rentangadi.in/product/1750839736747_Retro 1 seater.png'; // Image URL

    // Helper function to get image as Base64
    const getImageBase64 = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }

        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result;
            if (!base64String || !base64String.startsWith('data:image')) {
              reject('Invalid Base64 string');
            }
            resolve(base64String);
          };
          reader.onerror = (error) => reject('Error converting image to Base64: ' + error);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(error);
        return null;
      }
    };

    // Fetch the Base64 image before generating the PDF
    const imageBase64 = await getImageBase64(imageURL);

    // Add Header
    doc.setFontSize(18);
    doc.text("NNC Event Rentals", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("Quotation", 105, 28, { align: "center" });

    // === PRODUCT TABLE ===
    const productRows = [
      [
        "Retro 1 Seater",  // Example product name
        "Retro 1 Seater",  // Name
        imageBase64 || "",  // Base64 image string or empty
      ]
    ];

    // Add product table with image
    autoTable(doc, {
      startY: 60,
      head: [['Product', 'Name', 'Image']],
      body: productRows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [50, 100, 200] },
      didDrawCell: function (data) {
        // If the cell is the Image column, draw the image
        if (data.column.index === 2 && typeof data.cell.raw === "string" && data.cell.raw.startsWith("data:image")) {
          // Adding image directly into the PDF
          doc.addImage(data.cell.raw, 'PNG', data.cell.x + 2, data.cell.y + 2, 50, 50);  // Position and size of the image
          data.cell.text = [""]; // Clear the text in the cell
        }
      }
    });

    // Save PDF
    doc.save('quotation.pdf');
  };

  const getImageBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          // Check if the result is a valid Base64 string
          const base64String = reader.result;
          if (!base64String || !base64String.startsWith('data:image')) {
            reject('Invalid Base64 string');
          }
          resolve(base64String);
        };
        reader.onerror = (error) => reject('Error reading image: ' + error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Image fetch failed:", error);
      return null; // Return null if there's an error fetching or converting the image
    }
  };

  const deliveryDismantleSlots = [
    "Select Slots",
    "Slot 1: 7:00 AM to 11:00 PM",
    "Slot 2: 11:00 PM to 11:45 PM",
    "Slot 3: 7:30 AM to 4:00 PM",
  ];

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!quotation) {
    return (
      <Container className="my-5 text-center">
        <h4>Quotation not found.</h4>
      </Container>
    );
  }

  return (
    <Container className="my-5" style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* Header with Logo and Title */}
      <div className="d-flex align-items-center mb-4">
        <img
          src={logo}
          alt="Company Logo"
          style={{ height: "50px", marginRight: "20px" }}
        />
        <div>
          <h2 className="mb-0" style={{ color: "#2c3e50", fontWeight: "600" }}>
            Quotation
          </h2>
          {/* <p className="text-muted mb-0">NNC Event Rentals</p> */}
        </div>
        <Button
          variant="primary"
          className="ms-auto"
          style={{
            background: "linear-gradient(45deg, #3498db, #2980b9)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontWeight: "500",
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          // onClick={handleDownloadPDF}
          onClick={() => navigate(`/quotation/invoice/${quotation._id}`, { state: { quotation, items, productDates } })}
        >
          Download as PDF
        </Button>
      </div>

      {/* Company and Event Details */}
      <Card
        className="mb-4 shadow-sm"
        style={{ border: "none", borderRadius: "12px" }}
      >
        <Card.Body className="p-4">
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td
                  style={{ width: "25%", fontWeight: "500", color: "#34495e" }}
                >
                  Company Name
                </td>
                <td style={{ width: "25%" }}>
                  {(quotation.clientName || "").toUpperCase()}
                </td>
                <td
                  style={{ width: "25%", fontWeight: "500", color: "#34495e" }}
                >
                  Contact Number
                </td>
                <td style={{ width: "25%" }}>{quotation.clientNo || ""}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "500", color: "#34495e" }}>
                  Executive Name
                </td>
                <td>{quotation.executivename || ""}</td>
                {/* <td style={{ fontWeight: "500", color: "#34495e" }}>Venue</td>
                <td>{quotation.placeaddress || ""}</td> */}
                <td style={{ fontWeight: "500", color: "#34495e" }}>Address</td>
                <td>{quotation.address || ""}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "500", color: "#34495e" }}>
                  Delivery Date
                </td>
                <td>{quotation.quoteDate || ""}</td>
                <td style={{ fontWeight: "500", color: "#34495e" }}>
                  End Date
                </td>
                <td>{quotation.endDate || ""}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "500", color: "#34495e" }}>
                  Incharge Name
                </td>
                <td>{quotation.inchargeName || ""}</td>
                <td style={{ fontWeight: "500", color: "#34495e" }}>
                  Incharge phone
                </td>
                <td>{quotation.inchargePhone || ""}</td>
              </tr>
              <tr>
                {/* <td style={{ fontWeight: "500", color: "#34495e" }}>Address</td>
                <td>{quotation.address || ""}</td> */}
                <td style={{ fontWeight: "500", color: "#34495e" }}>Status</td>
                <td>
                  {quotation.status ? (
                    <span
                      className={`badge ${quotation.status === "cancelled"
                        ? "bg-danger"
                        : "bg-secondary"
                        }`}
                    >
                      {quotation.status}
                    </span>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Items Table */}
      <Card
        className="mb-4 shadow-sm"
        style={{ border: "none", borderRadius: "12px" }}
      >
        <Card.Body className="">
          <Table
            bordered
            size="sm"
            style={{ borderColor: "#e0e0e0" }}
            className="mb-0"
          >
            <thead
              style={{
                background: "linear-gradient(45deg, #34495e, #2c3e50)",
                color: "#fff",
              }}
            >
              <tr>
                <th>Product</th>
                <th>Slot Date</th>
                <th>Image</th>
                <th>Available</th>
                <th>Qty</th>
                <th>Days</th>
                <th>Price/Qty</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                // const days =
                //   parseDate(item.endDate) && parseDate(item.quoteDate)
                //     ? Math.floor(
                //       (parseDate(item.endDate) - parseDate(item.quoteDate)) /
                //       (1000 * 60 * 60 * 24)
                //     ) + 1
                //     : 1;
                let days = 1;
                const start = item.quoteDate instanceof Date ? item.quoteDate : parseDate(item.quoteDate);
                const end = item.endDate instanceof Date ? item.endDate : parseDate(item.endDate);
                days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                if (isNaN(days) || days < 1) days = 1;

                // const qty = item.quantity || 0;
                const price = item.pricePerUnit || 0;
                item.days = days;
                quotation.allProductsTotal =
                  items
                    .reduce((sum, item) => sum + (item.amount * item?.days || 0), 0)
                console.log("quotation.allProductsTotal: ", quotation.allProductsTotal)

                // quotation.discount = 0

                quotation.discountAmt = quotation?.allProductsTotal * (quotation?.discount / 100)
                quotation.afterDiscount = quotation?.allProductsTotal - quotation.discountAmt
                quotation.totalWithCharges = quotation?.afterDiscount + quotation.transportcharge + quotation.labourecharge
                quotation.refurbishment && (quotation.totalWithCharges += quotation?.refurbishment)

                quotation.gstAmt = quotation.totalWithCharges * (quotation?.GST / 100);  // Assuming GST is in percentage (e.g., 18 for 18%)
                quotation.finalTotal = quotation.totalWithCharges + quotation?.gstAmt;  // Add GST to the total after discount


                return (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                      }}
                    >
                      {item.productName}
                    </td>
                    <td style={{ verticalAlign: "middle", width: "25%" }}>
                      <div className="d-flex">

                        {editIdx === idx ? (
                          <DatePicker
                            selected={
                              productDates[item.productId]?.productQuoteDate ||
                              parseDate(quotation?.slots[0]?.quoteDate)
                            } // Default to initial quoteDate
                            onChange={(date) =>
                              handleDateChange(
                                item.productId,
                                "productQuoteDate",
                                date,
                                item.productSlot || quotation?.slots[0]?.quoteTime
                              )
                            }
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            minDate={parseDate(quotation?.slots[0]?.quoteDate)} // Ensure date is within range
                            maxDate={parseDate(quotation?.slots[0]?.endDate)} // Ensure date is within range
                          />
                        ) : (
                          quotation && (
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#444",
                                marginRight: "10px"
                              }}
                            >
                              {/* Check if the product date exists, else fallback to quote date */}
                              {productDates[item.productId]?.productQuoteDate
                                ? formatDateToDDMMYYYY(productDates[item.productId]?.productQuoteDate)
                                : (quotation?.slots[0]?.quoteDate) || "No date available"}
                              {"    "}
                              <span style={{ paddingLeft: "10px" }}>To</span>
                            </span>
                          )
                        )}

                        <br />

                        {editIdx === idx ? (
                          <DatePicker
                            selected={
                              productDates[item.productId]?.productEndDate ||
                              parseDate(quotation?.slots[0]?.endDate)
                            } // Default to initial endDate
                            onChange={(date) =>
                              handleDateChange(
                                item.productId,
                                "productEndDate",
                                date,
                                item.productSlot || quotation?.slots[0]?.quoteTime
                              )
                            }
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            minDate={
                              productDates[item.productId]?.productQuoteDate ||
                              parseDate(quotation?.slots[0]?.quoteDate)
                            } // Ensure date is within range
                            maxDate={parseDate(quotation?.slots[0]?.endDate)} // Ensure date is within range
                          />
                        ) : (
                          quotation && (
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#444",
                              }}
                            >
                              {productDates[item.productId]?.productEndDate
                                ? formatDateToDDMMYYYY(productDates[item.productId]?.productEndDate)
                                : (quotation?.slots[0]?.endDate) || "No date available"}
                            </span>
                          )
                        )}

                      </div>

                      {/* Slot selection */}
                      <Form.Select
                        className="m-0 mt-1"
                        value={
                          productDates[item.productId]?.productSlot ||
                          quotation?.quoteTime
                        }
                        onChange={(e) =>
                          handleDateChange(
                            item.productId,
                            "productSlot",
                            e.target.value,
                            e.target.value
                          )
                        }
                        disabled={editIdx !== idx}
                      >
                        {deliveryDismantleSlots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Form.Select>
                    </td>

                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      <img
                        src={
                          item.image
                            ? `https://api.rentangadi.in/product/${item.image}`
                            : "https://cdn-icons-png.flaticon.com/512/1532/1532801.png"
                        }
                        alt="element"
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "contain",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      {item.available}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      {editIdx === idx ? (
                        <Form.Control
                          type="number"
                          min={1}
                          max={item.available}
                          value={editQty}
                          onChange={(e) => {
                            let val = e.target.value.replace(/^0+/, "");
                            setEditQty(
                              val === ""
                                ? ""
                                : Math.max(
                                  1,
                                  Math.min(Number(val), item.available)
                                )
                            );
                          }}
                          style={{
                            width: 70,
                            padding: "2px 6px",
                            fontSize: 13,
                          }}
                          autoFocus
                          disabled={loading}
                        />
                      ) : (
                        item.units
                      )}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      {days}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      ₹{price}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      ₹{item.amount * days}
                      {/* {total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })} */}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "middle" }}>
                      {editIdx === idx ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            style={{ padding: "2px 6px", marginRight: 4 }}
                            onClick={() => handleEditSave(item)}
                            disabled={
                              loading || quotation.status === "cancelled"
                            }
                          >
                            <FaCheck />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            style={{ padding: "2px 6px" }}
                            onClick={() => setEditIdx(null)}
                            disabled={
                              loading || quotation.status === "cancelled"
                            }
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
                            onClick={() => handleEdit(idx, item.units)}
                            disabled={
                              loading || quotation.status === "cancelled" || quotation.status === "send"
                            }
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            style={{ color: "#d00", padding: 0, marginLeft: 8 }}
                            onClick={() => handleDelete(item)}
                            disabled={
                              loading || quotation.status === "cancelled" || quotation.status === "send"
                            }
                          >
                            <FaTrashAlt />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Cost Summary */}
      <Card
        className="mb-4 shadow-sm"
        style={{ border: "none", borderRadius: "12px" }}
      >
        <Card.Body className="p-4">
          <h5
            style={{
              fontWeight: "600",
              color: "#2c3e50",
              marginBottom: "20px",
            }}
          >
            Cost Summary
          </h5>
          {/* <div className="d-flex justify-content-between mb-2">
            <span style={{ fontWeight: "600" }}>Products Total:</span>
            <span style={{ fontWeight: "600" }}>
              ₹
              {items
                .reduce((sum, item) => sum + (item.amount * item?.days || 0), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div> */}
          {/* {quotation?.discount != 0 && <div className="d-flex justify-content-between mb-2">
            <span>Discount ({(quotation.discount || 0).toFixed(2)}%):</span>
            <span>{(quotation.discount || 0).toFixed(2)}</span>
          </div>} */}
          <div className="d-flex justify-content-between mb-2" style={{ fontWeight: "600" }}>
            <span>{quotation?.discount != 0 ? "Total amount before discount:" : "Total amount:"}</span>
            <span>₹{(quotation.allProductsTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {quotation?.discount != 0 && <div className="d-flex justify-content-between mb-2">
            <span>Discount ({(quotation.discount || 0).toFixed(2)}%):</span>
            <span>-₹{(quotation.discount / 100 * quotation.allProductsTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>}
          {quotation?.discount != 0 && <div className="d-flex justify-content-between mb-2" style={{ fontWeight: "600" }}>
            <span>Total amount after discount:</span>
            <span>₹{(quotation.afterDiscount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>}
          <div className="d-flex justify-content-between mb-2">
            <span>Transportation:</span>
            <span>₹{(quotation.transportcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Manpower Charge:</span>
            <span>₹{(quotation.labourecharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Refurbishment:</span>
            {/* {!editMode ? (
              <>
                <div className="d-flex align-items-center">
                <Button variant="link" size="sm" onClick={() => setEditMode(true)}>
                    <FaEdit />
                  </Button>
                  <span className="me-2">
                    ₹{(quotation.refurbishment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Form.Group controlId="refurbishment" style={{ width: "150px" }}>
                  <Form.Control
                    type="number"
                    value={quotation.refurbishment || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setQuotation({ ...quotation, refurbishment: value });
                      // Update total calculations
                      quotation.refurbishment = value;
                      quotation.totalWithCharges = quotation?.afterDiscount + quotation.transportcharge + quotation.labourecharge + quotation.refurbishment;
                      quotation.gstAmt = quotation.totalWithCharges * (quotation?.GST / 100);
                      quotation.finalTotal = quotation.totalWithCharges + quotation?.gstAmt;
                    }}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
                <Button variant="primary" size="sm" className="ms-2" onClick={() => setEditMode(false)}>
                  Save
                </Button>
                <Button variant="secondary" size="sm" className="ms-2" onClick={() => {
                  // Reset to original value
                  setQuotation(prev => ({ ...prev, refurbishment: prev.refurbishment }));
                  setEditMode(false);
                }}>
                  Cancel
                </Button>
              </>
            )} */}
            {!editMode ? (
              <>
                <div className="d-flex align-items-center">
                  <Button variant="link" size="sm" onClick={() => setEditMode(true)}>
                    <FaEdit />
                  </Button>
                  <span className="">
                    ₹{(quotation.refurbishment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center">
                  <Form.Group controlId="refurbishment" style={{ width: "150px" }}>
                    <Form.Control
                      type="number"
                      value={refurbishment}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setRefurbishment(value)
                        // setQuotation({ ...quotation, refurbishment: value });
                        // Update total calculations
                        // quotation.refurbishment = value;
                      }}
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                  <Button variant="primary" size="sm" className="ms-2" onClick={() => {
                    setQuotation({ ...quotation, refurbishment: refurbishment });
                    setEditMode(false)
                  }}>
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" className="ms-2" onClick={() => {
                    // Reset to original value
                    setQuotation(prev => ({ ...prev, refurbishment: prev.refurbishment }));
                    setEditMode(false);
                    setRefurbishment(0)
                  }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}

          </div>
          {/* <div className="d-flex justify-content-between mb-2">
            <span>Round Off:</span>
            <span>
              ₹{(quotation.adjustments || quotation.roundOff || 0).toFixed(2)}
            </span>
          </div> */}
          {quotation?.GST != 0 && <div className="d-flex justify-content-between mb-2">
            <span>GST ({(quotation?.GST || 0).toFixed(2)}%):</span>
            <span>₹{(quotation?.gstAmt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>}
          <hr style={{ borderColor: "#e0e0e0" }} />
          <div
            className="d-flex justify-content-between"
            style={{ fontSize: "18px", fontWeight: "700", color: "#34495e" }}
          >
            <span>Grand Total:</span>
            {/* <span>
              ₹
              {(quotation.GrandTotal || quotation.grandTotal || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span> */}
            <span>
              ₹{(quotation?.finalTotal ?? 0)
                .toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Notes */}
      {quotation.termsandCondition &&
        quotation.termsandCondition.length > 0 && (
          <Card
            className="mb-4 shadow-sm"
            style={{ border: "none", borderRadius: "12px" }}
          >
            <Card.Body className="p-4">
              <h5
                style={{
                  fontWeight: "600",
                  color: "#2c3e50",
                  marginBottom: "15px",
                }}
              >
                Terms and Notes
              </h5>
              <ul
                style={{
                  paddingLeft: "20px",
                  color: "#333",
                  lineHeight: "1.6",
                }}
              >
                {quotation.termsandCondition.map((note, idx) => (
                  <li key={idx} style={{ marginBottom: "10px" }}>
                    {note}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        )}

      {/* Action Buttons */}
      <Card
        className="mb-4 shadow-sm"
        style={{ border: "none", borderRadius: "12px" }}
      >
        <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <Button
            variant="primary"
            style={{
              background: "linear-gradient(45deg, #2980b9, #3498db)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: "500",
              transition: "transform 0.2s",
            }}
            disabled={quotation.status === "cancelled" || quotation.status === "send"}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleShowGenerateModal}
          >
            Generate Order
          </Button>

          <Button
            variant="info"
            style={{
              background: "linear-gradient(45deg, #27ae60, #2ecc71)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: "500",
              transition: "transform 0.2s",
              color: "white",
            }}
            disabled={quotation.status === "cancelled" || quotation.status === "send"}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleShowAdd}
          >
            Add Product
          </Button>

          <Button
            variant="danger"
            style={{
              background: "linear-gradient(45deg, #c0392b, #e74c3c)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: "500",
              transition: "transform 0.2s",
            }}
            disabled={quotation.status === "cancelled" || quotation.status === "send"}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleCancelQuotation}
          >
            Cancel Quotation
          </Button>
        </Card.Body>
      </Card>

      {/* Add Payment Modal */}
      <Modal
        show={showGenerateModal}
        onHide={handleCloseGenerateModal}
        centered
      >
        <Modal.Header style={{ borderBottom: "none", padding: "20px 20px 0" }}>
          <Modal.Title style={{ fontWeight: "600", color: "#2c3e50" }}>
            Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          <Form>
            {/* Payment Status */}
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
                  onChange={() => handleCheckboxChange("Offline")}
                  style={{ marginRight: "20px" }}
                />
                <Form.Check
                  inline
                  label="Online"
                  type="checkbox"
                  checked={paymentData.status === "Online"}
                  onChange={() => handleCheckboxChange("Online")}
                />
              </div>
            </Form.Group>
            {/* Amount */}
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
                  max={quotation?.GrandTotal}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                />
              </div>
            </Form.Group>
            {/* Payment Mode */}
            {paymentData.status !== "Offline" && (
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                  Payment Mode
                </Form.Label>
                <Form.Select
                  name="mode"
                  value={paymentData.mode}
                  onChange={handleInputChange}
                  style={{ borderRadius: "6px", borderColor: "#e0e0e0" }}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Googlepay">Googlepay</option>
                  <option value="Phonepay">Phonepay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="UPI">UPI</option>
                </Form.Select>
              </Form.Group>
            )}
            {/* Comments */}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500", color: "#34495e" }}>
                Comments
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="comments"
                value={paymentData.comments}
                onChange={handleInputChange}
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
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleAddPayment}
          // onClick={handleUpdateQuotation}
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
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleGenerateOrder}
          >
            Skip
          </Button>
          <Button
            style={{
              background: "linear-gradient(45deg,rgb(185, 41, 72), #3498db)",
              border: "none",
              borderRadius: "8px",
              padding: "6px 20px",
              fontWeight: "500",
              transition: "transform 0.2s",
            }}
            className="btn-sm"
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            onClick={handleCloseGenerateModal}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* add product  */}
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
    </Container>
  );
};

export default QuotationDetails;