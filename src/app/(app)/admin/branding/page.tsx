'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import { TenantBranding } from '@/types/tenantBranding';
import {
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function BrandingPage() {
  const { tenant, branding: currentBranding } = useTenant();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoFileSize, setLogoFileSize] = useState<string | null>(null);
  const [colors, setColors] = useState({
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    accentColor: '#2563eb',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [livePreview, setLivePreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (currentBranding) {
      if (currentBranding.logoUrl) setLogoPreview(currentBranding.logoUrl);
      setColors({
        primaryColor: currentBranding.primaryColor || '#1e40af',
        secondaryColor: currentBranding.secondaryColor || '#64748b',
        accentColor: currentBranding.accentColor || '#2563eb',
      });
    }
  }, [currentBranding]);

  useEffect(() => {
    if (!livePreview) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primaryColor);
    root.style.setProperty('--secondary', colors.secondaryColor);
    root.style.setProperty('--cta', colors.accentColor);
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--cta');
    };
  }, [livePreview, colors]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;

    if (file.size > 2 * 1024 * 1024) {
      toast('File exceeds 2MB limit', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch(`/api/admin/tenants/${tenant.id}/logo`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      if (res.ok) {
        setLogoPreview(URL.createObjectURL(file));
        setLogoFileName(file.name);
        setLogoFileSize(formatFileSize(file.size));
        toast('Logo uploaded successfully', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to upload logo', 'error');
      }
    } catch {
      toast('Failed to upload logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!tenant) return;
    setUploading(true);
    try {
      const res = await apiFetch(`/api/admin/tenants/${tenant.id}/logo`, { method: 'DELETE' });
      if (res.ok) {
        setLogoPreview(null);
        setLogoFileName(null);
        setLogoFileSize(null);
        toast('Logo removed', 'success');
      } else {
        toast('Failed to remove logo', 'error');
      }
    } catch {
      toast('Failed to remove logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      // Fetch current tenant to merge settings
      const tenantRes = await apiFetch(`/api/admin/tenants/${tenant.id}`);
      if (!tenantRes.ok) throw new Error('Failed to fetch tenant');
      const tenantData = await tenantRes.json();

      const currentSettings = tenantData.settings ? JSON.parse(tenantData.settings) : {};
      const updatedSettings = {
        ...currentSettings,
        branding: {
          ...currentSettings.branding,
          primaryColor: colors.primaryColor,
          secondaryColor: colors.secondaryColor,
          accentColor: colors.accentColor,
        },
      };

      const res = await apiFetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: tenantData.name,
          contactEmail: tenantData.contactEmail,
          settings: JSON.stringify(updatedSettings),
        }),
      });

      if (res.ok) {
        toast('Brand colors saved', 'success');
      } else {
        toast('Failed to save colors', 'error');
      }
    } catch {
      toast('Failed to save colors', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setColors({
      primaryColor: '#1e40af',
      secondaryColor: '#64748b',
      accentColor: '#2563eb',
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const colorFields = [
    { key: 'primaryColor' as const, label: 'Primary Colour' },
    { key: 'accentColor' as const, label: 'Accent Colour' },
    { key: 'secondaryColor' as const, label: 'Background Colour' },
  ];

  return (
    <PageWrapper
      title="Tenant Branding"
      subtitle="Customise the look and feel of your ShumelaHire instance"
    >
      {/* Two-column grid: 55% left / 45% right */}
      <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 items-start">

        {/* ===== LEFT COLUMN: FORMS ===== */}
        <div className="space-y-6">

          {/* --- Logo Upload Card --- */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[1.0625rem] font-bold text-foreground">Organisation Logo</h3>
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Upload your organisation&apos;s logo for the sidebar and reports</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {/* Dropzone */}
            <div
              onClick={() => {
                if (!logoPreview) fileInputRef.current?.click();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-control transition-all duration-200
                ${logoPreview
                  ? 'border-solid border-border bg-card'
                  : isDragOver
                    ? 'border-primary bg-surface-navy cursor-pointer'
                    : 'border-border bg-background cursor-pointer hover:border-primary hover:bg-surface-navy'
                }
                ${logoPreview ? 'px-6 py-4' : 'px-6 py-10 text-center'}
              `}
            >
              {logoPreview ? (
                /* File preview state */
                <div className="flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-16 max-w-[180px] rounded-control object-contain"
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-foreground">
                      {logoFileName || 'Uploaded logo'}
                    </div>
                    {logoFileSize && (
                      <div className="text-xs text-muted-foreground">{logoFileSize}</div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogoRemove();
                    }}
                    disabled={uploading}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-error-bg text-error hover:bg-error hover:text-white transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                    title="Remove file"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Default upload state */
                <div>
                  <div className="w-14 h-14 rounded-full bg-icon-bg-navy text-primary flex items-center justify-center mx-auto mb-3.5">
                    <PhotoIcon className="w-6 h-6" />
                  </div>
                  <div className="text-[0.9375rem] font-semibold text-foreground mb-1">
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </div>
                  <div className="text-[0.8125rem] text-muted-foreground">
                    Drag and drop your logo here, or{' '}
                    <strong className="text-primary cursor-pointer">browse files</strong>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    PNG, SVG, or JPG up to 2MB (recommended: 200x200px)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- Brand Colours Card --- */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[1.0625rem] font-bold text-foreground">Brand Colours</h3>
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Define your organisation&apos;s colour palette</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <EyeIcon className="h-3.5 w-3.5" />
                <span>Live Preview</span>
                <input
                  type="checkbox"
                  checked={livePreview}
                  onChange={(e) => setLivePreview(e.target.checked)}
                  className="w-3.5 h-3.5 accent-primary"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4">
              {colorFields.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground min-w-[140px]">
                    {label}
                  </span>
                  <div className="w-10 h-10 rounded-control border-2 border-border cursor-pointer flex-shrink-0 overflow-hidden hover:border-primary transition-colors duration-200">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-14 h-14 border-none cursor-pointer -m-2 p-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={colors[key].toUpperCase()}
                    onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-[100px] px-3 py-2 border border-border rounded-control font-sans text-[0.8125rem] font-semibold text-foreground uppercase bg-card transition-all duration-200 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
                    maxLength={7}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* --- Typography Card --- */}
          <div className="enterprise-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[1.0625rem] font-bold text-foreground">Typography</h3>
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Font family and text styling for your instance</p>
              </div>
            </div>

            <div className="mt-3">
              {/* Font family display */}
              <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-control mb-3.5">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Font Family</div>
                  <div className="text-[0.9375rem] font-bold text-foreground">Manrope</div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">Weights: 400, 500, 600, 700, 800</div>
              </div>

              {/* Heading sample */}
              <div className="px-4 py-3.5 bg-background rounded-control mb-2.5">
                <div className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Heading Preview</div>
                <div className="text-[1.375rem] font-extrabold text-foreground">The quick brown fox jumps</div>
              </div>

              {/* Body sample */}
              <div className="px-4 py-3.5 bg-background rounded-control">
                <div className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Body Text Preview</div>
                <div className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                </div>
              </div>
            </div>
          </div>

          {/* --- Action Buttons --- */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSaveColors}
              disabled={saving}
              className="btn-cta px-8 py-3 text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {saving ? 'SAVING...' : 'SAVE BRANDING'}
            </button>
            <button
              onClick={resetToDefaults}
              className="btn-secondary px-8 py-3 text-sm inline-flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              RESET TO DEFAULT
            </button>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: PREVIEW (sticky) ===== */}
        <div className="lg:sticky lg:top-[88px] space-y-5">

          {/* --- Sidebar Preview --- */}
          <div className="enterprise-card overflow-hidden">
            <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3.5 pb-2">
              Sidebar Preview
            </div>
            <div className="flex rounded-b-card overflow-hidden min-h-[220px]">
              {/* Mini nav */}
              <div
                className="w-14 py-3.5 flex flex-col items-center gap-1"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <div className="w-8 h-8 rounded-control flex items-center justify-center text-[0.5rem] font-extrabold text-white mb-3 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    'LOGO'
                  )}
                </div>
                {/* Nav items */}
                <div className="w-9 h-9 rounded-control flex items-center justify-center text-white cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <div className="w-9 h-9 rounded-control flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/[0.08] cursor-pointer transition-all duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div className="w-9 h-9 rounded-control flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/[0.08] cursor-pointer transition-all duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div className="w-9 h-9 rounded-control flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/[0.08] cursor-pointer transition-all duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
              </div>
              {/* Mini main content */}
              <div className="flex-1 bg-background p-4">
                <div className="text-xs font-bold text-foreground mb-2.5">Dashboard</div>
                <div className="rounded-md p-2.5 px-3 mb-2 border border-border bg-card text-[0.625rem]">
                  <div className="font-bold text-foreground mb-0.5">Active Vacancies</div>
                  <div className="text-muted-foreground">12 open positions</div>
                </div>
                <div className="rounded-md p-2.5 px-3 border border-border bg-card text-[0.625rem]">
                  <div className="font-bold text-foreground mb-0.5">Pending Reviews</div>
                  <div className="text-muted-foreground">5 applications</div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Button Samples --- */}
          <div className="enterprise-card overflow-hidden">
            <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3.5 pb-2">
              Button Samples
            </div>
            <div className="flex flex-wrap gap-2.5 px-4 pb-4">
              <button
                className="px-3.5 py-1.5 rounded-button text-xs font-bold uppercase tracking-wide text-white border-2 border-transparent transition-all duration-200"
                style={{ backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }}
              >
                PRIMARY
              </button>
              <button
                className="px-3.5 py-1.5 rounded-button text-xs font-bold uppercase tracking-wide border-2 border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200"
              >
                SECONDARY
              </button>
              <button
                className="px-3.5 py-1.5 rounded-button text-xs font-extrabold uppercase tracking-wide border-2 transition-all duration-200"
                style={{ backgroundColor: colors.accentColor, borderColor: colors.accentColor, color: '#0F172A' }}
              >
                CALL TO ACTION
              </button>
            </div>
          </div>

          {/* --- Typography Preview --- */}
          <div className="enterprise-card overflow-hidden">
            <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3.5 pb-2">
              Typography Preview
            </div>
            <div className="px-4 pb-4">
              <div
                className="text-xl font-extrabold mb-1.5"
                style={{ color: colors.primaryColor }}
              >
                Heading Sample Text
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Body text appears in this style. Lorem ipsum dolor sit amet, consectetur adipiscing elit. This demonstrates how your brand colours influence the overall reading experience.
              </div>
            </div>
          </div>

          {/* --- Card Preview --- */}
          <div className="enterprise-card overflow-hidden">
            <div className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-3.5 pb-2">
              Card Preview
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-card p-4 border border-border">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[0.625rem] font-bold text-white"
                    style={{ backgroundColor: colors.primaryColor }}
                  >
                    JD
                  </div>
                  <div>
                    <div className="text-[0.8125rem] font-bold text-foreground">Jane Dlamini</div>
                    <div className="text-[0.6875rem] text-muted-foreground">Senior Engineer</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mb-3 leading-snug">
                  Application progress for the Infrastructure Development Lead position.
                </div>
                <div className="h-1.5 rounded-md bg-border overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{ width: '72%', backgroundColor: colors.accentColor }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
