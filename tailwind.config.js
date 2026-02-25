/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Premium/Dark Tech Palette
                background: "#040405", // Deeper background
                surface: "#121214",    // Slightly elevated surface
                surfaceHighlight: "#1c1c1f", // For glowing borders / hovers
                primary: "#4f46e5",    // Rich Indigo
                primaryGlow: "#818cf8", // Lighter indigo for glows
                secondary: "#d946ef",  // Vibrant Fuchsia
                secondaryGlow: "#f0abfc", // Lighter fuchsia for glows
                success: "#10b981",    // Emerald
                error: "#f43f5e",      // Rose
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan': 'scan 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(15px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scan: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(200%)' },
                }
            }
        },
    },
    plugins: [],
}
