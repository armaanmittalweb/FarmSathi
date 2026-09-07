/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Manrope for Latin text; Noto Sans Devanagari/Gurmukhi pick up the
        // Hindi/Punjabi glyph ranges automatically via font fallback, so
        // every language actually looks designed instead of tofu-boxed.
        sans: [
          "Manrope",
          "Noto Sans Devanagari",
          "Noto Sans Gurmukhi",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // Primary: a muted moss green — evokes crops without the neon
        // "success green" every dashboard uses.
        moss: {
          50: "#F3F7EE",
          100: "#E3EDD7",
          200: "#C8DCB0",
          300: "#A7C684",
          400: "#86AC5E",
          500: "#67923F",
          600: "#517531",
          700: "#405D28",
          800: "#354B23",
          900: "#2C3D1F",
        },
        // Accent: warm terracotta/clay — sits ~60-70° from moss on the
        // wheel, a warm/cool split rather than a loud complementary clash.
        // Reserved for the handful of moments that should actually pop.
        clay: {
          50: "#FBF2EC",
          100: "#F4DDCB",
          200: "#E7B896",
          300: "#D89361",
          400: "#C87538",
          500: "#B15F27",
          600: "#8E4B1F",
          700: "#713C1A",
        },
        // Neutral: warm sand/cream, never stark white or cold gray — sits
        // in the same warm family as moss + clay so the whole UI reads as
        // one considered palette instead of "brand color on generic gray".
        sand: {
          25: "#FBF9F5",
          50: "#F6F3EC",
          100: "#EEE9DD",
          200: "#DED5C1",
          300: "#C7BA9E",
          400: "#A79A7C",
          500: "#8B7D5E",
          600: "#6E624A",
          700: "#564C3A",
          800: "#3C352A",
          900: "#29241C",
        },
        // Semantic colors, tuned to sit in the same warm family rather
        // than reaching for generic Tailwind red/amber/blue.
        success: "#517531",
        warning: "#B4802A",
        error: "#B8433A",
        info: "#3E6E8E",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        // Shadows tinted toward the neutral palette (sand-900) instead of
        // default black, so elevation feels like part of the same system.
        soft: "0 1px 2px rgba(41,36,28,0.06), 0 4px 16px rgba(41,36,28,0.07)",
        lift: "0 2px 4px rgba(41,36,28,0.08), 0 12px 24px rgba(41,36,28,0.10)",
      },
    },
  },
  plugins: [],
};
