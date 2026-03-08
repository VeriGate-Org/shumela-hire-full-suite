'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  sageIntegrationService,
  SageConnectorConfig,
} from '@/services/sageIntegrationService';
import { useToast } from '@/components/Toast';
import {
  ArrowsRightLeftIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

type EntityType = 'EMPLOYEE' | 'LEAVE' | 'PAYROLL' | 'DEPARTMENT' | 'POSITION';
type MappingType = 'DIRECT' | 'TRANSFORM' | 'IGNORE';

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  mappingType: MappingType;
}

const ENTITY_TYPES: EntityType[] = ['EMPLOYEE', 'LEAVE', 'PAYROLL', 'DEPARTMENT', 'POSITION'];

const DEFAULT_MAPPINGS: Record<EntityType, FieldMapping[]> = {
  EMPLOYEE: [
    { id: 'emp-1', sourceField: 'emp_code', targetField: 'employeeNumber', mappingType: 'DIRECT' },
    { id: 'emp-2', sourceField: 'first_name', targetField: 'firstName', mappingType: 'DIRECT' },
    { id: 'emp-3', sourceField: 'last_name', targetField: 'lastName', mappingType: 'DIRECT' },
    { id: 'emp-4', sourceField: 'email_address', targetField: 'email', mappingType: 'DIRECT' },
    { id: 'emp-5', sourceField: 'id_number', targetField: 'idNumber', mappingType: 'DIRECT' },
    { id: 'emp-6', sourceField: 'date_of_birth', targetField: 'dateOfBirth', mappingType: 'TRANSFORM' },
    { id: 'emp-7', sourceField: 'start_date', targetField: 'hireDate', mappingType: 'TRANSFORM' },
    { id: 'emp-8', sourceField: 'department_code', targetField: 'departmentId', mappingType: 'TRANSFORM' },
  ],
  LEAVE: [
    { id: 'lv-1', sourceField: 'leave_type', targetField: 'leaveType', mappingType: 'TRANSFORM' },
    { id: 'lv-2', sourceField: 'start_date', targetField: 'startDate', mappingType: 'DIRECT' },
    { id: 'lv-3', sourceField: 'end_date', targetField: 'endDate', mappingType: 'DIRECT' },
    { id: 'lv-4', sourceField: 'days_taken', targetField: 'numberOfDays', mappingType: 'DIRECT' },
    { id: 'lv-5', sourceField: 'emp_code', targetField: 'employeeId', mappingType: 'TRANSFORM' },
    { id: 'lv-6', sourceField: 'status', targetField: 'status', mappingType: 'TRANSFORM' },
  ],
  PAYROLL: [
    { id: 'pr-1', sourceField: 'emp_code', targetField: 'employeeId', mappingType: 'TRANSFORM' },
    { id: 'pr-2', sourceField: 'basic_salary', targetField: 'basicSalary', mappingType: 'DIRECT' },
    { id: 'pr-3', sourceField: 'gross_pay', targetField: 'grossPay', mappingType: 'DIRECT' },
    { id: 'pr-4', sourceField: 'net_pay', targetField: 'netPay', mappingType: 'DIRECT' },
    { id: 'pr-5', sourceField: 'tax_amount', targetField: 'taxAmount', mappingType: 'DIRECT' },
    { id: 'pr-6', sourceField: 'pay_period', targetField: 'payPeriod', mappingType: 'TRANSFORM' },
  ],
  DEPARTMENT: [
    { id: 'dep-1', sourceField: 'dept_code', targetField: 'code', mappingType: 'DIRECT' },
    { id: 'dep-2', sourceField: 'dept_name', targetField: 'name', mappingType: 'DIRECT' },
    { id: 'dep-3', sourceField: 'manager_code', targetField: 'managerId', mappingType: 'TRANSFORM' },
    { id: 'dep-4', sourceField: 'parent_dept', targetField: 'parentDepartmentId', mappingType: 'TRANSFORM' },
  ],
  POSITION: [
    { id: 'pos-1', sourceField: 'position_code', targetField: 'code', mappingType: 'DIRECT' },
    { id: 'pos-2', sourceField: 'position_title', targetField: 'title', mappingType: 'DIRECT' },
    { id: 'pos-3', sourceField: 'dept_code', targetField: 'departmentId', mappingType: 'TRANSFORM' },
    { id: 'pos-4', sourceField: 'grade_level', targetField: 'gradeLevel', mappingType: 'DIRECT' },
  ],
};

const STORAGE_KEY = 'sage_field_mappings';

let nextMappingId = 1000;

function generateId(): string {
  return `mapping-${nextMappingId++}`;
}

export default function SageFieldMappingsPage() {
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('EMPLOYEE');
  const [mappings, setMappings] = useState<Record<EntityType, FieldMapping[]>>(DEFAULT_MAPPINGS);
  const [connectors, setConnectors] = useState<SageConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load connectors for context
      const connectorsData = await sageIntegrationService.getConnectors();
      setConnectors(connectorsData);
    } catch {
      // Connectors may not be available, continue with defaults
    }

    // Load saved mappings from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<EntityType, FieldMapping[]>;
        setMappings(parsed);
      }
    } catch {
      // Use defaults if parse fails
    }

    setLoading(false);
  }

  function handleAddMapping() {
    const newMapping: FieldMapping = {
      id: generateId(),
      sourceField: '',
      targetField: '',
      mappingType: 'DIRECT',
    };
    setMappings((prev) => ({
      ...prev,
      [selectedEntity]: [...prev[selectedEntity], newMapping],
    }));
  }

  function handleRemoveMapping(mappingId: string) {
    setMappings((prev) => ({
      ...prev,
      [selectedEntity]: prev[selectedEntity].filter((m) => m.id !== mappingId),
    }));
  }

  function handleUpdateMapping(mappingId: string, field: keyof FieldMapping, value: string) {
    setMappings((prev) => ({
      ...prev,
      [selectedEntity]: prev[selectedEntity].map((m) =>
        m.id === mappingId ? { ...m, [field]: value } : m
      ),
    }));
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
      toast('Field mappings saved successfully', 'success');
    } catch {
      toast('Failed to save field mappings', 'error');
    }
  }

  const currentMappings = mappings[selectedEntity] || [];
  const activeConnectors = connectors.filter((c) => c.isActive);

  const mappingTypeColor = (type: MappingType) => {
    const colors: Record<MappingType, string> = {
      DIRECT: 'bg-green-100 text-green-800',
      TRANSFORM: 'bg-blue-100 text-blue-800',
      IGNORE: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatLabel = (s: string) => s.replace(/_/g, ' ');

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper title="Sage Field Mappings" subtitle="Configure field mappings between Sage and your system">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connector Info */}
            {connectors.length > 0 && (
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  Connected Sage Instances
                </h3>
                <div className="flex flex-wrap gap-3">
                  {connectors.map((c) => (
                    <div
                      key={c.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                      <span className="text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">({c.connectorType.replace(/_/g, ' ')})</span>
                    </div>
                  ))}
                </div>
                {activeConnectors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {activeConnectors.length} active connector{activeConnectors.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Entity Type Selector */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                  <select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
                    className="rounded-lg border border-gray-300 p-2 text-sm bg-white text-gray-900 min-w-[200px]"
                  >
                    {ENTITY_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {formatLabel(et)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${mappingTypeColor('DIRECT')}`}>Direct</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${mappingTypeColor('TRANSFORM')}`}>Transform</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${mappingTypeColor('IGNORE')}`}>Ignore</span>
                </div>
              </div>

              {/* Mapping Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Field (Sage)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        &nbsp;
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Field (System)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mapping Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentMappings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          <ArrowsRightLeftIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No mappings configured for {formatLabel(selectedEntity)}
                        </td>
                      </tr>
                    ) : (
                      currentMappings.map((mapping) => (
                        <tr key={mapping.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={mapping.sourceField}
                              onChange={(e) => handleUpdateMapping(mapping.id, 'sourceField', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 p-1.5 text-sm bg-white text-gray-900"
                              placeholder="Source field name"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ArrowsRightLeftIcon className="w-4 h-4 text-gray-400 mx-auto" />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={mapping.targetField}
                              onChange={(e) => handleUpdateMapping(mapping.id, 'targetField', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 p-1.5 text-sm bg-white text-gray-900"
                              placeholder="Target field name"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={mapping.mappingType}
                              onChange={(e) => handleUpdateMapping(mapping.id, 'mappingType', e.target.value)}
                              className={`rounded-lg border border-gray-300 p-1.5 text-sm ${mappingTypeColor(mapping.mappingType)}`}
                            >
                              <option value="DIRECT">Direct</option>
                              <option value="TRANSFORM">Transform</option>
                              <option value="IGNORE">Ignore</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveMapping(mapping.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove mapping"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAddMapping}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Mapping
                </button>

                <button
                  onClick={handleSave}
                  className="px-6 py-2 text-sm font-medium text-white bg-gold-500 rounded-lg hover:bg-gold-600 transition-colors"
                >
                  Save Mappings
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-[10px] border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Mappings Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ENTITY_TYPES.map((et) => (
                  <div
                    key={et}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                      selectedEntity === et
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEntity(et)}
                  >
                    <p className="text-lg font-semibold text-gray-900">{mappings[et]?.length || 0}</p>
                    <p className="text-xs text-gray-500">{formatLabel(et)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
