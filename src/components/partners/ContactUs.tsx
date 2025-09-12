
import { Mail } from "lucide-react";

export const ContactUs = () => {
  return (
    <div className="py-20 bg-gray-100 flex items-center justify-center px-4">
      <div className="text-center mx-auto">
        {/* Main Heading */}
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Contact us
        </h2>
        
        {/* Sub-text */}
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Any other questions? We are always happy to answer them
        </p>
        
        {/* Contact Information Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Email Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Email Address */}
          <p className="text-lg text-gray-900 font-medium">
            partner@fcfleets.com
          </p>
        </div>
      </div>
    </div>
  );
};
