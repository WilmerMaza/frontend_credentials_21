export interface ControlItem {
    name: string;
    value: string;
    code: string;
  }

export interface JsonDataItem {
title: string;
property: string;
disable: boolean;
isOpen: boolean;
typeFilter:string;
control: ControlItem[];
}

export interface filterResult {
    jsonData: JsonDataItem[];
    filterData: DynamicObject<any>;
  }

export interface DynamicObject<T> {
[key: string]: T;
}

export interface DynamicError<T> {
  [key: string]: T;
}