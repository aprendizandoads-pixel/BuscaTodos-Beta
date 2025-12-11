import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, Server, Lock, Search, Car, Building, Smartphone } from 'lucide-react';
import { SearchType } from '../types';

interface LoadingOverlayProps {
  onComplete: () => void;
  type: SearchType;
}

const getSteps = (type: SearchType) => {
  const baseSteps = [
    { message: "Conectando ao servidor seguro...", icon: Server },
    { message: "Validando credenciais de acesso...", icon: Lock },
  ];

  if (type === 'CPF') {
    return [
      ...baseSteps,
      { message: "Buscando bases da Receita Federal...", icon: Database },
      { message: "Analisando Score de Crédito...", icon: ShieldCheck },
      { message: "Verificando restrições financeiras...", icon: Search },
    ];
  } else if (type === 'CNPJ') {
    return [
      ...baseSteps,
      { message: "Consultando Junta Comercial...", icon: Building },
      { message: "Verificando Dívida Ativa...", icon: Database },
      { message: "Analisando saúde financeira...", icon: ShieldCheck },
    ];
  } else if (type === 'PLACA') {
    return [
      ...baseSteps,
      { message: "Acessando base do DETRAN/DENATRAN...", icon: Car },
      { message: "Verificando multas e restrições...", icon: Database },
      { message: "Consultando histórico de roubo/furto...", icon: ShieldCheck },
    ];
  } else {
    // PHONE
    return [
       ...baseSteps,
       { message: "Localizando operadora de telefonia...", icon: Smartphone },
       { message: "Verificando titularidade da linha...", icon: Database },
       { message: "Buscando endereços vinculados...", icon: Search },
    ];
  }
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ onComplete, type }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const steps = getSteps(type);

  useEffect(() => {
    const totalDuration = 5000; // 5 seconds for robust feeling
    const stepDuration = totalDuration / steps.length;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, totalDuration + 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete, steps.length]);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-brand-900 z-[60] flex flex-col items-center justify-center p-6 text-white animate-fade-in">
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-brand-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <CurrentIcon size={64} className="text-brand-300 relative z-10 animate-bounce" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-center h-16 flex items-center justify-center">
          {steps[currentStep].message}
        </h3>
        
        <div className="w-full h-2 bg-brand-800 rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-brand-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between w-full mt-2 text-xs text-brand-400 font-mono">
           <span>Processando...</span>
           <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};