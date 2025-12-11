
import React, { useState, useEffect } from 'react';
import { Search, Home, User, Bell, ArrowRight, Shield, Car, Building, CheckCircle2, Lock, Smartphone, Moon, Sun, Loader2, AlertCircle } from 'lucide-react';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PreviewPage } from './components/PreviewPage';
import { RegistrationModal } from './components/RegistrationModal';
import { AdminPanel } from './components/AdminPanel';
import { LeadCaptureModal } from './components/LeadCaptureModal';
import { AppView, SearchType, AppConfig, Order, Lead } from './types';
import { maskCPF, maskCNPJ, maskPlate, maskPhone, validateInput, getPlaceholder } from './utils/masks';
import { loadAppConfig, saveAppConfig } from './services/storage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [searchType, setSearchType] = useState<SearchType>('CPF');
  const [inputValue, setInputValue] = useState('');
  const [showInputError, setShowInputError] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Rota de Admin Secreta - Verifica URL ao carregar
  // Atualizado para suportar Hash (#) e Query (?) para evitar erro 404 no servidor
  useEffect(() => {
    const checkRoute = () => {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const search = window.location.search;

        if (
            path.includes('/paneladm') || 
            hash.includes('paneladm') || 
            search.includes('paneladm')
        ) {
            setCurrentView(AppView.ADMIN);
        }
    };
    checkRoute();
  }, []);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // App Configuration State
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  // Load Config on Mount
  useEffect(() => {
    const initConfig = async () => {
        const config = await loadAppConfig();
        setAppConfig(config);
        setConfigLoaded(true);
    };
    initConfig();
  }, []);

  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('appOrders_v1');
    if (savedOrders) {
      try {
        return JSON.parse(savedOrders);
      } catch (e) {
        console.error("Error parsing orders", e);
      }
    }
    return [];
  });

  // Leads Logic
  const [leads, setLeads] = useState<Lead[]>(() => {
      const savedLeads = localStorage.getItem('appLeads_v1');
      return savedLeads ? JSON.parse(savedLeads) : [];
  });

  // State to track if the current session has already captured user data
  const [currentSessionLead, setCurrentSessionLead] = useState<Lead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('appOrders_v1', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('appLeads_v1', JSON.stringify(leads));
  }, [leads]);

  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'complete'>('complete');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showInputError) setShowInputError(false); // Clear error when typing
    
    const raw = e.target.value;
    let formatted = raw;
    
    if (searchType === 'CPF') formatted = maskCPF(raw);
    else if (searchType === 'CNPJ') formatted = maskCNPJ(raw);
    else if (searchType === 'PLACA') formatted = maskPlate(raw);
    else if (searchType === 'PHONE') formatted = maskPhone(raw);

    setInputValue(formatted);
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    setInputValue(''); 
    setShowInputError(false);
    // Rola para o topo onde está o campo de busca
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInput(inputValue, searchType)) {
        // Intercept: If lead not captured, show modal
        if (!currentSessionLead) {
            setShowLeadModal(true);
        } else {
            setIsLoading(true);
        }
    } else {
        // Validation Failed Logic
        setInputValue(''); // Limpa o campo imediatamente
        setShowInputError(true); // Exibe o tooltip vermelho
        
        // Esconde o tooltip após 3 segundos
        setTimeout(() => {
            setShowInputError(false);
        }, 3000);
    }
  };

  const handleLeadSubmit = (leadData: Omit<Lead, 'id' | 'date' | 'origin' | 'deviceInfo'>) => {
      const newLead: Lead = {
          id: `lead_${Date.now()}`,
          date: new Date().toISOString(),
          origin: document.referrer || 'Direto',
          deviceInfo: navigator.userAgent,
          ...leadData
      };

      setLeads(prev => [newLead, ...prev]);
      setCurrentSessionLead(newLead);
      setShowLeadModal(false);
      setIsLoading(true); // Proceed with the search
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Switch to Preview Page instead of opening a modal
    setCurrentView(AppView.PREVIEW);
  };

  const handlePlanSelect = (plan: 'basic' | 'complete') => {
    setSelectedPlan(plan);
    setShowRegistrationModal(true);
  };

  const handleOrderCreated = (orderData: Omit<Order, 'id' | 'date'>) => {
     if (!appConfig) return;
     const newOrder: Order = {
       id: `ord_${Date.now()}`,
       date: new Date().toISOString(),
       gateway: appConfig.payment.activeGateway,
       searchType: searchType,
       ...orderData
     };
     setOrders(prev => [newOrder, ...prev]);
  };
  
  const updateOrderStatus = (paymentId: string, status: 'approved' | 'rejected') => {
    setOrders(prev => prev.map(o => o.paymentId === paymentId ? {...o, status} : o));
  };

  const handleAdminSave = async (newConfig: AppConfig) => {
    // Save to "Database" via Service
    const success = await saveAppConfig(newConfig);
    if (success) {
        setAppConfig(newConfig);
        // Force reload from storage to ensure consistency
        const reloaded = await loadAppConfig();
        setAppConfig(reloaded);
    } else {
        alert("Erro ao salvar no banco de dados.");
    }
  };

  // Loading Splash Screen
  if (!configLoaded || !appConfig) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
              <div className="relative">
                  <div className="absolute inset-0 bg-brand-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <Shield size={64} className="text-brand-600 dark:text-brand-400 relative z-10 animate-bounce" />
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-sm animate-pulse">Carregando sistema...</p>
          </div>
      );
  }

  if (currentView === AppView.ADMIN) {
    return (
      <AdminPanel 
        config={appConfig} 
        orders={orders}
        leads={leads}
        onSave={handleAdminSave} 
        onLogout={() => {
            // Limpa queries e hashes para evitar loop de retorno ao admin
            window.history.pushState({}, '', '/');
            setCurrentView(AppView.HOME);
        }} 
      />
    );
  }

  // --- PREVIEW PAGE LOGIC ---
  if (currentView === AppView.PREVIEW) {
      return (
          <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-sans">
              <PreviewPage 
                  searchType={searchType}
                  inputValue={inputValue}
                  config={appConfig}
                  onSelectPlan={handlePlanSelect}
                  onBack={() => setCurrentView(AppView.HOME)}
              />
              
              {showRegistrationModal && (
                <RegistrationModal
                  plan={selectedPlan}
                  searchType={searchType}
                  onClose={() => setShowRegistrationModal(false)}
                  onSuccess={handleOrderCreated}
                  onPaymentUpdate={updateOrderStatus}
                  onSubmit={() => {}} 
                  config={appConfig}
                  initialCpf={searchType === 'CPF' ? inputValue : ''}
                  initialData={currentSessionLead ? { name: currentSessionLead.name, email: currentSessionLead.email, phone: currentSessionLead.phone } : undefined}
                />
              )}
          </div>
      );
  }

  // --- HOME VIEW RENDER ---
  const renderHome = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 animate-slide-up transition-colors duration-300" style={{ fontSize: `${appConfig.style.fontScale}rem` }}>
      {/* Hero Header */}
      <header className="px-6 pt-12 pb-24 rounded-b-[3rem] relative overflow-hidden shadow-xl" style={{ backgroundColor: appConfig.style.primaryColor }}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield size={200} className="text-white transform rotate-12" />
        </div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Consulta<span className="font-light">Nacional</span></span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleDarkMode} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                {darkMode ? <Sun className="text-white" size={20} /> : <Moon className="text-white" size={20} />}
             </button>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            Consulta Unificada <br/>de Dados Públicos
          </h1>
          <p className="text-white/80 text-sm max-w-[90%] mb-6">
            Acesse informações detalhadas sobre pessoas, empresas e veículos em uma única plataforma.
          </p>
        </div>
      </header>

      {/* Search Box - Floating with Tabs */}
      <div className="px-6 -mt-20 relative z-20">
        <div 
          className="bg-white dark:bg-gray-800 shadow-xl p-2 border border-gray-100 dark:border-gray-700 transition-colors duration-300" 
          style={{ borderRadius: appConfig.style.borderRadius }}
        >
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => handleTypeChange('CPF')}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'CPF' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <User size={14} /> CPF
            </button>
            <button 
              onClick={() => handleTypeChange('CNPJ')}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'CNPJ' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Building size={14} /> CNPJ
            </button>
            <button 
              onClick={() => handleTypeChange('PLACA')}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'PLACA' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Car size={14} /> Placa
            </button>
            <button 
              onClick={() => handleTypeChange('PHONE')}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                searchType === 'PHONE' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Smartphone size={14} /> Celular
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 px-2 pb-2">
            <div className="relative group">
              {showInputError && (
                <div className="absolute -top-12 left-0 right-0 mx-auto w-max bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-bounce z-30 flex items-center gap-2">
                   <AlertCircle size={16} className="text-white" />
                   Dados inválidos. Digite novamente.
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
                </div>
              )}
              
              <input
                type={searchType === 'PLACA' ? "text" : "tel"} 
                inputMode={searchType === 'PLACA' ? "text" : "numeric"}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={getPlaceholder(searchType)}
                className={`w-full bg-gray-50 dark:bg-gray-700 border ${showInputError ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900/30' : 'border-gray-200 dark:border-gray-600'} text-gray-900 dark:text-white text-lg font-bold rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 uppercase`}
              />
              {validateInput(inputValue, searchType) && !showInputError && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 bg-green-50 dark:bg-green-900/30 p-1 rounded-full animate-in zoom-in duration-200">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            <button 
              type="submit"
              style={{ backgroundColor: appConfig.style.primaryColor }}
              className="w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]"
            >
              CONSULTAR {searchType}
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield size={12} />
          <span>Ambiente 100% Seguro e Criptografado (256-bit)</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 py-8">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 text-lg">O que você encontra aqui?</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <User size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">Pessoas Físicas</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Situação na Receita, Score, Dívidas, Processos e Dados Cadastrais.</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Building size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">Empresas</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quadro Societário, Capital Social, Dívidas Trabalhistas e Fiscais.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Car size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">Veículos</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Multas, Restrições (Roubo/Furto), Dados do Proprietário e Tabela Fipe.</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200">Telefonia</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Titular da linha, operadora, endereço vinculado e status.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 shadow-2xl relative overflow-hidden font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
      
      {isLoading && <LoadingOverlay onComplete={handleLoadingComplete} type={searchType} />}
      
      {showLeadModal && (
          <LeadCaptureModal 
            onClose={() => setShowLeadModal(false)}
            onSubmit={handleLeadSubmit}
            config={appConfig}
            searchType={searchType}
          />
      )}

      <main className="min-h-screen pb-20">
        {currentView === AppView.HOME ? renderHome() : null}
      </main>

      {/* Bottom Navigation - Fixed, 4 Items, No Profile */}
      {currentView === AppView.HOME && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-2 py-3 grid grid-cols-4 gap-1 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
            <button 
            onClick={() => handleTypeChange('CPF')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${searchType === 'CPF' ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 dark:text-gray-500'}`}
            >
            <User size={24} strokeWidth={searchType === 'CPF' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Pessoa</span>
            </button>

            <button 
            onClick={() => handleTypeChange('CNPJ')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${searchType === 'CNPJ' ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 dark:text-gray-500'}`}
            >
            <Building size={24} strokeWidth={searchType === 'CNPJ' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Empresa</span>
            </button>

            <button 
            onClick={() => handleTypeChange('PLACA')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${searchType === 'PLACA' ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 dark:text-gray-500'}`}
            >
            <Car size={24} strokeWidth={searchType === 'PLACA' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Veículo</span>
            </button>

            <button 
            onClick={() => handleTypeChange('PHONE')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${searchType === 'PHONE' ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 dark:text-gray-500'}`}
            >
            <Smartphone size={24} strokeWidth={searchType === 'PHONE' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Celular</span>
            </button>
        </nav>
      )}
    </div>
  );
};

export default App;
