import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Card, Row, Col, Button, Form } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import { ApiURL } from '../../api';
import { format } from 'date-fns';

const ClientReports = () => {
    const [clients, setClients] = useState([]);
    const [clientMap, setClientMap] = useState({});
    const [selectedClients, setSelectedClients] = useState([]);
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [dismantleDate, setDismantleDate] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch clients for dropdown
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await axios.get(`${ApiURL}/client/getallClients`);
                console.log('fetchClients res data: ', res.data.Client);
                const clientOptions = res.data.Client.map((client) => ({
                    value: client._id,
                    label: client.clientName || client.name
                }));
                // Create a map of client IDs to names
                const clientNameMap = {};
                res.data.Client.forEach(client => {
                    clientNameMap[client._id] = client.clientName || client.name;
                });
                setClientMap(clientNameMap);
                setClients([
                    { value: 'ALL_CLIENTS', label: 'All Clients' },
                    ...clientOptions
                ]);
            } catch (err) {
                setClients([]);
            }
        };
        fetchClients();
    }, []);

    const handleClientSelect = (selectedOptions) => {
        if (!selectedOptions) {
            setSelectedClients([]);
            return;
        }
        // If "All Clients" is selected, select all except "All Clients"
        const isAllSelected = selectedOptions.some(opt => opt.value === "ALL_CLIENTS");
        if (isAllSelected) {
            setSelectedClients(
                clients
                    .filter((opt) => opt.value !== "ALL_CLIENTS")
                    .map((opt) => opt.value)
            );
        } else {
            setSelectedClients(selectedOptions.map((option) => option.value));
        }
    };

    const fetchReport = async () => {
        if (!selectedClients.length || !deliveryDate || !dismantleDate) return;
        setLoading(true);
        console.log('selectedClients: ', selectedClients, 'deliveryDate: ', deliveryDate, 'dismantleDate: ', dismantleDate);
        try {
            const res = await axios.post(`${ApiURL}/client/getClientsGrandTotal`, {
                clientIds: selectedClients.includes('ALL_CLIENTS') ? [] : selectedClients,
                // startDate: format(deliveryDate, 'dd-MM-yyyy'),
                // endDate: format(dismantleDate, 'dd-MM-yyyy')
                startDate: deliveryDate,
                endDate: dismantleDate
            });
            console.log('fetchReport res data: ', res.data);
            res.data.sort((a, b) => b.totalGrandTotal - a.totalGrandTotal);
            setReportData(res.data || []);
        } catch (err) {
            setReportData([]);
            console.error('Failed to fetch report: ', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <Row className="mb-3" style={{ padding: 24 }}>
                    <Col sm={4}>
                        <h6 className="text-dark mb-2">Select Clients</h6>
                        <Select
                            isMulti
                            options={clients}
                            value={
                                selectedClients.length === clients.length - 1 && clients.length > 1
                                    ? clients
                                    : clients.filter((client) => selectedClients.includes(client.value))
                            }
                            onChange={handleClientSelect}
                            placeholder="Select clients"
                            getOptionLabel={(e) => e.label}
                            getOptionValue={(e) => e.value}
                            styles={{
                                valueContainer: (base) => ({
                                    ...base,
                                    maxHeight: 80,
                                    overflowY: 'auto',
                                    flexWrap: 'wrap',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                        />
                    </Col>
                    <Col sm={3}>
                        <h6 className="text-dark mb-2">Start date</h6>
                        <DatePicker
                            selected={deliveryDate}
                            onChange={setDeliveryDate}
                            placeholderText="DD/MM/YYYY"
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                        />
                    </Col>
                    <Col sm={3}>
                        <h6 className="text-dark mb-2">End date</h6>
                        <DatePicker
                            selected={dismantleDate}
                            onChange={setDismantleDate}
                            placeholderText="DD/MM/YYYY"
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                        />
                    </Col>
                    <Col sm={2}>
                        <Button
                            variant="primary"
                            onClick={fetchReport}
                            disabled={loading || !selectedClients.length || !deliveryDate || !dismantleDate}
                            style={{ width: '100%', backgroundColor: "#BD5525", border: "#BD5525", }}
                        >
                            {loading ? 'Loading...' : 'Generate Report'}
                        </Button>
                    </Col>
                </Row>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Client Name</th>
                            <th>Grand Total</th>
                            <th>RoundOff Total</th>
                            <th>Diff</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row) => (
                            <tr key={row._id}>
                                <td>{clientMap[row._id] || 'Unknown Client'}</td>
                                <td>₹{row.totalGrandTotal.toLocaleString()}</td>
                                <td>₹{row.totalRoundOff.toLocaleString()}</td>
                                <td>₹{row.totalGrandTotal - row.totalRoundOff}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
};

export default ClientReports;