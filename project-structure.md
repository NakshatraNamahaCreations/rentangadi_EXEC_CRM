# Refactored CreateQuote Component Structure

The refactored CreateQuote component uses a modular approach with separate components for better maintainability, readability, and performance.

## Directory Structure

```
/src
  /pages
    /Customer
      CreateQuote.jsx  (Main component - orchestrates the other components)
      /components
        CustomerDetails.jsx  (Display customer info)
        SavedQuotations.jsx  (Display and manage saved quotations)
        PackageCard.jsx  (Display a package with services)
        CustomPackageModal.jsx  (Modal for adding/editing custom packages)
        PresetPackageHandler.jsx  (Handles preset package selection)
        InstallmentsTable.jsx  (Display and manage installments)
        InstallmentModal.jsx  (Modal for adding/editing installments)
        TotalSummary.jsx  (Display total with discounts and GST)
        QuotationModal.jsx  (Modal for saving/updating quotations)
      /utils
        quotationUtils.js  (Utility functions for quotation management)
```

## Component Responsibilities

1. **CreateQuote.jsx**: 
   - Main component that manages the overall state and logic
   - Coordinates interactions between child components

2. **CustomerDetails.jsx**:
   - Displays customer information
   - Has a button to edit customer details

3. **SavedQuotations.jsx**:
   - Displays a table of saved quotations
   - Provides actions for loading, editing, finalizing, and deleting quotations

4. **PackageCard.jsx**:
   - Displays a single package with its services and totals
   - Provides buttons for editing and deleting packages

5. **CustomPackageModal.jsx**:
   - Modal for creating or editing a custom package
   - Handles service selection, quantities, and pricing

6. **PresetPackageHandler.jsx**:
   - Manages the selection and application of preset packages
   - Contains the preset package button and modal

7. **InstallmentsTable.jsx**:
   - Displays the payment plan with installments
   - Provides actions for adding, editing, and deleting installments

8. **InstallmentModal.jsx**:
   - Modal for adding or editing an installment
   - Handles percentage input validation

9. **TotalSummary.jsx**:
   - Displays total amount with discounts and GST
   - Provides controls for discount percentage and GST toggle

10. **QuotationModal.jsx**:
    - Modal for saving a quotation with a name and description

## Utils

**quotationUtils.js**:
- Provides helper functions for calculations
- Handles loading and saving to localStorage
- Contains reusable logic used across components

## Benefits of This Architecture

1. **Modular**: Each component has a single responsibility, making code more maintainable
2. **Reusable**: Components can be reused in other parts of the application
3. **Testable**: Smaller components are easier to test
4. **Performant**: Components can be optimized individually
5. **Scalable**: Easy to add new features by extending components
6. **Readable**: Code is more organized and easier to understand
7. **Maintainable**: Bug fixes and updates are isolated to specific components 