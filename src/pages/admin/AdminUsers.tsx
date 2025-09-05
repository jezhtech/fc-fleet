import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Trash,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import type { User } from "@/types";

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load users from backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();

      if (response.success && response.data) {
        const usersData = response.data;

        // Sort users by creation date, newest first
        usersData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setUsers(usersData);
        filterUsers(usersData, searchTerm, activeTab);

        toast.success(`Loaded ${usersData.length} users`);
      } else {
        toast.error(response.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and active tab
  const filterUsers = (allUsers: User[], search: string, tab: string) => {
    let filtered = allUsers;

    // Filter by search term
    if (search) {
      filtered = filtered.filter(
        (user) =>
          `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.phone.includes(search),
      );
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
      const response = await userService.deleteUser(userToDelete.id);
      if (response.success) {
        setUsers(users.filter((user) => user.id !== userToDelete.id));
        setFilteredUsers(
          filteredUsers.filter((user) => user.id !== userToDelete.id),
        );
        toast.success(`User ${userToDelete.name} has been deleted`);
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
      } else {
        toast.error(
          response.message || `Failed to delete user ${userToDelete.name}`,
        );
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user ${userToDelete.name}`);
    }
  };

  // Handle new user form input
  const handleNewUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle form submission for new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!newUser.firstName) errors.firstName = "First name is required";
    if (!newUser.lastName) errors.lastName = "Last name is required";
    if (!newUser.email) errors.email = "Email is required";
    if (!newUser.phone) errors.phone = "Phone number is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newUser.email && !emailRegex.test(newUser.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (newUser.phone && !newUser.phone.startsWith("+")) {
      errors.phoneNumber = "Phone number must start with + and country code";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await userService.createUser(newUser);
      if (response.success && response.data) {
        toast.success("New user added successfully");
        setNewUser({ firstName: "", lastName: "", email: "", phone: "" });
        loadUsers(); // Refresh the user list
      } else {
        toast.error(response.message || "Failed to add new user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add new user");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <DashboardLayout userType="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
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
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleNewUserInput}
                    placeholder="John"
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleNewUserInput}
                    placeholder="Doe"
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUser.email}
                    onChange={handleNewUserInput}
                    placeholder="john@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={newUser.phone}
                    onChange={handleNewUserInput}
                    placeholder="+919876543210"
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.phoneNumber}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
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
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="h-12 px-4 text-left font-medium text-gray-500">
                      Name
                    </th>
                    <th className="h-12 px-4 text-left font-medium text-gray-500">
                      Email
                    </th>
                    <th className="h-12 px-4 text-left font-medium text-gray-500">
                      Phone
                    </th>
                    <th className="h-12 px-4 text-left font-medium text-gray-500">
                      Created
                    </th>
                    <th className="h-12 px-4 text-right font-medium text-gray-500">
                      Actions
                    </th>
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
                          <Badge className="ml-2 bg-purple-100 text-purple-800 capitalize hover:bg-purple-100">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{user.phone}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openDeleteConfirm(
                                user.id,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            disabled={user.role === "admin"}
                            title={
                              user.role === "admin"
                                ? "Admin users cannot be deleted"
                                : "Delete user"
                            }
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-24 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              Are you sure you want to delete{" "}
              <span className="font-medium">{userToDelete?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
