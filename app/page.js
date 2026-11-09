'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [productos, setProductos] = useState([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
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
    const { error } = await supabase
      .from('productos')
      .insert({ nombre, precio: Number(precio) })
    if (error) return setError(error.message)
    setNombre('')
    setPrecio('')
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
            placeholder="Nombre (ej: Bidón 20 L)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <input
            placeholder="Precio"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            style={{ width: 140 }}
          />
          <button type="submit" className="btn">+ Agregar</button>
        </form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="🔍 Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>Error: {error}</p>}

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
                  <span className={`badge ${p.stock <= 0 ? 'badge-danger' : p.stock <= p.stock_minimo ? 'badge-warning' : 'badge-success'}`}>
                    {p.stock} {p.stock <= p.stock_minimo ? '⚠️' : ''}
                  </span>
                </td>
                <td>
                  <button onClick={() => cambiarPrecio(p.id, p.precio)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
                    Editar precio
                  </button>
                  {p.stock === 0 && (
                    <button
                      onClick={() => archivar(p.id, p.nombre, p.stock)}
                      className="btn btn-danger"
                      style={{ marginLeft: 8, padding: '4px 10px', fontSize: '0.85rem' }}
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

      {filtrados.length === 0 && productos.length > 0 && (
        <p style={{ marginTop: 16, color: '#64748b' }}>No se encontraron productos con "{busqueda}".</p>
      )}
    </main>
  )
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
    const { error } = await supabase
      .from('productos')
      .insert({ nombre, precio: Number(precio) })
    if (error) return setError(error.message)
    setNombre('')
    setPrecio('')
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

  async function salir() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
  return (
    <main style={{ maxWidth: 700, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1>Productos</h1>
      <p>
        <a href="/compras">Cargar compra</a> | <a href="/ventas">Cargar venta</a> |{' '}
        <a href="/stock">Stock</a> | <a href="/historial">Historial</a> |{' '}
        <button onClick={salir}>Cerrar sesión</button>
      </p>

      <form onSubmit={agregar} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Nombre (ej: Bidón 20 L)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ flex: 1, padding: 8 }}
        />
        <input
          placeholder="Precio"
          type="number"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
          style={{ width: 100, padding: 8 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Agregar</button>
      </form>
            <input
        placeholder="🔍 Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 16, boxSizing: 'border-box' }}
      />

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        {filtrados.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{p.nombre}</td>
              <td>${p.precio}</td>
              <td>
                {p.stock} {p.stock <= p.stock_minimo && '⚠️'}
              </td>
              <td>
                <button onClick={() => cambiarPrecio(p.id, p.precio)}>
                  Cambiar precio
                </button>
                {p.stock === 0 && (
                  <button
                    onClick={() => archivar(p.id, p.nombre, p.stock)}
                    style={{ marginLeft: 8 }}
                  >
                    Archivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>       {filtrados.length === 0 && productos.length > 0 && (
        <p>No se encontraron productos con "{busqueda}".</p>
      )}
    </main>
  )
}