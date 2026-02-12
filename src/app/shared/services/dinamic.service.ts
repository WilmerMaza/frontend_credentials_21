import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DinamicService {

  private dataToPass = new BehaviorSubject<dataToPass>({eventName: "", isEspecial: false});
  dataToPass$ = this.dataToPass.asObservable();

  private selectNumber = new BehaviorSubject<number>(0);
  selectNumber$ = this.selectNumber.asObservable();

  setData(data: dataToPass) {
    this.dataToPass.next(data);
  }

  setDataSelectNumber(data: number) {
    this.selectNumber.next(data);
  }

}

export interface dataToPass {
  eventName : string,
  isEspecial : boolean
}