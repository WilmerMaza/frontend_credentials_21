import { HttpHeaders, HttpParams } from '@angular/common/http';

type responseType = 'arraybuffer' | 'blob' | 'json' | 'text';

export interface IHttpModel {
  method: string;
  url: string;
  options: IoptionModel;
  endpoint?: string;
}
export interface IoptionModel {
  body?: any;
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  observe?: 'events' | 'response';
  params?:
    | HttpParams
    | {
        [param: string]: string | string[];
      };
  reportProgress?: boolean;
  responseType?: responseType;
  withCredentials?: boolean;
}

export interface IoptionHeaders {
  branch: string;
  process: string;
  thirdPartyId: string;
  documentType: string;
  addressThird?: string;
  draftId?: string;
  template?: string;
  accept?: string;
}
export interface ItypeGeneric {
  [x: string]: string;
}
