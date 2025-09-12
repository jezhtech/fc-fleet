import React from "react";
import { Button } from "@/components/ui/button";

export const Start = () => {
  const STEPS = [
    {
      title: "Fill out the registration form",
      description: "Our manager will contact you shortly",
    },
    {
      title: "Complete the verification process",
      description: "Collect a package of documents",
    },
    {
      title: "Dive into the training process",
      description:
        "Watch our short training videos. Got questions? Your personal fcfleet manager will answer them",
    },
    {
      title: "Start receiving orders",
      description:
        "Sign the contract and get ready to receive your first profits!",
    },
  ];

  return (
    <div className="bg-white flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to <span className="text-green-600">start?</span>
        </h2>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-gray-700 mb-12 leading-relaxed">
          Access a world of opportunities and skyrocket your earnings with
          Kiwitaxi!
        </p>

        <div className="max-w-lg mb-10">
          {STEPS.map((step, index) => (
            <div key={index} className="flex items-center mb-4">
              <p className="text-orange-600 text-4xl whitespace-nowrap min-w-[100px]">
                Step {index + 1}
              </p>
              <div className="w-1 rounded-full shrink-0 mx-5 h-16 bg-orange-300" />
              <div className="text-left">
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Call to Action Button */}
        <Button
          size="lg"
          onClick={() => {
            const form = document.getElementById("application-form");
            if (form) {
              form.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-4 text-lg rounded-lg"
        >
          Send the application
        </Button>
      </div>
    </div>
  );
};
