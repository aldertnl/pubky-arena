import { defineConfig } from 'deepsec/config';

export default defineConfig({
  defaultAgent: 'codex',
  projects: [
    {
      id: 'pubky-app',
      root: '..',
      githubUrl: 'https://github.com/pubky/pubky-app/blob/1b29a961c0c756c6e7064def7dac3b63f03915df',
    },
    // <deepsec:projects-insert-above>
  ],
});
