'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [productos, setProductos] = useState([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stockInicial, setStockInicial] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')

  async function cargar() {
    const { data, error } = await supabase
      .from('stock_actual')
      .select('*')
      .order('nombre')
    if (error) setError(error.message)
    else setProductos(data || [])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login'
      else cargar()
    })
  }, [])

  async function agregar(e) {
    e.preventDefault()
    setError('')

    // 1. Crear producto en la base de datos
    const { data: prodData, error: prodError } = await supabase
      .from('productos')
      .insert({ nombre, precio: Number(precio) })
      .select()
      .single()

    if (prodError) return setError(prodError.message)

    // 2. Registrar el stock inicial como primera compra si es mayor a 0
    const cantInicial = Number(stockInicial)
    if (cantInicial > 0 && prodData) {
      const { error: compraError } = await supabase
        .from('compras')
        .insert({ producto_id: prodData.id, cantidad: cantInicial })
      
      if (compraError) {
        await supabase.from('productos').update({ stock: cantInicial }).eq('id', prodData.id)
      }
    }

    setNombre('')
    setPrecio('')
    setStockInicial('')
    cargar()
  }

  async function cambiarPrecio(id, actual) {
    const nuevo = prompt('Nuevo precio:', actual)
    if (nuevo === null || nuevo === '') return
    const { error } = await supabase
      .from('productos')
      .update({ precio: Number(nuevo) })
      .eq('id', id)
    if (error) return setError(error.message)
    cargar()
  }

  async function archivar(id, nombre, stock) {
    if (stock !== 0) return setError('Solo se pueden archivar productos con stock 0')
    const ok = confirm(`¿Archivar "${nombre}"? Desaparece de la lista, pero el historial de ventas se conserva.`)
    if (!ok) return
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)
    if (error) return setError(error.message)
    cargar()
  }

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <main>
      <h1>Productos</h1>

      <div className="card">
        <form onSubmit={agregar} className="inline-form">
          <input
            placeholder="Nombre (ej: Cerveza Stella 1L)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            placeholder="Precio ($)"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
          <input
            placeholder="Stock inicial"
            type="number"
            value={stockInicial}
            onChange={(e) => setStockInicial(e.target.value)}
            required
          />
          <button type="submit" className="btn">+ Agregar Producto</button>
        </form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</p>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td>${p.precio}</td>
                <td>
                  <span className={`badge ${p.stock <= 0 ? 'badge-danger' : p.stock <= (p.stock_minimo || 5) ? 'badge-warning' : 'badge-success'}`}>
                    {p.stock ?? 0} {p.stock <= (p.stock_minimo || 5) ? '⚠️' : ''}
                  </span>
                </td>
                <td>
                  <button onClick={() => cambiarPrecio(p.id, p.precio)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                    Editar precio
                  </button>
                  {p.stock === 0 && (
                    <button
                      onClick={() => archivar(p.id, p.nombre, p.stock)}
                      className="btn btn-danger"
                      style={{ marginLeft: 6, padding: '4px 8px', fontSize: '0.8rem' }}
                    >
                      Archivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}