import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { config } from "../../services/config.js";
import { Input } from "../../components/ui/Input";
import { FaEdit, FaTrash, FaUserShield } from "react-icons/fa";
import { Button } from "../../components/ui/Button";
import { toast } from "react-toastify";
import { ApiURL } from "../../api.js";

const AdminRights = () => {
  const [selected, setSelected] = useState(0);
  const [displayname, setDisplayName] = useState("");
  const [contactno, setContactNo] = useState("");
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCPassword] = useState("");
  const [userdata, setUserdata] = useState([]);
  const [filterdata, setFilterData] = useState([]);
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log(`admin rights `);
    getuser();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilterData(userdata);
    } else {
      const keyword = search.toLowerCase();
      const filtered = userdata.filter(
        (user) =>
          user.displayname?.toLowerCase().includes(keyword) ||
          user.contactno?.toString().includes(keyword) ||
          user.email?.toLowerCase().includes(keyword)
      );
      setFilterData(filtered);
    }
  }, [search, userdata]);

  const getuser = async () => {
    try {
      const token = sessionStorage.getItem("token");
      console.log(`token: ${token}`);

      const res = await axios.get(`${ApiURL}/admins-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`res.data.admins: `, res.data.admins);
      if (res.status === 200) {
        setUserdata(res.data.admins);
        setFilterData(res.data.admins);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const registerUser = async () => {
    if (!displayname || !contactno || !nameOrEmail) {
      alert("Please fill all fields");
      return;
    }

    if (!data && (!password || !cpassword)) {
      alert("Password is required for new users");
      return;
    }

    if ((password || cpassword) && password !== cpassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const payload = {
        displayname,
        contactno,
        email: nameOrEmail,
      };

      if (password.trim() !== "") {
        payload.password = password;
      }

      if (data) {
        // Edit existing user
        const res = await axios.put(
          `${ApiURL}/auth/users/${data.id}`,
          payload
        );
        if (res.status === 200) {
          alert("User updated successfully");
          clearForm();
          setSelected(0);
          setData(null);
          getuser();
        }
      } else {
        // Register new user
        const res = await axios.post(`${ApiURL}/auth/register`,
          payload
        );
        if (res.status === 201) {
          toast.success("✅ User registered successfully");
          clearForm();
          setSelected(0);
          getuser();
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Something went wrong. Please check console.");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${ApiURL}/auth/users/${id}`);
      toast.success("✅ User deleted successfully");
      getuser();
    } catch (error) {
      console.error("Error deleting user", error);
    }
  };

  const clearForm = () => {
    setDisplayName("");
    setContactNo("");
    setNameOrEmail("");
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
          Add User
        </button>
        <button
          className={`btn ${selected === 0 ? "btn-danger" : "btn-outline-secondary"}`}
          onClick={() => setSelected(0)}
        >
          View Users
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
                  <th scope="col">Email</th>
                  {/* <th scope="col">Contact No</th> */}
                  {/* <th scope="col">Name/Email</th> */}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterdata?.map((row, index) => (
                  <tr key={row._id}>
                    <td>{index + 1}</td>
                    <td>{row.email}</td>
                    {/* <td>{row.contactno || "-"}</td> */}
                    {/* <td>{row.name || "-"}</td> */}
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => {
                            setSelected(1);
                            setDisplayName(row.displayname || "");
                            setContactNo(row.contactno || "");
                            setNameOrEmail(row.email || "");
                            setPassword("");
                            setCPassword("");
                            setData(row);
                          }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <Link
                          to={`/admin-details/${row._id}`}
                          className="btn btn-sm btn-outline-info"
                          title="Assign Rights"
                        >
                          <i className="bi bi-shield-lock"></i>
                        </Link>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteUser(row.id)}
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
                      No users found.
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
                value={contactno}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Name/Email</label>
              <Input
                className="form-control"
                value={nameOrEmail}
                onChange={(e) => setNameOrEmail(e.target.value)}
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
          <button className="btn btn-success mt-4" onClick={registerUser}>
            {data ? "Update User" : "Register User"}
          </button>
        </div>
      )}
    </div>
  );

};

export default AdminRights;
