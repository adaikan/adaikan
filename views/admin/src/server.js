import { assetsMiddleware, prerenderedMiddleware, kitMiddleware } from '../build/middlewares.js';
import http from '0http';

const { router, server } = http();

router.use('/', assetsMiddleware, prerenderedMiddleware, kitMiddleware)

server.listen(3050, '0.0.0.0');
