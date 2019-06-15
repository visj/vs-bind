export default {
  input: 'dist/bench/index.js',
  output: {
    name: '_S_',
    file: 'benchmark/src/dist/Actual.js',
    format: 'umd'
  },
  onwarn: function (warning) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }
  }
}