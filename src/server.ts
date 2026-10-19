import { createApp } from './app.js';
const port = Number(process.env.PORT || 3038);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
const key = (process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY)?.trim();
createApp(key, process.env.JEV_MODEL || 'jev-latest').listen(port, '127.0.0.1', () => {
  console.log(`Dino + Jev running at http://127.0.0.1:${port} (${key ? 'Jev configured' : 'manual play; key missing'})`);
});
