/**
 * Centralized responsive styles across TT English Zone system
 * Helps maintain consistent grid, padding, and layout behaviors.
 */
export const responsiveStyles = {
  // Main screen wrappers
  container: "max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8",
  pageWrapper: "space-y-6 max-w-full px-1 sm:px-2 md:px-4",

  // Grid layouts
  gridStats: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
  gridTwoCols: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  gridThreeCols: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  gridTwelve: "grid grid-cols-1 lg:grid-cols-12 gap-6",
  colSpanEight: "lg:col-span-8",
  colSpanFour: "lg:col-span-4",
  colSpanSeven: "lg:col-span-7",
  colSpanFive: "lg:col-span-5",

  // Table wrappers
  tableWrapper: "overflow-x-auto w-full border border-gray-200/60 rounded-xl shadow-2xs",

  // Form layouts
  formGridTwo: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  modalWrapper: "fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4",
  modalContainer: "bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
};
