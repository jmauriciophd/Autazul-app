/**
 * Central exports file for utils
 * This ensures proper bundling and prevents tree-shaking issues
 */

// Auth exports
export { 
  AuthProvider, 
  useAuth,
  AuthContext 
} from './AuthContext'

export type { 
  User, 
  AuthContextType 
} from './AuthContext'

// API exports
export { api } from './api'

// Notification exports
export { notify, getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './notifications'
