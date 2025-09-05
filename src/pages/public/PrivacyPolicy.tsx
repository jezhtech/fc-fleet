import React from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Mail, Phone, MapPin } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-red-600 to-fleet-accent py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              How we handle and protect your information with the highest
              standards of security and transparency
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
                First Class Fleet Privacy Policy
              </h2>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Last updated: May 8, 2025</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>UAE PDPL Compliant</span>
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
                      First Class Fleet ("we", "our", or "us") is committed to
                      protecting your privacy. This Privacy Policy explains how
                      we collect, use, disclose, and safeguard your information
                      when you use our services in the United Arab Emirates.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      By using our services, you consent to the data practices
                      described in this policy. We operate in accordance with
                      the UAE Federal Decree-Law No. (45) of 2021 regarding the
                      Protection of Personal Data (PDPL) and other applicable
                      UAE data protection laws.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Information We Collect */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Information We Collect
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-primary" />
                        Personal Information
                      </h4>
                      <ul className="space-y-3">
                        {[
                          "Contact information (name, email address, phone number)",
                          "Emirates ID information (for certain services)",
                          "Billing information and payment details",
                          "Pick-up and drop-off locations",
                          "Travel preferences",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        Technical Information
                      </h4>
                      <ul className="space-y-3">
                        {[
                          "Device information (device type, OS, browser)",
                          "IP address and network data",
                          "Usage data and app interaction",
                          "Location data (with your permission)",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* How We Use Information */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    How We Use Your Information
                  </h3>
                  <p className="text-gray-700 mb-6">
                    We use the information we collect to:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Provide and maintain our services",
                      "Process and complete transactions",
                      "Send you service-related communications",
                      "Improve our services and develop new features",
                      "Provide customer support",
                      "Comply with UAE legal requirements",
                      "Prevent fraud and enhance security",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-blue-800 text-sm">
                      In accordance with UAE law, we will only use your personal
                      information for the purposes for which we collected it,
                      unless we reasonably consider that we need to use it for
                      another reason compatible with the original purpose.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Data Security */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Data Security
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      We implement appropriate security measures to protect your
                      personal information from unauthorized access, alteration,
                      disclosure, or destruction. These measures comply with UAE
                      data protection standards.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      While we use commercially reasonable efforts to protect
                      your personal information, no method of transmission over
                      the Internet or electronic storage is 100% secure.
                      Therefore, we cannot guarantee absolute security.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Your Rights */}
            <Card className="p-8 border-0 shadow-lg">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Your Rights
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Under UAE data protection laws, you have rights regarding
                    your personal information, including:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "The right to access your personal information",
                      "The right to request correction of your data",
                      "The right to request deletion of your data",
                      "The right to object to processing",
                      "The right to data portability",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <p className="text-amber-800 text-sm">
                      To exercise these rights, please contact us using the
                      details provided below.
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
                    If you have questions about this Privacy Policy, please
                    contact us:
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
                            privacy@firstclassfleet.ae
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

export default PrivacyPolicy;
