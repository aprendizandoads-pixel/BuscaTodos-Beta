import React from 'react';
import { Check, X, Shield, Star } from 'lucide-react';
import { AppConfig, PlanDetails } from '../types';

interface PlanSelectionModalProps {
  onSelectPlan: (plan: 'basic' | 'complete') => void;
  onClose: () => void;
  config: AppConfig;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ onSelectPlan, onClose, config }) => {
  const { plans, style } = config;
  const plansList = [plans.basic, plans.complete];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6" style={{ fontSize: `${style.fontScale}rem` }}>
      <div 
        className="bg-gray-50 w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ borderRadius: style.borderRadius }}
      >
        
        <div 
          className="p-6 text-center relative overflow-hidden"
          style={{ backgroundColor: style.primaryColor }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield size={100} className="text-white transform rotate-12" />
          </div>
          <h2 className="text-2xl font-bold text-white relative z-10">Resultado Encontrado</h2>
          <p className="text-white/80 text-sm mt-1 relative z-10">Selecione o nível de detalhamento da sua consulta</p>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {plansList.map((plan: PlanDetails) => (
            <div 
              key={plan.id}
              className={`bg-white p-5 border-2 shadow-sm relative transition-all ${plan.highlight ? 'shadow-md transform scale-[1.02]' : 'hover:border-gray-200'}`}
              style={{ 
                borderRadius: style.borderRadius,
                borderColor: plan.highlight ? plan.color : 'transparent' 
              }}
            >
              {plan.highlight && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1"
                  style={{ backgroundColor: plan.color }}
                >
                  <Star size={10} fill="currentColor" />
                  {plan.highlightText || 'Destaque'}
                </div>
              )}

              <div className="flex justify-between items-start mb-4 mt-1">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 line-through">R$ {plan.oldPrice.toFixed(2).replace('.', ',')}</span>
                  <p className="text-2xl font-bold" style={{ color: plan.color }}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="shrink-0" style={{ color: plan.highlight ? plan.color : '#22c55e' }} />
                    <span className={plan.highlight ? 'font-medium text-gray-700' : ''}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => onSelectPlan(plan.id)}
                className="w-full py-3 font-bold transition-all shadow-lg active:scale-[0.98]"
                style={{ 
                  borderRadius: style.borderRadius,
                  backgroundColor: plan.highlight ? plan.color : 'transparent',
                  color: plan.highlight ? '#fff' : plan.color,
                  border: plan.highlight ? 'none' : `1px solid ${plan.color}`,
                  boxShadow: plan.highlight ? `0 10px 15px -3px ${plan.color}40` : 'none'
                }}
              >
                {plan.highlight ? 'GARANTIR ESTE PLANO' : 'Escolher Básico'}
              </button>
            </div>
          ))}

          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-400">
              Pagamento único. Acesso imediato após confirmação.
            </p>
            <div className="flex justify-center gap-2 mt-2 opacity-50">
               <div className="w-8 h-5 bg-gray-200 rounded"></div>
               <div className="w-8 h-5 bg-gray-200 rounded"></div>
               <div className="w-8 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};