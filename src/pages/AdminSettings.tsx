
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const AdminSettings = () => {
  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="general">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <TabsList className="flex flex-col w-full rounded-md bg-muted p-1 h-auto">
              <TabsTrigger 
                value="general" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                General Settings
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                API Integration
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                Billing
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                      <Input id="companyName" defaultValue="First Class Fleet" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Contact Email</label>
                      <Input id="email" type="email" defaultValue="contact@firstclassfleet.com" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">Contact Phone</label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium">Address</label>
                      <Input id="address" defaultValue="123 Transport Street, City, Country" />
                    </div>
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Company')}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Regional Settings</CardTitle>
                  <CardDescription>
                    Configure your region-specific settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
                      <select id="timezone" className="w-full border rounded-md p-2">
                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                        <option value="UTC+0">Greenwich Mean Time (UTC+0)</option>
                        <option value="UTC+1">Central European Time (UTC+1)</option>
                        <option value="UTC+5:30">Indian Standard Time (UTC+5:30)</option>
                        <option value="UTC+8">China Standard Time (UTC+8)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="currency" className="text-sm font-medium">Currency</label>
                      <select id="currency" className="w-full border rounded-md p-2">
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="JPY">Japanese Yen (JPY)</option>
                        <option value="AUD">Australian Dollar (AUD)</option>
                        <option value="CAD">Canadian Dollar (CAD)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="dateFormat" className="text-sm font-medium">Date Format</label>
                      <select id="dateFormat" className="w-full border rounded-md p-2">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Regional')}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>
                    Configure when and how email notifications are sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Booking Confirmations</label>
                        <p className="text-sm text-gray-500">Send confirmation emails when bookings are made</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Booking Updates</label>
                        <p className="text-sm text-gray-500">Send emails when booking status changes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Reminders</label>
                        <p className="text-sm text-gray-500">Send booking reminders 24 hours before pickup</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Driver Assignments</label>
                        <p className="text-sm text-gray-500">Send notifications when drivers are assigned</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Marketing Emails</label>
                        <p className="text-sm text-gray-500">Send promotional and newsletter emails</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('Email notification')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>SMS Notifications</CardTitle>
                  <CardDescription>
                    Configure SMS alerts and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Driver Arrival</label>
                        <p className="text-sm text-gray-500">Send SMS when driver is approaching pickup location</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Booking Confirmations</label>
                        <p className="text-sm text-gray-500">Send SMS confirmations for bookings</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Reminders</label>
                        <p className="text-sm text-gray-500">Send SMS reminders before pickup</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('SMS notification')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password Policy</CardTitle>
                  <CardDescription>
                    Configure password requirements for users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="minLength" className="text-sm font-medium">Minimum Password Length</label>
                      <Input id="minLength" type="number" defaultValue="8" min="6" max="20" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="requireUppercase" defaultChecked />
                      <label htmlFor="requireUppercase" className="text-sm">Require uppercase letter</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="requireNumber" defaultChecked />
                      <label htmlFor="requireNumber" className="text-sm">Require number</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="requireSpecial" defaultChecked />
                      <label htmlFor="requireSpecial" className="text-sm">Require special character</label>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="passwordExpiry" className="text-sm font-medium">Password Expiry (days)</label>
                      <Input id="passwordExpiry" type="number" defaultValue="90" min="0" />
                      <p className="text-xs text-gray-500">Set to 0 for no expiry</p>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Password policy')}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Configure 2FA settings for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Require 2FA for Admins</label>
                        <p className="text-sm text-gray-500">Enforce two-factor authentication for admin users</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Require 2FA for All Users</label>
                        <p className="text-sm text-gray-500">Enforce two-factor authentication for all users</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('2FA settings')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for external integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Production API Key</h3>
                          <p className="text-sm text-gray-500">Last used: 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Input type="password" value="••••••••••••••••••••••••" readOnly />
                        <Button variant="outline" size="sm">Show</Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Development API Key</h3>
                          <p className="text-sm text-gray-500">Last used: Yesterday</p>
                        </div>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Input type="password" value="••••••••••••••••••••••••" readOnly />
                        <Button variant="outline" size="sm">Show</Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('API settings')}
                    >
                      Create New API Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhook endpoints to receive events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Booking Webhook</h3>
                          <p className="text-sm text-gray-500">Receives booking events</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-500">Delete</Button>
                        </div>
                      </div>
                      <p className="text-sm mt-2">URL: https://api.example.com/webhooks/bookings</p>
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Webhook settings')}
                    >
                      Add Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Processor</CardTitle>
                  <CardDescription>
                    Configure your payment gateway settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="gateway" className="text-sm font-medium">Payment Gateway</label>
                      <select id="gateway" className="w-full border rounded-md p-2">
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="razorpay">Razorpay</option>
                        <option value="braintree">Braintree</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="apiKey" className="text-sm font-medium">API Key</label>
                      <Input id="apiKey" type="password" defaultValue="sk_test_12345678901234567890" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="secretKey" className="text-sm font-medium">Secret Key</label>
                      <Input id="secretKey" type="password" defaultValue="sk_live_12345678901234567890" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Test Mode</label>
                        <p className="text-sm text-gray-500">Process payments in test mode</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Payment processor')}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Settings</CardTitle>
                  <CardDescription>
                    Configure invoice generation and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="invoicePrefix" className="text-sm font-medium">Invoice Prefix</label>
                      <Input id="invoicePrefix" defaultValue="INV-" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="invoiceDueDays" className="text-sm font-medium">Due Period (days)</label>
                      <Input id="invoiceDueDays" type="number" defaultValue="30" min="1" />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="taxRate" className="text-sm font-medium">Tax Rate (%)</label>
                      <Input id="taxRate" type="number" step="0.01" defaultValue="8.75" min="0" max="100" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Auto-generate Invoices</label>
                        <p className="text-sm text-gray-500">Automatically create invoices for bookings</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Invoice settings')}
                    >
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminSettings;
