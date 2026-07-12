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

  /** Map role color to the mock's colored icon square background + icon color */
  const getRoleIconStyle = (color: string) => {
    const styles: Record<string, string> = {
      red: 'bg-icon-bg-pink text-accent-pink',
      blue: 'bg-icon-bg-navy text-accent-navy',
      green: 'bg-icon-bg-teal text-accent-teal',
      purple: 'bg-icon-bg-navy text-accent-navy',
      yellow: 'bg-icon-bg-gold text-accent-gold',
      gray: 'bg-icon-bg-navy text-accent-navy',
    };
    return styles[color] || styles.gray;
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
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleExportPermissions}
        className="btn-secondary inline-flex items-center gap-2 cursor-pointer"
      >
        <DocumentTextIcon className="w-4 h-4" />
        Export
      </button>
      <button
        onClick={() => setShowInviteModal(true)}
        className="btn-primary inline-flex items-center gap-2 cursor-pointer"
      >
        <PlusIcon className="w-4 h-4" />
        Invite User
      </button>
      <button
        onClick={handleCreateRole}
        className="inline-flex items-center gap-2 px-5 py-2 bg-cta border-2 border-cta text-cta-foreground rounded-button text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-cta-hover hover:border-cta-hover transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Create Role
      </button>
    </div>
  );

  // ─── Loading skeleton (matches mock skeleton layout) ───
  if (loading) {
    return (
      <PageWrapper
        title="Roles & Permissions"
        subtitle="Manage access roles and permissions"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Skeleton Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="enterprise-card p-5">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-card flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-muted rounded w-2/5" />
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Tabs */}
          <div className="flex gap-2">
            {[100, 170, 90].map((w, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-button" style={{ width: w, height: 38 }} />
            ))}
          </div>

          {/* Skeleton Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="enterprise-card p-5 animate-pulse">
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-12 h-12 bg-muted rounded-card" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-muted rounded w-3/5" />
                    <div className="h-3 bg-muted rounded w-2/5" />
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
                <div className="h-px bg-border my-3.5" />
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-muted rounded-button w-16" />
                  <div className="h-3.5 bg-muted rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // ─── Error state ───
  if (loadError) {
    return (
      <PageWrapper
        title="Roles & Permissions"
        subtitle="Manage access roles and permissions"
        actions={actions}
      >
        <div className="enterprise-card p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-accent-pink mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load permission data</h3>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <button
            onClick={loadPermissionData}
            className="inline-flex items-center gap-2 px-5 py-2 bg-cta text-cta-foreground rounded-button text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-cta-hover transition-all"
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
      title="Roles & Permissions"
      subtitle="Manage access roles and permissions"
      actions={actions}
    >
      <div className="space-y-6">
        {/* ══════ Stats Bar ══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
            <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{roles.length}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Total Roles</div>
            </div>
          </div>

          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
            <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{users.filter(u => u.status === 'active').length}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Active Users</div>
            </div>
          </div>

          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
            <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
              <KeyIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{permissions.length}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Permissions</div>
            </div>
          </div>

          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
            <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{users.filter(u => u.status === 'pending').length}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Pending Invites</div>
            </div>
          </div>
        </div>

        {/* ══════ View Tabs (pill buttons matching mock view-tabs) ══════ */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'roles' as const, name: 'Roles', icon: ShieldCheckIcon },
            { id: 'permissions' as const, name: 'Permissions Matrix', icon: KeyIcon },
            { id: 'users' as const, name: 'Users', icon: UsersIcon }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => { setSelectedView(view.id); setSearchTerm(''); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                selectedView === view.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
              }`}
            >
              <view.icon className="w-4 h-4" />
              {view.name}
            </button>
          ))}
        </div>

        {/* ══════ Roles Grid View ══════ */}
        {selectedView === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRoles.map(role => (
              <div
                key={role.id}
                className="enterprise-card p-5 relative cursor-pointer hover:-translate-y-0.5 transition-transform"
                onClick={() => setSelectedRole(role)}
              >
                {/* Three-dot menu area */}
                {!role.isSystem && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                      title="Edit role"
                    >
                      <PencilIcon className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(role.id); }}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-icon-bg-pink hover:text-accent-pink transition-colors"
                      title="Delete role"
                    >
                      <TrashIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}

                {/* Card Header: icon + title + user count */}
                <div className="flex items-center gap-3.5 mb-3.5 pr-16">
                  <div className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 ${getRoleIconStyle(role.color)}`}>
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground leading-snug">{role.name}</div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground">
                      {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[0.8125rem] text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {role.description}
                </p>

                {/* Divider */}
                <div className="h-px bg-border my-3.5" />

                {/* Footer: badge + View Details */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-xs font-semibold tracking-wide ${
                    role.isSystem
                      ? 'bg-surface-navy text-accent-navy'
                      : 'bg-surface-gold text-accent-gold'
                  }`}>
                    {role.isSystem && <LockClosedIcon className="w-3 h-3" />}
                    {role.isSystem ? 'System' : 'Custom'}
                  </span>
                  <span
                    className="text-[0.8125rem] font-semibold text-primary uppercase tracking-wider cursor-pointer hover:text-cta-hover transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSelectedRole(role); }}
                  >
                    View Details
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ Permissions Matrix View ══════ */}
        {selectedView === 'permissions' && (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ minWidth: 200 }}>
                      Permission
                    </th>
                    {roles.map(role => (
                      <th key={role.id} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionCategories.map(category => {
                    const categoryPermissions = permissions.filter(p => p.category === category.id);
                    if (categoryPermissions.length === 0) return null;
                    return (
                      <React.Fragment key={category.id}>
                        {/* Category header row */}
                        <tr className="bg-muted/30">
                          <td colSpan={roles.length + 1} className="px-4 py-2.5 text-[0.8125rem] font-bold text-foreground">
                            {category.name}
                          </td>
                        </tr>
                        {/* Permission rows */}
                        {categoryPermissions.map(permission => (
                          <tr key={permission.id} className="border-b border-border hover:bg-surface-navy transition-colors even:bg-muted/20">
                            <td className="px-4 py-3 pl-8 text-[0.8125rem] font-medium text-muted-foreground">
                              {permission.name}
                            </td>
                            {roles.map(role => {
                              const hasIt = role.permissions.includes(permission.id);
                              const isSaving = savingPermission === permission.id;
                              return (
                                <td key={role.id} className="px-4 py-3 text-center">
                                  <label className="relative inline-block w-9 h-5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={hasIt}
                                      disabled={role.isSystem || isSaving}
                                      onChange={() => handleRolePermissionToggle(role.id, permission.id)}
                                      className="sr-only peer"
                                    />
                                    <span className={`block w-9 h-5 rounded-full transition-colors ${
                                      hasIt ? 'bg-accent-teal' : 'bg-border'
                                    } ${isSaving ? 'opacity-50' : ''}`} />
                                    <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                      hasIt ? 'translate-x-4' : 'translate-x-0'
                                    }`} />
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════ Users View ══════ */}
        {selectedView === 'users' && (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ width: 50 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <UsersIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-foreground mb-1">No users loaded</p>
                        <p className="text-sm text-muted-foreground">Users are synchronized from the authentication provider. New users will appear here after their first sign-in.</p>
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user, idx) => {
                    const userRole = roles.find(r => r.id === user.roleId);
                    const isEditing = editingUserId === user.id;
                    // Avatar color rotation matching mock
                    const avatarColors = ['bg-accent-navy', 'bg-accent-pink', 'bg-accent-teal', 'bg-accent-gold'];
                    const avatarColor = avatarColors[idx % avatarColors.length];
                    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                    return (
                      <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors even:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.6875rem] font-bold flex-shrink-0 ${avatarColor}`}>
                              {initials}
                            </div>
                            <span className="text-sm font-semibold text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editingUserRole}
                                onChange={(e) => setEditingUserRole(e.target.value)}
                                className="px-2 py-1 border border-border rounded-control text-sm focus:ring-2 focus:ring-ring/40 focus:border-ring"
                              >
                                {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleEditUser(user.id)}
                                className="text-accent-teal hover:text-teal-800"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setEditingUserId(null); setEditingUserRole(''); }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            userRole && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-button text-xs font-semibold tracking-wide ${
                                userRole.color === 'blue' || userRole.color === 'purple'
                                  ? 'bg-surface-navy text-accent-navy'
                                  : userRole.color === 'green'
                                    ? 'bg-surface-teal text-accent-teal'
                                    : userRole.color === 'yellow'
                                      ? 'bg-surface-gold text-accent-gold'
                                      : userRole.color === 'red'
                                        ? 'bg-surface-pink text-accent-pink'
                                        : 'bg-surface-navy text-accent-navy'
                              }`}>
                                {userRole.name}
                              </span>
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {user.department}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[0.8125rem] text-muted-foreground">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { setEditingUserId(user.id); setEditingUserRole(user.roleId); }}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                            title="Edit user role"
                          >
                            <PencilIcon className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════ Create/Edit Role Modal ══════ */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>
            <div className="bg-card rounded-card shadow-lg max-w-[640px] w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button
                  onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-icon-bg-pink hover:text-accent-pink transition-colors"
                >
                  <XMarkIcon className="w-4.5 h-4.5" />
                </button>
              </div>
              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-muted/50 rounded-card p-8 text-center">
                  <CogIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[0.9375rem] text-foreground leading-relaxed">
                    Custom role management will be available in a future release.
                    System roles are currently read-only.
                  </p>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
                  className="btn-secondary inline-flex items-center cursor-pointer text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ Delete Confirmation Modal ══════ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteConfirm(null)}>
            <div className="bg-card rounded-card shadow-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-accent-pink" />
                  <h2 className="text-lg font-bold text-foreground">Delete Role</h2>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-icon-bg-pink hover:text-accent-pink transition-colors"
                >
                  <XMarkIcon className="w-4.5 h-4.5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-[0.9375rem] text-foreground leading-relaxed">
                  Are you sure you want to delete this role? Users with this role will need to be reassigned.
                </p>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn-secondary inline-flex items-center cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(showDeleteConfirm)}
                  className="inline-flex items-center px-5 py-2 bg-transparent border-2 border-accent-pink text-accent-pink rounded-button text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-accent-pink hover:text-white transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ Invite User Modal ══════ */}
        <InviteUserModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadPermissionData}
        />

        {/* ══════ Role Details Modal ══════ */}
        {selectedRole && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-8 z-50" onClick={() => setSelectedRole(null)}>
            <div className="bg-card rounded-card shadow-lg max-w-[640px] w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">{selectedRole.name}</h2>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-icon-bg-pink hover:text-accent-pink transition-colors"
                >
                  <XMarkIcon className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</div>
                  <p className="text-[0.9375rem] text-foreground leading-relaxed">{selectedRole.description}</p>
                </div>

                {/* Permissions checklist */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Permissions</div>
                  <ul className="space-y-0">
                    {permissions.map(permission => {
                      const hasPermission = selectedRole.permissions.includes(permission.id);
                      const isSaving = savingPermission === permission.id;
                      return (
                        <li
                          key={permission.id}
                          className={`flex items-center gap-2.5 py-2 border-b border-border last:border-b-0 text-sm ${
                            hasPermission ? 'text-foreground' : 'text-foreground/40'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            hasPermission ? 'bg-icon-bg-teal text-accent-teal' : 'bg-muted text-border'
                          }`}>
                            {hasPermission ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <XMarkIcon className="w-3 h-3" />
                            )}
                          </span>
                          <span className="flex-1">{permission.name}</span>
                          {!selectedRole.isSystem && (
                            <button
                              onClick={() => handleRolePermissionToggle(selectedRole.id, permission.id)}
                              disabled={isSaving}
                              className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 cursor-pointer ${
                                hasPermission ? 'bg-accent-teal' : 'bg-border'
                              } ${isSaving ? 'opacity-50' : ''}`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                hasPermission ? 'left-[18px]' : 'left-0.5'
                              }`} />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Assigned Users */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Assigned Users ({selectedRole.userCount})
                  </div>
                  <ul className="space-y-0">
                    {users.filter(u => u.roleId === selectedRole.id).slice(0, 6).map((user, idx) => {
                      const avatarColors = ['bg-accent-navy', 'bg-accent-pink', 'bg-accent-teal', 'bg-accent-gold'];
                      const avatarColor = avatarColors[idx % avatarColors.length];
                      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <li key={user.id} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[0.625rem] font-bold flex-shrink-0 ${avatarColor}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.department}</div>
                          </div>
                        </li>
                      );
                    })}
                    {users.filter(u => u.roleId === selectedRole.id).length === 0 && (
                      <li className="py-2 text-sm text-muted-foreground">No users assigned to this role.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="btn-secondary inline-flex items-center cursor-pointer text-sm"
                >
                  Close
                </button>
                {!selectedRole.isSystem && (
                  <button
                    onClick={handleSaveRoleChanges}
                    className="btn-primary inline-flex items-center cursor-pointer text-sm"
                  >
                    Edit Role
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
