export const Button = ({
  variant = "default",
  children,
  onClick,
  className = "",
  ...props
}) => {
  const baseStyles =
    "px-2 w-30 py-1 rounded-md font-semibold transition duration-200 cursor-pointer text-sm";

  const variants = {
    default: "bg-red-800 text-white hover:bg-red-700 shadow-md",
    outline: "border border-gray-500 text-gray-700 hover:bg-gray-100",
    cancel: "bg-gray-500 text-white hover:bg-gray-600 text-sm",
    success: "bg-green-500 text-white hover:bg-green-600",
    blacks: "bg-gray-800 text-white hover:bg-gray-700 shadow-md",
    whatsapp: "bg-green-600 text-white flex items-center gap-2 hover:bg-green-700",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
