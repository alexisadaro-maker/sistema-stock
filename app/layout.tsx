import './globals.css'
import Navbar from '../lib/Navbar'

export const metadata = {
  title: 'Sistema de Stock y Ventas',
  description: 'Gestión de inventario y pedidos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}