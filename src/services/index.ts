// Export all services
export { bookingService } from "./bookingService";
export { userService } from "./userService";
export { paymentService } from "./paymentService";
export { vehicleService } from "./vehicleService";
export { transportService } from "./transportService";
export { adminService } from "./adminService";
export { authService } from "./authService";

// Export legacy functions for backward compatibility
export {
  confirmBooking,
  assignDriver,
  cancelBooking,
  getAvailableDrivers,
  getBookingDetails,
  bookingWithCash,
} from "./bookingService";

export { getAuthToken } from "./userService";

// Export all types from centralized types file
export type * from "@/types";
