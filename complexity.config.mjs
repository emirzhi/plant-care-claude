import coreWebVitals from 'eslint-config-next/core-web-vitals'

export default [
  {
    ignores: [
      '**/node_modules/**', '**/.next/**', '**/coverage/**', '**/public/**',
      '**/*.test.js', '**/*.test.jsx', '**/__tests__/**',
      '**/*.config.mjs', '**/*.config.js',
    ],
  },
  ...coreWebVitals,
  { rules: { complexity: ['warn', 0] } },
]