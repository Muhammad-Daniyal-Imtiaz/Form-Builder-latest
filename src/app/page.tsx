import HomeClient from './HomeClient'

export const viewport = {
  width: 'device-width',
  initialScale: 0.8,
  maximumScale: 0.8,
  userScalable: false,
}

export default function Home() {
  return <HomeClient />
}
