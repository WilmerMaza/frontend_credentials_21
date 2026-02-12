export interface INavData {
  name: string;
  url: string;
  iconComponent: { name: string };
  badge?: {
    color: string;
    text: string;
  };
} 
