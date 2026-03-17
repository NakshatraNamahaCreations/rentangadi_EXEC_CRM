# CreateQuote Component Refactoring Guide

This guide outlines the steps to refactor the CreateQuote component from a monolithic structure to a modular, component-based architecture.

## Components Structure

We've broken down the original CreateQuote component into smaller, specialized components:

1. **CustomerDetails.jsx** - Displays customer information
2. **SavedQuotations.jsx** - Manages the list of saved quotations
3. **PackageCard.jsx** - Displays a single package with its services
4. **CustomPackageModal.jsx** - Modal for adding/editing custom packages
5. **PresetPackageHandler.jsx** - Handles preset package selection and application
6. **InstallmentsTable.jsx** - Displays and manages installments
7. **InstallmentModal.jsx** - Modal for adding/editing installments
8. **TotalSummary.jsx** - Displays total amount with discount and GST
9. **QuotationModal.jsx** - Modal for saving/updating quotations

Plus a utility file:
- **quotationUtils.js** - Contains helper functions

## Implementation Steps

### Step 1: Create Component Files

First, create all the component files in the appropriate directory structure:

```
/src
  /pages
    /Customer
      /components
        CustomerDetails.jsx
        SavedQuotations.jsx
        PackageCard.jsx
        CustomPackageModal.jsx
        PresetPackageHandler.jsx
        InstallmentsTable.jsx
        InstallmentModal.jsx
        TotalSummary.jsx
        QuotationModal.jsx
      /utils
        quotationUtils.js
```

### Step 2: Implement Utility Functions

Implement the utility functions in `quotationUtils.js` that will be used across components:

- `calculateTotalAmount()`
- `calculateDiscount()`
- `calculateGst()`
- `calculateInstallmentPercentages()`
- `loadSavedQuotations()`
- `saveQuotations()`

### Step 3: Implement Individual Components

Implement each component following its defined responsibilities.

### Step 4: Refactor CreateQuote.jsx

Finally, refactor the main CreateQuote.jsx component to use all these smaller components:

1. Import all the components and utility functions
2. Define state variables at the main component level that need to be shared
3. Define handler functions for events and interactions
4. Compose the UI using the new components
5. Pass the appropriate props to each component

## Implementation Example

Here's how to refactor the main CreateQuote.jsx component:

```jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { FaSave } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { selectLeadsList } from "../../store/slices/leadsSlice";

// Import components
import CustomerDetails from "./components/CustomerDetails";
import SavedQuotations from "./components/SavedQuotations";
import PackageCard from "./components/PackageCard";
import CustomPackageModal from "./components/CustomPackageModal";
import PresetPackageHandler from "./components/PresetPackageHandler";
import InstallmentsTable from "./components/InstallmentsTable";
import InstallmentModal from "./components/InstallmentModal";
import TotalSummary from "./components/TotalSummary";
import QuotationModal from "./components/QuotationModal";

// Import utilities
import {
  calculateTotalAmount,
  calculateDiscount,
  calculateGst,
  calculateInstallmentPercentages,
  loadSavedQuotations,
  saveQuotations
} from "./utils/quotationUtils";

const CreateQuote = () => {
  // State definitions
  // ...

  // Handlers
  // ...

  // Render
  return (
    <div className="container mt-4 mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="container my-4">
        {/* Customer Details */}
        <CustomerDetails 
          lead={lead} 
          id={id} 
          onEditClick={() => navigate(`/customer/editleads-details/${id}`)} 
        />

        {/* Saved Quotations */}
        <SavedQuotations 
          savedQuotations={savedQuotations}
          currentQuotationId={currentQuotationId}
          editingQuotationId={editingQuotationId}
          onLoad={handleLoadQuotation}
          onEdit={handleEditQuotation}
          onFinalize={handleFinalizeQuotation}
          onUnfinalize={handleUnfinalizeQuotation}
          onDelete={handleDeleteQuotation}
        />

        {/* Package Section */}
        <div className="card p-3 mb-3 border-0 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>
                Packages
                {currentQuotationId && (
                  <Badge 
                    bg="primary" 
                    className="ms-2" 
                    style={{ fontSize: "12px" }}
                  >
                    {savedQuotations.find(q => q.id === currentQuotationId)?.name}
                  </Badge>
                )}
              </h4>
            </div>
            <div className="d-flex gap-2">
              {(isEditable) && (
                <>
                  <PresetPackageHandler 
                    onAddPackage={handleAddPresetPackage}
                    categorySettings={categorySettings}
                    setCategorySettings={setCategorySettings}
                  />
                  
                  <Button
                    onClick={handleAddPackageButtonClick}
                    variant="transparent"
                    className="fw-bold rounded-1 shadow bg-white"
                    style={{ fontSize: "14px" }}
                  >
                    + Add Custom Package
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Packages */}
          {packages.length > 0 ? (
            <>
              <div className="d-flex flex-wrap gap-4 justify-content-start">
                {packages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id || index}
                    pkg={pkg}
                    isEditable={isEditable}
                    onEdit={handleEditButtonClick}
                    onDelete={(id) => setPackages(packages.filter(p => p.id !== id))}
                  />
                ))}
              </div>
              
              {/* Total Summary */}
              <TotalSummary 
                totalAmount={totalAmt}
                discountPercentage={discountPer}
                discountValue={discountValue}
                isGstApplied={isGstApplied}
                gstValue={gstValue}
                totalAfterDiscount={totalAfterDiscount}
                isEditable={isEditable}
                onDiscountChange={handleDiscountChange}
                onGstToggle={handleGstToggle}
              />
            </>
          ) : (
            <div className="alert alert-info mb-3">
              <p className="mb-0">
                Please select a quotation from above or create a new package by
                clicking "Add Package".
              </p>
            </div>
          )}
        </div>

        {/* Installments */}
        {packages.length > 0 && (
          <InstallmentsTable 
            installments={installments}
            isEditable={isEditable}
            totalAmount={calculateTotalAmount(packages)}
            onAddInstallment={() => setShowInstallmentModal(true)}
            onEditInstallment={handleEditInstallment}
            onDeleteInstallment={handleDeleteInstallment}
          />
        )}

        {/* Bottom Buttons */}
        <div className="d-flex justify-content-end mt-4">
          {/* Save/Update Quotation Button - Only show when creating/editing */}
          {(isEditable) && (
            <Button
              variant={editingQuotationId ? "success" : "transparent"}
              className={`fw-bold me-2 ${!editingQuotationId ? "rounded-1 shadow bg-white" : ""}`}
              onClick={handleUpdateCurrentQuotation}
              style={{ fontSize: "14px" }}
              disabled={packages.length === 0}
            >
              <FaSave className="me-1" /> {editingQuotationId ? "Update Quotation" : "Save as New Quotation"}
            </Button>
          )}

          <Button
            variant="dark"
            style={{ fontSize: "14px" }}
            disabled={!currentQuotationId || editingQuotationId}
            onClick={() => {
              if (currentQuotationId) {
                navigate("/customer/quote/" + id);
              } else if (savedQuotations.length > 0) {
                toast.error("Please select a quotation first by clicking on one from the 'Saved Quotations' list above.");
              } else if (packages.length > 0) {
                toast.error("Please save your current quotation before proceeding.");
              } else {
                toast.error("Please add at least one package and save it as a quotation before creating a quote.");
              }
            }}
          >
            Create Quote
          </Button>
        </div>

        {/* Modals */}
        <CustomPackageModal 
          show={showModal}
          onHide={() => setShowModal(false)}
          modalMode={modalMode}
          selectedCategory={selectedCategory}
          eventDate={eventDate}
          selectedSlot={selectedSlot}
          venueName={venueName}
          venueAddress={venueAddress}
          services={services}
          categorySettings={categorySettings}
          onCategoryChange={(value) => setSelectedCategory(value)}
          onEventDateChange={(value) => setEventDate(value)}
          onSlotChange={(value) => setSelectedSlot(value)}
          onVenueNameChange={(value) => setVenueName(value)}
          onVenueAddressChange={(value) => setVenueAddress(value)}
          onCheckboxChange={handleCheckboxChange}
          onPriceChange={handlePriceChange}
          onQtyChange={handleQtyChange}
          onSelectAllServices={handleSelectAllServices}
          onDeselectAllServices={handleDeselectAllServices}
          onSave={modalMode === "edit" ? handleEditService : handleAddService}
        />

        <InstallmentModal 
          show={showInstallmentModal}
          onHide={() => {
            setShowInstallmentModal(false);
            setEditingInstallmentIndex(null);
            setNewInstallmentPercentage("");
          }}
          value={newInstallmentPercentage}
          onChange={setNewInstallmentPercentage}
          onSave={handleAddInstallment}
          isEditing={editingInstallmentIndex !== null}
        />

        <QuotationModal 
          show={showSaveQuotationModal}
          onHide={handleCloseQuotationModal}
          quotationName={quotationName}
          quotationDescription={quotationDescription}
          onNameChange={setQuotationName}
          onDescriptionChange={setQuotationDescription}
          onSave={handleSaveQuotation}
          isEditing={editingQuotationId !== null}
        />
      </div>
    </div>
  );
};

export default CreateQuote;
```

## Benefits of the Refactored Architecture

This refactored architecture provides several benefits:

1. **Maintainability**: Each component has a single responsibility
2. **Testability**: Smaller components are easier to test
3. **Reusability**: Components can be reused in other parts of the application
4. **Readability**: Code is more organized and easier to understand
5. **Performance**: React can optimize rendering for smaller components
6. **Collaboration**: Multiple developers can work on different components simultaneously

## Next Steps

After implementing the refactored architecture:

1. Test each component individually
2. Ensure all functionality works end-to-end
3. Add propTypes or TypeScript types for better type checking
4. Consider adding unit tests for critical components
5. Document each component's API for future reference 