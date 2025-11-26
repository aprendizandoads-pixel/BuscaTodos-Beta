import { SearchType } from "../types";

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPlate = (value: string) => {
  // Supports ABC-1234 and Mercosul ABC1D23
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .slice(0, 15);
};

export const validateInput = (value: string, type: SearchType): boolean => {
  const clean = value.replace(/[^a-zA-Z0-9]/g, '');
  
  switch (type) {
    case 'CPF':
      return clean.length === 11;
    case 'CNPJ':
      return clean.length === 14;
    case 'PLACA':
      return clean.length === 7;
    default:
      return false;
  }
};

export const getPlaceholder = (type: SearchType) => {
  switch (type) {
    case 'CPF': return '000.000.000-00';
    case 'CNPJ': return '00.000.000/0000-00';
    case 'PLACA': return 'ABC-1234';
  }
};