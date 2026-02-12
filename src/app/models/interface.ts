import { HttpParams } from '@angular/common/http';

export interface listInfo {
  value: string;
  code: string;
}

export interface session {
  token: string;
}

export interface Ijwt {
  dataUser: any;
  account: string;
  iat: number;
  exp: number;
}

export interface RequestOptions {
  params?: HttpParams;
  body?: any;
  responseType?: 'json' | 'blob' | 'arraybuffer';
  observe?: 'body' | 'response';
}

export interface responseUploadMode {
  isUpload: string;
  msg: string;
}

export type DashboardCard = {
  id: number;
  title: string;
  total: number;
  subtitle?: string;
  route: string;
  icon: string; // emoji/simple. Si tienes librería de íconos lo cambiamos.
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'red';
};
