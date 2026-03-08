'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [colors, setColors] = useState({
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    accentColor: '#2563eb',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [livePreview, setLivePreview] = useState(false);

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

  return (
    <PageWrapper
      title="Branding"
      subtitle="Customize your organization's look and feel"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Organization Logo</h3>

            <div className="flex items-start gap-6">
              {/* Current logo preview */}
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[2px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <PhotoIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-xs text-gray-500">
                  Upload your organization logo. Supported formats: PNG, JPEG, GIF, SVG, WebP. Maximum size: 2MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  {logoPreview && (
                    <button
                      onClick={handleLogoRemove}
                      disabled={uploading}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-[2px] hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5 inline mr-1" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Brand Colors</h3>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <EyeIcon className="h-3.5 w-3.5" />
                <span>Live Preview</span>
                <input
                  type="checkbox"
                  checked={livePreview}
                  onChange={(e) => setLivePreview(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'primaryColor' as const, label: 'Primary Color', desc: 'Headings, active elements' },
                { key: 'secondaryColor' as const, label: 'Secondary Color', desc: 'Supporting text, borders' },
                { key: 'accentColor' as const, label: 'Accent / CTA Color', desc: 'Buttons, highlights' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <p className="text-[10px] text-gray-400">{desc}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-[2px] border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleSaveColors}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-medium bg-primary text-white rounded-[2px] hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Colors'}
              </button>
              <button
                onClick={resetToDefaults}
                className="px-4 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-[2px] hover:bg-gray-50 transition-colors"
              >
                <ArrowPathIcon className="h-3.5 w-3.5 inline mr-1" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Preview</h3>

          <div className="space-y-4 text-xs">
            {/* Mini sidebar preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-[2px] overflow-hidden">
              <div className="h-8 flex items-center px-3" style={{ backgroundColor: colors.primaryColor }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-5 w-auto object-contain brightness-0 invert" />
                ) : (
                  <span className="text-white font-semibold text-[10px]">LOGO</span>
                )}
              </div>
              <div className="p-2 space-y-1 bg-gray-50 dark:bg-gray-900">
                <div className="px-2 py-1 rounded text-white text-[10px] font-medium" style={{ backgroundColor: colors.accentColor }}>
                  Active Item
                </div>
                <div className="px-2 py-1 text-[10px] text-gray-500">Menu Item</div>
                <div className="px-2 py-1 text-[10px] text-gray-500">Menu Item</div>
              </div>
            </div>

            {/* Button previews */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Buttons</p>
              <button className="w-full px-3 py-1.5 rounded-[2px] text-white text-[10px] font-medium" style={{ backgroundColor: colors.primaryColor }}>
                Primary Button
              </button>
              <button className="w-full px-3 py-1.5 rounded-[2px] text-white text-[10px] font-medium" style={{ backgroundColor: colors.accentColor }}>
                CTA Button
              </button>
              <button className="w-full px-3 py-1.5 rounded-[2px] text-[10px] font-medium border" style={{ borderColor: colors.secondaryColor, color: colors.secondaryColor }}>
                Secondary Button
              </button>
            </div>

            {/* Text preview */}
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Typography</p>
              <p className="text-sm font-semibold" style={{ color: colors.primaryColor }}>Heading Text</p>
              <p className="text-[10px]" style={{ color: colors.secondaryColor }}>Supporting body text in the secondary color for descriptions and muted content.</p>
              <p className="text-[10px] font-medium" style={{ color: colors.accentColor }}>Accent link text</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
