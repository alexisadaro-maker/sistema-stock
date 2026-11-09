'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function cargarProductos() {
    const { data, error } = await supabase
      .from('stock_actual')
      .select('*')
      .gt('stock', 0)
      .order('nombre')
    if (error) setError(error.message)
    else setProductos(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login'
      else cargarProductos()
    })
  }, [])

  function agregarAlCarrito(e) {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!productoSeleccionado) {
      return setError('Por favor seleccioná un producto de la lista.')
    }

    // Conversión explícita a String para comparar números y texto sin errores
    const prod = productos.find((p) => String(p.id) === String(productoSeleccionado))
    if (!prod) {
      return setError('No se encontró el producto seleccionado.')
    }

    const cantNum = Number(cantidad)
    if (cantNum <= 0) return setError('La cantidad debe ser mayor a 0')
    if (cantNum > prod.stock) return setError(`Stock insuficiente para ${prod.nombre} (Disponible: ${prod.stock})`)

    const existeIndice = carrito.findIndex((item) => String(item.id) === String(prod.id))
    if (existeIndice >= 0) {
      const nuevoCarrito = [...carrito]
      const nuevaCant = nuevoCarrito[existeIndice].cantidad + cantNum
      if (nuevaCant > prod.stock) return setError(`Supera el stock disponible de ${prod.nombre}`)
      nuevoCarrito[existeIndice].cantidad = nuevaCant
      nuevoCarrito[existeIndice].subtotal = nuevaCant * prod.precio
      setCarrito(nuevoCarrito)
    } else {
      setCarrito([
        ...carrito,
        {
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          cantidad: cantNum,
          subtotal: cantNum * prod.precio,
        },
      ])
    }

    setProductoSeleccionado('')
    setCantidad(1)
  }

  function eliminarDelCarrito(id) {
    setCarrito(carrito.filter((item) => String(item.id) !== String(id)))
  }

  async function registrarVentaCombo() {
    if (carrito.length === 0) return setError('El carrito está vacío')
    setError('')
    setMensaje('')

    const registros = carrito.map((item) => ({
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
    }))

    const { error: ventaError } = await supabase.from('ventas').insert(registros)

    if (ventaError) {
      const registrosSimples = carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      }))
      const { error: err2 } = await supabase.from('ventas').insert(registrosSimples)
      if (err2) return setError(err2.message)
    }

    setMensaje('¡Venta registrada con éxito!')
    setCarrito([])
    cargarProductos()
  }

  const totalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <main>
      <h1>Registrar Venta (Combos / Múltiples Ítems)</h1>

      <div className="card">
        <form onSubmit={agregarAlCarrito} className="inline-form">
          <select
            value={productoSeleccionado}
            onChange={(e) => setProductoSeleccionado(e.target.value)}
            required
          >
            <option value="">-- Seleccionar producto --</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} - ${p.precio} (Stock: {p.stock})
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Cant."
            style={{ width: 90 }}
            required
          />

          <button type="submit" className="btn btn-secondary">
            + Agregar a la venta
          </button>
        </form>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</p>}
      {mensaje && <p style={{ color: '#16a34a', marginBottom: 16 }}>{mensaje}</p>}

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Resumen de la Venta</h2>
        
        {carrito.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay productos agregados a esta venta aún.</p>
        ) : (
          <>
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio Un.</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.cantidad}</td>
                      <td>${item.precio}</td>
                      <td>${item.subtotal}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => eliminarDelCarrito(item.id)}
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Total: ${totalVenta}
              </div>
              <button onClick={registrarVentaCombo} className="btn" style={{ padding: '12px 20px', fontSize: '1rem' }}>
                🛒 Confirmar y Descontar Stock
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}