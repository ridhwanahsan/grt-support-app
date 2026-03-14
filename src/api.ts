import { Ticket, Message, User, TicketFilters, AssignAgentResponse, Agent } from './types';

// This file contains the actual fetch logic matching your custom WP REST API specs.
// For the sake of the preview, it falls back to mock data if the API fails or isn't configured.

const API_NAMESPACE = '/wp-json/grt/v1';

export const api = {
  getBaseUrl() {
    let url = localStorage.getItem('grt_site_url') || (import.meta as any).env.VITE_WP_BASE_URL || '';
    if (!url) {
      throw new Error('WordPress Site URL is not configured. Please go to Settings to set it.');
    }
    return url.replace(/\/$/, ''); // Remove trailing slash to prevent double slashes
  },

  async handleResponse(res: Response, url: string) {
    if (!res.ok) {
      let message = `Error (${res.status})`;
      try {
        const responseJson = await res.json();
        message = responseJson.message || message;
      } catch (e) {
        // Not JSON
      }
      throw new Error(message);
    }
    return await res.json();
  },

  async safeFetch(url: string, options: RequestInit = {}) {
    try {
      return await fetch(url, options);
    } catch (e: any) {
      if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
        throw new Error(`Network Error: Could not connect to ${url}. Please check your Site URL and ensure CORS is enabled on your WordPress site.`);
      }
      throw e;
    }
  },

  async login(username: string, password: string): Promise<User> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/login`;
    const res = await this.safeFetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return this.handleResponse(res, fullUrl);
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/validate`;
      const res = await this.safeFetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.code === 'valid_token';
    } catch (e) {
      return false;
    }
  },

  async getTickets(token: string, filters: TicketFilters = {}): Promise<Ticket[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await this.safeFetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.handleResponse(res, fullUrl);
  },

  async getMessages(ticketId: number, token: string): Promise<Message[]> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets/${ticketId}/messages`;
    const res = await this.safeFetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.handleResponse(res, fullUrl);
  },

  async sendMessage(ticketId: number, message: string, token: string): Promise<Message> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets/${ticketId}/messages`;
    const res = await this.safeFetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    return this.handleResponse(res, fullUrl);
  },

  async assignAgent(ticketId: number, agentId: number, token: string): Promise<AssignAgentResponse> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets/${ticketId}/assign`;
    const res = await this.safeFetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ agent_id: agentId }),
    });
    return this.handleResponse(res, fullUrl);
  },

  async createTicket(title: string, description: string, token: string): Promise<Ticket> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets`;
    const res = await this.safeFetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });
    return this.handleResponse(res, fullUrl);
  },

  async updateTicketStatus(ticketId: number, status: string, token: string): Promise<Ticket> {
    // Requirement 4: Map "in-progress" to "open"
    const statusToSend = status === 'in-progress' || status === 'in_progress' ? 'open' : status;
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/tickets/${ticketId}/status`;
    const res = await this.safeFetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: statusToSend }),
    });
    return this.handleResponse(res, fullUrl);
  },

  async getAgents(token: string): Promise<Agent[]> {
    const fullUrl = `${this.getBaseUrl()}${API_NAMESPACE}/agents`;
    const res = await this.safeFetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.handleResponse(res, fullUrl);
  },
  
  async uploadMedia(file: File, token: string): Promise<string> {
    const fullUrl = `${this.getBaseUrl()}/wp-json/wp/v2/media`;
    
    // WordPress Media API often works best with raw binary and Content-Disposition header
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': file.type,
      },
      body: file, // Send raw file data
    });

    if (!res.ok) {
      const responseJson = await res.json().catch(() => ({}));
      console.error("Upload Error Details:", responseJson);
      throw new Error(responseJson.message || 'Failed to upload file. Please ensure your API token has media upload permissions.');
    }

    const data = await res.json();
    return data.source_url;
  }
};
