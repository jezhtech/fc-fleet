import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CountryCode {
  code: string;
  dial_code: string;
  flag: string;
  name: string;
}

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: CountryCode) => void;
}

const countryCodes: CountryCode[] = [
  { code: "AE", dial_code: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "IN", dial_code: "+91", flag: "🇮🇳", name: "India" },
  { code: "US", dial_code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "UK", dial_code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "SA", dial_code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "QA", dial_code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "KW", dial_code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "OM", dial_code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "BH", dial_code: "+973", flag: "🇧🇭", name: "Bahrain" },
];

// Auto-detect country code from phone number
export const detectCountryCode = (phoneNumber: string): string => {
  // Only detect country code if phone number starts with '+'
  if (!phoneNumber.startsWith("+")) return "+971"; // Default to UAE

  // Extract the digits after the plus sign
  const numberWithoutPlus = phoneNumber.substring(1);

  // Check for different country codes
  if (numberWithoutPlus.startsWith("971")) return "+971";
  if (numberWithoutPlus.startsWith("91")) return "+91";
  if (numberWithoutPlus.startsWith("1")) return "+1";
  if (numberWithoutPlus.startsWith("44")) return "+44";
  if (numberWithoutPlus.startsWith("966")) return "+966";
  if (numberWithoutPlus.startsWith("974")) return "+974";
  if (numberWithoutPlus.startsWith("965")) return "+965";
  if (numberWithoutPlus.startsWith("968")) return "+968";
  if (numberWithoutPlus.startsWith("973")) return "+973";

  // Default to UAE
  return "+971";
};

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value,
  onChange,
  onCountryChange,
}) => {
  // Find current country based on dial code
  const findCountryByDialCode = (dialCode: string): CountryCode => {
    return (
      countryCodes.find((country) => country.dial_code === dialCode) ||
      countryCodes[0]
    );
  };

  // Handle country change
  const handleCountryChange = (dialCode: string) => {
    onChange(dialCode);

    if (onCountryChange) {
      onCountryChange(findCountryByDialCode(dialCode));
    }
  };

  return (
    <Select value={value} onValueChange={handleCountryChange}>
      <SelectTrigger className="w-24">
        <SelectValue placeholder={value || countryCodes[0].dial_code} />
      </SelectTrigger>
      <SelectContent>
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.dial_code}>
            <div className="flex items-center">
              <span className="mr-2">{country.flag}</span>
              <span>{country.dial_code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountryCodeSelect;
