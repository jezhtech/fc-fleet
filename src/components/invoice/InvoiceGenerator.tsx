import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { CURRENCY } from '@/utils/currency';

interface InvoiceProps {
  booking: {
    id: string;
    type: string;
    status: string;
    date: Date;
    pickup: string;
    dropoff: string;
    vehicle: string;
    amount: string;
    paymentInfo?: {
      transactionId?: string;
      paymentMethod?: string;
      timestamp?: string;
    };
    customerInfo?: {
      name: string;
      email: string;
      phone: string;
    };
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const InvoiceGenerator: React.FC<InvoiceProps> = ({ booking, onSuccess, onError }) => {
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  // Use the company logo from public directory
  useEffect(() => {
    // Try to load local logo
    const localLogoUrl = '/lovable-uploads/dbb328b3-31d8-4aa9-b1b1-3a081c9757d8.png';
    
    // Create an Image object to test if the logo can be loaded
    const img = new Image();
    img.onload = () => {
      setLogoUrl(localLogoUrl);
      setLogoLoaded(true);
    };
    img.onerror = () => {
      // Fallback to a placeholder if local logo fails to load
      setLogoUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAA8CAYAAACEhkNqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAVvSURBVHgB7Z1fSFNfHMe/23SbuukwralRNskRlJBEKoWBD0HQH8iXIKKXeuqhHuyPENFLD/UQIz0Ehr1UIL1UUPZSD7MaREpUFJnNNVeaTjfdZm7bvWf3/u5lOvc7Z7rL9vmAeM7vnt3juN/7Pb/f73zPcTWCcuzs7KDRHH4YxvjA2XzKMdvyRD19R8+f7oeXL/BKbLdnYmP6XUPHKNDRcnCeUPr7HvbQw7qVE5L0u9VmQeeTJ0kdZFIuTLz+JLb79+9DT89FHD7chPHxccnDOvvYLXvKEg9lONmC+v3gxBl5yRsUU0dJaANF/UY6+zVbLNgkWvI4n3NdRzDx7qf0PjVJ/UZlJf78mZYeC+GK+i3XLycnB8XFxboI5XQ686qqqrJv376NS45Rgj9JQjnLSuFx+3D8bDF+fPuNoqJ8+P0BvBicQHFRPjZjT4+rqiqxTe29vT2vz+eLUXG5nE6nU3o8OztLRfS9R48eSUnFJVlEZ0nF5vEgYLeFnsbGqrKBnh7fEFJpZWFhQfWJwLlw4QK8Xi92Ub+7vr5edQNUZEcphIf6X6EvNoZ1JdEJJSemTAHbG9jY9Idtcud/v5+Q2qSTkETisTY2NvKvXbtGBYrm5mZqPtTZqT4k/ZPLQNbKZrNh36FDfJVKLGrlUoKr/r+hxaKOPT09GBkZQSLl5eWoq6tT/YSUlpYGzp07t1xTUyO56R07doyP8/LyEl+dypqamuJqbNzd3d0YGpJOKj61HnZ0LD6QTEKGkM70RZpZRAqh7e1t6O1DJgURK4hWxfNcvHix5OKHDx8Qj9PppPKDmzabjZ9rZGSEP5RisVgQwNjY2HZhYWG0zhQOh/kcq6qq+MgKBoPw+/18VKWzaxKJQUaKxHbo0CF4PB7+Bc/OzvKRJRAI8JFDVqe0tJR/6aurq/wcfr+fjyxpSIw8a8lmiMZfVCpJcrkqQaQzVLuicvr0aTx79gzj4+MJAytOmkUEZ3JyMrC+vs5HF3K5qeCJYXFycoI/JeL95HI7OzvR2tpqk8dJubm5mJ+fR01NDZqamrjLIkLhcJBbZKHJP3ToEL/X5ORkfsjCMx6LxcLtJbSVkJAYUbOvqqqiMjc3V6pZbWxsxHp7e3Hr1i3cvHkTZ86c4aUt5qQkZ1EU+dzn9/lx/8F9PqccGRlBQ0MDnjx5grGxMWmWYzb8/tB/f0tLy3/e5KKmpmb5/PnzCZn13LlzmJqakvQ7c+YMbt++jVu3bqGtrQ2XL1/G0NAQL6Wx2hZjampKnLsEpqenB9rb22G1WpPKUK2trdKVHBgYwL1793hNLWpukMc+dOiQaGJ+fp5f2YyWOQ4fPgz2fpwHDx6gubmZj3+Ly+XCw4cPeRLGxsb4qBYbOvh8vkBZWRmfQqyvr/OJNlH7JF29ejX67rKyMj4tYQmnYyqrkQxVVVW4fPkyn+h3dXXxZxAZmJmZ4SOr7dFtikbWH2aCQMUUFb29vRgdHeUJY9XrFKsWiYhVILW/oESw2qLhbN2+fZsXeZOZI7Kp0/Xr15OaZ7I6mLAo0QbEUJGYmPf09GA/KCRZQ9YKRZhvfDaR9UIRJFYUJ3IxJu2FIuIqsFRcMdVbEKFaR+JKsrTrq9ZCMbUXihBDWDFYZSLdqqkViyWhYbHCcjYLRbw6cjAlRk/V2JdWLJYwB1SrUMRLrRMTozcGZE27UARrWLDS/8uXL/n+1JCW16eEGcFmYEJihliqLgZmXC5JaLZQPDs7y2tcVB5ihVVWAVfal+wLSqj2+jd5jdD9CJmEMjdUrfVvrTDmGwzRW5kghVKhTJOhFcYYYf4HYFABbQ7Guw4AAAAASUVORK5CYII=');
      setLogoLoaded(true);
    };
    img.src = localLogoUrl;
  }, []);

  const generateInvoice = async () => {
    try {
      if (!invoiceRef.current) return;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${booking.id}.pdf`);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error generating invoice:', error);
      if (onError) onError('Failed to generate invoice');
    }
  };

  // Format amount to number
  const getAmountNumber = (amountStr: string) => {
    return parseFloat(amountStr.replace(/[^\d.-]/g, '')) || 0;
  };

  const amount = getAmountNumber(booking.amount);
  const taxRate = 0.05; // 5% tax
  const taxAmount = amount * taxRate;
  const totalAmount = amount + taxAmount;

  const formatCurrency = (value: number) => {
    return `${CURRENCY.symbol} ${value.toFixed(2)}`;
  };

  if (!logoLoaded) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
        <span>Preparing invoice...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden invoice template */}
      <div className="hidden">
        <div
          ref={invoiceRef}
          className="bg-white p-8"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img 
                src={logoUrl} 
                alt="First Class Fleet" 
                className="h-16 mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">First Class Fleet</h1>
                <p className="text-gray-500">Premium Transportation Services</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-gray-600">#{booking.id}</p>
              <p className="text-gray-600">
                {format(booking.date, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-gray-600 font-semibold mb-2">Bill To:</h3>
              <p className="font-medium">{booking.customerInfo?.name || 'Customer'}</p>
              <p>{booking.customerInfo?.email || 'customer@example.com'}</p>
              <p>{booking.customerInfo?.phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-gray-600 font-semibold mb-2">Payment Info:</h3>
              <p><span className="font-medium">Method:</span> {booking.paymentInfo?.paymentMethod || 'Online Payment'}</p>
              <p><span className="font-medium">Transaction ID:</span> {booking.paymentInfo?.transactionId || 'N/A'}</p>
              <p><span className="font-medium">Date:</span> {booking.paymentInfo?.timestamp ? 
                format(new Date(booking.paymentInfo.timestamp), 'MMMM d, yyyy') : 
                format(booking.date, 'MMMM d, yyyy')
              }</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="mb-8">
            <h3 className="text-gray-600 font-semibold mb-2">Booking Details:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Service Type:</span> {booking.type}</p>
                <p><span className="font-medium">Vehicle:</span> {booking.vehicle}</p>
                <p><span className="font-medium">Status:</span> {booking.status}</p>
              </div>
              <div>
                <p><span className="font-medium">Date:</span> {format(booking.date, 'MMMM d, yyyy')}</p>
                <p><span className="font-medium">Pickup:</span> {booking.pickup}</p>
                <p><span className="font-medium">Dropoff:</span> {booking.dropoff}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2">{booking.type} Service - {booking.vehicle}</td>
                <td className="text-right py-2">{formatCurrency(amount)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">Tax (5%)</td>
                <td className="text-right py-2">{formatCurrency(taxAmount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="text-right py-2">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Terms */}
          <div className="mb-8">
            <h3 className="text-gray-600 font-semibold mb-2">Terms & Conditions:</h3>
            <p className="text-sm text-gray-600">
              Payment is due upon receipt. Thank you for choosing First Class Fleet for your transportation needs.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t border-gray-300">
            <p>First Class Fleet LLC</p>
            <p>123 Main Street, Dubai, UAE | +971 4 123 4567 | info@firstclassfleet.com</p>
            <p>www.firstclassfleet.com</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={generateInvoice}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Download Invoice
      </button>
    </div>
  );
};

export default InvoiceGenerator; 