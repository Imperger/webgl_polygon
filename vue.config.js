module.exports = {
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