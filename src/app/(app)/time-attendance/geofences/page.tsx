'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { Geofence, attendanceService } from '@/services/attendanceService';
import { PlusIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radiusMeters: '100', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    attendanceService.getGeofences().then((data) => {
      setGeofences(data);
      setLoading(false);
    }).catch(() => {
      toast('Failed to load geofences', 'error');
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    setError('');

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.radiusMeters);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90.');
      setSubmitting(false);
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180.');
      setSubmitting(false);
      return;
    }
    if (isNaN(radius) || radius <= 0) {
      setError('Radius must be greater than 0.');
      setSubmitting(false);
      return;
    }

    try {
      const geofence = await attendanceService.createGeofence({
        name: form.name,
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
        address: form.address || undefined,
      });
      setGeofences((prev) => [...prev, geofence]);
      setShowForm(false);
      setForm({ name: '', latitude: '', longitude: '', radiusMeters: '100', address: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await attendanceService.deleteGeofence(id);
      setGeofences((prev) => prev.filter((g) => g.id !== id));
      toast('Geofence deleted', 'success');
    } catch {
      toast('Failed to delete geofence', 'error');
    }
  };

  return (
    <FeatureGate feature="GEOFENCING">
      <PageWrapper
        title="Geofence Configuration"
        subtitle="Manage location-based attendance validation zones"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-cta inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Add Geofence
          </button>
        }
      >
        <div className="space-y-6">
          {showForm && (
            <div className="enterprise-card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">New Geofence</h3>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Head Office" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Optional address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="-29.8587" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="31.0218" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Radius (meters)</label>
                  <input type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleCreate} disabled={submitting || !form.name || !form.latitude || !form.longitude}
                  className="btn-cta disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Geofence'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-muted">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : geofences.length === 0 ? (
            <EmptyState icon={MapPinIcon} title="No Geofences" description="No geofences configured. Add one to enable location-based attendance validation." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geofences.map((g) => (
                <div key={g.id} className="enterprise-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-blue-500" />
                      <h3 className="font-medium text-foreground">{g.name}</h3>
                    </div>
                    <button onClick={() => setDeleteTarget(g.id)} className="text-red-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {g.address && <p className="text-sm text-muted-foreground mt-1">{g.address}</p>}
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <p>Lat: {g.latitude}, Lng: {g.longitude}</p>
                    <p>Radius: {g.radiusMeters}m</p>
                  </div>
                  <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${g.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {g.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ConfirmDialog
          open={deleteTarget !== null}
          title="Delete Geofence"
          message="Are you sure you want to delete this geofence? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => { if (deleteTarget !== null) { handleDelete(deleteTarget); setDeleteTarget(null); } }}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageWrapper>
    </FeatureGate>
  );
}
