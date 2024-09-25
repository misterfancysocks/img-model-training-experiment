'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Define a type for our user
type User = {
  id: number;
  firstName: string;
  lastName: string;
};

const Header = () => {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
        console.log('Fetched users:', fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, [toast]);

  // This is a placeholder. You'll need to implement actual auth logic later.
  const isLoggedIn = true;

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Costumes App
        </Link>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link
              href="/upload-and-crop"
              className={`hover:text-gray-300 ${
                pathname === '/upload-and-crop' ? 'underline' : ''
              }`}
            >
              Upload & Crop
            </Link>
          </li>
          <li>
            <Link
              href="/pre-processing"
              className={`hover:text-gray-300 ${
                pathname === '/pre-processing' ? 'underline' : ''
              }`}
            >
              Pre-processing
            </Link>
          </li>
          <li>
            <Link
              href="/lora-training"
              className={`hover:text-gray-300 ${
                pathname === '/lora-training' ? 'underline' : ''
              }`}
            >
              LoRA Training
            </Link>
          </li>
          <li>
            <Link
              href="/image-generation"
              className={`hover:text-gray-300 ${
                pathname === '/image-generation' ? 'underline' : ''
              }`}
            >
              Image Generation
            </Link>
          </li>
          <li className="relative">
            {isLoggedIn ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center hover:text-gray-300"
                >
                  {selectedUser 
                    ? `${selectedUser.firstName} ${selectedUser.lastName} (ID: ${selectedUser.id})`
                    : 'Select User'}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 max-h-60 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDropdownOpen(false);
                          localStorage.setItem('selectedUserId', user.id.toString());
                          console.log('Selected user:', user);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {`${user.firstName} ${user.lastName} (ID: ${user.id})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hover:text-gray-300"
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;