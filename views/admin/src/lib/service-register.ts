type BeforeInstallPromptEvent = Event & {
  userChoice: Promise<any>;
  prompt: () => Promise<string>;
}
type CustomNavigator = Navigator & {
  getInstalledRelatedApps(): Promise<[]>;
}

export async function registerService(url = '') {
	if ('ServiceWorker' in window) {
		navigator.serviceWorker.addEventListener('controllerchange', (event) => {
			console.log('service worker controllerchange');
			console.log(event);
		});
		navigator.serviceWorker.addEventListener('message', (event) => {
			console.log('service worker message');
			console.log(event);
		});
		navigator.serviceWorker.addEventListener('messageerror', (event) => {
			console.log('service worker messageerror');
			console.log(event);
		});

		navigator.serviceWorker.register(url, {
			type: 'module',
			scope: '.',
			updateViaCache: 'imports'
		});
		navigator.serviceWorker.ready.then((registration) => {
			registration.addEventListener('updatefound', (event) => {
				console.log('service worker updatefound');
				console.log(event);
			});
		});
		navigator.serviceWorker;

		window.addEventListener('beforeinstallprompt', (event) => {
			console.log('window beforeinstallprompt');
			console.log(event);
      // console.log((event as BeforeInstallPromptEvent).userChoice);
      // console.log((event as BeforeInstallPromptEvent).prompt());
		});
		window.addEventListener('appinstalled', (event) => {
			console.log('window appinstalled');
			console.log(event);
		});
    
    const relateds = await (navigator as CustomNavigator)?.getInstalledRelatedApps();

    console.log('Related App');
    console.log(relateds);
	}
}
