'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/contexts/AuthContext';
import { customFieldService, CustomField } from '@/services/customFieldService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TableCellsIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const ENTITY_TYPES = ['EMPLOYEE', 'JOB', 'APPLICATION', 'INTERVIEW'] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'TEXTAREA'] as const;

const emptyForm = {
  fieldName: '',
  fieldLabel: '',
  fieldType: 'TEXT',
  entityType: 'EMPLOYEE' as string,
  isRequired: false,
  isActive: true,
  options: '',
  defaultValue: '',
};

/* ===== Entity tab icon map ===== */
const ENTITY_ICONS: Record<EntityType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  EMPLOYEE: UserIcon,
  JOB: BriefcaseIcon,
  APPLICATION: DocumentTextIcon,
  INTERVIEW: UserGroupIcon,
};

/* ===== Type badge color map using design system tokens ===== */
const TYPE_BADGE_CLASSES: Record<string, string> = {
  TEXT: 'bg-surface-navy text-accent-navy',
  NUMBER: 'bg-surface-teal text-accent-teal',
  DATE: 'bg-surface-gold text-accent-gold',
  SELECT: 'bg-surface-pink text-accent-pink',
  BOOLEAN: 'bg-surface-teal text-accent-teal',
  TEXTAREA: 'bg-surface-navy text-accent-navy',
};

/* ===== Field icon color map ===== */
const FIELD_ICON_CLASSES: Record<string, string> = {
  TEXT: 'bg-icon-bg-navy text-accent-navy',
  NUMBER: 'bg-icon-bg-gold text-accent-gold',
  DATE: 'bg-icon-bg-teal text-accent-teal',
  SELECT: 'bg-icon-bg-pink text-accent-pink',
  BOOLEAN: 'bg-icon-bg-teal text-accent-teal',
  TEXTAREA: 'bg-icon-bg-navy text-accent-navy',
};

/* ===== Toggle Switch Component ===== */
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-accent-teal' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

/* ===== Stat Card Component ===== */
function StatCard({
  icon: Icon,
  value,
  label,
  palette,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: number;
  label: string;
  palette: 'navy' | 'teal' | 'gold' | 'pink';
}) {
  const iconBgMap = {
    navy: 'bg-icon-bg-navy text-accent-navy',
    teal: 'bg-icon-bg-teal text-accent-teal',
    gold: 'bg-icon-bg-gold text-accent-gold',
    pink: 'bg-icon-bg-pink text-accent-pink',
  };
  return (
    <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px">
      <div
        className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 ${iconBgMap[palette]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[1.75rem] font-extrabold leading-none text-foreground">
          {value}
        </p>
        <p className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function CustomFieldsPage() {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EntityType>('EMPLOYEE');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, [activeTab]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await customFieldService.getAllFieldsByEntityType(activeTab);
      setFields(data);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  /* Compute stats across all entity types */
  const stats = useMemo(() => {
    const totalFields = fields.length;
    const requiredFields = fields.filter((f) => f.isRequired).length;
    return { totalFields, requiredFields };
  }, [fields]);

  const resetForm = () => {
    setForm({ ...emptyForm, entityType: activeTab });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    setForm({ ...emptyForm, entityType: activeTab });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (field: CustomField) => {
    setForm({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      entityType: field.entityType,
      isRequired: field.isRequired,
      isActive: field.isActive,
      options: field.options || '',
      defaultValue: field.defaultValue || '',
    });
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleDelete = async (field: CustomField) => {
    if (!window.confirm(`Are you sure you want to delete the custom field "${field.fieldLabel}"?`)) {
      return;
    }
    try {
      await customFieldService.deleteField(field.id);
      loadFields();
    } catch (err: any) {
      alert(err.message || 'Failed to delete custom field');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CustomField> = {
        fieldName: form.fieldName,
        fieldLabel: form.fieldLabel,
        fieldType: form.fieldType,
        entityType: form.entityType,
        isRequired: form.isRequired,
        isActive: form.isActive,
        options: form.fieldType === 'SELECT' ? form.options : null,
        defaultValue: form.defaultValue || null,
      };

      if (editingId) {
        await customFieldService.updateField(editingId, payload);
      } else {
        await customFieldService.createField(payload);
      }
      resetForm();
      loadFields();
    } catch (err: any) {
      alert(err.message || 'Failed to save custom field');
    } finally {
      setSaving(false);
    }
  };

  const entityLabel = activeTab.charAt(0) + activeTab.slice(1).toLowerCase();
  const EntityIcon = ENTITY_ICONS[activeTab];

  return (
    <PageWrapper
      title="Custom Fields"
      subtitle="Configure custom data fields for employees, jobs, applications, and interviews"
      actions={
        <button
          onClick={handleAdd}
          className="btn-cta inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Add Field
        </button>
      }
    >
      <div className="space-y-6">
        {/* ===== Stats Bar ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="enterprise-card flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-card loading-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="w-[60px] h-7 rounded-control loading-shimmer" />
                    <div className="w-[100px] h-3.5 rounded-control loading-shimmer" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={TableCellsIcon}
                value={stats.totalFields}
                label="Total Fields"
                palette="navy"
              />
              <StatCard
                icon={CheckCircleIcon}
                value={stats.requiredFields}
                label="Required Fields"
                palette="teal"
              />
              <StatCard
                icon={Squares2X2Icon}
                value={ENTITY_TYPES.length}
                label="Entity Types"
                palette="gold"
              />
            </>
          )}
        </div>

        {/* ===== Entity Type Tabs ===== */}
        <div className="enterprise-card flex gap-1 p-1.5">
          {loading ? (
            <>
              {ENTITY_TYPES.map((et) => (
                <div
                  key={et}
                  className="flex-1 h-[42px] rounded-control loading-shimmer"
                />
              ))}
            </>
          ) : (
            ENTITY_TYPES.map((entityType) => {
              const Icon = ENTITY_ICONS[entityType];
              const isActive = activeTab === entityType;
              const count = entityType === activeTab ? fields.length : null;
              return (
                <button
                  key={entityType}
                  onClick={() => setActiveTab(entityType)}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-control text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-background hover:text-primary'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {entityType.charAt(0) + entityType.slice(1).toLowerCase()}
                  {count !== null && (
                    <span
                      className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-button leading-tight ${
                        isActive
                          ? 'bg-white/25'
                          : 'bg-background text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ===== Two-Column Fields Layout ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left: Field Creation / Edit Form */}
          {showForm ? (
            <form
              onSubmit={handleSubmit}
              className="enterprise-card p-6 lg:sticky lg:top-[88px] space-y-4"
            >
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <PlusIcon className="w-5 h-5 text-primary" />
                {editingId ? 'Edit Field' : 'Add New Field'}
              </h2>

              {/* Field Name */}
              <div>
                <label className="form-label">Field Name</label>
                <input
                  type="text"
                  required
                  value={form.fieldName}
                  onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                  placeholder="e.g. emergency_contact"
                  className="form-input w-full"
                />
              </div>

              {/* Field Label */}
              <div>
                <label className="form-label">Field Label</label>
                <input
                  type="text"
                  required
                  value={form.fieldLabel}
                  onChange={(e) => setForm({ ...form, fieldLabel: e.target.value })}
                  placeholder="e.g. Emergency Contact"
                  className="form-input w-full"
                />
              </div>

              {/* Field Type */}
              <div>
                <label className="form-label">Field Type</label>
                <select
                  required
                  value={form.fieldType}
                  onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                  className="form-input w-full cursor-pointer"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft.charAt(0) + ft.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="form-label">Entity Type</label>
                <select
                  required
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="form-input w-full cursor-pointer"
                >
                  {ENTITY_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et.charAt(0) + et.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Value */}
              <div>
                <label className="form-label">Default Value</label>
                <input
                  type="text"
                  value={form.defaultValue}
                  onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  placeholder="Optional default value"
                  className="form-input w-full"
                />
              </div>

              {/* Toggle: Required */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-foreground">Required</span>
                <ToggleSwitch
                  checked={form.isRequired}
                  onChange={(v) => setForm({ ...form, isRequired: v })}
                  label="Required"
                />
              </div>

              {/* Toggle: Active */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-foreground">Active</span>
                <ToggleSwitch
                  checked={form.isActive}
                  onChange={(v) => setForm({ ...form, isActive: v })}
                  label="Active"
                />
              </div>

              {/* Options textarea - only shown when fieldType is SELECT */}
              {form.fieldType === 'SELECT' && (
                <div>
                  <label className="form-label">Options (one per line)</label>
                  <textarea
                    required
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    rows={4}
                    className="form-input w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter each option on a separate line.
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-cta flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : editingId ? 'Update Field' : 'Save Field'}
                </button>
              </div>
            </form>
          ) : (
            /* Collapsed form placeholder - Add Field card */
            <div className="enterprise-card p-6 lg:sticky lg:top-[88px]">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <PlusIcon className="w-5 h-5 text-primary" />
                Add New Field
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Create a custom field for the {entityLabel} entity type using the form.
              </p>
              <button
                onClick={handleAdd}
                className="btn-cta w-full inline-flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Field
              </button>
            </div>
          )}

          {/* Right: Fields Table */}
          <div className="enterprise-card overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5 text-primary" />
                {entityLabel} Fields
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-button text-xs font-semibold tracking-wide bg-icon-bg-navy text-accent-navy">
                <EntityIcon className="w-3.5 h-3.5" />
                {entityLabel}
              </span>
            </div>

            {/* Table Content */}
            {loading ? (
              /* Skeleton Loading */
              <div className="p-4 space-y-4">
                {/* Skeleton header row */}
                <div className="flex gap-4 pb-3 border-b border-border">
                  {[30, 140, 60, 70, 80].map((w, i) => (
                    <div
                      key={i}
                      className="h-3.5 rounded-control loading-shimmer"
                      style={{ width: w }}
                    />
                  ))}
                </div>
                {/* Skeleton body rows */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-control loading-shimmer flex-shrink-0" />
                    <div className="flex-1 h-4 rounded-control loading-shimmer" />
                    <div className="w-[72px] h-6 rounded-button loading-shimmer" />
                    <div className="w-10 h-4 rounded-control loading-shimmer" />
                    <div className="w-[60px] h-4 rounded-control loading-shimmer" />
                  </div>
                ))}
              </div>
            ) : fields.length === 0 ? (
              /* Empty State */
              <div className="py-12 px-8 text-center">
                <div className="w-12 h-12 mx-auto rounded-card bg-background flex items-center justify-center mb-4">
                  <AdjustmentsHorizontalIcon className="w-6 h-6 text-muted-foreground opacity-40" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No custom fields</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Add your first custom field for {entityLabel} using the form.
                </p>
                <button
                  onClick={handleAdd}
                  className="btn-cta inline-flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" /> Add Field
                </button>
              </div>
            ) : (
              /* Fields Table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Field Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Required
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[100px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr
                        key={field.id}
                        className={`border-b border-border last:border-b-0 transition-colors hover:bg-surface-navy ${
                          index % 2 === 1 ? 'bg-secondary' : ''
                        }`}
                      >
                        {/* Field Name with Icon */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-control flex items-center justify-center flex-shrink-0 ${
                                FIELD_ICON_CLASSES[field.fieldType] || FIELD_ICON_CLASSES['TEXT']
                              }`}
                            >
                              <AdjustmentsHorizontalIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {field.fieldLabel}
                              </div>
                              <div className="text-[0.6875rem] text-muted-foreground font-mono">
                                {field.fieldName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-button text-xs font-semibold tracking-wide ${
                              TYPE_BADGE_CLASSES[field.fieldType] || TYPE_BADGE_CLASSES['TEXT']
                            }`}
                          >
                            {field.fieldType}
                          </span>
                        </td>

                        {/* Required */}
                        <td className="px-4 py-3 text-[0.8125rem]">
                          {field.isRequired ? (
                            <span className="font-semibold text-accent-teal">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>

                        {/* Active / Status */}
                        <td className="px-4 py-3">
                          {field.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-xs font-semibold bg-surface-teal text-accent-teal">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-xs font-semibold bg-background text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(field)}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-primary transition-colors"
                              title="Edit field"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(field)}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-pink hover:text-accent-pink transition-colors"
                              title="Delete field"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
