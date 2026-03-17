// Function to parse date from DD-MM-YYYY format
const parseDate = (str) => {
  if (!str) return null; // If date is undefined or null, return null.
  const [day, month, year] = str.split("-"); // Assuming date format is DD-MM-YYYY
  return new Date(`${year}-${month}-${day}`); // Convert to YYYY-MM-DD format for JavaScript Date
};

export { parseDate }
