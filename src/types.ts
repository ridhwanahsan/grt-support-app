export interface User {
  token: string;
  user_email: string;
  user_display_name: string;
}

export interface Agent {
  id: number;
  name: string;
  email?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'solved' | 'closed' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  updatedAt: string;
  last_message_id?: number;
  assigned_agent_id?: number;
  assigned_agent_name?: string;
}

export interface AssignAgentResponse {
  ticket_id: number;
  assigned_agent_id: number;
  assigned_agent_name: string;
}

export interface TicketFilters {
  status?: string;
  start_date?: string;
  end_date?: string;
  assigned_agent_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderby?: string;
  order?: 'ASC' | 'DESC';
}

export interface Message {
  id: number;
  ticket_id: number;
  sender_name: string;
  message: string;
  attachment_url?: string;
  created_at: string;
  is_mine: boolean;
  sync_status?: 'sending' | 'sent' | 'failed';
}
