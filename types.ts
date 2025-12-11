export enum AppView {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN'
}

export type SearchType = 'CPF' | 'CNPJ' | 'PLACA';

export interface PlanDetails {
  id: 'basic' | 'complete';
  active: boolean;
  name: string;
  description: string;
  price: number;
  oldPrice: number;
  highlight: boolean; // Se é o "Mais Vendido"
  highlightText?: string;
  color: string; // Cor principal do plano (Hex)
  features: string[];
}

export interface StyleConfig {
  borderRadius: string; // '0.5rem', '1rem', '1.5rem'
  fontScale: number; // 0.9, 1, 1.1
  primaryColor: string; // Hex for buttons not in plans
}

export interface PaymentConfig {
  accessToken: string;
  publicKey: string;
}

export interface AppConfig {
  plans: {
    basic: PlanDetails;
    complete: PlanDetails;
  };
  style: StyleConfig;
  social: {
    googleEnabled: boolean;
    facebookEnabled: boolean;
    appleEnabled: boolean;
  };
  payment: PaymentConfig;
}

export interface UserData {
  id: string;
  type: SearchType;
  name: string; // Name, Company Name, or Vehicle Model
  score?: number; // Only for CPF/CNPJ
  status: 'Regular' | 'Pendente' | 'Suspenso' | 'Irregular';
  lastUpdate: string;
  debts: Debt[];
  details?: Record<string, string>; // Extra details like "Renavam" for cars
}

export interface Debt {
  id: string;
  company: string;
  value: number;
  date: string;
  status: 'Negociada' | 'Em Aberto' | 'Vencida';
}

export interface GeminiAdvice {
  title: string;
  content: string;
  actionItems: string[];
}

export interface Order {
  id: string;
  customerName: string;
  customerCpf: string;
  plan: 'basic' | 'complete';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  paymentId?: string;
}

export interface PaymentData {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
}