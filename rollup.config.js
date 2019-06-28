export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/es/vs-bind.js',
      format: 'esm'
    }
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/vs-bind.js',
      format: 'cjs'
    }
  }
]