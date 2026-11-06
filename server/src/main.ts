import { loadConfig } from './config.js';
import { OfficialProviderAdapter } from './providers.js';
import { createLocalAiServer } from './server.js';

const config = loadConfig();
const server = createLocalAiServer(config, new OfficialProviderAdapter());
server.listen(config.port, config.host, () => {
  console.log(`Local AI server listening on http://${config.host === '::1' ? '[::1]' : config.host}:${config.port}`);
  console.log(config.enabled ? 'AI service explicitly enabled; configured operations may call providers.' : 'AI service disabled. Set AI_SERVICE_ENABLED=true with provider keys and models to enable paid calls.');
});
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
