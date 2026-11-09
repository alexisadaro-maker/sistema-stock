'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function dia(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function Historial() {
  const [ventas, setVentas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
        return
      }
      const { data: filas, error } = await supabase
        .from('ventas')
        .select('id, cantidad, precio_unitario, forma_pago, fecha, productos(nombre)')
        .order('fecha', { ascending: false })
        .limit(500)
      if (error) setError(error.message)
      else setVentas(filas || [])
    })
  }, [])

  // Agrupar por día
  const dias = {}
  for (const v of ventas) {
    const clave = new Date(v.fecha).toLocaleDateString('en-CA') // AAAA-MM-DD
    if (!dias[clave]) dias[clave] = { fecha: v.fecha, total: 0, items: [] }
    dias[clave].total += v.cantidad * v.precio_unitario
    dias[clave].items.push(v)
  }
  const listaDias = Object.keys(dias).sort().reverse()

  return (
    <main style={{ maxWidth: 800, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <a href="/">← Volver a productos</a>
      <h1>Historial de ventas</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {listaDias.length === 0 && !error && <p>Todavía no hay ventas.</p>}

      {listaDias.map((clave) => {
        const d = dias[clave]
        return (
          <section key={clave} style={{ marginBottom: 32 }}>
            <h2 style={{ textTransform: 'capitalize', marginBottom: 4 }}>{dia(d.fecha)}</h2>
            <p style={{ marginTop: 0 }}>
              <strong>Total del día: ${d.total.toLocaleString('es-AR')}</strong> ({d.items.length} ventas)
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                  <th>Hora</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Total</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td>{new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{v.productos?.nombre}</td>
                    <td>{v.cantidad}</td>
                    <td>${v.precio_unitario}</td>
                    <td>${(v.cantidad * v.precio_unitario).toLocaleString('es-AR')}</td>
                    <td>{v.forma_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </main>
  )
}