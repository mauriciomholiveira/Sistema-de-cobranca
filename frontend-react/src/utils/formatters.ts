
export interface AddressData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface BankData {
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  chave_pix?: string; // Optional, sometimes stored separately but good to have type
}

export const parseAddress = (addressStr: string | undefined | null): AddressData => {
  const emptyAddress = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
  if (!addressStr) return emptyAddress;

  try {
    const parsed = JSON.parse(addressStr);
    // Basic validation to check if it looks like our object
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...emptyAddress, ...parsed };
    }
  } catch (e) {
    // If parse fails, assume it's a legacy string address
    // We treat the whole string as 'logradouro' for now to not lose data
    return { ...emptyAddress, logradouro: addressStr };
  }
  return emptyAddress;
};

export const parseBankData = (bankStr: string | undefined | null): BankData => {
  const emptyBank = { banco: '', agencia: '', conta: '', tipo_conta: 'Corrente' };
  if (!bankStr) return emptyBank;

  try {
    const parsed = JSON.parse(bankStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...emptyBank, ...parsed };
    }
  } catch (e) {
    // Legacy string
    return { ...emptyBank, banco: bankStr }; // Store raw string in 'banco' or valid field
  }
  return emptyBank;
};

export const formatAddress = (data: AddressData): string => {
  return JSON.stringify(data);
};

export const formatBankData = (data: BankData): string => {
  return JSON.stringify(data);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(d);
};
