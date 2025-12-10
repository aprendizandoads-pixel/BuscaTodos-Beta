import React, { useState } from 'react';
import { Lock, Save, LogOut, ToggleLeft, ToggleRight, Layout, ShoppingBag, Settings, Plus, Trash2, Edit2, Palette, Clock, CreditCard, Eye, EyeOff } from 'lucide-react';
import { AppConfig, Order, PlanDetails } from '../types';

interface AdminPanelProps {
  config: AppConfig;
  orders: Order[];
  onSave: (newConfig: AppConfig) => void;
  onLogout: () => void;
}

// Reusable Tooltip Component
const ActionTooltip = ({ text }: { text: string }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[100] shadow-lg">
    {text}
    {/* Arrow */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
  </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, orders, onSave, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'config' | 'plans' | 'payment' | 'orders'>('config');
  const [editingPlan, setEditingPlan] = useState<'basic' | 'complete'>('complete');
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Usuário ou senha incorretos. (Dica: admin / admin123)');
    }
  };

  const handleSave = () => {
    // Check for errors
    if (Object.keys(errors).length > 0) {
      alert('Corrija os erros antes de salvar.');
      return;
    }

    // Clean up features (remove empty strings) before saving
    const cleanPlans = { ...localConfig.plans };
    cleanPlans.basic.features = cleanPlans.basic.features.filter(line => line.trim() !== '');
    cleanPlans.complete.features = cleanPlans.complete.features.filter(line => line.trim() !== '');

    const finalConfig = { ...localConfig, plans: cleanPlans };
    onSave(finalConfig);
    setLocalConfig(finalConfig);
    alert('Configurações salvas com sucesso!');
  };

  const handlePlanChange = (field: keyof PlanDetails, value: any) => {
    // Validation for prices
    if (field === 'price' || field === 'oldPrice') {
      if (isNaN(value) || value < 0) {
        setErrors(prev => ({ ...prev, [field]: 'Valor inválido' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }

    setLocalConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [editingPlan]: {
          ...prev.plans[editingPlan],
          [field]: value
        }
      }
    }));
  };

  const handleFeaturesChange = (text: string) => {
    const featuresArray = text.split('\n');
    handlePlanChange('features', featuresArray);
  };

  const appendFeature = () => {
    const currentFeatures = localConfig.plans[editingPlan].features;
    handlePlanChange('features', [...currentFeatures, '']);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-50 rounded-full">
              <Lock className="text-brand-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Painel Admin</h2>
          <p className="text-center text-gray-400 text-sm mb-8">Acesso restrito a administradores</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              className="group relative w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all mt-4"
            >
              Entrar no Painel
              <ActionTooltip text="Acessar painel administrativo" />
            </button>
            <button 
              type="button" 
              onClick={onLogout} 
              className="group relative w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
            >
              Voltar ao Aplicativo
              <ActionTooltip text="Retornar à tela inicial" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-slide-up">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="bg-brand-600 p-1.5 rounded-lg">
             <Lock size={16} className="text-white" />
           </div>
           <h1 className="text-lg font-bold text-gray-800">Administração</h1>
        </div>
        <button 
          onClick={onLogout} 
          className="group relative text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Sair</span>
          <ActionTooltip text="Encerrar sessão segura" />
        </button>
      </header>

      <div className="px-6 mt-6">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 max-w-xl mx-auto overflow-x-auto">
          <button onClick={() => setActiveTab('config')} className={`group relative flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'config' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <Settings size={16} /> Geral
            <ActionTooltip text="Configurações Gerais" />
          </button>
          <button onClick={() => setActiveTab('plans')} className={`group relative flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'plans' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <Layout size={16} /> Planos
            <ActionTooltip text="Editar Planos" />
          </button>
          <button onClick={() => setActiveTab('payment')} className={`group relative flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'payment' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <CreditCard size={16} /> Pagamento
            <ActionTooltip text="Configurar API" />
          </button>
          <button onClick={() => setActiveTab('orders')} className={`group relative flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <ShoppingBag size={16} /> Vendas
            <ActionTooltip text="Histórico de Vendas" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {activeTab === 'config' && (
          <>
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 rounded-t-2xl">
                <Palette className="text-brand-600" size={20} />
                <h3 className="font-bold text-gray-800">Identidade Visual Global</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor Primária (Hex)</label>
                   <div className="flex gap-2">
                     <input type="color" value={localConfig.style.primaryColor} onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, primaryColor: e.target.value}})} className="h-10 w-10 rounded cursor-pointer border-none" />
                     <input type="text" value={localConfig.style.primaryColor} onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, primaryColor: e.target.value}})} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg uppercase" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Arredondamento</label>
                    <select value={localConfig.style.borderRadius} onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, borderRadius: e.target.value}})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <option value="0px">Quadrado (0px)</option>
                      <option value="0.5rem">Suave (8px)</option>
                      <option value="1rem">Padrão (16px)</option>
                      <option value="1.5rem">Redondo (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Escala da Fonte</label>
                    <select value={localConfig.style.fontScale} onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, fontScale: parseFloat(e.target.value)}})} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <option value="0.9">Pequena (90%)</option>
                      <option value="1">Normal (100%)</option>
                      <option value="1.1">Grande (110%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 rounded-t-2xl">
                <Lock className="text-brand-600" size={20} />
                <h3 className="font-bold text-gray-800">Login Social</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {['Google', 'Facebook', 'Apple'].map((provider) => (
                  <div key={provider} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <span className="font-medium text-gray-700">{provider} Login</span>
                    <button 
                      onClick={() => setLocalConfig(prev => ({...prev, social: {...prev.social, [`${provider.toLowerCase()}Enabled`]: !prev.social[`${provider.toLowerCase()}Enabled` as keyof typeof prev.social]}}))}
                      className={`group relative transition-colors ${localConfig.social[`${provider.toLowerCase()}Enabled` as keyof typeof localConfig.social] ? 'text-brand-600' : 'text-gray-300'}`}
                    >
                      {localConfig.social[`${provider.toLowerCase()}Enabled` as keyof typeof localConfig.social] ? <ToggleRight size={40} fill="currentColor" className="text-brand-100" /> : <ToggleLeft size={40} />}
                      <ActionTooltip text={localConfig.social[`${provider.toLowerCase()}Enabled` as keyof typeof localConfig.social] ? 'Desativar login' : 'Ativar login'} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'plans' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="flex border-b border-gray-100 rounded-t-2xl overflow-hidden">
               <button onClick={() => setEditingPlan('basic')} className={`group relative flex-1 py-3 text-sm font-bold ${editingPlan === 'basic' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                 Plano Básico
                 <ActionTooltip text="Editar detalhes do Básico" />
               </button>
               <button onClick={() => setEditingPlan('complete')} className={`group relative flex-1 py-3 text-sm font-bold ${editingPlan === 'complete' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                 Plano Completo
                 <ActionTooltip text="Editar detalhes do Completo" />
               </button>
             </div>
             <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome do Plano</label>
                    <input type="text" value={localConfig.plans[editingPlan].name} onChange={e => handlePlanChange('name', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-1">
                      Descrição Curta (Markdown)
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Use **texto** para negrito</span>
                    </label>
                    <textarea rows={3} value={localConfig.plans[editingPlan].description} onChange={e => handlePlanChange('description', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-sans" placeholder="Descrição do plano..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Preço De (R$)</label>
                    <input type="number" step="0.01" min="0" value={localConfig.plans[editingPlan].oldPrice} onChange={e => { const val = parseFloat(e.target.value); handlePlanChange('oldPrice', isNaN(val) ? 0 : Math.max(0, val)); }} className="w-full mt-1 p-2 border border-gray-200 rounded-lg" />
                    {errors.oldPrice && <p className="text-red-500 text-[10px] mt-1">{errors.oldPrice}</p>}
                   </div>
                   <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Preço Por (R$)</label>
                    <input type="number" step="0.01" min="0" value={localConfig.plans[editingPlan].price} onChange={e => { const val = parseFloat(e.target.value); handlePlanChange('price', isNaN(val) ? 0 : Math.max(0, val)); }} className="w-full mt-1 p-2 border border-brand-200 rounded-lg bg-brand-50 font-bold text-brand-700" />
                    {errors.price && <p className="text-red-500 text-[10px] mt-1">{errors.price}</p>}
                   </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                   <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Plano em Destaque?</label>
                      <button onClick={() => handlePlanChange('highlight', !localConfig.plans[editingPlan].highlight)} className={`group relative transition-colors ${localConfig.plans[editingPlan].highlight ? 'text-brand-600' : 'text-gray-300'}`}>
                        {localConfig.plans[editingPlan].highlight ? <ToggleRight size={32} fill="currentColor" /> : <ToggleLeft size={32} />}
                        <ActionTooltip text={localConfig.plans[editingPlan].highlight ? 'Remover destaque' : 'Tornar destaque'} />
                      </button>
                   </div>
                   {localConfig.plans[editingPlan].highlight && (
                     <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Texto do Destaque</label>
                       <input type="text" value={localConfig.plans[editingPlan].highlightText || ''} onChange={e => handlePlanChange('highlightText', e.target.value)} className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm" placeholder="Ex: Mais Vendido" />
                     </div>
                   )}
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cor do Plano</label>
                     <div className="flex gap-2">
                       <input type="color" value={localConfig.plans[editingPlan].color} onChange={e => handlePlanChange('color', e.target.value)} className="h-9 w-9 rounded cursor-pointer border-none" />
                       <input type="text" value={localConfig.plans[editingPlan].color} onChange={e => handlePlanChange('color', e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-lg text-sm uppercase" />
                     </div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                       Lista de Benefícios (1 por linha)
                       <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Markdown Suportado</span>
                     </label>
                     <button onClick={appendFeature} className="group relative text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-brand-50 px-2 py-1 rounded">
                       <Plus size={14} /> Adicionar
                       <ActionTooltip text="Adicionar nova linha" />
                     </button>
                   </div>
                   <div className="relative">
                     <textarea rows={8} value={localConfig.plans[editingPlan].features.join('\n')} onChange={e => handleFeaturesChange(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-sans leading-relaxed focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="- Benefício 1&#10;- Benefício 2&#10;- Benefício 3" />
                   </div>
                </div>
             </div>
          </section>
        )}

        {activeTab === 'payment' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 rounded-t-2xl">
              <CreditCard className="text-brand-600" size={20} />
              <h3 className="font-bold text-gray-800">Configuração Mercado Pago</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 mb-2">
                 Configure aqui suas credenciais para processar pagamentos via PIX.
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Access Token (Produção)</label>
                <div className="relative">
                  <input 
                    type={showToken ? "text" : "password"}
                    value={localConfig.payment.accessToken}
                    onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, accessToken: e.target.value}})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none pr-20"
                    placeholder="APP_USR-..."
                  />
                  <button 
                    onClick={() => setShowToken(!showToken)}
                    className="group relative absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-800 p-1"
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    <ActionTooltip text={showToken ? 'Ocultar token' : 'Mostrar token'} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Public Key</label>
                <input 
                  type="text" 
                  value={localConfig.payment.publicKey}
                  onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, publicKey: e.target.value}})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="APP_USR-..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client ID</label>
                <input 
                  type="text" 
                  value={localConfig.payment.clientId || ''}
                  onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, clientId: e.target.value}})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="3981..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Client Secret</label>
                <div className="relative">
                  <input 
                    type={showToken ? "text" : "password"}
                    value={localConfig.payment.clientSecret || ''}
                    onChange={e => setLocalConfig({...localConfig, payment: {...localConfig.payment, clientSecret: e.target.value}})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none pr-20"
                    placeholder="PJjL..."
                  />
                </div>
              </div>

            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-brand-600" size={20} />
                  <h3 className="font-bold text-gray-800">Pedidos Recentes</h3>
                </div>
                <span className="text-xs font-medium text-gray-500">{orders.length} total</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Nenhuma venda realizada ainda.
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800">{order.customerName}</span>
                        <span className="font-bold text-gray-800">R$ {order.amount.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                         <span>{order.customerCpf} • {order.plan === 'basic' ? 'Básico' : 'Completo'}</span>
                         <span>{new Date(order.date).toLocaleDateString('pt-BR')} {new Date(order.date).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        {order.status === 'approved' 
                          ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CreditCard size={10} /> Pago</span>
                          : <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Clock size={10} /> Pendente</span>
                        }
                        <span className="text-[10px] text-gray-400 font-mono">{order.paymentId || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </section>
        )}

        {/* Save Button (Always visible) */}
        <button 
          onClick={handleSave}
          className="group relative w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sticky bottom-4 z-40"
        >
          <Save size={20} />
          Salvar Alterações
          <ActionTooltip text="Salvar todas as alterações" />
        </button>
      </div>
    </div>
  );
};