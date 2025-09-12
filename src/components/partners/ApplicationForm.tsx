import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { applicationService } from "@/services/applicationService";
import { NewApplication } from "@/types";

export const ApplicationForm = () => {
  const [formData, setFormData] = useState<NewApplication>({
    companyName: "",
    country: "China",
    operatingRegion: "",
    phone: "+44 7400 123456",
    email: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof NewApplication | "acceptTerms",
    value: string | boolean
  ) => {
    if (field === "acceptTerms") {
      setAcceptTerms(value as boolean);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (error) {
      setError("");
    }
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!formData.operatingRegion.trim()) {
      setError("Operating region is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!acceptTerms) {
      setError("You must accept the terms");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setError("");

      try {
        const response = await applicationService.createApplication(formData);
        if (response.success) {
          toast.success(
            "Thank you! Your application has been submitted successfully."
          );
          // Reset form
          setFormData({
            companyName: "",
            country: "China",
            operatingRegion: "",
            phone: "+44 7400 123456",
            email: "",
          });
          setAcceptTerms(false);
        } else {
          setError(response.message || "Failed to submit application");
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        setError("Failed to submit application. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      id="application-form"
      className=" bg-white flex items-center justify-center px-4 py-20"
    >
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <h1 className="text-3xl font-bold text-black text-center mb-6">
            Registration
          </h1>

          {/* Informational Note */}
          <Alert className="bg-yellow-100 border-yellow-200 rounded-lg">
            <AlertDescription className="text-black">
              Please note: we only work with registered companies
            </AlertDescription>
          </Alert>

          {/* Company Name */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              disabled={isSubmitting}
              className="rounded-lg md:text-lg border-gray-300 disabled:opacity-50"
            />
          </div>

          {/* Country Dropdown */}
          <div className="space-y-2">
            <Select
              value={formData.country}
              onValueChange={(value) => handleInputChange("country", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="rounded-lg md:text-lg border-green-500 disabled:opacity-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="China">China</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Japan">Japan</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Brazil">Brazil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operating Region Dropdown */}
          <div className="space-y-2">
            <Select
              value={formData.operatingRegion}
              onValueChange={(value) =>
                handleInputChange("operatingRegion", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger className="rounded-lg md:text-lg border-gray-300 disabled:opacity-50">
                <SelectValue placeholder="Operating region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                <SelectItem value="Middle East">Middle East</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="South America">South America</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <Flag className="size-5 text-gray-600" />
              </div>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isSubmitting}
                className="pl-10 rounded-lg md:text-lg border-gray-300 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="e-mail"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isSubmitting}
              className="rounded-lg md:text-lg border-gray-300 disabled:opacity-50"
            />
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) =>
                  handleInputChange("acceptTerms", checked as boolean)
                }
                disabled={isSubmitting}
              />
              <Label htmlFor="terms" className="text-gray-700">
                I accept the terms of the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Public Offer
                </a>
              </Label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center bg-red-100 rounded-lg p-2">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-lg bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              "Submit application"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
