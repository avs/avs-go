"use strict";

module.exports = {
	entry: [
		"@babel/polyfill",
		"./node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js",
		"./node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js",
		"./src/avs-go-dataviz.js",
		"./src/avs-go-dynamic-html.js",
        "./src/avs-go-info.js"
	],
    output: {
        filename: "avs-go.min.js"
    },
    module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ["@babel/preset-env"],
						plugins: ["@babel/plugin-transform-classes"]
					}
				}
			}
		]
	}
};