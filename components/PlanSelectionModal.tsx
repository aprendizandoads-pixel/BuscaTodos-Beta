import React, { useState } from 'react';
import { Check, X, Shield, Star, Info, Crown } from 'lucide-react';
import { AppConfig, PlanDetails, SearchType, PlanFeature } from '../types';

interface PlanSelectionModalProps {
  onSelectPlan: (plan: 'basic' | 'complete', customPrice?: number, selectedExtras?: PlanFeature[]) => void;
  onClose: () => void;
  config: AppConfig;
  searchType: SearchType;
}

// Dicionário de descrições detalhadas para os benefícios
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // CPF
  'Situação Cadastral (Receita)': 'Verifica se o CPF está Regular, Suspenso, Cancelado ou Nulo na Receita Federal.',
  'Processos Judiciais Básicos': 'Busca por processos públicos vinculados ao nome/CPF em tribunais estaduais.',
  'Vínculos e Benefícios Sociais': 'Identifica participação em programas sociais e vínculos empregatícios públicos.',
  'Score de Crédito Detalhado': 'Pontuação de 0 a 1000 que indica a probabilidade de inadimplência e histórico de pagador.',
  'Certidões Fiscais e Dívida Ativa': 'Verifica se há débitos inscritos na Dívida Ativa da União ou pendências fiscais.',
  'Antecedentes Criminais': 'Consulta nas bases da Polícia Federal e Secretarias de Segurança Pública.',
  'Protestos em Cartório': 'Localiza títulos protestados em cartórios de todo o Brasil por falta de pagamento.',
  
  // CNPJ
  'Cartão CNPJ': 'Emissão dos dados cadastrais oficiais da empresa na Receita Federal.',
  'Quadro Societário (QSA)': 'Lista os sócios, administradores e suas respectivas participações no capital.',
  'Dívidas Trabalhistas': 'Verifica a existência de débitos ou processos na Justiça do Trabalho.',
  'Histórico de Alterações': 'Mostra as mudanças de endereço, sócios ou atividades ao longo do tempo.',
  'Restrições Financeiras': 'Aponta restrições bancárias, cheques sem fundo e pendências financeiras.',
  
  // Placa
  'Dados do Veículo (BIN)': 'Características originais de fábrica (cor, modelo, ano, motor) da Base Índice Nacional.',
  'Situação IPVA': 'Verifica se o imposto obrigatório está em dia ou atrasado.',
  'Multas Estaduais': 'Busca infrações de trânsito registradas no DETRAN do estado de origem.',
  'Roubo e Furto': 'Informa se existe queixa de roubo ou furto ativa para o veículo nas bases policiais.',
  'Passagem por Leilão': 'Identifica se o veículo já foi ofertado em leilões, o que pode depreciar o valor.',
  'Sinistros': 'Verifica histórico de acidentes registrados por seguradoras (perda total ou parcial).',
  'Gravame': 'Aponta se o veículo está financiado ou possui restrição de venda.',
  
  // Phone
  'Operadora Atual': 'Identifica qual a operadora atual da linha (ex: Vivo, Claro, Tim).',
  'Estado da Linha': 'Verifica se a linha está ativa, cancelada ou suspensa.',
  'Tipo (Pré/Pós)': 'Informa se o plano é pré-pago, controle ou pós-pago.',
  'Titular da Linha': 'Revela o nome completo registrado como proprietário do chip.',
  'CPF Vinculado': 'Mostra o documento cadastrado na operadora para esta linha.',
  'Endereços de Cobrança': 'Lista possíveis endereços vinculados às faturas desta linha telefônica.'
};

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ onSelectPlan, onClose, config, searchType }) => {
  const { style } = config;
  
  // Select correct plan set based on search type
  let activePlans;
  switch (searchType) {
    case 'CNPJ':
        activePlans = config.plans.cnpj;
        break;
    case 'PLACA':
        activePlans = config.plans.plate;
        break;
    case 'PHONE':
        activePlans = config.plans.phone;
        break;
    default:
        activePlans = config.plans.cpf;
        break;
  }

  const plansList = [activePlans.basic, activePlans.complete];

  // Helper to map search type to display text
  const getTypeLabel = (t: SearchType) => {
    switch(t) {
        case 'CNPJ': return 'Empresarial';
        case 'PLACA': return 'Veicular';
        case 'PHONE': return 'Telefônica';
        default: return 'Pessoal';
    }
  };

  const getFeatureDescription = (featureName: string) => {
    return FEATURE_DESCRIPTIONS[featureName] || 'Detalhes adicionais sobre este item do relatório.';
  };

  // State to track selected optional features for each plan
  // Key: planId, Value: array of feature names
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const toggleOption = (planId: string, featureName: string) => {
      setSelectedOptions(prev => {
          const current = prev[planId] || [];
          if (current.includes(featureName)) {
              return { ...prev, [planId]: current.filter(f => f !== featureName) };
          } else {
              return { ...prev, [planId]: [...current, featureName] };
          }
      });
  };

  const calculateTotal = (plan: PlanDetails) => {
      // Robust check for price
      let total = plan.price || 0;
      const selected = selectedOptions[plan.id] || [];
      
      plan.features.forEach(feat => {
          // Robust check for legacy string features
          const price = typeof feat === 'string' ? 0 : (feat.price || 0);
          const name = typeof feat === 'string' ? feat : feat.name;

          if (price > 0 && selected.includes(name)) {
              total += price;
          }
      });
      return total;
  };

  const handleConfirm = (plan: PlanDetails) => {
      const selectedNames = selectedOptions[plan.id] || [];
      // Robust check for legacy string features
      const selectedFeatures = plan.features.filter(f => {
          const price = typeof f === 'string' ? 0 : (f.price || 0);
          const name = typeof f === 'string' ? f : f.name;
          return price > 0 && selectedNames.includes(name);
      }).map(f => {
          // Normalize to object if it was string
           if (typeof f === 'string') return { name: f, price: 0 };
           return f;
      });

      const finalPrice = calculateTotal(plan);
      
      // Passa o ID do plano ('basic' ou 'complete'), o preço calculado e os extras
      onSelectPlan(plan.id as 'basic' | 'complete', finalPrice, selectedFeatures);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 sm:p-4" style={{ fontSize: `${style.fontScale}rem` }}>
      <div 
        className="bg-gray-50 dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl animate-slide-up flex flex-col overflow-hidden transition-colors"
        style={{ borderRadius: window.innerWidth >= 640 ? '1.5rem' : '0' }}
      >
        
        {/* Header Area */}
        <div 
          className="p-6 text-center relative overflow-hidden shrink-0"
          style={{ backgroundColor: style.primaryColor }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield size={120} className="text-white transform rotate-12" />
          </div>
          <h2 className="text-2xl font-bold text-white relative z-10">Relatório {getTypeLabel(searchType)}</h2>
          <p className="text-white/80 text-sm mt-1 relative z-10">Selecione o nível de detalhamento da sua consulta</p>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-20"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plansList.map((plan: PlanDetails) => {
                const totalPrice = calculateTotal(plan);
                const oldPrice = plan.oldPrice || 0;
                const basePrice = plan.price || 0;
                
                const isHoveredClass = !plan.highlight ? 'hover:border-opacity-100' : '';

                return (
                <div 
                key={plan.id}
                className={`group/card bg-white dark:bg-slate-800 p-6 border-2 relative transition-all rounded-2xl flex flex-col ${plan.highlight ? 'z-10 transform md:scale-105' : 'border-gray-200 dark:border-slate-700'}`}
                style={{ 
                    borderRadius: '1rem',
                    borderColor: plan.highlight ? plan.color : undefined, // Highlight has fixed border color
                    // Non-highlights get border color on hover via inline style if needed, or class above
                    boxShadow: plan.highlight ? `0 0 20px -5px ${plan.color}40` : 'none'
                }}
                onMouseEnter={(e) => {
                    if (!plan.highlight) e.currentTarget.style.borderColor = plan.color;
                }}
                onMouseLeave={(e) => {
                    if (!plan.highlight) e.currentTarget.style.borderColor = '';
                }}
                >
                {plan.highlight && (
                    <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 z-20"
                    style={{ backgroundColor: plan.color }}
                    >
                    <Star size={10} fill="currentColor" />
                    {plan.highlightText || 'Destaque'}
                    </div>
                )}

                <div className="flex flex-col items-start mb-4 mt-2">
                    {/* Crown Icon above name for Highlighted plans */}
                    {plan.highlight && (
                        <div className="mb-2" style={{ color: plan.color }}>
                            <Crown size={28} strokeWidth={2.5} />
                        </div>
                    )}
                    
                    <h3 className={`font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight ${!plan.highlight ? 'mt-1' : ''}`}>
                        {plan.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                    <span className="text-xs text-gray-400 line-through">R$ {oldPrice.toFixed(2).replace('.', ',')}</span>
                    <p className="text-3xl font-bold" style={{ color: plan.color }}>
                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </p>
                    {totalPrice > basePrice && (
                        <p className="text-[10px] text-gray-500 font-medium animate-pulse mt-1">
                            (Inclui itens adicionais)
                        </p>
                    )}
                </div>
                
                <ul className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, idx) => {
                        // Robust check for legacy string features
                        const featureName = typeof feature === 'string' ? feature : feature.name;
                        const featurePrice = typeof feature === 'string' ? 0 : (feature.price || 0);

                        const isOptional = featurePrice > 0;
                        const isSelected = (selectedOptions[plan.id] || []).includes(featureName);

                        return (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 group">
                                {isOptional ? (
                                    <div 
                                      onClick={() => toggleOption(plan.id, featureName)}
                                      className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors mt-0.5 shrink-0 ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500'}`}
                                      style={{ backgroundColor: isSelected ? plan.color : undefined, borderColor: isSelected ? plan.color : undefined }}
                                    >
                                        {isSelected && <Check size={14} />}
                                    </div>
                                ) : (
                                    <Check size={16} className="shrink-0 mt-0.5" style={{ color: plan.highlight ? plan.color : '#22c55e' }} />
                                )}
                                
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className={`${plan.highlight || isSelected ? 'font-medium text-gray-700 dark:text-gray-200' : ''} ${isOptional ? 'cursor-pointer' : ''}`} onClick={() => isOptional && toggleOption(plan.id, featureName)}>
                                            {featureName}
                                        </span>
                                        {/* Tooltip Icon */}
                                        <div className="relative group/tooltip shrink-0">
                                            <Info 
                                                size={14} 
                                                className="text-gray-300 dark:text-gray-600 hover:text-brand-500 cursor-help transition-colors" 
                                            />
                                            {/* Tooltip Content */}
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 dark:bg-black text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                                {getFeatureDescription(featureName)}
                                                <div className="absolute -bottom-1 right-1 w-2 h-2 bg-gray-900 dark:bg-black rotate-45"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {isOptional && (
                                        <span className="text-[10px] text-gray-400 font-bold">+ R$ {featurePrice.toFixed(2)}</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <button 
                    onClick={() => handleConfirm(plan)}
                    className="w-full py-4 font-bold transition-all shadow-lg active:scale-[0.98] rounded-xl text-sm uppercase tracking-wide mt-auto relative overflow-hidden"
                    style={{ 
                    backgroundColor: plan.highlight ? plan.color : 'transparent',
                    color: plan.highlight ? '#fff' : plan.color,
                    border: plan.highlight ? 'none' : `1px solid ${plan.color}`,
                    boxShadow: plan.highlight ? `0 10px 15px -3px ${plan.color}40` : 'none'
                    }}
                >
                    {plan.highlight ? 'GARANTIR ESTE PLANO' : 'Escolher Básico'}
                </button>
                </div>
            )}}
          </div>

          <div className="text-center pt-8 pb-4">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">
              Ambiente Seguro • Pagamento Único • Sem Assinatura
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};