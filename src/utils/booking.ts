import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

/**
 * Generates a booking ID in the format FC/YYYY/MM/COUNT
 * @param date Date object or timestamp to extract year and month from
 * @param monthlyCount The count of bookings in the current month (1-based)
 * @returns Formatted booking ID string
 */
export const generateBookingId = (
  date: Date | Timestamp,
  monthlyCount: number,
): string => {
  let dateObj: Date;

  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const count = String(monthlyCount).padStart(4, "0");

  return `FC/${year}/${month}/${count}`;
};

/**
 * Gets the next monthly count for a booking
 * @param date Date to check for the month and year
 * @returns Promise resolving to the next count number
 */
export const getNextBookingCount = async (date: Date): Promise<number> => {
  try {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    // Start and end of the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Query bookings within this month
    const bookingsRef = collection(firestore, "bookings");
    const q = query(
      bookingsRef,
      where("createdAt", ">=", startOfMonth),
      where("createdAt", "<=", endOfMonth),
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No bookings this month, start with 1
      return 1;
    }

    // Get the latest booking
    const latestBooking = querySnapshot.docs[0].data();

    // Check if it has a formatted ID already
    if (
      latestBooking.formattedId &&
      typeof latestBooking.formattedId === "string"
    ) {
      const parts = latestBooking.formattedId.split("/");
      if (parts.length === 4) {
        const lastCount = parseInt(parts[3], 10);
        if (!isNaN(lastCount)) {
          return lastCount + 1;
        }
      }
    }

    // If we can't extract a count, default to 1
    return 1;
  } catch (error) {
    console.error("Error getting next booking count:", error);
    // Default to 1 in case of any error
    return 1;
  }
};

/**
 * Formats an existing booking ID based on its creation date
 * @param bookingId The original booking ID
 * @param createdAt The creation timestamp
 * @param count Optional count to use (if known)
 * @returns Formatted booking ID
 */
export const formatExistingBookingId = (
  bookingId: string,
  createdAt: Date | Timestamp,
  count: number = 1,
): string => {
  // If it's already in the right format, return as is
  if (
    typeof bookingId === "string" &&
    bookingId.startsWith("FC/") &&
    bookingId.split("/").length === 4
  ) {
    return bookingId;
  }

  return generateBookingId(createdAt, count);
};

/**
 * Update all existing bookings to have formatted IDs
 * @returns Promise resolving to the number of bookings updated
 */
export const updateAllBookingIds = async (): Promise<number> => {
  try {
    // Get all bookings without formatted IDs
    const bookingsRef = collection(firestore, "bookings");
    const q = query(bookingsRef);
    const querySnapshot = await getDocs(q);

    let updateCount = 0;

    // First pass: organize bookings by month
    const bookingsByMonth: Record<string, any[]> = {};

    querySnapshot.forEach((docSnapshot) => {
      const bookingData = docSnapshot.data();
      let createdAt: Date;

      // Extract date
      if (
        bookingData.createdAt &&
        typeof bookingData.createdAt.toDate === "function"
      ) {
        createdAt = bookingData.createdAt.toDate();
      } else if (bookingData.createdAt) {
        createdAt = new Date(bookingData.createdAt);
      } else if (
        bookingData.date &&
        typeof bookingData.date.toDate === "function"
      ) {
        createdAt = bookingData.date.toDate();
      } else if (bookingData.date) {
        createdAt = new Date(bookingData.date);
      } else {
        createdAt = new Date();
      }

      // Skip if invalid date
      if (isNaN(createdAt.getTime())) {
        createdAt = new Date();
      }

      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!bookingsByMonth[key]) {
        bookingsByMonth[key] = [];
      }

      bookingsByMonth[key].push({
        id: docSnapshot.id,
        data: bookingData,
        createdAt,
      });
    });

    // Second pass: update each booking with correct count
    for (const monthKey in bookingsByMonth) {
      // Sort bookings by date within each month
      const monthBookings = bookingsByMonth[monthKey].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      // Update each booking with sequential count
      for (let i = 0; i < monthBookings.length; i++) {
        const booking = monthBookings[i];
        const count = i + 1;
        const formattedId = generateBookingId(booking.createdAt, count);

        // Skip if already has the correct formatted ID
        if (booking.data.formattedId === formattedId) {
          continue;
        }

        // Update booking
        const bookingRef = doc(firestore, "bookings", booking.id);
        await updateDoc(bookingRef, {
          formattedId,
        });

        updateCount++;
      }
    }

    return updateCount;
  } catch (error) {
    console.error("Error updating booking IDs:", error);
    throw error;
  }
};
