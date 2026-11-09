'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Compras() {
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
        return
      }
      supabase.from('productos').select('id, nombre').eq('activo', true).order('nombre')
        .then(({ data }) => setProductos(data || []))
    })
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setMensaje('')
    const { error } = await supabase.from('compras').insert({
      producto_id: Number(productoId),
      cantidad: Number(cantidad),
      costo: Number(costo) || 0,
    })
    if (error) return setMensaje('Error: ' + error.message)
    setMensaje('✅ Compra guardada, el stock subió')
    setCantidad('')
    setCosto('')
  }

  return (
    <main style={{ maxWidth: 500, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <a href="/">← Volver a productos</a>
      <h1>Cargar compra</h1>
      <form onSubmit={guardar} style={{ display: 'grid', gap: 8 }}>
        <select value={productoId} onChange={(e) => setProductoId(e.target.value)} required style={{ padding: 8 }}>
          <option value="">Elegí un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={cantidad}
          onChange={(e) => setCantidad(e.target.value)} required style={{ padding: 8 }} />
        <input type="number" placeholder="Costo total (opcional)" value={costo}
          onChange={(e) => setCosto(e.target.value)} style={{ padding: 8 }} />
        <button type="submit" style={{ padding: 8 }}>Guardar compra</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </main>
  )
}