export interface Contact {
  id: string;
  business_profile_id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string;
  email: string | null;
  status: 'NEW' | 'ENGAGED' | 'QUALIFIED' | 'LOST' | 'WON';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  contact_id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  message_type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  meta_message_id: string | null;
  created_at: string;
}

export interface AIAnalysis {
  summary: string;
  detected_objections: string[];
  suggested_stage: string;
}

export interface Deal {
  id: string;
  title: string;
  amount: number;
  contact_id: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone_number: string;
  } | null;
  stage_id: string;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order_index: number;
  description: string | null;
  deals: Deal[];
}

export interface ChatbotRule {
  id: string;
  business_profile_id: string;
  trigger_keyword: string;
  response_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
