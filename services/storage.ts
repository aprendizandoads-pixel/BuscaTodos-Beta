

import { AppConfig, PlanSet, PlanDetails } from "../types";
import { addLog } from "../utils/logger";

const STORAGE_KEY = 'app_config_db_v1';

// Configuração Padrão (Fallback) caso o banco esteja vazio
const DEFAULT_CONFIG: AppConfig = {
    plans: {
        cpf: {
            basic: {
                id: 'basic', active: true, name: 'Regularidade CPF', description: 'Ideal para verificações rápidas',
                price: 29.90, oldPrice: 49.90, highlight: false, color: '#2563eb',
                features: [
                    { name: 'Situação Cadastral (Receita)', price: 0 },
                    { name: 'Processos Judiciais Básicos', price: 0 },
                    { name: 'Monitoramento 24h (SMS)', price: 14.90 }
                ]
            },
            complete: {
                id: 'complete', active: true, name: 'Consulta Completa CPF', description: 'Análise total de riscos',
                price: 34.90, oldPrice: 69.90, highlight: true, highlightText: 'Mais Vendido', color: '#059669',
                features: [
                    { name: 'Tudo do Plano Básico', price: 0 },
                    { name: 'Score de Crédito Detalhado', price: 0 },
                    { name: 'Certidões Negativas', price: 0 },
                    { name: 'Radar de Vazamento de Dados', price: 9.90 }
                ]
            }
        },
        cnpj: {
            basic: {
                id: 'basic', active: true, name: 'Regularidade CNPJ', description: 'Verificação empresarial simples',
                price: 39.90, oldPrice: 59.90, highlight: false, color: '#2563eb',
                features: [{ name: 'Cartão CNPJ', price: 0 }, { name: 'Quadro Societário', price: 0 }]
            },
            complete: {
                id: 'complete', active: true, name: 'Dossiê Empresarial', description: 'Análise profunda da empresa',
                price: 59.90, oldPrice: 89.90, highlight: true, highlightText: 'Recomendado', color: '#059669',
                features: [{ name: 'Tudo do Básico', price: 0 }, { name: 'Dívidas Trabalhistas', price: 0 }, { name: 'Relatório Financeiro', price: 29.90 }]
            }
        },
        plate: {
            basic: {
                id: 'basic', active: true, name: 'Consulta Placa', description: 'Dados básicos do veículo',
                price: 29.90, oldPrice: 45.00, highlight: false, color: '#2563eb',
                features: [{ name: 'Dados do Veículo (BIN)', price: 0 }, { name: 'Situação IPVA', price: 0 }]
            },
            complete: {
                id: 'complete', active: true, name: 'Veículo Completo', description: 'Histórico total do carro',
                price: 49.90, oldPrice: 79.90, highlight: true, highlightText: 'Essencial', color: '#059669',
                features: [{ name: 'Tudo do Básico', price: 0 }, { name: 'Roubo e Furto', price: 0 }, { name: 'Sinistros', price: 0 }]
            }
        },
        phone: {
            basic: {
                id: 'basic', active: true, name: 'Busca Telefônica', description: 'Dados da linha',
                price: 19.90, oldPrice: 29.90, highlight: false, color: '#2563eb',
                features: [{ name: 'Operadora Atual', price: 0 }, { name: 'Estado da Linha', price: 0 }]
            },
            complete: {
                id: 'complete', active: true, name: 'Investigação Tel', description: 'Localize o titular',
                price: 39.90, oldPrice: 59.90, highlight: true, highlightText: 'Exclusivo', color: '#059669',
                features: [{ name: 'Titular da Linha', price: 0 }, { name: 'Endereços Vinculados', price: 0 }]
            }
        }
    },
    style: {
        borderRadius: '1rem',
        fontScale: 1,
        primaryColor: '#0284c7'
    },
    social: {
        googleEnabled: true, googleClientId: '',
        facebookEnabled: true, facebookAppId: '',
        appleEnabled: true, appleServiceId: ''
    },
    payment: {
        activeGateway: 'mercadopago',
        mercadopagoEnabled: true,
        efiEnabled: false,
        sandbox: true, // Default to sandbox for safety
        accessToken: '',
        publicKey: '',
        applicationId: '',
        userId: '',
        webhookUrl: '',
        mode: 'transparent',
        installmentsEnabled: true,
        maxInstallments: 12,
        statementDescriptor: 'CONSULTA NAC',
        expirationMinutes: 30,
        autoReturn: 'approved',
        binaryMode: false
    },
    efi: {
        clientId: '',
        clientSecret: '',
        certificatePem: '',
        pixKey: '',
        sandbox: true
    },
    mysql: {
        host: 'webcomvisual.com.br',
        database: 'webcom_beta',
        user: 'webcom_beta',
        pass: 'E?gIgp0wY}(p'
    }
};

/**
 * Helper para garantir que um plano tenha dados válidos, restaurando defaults se necessário
 */
const sanitizePlan = (plan: any, defaultPlan: PlanDetails): PlanDetails => {
    if (!plan) return defaultPlan;
    return {
        ...defaultPlan,
        ...plan,
        price: typeof plan.price === 'number' ? plan.price : defaultPlan.price,
        oldPrice: typeof plan.oldPrice === 'number' ? plan.oldPrice : defaultPlan.oldPrice,
        features: Array.isArray(plan.features) ? plan.features : defaultPlan.features
    };
};

/**
 * Sanitiza a estrutura de planos para evitar crashes com dados antigos
 */
const sanitizePlansStructure = (loadedPlans: any): AppConfig['plans'] => {
    if (!loadedPlans) return DEFAULT_CONFIG.plans;

    const keys: (keyof AppConfig['plans'])[] = ['cpf', 'cnpj', 'plate', 'phone'];
    const sanitized: any = {};

    keys.forEach(key => {
        const loadedSet = loadedPlans[key];
        const defaultSet = DEFAULT_CONFIG.plans[key];

        if (!loadedSet) {
            sanitized[key] = defaultSet;
        } else {
            sanitized[key] = {
                basic: sanitizePlan(loadedSet.basic, defaultSet.basic),
                complete: sanitizePlan(loadedSet.complete, defaultSet.complete)
            };
        }
    });

    return sanitized;
};

/**
 * Carrega as configurações simulando uma query SQL SELECT * FROM settings
 */
export const loadAppConfig = async (): Promise<AppConfig> => {
    return new Promise((resolve) => {
        try {
            // Em produção, isso seria: await fetch('/api/get_config.php');
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                
                // Sanitização crítica dos planos
                const safePlans = sanitizePlansStructure(parsed.plans);

                // Deep Merge para garantir que campos novos não quebrem configs antigas
                const merged = { 
                    ...DEFAULT_CONFIG, 
                    ...parsed, 
                    payment: { ...DEFAULT_CONFIG.payment, ...(parsed.payment || {}) },
                    social: { ...DEFAULT_CONFIG.social, ...(parsed.social || {}) },
                    efi: { ...DEFAULT_CONFIG.efi, ...(parsed.efi || {}) },
                    mysql: { ...DEFAULT_CONFIG.mysql, ...(parsed.mysql || {}) },
                    plans: safePlans
                };
                console.log("[DB] Config loaded from SQL/Storage");
                resolve(merged);
            } else {
                resolve(DEFAULT_CONFIG);
            }
        } catch (e) {
            console.error("Erro ao carregar configurações", e);
            resolve(DEFAULT_CONFIG);
        }
    });
};

/**
 * Salva as configurações simulando uma query SQL UPDATE settings SET ...
 */
export const saveAppConfig = async (config: AppConfig): Promise<boolean> => {
    return new Promise((resolve) => {
        try {
            // Em produção, isso seria: await fetch('/api/save_config.php', { method: 'POST', body: JSON.stringify(config) });
            
            // Simula query SQL Update
            const jsonString = JSON.stringify(config);
            localStorage.setItem(STORAGE_KEY, jsonString);
            
            addLog('success', 'system', 'SQL UPDATE: Configurações atualizadas no banco de dados.');
            console.log("[DB] SQL UPDATE executed successfully.");
            
            // Simula delay de rede
            setTimeout(() => {
                resolve(true);
            }, 500);
        } catch (e: any) {
            addLog('error', 'system', 'Falha no SQL UPDATE.', { error: e.message });
            console.error("[DB] SQL UPDATE Failed", e);
            resolve(false);
        }
    });
};