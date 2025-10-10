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

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error)
      throw error
    }
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request<{ success: boolean; userId: string }>('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async getUser() {
    return this.request<{ user: any }>('/get-user', {
      method: 'POST',
    })
  }

  // Children
  async createChild(name: string, birthDate: string) {
    return this.request<{ success: boolean; child: any }>('/children', {
      method: 'POST',
      body: JSON.stringify({ name, birthDate }),
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
}

export const api = new ApiClient()
