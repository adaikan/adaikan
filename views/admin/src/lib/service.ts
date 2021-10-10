/// <reference no-default-lib="true"/>
/// <reference lib="WebWorker" />

type GlobalThis = typeof globalThis;
type ServiceWorkerContext = ServiceWorkerGlobalScope & GlobalThis;
type Method = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | '*';
type ResponseStrategy = 'revalidate' | 'net-first' | 'cache-first' | 'net-only' | 'cache-only';

interface Route {
	url: string | RegExp;
	method: Method | Method[];
	handler(request: Request, util: RouteUtil): Promise<Task>;
}
interface RouteUtil {
	reply(): this;
	notFound(): this;
	error(): this;
	redirect(): this;
}
interface Task {
	response?: Response;
	timeout?: number;
	retry_interval?: number;
	retry_times?: number;
	name?: string;
	strategy?: ResponseStrategy;
	expire?: number;
}
interface Options {
	cachename: string;
	resources: string[];
}
const default_options: Options = {
	cachename: 'v1',
	resources: ['index.html']
};
const default_route: Route = {
	url: /.*/g,
	method: '*',
	handler: async (request, util) => ({ request, strategy: 'cache-first' })
};
const context: ServiceWorkerContext = self as any;

export default class Service {
	public options: Options;

	protected url_static = new Map<string, number>();
	protected url_dynamic = new Map<RegExp, number>();
	protected method_static = new Map<string, number>();
	protected method_dynamic = new Map<RegExp, number>();

	protected table_route_static = new Map<string, number>();
	protected table_route_dynamic = new Map<RegExp, number>();
	protected routes = new Map<number, Route>();
	protected index = 0;

	constructor(options: Options) {
		this.options = Object.seal(Object.assign({}, default_options, options));

		console.log(context);

		context.addEventListener('install', (event) => {
			event.waitUntil(this.download());
		});
		context.addEventListener('activate', (event) => {
			event.waitUntil(this.clean());
		});
		context.addEventListener('fetch', (event) => {
			const result = this.proxying(event.request);
			event.respondWith(result);
			event.waitUntil(result);
		});
		context.addEventListener('push', (event) => {
			console.log(event);
		});
		context.addEventListener('sync' as any, (event: ExtendableEvent) => {
			console.log(event);
		});
		context.addEventListener('periodicsync' as any, (event: ExtendableEvent) => {
			console.log(event);
		});
		context.addEventListener('message', (event) => {
			console.log(event);
		});
		context.addEventListener('error', (event) => {
			console.log(event);
		});
		context.addEventListener('unhandledrejection', (event) => {
			console.log(event);
		});
	}
	public async route(route: Route) {
		const index = this.index++;
		const method = route.method;
		const url = route.url;
		if (typeof method == 'string' && method != '*') {
			if (typeof url == 'string') {
				this.table_route_static.set(`${method}:${url}`, index);
			} else {
				let url_raw = url + '';
				url_raw = url_raw.substring(1, url_raw.length - 1);
				this.table_route_dynamic.set(new RegExp(`${method}\:${url_raw}`), index);
			}
		} else {
			let method_raw: string;
			if (method == '*') {
				method_raw = '.*';
			} else {
				method_raw = method.join('|');
			}
			if (typeof url == 'string') {
				this.table_route_dynamic.set(new RegExp(`${method_raw}\:${url}`), index);
			} else {
				let url_raw = url + '';
				url_raw = url_raw.substring(1, url_raw.length - 1);
				this.table_route_dynamic.set(new RegExp(`${method_raw}\:${url_raw}`), index);
			}
		}
		return this;
	}

	protected async download() {
		const cache = await caches.open(this.options.cachename);
		await cache.addAll(this.options.resources);
		return context.skipWaiting();
	}
	protected async clean() {
		const keys = await caches.keys();
		for (const key of keys) {
			if (key != this.options.cachename) {
				await caches.delete(key);
			}
		}
		return context.clients.claim();
	}
	protected async proxying(request: Request) {
		const route = this.lookup(request) ?? default_route;
		const util: any = {};
		const task = await route.handler(request, util);
		if (task) {
			if (task.response) {
				return task.response;
			} else {
				const cache = await caches.open(task.name ?? this.options.cachename);
				const req_util = new RequestUtil(task);
				const res_util = new ResponseUtil();

				res_util.fetch = req_util.send.bind(req_util);

        console.log(task.strategy, request.url);

				if (task.strategy == 'revalidate') {
					return res_util.revalidate(request, cache);
				} else if (task.strategy == 'net-first') {
					return res_util.netFirst(request, cache);
				} else if (task.strategy == 'net-only') {
					return res_util.netOnly(request);
				} else if (task.strategy == 'cache-first') {
					return res_util.cacheFirst(request, cache);
				} else if (task.strategy == 'cache-only') {
					return res_util.cacheOnly(cache, request);
				}
			}
		}
		return fetch(request);
	}
	protected lookup(request: Request) {
		const str_url = request.url;
		const str_method = request.method;
		const req_address = `${str_method}:${str_url}`;
		for (const [address, index] of this.table_route_static) {
			if (address == req_address) {
				return this.routes.get(index);
			}
		}
		for (const [regex, index] of this.table_route_dynamic) {
			if (regex.test(req_address)) {
				return this.routes.get(index);
			}
		}
	}

	public onInstall() {}
	public onActivate() {}
	public onFetch() {}
	public onPush() {}
	public onSync() {}
	public onPeriodicSync() {}
	public onMessage() {}
	protected oninstall() {
		console.log('install');
	}
	protected onactivate() {
		console.log('activate');
	}
	protected onfetch() {
		console.log('fetch');
	}
	protected onsync() {
		console.log('sync');
	}
	protected onpush() {
		console.log('push');
	}
	protected onperiodicsync() {
		console.log('periodicsync');
	}
	public onmessage() {
		console.log('message');
	}
}
function wait<R = any>(timeout: number, handler: Function) {
	return new Promise<R>((resolver, rejector) => {
		setTimeout(() => {
			resolver(handler());
		}, timeout);
	});
}
interface RequestUtilOptions {
	timeout?: number;
	retry_interval?: number;
	retry_times?: number;
}
const request_util_default_options: RequestUtilOptions = {
	timeout: 0,
	retry_interval: 0,
	retry_times: 0
};
class RequestUtil {
	static ERR_NET_OFFLINE = 'net::ERR_FAILED';
	public debug = true;
	public abort_controller = new AbortController();
	public options: RequestUtilOptions;
	protected retrying = false;
	protected retry_count = 0;
	protected retry_id: any = 0;
	constructor(options?: RequestUtilOptions) {
		this.options = Object.assign({}, request_util_default_options, options);
	}
	public async send(request: Request) {
		this.debug && console.time('Send Request' + request.url);
		let id: any = 0;
		const new_request = new Request(request, { signal: this.abort_controller.signal });
		if (this.options.timeout) {
			id = setTimeout(() => {
				this.abort_controller.abort();
			}, this.options.timeout);
		}
		try {
			return await fetch(new_request);
		} catch (error: any) {
			this.debug && console.error(error);
			if (error.message == RequestUtil.ERR_NET_OFFLINE) {
				throw new TypeError(RequestUtil.ERR_NET_OFFLINE);
			} else {
				throw error;
			}
		} finally {
			clearTimeout(id);
			this.debug && console.timeEnd('Send Request' + request.url);
		}
	}
	public retry(
		request: Request,
		onsuccess?: (response: Response) => void,
		onfailed?: (error: any) => void
	) {
		if (this.retrying) {
			return this;
		}
		if (this.options.retry_interval) {
			this.debug && console.time('Retry Request' + request.url);
			this.retrying = true;
			this.retry_id = setInterval(() => {
				this.send(request)
					.then((response) => {
						this.retrying = false;
						clearInterval(this.retry_id);
						onsuccess?.(response);
					})
					.catch((error: any) => {
						if (this.retry_count == this.options.retry_times) {
							clearInterval(this.retry_id);
							onfailed?.(error);
						} else {
							this.retry_count++;
						}
					})
					.finally(() => {
						this.debug && console.timeEnd('Retry Request' + request.url);
					});
			}, this.options.retry_interval);
		}
		return this;
	}
}
class ResponseUtil {
	public debug = true;
	public cacheOptions: CacheQueryOptions = {
		ignoreMethod: false,
		ignoreSearch: false,
		ignoreVary: true
	};
	public not_found = new Response(null, {
		status: 404,
		statusText: 'Not Found'
	});
	public notFound() {
		return this.not_found.clone();
	}
	public fetch(request: Request) {
		return fetch(request);
	}
	public async revalidate(request: Request, cache: Cache) {
		let response = await cache.match(request, this.cacheOptions);
		if (response) {
			this.waitPutCache(cache, request);
		} else {
			response = await this.fetch(request);
			this.waitPutCache(cache, request, response.clone());
		}
		return response;
	}
	public netFirst(request: Request, cache: Cache) {
		return this.fetch(request)
			.then((response) => {
				if (response.ok) {
					this.waitPutCache(cache, request, response.clone());
					return response;
				} else {
					return this.cacheOnly(cache, request);
				}
			})
			.catch((error) => {
				return this.cacheOnly(cache, request);
			});
	}
	public async netOnly(request: Request) {
		return this.fetch(request);
	}
	public async cacheFirst(request: Request, cache: Cache) {
		let response = await cache.match(request, this.cacheOptions);
		if (!response) {
			response = await this.fetch(request);
			this.waitPutCache(cache, request, response.clone());
		}
		return response;
	}
	public cacheOnly(cache: Cache, request: Request) {
		return cache.match(request, this.cacheOptions).then((response) => {
			if (response) {
				return response;
			} else {
				return this.notFound();
			}
		});
	}
	public waitPutCache(cache: Cache, request: Request, response?: Response) {
		return wait(16, async () => {
			if (!response) {
				response = await this.fetch(request);
			}
			if (response.ok) {
				cache.put(request, response);
			}
		});
	}
}
