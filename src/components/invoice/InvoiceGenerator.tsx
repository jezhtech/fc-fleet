import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Loader2 } from "lucide-react";
import { BookingWithRelations } from "@/types";

interface InvoiceProps {
  booking: BookingWithRelations;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const InvoiceGenerator: React.FC<InvoiceProps> = ({
  booking,
  onSuccess,
  onError,
}) => {
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  // Format booking ID as FC/YYYY/MM/0001
  const formatBookingId = (id: string) => {
    const date = new Date(booking.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Extract numeric part or use a random number
    let numericPart = "0001";
    if (id.includes("/")) {
      // Already formatted, return as is
      return id;
    } else if (/\d+/.test(id)) {
      const matches = id.match(/\d+/);
      if (matches && matches[0]) {
        numericPart = matches[0].padStart(4, "0");
      }
    }

    return `FC/${year}/${month}/${numericPart}`;
  };

  const formattedBookingId = formatBookingId(booking.id);

  // Use the company logo from public directory
  useEffect(() => {
    // Try to load local logo
    const localLogoUrl = "/logo.png";

    // Create an Image object to test if the logo can be loaded
    const img = new Image();
    img.onload = () => {
      setLogoUrl(localLogoUrl);
      setLogoLoaded(true);
    };
    img.onerror = () => {
      // Fallback to a placeholder if local logo fails to load
      const fallbackLogo =
        "/lovable-uploads/dbb328b3-31d8-4aa9-b1b1-3a081c9757d8.png";
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setLogoUrl(fallbackLogo);
        setLogoLoaded(true);
      };
      fallbackImg.onerror = () => {
        // Final fallback to data URI
        setLogoUrl(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAA8CAYAAACEhkNqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAVvSURBVHgB7Z1fSFNfHMe/23SbuukwralRNskRlJBEKoWBD0HQH8iXIKKXeuqhHuyPENFLD/UQIz0Ehr1UIL1UUPZSD7MaREpUFJnNNVeaTjfdZm7bvWf3/u5lOvc7Z7rL9vmAeM7vnt3juN/7Pb/f73zPcTWCcuzs7KDRHH4YxvjA2XzKMdvyRD19R8+f7oeXL/BKbLdnYmP6XUPHKNDRcnCeUPr7HvbQw7qVE5L0u9VmQeeTJ0kdZFIuTLz+JLb79+9DT89FHD7chPHxccnDOvvYLXvKEg9lONmC+v3gxBl5yRsUU0dJaANF/UY6+zVbLNgkWvI4n3NdRzDx7qf0PjVJ/UZlJf78mZYeC+GK+i3XLycnB8XFxboI5XQ686qqqrJv376NS45Rgj9JQjnLSuFx+3D8bDF+fPuNoqJ8+P0BvBicQHFRPjZjT4+rqiqxTe29vT2vz+eLUXG5nE6nU3o8OztLRfS9R48eSUnFJVlEZ0nF5vEgYLeFnsbGqrKBnh7fEFJpZWFhQfWJwLlw4QK8Xi92Ub+7vr5edQNUZEcphIf6X6EvNoZ1JdEJJSemTAHbG9jY9Idtcud/v5+Q2qSTkETisTY2NvKvXbtGBYrm5mZqPtTZqT4k/ZPLQNbKZrNh36FDfJVKLGrlUoKr/r+hxaKOPT09GBkZQSLl5eWoq6tT/YSUlpYGzp07t1xTUyO56R07doyP8/LyEl+dypqamuJqbNzd3d0YGpJOKj61HnZ0LD6QTEKGkM70RZpZRAqh7e1t6O1DJgURK4hWxfNcvHix5OKHDx8Qj9PppPKDmzabjZ9rZGSEP5RisVgQwNjY2HZhYWG0zhQOh/kcq6qq+MgKBoPw+/18VKWzaxKJQUaKxHbo0CF4PB7+Bc/OzvKRJRAI8JFDVqe0tJR/6aurq/wcfr+fjyxpSIw8a8lmiMZfVCpJcrkqQaQzVLuicvr0aTx79gzj4+MJAytOmkUEZ3JyMrC+vs5HF3K5qeCJYXFycoI/JeL95HI7OzvR2tpqk8dJubm5mJ+fR01NDZqamrjLIkLhcJBbZKHJP3ToEL/X5ORkfsjCMx6LxcLtJbSVkJAYUbOvqqqiMjc3V6pZbWxsxHp7e3Hr1i3cvHkTZ86c4aUt5qQkZ1EU+dzn9/lx/8F9PqccGRlBQ0MDnjx5grGxMWmWYzb8/tB/f0tLy3/e5KKmpmb5/PnzCZn13LlzmJqakvQ7c+YMbt++jVu3bqGtrQ2XL1/G0NAQL6Wx2hZjampKnLsEpqenB9rb22G1WpPKUK2trdKVHBgYwL1793hNLWpukMc+dOiQaGJ+fp5f2YyWOQ4fPgz2fpwHDx6gubmZj3+Ly+XCw4cPeRLGxsb4qBYbOvh8vkBZWRmfQqyvr/OJNlH7JF29ejX67rKyMj4tYQmnYyqrkQxVVVW4fPkyn+h3dXXxZxAZmJmZ4SOr7dFtikbWH2aCQMUUFb29vRgdHeUJY9XrFKsWiYhVILW/oESw2qLhbN2+fZsXeZOZI7Kp0/Xr15OaZ7I6mLAo0QbEUJGYmPf09GA/KCRZQ9YKRZhvfDaR9UIRJFYUJ3IxJu2FIuIqsFRcMdVbEKFaR+JKsrTrq9ZCMbUXihBDWDFYZSLdqqkViyWhYbHCcjYLRbw6cjAlRk/V2JdWLJYwB1SrUMRLrRMTozcGZE27UARrWLDS/8uXL/n+1JCW16eEGcFmYEJihliqLgZmXC5JaLZQPDs7y2tcVB5ihVVWAVfal+wLSqj2+jd5jdD9CJmEMjdUrfVvrTDmGwzRW5kghVKhTJOhFcYYYf4HYFABbQ7Guw4AAAAASUVORK5CYII="
        );
        setLogoLoaded(true);
      };
      fallbackImg.src = fallbackLogo;
    };
    img.src = localLogoUrl;
  }, []);

  const generateInvoice = async () => {
    try {
      setGenerating(true);
      if (!invoiceRef.current) return;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${formattedBookingId}.pdf`);

      if (onSuccess) onSuccess();
      setGenerating(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
      if (onError) onError("Failed to generate invoice");
      setGenerating(false);
    }
  };

  if (!logoLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-fleet-red animate-spin mr-2" />
        <span>Preparing invoice...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Invoice Preview */}
      <div className="border rounded-lg overflow-hidden shadow-sm max-h-[70vh] overflow-y-auto">
        <div
          ref={invoiceRef}
          className="bg-white p-6 md:p-8"
          style={{ width: "100%" }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b">
            <div className="flex items-center mb-4 md:mb-0">
              <img
                src={logoUrl}
                alt="First Class Fleet"
                className="h-12 md:h-16 mr-3 md:mr-4"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  First Class Fleet
                </h1>
                <p className="text-sm md:text-base text-gray-500">
                  Premium Transportation Services
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="inline-block border-2 border-fleet-red rounded-md px-3 py-1 mb-2">
                <h2 className="text-lg md:text-xl font-bold text-fleet-red">
                  INVOICE
                </h2>
              </div>
              <p className="text-gray-700 font-semibold">
                {formattedBookingId}
              </p>
              <p className="text-sm md:text-base text-gray-600">
                {/* {format(new Date(booking.pickupDate), "MMMM d, yyyy")} */}
              </p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6">
            <div className="p-3 md:p-4 bg-gray-50 rounded-md">
              <h3 className="text-fleet-red font-semibold mb-2 border-b pb-1">
                Bill To:
              </h3>
              <p className="font-medium">
                {booking.user?.firstName || "Customer"}
              </p>
              <p className="text-sm md:text-base">
                {booking.user?.email || "customer@example.com"}
              </p>
              <p className="text-sm md:text-base">
                {booking.user?.phone || "N/A"}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 rounded-md">
              <h3 className="text-fleet-red font-semibold mb-2 border-b pb-1">
                Payment Info:
              </h3>
              <p className="text-sm md:text-base">
                <span className="font-medium">Method:</span>{" "}
                {booking.paymentInfo?.method || "Online Payment"}
              </p>
              <p className="text-sm md:text-base">
                <span className="font-medium">Transaction ID:</span>{" "}
                {booking.paymentInfo?.trackingId || "N/A"}
              </p>
              {booking.pickupDate && (
                <p className="text-sm md:text-base">
                  <span className="font-medium">Date:</span>{" "}
                  {booking.paymentInfo?.transactionDate
                    ? format(
                        new Date(booking.paymentInfo.transactionDate),
                        "MMMM d, yyyy"
                      )
                    : format(booking.pickupDate, "MMMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="mb-6 p-3 md:p-4 bg-gray-50 rounded-md">
            <h3 className="text-fleet-red font-semibold mb-2 border-b pb-1">
              Booking Details:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-sm md:text-base">
                  <span className="font-medium">Service Type:</span>{" "}
                  {booking.bookingType === "rent" ? "Hourly" : "Chauffeur"}
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-medium">Vehicle:</span>{" "}
                  {booking.vehicle.name}
                </p>
                <p className="text-sm md:text-base">
                  <span className="font-medium">Status:</span>{" "}
                  {booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
                </p>
              </div>
              <div>
                {booking.pickupDate && (
                  <p className="text-sm md:text-base">
                    <span className="font-medium">Date:</span>{" "}
                    {format(booking.pickupDate, "MMMM d, yyyy")}
                  </p>
                )}
                <p className="text-sm md:text-base">
                  <span className="font-medium">Pickup:</span>{" "}
                  {booking.pickupLocation.name}
                </p>
                {booking.dropoffLocation && (
                  <p className="text-sm md:text-base">
                    <span className="font-medium">Dropoff:</span>{" "}
                    {booking.dropoffLocation.name}
                  </p>
                )}
              </div>
              {booking.user?.firstName && (
                <div className="col-span-1 md:col-span-2 mt-2 pt-2 border-t">
                  <p className="text-sm md:text-base">
                    <span className="font-medium">Driver:</span>{" "}
                    {booking.user.firstName}
                  </p>
                  {booking.user.driverDetails && (
                    <p className="text-sm md:text-base">
                      <span className="font-medium">Vehicle Number:</span>{" "}
                      {booking.user.driverDetails.vehicleNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-fleet-red text-white">
                  <th className="text-left py-2 px-3 md:py-3 md:px-4 rounded-tl-md">
                    Description
                  </th>
                  <th className="text-right py-2 px-3 md:py-3 md:px-4 rounded-tr-md">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 bg-white">
                  <td className="py-2 px-3 md:py-3 md:px-4">
                    {booking.bookingType === "rent" ? "Hourly" : "Chauffeur"}{" "}
                    Service - {booking.user.driverDetails?.vehicleNumber}
                  </td>
                  <td className="text-right py-2 px-3 md:py-3 md:px-4">
                    {booking.amount}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-100">
                  <td className="py-2 px-3 md:py-3 md:px-4 rounded-bl-md">
                    Total
                  </td>
                  <td className="text-right py-2 px-3 md:py-3 md:px-4 rounded-br-md">
                    {booking.amount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms */}
          <div className="mb-6 p-3 md:p-4 bg-gray-50 rounded-md">
            <h3 className="text-fleet-red font-semibold mb-2 border-b pb-1">
              Terms & Conditions:
            </h3>
            <ul className="text-xs md:text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Payment is due upon receipt.</li>
              <li>
                Cancellations must be made at least 24 hours before the
                scheduled service.
              </li>
              <li>
                Additional charges may apply for waiting time, extra stops, or
                route changes.
              </li>
              <li>
                Thank you for choosing First Class Fleet for your transportation
                needs.
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs md:text-sm text-gray-500 mt-6 pt-3 border-t border-gray-300">
            <p className="font-semibold text-fleet-red">
              First Class Fleet LLC
            </p>
            <p>
              123 Main Street, Dubai, UAE | +971 4 123 4567 |
              info@firstclassfleet.com
            </p>
            <p>www.firstclassfleet.com</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={generateInvoice}
        disabled={generating}
        className="w-full bg-fleet-red hover:bg-fleet-red/90"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </>
        )}
      </Button>
    </div>
  );
};

export default InvoiceGenerator;
