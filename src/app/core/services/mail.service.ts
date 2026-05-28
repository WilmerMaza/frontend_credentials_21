import { HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BYPASS_SPINNER } from '../interceptors/loading.interceptor';
import { EnapApi } from './enap.api';

export interface SendCredentialEmailOptions {
  subject?: string;
  message?: string;
  fileName?: string;
}

const DEFAULT_SUBJECT = 'Tu credencial';
const DEFAULT_MESSAGE = '<p>Adjunta encontrarás tu credencial.</p>';
const DEFAULT_FILE_NAME = 'credencial.pdf';

@Injectable({ providedIn: 'root' })
export class MailService {
  constructor(private readonly enap: EnapApi) {}

  sendCredentialEmail(
    to: string,
    pdfBlob: Blob,
    options?: SendCredentialEmailOptions,
  ): Observable<unknown> {
    const form = new FormData();
    form.append('to', to);
    form.append('subject', options?.subject ?? DEFAULT_SUBJECT);
    form.append('message', options?.message ?? DEFAULT_MESSAGE);
    form.append('pdf', pdfBlob, options?.fileName ?? DEFAULT_FILE_NAME);

    const headers = this.buildMailHeaders();

    return this.enap.request('POST', '/mail/send-email', {
      body: form,
      headers,
      context: new HttpContext().set(BYPASS_SPINNER, true),
    });
  }

  private buildMailHeaders(): HttpHeaders {
    const apiKey = environment.apiKey?.trim();
    if (!apiKey) {
      return new HttpHeaders();
    }
    return new HttpHeaders({ 'x-api-key': apiKey });
  }
}
