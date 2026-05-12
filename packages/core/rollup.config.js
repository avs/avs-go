import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import summary from 'rollup-plugin-summary';

export default {
  input: 'dist/index.js',
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    resolve(),
    terser({
      ecma: 2021,
      module: true,
      warnings: true
    }),
    summary()
  ],
  output: {
    file: 'dist/avs-go.min.js',
    format: 'umd',
    name: 'AvsGo'
  }
}