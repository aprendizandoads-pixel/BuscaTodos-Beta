
import React, { useState } from 'react';
import { X, Mail, Phone, User, Lock, ArrowRight, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';
import { maskPhone } from '../utils/masks';
import { AppConfig, SearchType, Lead } from '../types';
import { initiateSocialLogin } from '../services/socialAuth';

interface LeadCaptureModalProps {
  onClose: () => void;
  onSubmit: (leadData: Omit<Lead, 'id' | 'date' | 'origin' | 'deviceInfo'>) => void;
  config: AppConfig;
  searchType: SearchType;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
  </svg>
);

const FacebookIcon = () => (
   <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.54v1.212h4.157l-1.04 4.657h-3.116v7.98H9.101Z" />
   </svg>
);

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ onClose, onSubmit, config, searchType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { social, style } = config;
  const hasSocial = social.googleEnabled || social.facebookEnabled || social.appleEnabled;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: maskPhone(e.target.value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        searchTypeOfInterest: searchType
    });
  };

  const handleSocialClick = async (provider: 'google' | 'facebook' | 'apple') => {
      setSocialLoading(provider);
      setError(null);
      try {
          const user = await initiateSocialLogin(provider, social);
          // Auto-submit with social data
          onSubmit({
              name: user.name,
              email: user.email,
              phone: '', // Phone is usually not provided by social login by default, user might need to fill later or we skip
              searchTypeOfInterest: searchType
          });
      } catch (e: any) {
          setError(e.message);
      } finally {
          setSocialLoading(null);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 sm:p-4">
      <div 
        className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-3xl shadow-2xl animate-slide-up flex flex-col overflow-hidden transition-colors relative"
        style={{ borderRadius: window.innerWidth >= 640 ? '1.5rem' : '0' }}
      >
        
        {/* Header */}
        <div className="p-6 bg-brand-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 relative shrink-0">
           <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
             Dados de Contato
           </h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 pr-8">
             Informe seus dados para acessar a consulta detalhada de <strong>{searchType}</strong>.
           </p>
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-900 rounded-full shadow-sm"
           >
             <X size={20} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar grow">
           {error && (
             <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-sm flex items-center gap-3">
                 <AlertTriangle size={20} />
                 {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5">
             
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase ml-1">Nome Completo</label>
               <div className="relative group">
                 <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="Digite seu nome"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-medium text-gray-900 dark:text-white text-base"
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
             </div>
             
             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase ml-1">WhatsApp / Celular</label>
               <div className="relative group w-full">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" size={20} />
                 <input 
                   type="tel" 
                   inputMode="numeric"
                   placeholder="(00) 00000-0000"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-medium text-gray-900 dark:text-white text-base"
                   required
                   value={formData.phone}
                   onChange={handlePhoneChange}
                 />
               </div>
             </div>

             <div className="space-y-1">
               <div className="flex items-center gap-1">
                   <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase ml-1">E-mail</label>
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
                 <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                 <input 
                   type="email" 
                   placeholder="seu@email.com"
                   className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all font-medium text-gray-900 dark:text-white text-base"
                   required
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                 />
               </div>
             </div>

             <button 
               type="submit" 
               className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 transition-all active:scale-[0.98] mt-4 flex justify-center items-center gap-3 px-6 text-lg"
               style={{ 
                   backgroundColor: style.primaryColor,
                   boxShadow: `0 10px 15px -3px ${style.primaryColor}40`
               }}
             >
               CONTINUAR CONSULTA <ArrowRight size={20} />
             </button>

             <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
               <Lock size={12} />
               <p>Seus dados estão seguros e não serão compartilhados.</p>
             </div>
           </form>

           {/* Social Login */}
           {hasSocial && (
             <>
               <div className="relative flex py-2 items-center mt-6">
                 <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                 <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Ou preencha com</span>
                 <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
               </div>

               <div className="flex items-center justify-center gap-4 mt-2 pb-6">
                  {social.googleEnabled && (
                    <button 
                        type="button" 
                        onClick={() => handleSocialClick('google')} 
                        disabled={!!socialLoading}
                        className="w-14 h-14 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all active:scale-95 relative"
                        title="Usar dados do Google"
                    >
                       {socialLoading === 'google' ? <Loader2 className="animate-spin text-gray-500" size={24} /> : <GoogleIcon />}
                    </button>
                  )}
                  
                  {social.facebookEnabled && (
                    <button 
                        type="button" 
                        onClick={() => handleSocialClick('facebook')} 
                        disabled={!!socialLoading}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:bg-[#166fe5] hover:shadow-lg transition-all active:scale-95 shadow-blue-500/30 relative" 
                        title="Usar dados do Facebook"
                    >
                       {socialLoading === 'facebook' ? <Loader2 className="animate-spin text-white" size={24} /> : <FacebookIcon />}
                    </button>
                  )}

                  {social.appleEnabled && (
                     <button 
                        type="button" 
                        onClick={() => handleSocialClick('apple')} 
                        disabled={!!socialLoading}
                        className="w-14 h-14 flex items-center justify-center rounded-full bg-black dark:bg-white dark:text-black text-white hover:bg-gray-900 dark:hover:bg-gray-100 hover:shadow-lg transition-all active:scale-95 shadow-gray-500/30 relative" 
                        title="Usar dados da Apple"
                     >
                        {socialLoading === 'apple' ? <Loader2 className="animate-spin" size={24} /> : <AppleIcon />}
                     </button>
                  )}
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};
