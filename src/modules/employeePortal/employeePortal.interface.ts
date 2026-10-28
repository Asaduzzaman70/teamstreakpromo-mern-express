export interface IEmployeeScanTicketInput {
  ticketId?: string | undefined;
  orderId?: string | undefined;
  code?: string | undefined;
  qrData?: string | Record<string, any> | undefined;
}

export interface IEmployeeScannedTicketsQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  eventId?: string;
}

export interface IEmployeeBusinessRewardsQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  isActive?: string | boolean;
}

export interface IEmployeeBusinessOrdersQuery {
  page?: string | number;
  limit?: string | number;
  status?: 'CLAIMED' | 'REDEEMED' | 'CANCELLED';
  itemId?: string;
}

