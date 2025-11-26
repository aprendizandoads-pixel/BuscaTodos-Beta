import React, { useState } from 'react';
import { Lock, Save, LogOut, ToggleLeft, ToggleRight, Layout, ShoppingBag, Settings, Plus, Trash2, Edit2, Palette, Clock, CreditCard } from 'lucide-react';
import { AppConfig, Order, PlanDetails } from '../types';

interface AdminPanelProps {
  config: AppConfig;
  orders: Order[];
  onSave: (newConfig: AppConfig) => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, orders, onSave, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'config' | 'plans' | 'payment' | 'orders'>('config');
  const [editingPlan, setEditingPlan] = useState<'basic' | 'complete'>('complete');
  const [showToken, setShowToken] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Usuário ou senha incorretos. (Dica: admin / admin123)');
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    alert('Configurações salvas com sucesso!');
  };

  const handlePlanChange = (field: keyof PlanDetails, value: any) => {
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

  const addFeature = () => {
    setLocalConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [editingPlan]: {
          ...prev.plans[editingPlan],
          features: [...prev.plans[editingPlan].features, 'Novo benefício']
        }
      }
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...localConfig.plans[editingPlan].features];
    newFeatures[index] = value;
    handlePlanChange('features', newFeatures);
  };

  const removeFeature = (index: number) => {
    const newFeatures = localConfig.plans[editingPlan].features.filter((_, i) => i !== index);
    handlePlanChange('features', newFeatures);
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
            <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all mt-4">
              Entrar no Painel
            </button>
            <button type="button" onClick={onLogout} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
              Voltar ao Aplicativo
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-slide-up">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="bg-brand-600 p-1.5 rounded-lg">
             <Lock size={16} className="text-white" />
           </div>
           <h1 className="text-lg font-bold text-gray-800">Administração</h1>
        </div>
        <button onClick={onLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
          <LogOut size={18} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 max-w-xl mx-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'config' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Settings size={16} /> Geral
          </button>
          <button 
             onClick={() => setActiveTab('plans')}
             className={`flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'plans' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Layout size={16} /> Planos
          </button>
          <button 
             onClick={() => setActiveTab('payment')}
             className={`flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'payment' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CreditCard size={16} /> Pagamento
          </button>
          <button 
             onClick={() => setActiveTab('orders')}
             className={`flex-1 py-2 px-3 whitespace-nowrap rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-brand-50 text-brand-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ShoppingBag size={16} /> Vendas
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        
        {/* === TAB: GENERAL CONFIG === */}
        {activeTab === 'config' && (
          <>
            {/* Visual Style Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Palette className="text-brand-600" size={20} />
                <h3 className="font-bold text-gray-800">Identidade Visual Global</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor Primária (Hex)</label>
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
                       className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg uppercase"
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Arredondamento</label>
                    <select 
                      value={localConfig.style.borderRadius}
                      onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, borderRadius: e.target.value}})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <option value="0px">Quadrado (0px)</option>
                      <option value="0.5rem">Suave (8px)</option>
                      <option value="1rem">Padrão (16px)</option>
                      <option value="1.5rem">Redondo (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Escala da Fonte</label>
                    <select 
                      value={localConfig.style.fontScale}
                      onChange={e => setLocalConfig({...localConfig, style: {...localConfig.style, fontScale: parseFloat(e.target.value)}})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <option value="0.9">Pequena (90%)</option>
                      <option value="1">Normal (100%)</option>
                      <option value="1.1">Grande (110%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Social Login Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Lock className="text-brand-600" size={20} />
                <h3 className="font-bold text-gray-800">Login Social</h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-700">Google Login</span>
                  <button 
                    onClick={() => setLocalConfig(prev => ({...prev, social: {...prev.social, googleEnabled: !prev.social.googleEnabled}}))}
                    className={`transition-colors ${localConfig.social.googleEnabled ? 'text-brand-600' : 'text-gray-300'}`}
                  >
                    {localConfig.social.googleEnabled ? <ToggleRight size={40} fill="currentColor" className="text-brand-100" /> : <ToggleLeft size={40} />}
                  </button>
                </div>
                
                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-700">Facebook Login</span>
                  <button 
                    onClick={() => setLocalConfig(prev => ({...prev, social: {...prev.social, facebookEnabled: !prev.social.facebookEnabled}}))}
                    className={`transition-colors ${localConfig.social.facebookEnabled ? 'text-brand-600' : 'text-gray-300'}`}
                  >
                    {localConfig.social.facebookEnabled ? <ToggleRight size={40} fill="currentColor" className="text-brand-100" /> : <ToggleLeft size={40} />}
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <span className="font-medium text-gray-700">Apple Login</span>
                  <button 
                    onClick={() => setLocalConfig(prev => ({...prev, social: {...prev.social, appleEnabled: !prev.social.appleEnabled}}))}
                    className={`transition-colors ${localConfig.social.appleEnabled ? 'text-brand-600' : 'text-gray-300'}`}
                  >
                    {localConfig.social.appleEnabled ? <ToggleRight size={40} fill="currentColor" className="text-brand-100" /> : <ToggleLeft size={40} />}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* === TAB: PLANS === */}
        {activeTab === 'plans' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="flex border-b border-gray-100">
               <button 
                 onClick={() => setEditingPlan('basic')}
                 className={`flex-1 py-3 text-sm font-bold ${editingPlan === 'basic' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Plano Básico
               </button>
               <button 
                 onClick={() => setEditingPlan('complete')}
                 className={`flex-1 py-3 text-sm font-bold ${editingPlan === 'complete' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 Plano Completo
               </button>
             </div>

             <div className="p-6 space-y-6">
                
                {/* Header Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome do Plano</label>
                    <input 
                      type="text" 
                      value={localConfig.plans[editingPlan].name}
                      onChange={e => handlePlanChange('name', e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Descrição Curta</label>
                    <input 
                      type="text" 
                      value={localConfig.plans[editingPlan].description}
                      onChange={e => handlePlanChange('description', e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Preço De (R$)</label>
                    <input 
                      type="number" step="0.01"
                      value={localConfig.plans[editingPlan].oldPrice}
                      onChange={e => handlePlanChange('oldPrice', parseFloat(e.target.value))}
                      className="w-full mt-1 p-2 border border-gray-200 rounded-lg"
                    />
                   </div>
                   <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Preço Por (R$)</label>
                    <input 
                      type="number" step="0.01"
                      value={localConfig.plans[editingPlan].price}
                      onChange={e => handlePlanChange('price', parseFloat(e.target.value))}
                      className="w-full mt-1 p-2 border border-brand-200 rounded-lg bg-brand-50 font-bold text-brand-700"
                    />
                   </div>
                </div>

                {/* Styling */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                   <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Plano em Destaque?</label>
                      <button 
                        onClick={() => handlePlanChange('highlight', !localConfig.plans[editingPlan].highlight)}
                        className={`transition-colors ${localConfig.plans[editingPlan].highlight ? 'text-brand-600' : 'text-gray-300'}`}
                      >
                        {localConfig.plans[editingPlan].highlight ? <ToggleRight size={32} fill="currentColor" /> : <ToggleLeft size={32} />}
                      </button>
                   </div>
                   {localConfig.plans[editingPlan].highlight && (
                     <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Texto do Destaque</label>
                       <input 
                         type="text" 
                         value={localConfig.plans[editingPlan].highlightText || ''}
                         onChange={e => handlePlanChange('highlightText', e.target.value)}
                         className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm"
                         placeholder="Ex: Mais Vendido"
                       />
                     </div>
                   )}
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Cor do Plano</label>
                     <div className="flex gap-2">
                       <input 
                         type="color" 
                         value={localConfig.plans[editingPlan].color}
                         onChange={e => handlePlanChange('color', e.target.value)}
                         className="h-9 w-9 rounded cursor-pointer border-none"
                       />
                       <input 
                         type="text" 
                         value={localConfig.plans[editingPlan].color}
                         onChange={e => handlePlanChange('color', e.target.value)}
                         className="flex-1 p-2 border border-gray-200 rounded-lg text-sm uppercase"
                       />
                     </div>
                   </div>
                </div>

                {/* Features List */}
                <div>
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Lista de Benefícios</label>
                     <button onClick={addFeature} className="text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-brand-50 px-2 py-1 rounded">
                       <Plus size={14} /> Adicionar
                     </button>
                   </div>
                   <div className="space-y-2">
                     {localConfig.plans[editingPlan].features.map((feature, idx) => (
                       <div key={idx} className="flex gap-2">
                         <input 
                           type="text" 
                           value={feature}
                           onChange={e => updateFeature(idx, e.target.value)}
                           className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                         />
                         <button 
                           onClick={() => removeFeature(idx)}
                           className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))}
                   </div>
                </div>

             </div>
          </section>
        )}

        {/* === TAB: PAYMENT === */}
        {activeTab === 'payment' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-600 hover:text-brand-800"
                  >
                    {showToken ? 'Ocultar' : 'Mostrar'}
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

            </div>
          </section>
        )}

        {/* === TAB: ORDERS === */}
        {activeTab === 'orders' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
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
          className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sticky bottom-4"
        >
          <Save size={20} />
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};