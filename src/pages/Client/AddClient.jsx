import React, { useState } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Card,
  InputGroup,
} from "react-bootstrap";
import { FaPlusCircle, FaTrashAlt } from "react-icons/fa";
import axios from "axios";
import { ApiURL } from "../../api";
import { useNavigate } from "react-router-dom";

const AddClient = () => {
  const randomNum = Math.floor(Math.random() * 1000);
  const randomPhone = Math.floor(Math.random() * 10000000000);
  const navigate = useNavigate();
  const [client, setClient] = useState({
    companyName: `Company name ${randomNum}`,
    contactPersonNumber: `${randomPhone}`,
    email: `${randomNum}@example.com`,
    address: "addr",
    username: `username${randomNum}`,
    password: `pwd${randomNum}`,
  });

  // const [executives, setExecutives] = useState([{ name: "", phone: "" }]);
  const [executives, setExecutives] = useState([{ name: `exec ${randomNum}`, phone: `${randomPhone}` }]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [phoneErrors, setPhoneErrors] = useState([]);
  const [clientPhoneErrors, setClientPhoneErrors] = useState("");

  // Phone number validation function
  const validatePhone = (phone) => {
    // const phoneRegex = /^\d{10}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Real-time phone number validation
  const validatePhoneInput = (index, phone) => {
    const isValid = validatePhone(phone);
    const currentErrors = [...phoneErrors];

    if (isValid) {
      currentErrors[index] = null;
    } else {
      currentErrors[index] = "Phone number must be 10 digits and begin with 6–9 (e.g., 9876543210).";
    }
    setPhoneErrors(currentErrors);
    return isValid;
  };

  const validateClientPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    const isValid = phoneRegex.test(phone);
    if (!isValid) {
      setClientPhoneErrors("Phone number must be 10 digits and begin with 6–9 (e.g., 9876543210).");
    } else {
      setClientPhoneErrors("");
    }
    return isValid;
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecutiveChange = (index, field, value) => {
    const updated = [...executives];
    updated[index][field] = value;
    setExecutives(updated);
  };

  const addExecutive = () => {
    setExecutives([...executives, { name: "", phone: "" }]);
  };

  const removeExecutive = (index) => {
    const updated = executives.filter((_, i) => i !== index);
    setExecutives(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    // Validate contact person number
    if (!validatePhone(client.contactPersonNumber)) {
      setErrorMessage("Invalid contact person phone number");
      return;
    }

    // // Validate all executive phone numbers
    // const invalidPhones = executives.filter((exec, index) => !validatePhone(exec.phone));
    // if (invalidPhones.length > 0) {
    //   setErrorMessage("Invalid phone number(s) in executives");
    //   return;
    // }

    // Prepare data for API
    const payload = {
      clientName: client.companyName,
      phoneNumber: client.contactPersonNumber,
      clientUsername: client.username,
      clientPassword: client.password,
      email: client.email,
      address: client.address,
      // executives: executives.map((exec) => ({
      //   name: exec.name,
      //   phoneNumber: exec.phone,
      // })),
    };

    // console.log(`payload: `, payload);

    try {
      const res = await axios.post(`${ApiURL}/client/addClients`, payload);
      if (res.status === 200) {
        setSuccessMessage("✅ Client added successfully!");
        setClient({
          companyName: "",
          contactPersonNumber: "",
          email: "",
          address: "",
        });
        setExecutives([{ name: "", phone: "" }]);
        setTimeout(() => {
          setSuccessMessage(""), 3000;
          navigate("/client");
        });
      } else {
        console.error("error adding client: ", res.data)
        setErrorMessage("Failed to add client. Please try again 1.");
      }
    } catch (error) {
      console.log(`err: `, error);
      setErrorMessage("Failed to add client. Please try again 2: ", error);
    }
  };

  return (
    <Container className="my-5">
      <Card className="shadow-lg border-0 rounded-4">
        <div
          className="py-3 px-4 rounded-top"
          style={{
            background: "linear-gradient(90deg, #323D4F,rgb(154, 155, 156))",
            color: "#fff",
          }}
        >
          <h4 className="mb-0 text-center">Add New Client</h4>
        </div>

        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit} style={{ fontSize: "14px" }}>
            <Form.Group className="mb-3">
              <Form.Label>🏢 Company Name *</Form.Label>
              <Form.Control
                type="text"
                name="companyName"
                value={client.companyName}
                onChange={handleClientChange}
                required
                className="rounded-3 shadow-sm"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label> Executives *</Form.Label>
              {executives.map((exec, index) => (
                <Row key={index} className="mb-2 align-items-center">
                  <Col md={5}>
                    <Form.Control
                      required
                      type="text"
                      placeholder="Full Name"
                      value={exec.name}
                      onChange={(e) =>
                        handleExecutiveChange(index, "name", e.target.value)
                      }
                      className="rounded-3 shadow-sm"
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Control
                      required
                      type="tel"
                      placeholder="Phone Number"
                      value={exec.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleExecutiveChange(index, "phone", value);
                        validatePhoneInput(index, value);
                      }}
                      className={`rounded-3 shadow-sm ${phoneErrors[index] ? 'is-invalid' : ''}`}
                    />
                    {phoneErrors[index] && (
                      <Form.Text className="text-danger">
                        {phoneErrors[index]}
                      </Form.Text>
                    )}
                  </Col>
                  <Col md={2} className="text-center">
                    {executives.length > 1 && (
                      <Button
                        variant="outline-danger"
                        onClick={() => removeExecutive(index)}
                        className="rounded-circle"
                      >
                        <FaTrashAlt />
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}

              <div className="d-flex justify-content-end">
                <Button
                  variant="outline-success"
                  className="d-flex align-items-center gap-2"
                  onClick={addExecutive}
                >
                  <FaPlusCircle />
                  Add Executive
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>📞 Contact Person Number </Form.Label>
              <Form.Control
                type="tel"
                name="contactPersonNumber"
                value={client.contactPersonNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  handleClientChange(e);
                  validateClientPhone(value);
                }}
                // required
                className="rounded-3 shadow-sm"
              />
              {clientPhoneErrors && (
                <Form.Text className="text-danger">
                  {clientPhoneErrors}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>📧 Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={client.email}
                onChange={handleClientChange}
                className="rounded-3 shadow-sm"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label> Password *</Form.Label>
              <Form.Control
                type="text"
                name="password"
                value={client.password}
                onChange={handleClientChange}
                required
                className="rounded-3 shadow-sm mt-2"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>🏠 Address </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={client.address}
                onChange={handleClientChange}
                // required
                className="rounded-3 shadow-sm"
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100 py-2 rounded-3"
              style={{
                fontSize: "15px",
                fontWeight: "500",
                backgroundColor: "#323D4F",
                border: "none",
              }}
            >
              Add Client
            </Button>

            {successMessage && (
              <div
                className="text-success text-center mt-3 fade-in"
                style={{ fontSize: "13px", transition: "opacity 0.5s ease-in" }}
              >
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div
                className="text-danger text-center mt-3 fade-in"
                style={{ fontSize: "13px", transition: "opacity 0.5s ease-in" }}
              >
                {errorMessage}
              </div>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddClient;
