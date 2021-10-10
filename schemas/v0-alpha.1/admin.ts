import D from '../../data.json';
import { Data as Buyer } from './buyer';
import { Data as BuyerAddress } from './buyer-address';
import { Data as Item } from './selected-item';
import { Data as Product } from './product';
import { Data as Store } from './store';
import { Data as Order } from './order';

export type Data = typeof D;
export type { Buyer, BuyerAddress, Item, Product, Store, Order };

export type Stat = {
	user: number;
	order: number;
	product: number;
	sales: string;
};
export type SentEvent<D = any> = {
	tag: string;
	data: D;
};
