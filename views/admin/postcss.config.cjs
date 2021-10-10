const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
// const cssnano = require("cssnano");

/**
 * @type {{env: ImportMetaEnv}}
 */
const { env } = process;

const config = {
	plugins: [
		tailwindcss(),
		autoprefixer()
		// !dev &&
		// 	cssnano({
		// 		preset: 'default'
		// 	})
	]
};

module.exports = config;
