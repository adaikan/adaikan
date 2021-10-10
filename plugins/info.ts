import type { FastifyPluginAsync } from 'fastify';
import type { JWTPayload, UserInfo } from '../global';

import wrapper from 'fastify-plugin';
import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

interface Options {
  root: string;
}
interface Plugin extends FastifyPluginAsync<Options> { }

const name = 'info';
const plugin: Plugin = async (app, opts) => {

  app.get('/server/info', async (request, reply) => {
    const info = JSON.stringify({
      version: app.version,
      pwd: process.cwd(),
      dirtree: glob.sync('**', { ignore: ['node_modules', '**/node_modules/**'], cwd: process.cwd() }),
      environment: process.env,
    }, undefined, '\t');
    reply
      .header('Content-Type', 'text/html; charset=utf-8')
      .send(`
        <script>
          const info = ${info};
          console.log(info);
        </script>
        <style>
          pre {
            line-height: 2.0;
          }
        </style>
        <pre>
          <code>
            ${info}
          </code>
          plugins <br/>
          ${app.printPlugins().replace(/\n/g, '<br/>')}
          routes <br/>
          ${app.printRoutes({ commonPrefix: true }).replace(/\n/g, '<br/>')}
        </pre>
    `);
  })
};

declare const info: Plugin;
export default wrapper(plugin, { name });
