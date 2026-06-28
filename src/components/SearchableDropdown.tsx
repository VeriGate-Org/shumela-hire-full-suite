'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  /** Currently selected value(s). For multi-select pass an array, for single pass a string or array with one item. */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Allow multiple selections (default: true) */
  multi?: boolean;
  /** Show loading spinner when options are being fetched */
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search',
  multi = true,
  loading = false,
  disabled = false,
  label,
  required = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description ?? '').toLowerCase().includes(q),
    );
  }, [options, search]);

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value],
  );

  const toggleOption = (optionValue: string) => {
    if (multi) {
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(next);
    } else {
      onChange([optionValue]);
      setIsOpen(false);
      setSearch('');
    }
  };

  const removeChip = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger / selected chips area */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 text-sm border rounded-control cursor-pointer flex flex-wrap items-center gap-1.5 ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : isOpen
              ? 'border-gold-400 ring-2 ring-gold-400'
              : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium max-w-[180px]"
            >
              <span className="truncate">{opt.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeChip(opt.value, e)}
                  className="shrink-0 hover:text-blue-950"
                  aria-label={`Remove ${opt.label}`}
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}

        {/* Chevron */}
        <svg
          className={`ml-auto shrink-0 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-control shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-control focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                {search ? 'No results found' : 'No options available'}
              </div>
            ) : (
              filtered.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/60 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-xs text-gray-400 truncate">{option.description}</p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
