import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  CreditCard as CCIcon,
  Loader2,
} from "lucide-react";
import { CURRENCY } from "@/utils/currency";
import {
  getCCavenueSettings,
  saveCCavenueSettings,
  testCCavenueConnection,
} from "@/services/ccavenueService";

const AdminPaymentSettings = () => {
  const [activePaymentMethods, setActivePaymentMethods] = useState({
    creditCard: true,
    paypal: true,
    applePay: false,
    googlePay: false,
    cash: true,
    ccavenue: true,
  });

  const [payoutSchedule, setPayoutSchedule] = useState("weekly");
  const [isSaving, setIsSaving] = useState(false);
  const [ccavenueSettings, setCcavenueSettings] = useState({
    merchantId: "",
    accessCode: "",
    workingKey: "",
    mode: "test",
  });

  // Fetch CCAvenue settings on component mount
  useEffect(() => {
    const fetchCCavenueSettings = async () => {
      try {
        const response = await getCCavenueSettings();
        if (response.success) {
          setCcavenueSettings({
            merchantId: response.merchantId || "",
            accessCode: response.accessCode || "",
            workingKey: response.workingKey || "",
            mode: response.mode || "test",
          });
        }
      } catch (error) {
        console.error("Error fetching CCAvenue settings:", error);
      }
    };

    fetchCCavenueSettings();
  }, []);

  const handleTogglePaymentMethod = (method: string, enabled: boolean) => {
    setActivePaymentMethods((prev) => ({
      ...prev,
      [method]: enabled,
    }));

    toast.success(
      `${method} payment has been ${enabled ? "enabled" : "disabled"}`,
    );
  };

  const handleSavePayoutSettings = () => {
    toast.success("Payout settings updated successfully");
  };

  const handleTestConnection = async () => {
    try {
      setIsSaving(true);
      const response = await testCCavenueConnection(ccavenueSettings);
      if (response.success) {
        toast.success("CCAvenue connection test successful!");
      } else {
        toast.error(
          response.error ||
            "CCAvenue connection test failed. Please check your credentials.",
        );
      }
    } catch (error) {
      toast.error("Failed to test CCAvenue connection. Please try again.");
      console.error("Error testing CCAvenue connection:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntegrationSettings = async () => {
    try {
      setIsSaving(true);
      const response = await saveCCavenueSettings(ccavenueSettings);
      if (response.success) {
        toast.success("CCAvenue integration settings saved successfully");
      } else {
        toast.error(
          response.error ||
            "Failed to save CCAvenue settings. Please try again.",
        );
      }
    } catch (error) {
      toast.error("An error occurred while saving CCAvenue settings.");
      console.error("Error saving CCAvenue settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCcavenueSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout userType="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment Settings</h1>
        <p className="text-gray-500">
          Configure payment methods and payout schedules
        </p>
      </div>

      <Tabs defaultValue="methods">
        <TabsList className="mb-4">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="payouts">Driver Payouts</TabsTrigger>
          <TabsTrigger value="integration">Payment Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure which payment methods are available to your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Credit/Debit Card</h3>
                    <p className="text-sm text-gray-500">
                      Accept Visa, Mastercard, and other major cards
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.creditCard}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("creditCard", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <CCIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">CCAvenue</h3>
                    <p className="text-sm text-gray-500">
                      Accept payments via CCAvenue payment gateway
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.ccavenue}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("ccavenue", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 12V6H4V18H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 9H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 15L19 17L23 13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">PayPal</h3>
                    <p className="text-sm text-gray-500">
                      Allow customers to pay with PayPal
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.paypal}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("paypal", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 12H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 9V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Apple Pay</h3>
                    <p className="text-sm text-gray-500">
                      Accept payments via Apple Pay
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.applePay}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("applePay", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 12V6H4V18H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 9H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 15H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 13V17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Google Pay</h3>
                    <p className="text-sm text-gray-500">
                      Accept payments via Google Pay
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.googlePay}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("googlePay", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-md">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Cash</h3>
                    <p className="text-sm text-gray-500">
                      Allow customers to pay with cash
                    </p>
                  </div>
                </div>
                <Switch
                  checked={activePaymentMethods.cash}
                  onCheckedChange={(checked) =>
                    handleTogglePaymentMethod("cash", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Driver Payout Settings</CardTitle>
              <CardDescription>
                Configure how and when drivers receive their earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Payout Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`border rounded-lg p-4 cursor-pointer ${
                        payoutSchedule === "daily"
                          ? "border-booba-yellow bg-booba-yellow/10"
                          : ""
                      }`}
                      onClick={() => setPayoutSchedule("daily")}
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">Daily</h4>
                        {payoutSchedule === "daily" && (
                          <CheckCircle className="h-5 w-5 text-booba-yellow" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Process payouts every day
                      </p>
                    </div>

                    <div
                      className={`border rounded-lg p-4 cursor-pointer ${
                        payoutSchedule === "weekly"
                          ? "border-booba-yellow bg-booba-yellow/10"
                          : ""
                      }`}
                      onClick={() => setPayoutSchedule("weekly")}
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">Weekly</h4>
                        {payoutSchedule === "weekly" && (
                          <CheckCircle className="h-5 w-5 text-booba-yellow" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Process payouts every Monday
                      </p>
                    </div>

                    <div
                      className={`border rounded-lg p-4 cursor-pointer ${
                        payoutSchedule === "biweekly"
                          ? "border-booba-yellow bg-booba-yellow/10"
                          : ""
                      }`}
                      onClick={() => setPayoutSchedule("biweekly")}
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">Bi-Weekly</h4>
                        {payoutSchedule === "biweekly" && (
                          <CheckCircle className="h-5 w-5 text-booba-yellow" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Process payouts every other Monday
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">
                    Minimum Payout Amount
                  </h3>
                  <div className="flex items-center w-full max-w-xs">
                    <span className="bg-gray-100 border border-r-0 border-input px-3 py-2 rounded-l-md">
                      {CURRENCY.symbol}
                    </span>
                    <Input
                      type="number"
                      className="rounded-l-none"
                      placeholder="5.00"
                      defaultValue="5.00"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Earnings will accumulate until they reach this minimum
                    threshold before being paid out.
                  </p>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-4">Platform Fee</h3>
                  <div className="flex items-center w-full max-w-xs">
                    <Input type="number" placeholder="15" defaultValue="15" />
                    <span className="bg-gray-100 border border-l-0 border-input px-3 py-2 rounded-r-md">
                      %
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Percentage of each fare that the platform retains.
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90"
                    onClick={handleSavePayoutSettings}
                  >
                    Save Payout Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Gateway</CardTitle>
              <CardDescription>
                CCAvenue is integrated as your payment processor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 border rounded-lg p-4 border-primary bg-primary/10">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-md">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-medium">CCAvenue</h3>
                  <p className="text-xs text-gray-500">
                    Accept over 200 payment methods in India
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 ml-auto text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CCAvenue Integration</CardTitle>
              <CardDescription>
                Configure your CCAvenue payment gateway settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-green-700 text-sm">
                    CCAvenue is your active payment gateway.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      CCAvenue Merchant ID
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your merchant ID"
                      value={ccavenueSettings.merchantId}
                      onChange={(e) =>
                        handleInputChange("merchantId", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Code</label>
                    <Input
                      type="password"
                      placeholder="Enter your access code"
                      value={ccavenueSettings.accessCode}
                      onChange={(e) =>
                        handleInputChange("accessCode", e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Your credentials will be encrypted before storage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Working Key</label>
                    <Input
                      type="password"
                      placeholder="Enter your working key"
                      value={ccavenueSettings.workingKey}
                      onChange={(e) =>
                        handleInputChange("workingKey", e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500">
                      This is your encryption key provided by CCAvenue
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={ccavenueSettings.mode}
                      onChange={(e) =>
                        handleInputChange("mode", e.target.value)
                      }
                    >
                      <option value="test">Test Mode</option>
                      <option value="production">Production Mode</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Response URL</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Configure this URL in your CCAvenue merchant panel
                  </p>
                  <div className="bg-gray-50 p-3 rounded font-mono text-sm select-all">
                    https://yoursite.com/api/ccavenue/response
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    onClick={handleTestConnection}
                    className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>

                  <Button
                    onClick={handleSaveIntegrationSettings}
                    className="bg-primary text-white hover:bg-primary/90"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminPaymentSettings;
