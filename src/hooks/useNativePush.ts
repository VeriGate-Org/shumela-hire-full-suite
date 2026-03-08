'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { nativePushService, DeviceRegistration } from '@/services/nativePushService';

interface UseNativePushOptions {
  employeeId: number | null;
  enabled?: boolean;
}

interface UseNativePushReturn {
  isRegistered: boolean;
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  devices: DeviceRegistration[];
  register: () => Promise<void>;
  unregister: (deviceId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook that manages web push notification registration.
 * On mount (when enabled and employeeId is provided), it:
 * 1. Checks browser support for notifications
 * 2. Requests permission if not already granted
 * 3. Registers the device with the backend
 * 4. Loads existing device registrations
 */
export function useNativePush({ employeeId, enabled = true }: UseNativePushOptions): UseNativePushReturn {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registrationAttempted = useRef(false);

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Load existing devices
  const loadDevices = useCallback(async () => {
    if (!employeeId) return;
    try {
      const data = await nativePushService.getMyDevices(employeeId);
      setDevices(data);
      setIsRegistered(data.some((d) => d.isActive && d.platform === 'WEB'));
    } catch (err) {
      console.warn('Failed to load device registrations:', err);
    }
  }, [employeeId]);

  // Auto-register on mount
  useEffect(() => {
    if (!enabled || !employeeId || !isSupported || registrationAttempted.current) return;

    registrationAttempted.current = true;

    const autoRegister = async () => {
      try {
        // Load existing devices first
        await loadDevices();

        // Only attempt registration if not already registered
        if (Notification.permission === 'granted') {
          await performRegistration(employeeId);
        }
      } catch (err) {
        console.warn('Auto-registration skipped:', err);
      }
    };

    autoRegister();
  }, [enabled, employeeId, isSupported, loadDevices]);

  const performRegistration = async (empId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Generate a unique token for web push (in production, use ServiceWorker push subscription)
      const token = generateWebPushToken();

      // Get device name from user agent
      const deviceName = getDeviceName();

      await nativePushService.registerDevice({
        employeeId: empId,
        deviceToken: token,
        platform: 'WEB',
        deviceName,
      });

      setIsRegistered(true);
      await loadDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register device';
      setError(message);
      console.error('Push registration failed:', message);
    } finally {
      setLoading(false);
    }
  };

  const register = useCallback(async () => {
    if (!employeeId || !isSupported) return;

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setError('Notification permission denied');
          return;
        }
      } else if (Notification.permission === 'denied') {
        setError('Notifications are blocked. Please enable them in browser settings.');
        return;
      }

      await performRegistration(employeeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    }
  }, [employeeId, isSupported, loadDevices]);

  const unregister = useCallback(async (deviceId: number) => {
    setLoading(true);
    setError(null);
    try {
      await nativePushService.unregisterDevice(deviceId);
      setIsRegistered(false);
      await loadDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unregister';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadDevices]);

  return {
    isRegistered,
    isSupported,
    permission,
    devices,
    register,
    unregister,
    loading,
    error,
  };
}

/**
 * Generate a pseudo-unique web push token.
 * In production, this would be the PushSubscription endpoint from a ServiceWorker.
 */
function generateWebPushToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return 'web-push-' + Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract a human-readable device name from the user agent.
 */
function getDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';

  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari Browser';
  if (ua.includes('Edg')) return 'Edge Browser';
  return 'Web Browser';
}
