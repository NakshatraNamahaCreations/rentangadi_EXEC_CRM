import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { config } from "../../services/config.js";
import { Input } from "../../components/ui/Input";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import { Button } from "../../components/ui/Button";
import { toast } from "react-toastify";
import { ApiURL } from "../../api.js";

const ExecutiveManagement = () => {
  const [selected, setSelected] = useState(0);
  const [displayname, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCPassword] = useState("");
  const [userdata, setUserdata] = useState([]);
  const [filterdata, setFilterData] = useState([]);
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log(`admin rights `);
    getAllExecutives();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilterData(userdata);
    } else {
      const keyword = search.toLowerCase();
      const filtered = userdata.filter(
        (user) =>
          user.displayname?.toLowerCase().includes(keyword) ||
          user.phoneNumber?.toString().includes(keyword) ||
          user.email?.toLowerCase().includes(keyword)
      );
      setFilterData(filtered);
    }
  }, [search, userdata]);

  const getAllExecutives = async () => {
    try {
      const token = sessionStorage.getItem("token");
      console.log(`getAllExecutives token: ${token}`);

      const res = await axios.get(`${ApiURL}/executive`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`getAllExecutives res.data: `, res.data);
      console.log(`getAllExecutives res.data.client.executives: `, res.data.client.executives);
      if (res.status === 200) {
        setUserdata(res.data.client.executives);
        setFilterData(res.data.client.executives);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const createExecutive = async () => {
    if (!displayname || !phoneNumber) {
      alert("Please fill all fields");
      return;
    }

    if (!data && (!password)) {
      alert("Password is required for new users");
      return;
    }

    if ((password || cpassword) && password !== cpassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const payload = {
        name: displayname,
        phoneNumber,
        email: email,
      };

      if (password.trim() !== "") {
        payload.password = password;
      }

      const token = sessionStorage.getItem("token");

      if (data) {
        console.log(`data: `, data);
        // Update existing executive
        const res = await axios.put(
          `${ApiURL}/executive/${data._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 200) {
          alert("✅ Executive updated successfully");
          clearForm();
          setSelected(0);
          setData(null);
          getAllExecutives();
        }
      } else {
        const token = sessionStorage.getItem("token");
        console.log(`payload: `, payload);
        const res = await axios.post(
          `${ApiURL}/executive`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 201) {
          alert("✅ Executive created successfully");
          clearForm();
          setSelected(0);
          getAllExecutives();
        }
      }
    } catch (error) {
      console.error("cant create exec err: ", error)
      console.error("Error saving user:", error.response.data.message);
      alert(error.response.data.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${ApiURL}/executive/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("✅ User deleted successfully");
      getAllExecutives();
    } catch (error) {
      console.error("Error deleting user", error.response.data.message);
      alert(error.response.data.message);
    }
  };

  const clearForm = () => {
    setDisplayName("");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setCPassword("");
    setData(null);
  };

  return (
    <div className="container py-4">
      {/* Tabs */}
      <div className="d-flex justify-content-end gap-2 mb-3">
        <button
          className={`btn ${selected === 1 ? "btn-danger" : "btn-outline-secondary"}`}
          onClick={() => setSelected(1)}
        >
          Add Executive
        </button>
        <button
          className={`btn ${selected === 0 ? "btn-danger" : "btn-outline-secondary"}`}
          onClick={() => setSelected(0)}
        >
          View Executives
        </button>
      </div>

      {selected === 0 ? (
        <>
          {/* Search Input */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control w-100 w-md-25"
              placeholder="Search here..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="table-responsive shadow-sm">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Sl No</th>
                  <th scope="col">Display Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone Number</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterdata?.map((row, index) => (
                  <tr key={row._id}>
                    {console.log("row: ", row)}
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>{row.phoneNumber}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => {
                            setSelected(1);
                            setDisplayName(row.name || "");
                            setPhoneNumber(row.phoneNumber || "");
                            setEmail(row.email || "");
                            setPassword("");
                            setCPassword("");
                            setData(row);
                          }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        {/* <Link
                          to={`/admin-details/${row._id}`}
                          className="btn btn-sm btn-outline-info"
                          title="Assign Rights"
                        >
                          <i className="bi bi-shield-lock"></i>
                        </Link> */}

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteUser(row?._id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filterdata.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      No executives found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // Add/Edit Form
        <div className="mt-4">
          <form className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Display Name</label>
              <Input
                className="form-control"
                value={displayname}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Contact No</label>
              <Input
                className="form-control"
                type="number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <Input
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Password</label>
              <Input
                className="form-control"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Confirm Password</label>
              <Input
                className="form-control"
                type="password"
                value={cpassword}
                onChange={(e) => setCPassword(e.target.value)}
              />
            </div>
          </form>
          <button className="btn btn-success mt-4" onClick={createExecutive}>
            {data ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      )}
    </div>
  );

};

export default ExecutiveManagement;
