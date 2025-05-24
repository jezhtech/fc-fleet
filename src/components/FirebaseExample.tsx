import { useState } from 'react';
import { where, orderBy, limit } from 'firebase/firestore';
import { 
  useFirestoreCollection, 
  useFirestoreDocument,
  useRealtimeDatabase,
  firestoreUtilities,
  databaseUtilities
} from '../hooks/useFirebase';

type User = {
  id?: string;
  name: string;
  email: string;
  role: string;
};

type Message = {
  id?: string;
  text: string;
  userId: string;
  timestamp: number;
};

export default function FirebaseExample() {
  // State for forms
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [messageText, setMessageText] = useState('');

  // Use Firestore collection hook
  const { 
    data: users, 
    loading: usersLoading, 
    error: usersError 
  } = useFirestoreCollection<User>('users', limit(10));

  // Use Firestore document hook for a specific user
  const { 
    data: currentUser, 
    loading: currentUserLoading 
  } = useFirestoreDocument<User>('users', 'current-user');

  // Use Realtime Database hook
  const { 
    data: messages, 
    loading: messagesLoading 
  } = useRealtimeDatabase<Record<string, Message>>('messages');

  // Handle user creation
  const handleCreateUser = async () => {
    if (!userName || !userEmail) return;
    
    const newUser: User = {
      name: userName,
      email: userEmail,
      role: userRole
    };
    
    try {
      const userId = await firestoreUtilities.addDocument('users', newUser);
      console.log('User created with ID:', userId);
      
      // Reset form
      setUserName('');
      setUserEmail('');
      setUserRole('user');
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Handle message creation
  const handleSendMessage = async () => {
    if (!messageText || !currentUser?.id) return;
    
    const newMessage = {
      text: messageText,
      userId: currentUser.id,
      timestamp: Date.now()
    };
    
    try {
      const messageId = await databaseUtilities.pushData('messages', newMessage);
      console.log('Message sent with ID:', messageId);
      
      // Reset form
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Database Example</h1>
      
      {/* User Creation Form */}
      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Create User (Firestore)</h2>
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            placeholder="Name" 
            className="p-2 border rounded"
          />
          <input 
            type="email" 
            value={userEmail} 
            onChange={(e) => setUserEmail(e.target.value)} 
            placeholder="Email" 
            className="p-2 border rounded"
          />
          <select 
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value)} 
            className="p-2 border rounded"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
          <button 
            onClick={handleCreateUser}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create User
          </button>
        </div>
      </div>
      
      {/* User List */}
      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Users List</h2>
        {usersLoading ? (
          <p>Loading users...</p>
        ) : usersError ? (
          <p className="text-red-500">Error loading users</p>
        ) : (
          <ul className="divide-y">
            {users.map((user) => (
              <li key={user.id} className="py-2">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </li>
            ))}
            {users.length === 0 && <p>No users found.</p>}
          </ul>
        )}
      </div>
      
      {/* Message Creation Form */}
      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Send Message (Realtime Database)</h2>
        <div className="flex flex-col gap-3">
          <textarea 
            value={messageText} 
            onChange={(e) => setMessageText(e.target.value)} 
            placeholder="Message" 
            className="p-2 border rounded min-h-20"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentUser || currentUserLoading}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            Send Message
          </button>
          {!currentUser && !currentUserLoading && (
            <p className="text-yellow-600">No current user found. Create a user first.</p>
          )}
        </div>
      </div>
      
      {/* Messages List */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-4">Messages</h2>
        {messagesLoading ? (
          <p>Loading messages...</p>
        ) : !messages ? (
          <p>No messages found.</p>
        ) : (
          <ul className="divide-y">
            {Object.entries(messages).map(([id, message]) => (
              <li key={id} className="py-2">
                <div className="font-medium">{message.text}</div>
                <div className="text-xs text-gray-500">
                  User ID: {message.userId} | 
                  Time: {new Date(message.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
            {Object.keys(messages).length === 0 && <p>No messages found.</p>}
          </ul>
        )}
      </div>
    </div>
  );
} 