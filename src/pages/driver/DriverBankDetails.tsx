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
import { toast } from "sonner";
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

interface BankInfo {
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: "checking" | "savings";
}

const DriverBankDetails = () => {
  const { currentUser } = useAuth();
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const response = await userService.getDriverBankDetails();
        if (response.success && response.data) {
          setBankInfo(response.data);
        } else {
          toast.error(response.message || "Failed to load bank details");
        }
      } catch (error) {
        console.error("Error fetching bank details:", error);
        toast.error("Failed to load bank details");
      } finally {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankInfo) return;

    try {
      const response = await userService.updateDriverBankDetails(bankInfo);
      if (response.success) {
        toast.success("Bank details updated successfully!");
        setEditing(false);
      } else {
        toast.error(response.message || "Failed to update bank details");
      }
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error("Failed to update bank details");
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="driver">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fleet-red" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="driver">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bank Account Details</h1>
        <p className="text-gray-600">
          Manage your payout bank account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Bank Account Information</CardTitle>
            <CardDescription>
              Your earnings will be deposited into this account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!editing ? (
                bankInfo ? (
                  <>
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Account Holder Name
                        </div>
                        <div className="font-medium">
                          {bankInfo.accountHolderName}
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Verified
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Account Number
                        </div>
                        <div className="font-medium">
                          ••••••••{bankInfo.accountNumber.slice(-4)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Routing Number
                        </div>
                        <div className="font-medium">
                          ••••••••{bankInfo.routingNumber.slice(-4)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <div className="text-sm text-gray-500">Bank Name</div>
                        <div className="font-medium">{bankInfo.bankName}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Account Type
                        </div>
                        <div className="font-medium capitalize">
                          {bankInfo.accountType}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setEditing(true)}
                      className="w-full bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90 mt-4"
                    >
                      Edit Bank Details
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No bank details found.</p>
                    <Button onClick={() => setEditing(true)} className="mt-4">
                      Add Bank Details
                    </Button>
                  </div>
                )
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="accountHolderName"
                      className="text-sm font-medium"
                    >
                      Account Holder Name
                    </label>
                    <Input
                      id="accountHolderName"
                      value={bankInfo?.accountHolderName || ""}
                      onChange={(e) =>
                        setBankInfo((prev) =>
                          prev
                            ? { ...prev, accountHolderName: e.target.value }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="accountNumber"
                      className="text-sm font-medium"
                    >
                      Account Number
                    </label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter full account number"
                      value={bankInfo?.accountNumber || ""}
                      onChange={(e) =>
                        setBankInfo((prev) =>
                          prev
                            ? { ...prev, accountNumber: e.target.value }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="routingNumber"
                      className="text-sm font-medium"
                    >
                      Routing Number
                    </label>
                    <Input
                      id="routingNumber"
                      placeholder="Enter routing number"
                      value={bankInfo?.routingNumber || ""}
                      onChange={(e) =>
                        setBankInfo((prev) =>
                          prev
                            ? { ...prev, routingNumber: e.target.value }
                            : null,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bankName" className="text-sm font-medium">
                      Bank Name
                    </label>
                    <Input
                      id="bankName"
                      value={bankInfo?.bankName || ""}
                      onChange={(e) =>
                        setBankInfo((prev) =>
                          prev ? { ...prev, bankName: e.target.value } : null,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="accountType"
                      className="text-sm font-medium"
                    >
                      Account Type
                    </label>
                    <select
                      id="accountType"
                      value={bankInfo?.accountType || "checking"}
                      onChange={(e) =>
                        setBankInfo((prev) =>
                          prev
                            ? {
                                ...prev,
                                accountType: e.target.value as
                                  | "checking"
                                  | "savings",
                              }
                            : null,
                        )
                      }
                      className="w-full border border-input bg-background p-2 rounded-md"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-booba-yellow text-booba-dark hover:bg-booba-yellow/90"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245.75</div>
              <p className="text-sm text-gray-500 mb-2">
                Will be deposited on May 8, 2025
              </p>
              <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-green-700 text-xs">
                  Scheduled for automatic deposit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="text-sm font-medium">$372.50</div>
                    <div className="text-xs text-gray-500">Apr 29, 2025</div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Complete
                  </div>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="text-sm font-medium">$285.25</div>
                    <div className="text-xs text-gray-500">Apr 22, 2025</div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Complete
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">$310.80</div>
                    <div className="text-xs text-gray-500">Apr 15, 2025</div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Complete
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-2 text-xs">
                  View All Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverBankDetails;
