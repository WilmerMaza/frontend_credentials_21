import { INavData } from '../../layout/interfaces/nav-data.interface';

export const MENU: Record<string, INavData[]> = {
  instucion: [
    {
      name: 'Registro',
      url: '/personal-registrado',
      iconComponent: { name: 'contacts_product' },
    },
  ],
};
