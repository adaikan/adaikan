import type ClientApi from '$lib/client-api';
import type { ClientWebSocket } from '$lib/client-api';
import type Token from '$lib/token';
import type {
	Channel,
	ChatChannel,
	ChatMessage,
	ChatNode,
	ConnectContact,
	CreateContact,
	GetChannel as GetContacts,
	ChatReceiveFormat,
	ChatSendFormat,
	Message,
	Connect,
	Join,
} from '$server/schemas/v0-alpha.1/chat';
export type {
	Channel,
	ChatChannel,
	ChatMessage,
	ChatNode,
	ConnectContact,
	CreateContact,
	GetContacts,
	ChatReceiveFormat,
	ChatSendFormat,
	Message,
};
export type Contact = ChatNode.Data;
export default class ChatClientApi {
	api: ClientApi;
	token: Token;
	constructor(clientApi: ClientApi, token: Token) {
		this.api = clientApi.clone({
			path: '/chat',
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

	public async createContact(data: CreateContact) {
		const response = await this.api
			.request({
				method: 'POST',
				endpoint: 'create',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data,
			})
			.send<Contact>();
		return response.read();
	}
	public async connectContact(data: ConnectContact) {
		const response = await this.api
			.request({
				method: 'POST',
				endpoint: 'connect',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data,
			})
			.send<ChatChannel.Data>();
		return response.read();
	}
	public async getContacts(data: GetContacts) {
		const response = await this.api
			.request({
				method: 'POST',
				endpoint: 'channel',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data,
			})
			.send<Channel[]>();
		return response.read();
	}
	public async message<Query extends ChatMessage.CreateQuery>(
		data: ChatMessage.ValidateQuery<Query, ChatMessage.CreateQuery>
	) {
		const response = await this.api
			.request<Query>({
				method: 'POST',
				endpoint: 'message',
				headers: { authorization: 'Bearer ' + (await this.getToken()) },
				body: data,
			})
			.send<void>();
		return response.read();
	}

	public ws() {
		return new WSChatApi(this.api.ws({ persist: true }));
	}
}

class WSChatApi {
	private clientApi: ClientWebSocket;
	constructor(clientApi: ClientWebSocket) {
		this.clientApi = clientApi;
	}
	public async connect(data: Connect) {
		await this.clientApi.open();

		this.clientApi.send('connect', data);
	}
	public async disconnect() {
		await this.clientApi.close();
	}
	public async onMessage(handler: (message: Message) => any) {
		this.clientApi.receive('message', handler);
	}
	public async onJoin(handler: (channel: Channel) => any) {
		this.clientApi.receive('join', handler);
	}
	public async onClose(handler: () => any) {
		this.clientApi.closed.then(handler);
	}
}
