import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '리아쌤 OS',
    short_name: '리아쌤 OS',
    description: 'IB 전문 1인 강사 통합 운영 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f7fb',
    theme_color: '#2c57cd',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
