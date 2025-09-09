import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import {
  FileText,
  CreditCard,
  Shield,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react";
import config from "@/config";

const TermsAndConditions = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-red-600 to-fleet-accent py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms and Conditions
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Please read our terms of service carefully to understand your
              rights and responsibilities
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Card */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-gray-50 to-white border-0 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                First Class Fleet Terms and Conditions
              </h2>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Last updated: May 8, 2025</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>UAE Law Compliant</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Introduction
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Welcome to First Class Fleet ("Company", "we", "our",
                      "us"). These Terms and Conditions govern your use of our
                      website and services operated in the United Arab Emirates
                      (UAE).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      By accessing or using our service, you agree to be bound
                      by these Terms. If you disagree with any part of the
                      terms, you may not access the service.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Service Terms */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Service Terms
                  </h3>
                  <p className="text-gray-700 mb-6">
                    First Class Fleet provides chauffeur services and hourly
                    vehicle rental services throughout the UAE subject to the
                    following terms:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "All bookings are subject to vehicle availability",
                      "Service available 24/7 with prior reservation",
                      "Rates include fuel, driver allowances, and insurance",
                      "Additional waiting charges after 15 minutes",
                      "Child seats available at additional cost",
                      "Seat belts mandatory for all passengers",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Booking and Cancellation Policy */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Booking and Cancellation Policy
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        Booking Confirmation
                      </h4>
                      <p className="text-gray-700">
                        All bookings are confirmed upon receipt of booking
                        confirmation email or SMS.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                        Cancellation Policy
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          {
                            time: "More than 2 hours prior",
                            charge: "No charge",
                            color: "green",
                          },
                          {
                            time: "Less than 2 hours prior",
                            charge: "30% of fare",
                            color: "amber",
                          },
                          {
                            time: "No-show",
                            charge: "100% of fare",
                            color: "red",
                          },
                          {
                            time: "Airport pickups (3+ hours)",
                            charge: "No charge",
                            color: "green",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              item.color === "green"
                                ? "bg-green-50 border-green-200"
                                : item.color === "amber"
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-red-50 border-red-200"
                            }`}
                          >
                            <p className="font-medium text-gray-900">
                              {item.time}
                            </p>
                            <p
                              className={`text-sm ${
                                item.color === "green"
                                  ? "text-green-700"
                                  : item.color === "amber"
                                    ? "text-amber-700"
                                    : "text-red-700"
                              }`}
                            >
                              {item.charge}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Terms */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Payment Terms
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <CreditCard className="h-5 w-5 text-primary mr-3" />
                      <span className="text-gray-700">
                        We accept credit/debit cards, digital payments, and cash
                      </span>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl mr-3">🇦🇪</span>
                      <span className="text-gray-700">
                        All payments processed in UAE Dirhams (
                        {config.currencySymbol})
                      </span>
                    </div>

                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-primary mr-3" />
                      <span className="text-gray-700">
                        Payment receipts available upon request
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-blue-800 text-sm">
                      For international credit card payments, conversion rates
                      are determined by your card issuer.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* User Responsibilities */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    User Responsibilities
                  </h3>
                  <p className="text-gray-700 mb-6">
                    When using our services, users agree to:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Provide accurate personal and booking information",
                      "Treat drivers and vehicles with respect",
                      "Not engage in any illegal activities",
                      "Comply with UAE laws and regulations",
                      "Take responsibility for any vehicle damage",
                      "Not consume alcohol in vehicles",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Liability */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Liability
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        What We Cover
                      </h4>
                      <p className="text-green-700 text-sm">
                        First Class Fleet maintains comprehensive insurance for
                        all our vehicles in accordance with UAE traffic and
                        transport regulations.
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">
                        What We Don't Cover
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {[
                          "Delays caused by traffic conditions or road works",
                          "Loss or damage to passenger belongings",
                          "Failure to reach destinations due to circumstances beyond our control",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                            <span className="text-red-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Governing Law */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">7</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Governing Law
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      These Terms shall be governed and construed in accordance
                      with the laws of the United Arab Emirates. Any disputes
                      relating to these terms will be subject to the exclusive
                      jurisdiction of the courts of Dubai, UAE.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-8 border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Contact Us
                  </h3>
                  <p className="text-gray-700 mb-6">
                    If you have any questions about these Terms, please contact
                    us:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Email</p>
                          <p className="text-gray-600">
                            info@firstclassfleet.ae
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Phone</p>
                          <p className="text-gray-600">+971 4 XXX XXXX</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Address</p>
                          <p className="text-gray-600">
                            First Class Fleet
                            <br />
                            P.O. Box XXXXX
                            <br />
                            Dubai, United Arab Emirates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsAndConditions;
