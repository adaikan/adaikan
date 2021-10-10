const config = {
	mode: 'jit',
	darkMode: 'class',
	purge: ['./src/**/*.{html,js,svelte}'],
	theme: {
		extend: {
			colors: {
				primary: '#456BBA',
				'on-primary': '#fff',

				secondary: '#BA45A5',
				'on-secondary': '#fff',

				complementary: '#BA9445',
				'on-complementary': '#fff',

				tertiary: '#45BA5A',
				'on-tertiary': '#262626'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/aspect-ratio'),
		require('daisyui')
	],
	daisyui: {
		themes: [
			{
				dark: {
					primary: '#456BBA',
					'primary-focus': '#3f73c0',
					'primary-content': '#ffffff',
					secondary: '#BA45A5',
					'secondary-focus': '#c23daf',
					'secondary-content': '#ffffff',
					accent: '#37cdbe',
					'accent-focus': '#2aa79b',
					'accent-content': '#ffffff',
					neutral: '#3d4451',
					'neutral-focus': '#2a2e37',
					'neutral-content': '#ffffff',
					'base-100': '#1F2937',
					'base-200': '#374151',
					'base-300': '#4B5563',
					'base-content': '#F9FAFB',
					info: '#2094f3',
					success: '#009485',
					warning: '#ff9900',
					error: '#ff5724'
				},
				light: {
					primary: '#456BBA',
					'primary-focus': '#3f73c0',
					'primary-content': '#ffffff',
					secondary: '#BA45A5',
					'secondary-focus': '#c23daf',
					'secondary-content': '#ffffff',
					accent: '#37cdbe',
					'accent-focus': '#2aa79b',
					'accent-content': '#ffffff',
					neutral: '#3d4451',
					'neutral-focus': '#2a2e37',
					'neutral-content': '#ffffff',
					'base-100': '#F3F4F6',
					'base-200': '#E5E7EB',
					'base-300': '#D1D5DB',
					'base-content': '#111827',
					info: '#2094f3',
					success: '#009485',
					warning: '#ff9900',
					error: '#ff5724'
				}
			}
		]
	}
};

module.exports = config;
