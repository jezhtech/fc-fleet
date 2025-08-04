
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const DriverSettings = () => {
  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };
  
  return (
    <DashboardLayout userType="driver">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="account">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64">
            <TabsList className="flex flex-col w-full rounded-md bg-muted p-1 h-auto">
              <TabsTrigger 
                value="account" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                Account Settings
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="justify-start px-4 py-3 data-[state=active]:bg-white"
              >
                Ride Preferences
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
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="text-sm font-medium">Current Password</label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Password')}
                    >
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Email Address</CardTitle>
                  <CardDescription>
                    Update your email address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="currentEmail" className="text-sm font-medium">Current Email</label>
                      <Input id="currentEmail" type="email" defaultValue="michael@example.com" disabled />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="newEmail" className="text-sm font-medium">New Email</label>
                      <Input id="newEmail" type="email" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">Confirm with Password</label>
                      <Input id="password" type="password" />
                    </div>
                    <Button 
                      type="button" 
                      className="bg-fleet-red hover:bg-fleet-red/90"
                      onClick={() => handleSave('Email')}
                    >
                      Update Email
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Delete Account</CardTitle>
                  <CardDescription>
                    Permanently delete your account and all data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Deleting your account will remove all personal information, ride history, and earnings data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => toast.error('Account deletion requires additional verification. Please contact support.')}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ride Preferences</CardTitle>
                  <CardDescription>
                    Configure your ride settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Auto-Accept Rides</label>
                        <p className="text-sm text-gray-500">Automatically accept incoming ride requests</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Long Distance Rides</label>
                        <p className="text-sm text-gray-500">Receive ride requests for trips over 30 miles</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Airport Pickups</label>
                        <p className="text-sm text-gray-500">Receive ride requests from airports</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <label htmlFor="maxDistance" className="text-sm font-medium">Maximum Pickup Distance (miles)</label>
                      <Input id="maxDistance" type="number" defaultValue="15" min="1" max="50" />
                      <p className="text-xs text-gray-500">Maximum distance you're willing to travel for pickup</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="preferredAreas" className="text-sm font-medium">Preferred Service Areas</label>
                      <select id="preferredAreas" className="w-full border rounded-md p-2" multiple>
                        <option value="manhattan">Manhattan</option>
                        <option value="brooklyn">Brooklyn</option>
                        <option value="queens">Queens</option>
                        <option value="bronx">Bronx</option>
                        <option value="statenIsland">Staten Island</option>
                      </select>
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('Ride preferences')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Scheduling</CardTitle>
                  <CardDescription>
                    Set your availability for rides
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">Available Days</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="monday" defaultChecked />
                            <label htmlFor="monday" className="text-sm">Monday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="tuesday" defaultChecked />
                            <label htmlFor="tuesday" className="text-sm">Tuesday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="wednesday" defaultChecked />
                            <label htmlFor="wednesday" className="text-sm">Wednesday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="thursday" defaultChecked />
                            <label htmlFor="thursday" className="text-sm">Thursday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="friday" defaultChecked />
                            <label htmlFor="friday" className="text-sm">Friday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="saturday" defaultChecked />
                            <label htmlFor="saturday" className="text-sm">Saturday</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="sunday" />
                            <label htmlFor="sunday" className="text-sm">Sunday</label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm mb-2">Available Hours</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm">Start Time</label>
                            <Input type="time" defaultValue="08:00" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm">End Time</label>
                            <Input type="time" defaultValue="20:00" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('Scheduling')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>App Notifications</CardTitle>
                  <CardDescription>
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">New Ride Requests</label>
                        <p className="text-sm text-gray-500">Receive notifications for new ride requests</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Ride Updates</label>
                        <p className="text-sm text-gray-500">Receive notifications for ride changes or cancellations</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Payment Notifications</label>
                        <p className="text-sm text-gray-500">Receive notifications when payments are processed</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">System Announcements</label>
                        <p className="text-sm text-gray-500">Receive important system announcements</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Promotions and Offers</label>
                        <p className="text-sm text-gray-500">Receive notifications about promotions and special offers</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('App notification')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription>
                    Configure how we communicate with you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Email Updates</label>
                        <p className="text-sm text-gray-500">Receive important updates via email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">SMS Notifications</label>
                        <p className="text-sm text-gray-500">Receive important updates via SMS</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Weekly Earnings Summary</label>
                        <p className="text-sm text-gray-500">Receive weekly summary of your earnings</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Marketing Communications</label>
                        <p className="text-sm text-gray-500">Receive marketing emails and promotions</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('Communication preferences')}
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
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Enable Two-Factor Authentication</label>
                        <p className="text-sm text-gray-500">Secure your account with 2FA</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Verification Method</h3>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="sms" name="verification" defaultChecked />
                        <label htmlFor="sms" className="text-sm">SMS</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="radio" id="app" name="verification" />
                        <label htmlFor="app" className="text-sm">Authenticator App</label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="phone2fa" className="text-sm font-medium">Phone Number for 2FA</label>
                      <Input id="phone2fa" defaultValue="+1 (555) 123-4567" />
                    </div>
                    
                    <Button 
                      className="bg-fleet-red hover:bg-fleet-red/90 mt-4"
                      onClick={() => handleSave('Two-factor authentication')}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Login Sessions</CardTitle>
                  <CardDescription>
                    Manage your active login sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">Current Session</h3>
                          <p className="text-xs text-gray-500">New York, United States</p>
                          <p className="text-xs text-gray-500">IP: 192.168.1.1</p>
                        </div>
                        <div className="text-xs text-green-600">Active Now</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">Mobile App - iPhone 13</h3>
                          <p className="text-xs text-gray-500">New York, United States</p>
                          <p className="text-xs text-gray-500">Last active: 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm">Log Out</Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      variant="destructive"
                      onClick={() => toast.success('Successfully logged out from all other devices')}
                    >
                      Log Out from All Other Devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </DashboardLayout>
  );
};

export default DriverSettings;
