import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins || []), tsconfigPaths()];
    config.define = { ...config.define, __dirname: '""' };
    config.resolve = config.resolve || {};
    config.resolve.alias = [
      { find: '@/atoms', replacement: path.resolve(__dirname, '../src/components/atoms') },
      { find: '@/molecules', replacement: path.resolve(__dirname, '../src/components/molecules') },
      { find: '@/organisms', replacement: path.resolve(__dirname, '../src/components/organisms') },
      { find: '@/templates', replacement: path.resolve(__dirname, '../src/components/templates') },
      { find: '@/hooks', replacement: path.resolve(__dirname, '../src/hooks') },
      { find: '@/libs', replacement: path.resolve(__dirname, '../src/libs') },
      { find: '@/core', replacement: path.resolve(__dirname, '../src/core') },
      { find: '@/config', replacement: path.resolve(__dirname, '../src/config') },
      { find: '@/components', replacement: path.resolve(__dirname, '../src/components') },
      { find: '@', replacement: path.resolve(__dirname, '../src') },
    ];
    return config;
  },
};
export default config;
