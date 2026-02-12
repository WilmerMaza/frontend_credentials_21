import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { responseUploadMode } from '../../models/interface';
import { EnapApi } from './enap.api';

@Injectable({
  providedIn: 'root',
})
export class Imgs {
  constructor(private enapApiService$: EnapApi) {}

  getImg(name: string): Observable<Blob> {
    return this.enapApiService$.request<Blob>('GET', `/subirImagen/lower/${name}`, {
      responseType: 'blob',
    });
  }

  subirImg(files: FormData): Observable<responseUploadMode> {
    return this.enapApiService$.request<responseUploadMode>('POST', '/subirImagen/upload', {
      body: files,
      responseType: 'json',
    });
  }

  subirRegisterImg(files: FormData): Observable<responseUploadMode> {
    return this.enapApiService$.request<responseUploadMode>(
      'POST',
      '/subirImagenRegistro/uploadRegister',
      {
        body: files,
        responseType: 'json',
      },
    );
  }

  getAdminImg(name: String): Observable<Blob> {
    return this.enapApiService$.request<Blob>(
      'GET',
      `/subirImagenRegistro/lowerWithoutFolter/${name}`,
      {
        responseType: 'blob',
      },
    );
  }
}
