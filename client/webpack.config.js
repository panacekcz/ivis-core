const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        index: ['babel-polyfill', './src/root.js'],
        'index-untrusted': ['babel-polyfill', './src/root-untrusted.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/client/'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: path.join(__dirname, 'node_modules'),
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['env', {
                                    targets: {
                                        modules: false,
                                        browsers: ['> 10%']
                                    }
                                }],
                                'stage-1'
                            ],
                            plugins: ['transform-react-jsx', 'transform-decorators-legacy', 'transform-function-bind']
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.(png|jpg|gif|woff2?|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192 // inline base64 URLs for <=8k images, direct URLs for the rest
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                exclude: path.join(__dirname, 'node_modules'),
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[path][name]__[local]--[hash:base64:5]'
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /bootstrap\/dist\/js\//,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            jQuery: 'jquery'
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192 // inline base64 URLs for <=8k images, direct URLs for the rest
                        }
                    }
                ]
            },
            {
                test: /\.(ttf|eot)$/,
                use: [ 'file-loader' ]
            }
        ]
    },
    externals: {
        csfrToken: 'csfrToken',
        ivisConfig: 'ivisConfig'
    },
    plugins: [
//        new webpack.optimize.UglifyJsPlugin()
        new webpack.ProvidePlugin({
            jQuery: 'jquery'
        })
    ],
    watchOptions: {
        ignored: 'node_modules/',
        poll: 1000
    },
    resolve: {
    }
};
