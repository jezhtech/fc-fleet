import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, UserPlus, Mail, Phone, Edit, Trash, RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

// User type definition
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isVerified: boolean;
  isAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive' | 'blocked';
  rides?: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Load users from Firestore
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersData: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as Omit<User, 'id'>;
        
        // Determine status based on verification and existing status field
        let status: 'active' | 'inactive' | 'blocked';
        
        // If status is already set in the database, use it
        if (userData.status === 'active' || userData.status === 'inactive' || userData.status === 'blocked') {
          status = userData.status;
        } else {
          // Otherwise, determine based on isVerified
          status = userData.isVerified ? 'active' : 'inactive';
        }
        
        // Add user to array with formatted data
        usersData.push({
          id: doc.id,
          ...userData,
          status,
          rides: 0, // Default value, update if you have a rides collection
          firstName: userData.firstName || 'Unknown',
          lastName: userData.lastName || 'User',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        });
      });
      
      // Sort users by creation date, newest first
      usersData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setUsers(usersData);
      filterUsers(usersData, searchTerm, activeTab);
      
      toast.success(`Loaded ${usersData.length} users`);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users based on search term and active tab
  const filterUsers = (allUsers: User[], search: string, tab: string) => {
    let filtered = allUsers;
    
    // Filter by search term
    if (search) {
      filtered = filtered.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phoneNumber.includes(search)
      );
    }
    
    // Filter by tab
    if (tab !== 'all') {
      filtered = filtered.filter(user => user.status === tab);
    }
    
    setFilteredUsers(filtered);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterUsers(users, value, activeTab);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    filterUsers(users, searchTerm, value);
  };
  
  // Open delete confirmation dialog
  const openDeleteConfirm = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteConfirmOpen(true);
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', userToDelete.id));
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userToDelete.id));
      toast.success(`User ${userToDelete.name} has been deleted`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user ${userToDelete.name}`);
    }
  };
  
  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'blocked') => {
    try {
      // Update Firestore - set appropriate fields based on status
      const userRef = doc(firestore, 'users', userId);
      let updateData: Record<string, any> = {
        updatedAt: new Date().toISOString()
      };
      
      // Set proper fields based on status
      if (newStatus === 'active') {
        updateData.isVerified = true;
        updateData.status = 'active';
      } else if (newStatus === 'inactive') {
        updateData.isVerified = false;
        updateData.status = 'inactive';
      } else if (newStatus === 'blocked') {
        updateData.isVerified = false;
        updateData.status = 'blocked';
      }
      
      await updateDoc(userRef, updateData);
      
      // Update local state
      const updatedUsers = users.map(user => 
        user.id === userId ? {...user, status: newStatus, isVerified: newStatus === 'active'} : user
      );
      setUsers(updatedUsers);
      filterUsers(updatedUsers, searchTerm, activeTab);
      
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };
  
  // Check for duplicate email or phone
  const checkDuplicates = async (email: string, phoneNumber: string): Promise<boolean> => {
    try {
      let errors: {[key: string]: string} = {};
      let hasDuplicates = false;
      
      // Check duplicate email
      if (email) {
        const emailQuery = query(collection(firestore, 'users'), where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          errors.email = 'This email is already registered';
          hasDuplicates = true;
        }
      }
      
      // Check duplicate phone
      if (phoneNumber) {
        const phoneQuery = query(collection(firestore, 'users'), where('phoneNumber', '==', phoneNumber));
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
          errors.phoneNumber = 'This phone number is already registered';
          hasDuplicates = true;
        }
      }
      
      setFormErrors(errors);
      return hasDuplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error('Error checking for duplicate information');
      return true;
    }
  };
  
  // Handle new user form input
  const handleNewUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle form submission for new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    let errors: {[key: string]: string} = {};
    if (!newUser.firstName) errors.firstName = 'First name is required';
    if (!newUser.lastName) errors.lastName = 'Last name is required';
    if (!newUser.email) errors.email = 'Email is required';
    if (!newUser.phoneNumber) errors.phoneNumber = 'Phone number is required';
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newUser.email && !emailRegex.test(newUser.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone format validation
    if (newUser.phoneNumber && !newUser.phoneNumber.startsWith('+')) {
      errors.phoneNumber = 'Phone number must start with + and country code';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Check for duplicates
    const hasDuplicates = await checkDuplicates(newUser.email, newUser.phoneNumber);
    if (hasDuplicates) return;
    
    // TODO: Implement save new user functionality
    toast.success('New user added successfully');
    
    // Reset form
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: ''
    });
  };
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-fleet-red hover:bg-fleet-red/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                <div>
                  <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                  <Input 
                    id="firstName" 
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleNewUserInput}
                    placeholder="John" 
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.firstName}</p>
                  )}
                </div>
              <div>
                  <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                  <Input 
                    id="lastName" 
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleNewUserInput}
                    placeholder="Doe" 
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.lastName}</p>
                  )}
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    value={newUser.email}
                    onChange={handleNewUserInput}
                    placeholder="john@example.com" 
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                  )}
              </div>
              <div>
                  <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</label>
                  <Input 
                    id="phoneNumber" 
                    name="phoneNumber"
                    value={newUser.phoneNumber}
                    onChange={handleNewUserInput}
                    placeholder="+919876543210" 
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.phoneNumber}</p>
                  )}
              </div>
              <Button type="submit" className="w-full bg-fleet-red hover:bg-fleet-red/90">
                Add User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
            <p className="text-sm text-gray-500">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'inactive').length}</div>
            <p className="text-sm text-gray-500">Inactive Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'blocked').length}</div>
            <p className="text-sm text-gray-500">Blocked Users</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Users</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Name</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Contact</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Status</th>
                        <th className="h-12 px-4 text-left font-medium text-gray-500">Created</th>
                        <th className="h-12 px-4 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center items-center h-full">
                              <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                              Loading users...
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-4 font-medium">
                              {user.firstName} {user.lastName}
                              {user.isAdmin && (
                                <Badge className="ml-2 bg-purple-100 text-purple-800">Admin</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-sm">{user.phoneNumber}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center">
                              <Badge className={`
                                ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}
                              `}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </Badge>
                                <div className="relative ml-2 group">
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <div className={`absolute ${index >= filteredUsers.length - 3 ? 'bottom-full mb-1' : 'top-full mt-1'} right-0 hidden group-hover:block bg-white shadow-lg rounded-md p-2 z-10 min-w-[120px]`}>
                                    <button 
                                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded-sm text-green-600"
                                      onClick={() => handleStatusChange(user.id, 'active')}
                                    >
                                      Set Active
                                    </button>
                                    <button 
                                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded-sm text-yellow-600"
                                      onClick={() => handleStatusChange(user.id, 'inactive')}
                                    >
                                      Set Inactive
                                    </button>
                                    <button 
                                      className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded-sm text-red-600"
                                      onClick={() => handleStatusChange(user.id, 'blocked')}
                                    >
                                      Block User
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openDeleteConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                                disabled={user.isAdmin}
                                title={user.isAdmin ? "Admin users cannot be deleted" : "Delete user"}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="h-24 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium">{userToDelete?.name}</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
