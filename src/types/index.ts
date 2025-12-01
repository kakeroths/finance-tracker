// src/types/index.ts
export type Tx = {
  _id: string;
  type: 'income' | 'expense';
  description?: string;
  amount: number;
  date: string;
};

export type TxListResponse = {
  items: Tx[];
  total: number;
  page: number;
  pages: number;
};
