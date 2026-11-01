import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rerise', short_name: 'Rerise', description: 'Strength plans and coaching, in one private place.',
    start_url: '/', display: 'standalone', background_color: '#FBF4F2', theme_color: '#9C3E63',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
