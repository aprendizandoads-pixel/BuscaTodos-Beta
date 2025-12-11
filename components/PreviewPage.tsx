import React, { useRef } from 'react';
import { CheckCircle, Shield, AlertTriangle, Lock, FileText, Star, Check, ChevronDown } from 'lucide-react';
import { AppConfig, PlanDetails, SearchType } from '../types';

interface PreviewPageProps {
  searchType: SearchType;
  inputValue: string;
  config: AppConfig;
  onSelectPlan: (plan: 'basic' | 'complete') => void;
  onBack: () => void;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({ searchType, inputValue, config, onSelectPlan, onBack }) => {
  const plansSectionRef = useRef<HTMLDivElement>(null);
  const { style } = config;

  // Determine correct plans
  let activePlans;
  switch (searchType) {
      case 'CNPJ': activePlans = config.plans.cnpj; break;
      case 'PLACA': activePlans = config.plans.plate; break;
      case 'PHONE': activePlans = config.plans.phone; break;
      default: activePlans = config.plans.cpf; break;
  }
  const plansList = [activePlans.basic, activePlans.complete];

  const getMaskedTitle = () => {
      if (searchType === 'CPF') return `CPF ${inputValue}`;
      if (searchType === 'CNPJ') return `CNPJ ${inputValue}`;
      if (searchType === 'PLACA') return `Placa ${inputValue.toUpperCase()}`;
      return `Telefone ${inputValue}`;
  };

  const getMockName = () => {
      // Retorna apenas asteriscos conforme solicitado
      return '**** ******* ****** ******';
  };

  const scrollToPlans = () => {
    plansSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 animate-fade-in font-sans">
      
      {/* Header Result */}
      <div className="bg-green-600 px-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CheckCircle size={150} className="text-white transform rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full mb-3 animate-bounce">
                <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Consulta Localizada!</h1>
            <p className="text-white/90 text-xs max-w-xs">
                Registros encontrados na base de dados.
            </p>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-5">
          
          {/* Result Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-5">
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Documento</span>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{getMaskedTitle()}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Ativo
                  </div>
              </div>

              <div className="space-y-4">
                  <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome / Razão Social</span>
                      {/* Texto trocado por asteriscos e mantido o blur */}
                      <p className="font-bold text-gray-400 dark:text-gray-500 text-lg blur-[4px] select-none tracking-widest">{getMockName()}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                       <div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Situação</span>
                           <p className="font-bold text-gray-800 dark:text-gray-200">Regular</p>
                       </div>
                       <div>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Protocolo</span>
                           <p className="font-mono text-gray-600 dark:text-gray-400 text-sm">#{Math.floor(Math.random() * 999999)}</p>
                       </div>
                  </div>

                  {/* Blurred Data Teaser - Clickable with Tooltip */}
                  <div 
                    onClick={scrollToPlans}
                    className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700 relative overflow-hidden cursor-pointer group transition-all hover:border-brand-300 dark:hover:border-brand-700"
                  >
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none mb-2">
                        Contrate um plano para liberar
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45"></div>
                      </div>

                      <div className="space-y-2 opacity-30 blur-[3px] select-none pointer-events-none group-hover:opacity-20 transition-opacity">
                          <div className="h-3 bg-gray-400 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-400 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-400 rounded w-full"></div>
                      </div>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/10 backdrop-blur-[1px]">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-slate-600 group-hover:scale-105 transition-transform">
                              <Lock size={12} className="text-brand-500" /> 
                              Dados Ocultos
                          </div>
                          <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse">
                              Clique para liberar
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Plans Section */}
          <div ref={plansSectionRef} className="scroll-mt-6">
              <div className="flex items-center gap-2 mb-3 px-1">
                  <FileText className="text-brand-600 dark:text-brand-400" size={18} />
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Relatórios Disponíveis</h2>
              </div>

              <div className="space-y-3">
                {plansList.map((plan: PlanDetails) => {
                     if (plan.active === false) return null;
                     
                     // Safe access to prices with fallback to 0
                     const price = plan.price || 0;
                     const oldPrice = plan.oldPrice || 0;

                     return (
                        <div 
                        key={plan.id}
                        className={`bg-white dark:bg-slate-800 p-4 rounded-2xl border transition-all ${plan.highlight ? 'shadow-lg border-transparent' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}
                        style={{ 
                            boxShadow: plan.highlight ? `0 4px 20px -5px ${plan.color}30` : 'none',
                            border: plan.highlight ? `1px solid ${plan.color}` : undefined
                        }}
                        >
                        {plan.highlight && (
                            <div className="flex justify-center mb-2">
                                <div 
                                className="text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1"
                                style={{ backgroundColor: plan.color }}
                                >
                                <Star size={10} fill="currentColor" />
                                {plan.highlightText || 'Recomendado'}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">{plan.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{plan.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-gray-400 line-through block">R$ {oldPrice.toFixed(2).replace('.', ',')}</span>
                                <p className="text-xl font-bold leading-none" style={{ color: plan.color }}>
                                    R$ {price.toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 mb-4">
                            <ul className="space-y-2">
                                {plan.features.slice(0, 3).map((feature, idx) => {
                                    // Handle legacy strings safely
                                    const featureName = typeof feature === 'string' ? feature : feature.name;
                                    return (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <Check size={14} className="shrink-0" style={{ color: plan.highlight ? plan.color : '#22c55e' }} />
                                        <span className={plan.highlight ? 'font-medium' : ''}>{featureName}</span>
                                    </li>
                                    )
                                })}
                                {plan.features.length > 3 && (
                                    <li className="text-[10px] text-gray-400 italic pl-6">+ {plan.features.length - 3} outros benefícios...</li>
                                )}
                            </ul>
                        </div>

                        <button 
                            onClick={() => onSelectPlan(plan.id)}
                            className="w-full py-3 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                            style={{ 
                                backgroundColor: plan.highlight ? plan.color : 'transparent',
                                color: plan.highlight ? '#fff' : plan.color,
                                border: plan.highlight ? 'none' : `1px solid ${plan.color}`,
                            }}
                        >
                            {plan.highlight ? 'LIBERAR AGORA' : 'Selecionar Básico'}
                            <Shield size={14} />
                        </button>
                        </div>
                     )
                })}
              </div>
          </div>
          
          <div className="text-center pb-6">
               <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-2 px-4">
                   ← Voltar e fazer nova consulta
               </button>
          </div>
      </div>
    </div>
  );
};