00:45:10.780 Running build in Washington, D.C., USA (East) – iad1
00:45:10.781 Build machine configuration: 2 cores, 8 GB
00:45:10.940 Cloning github.com/dortiza2/Frontend_congresodigital (Branch: main, Commit: a3c14e6)
00:45:10.954 Skipping build cache, deployment was triggered without cache.
00:45:16.310 Cloning completed: 5.370s
00:45:16.620 Running "vercel build"
00:45:17.426 Vercel CLI 48.2.9
00:45:17.752 Installing dependencies...
00:45:30.493 
00:45:30.493 added 144 packages in 12s
00:45:30.494 
00:45:30.494 15 packages are looking for funding
00:45:30.494   run `npm fund` for details
00:45:30.538 Detected Next.js version: 15.4.5
00:45:30.539 Running "next build"
00:45:31.354 Attention: Next.js now collects completely anonymous telemetry regarding usage.
00:45:31.355 This information is used to shape Next.js' roadmap and prioritize features.
00:45:31.355 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
00:45:31.356 https://nextjs.org/telemetry
00:45:31.356 
00:45:31.422    ▲ Next.js 15.4.5
00:45:31.423    - Environments: .env.local
00:45:31.423 
00:45:31.452    Linting and checking validity of types ...
00:45:42.041    Creating an optimized production build ...
00:45:52.182 Failed to compile.
00:45:52.182 
00:45:52.182 pages/_app.tsx
00:45:52.182 An error occurred in `next/font`.
00:45:52.182 
00:45:52.182 Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
00:45:52.182 Require stack:
00:45:52.182 - /vercel/path0/node_modules/lightningcss/node/index.js
00:45:52.183 - /vercel/path0/node_modules/@tailwindcss/node/dist/index.js
00:45:52.183 - /vercel/path0/node_modules/@tailwindcss/postcss/dist/index.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/build/webpack/config/index.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/build/webpack-config.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/build/webpack-build/impl.js
00:45:52.183 - /vercel/path0/node_modules/next/dist/compiled/jest-worker/processChild.js
00:45:52.183     at Function.<anonymous> (node:internal/modules/cjs/loader:1383:15)
00:45:52.183     at /vercel/path0/node_modules/next/dist/server/require-hook.js:57:36
00:45:52.183     at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
00:45:52.183     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
00:45:52.184     at Function._load (node:internal/modules/cjs/loader:1192:37)
00:45:52.184     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
00:45:52.184     at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
00:45:52.184     at Module.<anonymous> (node:internal/modules/cjs/loader:1463:12)
00:45:52.184     at mod.require (/vercel/path0/node_modules/next/dist/server/require-hook.js:68:28)