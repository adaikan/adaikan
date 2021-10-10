import {
  mdiCartPlus,
  mdiMessageTextOutline,
} from '@mdi/js';

export default [
  {
    name: 'Chat',
    desc: 'Chat with Seller',
    icon: mdiMessageTextOutline,
    link: '/chat',
  },
  {
    name: 'Cart',
    desc: 'Add to Cart',
    icon: mdiCartPlus,
    link: '/cart',
  },
] as { name: string; desc: string; icon: string; link: string; action?: (event: Event) => void }[];