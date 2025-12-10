import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, User, Fingerprint, Lock, ArrowRight, Copy, CheckCircle, Loader2, CreditCard, QrCode, Calendar, AlertCircle } from 'lucide-react';
import { maskCPF, maskPhone } from '../utils/masks';
import { AppConfig, PaymentData } from '../types';
import { processPayment, checkPaymentStatus } from '../services/mercadopago';

interface RegistrationModalProps {
  plan: 'basic' | 'complete';
  onClose: () => void;
  onSubmit: (data: any) => void;
  onSuccess: (orderData: any) => void;
  onPaymentUpdate: (paymentId: string, status: 'approved' | 'rejected') => void;
  config: AppConfig;
  initialCpf?: string;
}

// Icons
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
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: initialCpf || ''
  });

  // Card Data State
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
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

  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardData({ ...cardData, number: val });
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.replace(/(\d{2})(\d)/, '$1/$2');
    setCardData({ ...cardData, expiry: val });
  };

  // VALIDATION HELPERS
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Checks if phone has at least 14 chars: (XX) XXXXX-XXXX (15) or (XX) XXXX-XXXX (14)
    return phone.replace(/\D/g, '').length >= 10;
  };

  const executePayment = async (userData: typeof formData) => {
    setErrorMessage('');
    
    // Validate Form Data
    if (!userData.name.trim()) {
      setErrorMessage('Por favor, digite seu nome completo.');
      return;
    }
    if (!isValidPhone(userData.phone)) {
      setErrorMessage('Por favor, digite um telefone válido com DDD.');
      return;
    }
    if (!isValidEmail(userData.email)) {
      setErrorMessage('Por favor, digite um e-mail válido.');
      return;
    }
    if (userData.cpf.length < 14) {
      setErrorMessage('CPF inválido.');
      return;
    }

    setIsGeneratingPix(true);
    
    let cardPayload = undefined;
    if (paymentMethod === 'credit_card') {
      const [expMonth, expYear] = cardData.expiry.split('/');
      if (!cardData.number || !cardData.holder || !expMonth || !expYear || !cardData.cvv) {
         setErrorMessage('Preencha todos os dados do cartão.');
         setIsGeneratingPix(false);
         return;
      }

      cardPayload = {
        cardNumber: cardData.number,
        cardholderName: cardData.holder,
        cardExpirationMonth: expMonth || '01',
        cardExpirationYear: expYear ? '20' + expYear : '2025',
        securityCode: cardData.cvv,
        identificationType: 'CPF',
        identificationNumber: userData.cpf
      };
    }

    // Call Unified Process Payment Service
    const result = await processPayment({
      orderData: {
        customerName: userData.name,
        customerCpf: userData.cpf,
        plan: plan,
        amount: currentPrice
      },
      email: userData.email,
      accessToken: payment.accessToken,
      publicKey: payment.publicKey,
      cardData: cardPayload
    });

    if (result) {
      if (result.status === 'approved') {
        // Card payments are often approved immediately
        setStep('success');
        onPaymentUpdate(result.id, 'approved');
      } else {
        setPaymentData(result);
        setStep('payment');
        
        onSuccess({
          customerName: userData.name,
          customerCpf: userData.cpf,
          plan: plan,
          amount: currentPrice,
          paymentId: result.id,
          status: result.status
        });
      }
    }
    setIsGeneratingPix(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executePayment(formData);
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    
    // Simulate API Network Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (provider === 'Facebook') {
       // Mock Existing User -> Direct to Payment
       const existingUser = {
         name: 'Usuário Facebook',
         email: 'usuario.facebook@exemplo.com',
         phone: '(11) 99999-9999',
         cpf: initialCpf || '123.456.789-00'
       };
       setFormData(existingUser);
       await executePayment(existingUser);

    } else {
       // Mock New User -> Fill Form
       const newUser = {
         name: provider === 'Google' ? 'Usuário Google' : 'Usuário Apple',
         email: provider === 'Google' ? 'novo.google@gmail.com' : 'novo.apple@icloud.com',
       };
       
       setFormData(prev => ({
         ...prev,
         name: newUser.name,
         email: newUser.email
       }));

       setToastMessage(`Dados importados do ${provider}. Confirme o CPF.`);
       setTimeout(() => setToastMessage(''), 4000);
    }

    setSocialLoading(null);
  };

  // Poll for payment status if pending
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    // Only poll if we are in payment step, have an ID, and it's NOT approved yet
    if (step === 'payment' && paymentData?.id && paymentData.status !== 'approved') {
      interval = setInterval(async () => {
        const status = await checkPaymentStatus(paymentData.id, payment.accessToken);
        if (status === 'approved') {
           setStep('success');
           onPaymentUpdate(paymentData.id, 'approved');
           clearInterval(interval);
        } else if (String(paymentData.id).startsWith('mock_')) {
           // Auto-approve Mock PIX after 10 seconds for demo purposes
           // Remove this block in real production if you have backend callbacks
           setTimeout(() => {
             setStep('success');
             onPaymentUpdate(paymentData.id, 'approved');
           }, 10000);
        }
      }, 5000);
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
           {toastMessage && (
             <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold mb-4 animate-fade-in flex items-center gap-2">
               <CheckCircle size={14} />
               {toastMessage}
             </div>
           )}

           {errorMessage && (
             <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-xs font-bold mb-4 animate-fade-in flex items-center gap-2">
               <AlertCircle size={14} />
               {errorMessage}
             </div>
           )}

           <form onSubmit={handleFormSubmit} className="space-y-4">
             <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="text" placeholder="Nome Completo" 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="tel" placeholder="(00) 00000-0000" 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-800"
                      value={formData.phone} onChange={handlePhoneChange}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Fingerprint className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="text" placeholder="CPF" 
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800 ${initialCpf ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      value={formData.cpf} onChange={handleCpfChange} maxLength={14} readOnly={!!initialCpf}
                    />
                    {initialCpf && <Lock size={14} className="absolute right-3 top-4 text-gray-400" />}
                  </div>
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="email" placeholder="seu@email.com" 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-800"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
             </div>

             {/* Payment Method Selector */}
             <div className="border-t border-gray-100 my-4 pt-4">
                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Método de Pagamento</label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 py-3 px-2 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500'}`}
                  >
                    <QrCode size={20} />
                    <span className="font-bold text-sm">PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex-1 py-3 px-2 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? `border-[${config.style.primaryColor}] bg-blue-50 text-blue-700` : 'border-gray-100 bg-white text-gray-500'}`}
                    style={paymentMethod === 'credit_card' ? { borderColor: config.style.primaryColor, color: config.style.primaryColor, backgroundColor: `${config.style.primaryColor}10` } : {}}
                  >
                    <CreditCard size={20} />
                    <span className="font-bold text-sm">Cartão</span>
                  </button>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200 animate-fade-in">
                    <input 
                      type="text" placeholder="Número do Cartão" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                      value={cardData.number} onChange={handleCardNumber} maxLength={19} required
                    />
                    <input 
                      type="text" placeholder="Nome Impresso no Cartão" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 uppercase"
                      value={cardData.holder} onChange={e => setCardData({...cardData, holder: e.target.value})} required
                    />
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                         <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
                         <input 
                           type="text" placeholder="MM/AA" 
                           className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                           value={cardData.expiry} onChange={handleExpiry} maxLength={5} required
                         />
                      </div>
                      <div className="w-1/3 relative">
                         <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                         <input 
                           type="text" placeholder="CVV" 
                           className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                           value={cardData.cvv} onChange={e => setCardData({...cardData, cvv: e.target.value})} maxLength={4} required
                         />
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <button 
               type="submit" 
               disabled={isGeneratingPix || socialLoading !== null}
               className="w-full text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center px-6 group disabled:opacity-70 disabled:cursor-wait"
               style={{ backgroundColor: config.style.primaryColor }}
             >
               {isGeneratingPix ? (
                  <span className="flex items-center gap-2 mx-auto">
                    <Loader2 className="animate-spin" /> Processando...
                  </span>
               ) : (
                 <>
                   <span className="group-hover:translate-x-1 transition-transform flex items-center gap-2 mr-auto">
                     Pagar {priceDisplay}
                     <ArrowRight size={18} />
                   </span>
                 </>
               )}
             </button>
           </form>

           {hasSocial && (
             <div className="mt-6">
               <div className="relative flex py-2 items-center mb-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-[10px] uppercase font-bold tracking-wider">Ou</span>
                <div className="flex-grow border-t border-gray-200"></div>
               </div>

               <div className="flex justify-center gap-3">
                 {social.googleEnabled && (
                   <button 
                    type="button" 
                    onClick={() => handleSocialLogin('Google')}
                    disabled={socialLoading !== null}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 group"
                    title="Entrar com Google"
                   >
                     {socialLoading === 'Google' ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <GoogleIcon />}
                   </button>
                 )}
                 
                 {social.facebookEnabled && (
                   <button 
                    type="button" 
                    onClick={() => handleSocialLogin('Facebook')}
                    disabled={socialLoading !== null}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-200 transition-all shadow-sm disabled:opacity-50 text-[#1877F2]"
                    title="Entrar com Facebook"
                   >
                     {socialLoading === 'Facebook' ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <FacebookIcon />}
                   </button>
                 )}

                 {social.appleEnabled && (
                   <button 
                    type="button" 
                    onClick={() => handleSocialLogin('Apple')}
                    disabled={socialLoading !== null}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 text-black"
                    title="Entrar com Apple"
                   >
                     {socialLoading === 'Apple' ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <AppleIcon />}
                   </button>
                 )}
               </div>
             </div>
           )}

           <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
             <Lock size={12} />
             <p>Seus dados estão protegidos e seguros.</p>
           </div>
      </>
    );
  };

  // Render Step 2: Payment
  const renderPayment = () => {
    if (paymentMethod === 'credit_card') {
        return (
            <div className="flex flex-col items-center pt-8 animate-fade-in text-center">
                <div className="bg-yellow-100 p-4 rounded-full mb-4">
                    <Loader2 size={40} className="text-yellow-600 animate-spin" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Processando Pagamento...</h3>
                <p className="text-sm text-gray-500">Estamos confirmando a transação com seu banco.</p>
            </div>
        )
    }

    return (
      <div className="flex flex-col items-center pt-2 animate-fade-in">
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium mb-6 flex items-center gap-2">
          <CheckCircle size={16} />
          Gerado com sucesso! Pague para liberar.
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
            <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg overflow-hidden">
               {paymentData?.qr_code ? (
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentData.qr_code)}`} 
                   alt="PIX QR" 
                   className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className="text-center p-4 text-gray-400 text-xs">QR Indisponível<br/>Use Copia e Cola</div>
               )}
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Pix Copia e Cola</label>
            <div className="flex gap-2">
              <input 
                type="text" readOnly value={paymentData?.qr_code || ''}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate focus:outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className={`p-2 rounded-lg border transition-all ${copied ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
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
    <div className="flex flex-col items-center justify-center py-10 animate-slide-up text-center">
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col h-[calc(100vh-20px)]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-none">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {step === 'form' ? 'Liberar Consulta' : step === 'success' ? 'Tudo Pronto!' : 'Pagamento'}
            </h2>
            <p className="text-sm text-gray-500">
              {step === 'form' ? 'Escolha como deseja pagar' : step === 'success' ? 'Obrigado por confiar em nossos serviços' : 'Ambiente seguro Mercado Pago'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-200 border border-gray-200 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
           {step === 'form' && renderForm()}
           {step === 'payment' && renderPayment()}
           {step === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};