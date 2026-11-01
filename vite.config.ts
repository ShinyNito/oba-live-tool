import { rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { defineConfig, lazyPlugins } from 'vite-plus'
import pkg from './package.json' with { type: 'json' }

const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/dist-electron/**',
  '**/release/**',
  '**/build/**',
  '**/.vscode/**',
  '**/*.html',
]

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    // Migrated from biome.json
    fmt: {
      ignorePatterns: [...ignorePatterns, '**/*.md', '**/*.yml', '**/*.yaml'],
      printWidth: 100,
      singleQuote: true,
      jsxSingleQuote: false,
      semi: false,
      trailingComma: 'all',
      arrowParens: 'avoid',
      sortImports: { newlinesBetween: false },
      sortPackageJson: false,
    },
    lint: {
      ignorePatterns,
      plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y'],
      jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
      options: {
        typeAware: true,
        typeCheck: true,
      },
      rules: {
        'vite-plus/prefer-vite-plus-imports': 'error',
        'no-param-reassign': 'error',
        'typescript/prefer-as-const': 'error',
        'default-param-last': 'error',
        'typescript/prefer-enum-initializers': 'error',
        'react/self-closing-comp': 'error',
        'unicorn/prefer-number-properties': 'error',
        'typescript/no-inferrable-types': 'error',
        'no-else-return': 'error',
        // Biome recommended rules that the code explicitly opts out of in places
        'typescript/no-explicit-any': 'warn',
        'typescript/no-non-null-assertion': 'warn',
        'typescript/no-empty-object-type': 'warn',
        'react/no-array-index-key': 'warn',
        'react/no-danger': 'warn',
        'unicorn/no-document-cookie': 'warn',
        // Biome ignores `_`-prefixed bindings
        'no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
      },
    },
    staged: {
      '*': 'vp check --fix',
    },
    resolve: {
      alias: {
        '@': path.join(import.meta.dirname, 'src'),
        shared: path.join(import.meta.dirname, 'shared'),
      },
    },
    // Lazy so that reading lint/fmt config doesn't wipe dist-electron or load plugins
    plugins: lazyPlugins(() => {
      rmSync('dist-electron', { recursive: true, force: true })

      return [
        react(),
        tailwindcss(),
        electron({
          main: {
            // Shortcut of `build.lib.entry`
            entry: 'electron/main/index.ts',
            onstart(args) {
              if (process.env.VSCODE_DEBUG) {
                console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App')
              } else {
                void args.startup()
              }
            },
            vite: {
              build: {
                sourcemap: true,
                minify: false, // 开启前后差距大概 100kb
                outDir: 'dist-electron/main',
                rolldownOptions: {
                  external: [
                    // 将 ws 移入 devDependencies 后启动报错，需要排除下面两个包
                    // (ws 移回 dependencies 虽然正常不报错，但是安装后启动也会报错)
                    'bufferutil',
                    'utf-8-validate',
                    ...Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                  ],
                },
              },
              resolve: {
                alias: {
                  '#': path.join(import.meta.dirname, 'electron/main'),
                  shared: path.join(import.meta.dirname, 'shared'),
                },
              },
            },
          },
          preload: {
            // Shortcut of `build.rolldownOptions.input`.
            // Preload scripts may contain Web assets, so use the `build.rolldownOptions.input` instead `build.lib.entry`.
            input: 'electron/preload/index.ts',
            vite: {
              build: {
                sourcemap: sourcemap ? 'inline' : undefined, // #332
                minify: isBuild,
                outDir: 'dist-electron/preload',
                rolldownOptions: {
                  external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                },
              },
              resolve: {
                alias: {
                  shared: path.join(import.meta.dirname, 'shared'),
                },
              },
            },
          },
          // Ployfill the Electron and Node.js API for Renderer process.
          // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
          // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
          renderer: {},
        }),
      ]
    }),
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
          return {
            host: url.hostname,
            port: +url.port,
          }
        })()
      : undefined,
    clearScreen: false,
  }
})
