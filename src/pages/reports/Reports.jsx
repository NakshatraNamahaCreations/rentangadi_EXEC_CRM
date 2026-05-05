import React, { useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ProductReports from './ProductReports';
import ClientReports from './ClientReports ';

const Reports = () => {
  const [key, setKey] = useState('product');

  return (
    <div>
      <Tabs
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
        style={{ borderBottom: '2px solid #dee2e6' }}
      >
        <Tab eventKey="product" title="Product Reports">
          <ProductReports />
        </Tab>
        <Tab eventKey="client" title="Client Reports">
          <ClientReports />
        </Tab>
      </Tabs>
    </div>
  );
};

export default Reports;
