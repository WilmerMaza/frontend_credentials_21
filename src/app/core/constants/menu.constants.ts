import { INavData } from '../../layout/interfaces/nav-data.interface';

export const MENU: Record<string, INavData[]> = {
  instucion: [
    {
      name: 'Registro',
      url: '/registration',
      iconComponent: { name: 'contacts_product' },
    },
  ],
};
