import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, User, Fingerprint, Lock, ArrowRight, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { maskCPF, maskPhone } from '../utils/masks';
import { AppConfig, PaymentData } from '../types';
import { createPixPayment, checkPaymentStatus } from '../services/mercadopago';

interface RegistrationModalProps {
  plan: 'basic' | 'complete';
  onClose: () => void;
  onSubmit: (data: any) => void;
  onSuccess: (orderData: any) => void;
  onPaymentUpdate: (paymentId: string, status: 'approved' | 'rejected') => void;
  config: AppConfig;
  initialCpf?: string;
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

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ plan, onClose, onSubmit, config, onSuccess, onPaymentUpdate, initialCpf }) => {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: initialCpf || ''
  });

  const { plans, social, payment } = config;
  const currentPrice = plan === 'basic' ? plans.basic.price : plans.complete.price;
  const priceDisplay = `R$ ${currentPrice.toFixed(2).replace('.', ',')}`;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cpf: maskCPF(e.target.value) });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPix(true);
    
    // Call Service to generate PIX
    const result = await createPixPayment({
      customerName: formData.name,
      customerCpf: formData.cpf,
      plan: plan,
      amount: currentPrice
    }, formData.email, payment.accessToken);

    if (result) {
      setPaymentData(result);
      setStep('payment');
      
      // Notify App to create Order Record
      onSuccess({
        customerName: formData.name,
        customerCpf: formData.cpf,
        plan: plan,
        amount: currentPrice,
        paymentId: result.id,
        status: 'pending'
      });
    }
    setIsGeneratingPix(false);
  };

  // Poll for payment status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'payment' && paymentData?.id) {
      interval = setInterval(async () => {
        const status = await checkPaymentStatus(paymentData.id, payment.accessToken);
        if (status === 'approved') {
           setStep('success');
           onPaymentUpdate(paymentData.id, 'approved');
           clearInterval(interval);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [step, paymentData, payment.accessToken, onPaymentUpdate]);

  const copyToClipboard = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render Step 1: Form
  const renderForm = () => {
    const hasSocial = social.googleEnabled || social.facebookEnabled || social.appleEnabled;
    
    return (
      <>
        {/* Social Login */}
        {hasSocial && (
             <div className="space-y-3 mb-6">
               {social.googleEnabled && (
                 <button type="button" className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors bg-white shadow-sm relative overflow-hidden group">
                   <GoogleIcon />
                   <span className="relative z-10">Continuar com Google</span>
                 </button>
               )}
               
               {social.facebookEnabled && (
                 <button type="button" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] text-white rounded-xl font-bold hover:bg-[#166fe5] transition-colors shadow-sm shadow-blue-500/30">
                   <FacebookIcon />
                   <span>Continuar com Facebook</span>
                 </button>
               )}

               {social.appleEnabled && (
                 <button type="button" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm">
                   <AppleIcon />
                   <span>Continuar com Apple</span>
                 </button>
               )}
             </div>
           )}

           {hasSocial && (
             <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold tracking-wider">Ou preencha</span>
              <div className="flex-grow border-t border-gray-200"></div>
             </div>
           )}

           <form onSubmit={handleFormSubmit} className="space-y-4">
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 uppercase ml-1">Nome Completo</label>
               <div className="relative">
                 <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="Digite seu nome"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
             </div>
             
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 uppercase ml-1">WhatsApp / Telefone</label>
               <div className="relative">
                 <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                 <input 
                   type="tel" 
                   placeholder="(00) 00000-0000"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
                   required
                   value={formData.phone}
                   onChange={handlePhoneChange}
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 uppercase ml-1">E-mail</label>
               <div className="relative">
                 <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                 <input 
                   type="email" 
                   placeholder="seu@email.com"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
                   required
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 uppercase ml-1">CPF</label>
               <div className="relative">
                 <Fingerprint className="absolute left-4 top-3.5 text-gray-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="000.000.000-00"
                   className={`w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800 ${initialCpf ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                   required
                   value={formData.cpf}
                   onChange={handleCpfChange}
                   maxLength={14}
                   readOnly={!!initialCpf}
                 />
                 {initialCpf && <Lock size={16} className="absolute right-4 top-4 text-gray-400" />}
               </div>
             </div>

             <button 
               type="submit" 
               disabled={isGeneratingPix}
               className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all active:scale-[0.98] mt-6 flex justify-between items-center px-6 group disabled:opacity-70 disabled:cursor-wait"
               style={{ backgroundColor: config.style.primaryColor }}
             >
               {isGeneratingPix ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <Loader2 className="animate-spin" /> Gerando PIX...
                  </span>
               ) : (
                 <>
                   <span className="group-hover:translate-x-1 transition-transform flex items-center gap-2">
                     Ir para Pagamento <ArrowRight size={18} />
                   </span>
                   <span className="bg-white/20 px-2 py-1 rounded text-sm font-semibold">
                     {priceDisplay}
                   </span>
                 </>
               )}
             </button>

             <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
               <Lock size={12} />
               <p>Seus dados estão protegidos e seguros.</p>
             </div>
           </form>
      </>
    );
  };

  // Render Step 2: Payment
  const renderPayment = () => {
    return (
      <div className="flex flex-col items-center pt-2 animate-fade-in">
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium mb-6 flex items-center gap-2">
          <CheckCircle size={16} />
          Cadastro recebido! Pague para liberar.
        </div>
        
        <p className="text-sm text-gray-500 mb-2">Escaneie o QR Code abaixo:</p>
        <div className="bg-white p-2 rounded-xl border-2 border-gray-100 shadow-inner mb-6">
          {paymentData?.qr_code_base64 ? (
             <img 
               src={`data:image/png;base64,${paymentData.qr_code_base64}`} 
               alt="PIX QR Code" 
               className="w-48 h-48 object-contain"
             />
          ) : (
            <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white rounded-lg">
               <span className="text-xs text-center px-2">QR Code Simulation<br/>(Use Copia e Cola)</span>
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Pix Copia e Cola</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                value={paymentData?.qr_code || ''}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate focus:outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className={`p-2 rounded-lg border transition-all ${
                  copied 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
           <div className="flex items-center justify-center gap-2 text-brand-600 animate-pulse">
             <Loader2 size={16} className="animate-spin" />
             <span className="text-sm font-bold">Aguardando confirmação...</span>
           </div>
           <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
             A liberação ocorre automaticamente em alguns segundos após o pagamento.
           </p>
        </div>
      </div>
    );
  };

  // Render Step 3: Success
  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-10 animate-slide-up">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h3>
      <p className="text-gray-500 text-center max-w-xs mb-8">
        Seu relatório completo foi gerado e enviado para o seu e-mail: <strong>{formData.email}</strong>
      </p>
      <button 
        onClick={onClose}
        className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all"
      >
        Acessar Área do Cliente
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-brand-900/80 backdrop-blur-sm animate-fade-in p-0 sm:p-6">
      <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {step === 'form' ? 'Finalizar Acesso' : step === 'payment' ? 'Pagamento via PIX' : 'Tudo Pronto!'}
            </h2>
            <p className="text-sm text-gray-500">
              {step === 'form' ? 'Crie sua conta para ver o relatório' : step === 'payment' ? 'Pague com segurança pelo Mercado Pago' : 'Obrigado por confiar em nossos serviços'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-200 border border-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
           {step === 'form' && renderForm()}
           {step === 'payment' && renderPayment()}
           {step === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};