import React, { useEffect, useState } from 'react';
import { UserData, GeminiAdvice } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  ChevronRight, 
  Bot,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultsDashboardProps {
  userData: UserData;
  onBack: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ userData, onBack }) => {
  const [advice, setAdvice] = useState<GeminiAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoadingAdvice(true);
      const result = await getFinancialAdvice(userData);
      setAdvice(result);
      setLoadingAdvice(false);
    };
    fetchAdvice();
  }, [userData]);

  const scoreColor = userData.score > 700 ? '#10b981' : userData.score > 400 ? '#f59e0b' : '#ef4444';
  const scoreData = [
    { name: 'Score', value: userData.score },
    { name: 'Remaining', value: 1000 - userData.score }
  ];

  return (
    <div className="pb-24 animate-slide-up">
      {/* Header Section */}
      <div className="bg-brand-900 pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-lg font-medium opacity-90">Olá, {userData.name}</h2>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/20">
              Atualizado hoje
            </div>
          </div>
          
          <div className="flex flex-col items-center">
             <div className="relative w-48 h-24 overflow-hidden mb-4">
               {/* Semi-circle Gauge implementation using Recharts */}
               <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={scoreColor} />
                    <Cell fill="#334155" /> 
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 text-center transform translate-y-2">
                 <span className="text-4xl font-bold text-white block">{userData.score}</span>
                 <span className="text-brand-200 text-sm">de 1000</span>
              </div>
             </div>
             
             <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
               userData.score > 700 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
               'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
             }`}>
               {userData.score > 700 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
               {userData.score > 700 ? 'Score Excelente' : 'Score Regular'}
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Card Stack */}
      <div className="px-4 -mt-8 relative z-20 space-y-4">
        
        {/* Gemini AI Advisor Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-3">
             <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bot className="text-purple-600 dark:text-purple-400" size={20} />
             </div>
             <h3 className="font-bold text-gray-800 dark:text-gray-200">Análise Inteligente</h3>
             {loadingAdvice && <RefreshCcw className="animate-spin text-gray-400 ml-auto" size={16} />}
          </div>
          
          {advice ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">{advice.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{advice.content}</p>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 mt-2">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 uppercase tracking-wide">Plano de Ação</p>
                <ul className="space-y-2">
                  {advice.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-24 bg-gray-100 dark:bg-slate-700 animate-pulse rounded-lg"></div>
          )}
        </div>

        {/* Debts Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FileText className="text-brand-500" size={20} />
              Pendências
            </h3>
            <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-md">
              {userData.debts.filter(d => d.status === 'Em Aberto').length} Ativas
            </span>
          </div>
          
          <div className="space-y-3">
            {userData.debts.map((debt) => (
              <div key={debt.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-slate-600">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{debt.company}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{debt.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">R$ {debt.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className={`text-[10px] uppercase font-bold ${
                    debt.status === 'Em Aberto' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
                  }`}>{debt.status}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 text-center text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
            Ver relatório completo
          </button>
        </div>

        {/* Credit Offers Upsell */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-5 shadow-lg text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Cartão Pré-Aprovado</h3>
              <p className="text-brand-100 text-sm mb-4">Baseado no seu score atual, você tem chance alta de aprovação.</p>
            </div>
            <CreditCard className="text-brand-200 opacity-50" size={48} />
          </div>
          <button className="bg-white text-brand-600 w-full py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-transform">
            Solicitar Agora
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-2 transition-colors">
            <TrendingUp className="text-green-500" size={24} />
            <span className="text-xs text-gray-500 dark:text-gray-400">Histórico</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Subiu 24 pts</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-2 transition-colors">
             <ShieldCheck className="text-brand-500" size={24} />
             <span className="text-xs text-gray-500 dark:text-gray-400">Dados</span>
             <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Protegidos</span>
          </div>
        </div>
      </div>
    </div>
  );
};