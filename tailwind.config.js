/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        'main.jsx',
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                yellow: {
                    50: '#fefce8',
                    900: '#713f12'
                }
            }
        },
    },
    plugins: [],
} 