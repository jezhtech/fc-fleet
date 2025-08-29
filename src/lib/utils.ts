import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderId(): string {
  const prefix = "ORD"; // always starts with ORD

  // Use current time in base36 (shorter than decimal, alphanumeric)
  const timePart = Date.now().toString(36).toUpperCase();

  // Add random alphanumeric string (base36 again)
  const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();

  // Combine everything
  let orderId = prefix + timePart + randomPart;

  // Ensure max length = 30
  if (orderId.length > 30) {
    orderId = orderId.substring(0, 30);
  }

  return orderId;
}
