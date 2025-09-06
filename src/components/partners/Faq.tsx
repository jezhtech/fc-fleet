import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | string[];
}

const faqData: FAQItem[] = [
  {
    question: "What are the meeting rules?",
    answer: [
      "Monitors the flight schedule.",
      "Arrives punctually at the agreed meeting point, respecting the client's time.",
      "Remains at the meeting point for the agreed waiting time.",
      "Greets the client with a clean, easily identifiable A4 size board or tablet with the client's name on it.",
      "Confirms that the person being met is a Kiwitaxi customer by politely requesting a voucher and confirming their name and destination."
    ],
  },
  {
    question: "What's the commission?",
    answer:
      "We do not charge any commission. You have the freedom to set prices for each car class and route in your Price List section of the Personal account. The payment for transfers will match the amounts specified in your account's Price List section.",
  },
  {
    question: "How many orders can I take?",
    answer:
      "You can accept as many orders as you're able to handle. Your order volume is determined by your performance. Additionally, you'll receive personalised recommendations on how to become one of the leading suppliers in the region.",
  },
  {
    question: "When are payments processed?",
    answer: [
      "For transactions completed by 11:59 PM on the 15th of the month, payments will be made by the 25th of the same month.",
      "For transactions completed by 11:59 PM on the last day of the month, payments will be made by the 10th of the following month."
    ],
  },
  {
    question: "What should I do if a client doesn't show up?",
    answer: [
      "Contact the customer on the phone number provided on the voucher as soon as the specified waiting time has started.",
      "Contact Kiwitaxi before the end of the waiting period to report the absence of the passenger.",
      "Within 3 business days following the transfer date, provide Kiwitaxi with proof of the driver's presence at the meeting point at the start of the transfer"
    ],
  },
  {
    question: "What documents do you need for the verification process?",
    answer: [
      "Recent extract from the public register office with company details or link to online register base with your company details with the company's owner name",
      "License/permit for transfer services (for all vehicles)",
      "Passport/ID of the authorised director who will sign the contract (with numbers covered if required)",
      "Insurance policy for passengers and cars (for all vehicles), liability Insurance"
    ],
  },
];

export const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center text-black mb-12">FAQ</h2>

      <div className="space-y-0">
        {faqData.map((item, index) => (
          <div key={index} className="border-b border-gray-200 last:border-b-0">
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between py-6 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-medium text-black pr-4">
                {item.question}
              </span>
              <div className="flex-shrink-0">
                {openItems.includes(index) ? (
                  <ChevronUp className="h-6 w-6 text-black" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-black" />
                )}
              </div>
            </button>

            {openItems.includes(index) && (
              <div className="pb-6 pr-16">
                {Array.isArray(item.answer) ? (
                  <ul className="text-gray-700 leading-relaxed space-y-2">
                    {item.answer.map((listItem, listIndex) => (
                      <li key={listIndex} className="flex items-start">
                        <span className="text-gray-500 mr-2 mt-1">•</span>
                        <span>{listItem}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-700 leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
