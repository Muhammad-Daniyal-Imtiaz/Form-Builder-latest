import HomeClient from './HomeClient'

export const viewport = {
  width: 'device-width',
  initialScale: 0.9,
  minimumScale: 0.9,
  maximumScale: 0.9,
  userScalable: false,
}

export default function Home() {
  return <HomeClient />
}
