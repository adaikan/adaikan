import {
  mdiMagnify,
  mdiHome,
  mdiMessage,
  mdiCart,
  mdiAccount,
} from '@mdi/js';

export default [
  {
    name: 'Home',
    icon: mdiHome,
    link: '/',
  },
  {
    name: 'Pesan',
    icon: mdiMessage,
    link: '/chat',
  },
  {
    name: 'Troli',
    icon: mdiCart,
    link: '/cart',
  },
  {
    name: 'Akun',
    icon: mdiAccount,
    link: '/account',
  },
];