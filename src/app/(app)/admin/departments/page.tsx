'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { departmentService, Department } from '@/services/departmentService';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggleDepartment, setToggleDepartment] = useState<Department | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const canManage = user?.role === 'PLATFORM_OWNER' || user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch {
      setLoadError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter(
      d => d.name.toLowerCase().includes(term) ||
           d.code.toLowerCase().includes(term) ||
           (d.description && d.description.toLowerCase().includes(term))
    );
  }, [departments, searchTerm]);

  const stats = useMemo(() => ({
    total: departments.length,
    active: departments.filter(d => d.isActive).length,
    inactive: departments.filter(d => !d.isActive).length,
  }), [departments]);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setEditingDepartment(null);
    setShowCreateModal(true);
  };

  const openEditModal = (department: Department) => {
    setFormName(department.name);
    setFormDescription(department.description || '');
    setEditingDepartment(department);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingDepartment(null);
    setFormName('');
    setFormDescription('');
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Department name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        toast('Department updated', 'success');
      } else {
        await departmentService.create({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        toast('Department created', 'success');
      }
      closeModal();
      await loadDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (department: Department) => {
    setToggleDepartment(department);
  };

  const confirmToggleActive = async () => {
    if (!toggleDepartment) return;
    const department = toggleDepartment;
    setToggleDepartment(null);
    try {
      if (department.isActive) {
        await departmentService.deactivate(department.id);
        toast(`${department.name} deactivated`, 'success');
      } else {
        await departmentService.activate(department.id);
        toast(`${department.name} activated`, 'success');
      }
      await loadDepartments();
    } catch {
      toast('Failed to update department status', 'error');
    }
  };

  const actions = canManage ? (
    <button
      onClick={openCreateModal}
      className="btn-cta inline-flex items-center gap-2"
    >
      <PlusIcon className="w-4 h-4" />
      Add Department
    </button>
  ) : null;

  if (loading) {
    return (
      <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
        <div className="space-y-6">
          {/* Skeleton Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="enterprise-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 loading-shimmer rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-6 loading-shimmer rounded w-12 mb-2" />
                    <div className="h-3 loading-shimmer rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton Filter Bar */}
          <div className="enterprise-card p-5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 loading-shimmer rounded-control" />
              <div className="h-4 loading-shimmer rounded w-32" />
            </div>
          </div>
          {/* Skeleton Table */}
          <div className="enterprise-card overflow-hidden">
            <TableSkeleton rows={6} columns={5} />
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (loadError) {
    return (
      <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
        <ErrorState
          title="Failed to load departments"
          message={loadError}
          onRetry={loadDepartments}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Departments" subtitle="Manage organisational departments" actions={actions}>
      <div className="space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Departments */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--icon-bg-navy)]">
                <BuildingOfficeIcon className="w-6 h-6 text-[var(--accent-navy)]" />
              </div>
              <div>
                <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stats.total}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Total Departments</div>
              </div>
            </div>
          </div>
          {/* Active */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--icon-bg-teal)]">
                <CheckCircleIcon className="w-6 h-6 text-[var(--accent-teal)]" />
              </div>
              <div>
                <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stats.active}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Active</div>
              </div>
            </div>
          </div>
          {/* Inactive */}
          <div className="enterprise-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--icon-bg-gold)]">
                <XCircleIcon className="w-6 h-6 text-[var(--accent-gold)]" />
              </div>
              <div>
                <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stats.inactive}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Inactive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="enterprise-card p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
                />
              </div>
            </div>
            <div className="text-[0.8125rem] font-medium text-muted-foreground whitespace-nowrap">
              Showing {filteredDepartments.length} of {departments.length} departments
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredDepartments.length === 0 ? (
          <EmptyState
            icon={BuildingOfficeIcon}
            title={searchTerm ? 'No departments match your search' : 'No departments yet'}
            description={searchTerm ? 'Try a different search term' : 'Create your first department to get started'}
          />
        ) : (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                    {canManage && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredDepartments.map((department, idx) => (
                    <tr
                      key={department.id}
                      className={`transition-colors hover:bg-accent ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-foreground">{department.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-muted-foreground font-mono">{department.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground line-clamp-1">{department.description || '\u2014'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {department.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--icon-bg-teal)] text-[var(--accent-teal)]">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(department)}
                              title="Edit department"
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-[var(--accent-navy)] transition-colors"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(department)}
                              title={department.isActive ? 'Deactivate' : 'Activate'}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-colors ${
                                department.isActive
                                  ? 'border-[var(--accent-pink)] text-[var(--accent-pink)] hover:bg-[var(--icon-bg-pink)]'
                                  : 'border-[var(--accent-teal)] text-[var(--accent-teal)] hover:bg-[var(--icon-bg-teal)]'
                              }`}
                            >
                              {department.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-2xl shadow-lg max-w-[560px] w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="px-6 py-6 space-y-4">
              <div>
                <label htmlFor="dept-name" className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Department Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="dept-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Water Operations"
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-border rounded-control bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
                />
              </div>
              <div>
                <label htmlFor="dept-description" className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  id="dept-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of department responsibilities..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm font-medium border border-border rounded-control bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all resize-y min-h-[80px]"
                />
              </div>
            </div>
            {/* Modal Footer */}
            <div className="px-6 pb-6 pt-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="btn-cta inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingDepartment ? 'Update' : 'Save Department'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={toggleDepartment !== null}
        title={toggleDepartment?.isActive ? 'Deactivate Department' : 'Activate Department'}
        message={toggleDepartment?.isActive
          ? `Are you sure you want to deactivate "${toggleDepartment?.name}"? This may affect users and job postings assigned to this department.`
          : `Are you sure you want to activate "${toggleDepartment?.name}"?`}
        confirmLabel={toggleDepartment?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggleDepartment?.isActive ? 'warning' : 'default'}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleDepartment(null)}
      />
    </PageWrapper>
  );
}
