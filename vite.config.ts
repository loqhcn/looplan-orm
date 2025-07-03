import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { builtinModules } from 'node:module';

export default defineConfig({
	plugins: [
		nodeResolve({
			preferBuiltins: true,
		})
	],
	build: {
		outDir: 'lib',
		target: 'node16',
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'looplan',
			formats: ['es', 'cjs'],
			fileName: (format) => `looplan-orm.${format}.js`
		},
		rollupOptions: {
			external: [
				'axios',
				'mongodb',
				'mysql2',
				...builtinModules,
				/^node:.*/  // 排除所有 Node.js 内置模块
			],
			output: {
				exports: 'named',
				preserveModules: false
			}
		},
	},
});