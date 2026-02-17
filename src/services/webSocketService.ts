import { EventEmitter } from 'events';

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface ApplicationStatusUpdate extends WebSocketEvent {
  type: 'application_status_updated';
  data: {
    applicationId: number;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
    jobId: number;
    candidateName: string;
  };
}

export interface InterviewScheduled extends WebSocketEvent {
  type: 'interview_scheduled';
  data: {
    interviewId: number;
    applicationId: number;
    candidateName: string;
    jobTitle: string;
    scheduledFor: string;
    interviewerIds: number[];
  };
}

export interface WorkflowStatusUpdate extends WebSocketEvent {
  type: 'workflow_status_updated';
  data: {
    executionId: string;
    workflowName: string;
    previousStatus: string;
    newStatus: string;
    currentStep: number;
    totalSteps: number;
  };
}

export interface NewApplicationReceived extends WebSocketEvent {
  type: 'new_application_received';
  data: {
    applicationId: number;
    candidateName: string;
    jobId: number;
    jobTitle: string;
    source: string;
    submittedAt: string;
  };
}

export interface OfferStatusUpdate extends WebSocketEvent {
  type: 'offer_status_updated';
  data: {
    offerId: number;
    applicationId: number;
    candidateName: string;
    jobTitle: string;
    previousStatus: string;
    newStatus: string;
    updatedBy: string;
  };
}

export interface SystemNotification extends WebSocketEvent {
  type: 'system_notification';
  data: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    read?: boolean;
  };
}

// Connection Status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// WebSocket Options
export interface WebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  enableHeartbeat?: boolean;
  debug?: boolean;
}

class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private connectionStatus: ConnectionStatus = 'disconnected';
  
  private readonly options: Required<WebSocketOptions> = {
    url: process.env.NODE_ENV === 'production' 
      ? 'wss://api.shumelahire.co.za/ws'
      : 'ws://localhost:8080/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    enableHeartbeat: true,
    debug: false,
  };

  constructor(options?: WebSocketOptions) {
    super();
    this.options = { ...this.options, ...options };
    
    if (this.options.debug) {
      console.log('WebSocket service initialized with options:', this.options);
    }
  }

  // Connect to WebSocket
  connect(token?: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.options.debug) {
        console.log('WebSocket already connected');
      }
      return;
    }

    this.setConnectionStatus('connecting');
    
    const url = token 
      ? `${this.options.url}?token=${token}`
      : this.options.url;

    try {
      this.socket = new WebSocket(url);
      this.setupEventHandlers();
      
      if (this.options.debug) {
        console.log('Attempting to connect to:', url);
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setConnectionStatus('error');
      this.scheduleReconnect();
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }

    this.setConnectionStatus('disconnected');
    this.reconnectAttempts = 0;

    if (this.options.debug) {
      console.log('WebSocket disconnected manually');
    }
  }

  // Send message
  send(message: any): boolean {
    if (!this.isConnected()) {
      console.warn('WebSocket not connected. Message not sent:', message);
      return false;
    }

    try {
      const payload = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
        
      this.socket!.send(payload);
      
      if (this.options.debug) {
        console.log('Message sent:', payload);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  // Subscribe to specific event types
  subscribe(eventTypes: string[]): void {
    this.send({
      type: 'subscribe',
      events: eventTypes,
      timestamp: new Date().toISOString(),
    });
  }

  // Unsubscribe from event types
  unsubscribe(eventTypes: string[]): void {
    this.send({
      type: 'unsubscribe',
      events: eventTypes,
      timestamp: new Date().toISOString(),
    });
  }

  // Join room for targeted updates
  joinRoom(roomId: string): void {
    this.send({
      type: 'join_room',
      roomId,
      timestamp: new Date().toISOString(),
    });
  }

  // Leave room
  leaveRoom(roomId: string): void {
    this.send({
      type: 'leave_room',
      roomId,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connection status
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Get reconnect attempts count
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      
      if (this.options.debug) {
        console.log('WebSocket connected successfully');
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        console.log('Raw message:', event.data);
      }
    };

    this.socket.onclose = (event) => {
      this.setConnectionStatus('disconnected');
      this.stopHeartbeat();
      
      if (this.options.debug) {
        console.log('WebSocket closed:', event.code, event.reason);
      }
      
      // Reconnect unless it was a manual disconnect
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.setConnectionStatus('error');
    };
  }

  private handleMessage(data: WebSocketEvent): void {
    if (this.options.debug) {
      console.log('Received WebSocket message:', data);
    }

    // Handle heartbeat response
    if (data.type === 'pong') {
      return; // Heartbeat acknowledged
    }

    // Emit the specific event type
    this.emit(data.type, data);
    
    // Also emit a generic 'message' event
    this.emit('message', data);
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    const previousStatus = this.connectionStatus;
    this.connectionStatus = status;
    
    if (previousStatus !== status) {
      this.emit('connectionStatusChanged', {
        previousStatus,
        newStatus: status,
        reconnectAttempts: this.reconnectAttempts,
      });
      
      if (this.options.debug) {
        console.log(`Connection status changed: ${previousStatus} -> ${status}`);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached. Giving up.');
      this.setConnectionStatus('error');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    this.setConnectionStatus('reconnecting');
    
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    if (this.options.debug) {
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    }

    this.reconnectTimer = setTimeout(() => {
      const token = localStorage.getItem('auth_token');
      this.connect(token || undefined);
    }, delay);
  }

  private startHeartbeat(): void {
    if (!this.options.enableHeartbeat) return;

    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString(),
        });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Notification Service
class NotificationService {
  private static instance: NotificationService;
  private notifications: SystemNotification[] = [];
  private maxNotifications = 100;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  addNotification(notification: SystemNotification): void {
    this.notifications.unshift(notification);
    
    // Keep only the latest notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Show browser notification if supported and permitted
    this.showBrowserNotification(notification);
  }

  getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.data.read).length;
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.data.id === notificationId);
    if (notification) {
      notification.data.read = true;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.data.read = true;
    });
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  private showBrowserNotification(notification: SystemNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.data.title, {
        body: notification.data.message,
        icon: '/favicon.ico',
        tag: notification.data.id,
      });

      browserNotification.onclick = () => {
        if (notification.data.actionUrl) {
          window.open(notification.data.actionUrl, '_blank');
        }
        browserNotification.close();
      };
    }
  }

  static requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }
}

// Create singleton instances
export const webSocketService = new WebSocketService();
export const notificationService = NotificationService.getInstance();

// Initialize WebSocket with automatic connection management
export const initializeWebSocket = (token?: string) => {
  // Set up event listeners
  webSocketService.on('new_application_received', (event: NewApplicationReceived) => {
    notificationService.addNotification({
      type: 'system_notification',
      data: {
        id: `app_${event.data.applicationId}`,
        level: 'info',
        title: 'New Application',
        message: `${event.data.candidateName} applied for ${event.data.jobTitle}`,
        actionUrl: `/applications/${event.data.applicationId}`,
        actionText: 'View Application',
      },
      timestamp: event.timestamp,
    });
  });

  webSocketService.on('application_status_updated', (event: ApplicationStatusUpdate) => {
    notificationService.addNotification({
      type: 'system_notification',
      data: {
        id: `status_${event.data.applicationId}`,
        level: 'info',
        title: 'Application Status Updated',
        message: `${event.data.candidateName}'s application moved to ${event.data.newStatus}`,
        actionUrl: `/applications/${event.data.applicationId}`,
        actionText: 'View Application',
      },
      timestamp: event.timestamp,
    });
  });

  webSocketService.on('interview_scheduled', (event: InterviewScheduled) => {
    notificationService.addNotification({
      type: 'system_notification',
      data: {
        id: `interview_${event.data.interviewId}`,
        level: 'success',
        title: 'Interview Scheduled',
        message: `Interview with ${event.data.candidateName} for ${event.data.jobTitle}`,
        actionUrl: `/interviews/${event.data.interviewId}`,
        actionText: 'View Interview',
      },
      timestamp: event.timestamp,
    });
  });

  webSocketService.on('workflow_status_updated', (event: WorkflowStatusUpdate) => {
    if (event.data.newStatus === 'failed') {
      notificationService.addNotification({
        type: 'system_notification',
        data: {
          id: `workflow_${event.data.executionId}`,
          level: 'error',
          title: 'Workflow Failed',
          message: `${event.data.workflowName} execution failed`,
          actionUrl: `/workflow/executions/${event.data.executionId}`,
          actionText: 'View Execution',
        },
        timestamp: event.timestamp,
      });
    }
  });

  // Connect with authentication token
  webSocketService.connect(token);

  // Subscribe to relevant events
  webSocketService.subscribe([
    'new_application_received',
    'application_status_updated',
    'interview_scheduled',
    'workflow_status_updated',
    'offer_status_updated',
    'system_notification',
  ]);
};

export default webSocketService;
