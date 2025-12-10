import React from 'react';
import { 
  User, Calendar, Users, Fingerprint, Share2, 
  TrendingUp, Wallet, Phone, MapPin, Briefcase, 
  Building2, Mail, Skull, Activity, Scale, CheckCircle2, 
  Lock, AlertCircle, Eye, Shield
} from 'lucide-react';
import { AppConfig, PlanDetails } from '../types';

interface ResultsPreviewProps {
  onSelectPlan: (plan: 'basic' | 'complete') => void;
  config: AppConfig;
  searchType: string;
  inputValue: string;
}

export const ResultsPreview: React.FC<ResultsPreviewProps> = ({ onSelectPlan, config, searchType, inputValue }) => {
  const { plans, style } = config;

  // Render a "Hidden" data field row
  const DataRow = ({ icon: Icon, label, value, isVerified = true, isBlur = false }: any) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {isBlur ? (
              <span className="text-gray-400 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock size={10} />
                Disponível no relatório
              </span>
            ) : (
              <span className="text-gray-800 font-bold text-sm tracking-widest">{value}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        {isVerified && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle2 size={10} />
            Verificado
          </div>
        )}
      </div>
    </div>
  );

  const PlanCard = ({ plan }: { plan: PlanDetails }) => (
    <div 
      className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${plan.highlight ? 'border-brand-500 shadow-xl scale-[1.02] z-10' : 'border-gray-100 shadow-sm'}`}
    >
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
          {plan.highlightText || 'Recomendado'}
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <span className="text-sm text-gray-400 line-through mr-2">R$ {plan.oldPrice.toFixed(2).replace('.', ',')}</span>
        <span className="text-3xl font-black text-brand-600">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
      </div>

      <ul className="space-y-3 mb-8 text-left">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} />
            <span className="leading-tight">{feature.replace(/\*\*/g, '')}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(plan.id)}
        className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95 ${
          plan.highlight 
            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30' 
            : 'bg-white text-brand-600 border border-brand-200 hover:bg-gray-50'
        }`}
      >
        LIBERAR AGORA
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="bg-white pt-8 pb-20 px-6 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-green-100">
            <Shield size={14} />
            Relatório Localizado
          </div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-2">
            Relatório Completo de<br/>Dados Pessoais
          </h1>
          <p className="text-gray-500 text-sm">
            Acesse informações detalhadas e verificadas sobre o {searchType} <strong>{inputValue}</strong>
          </p>
        </div>
      </div>

      {/* Main List */}
      <div className="px-4 -mt-12 relative z-20">
        
        {/* Verification Banner */}
        <div className="bg-brand-700 rounded-t-2xl p-4 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Visualização Limitada</h3>
              <p className="text-[10px] text-brand-100">Prévia dos dados encontrados</p>
            </div>
          </div>
          <span className="bg-white text-brand-700 text-[10px] font-bold px-2 py-1 rounded">
            Parcial
          </span>
        </div>

        {/* Data List Card */}
        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden mb-8">
          <DataRow icon={User} label="Nome Completo" value="ALEXANDRE MA***** ****" isVerified={true} />
          <DataRow icon={Calendar} label="Data de Nascimento" value="12/**/****" isBlur={true} />
          <DataRow icon={Users} label="Nome da Mãe" value="MARIA AP******* ****" isBlur={true} />
          <DataRow icon={Fingerprint} label="Situação na Receita" value="Regular" isVerified={true} />
          <DataRow icon={TrendingUp} label="Score de Crédito" value="***" isBlur={true} />
          <DataRow icon={Wallet} label="Renda Estimada" value="R$ *.***,00" isBlur={true} />
          <DataRow icon={Phone} label="Celulares Vinculados" value="(11) 9****-****" isBlur={true} />
          <DataRow icon={MapPin} label="Endereços" value="3 Endereços" isBlur={true} />
          <DataRow icon={Briefcase} label="Histórico Profissional" value="2 Empresas" isBlur={true} />
          <DataRow icon={Building2} label="Participação em Empresas" value="Nenhuma" isVerified={true} />
          <DataRow icon={Mail} label="E-mails" value="al******@gm***.com" isBlur={true} />
          <DataRow icon={Skull} label="Provável Óbito" value="Não consta" isVerified={true} />
          <DataRow icon={Users} label="Parentes e Vínculos" value="Disponível" isBlur={true} />
          <DataRow icon={Scale} label="Processos Judiciais" value="Verificar" isBlur={true} />
        </div>

        {/* Plans Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Libere o acesso completo</h2>
          <p className="text-sm text-gray-500">Escolha um plano para visualizar todos os dados acima sem censura.</p>
        </div>

        {/* Plans Section */}
        <div className="space-y-4 mb-8">
          <PlanCard plan={config.plans.complete} />
          <PlanCard plan={config.plans.basic} />
        </div>

        {/* Footer Info */}
        <div className="text-center pb-8 opacity-60">
          <div className="flex justify-center gap-4 mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Secure" className="h-4 grayscale opacity-50" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Secure" className="h-4 grayscale opacity-50" />
          </div>
          <p className="text-[10px] text-gray-500">
            Ambiente seguro e criptografado. Seus dados não são armazenados.
          </p>
        </div>

      </div>
    </div>
  );
};
