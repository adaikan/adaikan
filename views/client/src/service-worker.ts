/// <reference no-default-lib="true"/>
/// <reference lib="WebWorker" />

import Service from '$lib/service';
import { build, files, timestamp } from '$service-worker';

const {} = import.meta.env;
const service = new Service({
	debug: false,
	cachename: timestamp + '',
	resources: ['/', ...build, ...files],
});

service.route({
	url: /chrome-extension:.*/,
	method: 'GET',
	handler: async (request, util) => {
		return {
			strategy: 'net-only',
		};
	},
});
service.route({
	url: /wss?:.*/,
	method: 'GET',
	handler: async (request, util) => {
		return {
			name: 'api',
			strategy: 'net-only'
		};
	},
});
service.route({
	url: new RegExp(location.origin + '/api/' + '.*', 'ig'),
	method: 'GET',
	handler: async (request, util) => {
		return {
			name: 'api',
			strategy: 'net-first'
		};
	},
});
service.route({
	url: /.*/,
	method: 'GET',
	handler: async (request, util) => {
		return {
			name: 'static',
			timeout: 5000,
			retry_interval: 10000,
			retry_times: 3,
			strategy: 'cache-first',
		};
	},
});
service.route({
	url: /.*/,
	method: '*',
	handler: async (request, util) => {
		return {
			strategy: 'net-only',
		};
	},
});

service.start();
