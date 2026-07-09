import { Analytics } from '@vercel/analytics/react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { configureCollectorApiBase } from '@/features/game-monitor/collector-endpoint';
import './index.css';

const collectorUrl: unknown = import.meta.env.VITE_COLLECTOR_API_URL;
if (typeof collectorUrl === 'string' && collectorUrl.length > 0) {
  configureCollectorApiBase(collectorUrl);
}

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <>
    <App />
    <Analytics />
  </>,
);
