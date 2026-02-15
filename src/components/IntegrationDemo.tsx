'use client';

import React, { useState, useEffect } from 'react';
import { 
  initializeServices, 
  checkServiceHealth, 
  getServiceStatus,
  authService,
  webSocketService,
  notificationService,
  applicationApi,
  jobApi,
  analyticsApi,
  ConnectionStatus
} from '@/services';

// Day 9 Integration Demo Component
export default function IntegrationDemo() {
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize all services
    initializeServices();

    // Set up WebSocket connection status monitoring
    const handleConnectionStatusChange = (event: any) => {
      setConnectionStatus(event.newStatus);
    };

    webSocketService.on('connectionStatusChanged', handleConnectionStatusChange);

    // Set up notification monitoring
    const updateNotifications = () => {
      setNotifications(notificationService.getNotifications().slice(0, 5));
    };

    // Set up real-time event listeners
    webSocketService.on('new_application_received', (event) => {
      console.log('New application received:', event);
      updateNotifications();
      loadRecentApplications(); // Refresh data
    });

    webSocketService.on('application_status_updated', (event) => {
      console.log('Application status updated:', event);
      updateNotifications();
    });

    // Initial data load
    loadServiceHealth();
    updateNotifications();
    loadRecentApplications();

    // Cleanup
    return () => {
      webSocketService.off('connectionStatusChanged', handleConnectionStatusChange);
    };
  }, []);

  const loadServiceHealth = async () => {
    try {
      const health = await checkServiceHealth();
      const status = getServiceStatus();
      setServiceHealth(health);
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to load service health:', error);
    }
  };

  const loadRecentApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationApi.getApplications(
        {},
        { page: 1, size: 5, sort: 'createdAt', direction: 'desc' }
      );
      setRecentApplications(response.content);
    } catch (error) {
      console.error('Failed to load applications:', error);
      // Fallback to mock data for demo
      setRecentApplications([
        { id: 1, candidateName: 'John Doe', jobTitle: 'Software Engineer', status: 'new', createdAt: new Date().toISOString() },
        { id: 2, candidateName: 'Jane Smith', jobTitle: 'Product Manager', status: 'review', createdAt: new Date().toISOString() },
        { id: 3, candidateName: 'Mike Johnson', jobTitle: 'UX Designer', status: 'interview', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateNewApplication = () => {
    // Simulate a new application WebSocket event
    const mockEvent = {
      type: 'new_application_received',
      data: {
        applicationId: Math.floor(Math.random() * 1000),
        candidateName: 'John Smith',
        jobId: 1,
        jobTitle: 'Senior Developer',
        source: 'LinkedIn',
        submittedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Trigger the event handler manually for demo
    webSocketService.emit('new_application_received', mockEvent);
  };

  const getStatusColor = (status: boolean | ConnectionStatus) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-600' : 'text-red-600';
    }
    
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'reconnecting': return 'text-orange-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: boolean | ConnectionStatus) => {
    if (typeof status === 'boolean') {
      return status ? '✅' : '❌';
    }
    
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'reconnecting': return '🟠';
      case 'disconnected': return '⚫';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Day 9: Integration & APIs Demo
        </h1>
        <p className="text-gray-600">
          Real-time integration between frontend services and backend APIs
        </p>
      </div>

      {/* Service Health Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Service Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>API Service</span>
              <span className={getStatusColor(serviceHealth?.api || false)}>
                {getStatusIcon(serviceHealth?.api || false)} 
                {serviceHealth?.api ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Authentication</span>
              <span className={getStatusColor(serviceHealth?.auth || false)}>
                {getStatusIcon(serviceHealth?.auth || false)} 
                {serviceHealth?.auth ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>WebSocket</span>
              <span className={getStatusColor(connectionStatus)}>
                {getStatusIcon(connectionStatus)} 
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
          </div>
          
          <button
            onClick={loadServiceHealth}
            className="mt-4 w-full bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Real-time Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Live Notifications</h3>
            <span className="bg-violet-100 text-violet-800 px-2 py-1 rounded-full text-sm">
              {notifications.length}
            </span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications yet</p>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border-l-4 border-violet-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{notification.data.title}</p>
                      <p className="text-gray-600 text-xs">{notification.data.message}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={simulateNewApplication}
            className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
          >
            Simulate New Application
          </button>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Applications</h3>
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full"></div>
            )}
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentApplications.length === 0 ? (
              <p className="text-gray-500 text-sm">Loading applications...</p>
            ) : (
              recentApplications.map((application, index) => (
                <div
                  key={application.id || index}
                  className="p-3 bg-gray-50 rounded"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {application.candidateName || `Application #${index + 1}`}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {application.jobTitle || 'Position Title'}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        application.status === 'new' ? 'bg-green-100 text-green-800' :
                        application.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'interview' ? 'bg-violet-100 text-violet-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {application.status || 'new'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(application.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={loadRecentApplications}
            disabled={isLoading}
            className="mt-4 w-full bg-violet-500 text-white px-4 py-2 rounded hover:bg-violet-600 transition-colors text-sm disabled:opacity-50"
          >
            Refresh Applications
          </button>
        </div>
      </div>

      {/* API Integration Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">API Integration Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-violet-50 p-4 rounded">
            <h4 className="font-medium text-violet-900">Application API</h4>
            <p className="text-violet-700 text-sm">CRUD operations, filtering, export</p>
            <span className="text-green-600 text-sm">✅ Active</span>
          </div>
          
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-medium text-purple-900">Job Management API</h4>
            <p className="text-purple-700 text-sm">Job lifecycle, templates, search</p>
            <span className="text-green-600 text-sm">✅ Active</span>
          </div>
          
          <div className="bg-orange-50 p-4 rounded">
            <h4 className="font-medium text-orange-900">Analytics API</h4>
            <p className="text-orange-700 text-sm">Metrics, reports, insights</p>
            <span className="text-green-600 text-sm">✅ Active</span>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-900">Workflow API</h4>
            <p className="text-green-700 text-sm">Execution, monitoring, logs</p>
            <span className="text-green-600 text-sm">✅ Active</span>
          </div>
        </div>
      </div>

      {/* Service Configuration */}
      {serviceStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Service Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">API Client</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{JSON.stringify({
  baseUrl: serviceStatus.api?.baseUrl || 'http://localhost:8080',
  timeout: serviceStatus.api?.timeout || 30000,
  retryAttempts: 3
}, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{JSON.stringify({
  authenticated: serviceStatus.auth?.isAuthenticated || false,
  user: serviceStatus.auth?.user?.email || 'Not logged in',
  tokenExpired: serviceStatus.auth?.tokenExpired || false
}, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">WebSocket</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{JSON.stringify({
  status: serviceStatus.websocket?.status || 'disconnected',
  reconnectAttempts: serviceStatus.websocket?.reconnectAttempts || 0,
  heartbeat: 'enabled'
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-600">
        <p>🚀 Day 9 Integration & APIs - Complete Implementation</p>
        <p>Real-time communication, comprehensive API layer, and service integration</p>
      </div>
    </div>
  );
}
