'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [formaPago, setFormaPago] = useState('efectivo')
  const [mensaje, setMensaje] = useState('')

  async function cargar() {
    const { data } = await supabase.from('stock_actual').select('*').order('nombre')
    setProductos(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login'
      else cargar()
    })
  }, [])

  async function guardar(e) {
    e.preventDefault()
    setMensaje('')
    const producto = productos.find((p) => p.id === Number(productoId))
    if (!producto) return setMensaje('Elegí un producto')
    if (Number(cantidad) > producto.stock) {
      return setMensaje(`No alcanza el stock: quedan ${producto.stock}`)
    }
    const { error } = await supabase.from('ventas').insert({
      producto_id: producto.id,
      cantidad: Number(cantidad),
      precio_unitario: producto.precio,
      forma_pago: formaPago,
    })
    if (error) return setMensaje('Error: ' + error.message)
    setMensaje(`✅ Venta guardada: $${producto.precio * Number(cantidad)}`)
    setCantidad('')
    cargar()
  }

  return (
    <main style={{ maxWidth: 500, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <a href="/">← Volver a productos</a>
      <h1>Cargar venta</h1>
      <form onSubmit={guardar} style={{ display: 'grid', gap: 8 }}>
        <select value={productoId} onChange={(e) => setProductoId(e.target.value)} required style={{ padding: 8 }}>
          <option value="">Elegí un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>
          ))}
        </select>
        <input type="number" min="1" placeholder="Cantidad" value={cantidad}
          onChange={(e) => setCantidad(e.target.value)} required style={{ padding: 8 }} />
        <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)} style={{ padding: 8 }}>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="mercadopago">Mercado Pago</option>
        </select>
        <button type="submit" style={{ padding: 8 }}>Guardar venta</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </main>
  )
}