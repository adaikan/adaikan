import Api from '$server/utility/api';
import type { Version } from '$server/utility/api';
import type { ServerSentEvent, WSData } from '$server/global';

import { Promiseify } from './helper';

export { Version };
export interface Options {
	base?: string;
	wsbase?: string;
	version?: Version;
	path?: string;
	mode?: RequestMode;
	serialize?: boolean;
	deserialize?: boolean;
	onrequest?: (request: Request) => void;
	onresponse?: (response: Response) => void;
	debug?: boolean;
}

const defaultOptions: Options = {
	base: '',
	wsbase: '',
	version: 'v0-alpha.1',
	path: '',
	debug: true,
	mode: 'same-origin',
	serialize: true,
	deserialize: true
};

export type { ClientWebSocket };

export default class ClientApi {
	public static readonly Utility = Api;
	public persisted_connection: { ws?: ClientWebSocket; event?: ClientServerSentEvent } = {};
	public get Error() {
		return Api.Error.Const;
	}
	public readonly options: Required<Options>;
	public url: string;
	constructor(options?: Options) {
		this.options = Object.seal(Object.assign({}, defaultOptions, options)) as Required<Options>;
		const { base, version, path } = this.options;
		this.url = `${base}/${version}`;
		if (path) {
			this.url += `/${path}`;
		}
	}
	public clone(options?: Options) {
		const opts = Object.assign({}, defaultOptions, this.options, options) as Required<Options>;
		return new ClientApi(opts);
	}
	public request<Body = any>(
		options: {
			endpoint?: string;
			query?: Record<string, string>;
			method?: Method;
			headers?: Record<string, string>;
			body?: Body;
		} = {}
	) {
		const { mode, serialize, deserialize, onrequest, onresponse, debug } = this.options;
		let { endpoint, query, method, headers, body } = options;
		let url = this.url;
		if (endpoint) {
			url += `/${endpoint}`;
		}
		if (query) {
			url += `?${Api.toQueryString(query)}`;
		}
		return new ClientRequestApi<Body>({
			url,
			method,
			headers: new Headers(headers),
			body,
			mode,
			serialize,
			deserialize,
			onrequest,
			onresponse,
			debug
		});
	}
	public event(options?: { endpoint?: string; persist?: boolean }) {
		const connection = new ClientServerSentEvent({
			debug: this.options.debug,
			url: `${this.url}${options?.endpoint ? '/' + options?.endpoint : ''}`
		});
		if (options?.persist) {
			if (this.persisted_connection.event) {
				return this.persisted_connection.event;
			} else {
				return (this.persisted_connection.event = connection);
			}
		} else {
			return connection;
		}
	}
	public ws(options?: { endpoint?: string; persist?: boolean }) {
		const connection = new ClientWebSocket({
			base: this.options.wsbase,
			path: `/${this.options.version}${this.options.path ? '/' + this.options.path : ''}${
				options?.endpoint ? '/' + options?.endpoint : ''
			}`,
			debug: this.options.debug
		});
		if (options?.persist) {
			if (this.persisted_connection.ws) {
				return this.persisted_connection.ws;
			} else {
				return (this.persisted_connection.ws = connection);
			}
		} else {
			return connection;
		}
	}
}

type Method = 'GET' | 'POST' | 'OPTION' | 'DELETE' | 'PUT' | 'PATCH';

interface ClientRequestApiOptions<Body = BodyInit | null> {
	url: string;
	method: Method;
	headers: Headers;
	body?: Body;
	mode: RequestMode;
	serialize: boolean;
	deserialize: boolean;
	onrequest?: (request: Request) => void;
	onresponse?: (response: Response) => void;
	debug: boolean;
}

const clientRequestApiOptionsdefault: ClientRequestApiOptions = {
	url: '',
	method: 'GET',
	headers: new Headers(),
	body: null,
	mode: 'same-origin',
	serialize: true,
	deserialize: true,
	debug: true
};

class ClientRequestApi<Body = BodyInit | null> {
	public options: ClientRequestApiOptions<Body>;
	public raw: Request;
	constructor(options?: Partial<ClientRequestApiOptions<Body>>) {
		this.options = Object.seal(
			Object.assign({}, clientRequestApiOptionsdefault, options)
		) as ClientRequestApiOptions<Body>;
		this.raw = this.init();
		this.options.onrequest?.(this.raw);
	}
	protected init() {
		if (this.options.serialize) {
			this.options.body = this.serializer(this.options.headers, this.options.body);
		}
		return new Request(this.options.url, {
			method: this.options.method,
			headers: this.options.headers,
			body: this.options.body as any,
			mode: 'same-origin'
		});
	}
	protected serializer(headers: Headers, body?: Body): any {
		if (body instanceof File) {
			return body;
		} else if (body instanceof FormData) {
			return body;
		} else if (body instanceof ReadableStream) {
			return body;
		} else {
			headers.append('content-type', 'application/json;charset=UTF-8');
			return JSON.stringify(body);
		}
	}
	public async send<Payload = any>() {
		const response = await fetch(this.raw);
		return new ClientResponseApi<Payload>(response, {
			deserialize: this.options.deserialize,
			onresponse: this.options.onresponse,
			debug: this.options.debug
		});
	}
}

interface ClientResponseApiOptions {
	deserialize: boolean;
	onresponse?: (response: Response) => void;
	debug: boolean;
}

const clientResponseApiOptionsdefault: ClientResponseApiOptions = {
	deserialize: true,
	debug: true
};

class ClientResponseApi<Body> {
	public options: ClientResponseApiOptions;
	public raw: Response;
	constructor(response: Response, options: Partial<ClientResponseApiOptions>) {
		this.raw = response;
		this.options = Object.seal(
			Object.assign({}, clientResponseApiOptionsdefault, options)
		) as ClientResponseApiOptions;
		this.options.onresponse?.(this.raw);
	}
	protected deserializer(response: Response) {
		const type = response.headers.get('content-type');
		if (type?.startsWith('multipart/form-data')) {
			return response.formData();
		} else if (type?.startsWith('image')) {
			return response.blob();
		} else if (type?.startsWith('application/json')) {
			return response.json();
		} else {
			return response.text();
		}
	}
	public async read() {
		let body: any = undefined;
		if (this.options.deserialize) {
			body = this.deserializer(this.raw);
		}
		if (this.raw.status > 399) {
			throw new Api.Error.From(await body);
		} else {
			return body as Body;
		}
	}
}

interface ClientServerSentEventApiOptions {
	url: string;
	inherit?: boolean;
	debug?: boolean;
}
interface ClientServerSentEventApiHandler {
	(data: any): void;
}

const clientServerSentEventApiOptionsdefault: ClientServerSentEventApiOptions = {
	url: '',
	inherit: false,
	debug: true
};

class ClientServerSentEvent {
	public open!: Promiseify<ClientServerSentEvent>;
	public raw!: EventSource;
	public messageHandlers = new Map<string, Set<ClientServerSentEventApiHandler>>();
	public options: ClientServerSentEventApiOptions;
	constructor(options?: Partial<ClientServerSentEventApiOptions>) {
		this.options = Object.seal(
			Object.assign({}, clientServerSentEventApiOptionsdefault, options)
		) as ClientServerSentEventApiOptions;
		if (!this.options.inherit) {
			this.init();
		}
	}
	protected init() {
		this.open = new Promiseify();
		this.raw = new EventSource(this.options.url, { withCredentials: true });
		this.raw.addEventListener('open', (event) => {
			this.open.resolver(this);
		});
		this.raw.addEventListener('message', (event) => {
			const data: ServerSentEvent = this.serializer(event.data);
			this.publish(data.tag, data.message);
		});
	}
	protected publish<D = any>(tag: string, data: D) {
		const handlers = this.messageHandlers.get(tag);
		if (handlers) {
			for (const handler of handlers) {
				handler(data);
			}
		}
	}
	public serializer<M = any>(message: any) {
		return JSON.parse(message) as M;
	}
	public message(tag: string, handler: (data: any) => void) {
		let handlers = this.messageHandlers.get(tag);
		if (handlers) {
			handlers.add(handler);
		} else {
			handlers = new Set<ClientServerSentEventApiHandler>();
			handlers.add(handler);
			this.messageHandlers.set(tag, handlers);
		}
		return () => handlers?.delete(handler);
	}
	public clone(options?: ClientServerSentEventApiOptions) {
		const client = new ClientServerSentEvent(Object.assign({}, this.options, options));
		if (client.options.inherit) {
			client.raw = this.raw;
			client.open = this.open;
			client.init();
		}
		return client;
	}
	public clean() {
		for (const [tag, handlers] of this.messageHandlers) {
			handlers.clear();
		}
		this.messageHandlers.clear();
	}
	public close() {
		return this.raw.close();
	}
	public addEventListener<K extends keyof EventSourceEventMap>(
		type: K,
		listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		return this.raw.addEventListener(type, listener, options);
	}
	public removeEventListener<K extends keyof EventSourceEventMap>(
		type: K,
		listener: (this: EventSource, ev: EventSourceEventMap[K]) => any,
		options?: boolean | EventListenerOptions
	) {
		return this.raw.removeEventListener(type, listener, options);
	}
}

interface ClientWebSocketApiOptions {
	base: string;
	path: string;
	debug: boolean;
}

const clientWebSocketApiOptionsdefault: ClientWebSocketApiOptions = {
	base: '',
	path: '',
	debug: true
};

class ClientWebSocket {
	public open: Promiseify<this>;
	public raw: WebSocket;
	public options: ClientWebSocketApiOptions;
	constructor(options?: Partial<ClientWebSocketApiOptions>) {
		this.options = Object.seal(
			Object.assign({}, clientWebSocketApiOptionsdefault, options)
		) as ClientWebSocketApiOptions;
		this.open = new Promiseify();
		let url = this.options.base;
		if (url.startsWith('/')) {
			url = location.origin.replace('http', 'ws') + url;
		}
		this.raw = new WebSocket(url + this.options.path);
		this.raw.addEventListener('open', (event) => {
			this.open.resolver(this);
		});
	}
	public clone(options?: ClientWebSocketApiOptions) {
		return new ClientWebSocket(Object.assign({}, this.options, options));
	}
	public close(code?: number, reason?: string) {
		return this.raw.close(code, reason);
	}
	public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
		return this.raw.send(data);
	}
	public addEventListener<K extends keyof WebSocketEventMap>(
		type: K,
		listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions
	) {
		return this.raw.addEventListener(type, listener, options);
	}
	public removeEventListener<K extends keyof WebSocketEventMap>(
		type: K,
		listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
		options?: boolean | EventListenerOptions
	) {
		return this.raw.removeEventListener(type, listener, options);
	}
}
