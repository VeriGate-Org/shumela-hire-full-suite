import React, { useState } from 'react';
import Link from 'next/link';
import { UserRole, ROLE_DISPLAY_NAMES } from '../contexts/AuthContext';

interface UserProfileProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Default user if none provided
  const currentUser = user || {
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'HR_MANAGER'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems = [
    {
      label: 'Profile',
      href: '/profile',
      icon: '👤',
      description: 'View and edit your profile'
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: '⚙️',
      description: 'Manage your preferences'
    },
    {
      label: 'Help Center',
      href: '/help',
      icon: '❓',
      description: 'Get help and support'
    },
    {
      label: 'Keyboard Shortcuts',
      href: '/shortcuts',
      icon: '⌨️',
      description: 'View available shortcuts'
    }
  ];

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:ring-offset-2 transition-colors"
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getInitials(currentUser.name)}
            </div>
          )}
        </div>

        {/* User Info - Hidden on mobile */}
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {currentUser.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {ROLE_DISPLAY_NAMES[currentUser.role as UserRole] || currentUser.role}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <div className="flex-shrink-0 hidden md:block">
          <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div
            role="menu"
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-violet-500 rounded-full flex items-center justify-center text-white font-medium">
                    {getInitials(currentUser.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {ROLE_DISPLAY_NAMES[currentUser.role as UserRole] || currentUser.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Sign Out */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Handle sign out logic here
                  console.log('Sign out clicked');
                }}
                role="menuitem"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg text-red-500">🚪</span>
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Sign Out
                    </p>
                    <p className="text-xs text-gray-500">
                      Sign out of your account
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Version 2.1.0</span>
                <div className="flex items-center space-x-3">
                  <Link href="/privacy" className="hover:text-gray-700">
                    Privacy
                  </Link>
                  <Link href="/terms" className="hover:text-gray-700">
                    Terms
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
