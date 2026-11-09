'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [soloPedir, setSoloPedir] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
        return
      }
      const { data: filas, error } = await supabase
        .from('stock_actual')
        .select('*')
        .order('nombre')
      if (error) setError(error.message)
      else setProductos(filas || [])
    })
  }, [])

  function estado(p) {
    if (p.stock <= 0) return { texto: '🔴 Sin stock', orden: 0 }
    if (p.stock <= p.stock_minimo) return { texto: '🟡 Poco stock', orden: 1 }
    return { texto: '🟢 OK', orden: 2 }
  }

  const lista = productos
    .filter((p) => !soloPedir || p.stock <= p.stock_minimo)
    .sort((a, b) => estado(a).orden - estado(b).orden || a.nombre.localeCompare(b.nombre))

  const aPedir = productos.filter((p) => p.stock <= p.stock_minimo).length

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <a href="/">← Volver a productos</a>
      <h1>Stock</h1>
      <p>
        {aPedir > 0 ? `⚠️ Hay ${aPedir} producto(s) para reponer.` : '✅ Todo el stock está bien.'}
      </p>
      <label>
        <input type="checkbox" checked={soloPedir} onChange={(e) => setSoloPedir(e.target.checked)} />{' '}
        Mostrar solo los que hay que pedir
      </label>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
            <th>Producto</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{p.nombre}</td>
              <td>{p.stock}</td>
              <td>{p.stock_minimo}</td>
              <td>{estado(p).texto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}