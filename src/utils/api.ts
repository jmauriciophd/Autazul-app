import { projectId, publicAnonKey } from './supabase/info'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a07d0a8e`

export interface ApiResponse<T = any> {
  data?: T
  error?: string
}

export class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`
    }

    const fullUrl = `${BASE_URL}${endpoint}`
    console.log(`API Request: ${options.method || 'GET'} ${fullUrl}`)

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      const data = await response.json()
      console.log(`API Response for ${endpoint}:`, { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error)
      throw error
    }
  }

  // Helper method for GET requests
  async get<T = any>(endpoint: string): Promise<{ data: T }> {
    const result = await this.request<T>(`/${endpoint}`)
    return { data: result }
  }

  // Auth
  async signup(email: string, password: string, name: string, role: 'parent' | 'professional' = 'parent') {
    return this.request<{ success: boolean; userId: string }>('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
  }

  async getUser() {
    return this.request<{ user: any }>('/get-user', {
      method: 'POST',
    })
  }

  // Children
  async createChild(name: string, birthDate: string, photo?: string, school?: string) {
    return this.request<{ success: boolean; child: any }>('/children', {
      method: 'POST',
      body: JSON.stringify({ name, birthDate, photo, school }),
    })
  }

  async getChildren() {
    return this.request<{ children: any[] }>('/children')
  }

  async getChild(childId: string) {
    return this.request<{ child: any }>(`/children/${childId}`)
  }

  // Professionals
  async createProfessionalInvite(
    childId: string,
    professionalName: string,
    professionalEmail: string,
    professionalType: string
  ) {
    return this.request<{ success: boolean; inviteUrl: string; token: string }>(
      '/professionals/invite',
      {
        method: 'POST',
        body: JSON.stringify({
          childId,
          professionalName,
          professionalEmail,
          professionalType,
        }),
      }
    )
  }

  async inviteProfessionalByEmail(childId: string, professionalEmail: string) {
    return this.request<{ success: boolean; message: string; professionalName: string }>(
      '/professionals/invite-by-email',
      {
        method: 'POST',
        body: JSON.stringify({
          childId,
          professionalEmail,
        }),
      }
    )
  }

  async getPendingInvitations() {
    return this.request<{ invitations: any[] }>('/invitations/pending')
  }

  async acceptInvitation(invitationId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/invitations/${invitationId}/accept`,
      {
        method: 'POST',
      }
    )
  }

  async rejectInvitation(invitationId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/invitations/${invitationId}/reject`,
      {
        method: 'POST',
      }
    )
  }

  async getInvite(token: string) {
    return this.request<{ invite: any }>(`/professionals/invite/${token}`)
  }

  async acceptInvite(token: string, email: string, password: string, name: string) {
    return this.request<{ success: boolean; professionalId: string }>(
      `/professionals/accept/${token}`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }
    )
  }

  async getProfessionalsForChild(childId: string) {
    return this.request<{ professionals: any[] }>(`/children/${childId}/professionals`)
  }

  async removeProfessional(childId: string, professionalId: string) {
    return this.request<{ success: boolean }>(
      `/children/${childId}/professionals/${professionalId}`,
      {
        method: 'DELETE',
      }
    )
  }

  async getChildrenForProfessional() {
    return this.request<{ children: any[] }>('/professional/children')
  }

  // Events
  async createEvent(eventData: {
    childId: string
    type: string
    date: string
    time: string
    description: string
    severity: string
    photos?: string[]
    evaluation: string
  }) {
    return this.request<{ success: boolean; event: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  }

  async getEvents(childId: string, yearMonth: string) {
    return this.request<{ events: any[] }>(`/events/${childId}/${yearMonth}`)
  }

  async getEvent(eventId: string) {
    return this.request<{ event: any }>(`/events/${eventId}`)
  }

  // Update child
  async updateChild(childId: string, updateData: any) {
    return this.request<{ success: boolean; child: any }>(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  }

  // Co-parents
  async createCoParentInvite(childId: string, coParentEmail: string, coParentName: string) {
    return this.request<{ success: boolean; inviteUrl: string; token: string }>(
      `/children/${childId}/coparents`,
      {
        method: 'POST',
        body: JSON.stringify({ coParentEmail, coParentName }),
      }
    )
  }

  async inviteCoParentByEmail(childId: string, coParentEmail: string) {
    return this.request<{ success: boolean; message: string; coParentName: string }>(
      '/coparents/invite-by-email',
      {
        method: 'POST',
        body: JSON.stringify({
          childId,
          coParentEmail,
        }),
      }
    )
  }

  async getCoParentInvite(token: string) {
    return this.request<{ invite: any }>(`/coparents/invite/${token}`)
  }

  async acceptCoParentInvite(token: string, email: string, password: string, name: string) {
    return this.request<{ success: boolean; coParentId: string }>(
      `/coparents/accept/${token}`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }
    )
  }

  async acceptCoParentInviteByEmail(token: string) {
    return this.request<{ success: boolean; message: string }>(
      `/coparents/accept-by-email/${token}`,
      {
        method: 'POST',
      }
    )
  }

  async getCoParentsForChild(childId: string) {
    return this.request<{ coParents: any[] }>(`/children/${childId}/coparents`)
  }

  async leaveAsCoParent(childId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/children/${childId}/coparent/leave`,
      {
        method: 'DELETE',
      }
    )
  }

  // Child sharing
  async shareChild(childId: string, parentEmail: string) {
    return this.request<{ success: boolean; message: string; parentName: string }>(
      `/children/${childId}/share`,
      {
        method: 'POST',
        body: JSON.stringify({ parentEmail }),
      }
    )
  }

  async acceptChildShare(invitationId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/children/shared/${invitationId}/accept`,
      {
        method: 'POST',
      }
    )
  }

  async rejectChildShare(invitationId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/children/shared/${invitationId}/reject`,
      {
        method: 'POST',
      }
    )
  }

  async removeSharedAccess(childId: string, userId: string) {
    return this.request<{ success: boolean }>(
      `/children/${childId}/shared/${userId}`,
      {
        method: 'DELETE',
      }
    )
  }

  // Appointments
  async createAppointment(appointmentData: {
    childId: string
    professionalId: string
    date: string
    time: string
    notes?: string
    requestedBy?: string
  }) {
    return this.request<{ success: boolean; appointment: any }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    })
  }

  async getAppointmentsForProfessional() {
    return this.request<{ appointments: any[] }>('/appointments/professional')
  }

  async getAppointmentsForChild(childId: string) {
    return this.request<{ appointments: any[] }>(`/appointments/child/${childId}`)
  }

  async updateAppointment(appointmentId: string, status: string, notes?: string) {
    return this.request<{ success: boolean; appointment: any }>(
      `/appointments/${appointmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }
    )
  }

  // Admin
  async getAdminSettings() {
    return this.request<{ settings: any }>('/admin/settings')
  }

  async updateAdminSettings(settings: {
    googleAdsCode?: string
    googleAdsSegmentation?: string
    banners?: Array<{
      id: string
      imageUrl: string
      link?: string
      title?: string
      order: number
    }>
    bannerUrl?: string
    bannerLink?: string
  }) {
    return this.request<{ success: boolean; settings: any }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getAdminStats() {
    return this.request<{
      systemStats: {
        totalUsers: number
        totalParents: number
        totalProfessionals: number
        totalChildren: number
        totalEvents: number
      }
      userStats: Array<{
        name: string
        email: string
        userType: string
        registrationCount: number
        joinedAt: string
      }>
    }>('/admin/stats')
  }

  async getPublicSettings() {
    return this.request<{ settings: any }>('/admin/public-settings')
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[] }>('/notifications')
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<{ success: boolean }>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  async markAllNotificationsAsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT',
    })
  }

  // Password change
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // 2FA
  async toggle2FA(enabled: boolean) {
    return this.request<{ success: boolean; twoFactorEnabled: boolean }>('/toggle-2fa', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    })
  }

  async generate2FACode() {
    return this.request<{ success: boolean; message: string }>('/generate-2fa-code', {
      method: 'POST',
    })
  }

  async verify2FACode(code: string) {
    return this.request<{ success: boolean; message: string }>('/verify-2fa-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async check2FARequired() {
    return this.request<{ required: boolean }>('/check-2fa-required')
  }

  // Feedback
  async submitFeedback(rating: number, feedback: string) {
    return this.request<{ success: boolean; message: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    })
  }
}

export const api = new ApiClient()