
export class DefaultResponse {
  items: Array<any> = [];
  pageNumber?: number;
  pageSize?: number;
  totalItemCount?: number;
  totalPages?: number;
  additionalItems?: number;
  code?: number;
  count?: number;
  message?: string;
  responseTime?: string;
}

export class ActionResponse {
  action: any;
  data:any;
}
