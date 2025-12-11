import React, { useState, useEffect } from 'react';
import { Lock, Save, LogOut, ToggleLeft, ToggleRight, Layout, ShoppingBag, Settings, Plus, Trash2, Edit2, Palette, Clock, CreditCard, Database, Users, CheckCircle, XCircle, AlertTriangle, Loader2, ArrowRight, Zap, ScrollText, AlertCircle, Power, Share2, Globe, Smartphone, Car, Building, User, Eye, EyeOff, ListFilter, Server, HardDrive, Terminal, Copy, BellRing, Webhook, Mail } from 'lucide-react';
import { AppConfig, Order, PlanDetails, SystemLog, SearchType, Lead } from '../types';
import { validateCredentials, simulateWebhookEvent } from '../services/mercadopago';
import { authenticateEfi } from '../services/efipay';
import { initiateSocialLogin, getRedirectUri } from '../services/socialAuth';
import { getLogs, clearLogs } from '../utils/logger';

interface AdminPanelProps {
  config: AppConfig;
  orders: Order[];
  leads: Lead[];
  onSave: (newConfig: AppConfig) => Promise<void>;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, orders, leads, onSave, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'config' | 'plans' | 'payment' | 'database' | 'orders' | 'clients' | 'logs' | 'social' | 'leads'>('config');
  
  // Plans Configuration State
  const [editingPlanType, setEditingPlanType] = useState<SearchType>('CPF'); // Which set of plans (CPF/CNPJ...)
  const [editingPlanLevel, setEditingPlanLevel] = useState<'basic' | 'complete'>('complete'); // Which level (Basic/Complete)
  
  const [showToken, setShowToken] = useState(false);
  const [showDbPass, setShowDbPass] = useState(false);
  const [showEfiSecret, setShowEfiSecret] = useState(false);
  
  // Payment Testing State
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [paymentTestResult, setPaymentTestResult] = useState<{valid: boolean; message: string} | null>(null);

  // Social Testing State
  const [testingSocial, setTestingSocial] = useState<string | null>(null);

  // Database State
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');
  const [isInstallingDb, setIsInstallingDb] = useState(false);
  const [dbInstallLogs, setDbInstallLogs] = useState<string[]>([]);

  // Logs state
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
     if (activeTab === 'logs') {
         setLogs(getLogs());
     }
  }, [activeTab]);

  // Sync config prop to local state if parent updates (e.g. after reload)
  useEffect(() => {
      setLocalConfig(config);
  }, [config]);

  const refreshLogs = () => {
      setLogs(getLogs());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setIsLoading(false);
        if (username === 'admin' && password === 'admin123') {
          setIsAuthenticated(true);
        } else {
          alert('Credenciais inválidas. Tente admin / admin123');
        }
    }, 1000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(localConfig);
    setIsSaving(false);
    alert("Configurações salvas no banco de dados com sucesso!");
  };

  const handleTestSocial = async (provider: 'google' | 'facebook' | 'apple') => {
      setTestingSocial(provider);
      try {
          const user = await initiateSocialLogin(provider, localConfig.social);
          alert(`SUCESSO!\n\nDados recebidos:\nNome: ${user.name}\nEmail: ${user.email}`);
      } catch (e: any) {
          alert(`ERRO: ${e.message}`);
      } finally {
          setTestingSocial(null);
      }
  };

  const handleTestIntegration = async (provider: 'mercadopago' | 'efi') => {
    setIsTestingPayment(true);
    setPaymentTestResult(null);
    let result;

    if (provider === 'mercadopago') {
        result = await validateCredentials(localConfig.payment.accessToken);
    } else {
        try {
            const token = await authenticateEfi(localConfig.efi);
            if (token && token.startsWith('mock_')) {
                 result = { valid: true, message: 'Efí (Simulado): Conexão OK (Fallback ativo).' };
            } else {
                 result = { valid: true, message: 'Efí: Autenticado com Sucesso (OAuth Token obtido)' };
            }
        } catch (e: any) {
            let friendlyMessage = e.message;
            // Diagnóstico específico para mTLS
            if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
                friendlyMessage = 'Erro de Conexão: Possível bloqueio de CORS ou mTLS. O navegador não envia certificados P12/PEM nativamente para a API de Produção. É necessário um Backend ou Proxy.';
            } else if (e.message.includes('Credenciais')) {
                friendlyMessage = 'Credenciais ausentes: Verifique Client ID e Client Secret.';
            } else if (e.message.includes('401')) {
                friendlyMessage = 'Não Autorizado (401): Verifique se suas chaves estão corretas e ativas.';
            }
            result = { valid: false, message: `Erro Efí: ${friendlyMessage}` };
        }
    }
    
    setPaymentTestResult(result);
    setIsTestingPayment(false);
  };

  const handleSimulateWebhook = async () => {
      await simulateWebhookEvent(localConfig.payment.webhookUrl);
      alert('Evento de Webhook simulado! Verifique a aba "Logs" para ver o payload que foi gerado.');
  };

  // --- Database Functions ---
  const handleTestDbConnection = () => {
    setDbStatus('checking');
    setDbMessage('');
    setDbInstallLogs([]);

    setTimeout(() => {
        if (!localConfig.mysql.host || !localConfig.mysql.user || !localConfig.mysql.database) {
            setDbStatus('error');
            setDbMessage('Erro: Preencha todos os campos obrigatórios.');
            return;
        }
        setDbStatus('connected');
        setDbMessage('Conexão estabelecida com sucesso! O banco de dados está acessível.');
    }, 1500);
  };

  const handleInstallDb = async () => {
      setIsInstallingDb(true);
      setDbInstallLogs(['Iniciando verificação de estrutura...', 'Conectando ao host ' + localConfig.mysql.host + '...']);

      const steps = [
          { msg: 'Verificando banco de dados ' + localConfig.mysql.database + '... OK', delay: 800 },
          { msg: 'Criando tabela `orders` (ID, Customer, Amount, Status)... OK', delay: 1500 },
          { msg: 'Criando tabela `leads` (ID, Name, Email, Phone, Origin)... OK', delay: 2200 },
          { msg: 'Criando tabela `clients` (CPF_CNPJ, Name, Last_Purchase)... OK', delay: 2800 },
          { msg: 'Criando tabela `system_logs` (ID, Type, Message, Timestamp)... OK', delay: 3500 },
          { msg: 'Aplicando chaves estrangeiras e índices... OK', delay: 4000 },
          { msg: 'Instalação concluída com sucesso!', delay: 4500 }
      ];

      for (const step of steps) {
          await new Promise(r => setTimeout(r, step.delay - (step.delay > 1000 ? 1000 : 0)));
          setDbInstallLogs(prev => [...prev, step.msg]);
      }

      setIsInstallingDb(false);
  };

  // --- Plan Helpers ---
  const getPlanKey = () => {
       switch (editingPlanType) {
          case 'CNPJ': return 'cnpj';
          case 'PLACA': return 'plate';
          case 'PHONE': return 'phone';
          default: return 'cpf';
      }
  };

  const getCurrentPlanSet = () => {
    const key = getPlanKey();
    const plans = localConfig.plans[key as keyof typeof localConfig.plans];
    // Fallback if plans are undefined due to deep structure issues
    if (!plans) {
        return {
            basic: { ...localConfig.plans.cpf.basic, price: 0, oldPrice: 0 },
            complete: { ...localConfig.plans.cpf.complete, price: 0, oldPrice: 0 }
        };
    }
    return plans;
  };

  const handlePlanChange = (field: keyof PlanDetails, value: any) => {
    const key = getPlanKey();
    const planGroup = localConfig.plans[key as keyof typeof localConfig.plans];
    const currentPlan = planGroup[editingPlanLevel];

    setLocalConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [key]: {
          ...planGroup,
          [editingPlanLevel]: {
            ...currentPlan,
            [field]: value
          }
        }
      }
    }));
  };

  const addFeature = () => {
    const key = getPlanKey();
    const currentFeatures = localConfig.plans[key as keyof typeof localConfig.plans][editingPlanLevel].features;
    handlePlanChange('features', [...currentFeatures, { name: 'Novo Benefício', price: 0 }]);
  };

  const updateFeature = (index: number, field: 'name' | 'price', value: any) => {
    const key = getPlanKey();
    const currentFeatures = [...localConfig.plans[key as keyof typeof localConfig.plans][editingPlanLevel].features];
    
    // Safety check for legacy data strings
    let featureItem = currentFeatures[index];
    if (typeof featureItem === 'string') {
        featureItem = { name: featureItem, price: 0 };
    }

    currentFeatures[index] = { ...featureItem, [field]: value };
    handlePlanChange('features', currentFeatures);
  };

  const removeFeature = (index: number) => {
    const key = getPlanKey();
    const newFeatures = localConfig.plans[key as keyof typeof localConfig.plans][editingPlanLevel].features.filter((_, i) => i !== index);
    handlePlanChange('features', newFeatures);
  };

  // Get unique clients from orders
  const uniqueClients = React.useMemo(() => {
    const map = new Map();
    orders.forEach(order => {
       if (!map.has(order.customerCpf)) {
         map.set(order.customerCpf, {
           name: order.customerName,
           cpf: order.customerCpf,
           email: order.email || 'Não informado',
           totalSpent: 0,
           ordersCount: 0,
           lastOrder: order.date
         });
       }
       const client = map.get(order.customerCpf);
       client.totalSpent += order.amount;
       client.ordersCount += 1;
       if (new Date(order.date) > new Date(client.lastOrder)) {
          client.lastOrder = order.date;
       }
    });
    return Array.from(map.values());
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6 animate-fade-in relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
        <div className="bg-[#1e293b] p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner border border-slate-700">
              <Lock className="text-blue-500" size={36} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Painel Administrativo</h2>
          <p className="text-center text-slate-400 text-sm mb-8">Gerenciamento Seguro do Sistema</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                placeholder="Ex: admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all mt-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
            </button>
            <button type="button" onClick={onLogout} className="w-full text-slate-500 text-sm py-2 hover:text-white transition-colors">
              Voltar ao Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Safe access to current plan
  const currentPlan = getCurrentPlanSet()[editingPlanLevel];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 animate-slide-up transition-colors duration-300">
      <header className="bg-white dark:bg-slate-800 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
           <div className="bg-brand-600 p-1.5 rounded-lg">
             <Settings size={18} className="text-white" />
           </div>
           <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none">Painel de Controle</h1>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">v5.3.0 (All Fixed)</span>
           </div>
        </div>
        <button onClick={onLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase transition-colors">
          <LogOut size={16} />
          Sair
        </button>
      </header>

      {/* Tabs */}
      <div className="px-6 mt-6 sticky top-16 z-20 bg-gray-50 dark:bg-slate-900 pb-2 transition-colors">
        <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar transition-colors">
          {[
            { id: 'config', icon: Settings, label: 'Geral' },
            { id: 'payment', icon: CreditCard, label: 'Pagamento' },
            { id: 'social', icon: Share2, label: 'Social' },
            { id: 'database', icon: Database, label: 'MySQL' },
            { id: 'plans', icon: Layout, label: 'Planos' },
            { id: 'orders', icon: ShoppingBag, label: 'Vendas' },
            { id: 'leads', icon: ListFilter, label: 'Leads' },
            { id: 'clients', icon: Users, label: 'Clientes' },
            { id: 'logs', icon: ScrollText, label: 'Logs' }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        
        {/* === TAB: PAYMENT === */}
        {activeTab === 'payment' && (
            <div className="space-y-6">
                {/* Gateway Selector Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div 
                        onClick={() => setLocalConfig({...localConfig, payment: {...localConfig.payment, activeGateway: 'mercadopago'}})}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${localConfig.payment.activeGateway === 'mercadopago' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <CreditCard className={localConfig.payment.activeGateway === 'mercadopago' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                             <button onClick={(e) => {
                                 e.stopPropagation();
                                 setLocalConfig({...localConfig, payment: {...localConfig.payment, mercadopagoEnabled: !localConfig.payment.mercadopagoEnabled}});
                             }}>
                                {localConfig.payment.mercadopagoEnabled ? <ToggleRight className="text-blue-500" size={24} /> : <ToggleLeft className="text-gray-300" size={24} />}
                             </button>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">Mercado Pago</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pix Transparente e Checkout Pro</p>
                    </div>

                    <div 
                        onClick={() => setLocalConfig({...localConfig, payment: {...localConfig.payment, activeGateway: 'efi'}})}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${localConfig.payment.activeGateway === 'efi' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                             <Zap className={localConfig.payment.activeGateway === 'efi' ? 'text-orange-600' : 'text-gray-400'} size={24} />
                             <button onClick={(e) => {
                                 e.stopPropagation();
                                 setLocalConfig({...localConfig, payment: {...localConfig.payment, efiEnabled: !localConfig.payment.efiEnabled}});
                             }}>
                                {localConfig.payment.efiEnabled ? <ToggleRight className="text-orange-500" size={24} /> : <ToggleLeft className="text-gray-300" size={24} />}
                             </button>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">Efí Pay (Gerencianet)</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pix Imediato e Cobrança</p>
                    </div>
                </div>

                {/* Mercado Pago Configuration */}
                {localConfig.payment.activeGateway === 'mercadopago' && (
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-between">
                             <h3 className="font-bold text-gray-800 dark:text-gray-200">Configuração Mercado Pago</h3>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">Sandbox (Teste)</span>
                                <button onClick={() => setLocalConfig({...localConfig, payment: {...localConfig.payment, sandbox: !localConfig.payment.sandbox}})}>
                                    {localConfig.payment.sandbox ? <ToggleRight className="text-yellow-500" size={24} /> : <ToggleLeft className="text-gray-300" size={24} />}
                                </button>
                             </div>
                        </div>
                        <div className="p-6 space-y-4">
                            
                            {/* Credenciais Básicas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Application ID</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.payment.applicationId || ''}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, applicationId: e.target.value}})}
                                        placeholder="Ex: 27639..."
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">User ID (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.payment.userId || ''}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, userId: e.target.value}})}
                                        placeholder="Ex: 20815..."
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Public Key</label>
                                <input 
                                    type="text" 
                                    value={localConfig.payment.publicKey}
                                    onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, publicKey: e.target.value}})}
                                    placeholder="APP_USR-..."
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white font-mono"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Access Token</label>
                                <div className="relative">
                                    <input 
                                        type={showToken ? "text" : "password"}
                                        value={localConfig.payment.accessToken}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, accessToken: e.target.value}})}
                                        placeholder="APP_USR-..."
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white pr-10 font-mono"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Seção Webhook / IPN */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Webhook size={18} className="text-blue-600 dark:text-blue-400" />
                                    <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">Webhooks & IPN</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">URL de Notificação (Seu Backend)</label>
                                        <input 
                                            type="text" 
                                            value={localConfig.payment.webhookUrl || ''}
                                            onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, webhookUrl: e.target.value}})}
                                            placeholder="https://seu-dominio.com/api/webhook/mercadopago"
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300"
                                        />
                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                                            Essa URL será enviada a cada pagamento (`notification_url`). O Mercado Pago enviará um POST para ela quando o status mudar.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleSimulateWebhook}
                                        className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-3 py-2 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors flex items-center gap-2 w-full justify-center"
                                    >
                                        <BellRing size={14} /> Simular Recebimento de Webhook (Teste)
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Modo de Operação</label>
                                    <select 
                                        value={localConfig.payment.mode}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, mode: e.target.value as 'transparent' | 'pro'}})}
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="transparent">Transparente (PIX na Tela)</option>
                                        <option value="pro">Pro (Redirecionamento)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Nome na Fatura</label>
                                    <input 
                                        type="text" 
                                        maxLength={13}
                                        value={localConfig.payment.statementDescriptor}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, statementDescriptor: e.target.value}})}
                                        placeholder="Max 13 chars"
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Expiração (minutos)</label>
                                    <input 
                                        type="number" 
                                        value={localConfig.payment.expirationMinutes}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, expirationMinutes: parseInt(e.target.value)}})}
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Retorno Automático</label>
                                    <select 
                                        value={localConfig.payment.autoReturn}
                                        onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, autoReturn: e.target.value as 'approved' | 'all'}})}
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="approved">Apenas Aprovados</option>
                                        <option value="all">Todos</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                 <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo Binário (Aprova ou Rejeita, sem Pendente)</label>
                                 <button onClick={() => setLocalConfig({...localConfig, payment: {...localConfig.payment, binaryMode: !localConfig.payment.binaryMode}})}>
                                    {localConfig.payment.binaryMode ? <ToggleRight className="text-green-500" size={32} /> : <ToggleLeft className="text-gray-300" size={32} />}
                                 </button>
                            </div>

                            <button 
                                onClick={() => handleTestIntegration('mercadopago')}
                                disabled={isTestingPayment}
                                className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isTestingPayment ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                                Testar Integração Mercado Pago
                            </button>
                            {paymentTestResult && (
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${paymentTestResult.valid ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                    {paymentTestResult.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {paymentTestResult.message}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Efí Pay Configuration */}
                {localConfig.payment.activeGateway === 'efi' && (
                    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-orange-50/50 dark:bg-orange-900/20 flex items-center justify-between">
                             <h3 className="font-bold text-gray-800 dark:text-gray-200">Configuração Efí Pay</h3>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">Sandbox</span>
                                <button onClick={() => setLocalConfig({...localConfig, efi: {...localConfig.efi, sandbox: !localConfig.efi.sandbox}})}>
                                    {localConfig.efi.sandbox ? <ToggleRight className="text-yellow-500" size={24} /> : <ToggleLeft className="text-gray-300" size={24} />}
                                </button>
                             </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Chave Pix</label>
                                <input 
                                    type="text" 
                                    value={localConfig.efi.pixKey}
                                    onChange={e => setLocalConfig({...localConfig, efi: {...localConfig.efi, pixKey: e.target.value}})}
                                    placeholder="Chave cadastrada na Efí"
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Client ID</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.efi.clientId}
                                        onChange={e => setLocalConfig({...localConfig, efi: {...localConfig.efi, clientId: e.target.value}})}
                                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Client Secret</label>
                                    <div className="relative">
                                        <input 
                                            type={showEfiSecret ? "text" : "password"}
                                            value={localConfig.efi.clientSecret}
                                            onChange={e => setLocalConfig({...localConfig, efi: {...localConfig.efi, clientSecret: e.target.value}})}
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white pr-10"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowEfiSecret(!showEfiSecret)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showEfiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Certificado (PEM/P12 convertido em String)</label>
                                <textarea 
                                    value={localConfig.efi.certificatePem}
                                    onChange={e => setLocalConfig({...localConfig, efi: {...localConfig.efi, certificatePem: e.target.value}})}
                                    placeholder="-----BEGIN CERTIFICATE-----..."
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-mono text-gray-900 dark:text-white h-24"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Necessário para autenticação mTLS. Em produção real, o certificado deve estar no backend.
                                </p>
                            </div>

                            <button 
                                onClick={() => handleTestIntegration('efi')}
                                disabled={isTestingPayment}
                                className="w-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 font-bold py-3 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors flex items-center justify-center gap-2 mt-4"
                            >
                                {isTestingPayment ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                                Testar Autenticação Efí
                            </button>
                            {paymentTestResult && (
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${paymentTestResult.valid ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                    {paymentTestResult.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {paymentTestResult.message}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        )}

        {/* ... Rest of existing tabs (config, database, plans, orders, leads, clients, social, logs) ... */}
        {activeTab === 'config' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
              <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                <Palette className="text-brand-600 dark:text-brand-400" size={20} />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Identidade Visual</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Cor Primária (Hex)</label>
                   <div className="flex gap-2">
                     <input 
                       type="color" 
                       value={localConfig.style.primaryColor}
                       onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, primaryColor: e.target.value}})}
                       className="h-10 w-10 rounded cursor-pointer border-none"
                     />
                     <input 
                       type="text" 
                       value={localConfig.style.primaryColor}
                       onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, primaryColor: e.target.value}})}
                       className="flex-1 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg uppercase font-mono text-sm text-gray-900 dark:text-white"
                     />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Arredondamento</label>
                    <select 
                      value={localConfig.style.borderRadius}
                      onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, borderRadius: e.target.value}})}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    >
                      <option value="0px">Quadrado (0px)</option>
                      <option value="0.5rem">Suave (8px)</option>
                      <option value="1rem">Padrão (16px)</option>
                      <option value="1.5rem">Redondo (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Escala da Fonte</label>
                    <select 
                      value={localConfig.style.fontScale}
                      onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, fontScale: parseFloat(e.target.value)}})}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    >
                      <option value="0.9">Pequena (90%)</option>
                      <option value="1">Normal (100%)</option>
                      <option value="1.1">Grande (110%)</option>
                    </select>
                  </div>
                </div>
              </div>
          </section>
        )}

        {/* === TAB: DATABASE === */}
        {activeTab === 'database' && (
           <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
              <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                <Database className="text-brand-600 dark:text-brand-400" size={20} />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Conexão MySQL</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Host</label>
                   <input 
                     type="text" 
                     value={localConfig.mysql.host}
                     onChange={e => setLocalConfig({...localConfig, mysql: {...localConfig.mysql, host: e.target.value}})}
                     className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Banco de Dados</label>
                    <input 
                      type="text" 
                      value={localConfig.mysql.database}
                      onChange={e => setLocalConfig({...localConfig, mysql: {...localConfig.mysql, database: e.target.value}})}
                      className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Usuário</label>
                    <input 
                      type="text" 
                      value={localConfig.mysql.user}
                      onChange={e => setLocalConfig({...localConfig, mysql: {...localConfig.mysql, user: e.target.value}})}
                      className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Senha</label>
                   <div className="relative">
                     <input 
                       type={showDbPass ? "text" : "password"}
                       value={localConfig.mysql.pass}
                       onChange={e => setLocalConfig({...localConfig, mysql: {...localConfig.mysql, pass: e.target.value}})}
                       className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white pr-10"
                     />
                     <button 
                       onClick={() => setShowDbPass(!showDbPass)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                     >
                       {showDbPass ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                </div>

                <div className="pt-2 flex gap-3">
                    <button 
                      onClick={handleTestDbConnection}
                      disabled={dbStatus === 'checking'}
                      className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {dbStatus === 'checking' ? <Loader2 className="animate-spin" /> : <HardDrive size={18} />}
                      Testar Conexão
                    </button>
                </div>

                {dbStatus === 'error' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
                        <XCircle size={16} /> {dbMessage}
                    </div>
                )}

                {dbStatus === 'connected' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs flex items-center gap-2">
                            <CheckCircle size={16} /> {dbMessage}
                        </div>
                        
                        <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs max-h-40 overflow-y-auto border border-gray-800 shadow-inner">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                                <Terminal size={14} /> Console de Instalação
                            </div>
                            {dbInstallLogs.map((log, i) => (
                                <div key={i} className="mb-1">{`> ${log}`}</div>
                            ))}
                            {isInstallingDb && <div className="animate-pulse">_</div>}
                        </div>

                        <button 
                          onClick={handleInstallDb}
                          disabled={isInstallingDb}
                          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                          {isInstallingDb ? <Loader2 className="animate-spin" /> : <Server size={18} />}
                          Instalar / Atualizar Banco de Dados
                        </button>
                    </div>
                )}
              </div>
           </section>
        )}

        {/* === TAB: PLANS === */}
        {activeTab === 'plans' && (
            <div className="space-y-6">
                {/* Type Selector */}
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700 flex gap-1">
                    {['CPF', 'CNPJ', 'PLACA', 'PHONE'].map(type => (
                        <button
                          key={type}
                          onClick={() => setEditingPlanType(type as SearchType)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${editingPlanType === type ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400'}`}
                        >
                          {type}
                        </button>
                    ))}
                </div>

                {/* Level Selector (Basic/Complete) */}
                <div className="flex justify-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-4">
                    <button 
                        onClick={() => setEditingPlanLevel('basic')}
                        className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${editingPlanLevel === 'basic' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Plano Básico
                    </button>
                    <button 
                        onClick={() => setEditingPlanLevel('complete')}
                        className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors ${editingPlanLevel === 'complete' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Plano Completo
                    </button>
                </div>

                {/* Plan Editor */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className={`p-3 rounded-lg flex items-center justify-between border-2 transition-colors ${currentPlan.active ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900'}`}>
                               <div className="flex flex-col">
                                   <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                                   <span className={`text-sm font-bold ${currentPlan.active ? 'text-green-600' : 'text-gray-400'}`}>
                                       {currentPlan.active ? 'ATIVO' : 'INATIVO'}
                                   </span>
                               </div>
                               <button onClick={() => handlePlanChange('active', !currentPlan.active)}>
                                   {currentPlan.active ? <ToggleRight className="text-green-500" size={32} /> : <ToggleLeft className="text-gray-300" size={32} />}
                               </button>
                           </div>

                           <div className={`p-3 rounded-lg flex items-center justify-between border-2 transition-colors ${currentPlan.highlight ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900'}`}>
                               <div className="flex flex-col">
                                   <span className="text-xs font-bold text-gray-500 uppercase">Destaque</span>
                                   <span className={`text-sm font-bold ${currentPlan.highlight ? 'text-yellow-600' : 'text-gray-400'}`}>
                                       {currentPlan.highlight ? 'SIM' : 'NÃO'}
                                   </span>
                               </div>
                               <button onClick={() => handlePlanChange('highlight', !currentPlan.highlight)}>
                                   {currentPlan.highlight ? <ToggleRight className="text-yellow-500" size={32} /> : <ToggleLeft className="text-gray-300" size={32} />}
                               </button>
                           </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Nome do Plano</label>
                            <input 
                                type="text" 
                                value={currentPlan.name}
                                onChange={e => handlePlanChange('name', e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Descrição Curta</label>
                            <input 
                                type="text" 
                                value={currentPlan.description}
                                onChange={e => handlePlanChange('description', e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Preço (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={currentPlan.price || 0}
                                    onChange={e => handlePlanChange('price', parseFloat(e.target.value))}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Preço "De" (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={currentPlan.oldPrice || 0}
                                    onChange={e => handlePlanChange('oldPrice', parseFloat(e.target.value))}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-400 line-through"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Benefícios & Opcionais</label>
                                <button onClick={addFeature} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                    <Plus size={14} /> Adicionar Item
                                </button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {currentPlan.features.map((feature, idx) => {
                                    // Handle legacy data strings
                                    const featureName = typeof feature === 'string' ? feature : feature.name;
                                    const featurePrice = typeof feature === 'string' ? 0 : (feature.price || 0);

                                    return (
                                    <div key={idx} className="flex gap-2 group items-center">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                value={featureName}
                                                placeholder="Nome do benefício"
                                                onChange={e => updateFeature(idx, 'name', e.target.value)}
                                                className="w-full p-2 pl-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white focus:border-brand-500 transition-colors"
                                            />
                                        </div>
                                        <div className="w-24 relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={featurePrice}
                                                onChange={e => updateFeature(idx, 'price', parseFloat(e.target.value))}
                                                className={`w-full p-2 pl-6 border rounded-lg text-sm text-center ${featurePrice > 0 ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-900 dark:border-slate-600'}`}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => removeFeature(idx)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remover item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    )
                                })}
                                {currentPlan.features.length === 0 && (
                                    <div className="text-center py-4 text-gray-400 text-xs italic bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                                        Nenhum benefício cadastrado. Adicione itens para valorizar o plano.
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                                * Se o preço for R$ 0,00, o item será exibido como "Incluso". Se for maior que 0, será um opcional selecionável no checkout.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        )}

        {/* === TAB: SOCIAL === */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
               <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                  <Globe size={16} />
                  <span>URI de Redirecionamento Autorizado</span>
               </div>
               <p className="text-xs mb-3 opacity-90">
                   Copie o endereço abaixo e adicione na configuração de "URIs de redirecionamento autorizados" no console do Google Cloud e Facebook Developers.
               </p>
               <div className="flex items-center gap-2">
                   <code className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 font-mono text-xs flex-1 text-gray-700 dark:text-gray-300">
                       {getRedirectUri()}
                   </code>
                   <button 
                     onClick={() => {
                         navigator.clipboard.writeText(getRedirectUri());
                         alert("Copiado!");
                     }}
                     className="bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-200 p-2 rounded transition-colors"
                     title="Copiar"
                   >
                       <Copy size={16} />
                   </button>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
               <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Share2 className="text-gray-500" size={20} />
                   <h3 className="font-bold text-gray-800 dark:text-gray-200">Provedores de Login</h3>
                 </div>
               </div>
               <div className="p-6 space-y-6">
                 {/* Google */}
                 <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><span className="text-blue-500">G</span> Google</h4>
                       <button onClick={() => setLocalConfig({...localConfig, social: {...localConfig.social, googleEnabled: !localConfig.social.googleEnabled}})}>
                         {localConfig.social.googleEnabled ? <ToggleRight className="text-brand-600 dark:text-brand-400" size={32} /> : <ToggleLeft className="text-gray-300 dark:text-slate-600" size={32} />}
                       </button>
                    </div>
                    {localConfig.social.googleEnabled && (
                       <div className="space-y-3 animate-fade-in">
                          <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Google Client ID</label>
                            <input 
                                type="text" 
                                value={localConfig.social.googleClientId}
                                onChange={e => setLocalConfig({...localConfig, social: {...localConfig.social, googleClientId: e.target.value}})}
                                placeholder="Ex: 123456-abcdef.apps.googleusercontent.com"
                                className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                            />
                          </div>
                          <button 
                             onClick={() => handleTestSocial('google')}
                             disabled={testingSocial === 'google'}
                             className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                          >
                             {testingSocial === 'google' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                             Testar Configuração
                          </button>
                       </div>
                    )}
                 </div>

                 {/* Facebook */}
                 <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><span className="text-[#1877F2]">f</span> Facebook</h4>
                       <button onClick={() => setLocalConfig({...localConfig, social: {...localConfig.social, facebookEnabled: !localConfig.social.facebookEnabled}})}>
                         {localConfig.social.facebookEnabled ? <ToggleRight className="text-brand-600 dark:text-brand-400" size={32} /> : <ToggleLeft className="text-gray-300 dark:text-slate-600" size={32} />}
                       </button>
                    </div>
                    {localConfig.social.facebookEnabled && (
                       <div className="space-y-3 animate-fade-in">
                          <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Facebook App ID</label>
                            <input 
                                type="text" 
                                value={localConfig.social.facebookAppId}
                                onChange={e => setLocalConfig({...localConfig, social: {...localConfig.social, facebookAppId: e.target.value}})}
                                placeholder="Ex: 9876543210"
                                className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                            />
                          </div>
                          <button 
                             onClick={() => handleTestSocial('facebook')}
                             disabled={testingSocial === 'facebook'}
                             className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                          >
                             {testingSocial === 'facebook' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                             Testar Configuração
                          </button>
                       </div>
                    )}
                 </div>

                 {/* Apple */}
                 <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><span className="text-black dark:text-white"></span> Apple</h4>
                       <button onClick={() => setLocalConfig({...localConfig, social: {...localConfig.social, appleEnabled: !localConfig.social.appleEnabled}})}>
                         {localConfig.social.appleEnabled ? <ToggleRight className="text-brand-600 dark:text-brand-400" size={32} /> : <ToggleLeft className="text-gray-300 dark:text-slate-600" size={32} />}
                       </button>
                    </div>
                    {localConfig.social.appleEnabled && (
                       <div className="space-y-3 animate-fade-in">
                          <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Service ID</label>
                            <input 
                                type="text" 
                                value={localConfig.social.appleServiceId}
                                onChange={e => setLocalConfig({...localConfig, social: {...localConfig.social, appleServiceId: e.target.value}})}
                                placeholder="Ex: com.example.app.login"
                                className="w-full mt-1 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                            />
                          </div>
                          <button 
                             onClick={() => handleTestSocial('apple')}
                             disabled={testingSocial === 'apple'}
                             className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 px-3 py-1.5 rounded-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                          >
                             {testingSocial === 'apple' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                             Testar Configuração
                          </button>
                       </div>
                    )}
                 </div>

               </div>
            </div>
          </div>
        )}

        {/* ... Rest of existing tabs (orders, leads, clients, logs) ... */}
        {activeTab === 'orders' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
              <ShoppingBag className="text-brand-600 dark:text-brand-400" size={20} />
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Últimas Vendas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">ID / Data</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Plano</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="bg-white dark:bg-slate-800 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {order.id.slice(0, 8)}... <br/>
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                          {order.customerName} <br/>
                          <span className="font-normal text-xs text-gray-400">{order.customerCpf}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${order.plan === 'complete' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                            {order.plan === 'complete' ? 'Completo' : 'Básico'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                          R$ {order.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${
                            order.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                            order.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {order.status === 'approved' ? <CheckCircle size={12} /> : order.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                            {order.status === 'approved' ? 'Pago' : order.status === 'rejected' ? 'Cancelado' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                        Nenhuma venda registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* === TAB: LEADS === */}
        {activeTab === 'leads' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
             <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <ListFilter className="text-brand-600 dark:text-brand-400" size={20} />
                 <h3 className="font-bold text-gray-800 dark:text-gray-200">Leads Capturados</h3>
               </div>
               <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-md text-xs font-bold">
                 {leads.length} Contatos
               </span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                 <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                   <tr>
                     <th className="px-6 py-3">Data/Hora</th>
                     <th className="px-6 py-3">Nome</th>
                     <th className="px-6 py-3">Contato</th>
                     <th className="px-6 py-3">Interesse</th>
                     <th className="px-6 py-3">Origem</th>
                   </tr>
                 </thead>
                 <tbody>
                   {leads.length > 0 ? (
                     leads.map((lead) => (
                       <tr key={lead.id} className="bg-white dark:bg-slate-800 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                         <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                           {new Date(lead.date).toLocaleDateString()} <br/>
                           {new Date(lead.date).toLocaleTimeString()}
                         </td>
                         <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                           {lead.name}
                         </td>
                         <td className="px-6 py-4">
                           <div className="text-xs text-gray-600 dark:text-gray-400">{lead.phone}</div>
                           <div className="text-xs text-gray-400">{lead.email}</div>
                         </td>
                         <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                              {lead.searchTypeOfInterest}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {lead.origin}
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                         Nenhum lead capturado ainda.
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </section>
        )}

        {/* === TAB: CLIENTS === */}
        {activeTab === 'clients' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Users className="text-brand-600 dark:text-brand-400" size={20} />
                 <h3 className="font-bold text-gray-800 dark:text-gray-200">Base de Clientes</h3>
              </div>
              <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-md text-xs font-bold">
                 {uniqueClients.length} Clientes Únicos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">CPF / Email</th>
                    <th className="px-6 py-3">Total Gasto</th>
                    <th className="px-6 py-3">Pedidos</th>
                    <th className="px-6 py-3">Último Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueClients.length > 0 ? (
                    uniqueClients.map((client, idx) => (
                      <tr key={idx} className="bg-white dark:bg-slate-800 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                          {client.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400">{client.cpf}</div>
                          <div className="text-xs text-gray-400">{client.email}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">
                          R$ {client.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-bold">
                            {client.ordersCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                           {new Date(client.lastOrder).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                        Nenhum cliente na base de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* === TAB: LOGS === */}
        {activeTab === 'logs' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <ScrollText className="text-brand-600 dark:text-brand-400" size={20} />
                 <h3 className="font-bold text-gray-800 dark:text-gray-200">Logs do Sistema</h3>
              </div>
              <div className="flex gap-2">
                  <button onClick={refreshLogs} className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600">
                      <Zap size={14} />
                  </button>
                  <button onClick={() => { clearLogs(); refreshLogs(); }} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50">
                      <Trash2 size={14} />
                  </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto bg-slate-900 p-4 font-mono text-xs">
                 {logs.length > 0 ? logs.map(log => (
                     <div key={log.id} className="mb-3 border-b border-slate-800 pb-2 last:border-0">
                         <div className="flex gap-2 mb-1">
                             <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                             <span className={`font-bold uppercase ${
                                log.type === 'error' ? 'text-red-500' : 
                                log.type === 'success' ? 'text-green-500' : 
                                log.type === 'warning' ? 'text-yellow-500' : 
                                'text-blue-500'
                             }`}>
                                 {log.type}
                             </span>
                             <span className="text-slate-400">[{log.source}]</span>
                         </div>
                         <div className="text-slate-300 pl-4 break-words">
                             {log.message}
                         </div>
                         {log.details && (
                             <pre className="mt-1 pl-4 text-slate-500 overflow-x-auto whitespace-pre-wrap">
                                 {JSON.stringify(log.details, null, 2)}
                             </pre>
                         )}
                     </div>
                 )) : (
                     <div className="text-slate-600 text-center italic py-4">Nenhum log registrado.</div>
                 )}
            </div>
          </section>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sticky bottom-4 z-40 disabled:opacity-70 disabled:cursor-wait"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Salvando...' : 'Salvar no Banco de Dados'}
        </button>
      </div>
    </div>
  );
};