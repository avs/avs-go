import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: [
    'src/avs-go.js'
  ],
  plugins: [
    nodeResolve(),
    terser()
  ],
  output: {
    file: 'dist/avs-go.min.js',
    format: 'umd'
  }
}