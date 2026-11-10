'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Compras() {
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [cantidad, setCantidad] = useState('')
  const [costoTotal, setCostoTotal] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function cargarProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
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

  const sugerencias = busqueda.trim() === ''
    ? []
    : productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  function seleccionarProducto(prod) {
    setProductoSeleccionado(prod)
    setBusqueda(prod.nombre)
    setMostrarSugerencias(false)
    setError('')
  }

  async function guardarCompra(e) {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!productoSeleccionado) {
      return setError('Por favor seleccioná un producto de las sugerencias o de la lista.')
    }

    const cantNum = Number(cantidad)
    if (cantNum <= 0) return setError('La cantidad debe ser mayor a 0')

    const payload = {
      producto_id: productoSeleccionado.id,
      cantidad: cantNum,
    }

    if (costoTotal !== '') {
      payload.costo_total = Number(costoTotal)
    }

    const { error: compraError } = await supabase.from('compras').insert(payload)

    if (compraError) return setError(compraError.message)

    setMensaje(`¡Compra de ${cantNum} unidad(es) de ${productoSeleccionado.nombre} ingresada con éxito!`)
    setProductoSeleccionado(null)
    setBusqueda('')
    setCantidad('')
    setCostoTotal('')
    cargarProductos()
  }

  return (
    <main>
      <div style={{ marginBottom: 12 }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          &larr; Volver a productos
        </a>
      </div>

      <h1>Cargar compra</h1>

      <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' }}>
            🔍 Buscar producto:
          </label>
          <input
            placeholder="Escribí para buscar (ej: Cerveza, Fernet)..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setProductoSeleccionado(null)
              setMostrarSugerencias(true)
            }}
            onFocus={() => setMostrarSugerencias(true)}
            style={{ width: '100%' }}
          />

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
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 50,
              padding: 0
            }}>
              {sugerencias.map((p) => (
                <li
                  key={p.id}
                  onClick={() => seleccionarProducto(p)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    ${p.precio}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={guardarCompra} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>
              O elegir de la lista desplegable:
            </label>
            <select
              value={productoSeleccionado ? productoSeleccionado.id : ''}
              onChange={(e) => {
                const prod = productos.find((p) => String(p.id) === String(e.target.value))
                if (prod) seleccionarProducto(prod)
              }}
              style={{ width: '100%' }}
            >
              <option value="">-- Elegí un producto --</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (${p.precio})
                </option>
              ))}
            </select>
          </div>

          {productoSeleccionado && (
            <div style={{ padding: '8px 12px', background: '#e0f2fe', borderRadius: 6, color: '#0369a1', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ Seleccionado: {productoSeleccionado.nombre}
            </div>
          )}

          <input
            type="number"
            min="1"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
            style={{ width: '100%' }}
          />

          <input
            type="number"
            placeholder="Costo total (opcional)"
            value={costoTotal}
            onChange={(e) => setCostoTotal(e.target.value)}
            style={{ width: '100%' }}
          />

          <button type="submit" className="btn" style={{ marginTop: 6, width: '100%', padding: '12px' }}>
            Guardar compra
          </button>
        </form>

        {error && <p style={{ color: '#ef4444', marginTop: 14, fontSize: '0.9rem' }}>Error: {error}</p>}
        {mensaje && <p style={{ color: '#16a34a', marginTop: 14, fontSize: '0.9rem', fontWeight: 'bold' }}>{mensaje}</p>}
      </div>
    </main>
  )
