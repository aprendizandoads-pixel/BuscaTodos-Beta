
import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, User, Fingerprint, Lock, Copy, CheckCircle, Loader2, AlertTriangle, ExternalLink, QrCode, CreditCard, ChevronLeft, Shield, Star, HelpCircle, Clock, ShieldCheck, Check } from 'lucide-react';
import { maskCPF, maskPhone } from '../utils/masks';
import { AppConfig, PaymentData, SearchType } from '../types';
import { createPixPayment, createPreference, checkPaymentStatus } from '../services/mercadopago';
import { createEfiPix } from '../services/efipay';
import { initiateSocialLogin } from '../services/socialAuth';

interface RegistrationModalProps {
  plan: 'basic' | 'complete';
  searchType: SearchType;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onSuccess: (orderData: any) => void;
  onPaymentUpdate: (paymentId: string, status: 'approved' | 'rejected') => void;
  config: AppConfig;
  initialCpf?: string;
  initialData?: {
      name?: string;
      email?: string;
      phone?: string;
  };
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);

const FacebookIcon = () => (
   <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.54v1.212h4.157l-1.04 4.657h-3.116v7.98H9.101Z" />
   </svg>
);

// Componente de Timer Regressivo
const PaymentTimer = () => {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos em segundos

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-mono font-bold text-sm bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/50">
      <Clock size={14} className="animate-pulse" />
      <span>Expira em {formatTime(timeLeft)}</span>
    </div>
  );
};

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ plan, searchType, onClose, onSuccess, onPaymentUpdate, config, initialCpf, initialData }) => {
  // Determine correct plans
  let activePlans;
  switch (searchType) {
      case 'CNPJ': activePlans = config.plans.cnpj; break;
      case 'PLACA': activePlans = config.plans.plate; break;
      case 'PHONE': activePlans = config.plans.phone; break;
      default: activePlans = config.plans.cpf; break;
  }
  const selectedPlanDetails = plan === 'basic' ? activePlans.basic : activePlans.complete;
  
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    cpf: initialCpf || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    confirmEmail: initialData?.email || ''
  });

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [effectiveGateway, setEffectiveGateway] = useState<'mercadopago' | 'efi' | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine which gateway to use
  useEffect(() => {
     if (config.payment.mercadopagoEnabled && !config.payment.efiEnabled) {
         setEffectiveGateway('mercadopago');
     } else if (!config.payment.mercadopagoEnabled && config.payment.efiEnabled) {
         setEffectiveGateway('efi');
     } else if (config.payment.mercadopagoEnabled && config.payment.efiEnabled) {
         setEffectiveGateway(config.payment.activeGateway);
     } else {
         setEffectiveGateway(null);
     }
  }, [config.payment]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: maskCPF(e.target.value) });
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveGateway) {
        setError("Nenhum método de pagamento ativo no momento.");
        return;
    }

    setPaymentLoading(true);
    setError(null);

    // Fallback price to 0 if missing
    const price = selectedPlanDetails.price || 0;

    const orderPayload = {
        customerName: formData.name,
        customerCpf: formData.cpf,
        email: formData.email,
        plan: plan,
        amount: price,
        searchType: searchType
    };

    let isRedirecting = false;

    try {
      let result;
      
      if (effectiveGateway === 'mercadopago') {
          if (config.payment.mode === 'pro') {
             result = await createPreference(orderPayload, formData.email, config.payment);
          } else {
             result = await createPixPayment(orderPayload, formData.email, config.payment);
          }
      } else {
          result = await createEfiPix(orderPayload, config.efi, config.payment);
      }

      setPaymentData(result);
      
      onSuccess({
          customerName: formData.name,
          customerCpf: formData.cpf,
          email: formData.email,
          plan: plan,
          amount: price,
          status: 'pending',
          paymentId: result.id
      });
      
      // Auto-redirect logic for Checkout Pro
      if (effectiveGateway === 'mercadopago' && config.payment.mode === 'pro') {
          const redirectUrl = config.payment.activeGateway === 'mercadopago' && config.payment.sandbox 
              ? result.sandbox_init_point 
              : result.init_point;
          
          if (redirectUrl) {
              isRedirecting = true;
              window.location.href = redirectUrl;
              return; // Stop execution to keep loading state while browser navigates
          }
      }

      setStep('payment');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao gerar pagamento. Tente novamente.");
    } finally {
      // Only stop loading if we are NOT redirecting (to prevent UI flash)
      if (!isRedirecting) {
          setPaymentLoading(false);
      }
    }
  };

  const handleSocialClick = async (provider: 'google' | 'facebook' | 'apple') => {
       try {
           const user = await initiateSocialLogin(provider, config.social);
           setFormData(prev => ({
               ...prev,
               name: user.name,
               email: user.email,
               confirmEmail: user.email
           }));
       } catch (e: any) {
           setError(e.message);
       }
  };

  const renderPayment = () => {
    if (!paymentData) return null;

    // Checkout Pro (Redirect) - Fallback screen
    if (effectiveGateway === 'mercadopago' && config.payment.mode === 'pro') {
        return (
            <div className="text-center p-6 space-y-6 flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full inline-block mb-2">
                    <ExternalLink size={64} className="text-blue-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Finalizar no Mercado Pago</h3>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                        Se você não foi redirecionado automaticamente, clique no botão abaixo.
                    </p>
                </div>
                <a 
                  href={config.payment.activeGateway === 'mercadopago' && config.payment.mode === 'pro' && config.payment.sandbox ? paymentData.sandbox_init_point : paymentData.init_point}
                  target="_self"
                  className="block w-full max-w-sm bg-[#009EE3] text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 transition-all text-lg"
                >
                    Pagar no Mercado Pago
                </a>
                <button onClick={() => setStep('form')} className="text-gray-400 text-sm hover:text-gray-600 underline">
                    Voltar e corrigir dados
                </button>
            </div>
        );
    }

    // PIX Transparente UI (Fixed Layout)
    const qrCodeImage = paymentData.qr_code_base64 
        ? `data:image/png;base64,${paymentData.qr_code_base64}`
        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.qr_code || '')}`; // Fallback visual seguro

    return (
      <div className="flex flex-col h-full animate-fade-in">
         {/* Top Info */}
         <div className="text-center px-4 pt-2 pb-4 shrink-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col items-start">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Pagamento via PIX</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Liberação imediata</p>
                </div>
                <PaymentTimer />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-left flex gap-3 mb-2">
                 <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full h-fit">
                    <ShieldCheck size={18} className="text-blue-600 dark:text-blue-300" />
                 </div>
                 <div>
                     <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Ambiente Seguro</p>
                     <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                        Seus dados estão criptografados. Escaneie o QR Code abaixo no app do seu banco.
                     </p>
                 </div>
            </div>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-20">
             <div className="flex flex-col items-center gap-6">
                
                {/* QR Code Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md relative group w-full max-w-[280px] aspect-square flex items-center justify-center">
                    {paymentData.qr_code || paymentData.qr_code_base64 ? (
                        <img 
                            src={qrCodeImage}
                            alt="QR Code PIX" 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <QrCode size={48} className="mb-2 opacity-50" />
                            <span className="text-xs text-center px-2">Gerando QR Code...</span>
                        </div>
                    )}
                </div>

                {/* Copia e Cola Section */}
                <div className="w-full max-w-sm space-y-3">
                    <div className="relative">
                        <div className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                            Pix Copia e Cola
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 pt-4 flex items-center gap-2">
                            <input 
                                readOnly 
                                value={paymentData.qr_code} 
                                className="flex-1 bg-transparent text-xs text-gray-500 dark:text-gray-400 font-mono truncate outline-none select-all"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(paymentData.qr_code || '');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                            copied 
                            ? 'bg-green-500 text-white shadow-green-500/30' 
                            : 'bg-brand-600 text-white shadow-brand-500/30 hover:bg-brand-700'
                        }`}
                    >
                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                        {copied ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
                    </button>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-2 rounded-full animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    Aguardando confirmação automática do banco...
                </div>
             </div>
         </div>

         {/* Footer Trust Badges - Fixed Bottom */}
         <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-evenly items-center text-[10px] text-gray-400 dark:text-gray-500 z-10">
              <div className="flex flex-col items-center gap-1">
                  <Lock size={14} />
                  <span>SSL Seguro</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                  <Shield size={14} />
                  <span>Dados Protegidos</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Verificado</span>
              </div>
         </div>
      </div>
    );
  };

  const hasSocial = config.social.googleEnabled || config.social.facebookEnabled || config.social.appleEnabled;

  const currentPrice = selectedPlanDetails.price || 0;
  const oldPrice = selectedPlanDetails.oldPrice || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 sm:p-4 md:p-6" style={{ fontSize: `${config.style.fontScale}rem` }}>
      <div 
        className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-xl sm:rounded-3xl shadow-2xl animate-slide-up flex flex-col overflow-hidden transition-colors"
        style={{ borderRadius: window.innerWidth >= 640 ? '1.5rem' : '0' }}
      >
        
        {/* Header */}
        <div className="px-5 py-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0 z-20 relative shadow-sm">
           {step === 'payment' && effectiveGateway !== 'mercadopago' && ( // Only show back button if not Redirecting or already in Pix
               <button onClick={() => setStep('form')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                   <ChevronLeft size={24} />
               </button>
           )}
           <div>
               <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{step === 'form' ? 'Checkout Expresso' : 'Pagamento Seguro'}</h2>
           </div>
           <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Product Summary - Compact Top Bar (Hidden on Payment Step to save space if needed, currently kept for context) */}
        {step === 'form' && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 shrink-0">
             <div className="bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-600 rounded-xl p-3 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                         {plan === 'complete' ? <Star size={20} fill="currentColor" /> : <Shield size={20} />}
                     </div>
                     <div>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Produto</p>
                         <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{selectedPlanDetails.name}</p>
                     </div>
                 </div>
                 <div className="text-right">
                     <p className="text-[10px] text-gray-400 line-through">R$ {oldPrice.toFixed(2)}</p>
                     <p className="text-lg font-bold text-brand-600 dark:text-brand-400">R$ {currentPrice.toFixed(2)}</p>
                 </div>
             </div>
        </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden relative">
            {step === 'form' ? (
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-xs flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form id="checkout-form" onSubmit={handleCreatePayment} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Nome no cartão/comprovante"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">CPF (Nota Fiscal)</label>
                            <div className="relative group">
                                <Fingerprint className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                                <input 
                                    type="tel" 
                                    required
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={handleCpfChange}
                                    maxLength={14}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-1">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">E-mail (Receber Relatório)</label>
                                {/* Tooltip */}
                                <div className="relative group inline-block">
                                    <HelpCircle size={12} className="text-gray-400 cursor-help hover:text-brand-500" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 dark:bg-black text-white text-[10px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none text-center">
                                        Este campo é opcional caso você utilize o Login Social abaixo.
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-black rotate-45"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">WhatsApp (Opcional)</label>
                            <div className="relative group w-full">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" size={18} />
                                <input 
                                    type="tel" 
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={15}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                renderPayment()
            )}

            {/* Footer Actions (Only visible in Form Step) */}
            {step === 'form' && (
            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shrink-0 z-20">
                    <div className="w-full space-y-4">
                        <button 
                            form="checkout-form"
                            type="submit" 
                            disabled={paymentLoading}
                            className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg relative overflow-hidden group ${paymentLoading ? 'opacity-80' : ''}`}
                            style={{ 
                                backgroundColor: config.style.primaryColor,
                                boxShadow: `0 10px 20px -5px ${config.style.primaryColor}50`
                            }}
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>

                            {paymentLoading ? <Loader2 className="animate-spin" /> : (
                                config.payment.mode === 'pro' ? <ExternalLink size={20} /> : <QrCode size={20} />
                            )}
                            {paymentLoading ? 'Processando...' : (
                                config.payment.mode === 'pro' 
                                ? 'Pagar com Mercado Pago'
                                : `Gerar PIX de R$ ${currentPrice.toFixed(2).replace('.', ',')}`
                            )}
                        </button>

                        {/* Social Login Buttons - Simplified */}
                        {hasSocial && (
                            <div className="flex flex-col items-center gap-2 pt-1">
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Agilizar preenchimento com</div>
                                <div className="flex gap-4">
                                    {config.social.googleEnabled && (
                                        <button type="button" onClick={() => handleSocialClick('google')} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                            <GoogleIcon />
                                        </button>
                                    )}
                                    {config.social.facebookEnabled && (
                                        <button type="button" onClick={() => handleSocialClick('facebook')} className="w-10 h-10 rounded-full bg-[#1877F2] text-white shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                            <FacebookIcon />
                                        </button>
                                    )}
                                    {config.social.appleEnabled && (
                                        <button type="button" onClick={() => handleSocialClick('apple')} className="w-10 h-10 rounded-full bg-black dark:bg-white dark:text-black text-white shadow-sm flex items-center justify-center hover:scale-105 transition-transform">
                                            <AppleIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
            </div>
            )}
        </div>

      </div>
    </div>
  );
};
