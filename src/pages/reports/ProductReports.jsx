import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Card, Row, Col, Button } from 'react-bootstrap';
import moment from 'moment';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ApiURL } from '../../api';

const ProductReports = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({
    key: 'totalRevenue',
    direction: 'desc'
  });

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const fetchReport = async () => {
    try {
      setLoading(true);

      if (!selectedYear || !selectedMonth) {
        setLoading(false);
        return;
      }

      console.log('selectedYear: ', selectedYear, "selected month: ", selectedMonth);

      const response = await axios.post(`${ApiURL}/report/productReportByMonth`, {
        year: selectedYear,
        month: selectedMonth
      });
      console.log('selectedYear: ', selectedYear, "selected month: ", selectedMonth, 'Report Data:', response.data);

      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to sort products
  const sortProducts = (products) => {
    const { key, direction } = sortConfig;

    // Convert strings to numbers for price, quantity, and days
    const sortKey = key === 'price' || key === 'quantity' || key === 'days'
      ? (product) => Number(product[key])
      : (product) => product[key];

    return [...products].sort((a, b) => {
      const aValue = sortKey(a);
      const bValue = sortKey(b);

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle column click
  const handleSort = (key) => {
    if (key === sortConfig.key) {
      // Toggle direction if same column is clicked
      setSortConfig({
        key,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new column and default to ascending
      setSortConfig({
        key,
        direction: 'asc'
      });
    }
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (key !== sortConfig.key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row style={{ marginBottom: '24px' }}>
          <Col sm={4}>
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </Col>
          <Col sm={4}>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select Month</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </Col>
          <Col sm={4}>
            <Button
              variant="primary"
              onClick={fetchReport}
              disabled={loading || !selectedYear || !selectedMonth}
              style={{ width: '100%', background: "#BD5525", border: "#BD5525" }}
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </Col>
        </Row>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ width: '40%' }}>
                Product Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('totalRevenue')} style={{ width: '15%' }}>
                Revenue {getSortIcon('totalRevenue')}
              </th>
              <th onClick={() => handleSort('price')} style={{ width: '15%' }}>
                Unit Price {getSortIcon('price')}
              </th>
              {/* <th onClick={() => handleSort('quantity')} style={{ width: '10%' }}>
                Quantity {getSortIcon('quantity')}
              </th> */}
              {/* <th onClick={() => handleSort('days')} style={{ width: '10%' }}>
                Days {getSortIcon('days')}
              </th> */}
            </tr>
          </thead>
          <tbody>
            {reportData.map((monthData) => (
              <React.Fragment key={monthData.month}>
                {sortProducts(monthData.products).map((product, index) => (
                  <tr key={index}>
                    <td style={{ width: '40%' }}>{product.name}</td>
                    <td style={{ width: '15%' }}>₹{product.totalRevenue.toLocaleString()}</td>
                    <td style={{ width: '15%' }}>₹{product.price.toLocaleString()}</td>
                    {/* <td style={{ width: '10%' }}>{product.quantity}</td> */}
                    {/* <td style={{ width: '10%' }}>{product.days}</td> */}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default ProductReports;
