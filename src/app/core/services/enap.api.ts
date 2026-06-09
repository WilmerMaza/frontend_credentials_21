import { HttpClient, HttpEvent, HttpParams, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { RequestOptions } from '../../models/interface';

@Injectable({
  providedIn: 'root',
})
export class EnapApi {
  /** URL base para todas las peticiones */
  private readonly baseUrl = environment.enap_api;

  constructor(private http: HttpClient) {}

  /** GET genérico que acepta parámetros HTTP */
  get<T>(endpoint: string, params?: HttpParams, context?: HttpContext): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, { params, context, withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /** POST para enviar datos al servidor */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, {withCredentials: true})
      .pipe(catchError(this.handleError));
  }

  /** PUT para actualizar recursos */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, {withCredentials: true})
      .pipe(catchError(this.handleError));
  }

  /** DELETE para eliminar recursos */
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`,{withCredentials: true})
      .pipe(catchError(this.handleError));
  }

  request<T>(
    method: string,
    endpoint: string,
    options: RequestOptions = {},
  ): Observable<any> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http
      .request<T>(method, url, {
        params: options.params,
        body: options.body,
        headers: options.headers,
        context: options.context,
        responseType: options.responseType ?? 'json',
        observe: options.observe ?? 'body',
        withCredentials: true,
      } as any)
      .pipe(catchError(this.handleError));
  }

  /** Manejo centralizado de errores HTTP */
  private handleError(error: any): Observable<never> {
    console.error('API error:', error);
    return throwError(() => error);
  }
}
