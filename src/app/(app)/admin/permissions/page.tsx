'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import InviteUserModal from '@/components/InviteUserModal';
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
  ChartBarIcon,
  ArrowPathIcon,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingPermission, setSavingPermission] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissionData();
  }, []);

  const loadPermissionData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [permissionsRes, rolesRes, usersRes] = await Promise.allSettled([
        apiFetch('/api/admin/permissions'),
        apiFetch('/api/admin/roles'),
        apiFetch('/api/admin/users'),
      ]);

      let anySuccess = false;

      if (permissionsRes.status === 'fulfilled' && permissionsRes.value.ok) {
        const data = await permissionsRes.value.json();
        setPermissions(Array.isArray(data) ? data : data.data || []);
        anySuccess = true;
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value.ok) {
        const data = await rolesRes.value.json();
        setRoles(Array.isArray(data) ? data : data.data || []);
        anySuccess = true;
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await usersRes.value.json();
        setUsers(Array.isArray(data) ? data : data.content || data.data || []);
        anySuccess = true;
      }

      if (!anySuccess) {
        setLoadError('Failed to load permission data. Please check your connection and try again.');
      }
    } catch {
      setLoadError('Failed to load permission data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
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

  const handleRolePermissionToggle = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions.includes(permissionId);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    // Optimistic update
    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        return { ...r, permissions: newPermissions, lastModified: new Date().toISOString() };
      }
      return r;
    }));
    if (selectedRole?.id === roleId) {
      setSelectedRole(prev => prev ? { ...prev, permissions: newPermissions, lastModified: new Date().toISOString() } : null);
    }

    setSavingPermission(permissionId);
    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionId, enabled: !hasPermission }),
      });
      if (!res.ok) throw new Error('Failed to update permission');
      toast(`Permission ${hasPermission ? 'removed' : 'granted'} successfully`, 'success');
    } catch {
      // Rollback on failure
      setRoles(prev => prev.map(r => {
        if (r.id === roleId) {
          return { ...r, permissions: role.permissions };
        }
        return r;
      }));
      if (selectedRole?.id === roleId) {
        setSelectedRole(prev => prev ? { ...prev, permissions: role.permissions } : null);
      }
      toast('Failed to update permission. Changes reverted.', 'error');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleSaveRoleChanges = async () => {
    if (!selectedRole) return;
    try {
      const res = await apiFetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        body: JSON.stringify(selectedRole),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast('Role changes saved successfully', 'success');
      setSelectedRole(null);
      await loadPermissionData();
    } catch {
      toast('Failed to save role changes', 'error');
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    setShowDeleteConfirm(null);
    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setRoles(prev => prev.filter(role => role.id !== roleId));
      toast('Role deleted successfully', 'success');
    } catch {
      toast('Failed to delete role. It may still have assigned users.', 'error');
    }
  };

  const handleEditUser = async (userId: string) => {
    if (!editingUserRole) return;
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: editingUserRole }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleId: editingUserRole } : u));
      toast('User role updated successfully', 'success');
      setEditingUserId(null);
      setEditingUserRole('');
    } catch {
      toast('Failed to update user role', 'error');
    }
  };

  const handleExportPermissions = () => {
    const header = ['Role', 'Permission', 'Category', 'Level'].join(',');
    const rows: string[] = [];
    for (const role of roles) {
      for (const permId of role.permissions) {
        const perm = permissions.find(p => p.id === permId);
        if (perm) {
          rows.push([role.name, perm.name, perm.category, perm.level].map(v =>
            v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
          ).join(','));
        }
      }
    }
    const csvContent = '\ufeff' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${rows.length} permission assignments`, 'success');
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
      <button
        onClick={handleExportPermissions}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <DocumentTextIcon className="w-4 h-4 mr-2" />
        Export Permissions
      </button>
      <button
        onClick={() => setShowInviteModal(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Invite User
      </button>
      <button
        onClick={handleCreateRole}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Role
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper
        title="Role & Permission Management"
        subtitle="Manage user roles, permissions, and access control across the recruitment platform"
        actions={actions}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-sm shadow p-6">
                <div className="animate-pulse flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (loadError) {
    return (
      <PageWrapper
        title="Role & Permission Management"
        subtitle="Manage user roles, permissions, and access control across the recruitment platform"
        actions={actions}
      >
        <div className="bg-white rounded-sm shadow p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load permission data</h3>
          <p className="text-gray-500 mb-4">{loadError}</p>
          <button
            onClick={loadPermissionData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

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
                  onClick={() => setSelectedView(view.id as 'roles' | 'permissions' | 'users')}
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
                          onClick={() => setShowDeleteConfirm(role.id)}
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
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-900 mb-1">No users loaded</p>
                          <p className="text-sm text-gray-500">Users are synchronized from the authentication provider. New users will appear here after their first sign-in.</p>
                        </td>
                      </tr>
                    )}
                    {filteredUsers.map(user => {
                      const userRole = roles.find(r => r.id === user.roleId);
                      const isEditing = editingUserId === user.id;
                      return (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={editingUserRole}
                                  onChange={(e) => setEditingUserRole(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded-sm text-sm"
                                >
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleEditUser(user.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setEditingUserId(null); setEditingUserRole(''); }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              userRole && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(userRole.color)}`}>
                                  {userRole.name}
                                </span>
                              )
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
                              <button
                                onClick={() => { setEditingUserId(user.id); setEditingUserRole(user.roleId); }}
                                className="text-gold-600 hover:text-violet-900 rounded-full"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toast('User deactivation coming soon', 'info')}
                                className="text-red-600 hover:text-red-900 rounded-full"
                              >
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

        {/* Create/Edit Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingRole ? 'Edit Role' : 'Create Role'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Custom role management will be available in a future release
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-sm p-8 text-center">
                  <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Custom role management will be available in a future release.
                    System roles are currently read-only.
                  </p>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Delete Role</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this role? Users with this role will need to be reassigned.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite User Modal */}
        <InviteUserModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadPermissionData}
        />

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
                            const isSaving = savingPermission === permission.id;
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
                                      disabled={isSaving}
                                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                        hasPermission
                                          ? 'bg-gold-500 border-gold-500 text-violet-950'
                                          : 'border-gray-300 hover:border-gray-400'
                                      } ${isSaving ? 'opacity-50' : ''}`}
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
                    <button
                      onClick={handleSaveRoleChanges}
                      className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600"
                    >
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
