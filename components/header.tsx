'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Ghost } from 'lucide-react';

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
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-orange-900 to-black text-white flex items-center justify-between px-4 shadow-md z-50">
      <div className="flex items-center">
        <Ghost className="h-6 w-6 mr-2 text-white" />
        <span className="text-xl text-white font-bold">halloweencostu.me</span>
      </div>
      <nav className="flex items-center space-x-4">
        <Link href="/" className={`hover:text-orange-300 ${pathname === '/' ? 'font-bold text-orange-200' : ''}`}>
          Home
        </Link>
        <Link href="/upload-and-crop" className={`hover:text-orange-300 ${pathname === '/upload-and-crop' ? 'font-bold text-orange-200' : ''}`}>
          Upload & Crop
        </Link>
        <Link href="/person-setup" className={`hover:text-orange-300 ${pathname === '/person-setup' ? 'font-bold text-orange-200' : ''}`}>
          Person Setup
        </Link>
        <Link href="/pre-processing" className={`hover:text-orange-300 ${pathname === '/pre-processing' ? 'font-bold text-orange-200' : ''}`}>
          Pre-processing
        </Link>
        <Link href="/lora-training" className={`hover:text-orange-300 ${pathname === '/lora-training' ? 'font-bold text-orange-200' : ''}`}>
          LoRA Training
        </Link>
        <Link href="/image-generation" className={`hover:text-orange-300 ${pathname === '/image-generation' ? 'font-bold text-orange-200' : ''}`}>
          Image Generation
        </Link>
        {isLoggedIn && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 text-orange-100 hover:text-orange-300"
            >
              <span>{selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Select User'}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-orange-800 rounded-md shadow-lg py-1 z-10">
                {users.map((user) => (
                  <button
                    key={user.id}
                    className="block w-full text-left px-4 py-2 text-sm text-orange-100 hover:bg-orange-700"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDropdownOpen(false);
                      localStorage.setItem('selectedUserId', user.id.toString());
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;