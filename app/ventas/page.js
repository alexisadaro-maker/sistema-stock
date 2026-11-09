'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Ventas() {
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [metodoPago, setMetodoPago] = useState('Efectivo')
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

  // Filtrado de sugerencias en tiempo real
  const sugerencias = busqueda.trim() === ''
    ? []
    : productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  function seleccionarProducto(prod) {
    setProductoSeleccionado(prod)
    setBusqueda(prod.nombre)
    setMostrarSugerencias(false)
    setError('')
  }

  function agregarAlCarrito(e) {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!productoSeleccionado) {
      return setError('Por favor seleccioná un producto de las sugerencias o de la lista.')
    }

    const cantNum = Number(cantidad)
    if (cantNum <= 0) return setError('La cantidad debe ser mayor a 0')
    if (cantNum > productoSeleccionado.stock) {
      return setError(`Stock insuficiente para ${productoSeleccionado.nombre} (Disponible: ${productoSeleccionado.stock})`)
    }

    const existeIndice = carrito.findIndex((item) => String(item.id) === String(productoSeleccionado.id))
    if (existeIndice >= 0) {
      const nuevoCarrito = [...carrito]
      const nuevaCant = nuevoCarrito[existeIndice].cantidad + cantNum
      if (nuevaCant > productoSeleccionado.stock) {
        return setError(`Supera el stock disponible de ${productoSeleccionado.nombre}`)
      }
      nuevoCarrito[existeIndice].cantidad = nuevaCant
      nuevoCarrito[existeIndice].subtotal = nuevaCant * productoSeleccionado.precio
      setCarrito(nuevoCarrito)
    } else {
      setCarrito([
        ...carrito,
        {
          id: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          precio: productoSeleccionado.precio,
          cantidad: cantNum,
          subtotal: cantNum * productoSeleccionado.precio,
        },
      ])
    }

    // Resetear buscador y producto seleccionado
    setProductoSeleccionado(null)
    setBusqueda('')
    setCantidad(1)
  }

  function eliminarDelCarrito(id) {
    setCarrito(carrito.filter((item) => String(item.id) !== String(id)))
  }

  async function registrarVentaCombo() {
    if (carrito.length === 0) return setError('El carrito está vacío')
    setError('')
    setMensaje('')

    const registrosCompletos = carrito.map((item) => ({
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      metodo_pago: metodoPago,
    }))

    const { error: ventaError } = await supabase.from('ventas').insert(registrosCompletos)

    if (ventaError) {
      const registrosSimples = carrito.map((item) => ({
        producto_id: item.id,
        cantidad: item.cantidad,
      }))
      const { error: err2 } = await supabase.from('ventas').insert(registrosSimples)
      if (err2) return setError(err2.message)
    }

    setMensaje(`¡Venta cobrada con ${metodoPago} y registrada con éxito!`)
    setCarrito([])
    setMetodoPago('Efectivo')
    cargarProductos()
  }

  const totalVenta = carrito.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <main>
      <h1>Registrar Venta (Combos / Múltiples Ítems)</h1>

      <div className="card">
        {/* Buscador inteligente con lista de sugerencias clickeables */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
            🔍 Buscar o seleccionar producto:
          </label>
          
          <input
            placeholder="Escribí para buscar (ej: Cerveza, Fernet, Papas)..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setProductoSeleccionado(null)
              setMostrarSugerencias(true)
            }}
            onFocus={() => setMostrarSugerencias(true)}
            style={{ width: '100%' }}
          />

          {/* Menú flotante de sugerencias */}
          {mostrarSugerencias && sugerencias.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              listStyle: 'none',
              marginTop: 4,
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 50,
              padding: 0
            }}>
              {sugerencias.map((p) => (
                <li
                  key={p.id}
                  onClick={() => seleccionarProducto(p)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s'
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Evita perder foco antes del click
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    ${p.precio} | Stock: <strong style={{ color: p.stock <= 5 ? '#dc2626' : '#16a34a' }}>{p.stock}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Formulario de cantidad y agregar */}
        <form onSubmit={agregarAlCarrito} className="inline-form">
          {/* Menú desplegable tradicional como alternativa */}
          <select
            value={productoSeleccionado ? productoSeleccionado.id : ''}
            onChange={(e) => {
              const prod = productos.find((p) => String(p.id) === String(e.target.value))
              if (prod) seleccionarProducto(prod)
            }}
          >
            <option value="">-- O elegí de la lista completa --</option>
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

        {productoSeleccionado && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#e0f2fe', borderRadius: 6, color: '#0369a1', fontSize: '0.9rem', fontWeight: 600 }}>
            ✓ Seleccionado: {productoSeleccionado.nombre} — ${productoSeleccionado.precio} (Stock disponible: {productoSeleccionado.stock})
          </div>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</p>}
      {mensaje && <p style={{ color: '#16a34a', marginBottom: 16, fontWeight: 'bold' }}>{mensaje}</p>}

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Método de pago:</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  style={{ width: 'auto', minWidth: 180, fontWeight: 600 }}
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Transferencia">🏦 Transferencia</option>
                  <option value="Mercado Pago">📲 Mercado Pago</option>
                  <option value="Tarjeta de Crédito">💳 Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">💳 Tarjeta de Débito</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  Total: ${totalVenta}
                </div>
                <button onClick={registrarVentaCombo} className="btn" style={{ padding: '12px 20px', fontSize: '1rem' }}>
                  🛒 Confirmar y Descontar Stock
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}