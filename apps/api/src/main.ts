import { serve } from "@hono/node-server";
import { app, env } from "@accounting-completed/server";

const port = Number(process.env.PORT ?? env.API_PORT); // Azure App Service injects PORT
serve({ fetch: app.fetch, port });
console.log(`api listening on ${port}`);
