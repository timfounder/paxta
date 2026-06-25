import { createRoot } from 'react-dom/client';

import { appConfig } from '@app/config/env';
import { LogLevel, logger, setLogLevel } from '@shared/utils/logger';
import { App } from '@ui/App';

import './ui/styles/global.css';

setLogLevel(appConfig.debug ? LogLevel.Debug : LogLevel.Warn);
logger.info(`${appConfig.appName} v${appConfig.appVersion} (${appConfig.environment})`);

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Fatal: #root element was not found in index.html');
}

// StrictMode is intentionally omitted: its double-invoked effects would create
// and tear down a WebGL context twice on mount, which some mobile webviews
// handle poorly. Effect cleanup is still correct for production unmounts.
createRoot(container).render(<App />);
