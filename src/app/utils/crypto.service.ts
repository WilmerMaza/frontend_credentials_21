import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-ts';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private getHexaKey = environment.GetHexaKey;

  private GetKey = () => enc.Utf8.parse(this.getHexaKey);

  public Encript = (value: string): string =>
    AES.encrypt(value, this.GetKey()).toString();  

  public Decrypt = (value: string): string =>
    AES.decrypt(value, this.GetKey()).toString(enc.Utf8);

  public DecryptSecret = (value: string): Array<string> => {
    return atob(value).split('/');
  };
}
