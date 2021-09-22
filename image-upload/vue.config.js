module.exports = {
  chainWebpack: config => {
    config.module
      .rule('mjs$')
      .test(/\.mjs$/)
      .include
      .add(/node_modules/)
      .end()
      .type('javascript/auto')

    config.module
      .rule('js$')
      .test(/\.js$/)
      .include
      .add(/node_modules\/ipfs-core/)
      .add(/node_modules\/@skyekiwi/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
  },
  configureWebpack: {
    resolve: {
      extensions: ['*', '.mjs', '.js', '.vue', '.json']
    }
  }
}
