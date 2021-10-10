import type ClientApi from '$lib/client-api';
import type Token from '$lib/token';
import type { Data, Stat, SentEvent } from '$server/schemas/v0-alpha.1/admin';
export type { Data, Stat, SentEvent };
export default class AdminClientApi {
	api: ClientApi;
	token: Token;
	constructor(clientApi: ClientApi, token: Token) {
		this.api = clientApi.clone({
			path: 'admin'
		});
		this.token = token.clone();
	}
	public init() {
		this.token.init();
	}
	protected async setToken(response: Response) {
		const token = response.headers.get('authorization')?.split(' ')[1];
		if (token) {
			this.token.store({ token });
		}
	}
	protected async getToken() {
		const data = await this.token.retrieve();
		return data?.token ?? '';
	}

	public async get() {
		const response = await this.api
			.request({
				method: 'GET',
				headers: { authorization: 'Bearer ' + (await this.getToken()) }
			})
			.send<Data>();
		return response.read();
	}

	public async stat() {
		const response = await this.api
			.request({
				method: 'GET',
				endpoint: 'stat',
				headers: { authorization: 'Bearer ' + (await this.getToken()) }
			})
			.send<Stat>();
		return response.read();
	}

	public async getModel() {
		const response = await this.api
			.request({
				method: 'GET',
				endpoint: 'model',
				headers: { authorization: 'Bearer ' + (await this.getToken()) }
			})
			.send<Data['model']>();
		return response.read();
	}
	public async setModel(data: Data['model']) {
		const response = await this.api
			.request({
				method: 'PATCH',
				endpoint: 'model',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data
			})
			.send<Data['model']>();
		return response.read();
	}

	public async getBusiness() {
		const response = await this.api
			.request({
				method: 'GET',
				endpoint: 'business',
				headers: { authorization: 'Bearer ' + (await this.getToken()) }
			})
			.send<Data['business']>();
		return response.read();
	}
	public async setBusiness(data: Data['business']) {
		const response = await this.api
			.request({
				method: 'PATCH',
				endpoint: 'business',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data
			})
			.send<Data['business']>();
		return response.read();
	}

	public async getSlide() {
		const response = await this.api
			.request({
				method: 'GET',
				endpoint: 'slide',
				headers: { authorization: 'Bearer ' + (await this.getToken()) }
			})
			.send<string[]>();
		return response.read();
	}
	public async setSlide(data: FormData) {
		const response = await this.api
			.request({
				method: 'PATCH',
				endpoint: 'slide',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data
			})
			.send<any>();
		return response.read();
	}

	public event() {
		return this.api.event({persist: true});
	}
}
