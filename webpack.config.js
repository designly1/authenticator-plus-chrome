const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const jsConfig = {
	mode: 'production',
	entry: glob.sync('./src/js/**/*.js').reduce((entries, file) => {
		const name = path.relative('./src/js', file).replace(/\.js$/, '');
		entries[name] = path.resolve(file);
		return entries;
	}, {}),
	resolve: {
		extensions: ['.js'],
		alias: {
			'@lib': path.resolve(__dirname, 'src/lib'),
		},
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist/js'),
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{
									targets: {
										chrome: '88',
									},
								},
							],
						],
					},
				},
			},
		],
	},
};

const withOptimization = Object.assign({}, jsConfig, {
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						unused: true,
						dead_code: true,
						drop_console: false,
						passes: 2,
					},
					mangle: {
						reserved: ['chrome'],
					},
					format: {
						comments: /@preserve|@license|@cc_on/i,
					},
				},
				extractComments: false,
			}),
		],
	},
});

const cssConfig = {
	mode: 'development',
	entry: {
		styles: './src/styles.scss',
	},
	output: {
		path: path.resolve(__dirname, 'dist/css'),
	},
	plugins: [
		new RemoveEmptyScriptsPlugin(),
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
	],
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
			},
		],
	},
	optimization: {
		minimize: true,
		minimizer: [
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						'default',
						{
							discardComments: { removeAll: true },
						},
					],
				},
			}),
		],
	},
};

const copyConfig = {
	mode: 'production',
	entry: {}, // Empty entry point
	output: {
		path: path.resolve(__dirname, 'dist'),
	},
	performance: {
		maxAssetSize: 10000000,
		maxEntrypointSize: 10000000,
		hints: 'warning',
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, 'src/assets'),
					to: path.resolve(__dirname, 'dist/assets'),
				},
				{
					from: path.resolve(__dirname, 'src/vendor'),
					to: path.resolve(__dirname, 'dist/vendor'),
				},
				{
					from: path.resolve(__dirname, 'src/html'),
					to: path.resolve(__dirname, 'dist/html'),
				},
				{
					from: path.resolve(__dirname, 'src/sw.js'),
					to: path.resolve(__dirname, 'dist/sw.js'),
				},
				{
					from: path.resolve(__dirname, 'src/manifest.json'),
					to: path.resolve(__dirname, 'dist/manifest.json'),
				},
			],
		}),
	],
};

module.exports = [withOptimization, cssConfig, copyConfig];
