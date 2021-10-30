import { assetsMiddleware, prerenderedMiddleware, kitMiddleware } from '../build/middlewares.js';
import http from '0http';

const port = 3010;
const host = '0.0.0.0';
const { router, server } = http();

router.use('/', assetsMiddleware, prerenderedMiddleware, kitMiddleware);

server.listen(port, host, () => {
	console.log(`Listening on ${host}:${port}`);
});
