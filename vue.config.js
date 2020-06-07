module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
    ? '/webgl_polygon/'
    : '/',
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.(vert|frag)$/,
                    loader: 'ts-shader-loader'
                }
            ]
        }
    }
}