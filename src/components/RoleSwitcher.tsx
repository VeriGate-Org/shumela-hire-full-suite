'use client';

import React, { useState } from 'react';
import { useAuth, UserRole, ALL_ROLES, ROLE_DISPLAY_NAMES } from '../contexts/AuthContext';
import { roleConfigurations } from '../config/roleConfig';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface RoleSwitcherProps {
  compact?: boolean;
}

export default function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;
  if (user.role !== 'ADMIN' && !(user as any).originalRole) return null;

  const roles = ALL_ROLES;
  const currentRoleConfig = roleConfigurations[user.role];

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          <span className="mr-2">{currentRoleConfig.logo}</span>
          <span className="flex-1 text-left truncate">{ROLE_DISPLAY_NAMES[user.role]}</span>
          <ChevronDownIcon className="w-4 h-4 ml-1" />
        </button>

        {isOpen && (
          <div className="absolute right-0 z-60 w-48 mt-1 bg-white border border-gray-200 rounded-sm shadow-lg">
            <div className="py-1">
              {roles.map((role) => {
                const roleConfig = roleConfigurations[role];
                const isActive = role === user.role;
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`
                      flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50
                      ${isActive ? 'bg-gold-50 text-violet-700' : 'text-gray-700'}
                    `}
                  >
                    <span className="mr-3">{roleConfig.logo}</span>
                    <span className="flex-1 text-left">{ROLE_DISPLAY_NAMES[role]}</span>
                    {isActive && <CheckIcon className="w-4 h-4 text-gold-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-gray-200">
      <div className="mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Switch Role</p>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-sm shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all duration-200"
        >
          <span className="mr-3 text-lg">{currentRoleConfig.logo}</span>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900">{ROLE_DISPLAY_NAMES[user.role]}</p>
            <p className="text-xs text-gray-500 truncate">{currentRoleConfig.description.split('.')[0]}</p>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Overlay to close dropdown when clicking outside */}
            <div 
              className="fixed inset-0 z-50" 
              onClick={() => setIsOpen(false)}
            />
            
            <div className="absolute left-0 right-0 z-60 mt-1 bg-white border border-gray-200 rounded-sm shadow-xl max-h-80 overflow-y-auto">
              <div className="py-2">
                {roles.map((role) => {
                  const roleConfig = roleConfigurations[role];
                  const isActive = role === user.role;
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`
                        flex items-start w-full px-4 py-3 text-sm transition-colors duration-150
                        ${isActive 
                          ? 'bg-gradient-to-r bg-gold-50 text-violet-700 border-l-4 border-gold-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="mr-3 text-lg flex-shrink-0">{roleConfig.logo}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-medium ${isActive ? 'text-violet-900' : 'text-gray-900'}`}>
                          {ROLE_DISPLAY_NAMES[role]}
                        </p>
                        <p className={`text-xs mt-1 ${isActive ? 'text-gold-600' : 'text-gray-500'} line-clamp-2`}>
                          {roleConfig.description}
                        </p>
                      </div>
                      {isActive && (
                        <CheckIcon className="w-5 h-5 text-gold-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
