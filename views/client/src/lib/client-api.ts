import Api from '$server/utility/api';
import type { Version } from '$server/utility/api';
import type { WSData } from '$server/global';

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
	deserialize: true,
};

export { ClientWebSocket };
export default class ClientApi {
	public static readonly Utility = Api;
	public get Error() {
		return Api.Error.Const;
	}
	public readonly options: Required<Options>;
	public url: string;
	constructor(options?: Options) {
		this.options = Object.seal(
			Object.assign({}, defaultOptions, options)
		) as Required<Options>;
		const { base, version, path } = this.options;
		this.url = `${base}/${version}`;
		if (path) {
			this.url += `/${path}`;
		}
	}
	public clone(options?: Options) {
		const opts = Object.assign(
			{},
			defaultOptions,
			this.options,
			options
		) as Required<Options>;
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
		const { mode, serialize, deserialize, onrequest, onresponse, debug } =
			this.options;
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
			debug,
		});
	}
	public ws(options?: { endpoint?: string }) {
		return new ClientWebSocket({
			base: this.options.wsbase,
			path: `/${this.options.version}${
				this.options.path ? '/' + this.options.path : ''
			}${options?.endpoint ? '/' + options?.endpoint : ''}`,
			debug: this.options.debug,
		});
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
	debug: true,
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
			this.options.body = this.serializer(
				this.options.headers,
				this.options.body
			);
		}
		return new Request(this.options.url, {
			method: this.options.method,
			headers: this.options.headers,
			body: this.options.body as any,
			mode: 'same-origin',
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
			debug: this.options.debug,
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
	debug: true,
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

interface ClientWebSocketApiOptions {
	base: string;
	path: string;
	debug: boolean;
}

const clientWebSocketApiOptionsdefault: ClientWebSocketApiOptions = {
	base: '',
	path: '',
	debug: true,
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
