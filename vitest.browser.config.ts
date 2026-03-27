import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // next/server uses __dirname (Node-only); stub it for the browser
      'next/server': new URL('./src/config/__mocks__/next-server.ts', import.meta.url).pathname,
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_DB_VERSION': '"1"',
    'process.env.NEXT_PUBLIC_DEBUG_MODE': '"false"',
    'process.env.NEXT_PUBLIC_NEXUS_URL': '"https://nexus.staging.pubky.app"',
    'process.env.NEXT_PUBLIC_CDN_URL': '"https://nexus.staging.pubky.app/static"',
    'process.env.NEXT_PUBLIC_TESTNET': '"true"',
    'process.env.NEXT_PUBLIC_PKARR_RELAYS': '"[\\"http://localhost:8080\\"]"',
    'process.env.NEXT_PUBLIC_HOMESERVER': '"test-homeserver-key"',
    'process.env.NEXT_PUBLIC_MODERATION_ID': '"euwmq57zefw5ynnkhh37b3gcmhs7g3cptdbw1doaxj1pbmzp3wro"',
    'process.env.NEXT_PUBLIC_MODERATED_TAGS': '"[\\"nudity\\"]"',
    'process.env.NEXT_PUBLIC_EXCHANGE_RATE_API': '"https://api1.blocktank.to/api/fx/rates/btc"',
    'process.env.NEXT_PUBLIC_HOMEGATE_URL': '"https://localhost:5000/"',
    'process.env.NEXT_PUBLIC_DEFAULT_HTTP_RELAY': '"http://localhost:15412/link/"',
    'process.env.HOMESERVER_ADMIN_URL': '"http://localhost:6288/generate_signup_token"',
    'process.env.HOMESERVER_ADMIN_PASSWORD': '"admin"',
    'process.env.BASE_URL_SUPPORT': '"https://chatwoot.example.com"',
    'process.env.SUPPORT_API_ACCESS_TOKEN': '"test-token"',
    'process.env.SUPPORT_ACCOUNT_ID': '"123"',
    'process.env.SUPPORT_FEEDBACK_INBOX_ID': '"26"',
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    include: ['**/*.browser.test.tsx'],
    setupFiles: ['./src/config/test.browser.ts'],
    globals: true,
    css: true,
  },
});
