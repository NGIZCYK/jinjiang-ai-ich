/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#20231f',
          deep: '#151815',
          muted: '#6f716b',
        },
        paper: {
          DEFAULT: '#f3efe7',
          light: '#fbf8f2',
          dark: '#e9e2d7',
        },
        jade: {
          DEFAULT: '#2b4a42',
          dark: '#203a34',
          deep: '#162b27',
          light: '#e7eeeb',
        },
        silk: {
          DEFAULT: '#9e2a2b',
          light: '#fdf4f4',
        },
        vermilion: {
          DEFAULT: '#843b37',
          dark: '#692d2a',
          light: '#f7efed',
        },
        gold: {
          DEFAULT: '#a38a63',
          dark: '#816d4e',
          light: '#f6f1e8',
        },
        slate: {
          silk: '#475569',
        },
      },
      fontFamily: {
        serif: [
          '"Songti SC"',
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          'STSong',
          'SimSun',
          'Georgia',
          'serif',
        ],
        sans: [
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
