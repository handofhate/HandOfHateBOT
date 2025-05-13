// ==============================================
//               tailwind.config.js
// ==============================================

module.exports = {
  content: ['./gui/index.html', './gui/**/*.{html,js}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        'alert-success': '#22c55e',
        'alert-error': '#ef4444',
        'alert-warning': '#facc15',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['cyberpunk'],
  },
  safelist: [
    'btn-primary',
    'btn-secondary',
    'btn-accent',
    'btn-neutral',
    'btn-info',
    'btn-success',
    'btn-warning',
    'btn-error',
    'btn-ghost',
    'btn-link',

    'alert-primary',
    'alert-secondary',
    'alert-accent',
    'alert-info',
    'alert-success',
    'alert-warning',
    'alert-error',

    'badge-primary',
    'badge-secondary',
    'badge-accent',
    'badge-info',
    'badge-success',
    'badge-warning',
    'badge-error',

    'tab',
    'tab-active',
    'tabs',
    'tabs-boxed',
    'text-accent',

    'text-primary',
    'text-secondary',
    'text-accent',
    'text-info',
    'text-success',
    'text-warning',
    'text-error',

    'bg-primary',
    'bg-secondary',
    'bg-accent',
    'bg-info',
    'bg-success',
    'bg-warning',
    'bg-error',

    'border-primary',
    'border-secondary',
    'border-accent',
    'border-info',
    'border-success',
    'border-warning',
    'border-error',
    'border-2',
    'border-3',
    'border-4',
  ],
};
