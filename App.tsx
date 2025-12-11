import React, { useState, useEffect } from 'react';
import { Search, Home, User, Bell, ArrowRight, Shield, Car, Building, CheckCircle2, Lock } from 'lucide-react';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ResultsPreview } from './components/ResultsPreview';
import { RegistrationModal } from './components/RegistrationModal';
import { AdminPanel } from './components/AdminPanel';
import { AppView, SearchType, AppConfig, Order } from './types';
import { maskCPF, maskCNPJ, maskPlate, validateInput, getPlaceholder } from './utils/masks';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [searchType, setSearchType] = useState<SearchType>('CPF');
  const [inputValue, setInputValue] = useState('');
  
  // App Configuration State with LocalStorage Persistence
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const savedConfig = localStorage.getItem('appConfig_v7'); // Bump version
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (e) {
        console.error("Error parsing saved config", e);
      }
    }
    // Default values if no save exists
    return {
      plans: {
        basic: {
          id: 'basic',
          active: true,
          name: 'Regularidade Básico',
          description: 'Ideal para verificações rápidas',
          price: 29.90,
          oldPrice: 49.90,
          highlight: false,
          color: '#0284c7', // Brand 600
          features: [
            'Situação Cadastral (Receita)',
            'Processos Judiciais Básicos',
            'Vínculos e Benefícios Sociais'
          ]
        },
        complete: {
          id: 'complete',
          active: true,
          name: 'Consulta Completa',
          description: 'Análise total de riscos',
          price: 34.90,
          oldPrice: 69.90,
          highlight: true,
          highlightText: 'Mais Vendido',
          color: '#7c3aed', // Purple 600
          features: [
            'Tudo do Plano Básico',
            'Score de Crédito Detalhado',
            'Certidões Fiscais e Dívida Ativa',
            'Antecedentes Criminais',
            'Protestos em Cartório (Nacional)'
          ]
        }
      },
      style: {
        borderRadius: '1rem', // rounded-2xl
        fontScale: 1,
        primaryColor: '#0284c7'
      },
      social: {
        googleEnabled: true,
        facebookEnabled: true,
        appleEnabled: true
      },
      payment: {
        accessToken: 'APP_USR-3981464870256972-092413-3cac81a1b58892ee959b900e6998aa81-2081587558',
        publicKey: 'APP_USR-892c5e49-0079-45eb-9f04-16147ecd73d8'
      }
    };
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  // State for flow control
  const [isLoading, setIsLoading] = useState(false);
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'complete'>('complete');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let formatted = raw;
    
    // Apply Mask based on type
    if (searchType === 'CPF') formatted = maskCPF(raw);
    else if (searchType === 'CNPJ') formatted = maskCNPJ(raw);
    else if (searchType === 'PLACA') formatted = maskPlate(raw);

    setInputValue(formatted);
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    setInputValue(''); // Clear input on type switch
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInput(inputValue, searchType)) {
      // Step 1: Start Animation
      setIsLoading(true);
    }
  };

  const handleLoadingComplete = () => {
    // Step 2: Animation finished, show Results Preview (which contains plans)
    setIsLoading(false);
    setShowResultsPreview(true);
  };

  const handlePlanSelect = (plan: 'basic' | 'complete') => {
    // Step 3: Plan selected from Preview, show Registration
    setSelectedPlan(plan);
    setShowRegistrationModal(true);
  };

  const handleOrderCreated = (orderData: Omit<Order, 'id' | 'date'>) => {
     // Create new order record for Admin Panel
     const newOrder: Order = {
       id: `ord_${Date.now()}`,
       date: new Date().toISOString(),
       ...orderData
     };
     setOrders(prev => [newOrder, ...prev]);
  };
  
  const updateOrderStatus = (paymentId: string, status: 'approved' | 'rejected') => {
    setOrders(prev => prev.map(o => o.paymentId === paymentId ? {...o, status} : o));
  };

  const handleAdminSave = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    localStorage.setItem('appConfig_v7', JSON.stringify(newConfig));
  };

  // --- Views ---

  if (currentView === AppView.ADMIN) {
    return (
      <AdminPanel 
        config={appConfig} 
        orders={orders}
        onSave={handleAdminSave} 
        onLogout={() => setCurrentView(AppView.HOME)} 
      />
    );
  }

  // If showing Results Preview, we render it full screen
  if (showResultsPreview && !isLoading) {
    return (
      <>
        <ResultsPreview 
          onSelectPlan={handlePlanSelect} 
          config={appConfig} 
          searchType={searchType}
          inputValue={inputValue}
        />
        {showRegistrationModal && (
          <RegistrationModal
            plan={selectedPlan}
            onClose={() => setShowRegistrationModal(false)}
            onSuccess={handleOrderCreated}
            onPaymentUpdate={updateOrderStatus}
            onSubmit={() => {}} // Legacy prop
            config={appConfig}
            initialCpf={searchType === 'CPF' ? inputValue : ''}
          />
        )}
      </>
    );
  }

  const renderHome = () => (
    <div className="flex flex-col min-h-screen bg-gray-50 animate-slide-up" style={{ fontSize: `${appConfig.style.fontScale}rem` }}>
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
          <button className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Bell className="text-white" size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-600"></span>
          </button>
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
          className="bg-white shadow-xl p-2 border border-gray-100" 
          style={{ borderRadius: appConfig.style.borderRadius }}
        >
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
            <button 
              onClick={() => handleTypeChange('CPF')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                searchType === 'CPF' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User size={16} /> CPF
            </button>
            <button 
              onClick={() => handleTypeChange('CNPJ')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                searchType === 'CNPJ' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Building size={16} /> CNPJ
            </button>
            <button 
              onClick={() => handleTypeChange('PLACA')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                searchType === 'PLACA' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Car size={16} /> Placa
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 px-2 pb-2">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={getPlaceholder(searchType)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg font-bold rounded-xl py-4 px-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-gray-400 uppercase"
              />
              {validateInput(inputValue, searchType) && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 bg-green-50 p-1 rounded-full animate-in zoom-in duration-200">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            <button 
              type="submit"
              disabled={!validateInput(inputValue, searchType)}
              style={{ backgroundColor: appConfig.style.primaryColor }}
              className="w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all active:scale-[0.98]"
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
        <h3 className="font-bold text-gray-800 mb-4 text-lg">O que você encontra aqui?</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <User size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Pessoas Físicas</h4>
              <p className="text-sm text-gray-500 mt-1">Situação na Receita, Score, Dívidas, Processos e Dados Cadastrais.</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Building size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Empresas</h4>
              <p className="text-sm text-gray-500 mt-1">Quadro Societário, Capital Social, Dívidas Trabalhistas e Fiscais.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Car size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Veículos</h4>
              <p className="text-sm text-gray-500 mt-1">Multas, Restrições (Roubo/Furto), Dados do Proprietário e Tabela Fipe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 shadow-2xl relative overflow-hidden font-sans text-gray-800">
      
      {isLoading && <LoadingOverlay onComplete={handleLoadingComplete} type={searchType} />}
      
      {/* If not in results mode and not admin, show Home content */}
      <main className="min-h-screen pb-20">
        {renderHome()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => {
            setShowResultsPreview(false);
            setCurrentView(AppView.HOME);
          }}
          className={`flex flex-col items-center gap-1 ${currentView === AppView.HOME && !showResultsPreview ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={currentView === AppView.HOME && !showResultsPreview ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        
        <div className="relative -top-8">
          <button 
            onClick={() => {
              setShowResultsPreview(false);
              setCurrentView(AppView.HOME);
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-500/40 active:scale-95 transition-transform"
            style={{ backgroundColor: appConfig.style.primaryColor }}
          >
            <Search size={24} strokeWidth={3} />
          </button>
        </div>

        <button 
          onClick={() => {
            setShowResultsPreview(false);
            setCurrentView(AppView.ADMIN);
          }} 
          className={`flex flex-col items-center gap-1 text-gray-400 hover:text-brand-600`}
        >
          <User size={24} strokeWidth={2} />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default App;