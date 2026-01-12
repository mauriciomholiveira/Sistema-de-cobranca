import type { Payment } from '../types';
import { formatPhone, formatCurrency, formatDate } from '../utils/formatters';
import { PIX_CONFIG } from '../utils/constants';

export type MessageType = 'lembrete' | 'vencimento' | 'atraso';

/**
 * WhatsApp service for generating and sending messages
 */
export const whatsappService = {
  /**
   * Generates a WhatsApp message based on payment and type
   */
  generateMessage(payment: Payment, type: MessageType): string {
    const nome = payment.nome.split(' ')[0]; // First name
    const valor = formatCurrency(Number(payment.valor_cobrado));
    const vencimento = formatDate(payment.data_vencimento);
    
    // Calculate days late - parse date without timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse due date without UTC conversion
    const dueDateStr = payment.data_vencimento;
    const dateMatch = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let dueDate: Date;
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      dueDate = new Date(dueDateStr);
    }
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Status text based on message type
    let statusText = '';
    if (type === 'atraso') {
      const dias = diffDays > 0 ? diffDays : 0;
      statusText = `sua mensalidade se encontra em atraso de *${dias} dias*`;
    } else {
      statusText = `ela vence dia *${vencimento}*`;
    }

    return `Oi ${nome}, tudo bem? Graça e paz!
Mauricio aqui :-) 
Passando para te lembrar que sua mensalidade do curso no valor de *${valor}*
Data de vencimento: *${vencimento}*

${statusText}

Sempre adicionar a chave pix, e uma atenção:
Enviar comprovante de pagamento assim que fizer o pagamento.

Chave Pix: ${PIX_CONFIG.key}

Pix Copia-e-cola:
${PIX_CONFIG.copiaCola}`;
  },

  /**
   * Opens WhatsApp with pre-filled message
   */
  sendMessage(payment: Payment, type: MessageType): void {
    if (!payment.whatsapp) {
      throw new Error('Cliente não possui WhatsApp cadastrado');
    }

    const message = this.generateMessage(payment, type);
    const phone = formatPhone(payment.whatsapp);
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  },
};
