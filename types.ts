

export enum AppView {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  PREVIEW = 'PREVIEW',
  RESULTS = 'RESULTS',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY',
  ADMIN = 'ADMIN'
}

export type SearchType = 'CPF' | 'CNPJ' | 'PLACA' | 'PHONE';

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
  features: PlanFeature[];
}

export interface PlanFeature {
  name: string;
  price: number; // 0 = Incluso, >0 = Opcional (Checkbox)
}

export interface PlanSet {
  basic: PlanDetails;
  complete: PlanDetails;
}

export interface StyleConfig {
  borderRadius: string; // '0.5rem', '1rem', '1.5rem'
  fontScale: number; // 0.9, 1, 1.1
  primaryColor: string; // Hex for buttons not in plans
}

export interface PaymentConfig {
  activeGateway: 'mercadopago' | 'efi'; // Toggle between providers for editing priority
  mercadopagoEnabled: boolean; // Enable/Disable MP
  efiEnabled: boolean; // Enable/Disable Efi
  sandbox: boolean; // Added for Mercado Pago Sandbox mode toggle
  
  // Mercado Pago Configs
  accessToken: string;
  publicKey: string;
  applicationId: string; // Novo: App ID
  userId: string; // Novo: User ID
  webhookUrl: string; // Novo: URL de Notificação (IPN/Webhook)
  mode: 'transparent' | 'pro'; // transparent (API) or pro (Redirect)
  installmentsEnabled: boolean;
  maxInstallments: number; // 1 to 12
  statementDescriptor: string; // Nome na fatura (max 13 chars)
  expirationMinutes: number; // Tempo para pagar (Pix)
  autoReturn: 'approved' | 'all'; // Para Checkout Pro
  binaryMode: boolean; // Se true, não aceita 'pending', apenas 'approved' ou 'rejected'
}

export interface EfiConfig {
  clientId: string;
  clientSecret: string;
  certificatePem: string; // Content of the PEM/P12 certificate converted to string
  pixKey: string; // Chave Pix cadastrada na Efí
  sandbox: boolean;
}

export interface MysqlConfig {
  host: string;
  database: string;
  user: string;
  pass: string;
}

export interface SocialConfig {
  googleEnabled: boolean;
  googleClientId: string;
  facebookEnabled: boolean;
  facebookAppId: string;
  appleEnabled: boolean;
  appleServiceId: string;
}

export interface AppConfig {
  // New structure: Plans are now categorized by SearchType
  plans: {
    cpf: PlanSet;
    cnpj: PlanSet;
    plate: PlanSet;
    phone: PlanSet;
  };
  style: StyleConfig;
  social: SocialConfig;
  payment: PaymentConfig;
  efi: EfiConfig;
  mysql: MysqlConfig;
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
  email?: string;
  plan: 'basic' | 'complete';
  amount: number; // Preço Base + Extras
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  paymentId?: string;
  gateway?: 'mercadopago' | 'efi';
  searchType?: SearchType; // Track what type of search initiated the order
  selectedExtras?: PlanFeature[]; // Lista de itens opcionais comprados
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  origin: string; // 'Direct', 'Google', etc.
  deviceInfo: string;
  searchTypeOfInterest: SearchType;
}

export interface PaymentData {
  id: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  init_point?: string; // Para Checkout Pro
  sandbox_init_point?: string;
  status: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'error' | 'info' | 'success' | 'warning';
  source: 'mercadopago' | 'efi' | 'system';
  message: string;
  details?: any;
}
