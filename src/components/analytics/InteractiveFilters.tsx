import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'daterange' | 'search' | 'range';
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterValue {
  id: string;
  value: any;
}

interface InteractiveFiltersProps {
  filters: FilterConfig[];
  values: FilterValue[];
  onChange: (values: FilterValue[]) => void;
  onReset: () => void;
  className?: string;
}

const InteractiveFilters: React.FC<InteractiveFiltersProps> = ({
  filters,
  values,
  onChange,
  onReset,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getValue = (filterId: string) => {
    const filterValue = values.find(v => v.id === filterId);
    return filterValue?.value || '';
  };

  const updateFilter = (filterId: string, newValue: any) => {
    const updatedValues = values.filter(v => v.id !== filterId);
    if (newValue !== '' && newValue !== null && newValue !== undefined) {
      updatedValues.push({ id: filterId, value: newValue });
    }
    onChange(updatedValues);
  };

  const hasActiveFilters = values.length > 0;

  const renderFilter = (filter: FilterConfig) => {
    const value = getValue(filter.id);

    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => updateFilter(filter.id, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent"
            />
          </div>
        );

      case 'select':
        return (
          <div key={filter.id} className="relative">
            <select
              value={value}
              onChange={(e) => updateFilter(filter.id, e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent"
            >
              <option value="">{filter.placeholder || `Select ${filter.label}`}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.id} className="relative">
            <MultiSelectDropdown
              options={filter.options || []}
              values={Array.isArray(value) ? value : []}
              onChange={(newValues) => updateFilter(filter.id, newValues)}
              placeholder={filter.placeholder || `Select ${filter.label}`}
            />
          </div>
        );

      case 'daterange':
        return (
          <div key={filter.id} className="flex gap-2">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={value?.start || ''}
                onChange={(e) => updateFilter(filter.id, { ...value, start: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={value?.end || ''}
                onChange={(e) => updateFilter(filter.id, { ...value, end: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'range':
        return (
          <div key={filter.id} className="space-y-2">
            <input
              type="range"
              min={filter.min || 0}
              max={filter.max || 100}
              value={value || filter.min || 0}
              onChange={(e) => updateFilter(filter.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{filter.min || 0}</span>
              <span className="font-medium">{value || filter.min || 0}</span>
              <span>{filter.max || 100}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-violet-100 text-violet-800 text-xs px-2 py-1 rounded-full">
              {values.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronDownIcon
              className={`w-4 h-4 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {values.map((filterValue) => {
              const filter = filters.find(f => f.id === filterValue.id);
              if (!filter) return null;

              let displayValue = filterValue.value;
              if (filter.type === 'multiselect' && Array.isArray(filterValue.value)) {
                displayValue = `${filterValue.value.length} selected`;
              } else if (filter.type === 'daterange' && typeof filterValue.value === 'object') {
                displayValue = `${filterValue.value.start} - ${filterValue.value.end}`;
              } else if (filter.type === 'select') {
                const option = filter.options?.find(opt => opt.value === filterValue.value);
                displayValue = option?.label || filterValue.value;
              }

              return (
                <span
                  key={filterValue.id}
                  className="inline-flex items-center gap-1 bg-violet-100 text-violet-800 text-xs px-2 py-1 rounded-full"
                >
                  <span className="font-medium">{filter.label}:</span>
                  <span>{displayValue}</span>
                  <button
                    onClick={() => updateFilter(filterValue.id, null)}
                    className="ml-1 hover:bg-violet-200 rounded-full p-0.5"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Multi-select dropdown component
interface MultiSelectDropdownProps {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  values,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter(v => v !== optionValue)
      : [...values, optionValue];
    onChange(newValues);
  };

  const displayText = values.length === 0 
    ? placeholder 
    : `${values.length} selected`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent flex justify-between items-center"
      >
        <span className={values.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
          {displayText}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={values.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractiveFilters;
