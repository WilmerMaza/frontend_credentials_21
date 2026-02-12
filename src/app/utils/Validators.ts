import { typeIdentification } from '../models/constan';
import { listInfo } from '../models/interface';

export const regExps: { [key: string]: RegExp } = {
  emailRegex: /^\\w+([-+.']\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*/,
  emailComplet:
    /^[a-zA-Z0-9_.-]+[@]+[a-zA-Z0-9-]+[.]+[A-Za-z0-9]{2,4}((?:[.]+[a-zA-Z0-9]{2,4})?)$/,
  alphaNumeric: /^[a-zA-Z0-9_-]*$/,
  alphaNumericwithtilde:
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+(\s{1}[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+)*$/,
  prefix: /^[A-Za-z0-9]*$/,
  number: /^\d*$/,
  special: /^[ A-Za-záéíóúÁÉÍÓÚñÑüÜ0-9_@./#&+-]*$/,
  email2:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
  moreEmail: /^(([a-zA-Z\-0-9\.]+@)([a-zA-Z\-0-9\.]+)[,]*)+$/,
  regexPassword: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)(?=.*?[^\w\s]).{8,15}$/,
  numberespecial: /^[0-5]*$/,
  uuidRegex:
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-5][0-9a-fA-F]{3}-[089abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
  username: /[-_a-zA-Z0-9]*/,
  maxTaxes: /^((100(\.0{1,2})?)|(\d{1,2}(\.\d{1,2})?))%$/,
  maxReteica: /^(0(\.\d+)?|1(\.0+)?)%$/,
  decimalNumbers: /^\d{1,3}$|^\d{1,3}\.\d{1,2}$/,
  spaceEnd: /^\w+[^\s]$/,
  numberWDecimal: /^(\d*|(\d+))(\.\d+)?$/,
  telefonoRegex: /^\d{8,15}$/,
  regexcomma: /,/g,
  escapeCaracteresEspeciales: /[-\/\\^$*+?.()|[\]{}]/g,
};
export class Validators {
  static isNullOrUndefined<T>(
    obj: T | null | undefined
  ): obj is null | undefined {
    return typeof obj === 'undefined' || obj === null;
  }
}

export class DateValidators {
  static parseDate(fechaString: string): string {
    const fechaDate = new Date(fechaString);

    if (!isNaN(fechaDate.getTime())) {
      const año: number = fechaDate.getFullYear();
      const mes: string = fechaDate.toLocaleString('es-ES', { month: 'long' });
      const mesMayuscula = mes.charAt(0).toUpperCase() + mes.slice(1);
      const dia: number = fechaDate.getDate() + 1;
      const fechaFormateada: string = `${dia
        .toString()
        .padStart(2, '0')} - ${mesMayuscula} - ${año}`;
      return fechaFormateada;
    } else {
      console.error('La cadena de fecha no es válida.');
      return '';
    }
  }
}

export class NormaliceLowerValidators {
  static normaliceData(data: Record<string, any>): void {
    for (const key in data) {
      if (typeof data[key] === 'string' && key !== 'password') {
        data[key] = data[key].toLowerCase();
      }
    }
  }
}

export class NormaliceUpperValidators {
  static normaliceData(data: any): void {
    if (typeof data === 'object') {
      for (const objeto of data) {
        for (const key in objeto) {
          if (typeof objeto[key] === 'string') {
            const value = objeto[key];
            // Verificar si value es un código de tipo de identificación
            const matchingType = typeIdentification.find(
              (item: listInfo) =>
                item.code.toLowerCase() === value.toLowerCase()
            );
            objeto[key] = matchingType
              ? value.toUpperCase()
              : value.charAt(0).toUpperCase() + value.slice(1);
          }
        }
      }
    }
  }
}

export class NormaliceUpperUnicosValidators {
  static normaliceData(data: string): string {
    if (typeof data === 'string') {
      if (data.includes(' ')) {
        const splitter = data.split(' ');

        let cadenaMayusculas = '';
        splitter.forEach((item: string) => {
          item = item.charAt(0).toUpperCase() + item.slice(1);

          cadenaMayusculas += item + ' ';
        });
        data = cadenaMayusculas.trimEnd();
      } else {
        data = data.charAt(0).toUpperCase() + data.slice(1);
      }
    }

    return data;
  }
}
