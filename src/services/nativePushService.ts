import { apiFetch } from '@/lib/api-fetch';

export interface DeviceRegistration {
  id: number;
  employeeId: number;
  employeeName: string;
  deviceToken: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName: string;
  isActive: boolean;
  lastUsedAt: string | null;
  registeredAt: string;
}

export interface PushResult {
  success: boolean;
  message: string;
  devicesTargeted: number;
  platforms?: string[];
  title?: string;
  sentAt?: string;
}

export const nativePushService = {
  /**
   * Register a device for push notifications.
   */
  async registerDevice(data: {
    employeeId: number;
    deviceToken: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    deviceName?: string;
  }): Promise<DeviceRegistration> {
    const response = await apiFetch('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to register device');
    }
    return await response.json();
  },

  /**
   * Unregister a device by ID.
   */
  async unregisterDevice(id: number): Promise<void> {
    const response = await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to unregister device');
  },

  /**
   * Get all devices for the current employee.
   */
  async getMyDevices(employeeId: number): Promise<DeviceRegistration[]> {
    const response = await apiFetch(`/api/devices/my?employeeId=${employeeId}`);
    if (!response.ok) return [];
    return await response.json();
  },

  /**
   * Send a push notification to a specific employee (admin only).
   */
  async sendPush(data: {
    employeeId: number;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<PushResult> {
    const response = await apiFetch('/api/devices/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to send push notification');
    }
    return await response.json();
  },

  /**
   * Broadcast a push notification to all employees (admin only).
   */
  async broadcastPush(title: string, body: string): Promise<PushResult> {
    const response = await apiFetch('/api/devices/push/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to broadcast push notification');
    }
    return await response.json();
  },
};
