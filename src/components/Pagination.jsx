// import React, { useState } from "react";

// const Pagination = ({ totalItems, itemsPerPage = 10 }) => {
//   const [currentPage, setCurrentPage] = useState(1);

//   const totalPages = Math.ceil(totalItems / itemsPerPage);

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleNext = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const handlePrev = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   // Calculate the range of entries displayed (e.g., Showing 1 to 10 of 57 entries)
//   const startIndex = (currentPage - 1) * itemsPerPage + 1;
//   const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

//   return (
//     <div className="pagination-container">
//       <div className="pagination-info">
//         Showing {startIndex} to {endIndex} of {totalItems} entries
//       </div>
//       <div className="pagination-controls">
//         <button
//           className="pagination-btn prev"
//           onClick={handlePrev}
//           disabled={currentPage === 1}
//         >
//           &lt;
//         </button>
//         {[...Array(totalPages)].map((_, index) => (
//           <button
//             key={index + 1}
//             className={`pagination-btn page-number ${currentPage === index + 1 ? "active" : ""}`}
//             onClick={() => handlePageChange(index + 1)}
//           >
//             {index + 1}
//           </button>
//         ))}
//         <button
//           className="pagination-btn next"
//           onClick={handleNext}
//           disabled={currentPage === totalPages}
//         >
//           &gt;
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Pagination;

// import React from "react";

// const Pagination = ({
//   totalItems,
//   itemsPerPage = 10,
//   currentPage,
//   onPageChange,
// }) => {
//   const totalPages = Math.ceil(totalItems / itemsPerPage);

//   const handleNext = () => {
//     if (currentPage < totalPages) {
//       onPageChange(currentPage + 1);
//     }
//   };

//   const handlePrev = () => {
//     if (currentPage > 1) {
//       onPageChange(currentPage - 1);
//     }
//   };

//   const startIndex = (currentPage - 1) * itemsPerPage + 1;
//   const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

//   return (
//     <div className="pagination-container d-flex justify-content-between align-items-center mt-3 ">
//       <div className="pagination-info">
//         Showing {startIndex} to {endIndex} of {totalItems} entries
//       </div>
//       <div className="pagination-controls d-flex align-items-center">
//         <button
//           className="pagination-btn btn btn-outline-secondary btn-sm me-1"
//           onClick={handlePrev}
//           disabled={currentPage === 1}
//         >
//           &lt;
//         </button>
//         {[...Array(totalPages)].map((_, index) => (

//           <button
//             key={index + 1}
//             className={`pagination-btn btn btn-sm me-1 ${
//               currentPage === index + 1 ? "active" : "btn-outline-secondary"
//             }`}
//             onClick={() => onPageChange(index + 1)}
//             style={{
//               backgroundColor:
//                 currentPage === index + 1 ? "#343a40" : "transparent",
//               color: currentPage === index + 1 ? "#fff" : "#000",
//               borderColor: currentPage === index + 1 ? "#343a40" : "#ced4da",
//             }}
//           >
//             {index + 1}
//           </button>
//         ))}
//         <button
//           className="pagination-btn btn btn-outline-secondary btn-sm"
//           onClick={handleNext}
//           disabled={currentPage === totalPages}
//         >
//           &gt;
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Pagination;


import React from "react";

const Pagination = ({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxPagesToShow = 5;

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate page range
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container d-flex justify-content-between align-items-center mt-3">
      <div className="pagination-info">
        Showing {startIndex} to {endIndex} of {totalItems} entries
      </div>
      <div className="pagination-controls d-flex align-items-center">
        <button
          className="pagination-btn btn btn-outline-secondary btn-sm me-1"
          onClick={handlePrev}
          disabled={currentPage === 1}
        >
          &lt;
        </button>

        {startPage > 1 && (
          <>
            <button
              className="pagination-btn btn btn-sm me-1 btn-outline-secondary"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="me-2">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={`pagination-btn btn btn-sm me-1 ${
              currentPage === page ? "active" : "btn-outline-secondary"
            }`}
            onClick={() => onPageChange(page)}
            style={{
              backgroundColor: currentPage === page ? "#343a40" : "transparent",
              color: currentPage === page ? "#fff" : "#000",
              borderColor: currentPage === page ? "#343a40" : "#ced4da",
            }}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="me-2">...</span>}
            <button
              className="pagination-btn btn btn-sm me-1 btn-outline-secondary"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-btn btn btn-outline-secondary btn-sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default Pagination;