import type { StorybookConfig } from '@storybook/nextjs';
import dotenvFlow from 'dotenv-flow';
import webpack from 'webpack';

dotenvFlow.config({
  silent: true,
});

const publicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
);

console.log(publicEnv);

const config: StorybookConfig = {
  staticDirs: ['../public'],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-onboarding', '@chromatic-com/storybook', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs',
    options: {
      builder: {
        useSWC: true,
      },
      disableNextJsPolyfills: true,
    },
  },

  webpackFinal: async (config) => {
    config.plugins = config.plugins || [];

    config.plugins.push(
      new webpack.DefinePlugin(
        Object.fromEntries(
          Object.entries(publicEnv).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ])
        )
      )
    );

    return config;
  },
};

export default config;
