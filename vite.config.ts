import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'node:module';

export default defineConfig({
	resolve: {
		// 指定导入时启用的条件导出（package.json 中的 "exports" 字段）
		// 设置为 'node'，确保优先解析 `exports.node` 或 `exports["node"]`
		conditions: ['node'],
		// 指定在导入时优先考虑的字段（package.json 中的 "main" 字段）
		// 设置为 ['module', 'main']，确保优先解析 `module` 字段
		mainFields: ['module', 'main'],
		// 是否保留符号链接（symlinks）
		// 设置为 false，确保不保留符号链接
		preserveSymlinks: false,
	},
	build: {
		outDir: 'lib',
		target: 'node16',
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'LooplanOrm',
			formats: ['es', 'cjs'],
			fileName: (format) => `looplan-orm.${format}.js`
		},
		rollupOptions: {
			external: [
				'axios',
				'mongodb',
				'mysql2',
				'mysql2/promise',
				// ...builtinModules,
				// /^node:.*/  // 排除所有 Node.js 内置模块
			],
			output: {
				exports: 'named',
				preserveModules: false
			}
		},
	}
});