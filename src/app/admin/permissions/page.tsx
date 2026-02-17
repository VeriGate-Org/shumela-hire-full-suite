'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  UserGroupIcon,
  CogIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'read' | 'write' | 'admin';
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  lastModified: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  department: string;
}

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedView, setSelectedView] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPermissionData();
  }, []);

  const loadPermissionData = async () => {
    setLoading(true);

    // Mock permissions data
    const mockPermissions: Permission[] = [
      // Dashboard & Analytics
      { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to main dashboard and overview', category: 'dashboard', level: 'read' },
      { id: 'view_analytics', name: 'View Analytics', description: 'Access to analytics and reporting features', category: 'analytics', level: 'read' },
      { id: 'export_reports', name: 'Export Reports', description: 'Download reports and analytics data', category: 'analytics', level: 'write' },
      
      // Recruitment Management
      { id: 'view_jobs', name: 'View Job Postings', description: 'View job postings and details', category: 'recruitment', level: 'read' },
      { id: 'create_jobs', name: 'Create Job Postings', description: 'Create and publish job postings', category: 'recruitment', level: 'write' },
      { id: 'edit_jobs', name: 'Edit Job Postings', description: 'Modify existing job postings', category: 'recruitment', level: 'write' },
      { id: 'delete_jobs', name: 'Delete Job Postings', description: 'Remove job postings', category: 'recruitment', level: 'admin' },
      
      // Application Management
      { id: 'view_applications', name: 'View Applications', description: 'View candidate applications', category: 'applications', level: 'read' },
      { id: 'manage_applications', name: 'Manage Applications', description: 'Process and update application status', category: 'applications', level: 'write' },
      { id: 'bulk_operations', name: 'Bulk Operations', description: 'Perform bulk actions on applications', category: 'applications', level: 'write' },
      
      // Candidate Management
      { id: 'view_candidates', name: 'View Candidates', description: 'Access candidate profiles and information', category: 'candidates', level: 'read' },
      { id: 'edit_candidates', name: 'Edit Candidates', description: 'Modify candidate information', category: 'candidates', level: 'write' },
      { id: 'delete_candidates', name: 'Delete Candidates', description: 'Remove candidate records', category: 'candidates', level: 'admin' },
      
      // Interview Management
      { id: 'view_interviews', name: 'View Interviews', description: 'View interview schedules and details', category: 'interviews', level: 'read' },
      { id: 'schedule_interviews', name: 'Schedule Interviews', description: 'Create and manage interview schedules', category: 'interviews', level: 'write' },
      { id: 'conduct_interviews', name: 'Conduct Interviews', description: 'Access interview tools and feedback forms', category: 'interviews', level: 'write' },
      
      // Integrations
      { id: 'view_integrations', name: 'View Integrations', description: 'View integration status and configuration', category: 'integrations', level: 'read' },
      { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure and manage system integrations', category: 'integrations', level: 'admin' },
      
      // Training
      { id: 'view_training', name: 'View Training', description: 'Access training modules and progress', category: 'training', level: 'read' },
      { id: 'manage_training', name: 'Manage Training', description: 'Create and manage training content', category: 'training', level: 'write' },
      
      // System Administration
      { id: 'user_management', name: 'User Management', description: 'Manage user accounts and access', category: 'admin', level: 'admin' },
      { id: 'role_management', name: 'Role Management', description: 'Manage roles and permissions', category: 'admin', level: 'admin' },
      { id: 'system_settings', name: 'System Settings', description: 'Configure system-wide settings', category: 'admin', level: 'admin' },
      { id: 'audit_logs', name: 'Audit Logs', description: 'Access system audit and activity logs', category: 'admin', level: 'admin' }
    ];

    // Mock roles data
    const mockRoles: Role[] = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with all administrative privileges',
        color: 'red',
        userCount: 3,
        permissions: mockPermissions.map(p => p.id), // All permissions
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-15T10:30:00Z'
      },
      {
        id: 'hr_manager',
        name: 'HR Manager',
        description: 'HR department head with comprehensive recruitment and employee management access',
        color: 'blue',
        userCount: 8,
        permissions: [
          'view_dashboard', 'view_analytics', 'export_reports',
          'view_jobs', 'create_jobs', 'edit_jobs',
          'view_applications', 'manage_applications', 'bulk_operations',
          'view_candidates', 'edit_candidates',
          'view_interviews', 'schedule_interviews', 'conduct_interviews',
          'view_integrations', 'view_training', 'manage_training'
        ],
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-10T14:20:00Z'
      },
      {
        id: 'hiring_manager',
        name: 'Hiring Manager',
        description: 'Department managers responsible for specific role hiring decisions',
        color: 'green',
        userCount: 15,
        permissions: [
          'view_dashboard', 'view_analytics',
          'view_jobs', 'create_jobs', 'edit_jobs',
          'view_applications', 'manage_applications',
          'view_candidates', 'edit_candidates',
          'view_interviews', 'schedule_interviews', 'conduct_interviews',
          'view_training'
        ],
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-08T09:45:00Z'
      },
      {
        id: 'recruiter',
        name: 'Recruiter',
        description: 'Recruitment specialists focused on sourcing and initial candidate screening',
        color: 'purple',
        userCount: 22,
        permissions: [
          'view_dashboard',
          'view_jobs', 'create_jobs', 'edit_jobs',
          'view_applications', 'manage_applications',
          'view_candidates', 'edit_candidates',
          'view_interviews', 'schedule_interviews',
          'view_integrations', 'view_training'
        ],
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-12T16:15:00Z'
      },
      {
        id: 'executive',
        name: 'Executive',
        description: 'Senior leadership with strategic oversight and reporting access',
        color: 'yellow',
        userCount: 5,
        permissions: [
          'view_dashboard', 'view_analytics', 'export_reports',
          'view_jobs', 'view_applications', 'view_candidates',
          'view_interviews', 'view_training'
        ],
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-05T11:30:00Z'
      },
      {
        id: 'applicant',
        name: 'Applicant',
        description: 'External candidates with limited access to application-related features',
        color: 'gray',
        userCount: 1247,
        permissions: [
          'view_jobs', 'view_applications', 'view_training'
        ],
        isSystem: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock users data
    const mockUsers: User[] = [
      { id: '1', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', roleId: 'admin', status: 'active', lastLogin: '2024-01-21T08:30:00Z', department: 'IT' },
      { id: '2', name: 'Michael Chen', email: 'michael.chen@company.com', roleId: 'hr_manager', status: 'active', lastLogin: '2024-01-21T09:15:00Z', department: 'HR' },
      { id: '3', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', roleId: 'hiring_manager', status: 'active', lastLogin: '2024-01-20T16:45:00Z', department: 'Engineering' },
      { id: '4', name: 'James Park', email: 'james.park@company.com', roleId: 'recruiter', status: 'active', lastLogin: '2024-01-21T10:20:00Z', department: 'HR' },
      { id: '5', name: 'Lisa Johnson', email: 'lisa.johnson@company.com', roleId: 'executive', status: 'active', lastLogin: '2024-01-19T14:30:00Z', department: 'Executive' },
      { id: '6', name: 'David Kim', email: 'david.kim@company.com', roleId: 'recruiter', status: 'inactive', department: 'HR' },
      { id: '7', name: 'Anna Thompson', email: 'anna.thompson@company.com', roleId: 'hiring_manager', status: 'pending', department: 'Marketing' }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  };

  const permissionCategories = [
    { id: 'dashboard', name: 'Dashboard & Analytics', icon: ChartBarIcon },
    { id: 'recruitment', name: 'Recruitment', icon: UsersIcon },
    { id: 'applications', name: 'Applications', icon: DocumentTextIcon },
    { id: 'candidates', name: 'Candidates', icon: UserGroupIcon },
    { id: 'interviews', name: 'Interviews', icon: UsersIcon },
    { id: 'integrations', name: 'Integrations', icon: CogIcon },
    { id: 'training', name: 'Training', icon: DocumentTextIcon },
    { id: 'admin', name: 'Administration', icon: ShieldCheckIcon }
  ];

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-gold-100 text-gold-800 border-violet-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getPermissionLevel = (level: string) => {
    const levels = {
      read: { color: 'bg-green-100 text-green-800', icon: EyeIcon },
      write: { color: 'bg-gold-100 text-gold-800', icon: PencilIcon },
      admin: { color: 'bg-red-100 text-red-800', icon: ShieldCheckIcon }
    };
    return levels[level as keyof typeof levels] || levels.read;
  };

  const handleRolePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission 
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId],
          lastModified: new Date().toISOString()
        };
      }
      return role;
    }));
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? Users with this role will need to be reassigned.')) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actions = (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
        <DocumentTextIcon className="w-4 h-4 mr-2" />
        Export Permissions
      </button>
      <button 
        onClick={handleCreateRole}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Role
      </button>
    </div>
  );

  return (
    <PageWrapper
      title="Role & Permission Management"
      subtitle="Manage user roles, permissions, and access control across the recruitment platform"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="w-8 h-8 text-violet-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Roles</p>
                <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <KeyIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Permissions</p>
                <p className="text-2xl font-semibold text-gray-900">{permissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Users</p>
                <p className="text-2xl font-semibold text-gray-900">{users.filter(u => u.status === 'pending').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle and Search */}
        <div className="bg-white rounded-sm shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-1">
              {[
                { id: 'roles', name: 'Roles', icon: ShieldCheckIcon },
                { id: 'permissions', name: 'Permissions', icon: KeyIcon },
                { id: 'users', name: 'Users', icon: UsersIcon }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedView === view.id
                      ? 'bg-gold-100 text-gold-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <view.icon className="w-4 h-4 mr-2" />
                  {view.name}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            />
          </div>
        </div>

        {/* Roles View */}
        {selectedView === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoles.map(role => (
              <div key={role.id} className="bg-white rounded-sm shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role.color)}`}>
                          {role.userCount} users
                        </span>
                        {role.isSystem && (
                          <LockClosedIcon className="w-4 h-4 text-gray-400" title="System Role" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{role.description}</p>
                      <div className="text-xs text-gray-500">
                        <p>Created: {new Date(role.createdAt).toLocaleDateString()}</p>
                        <p>Modified: {new Date(role.lastModified).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Permissions ({role.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map(permissionId => {
                        const permission = permissions.find(p => p.id === permissionId);
                        if (!permission) return null;
                        const levelInfo = getPermissionLevel(permission.level);
                        return (
                          <span key={permissionId} className={`px-2 py-1 rounded text-xs font-medium ${levelInfo.color}`}>
                            {permission.name}
                          </span>
                        );
                      })}
                      {role.permissions.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          +{role.permissions.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRole(role)}
                      className="flex-1 px-3 py-2 bg-gold-100 text-gold-800 rounded-full hover:bg-gold-200 transition-colors"
                    >
                      View Details
                    </button>
                    {!role.isSystem && (
                      <>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions View */}
        {selectedView === 'permissions' && (
          <div className="space-y-6">
            {permissionCategories.map(category => {
              const categoryPermissions = permissions.filter(p => p.category === category.id);
              return (
                <div key={category.id} className="bg-white rounded-sm shadow">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <category.icon className="w-6 h-6 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {categoryPermissions.length} permissions
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {categoryPermissions.map(permission => {
                        const levelInfo = getPermissionLevel(permission.level);
                        return (
                          <div key={permission.id} className="border border-gray-200 rounded-sm p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{permission.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <levelInfo.icon className="w-4 h-4" />
                                <span className={`px-2 py-1 rounded text-xs font-medium ${levelInfo.color}`}>
                                  {permission.level}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Assigned to roles:</p>
                              <div className="flex flex-wrap gap-1">
                                {roles.filter(role => role.permissions.includes(permission.id)).map(role => (
                                  <span key={role.id} className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(role.color)}`}>
                                    {role.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Users View */}
        {selectedView === 'users' && (
          <div className="bg-white rounded-sm shadow">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => {
                      const userRole = roles.find(r => r.id === user.roleId);
                      return (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {userRole && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(userRole.color)}`}>
                                {userRole.name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button className="text-gold-600 hover:text-violet-900 rounded-full">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900 rounded-full">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Role Details Modal */}
        {selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRole.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedRole.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {permissionCategories.map(category => {
                    const categoryPermissions = permissions.filter(p => p.category === category.id);
                    return (
                      <div key={category.id} className="border border-gray-200 rounded-sm p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <category.icon className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map(permission => {
                            const hasPermission = selectedRole.permissions.includes(permission.id);
                            const levelInfo = getPermissionLevel(permission.level);
                            return (
                              <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{permission.name}</span>
                                    <span className={`px-1 py-0.5 rounded text-xs ${levelInfo.color}`}>
                                      {permission.level}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                                </div>
                                <div className="ml-3">
                                  {!selectedRole.isSystem ? (
                                    <button
                                      onClick={() => handleRolePermissionToggle(selectedRole.id, permission.id)}
                                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                        hasPermission 
                                          ? 'bg-gold-500 border-gold-500 text-violet-950' 
                                          : 'border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {hasPermission && <CheckIcon className="w-4 h-4" />}
                                    </button>
                                  ) : (
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                      hasPermission 
                                        ? 'bg-gold-500 border-gold-500 text-violet-950' 
                                        : 'border-gray-300'
                                    }`}>
                                      {hasPermission && <CheckIcon className="w-4 h-4" />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {!selectedRole.isSystem && (
                    <button className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600">
                      Save Changes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
