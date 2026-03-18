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
  total?: number; // opcional para cards descriptivas
  subtitle?: string;
  description?: string; // texto descriptivo en lugar de total
  route: string;
  icon: string;
  iconName?: string;
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  featured?: boolean; // card destacada, más grande
};
