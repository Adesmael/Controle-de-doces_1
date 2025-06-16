
export const TRANSACTION_TYPES = ["Entrada", "Saída", "Despesa fixa", "Despesa variável"] as const;
export type FinancialTransactionType = typeof TRANSACTION_TYPES[number];

export const TRANSACTION_CATEGORIES = ["Venda", "Compra", "Transporte", "Aluguel", "Salário", "Imposto", "Marketing", "Manutenção", "Serviços Gerais", "Fornecedores", "Receita Diversa", "Despesa Diversa", "Outros"] as const;
export type FinancialTransactionCategory = typeof TRANSACTION_CATEGORIES[number];

export const TRANSACTION_PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Boleto", "Transferência Bancária", "Cheque", "Outros"] as const;
export type FinancialTransactionPaymentMethod = typeof TRANSACTION_PAYMENT_METHODS[number];

export const TRANSACTION_STATUSES = ["Pago", "Em aberto", "A receber", "Vencido", "Agendado", "Cancelado"] as const;
export type FinancialTransactionStatus = typeof TRANSACTION_STATUSES[number];
