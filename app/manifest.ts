import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CityAlert',
    short_name: 'CityAlert',
    description:
      'Segnala buche, fontanelle guaste, erba alta e problemi urbani in tempo reale. La mappa civica del tuo comune.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f4fa',
    theme_color: '#f2f4fa',
    lang: 'it',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
