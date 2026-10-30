import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                heading: ['"Playfair Display"', 'serif'],
                playfair: ['"Playfair Display"', 'serif'],
            },
            colors: {
                text: '#17221F',
                'text-secondary': '#5F6B68',
                primary: '#FFA500',
                'bg-site': '#F8F6F0',
                'bg-fallback': '#f3ede1',
            },
        },
    },
    plugins: [],
};
