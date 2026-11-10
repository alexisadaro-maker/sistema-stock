'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Balance() {
  const [periodo, setPeriodo] = useState('semana')
  const [ventas, setVentas] = useState([])
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ahora, setAhora] = useState(null)

  useEffect(() => {
    setAhora(new Date())
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = '/login'
      else cargarDatos()
    })
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setError('')

    const { data: dataVentas, error: errVentas } = await supabase
      .from('ventas')
      .select('*, productos(nombre)')

    const { data: dataCompras, error: errCompras } = await supabase
      .from('compras')
      .select('*, productos(nombre)')

    if (errVentas || errCompras) {
      setError(errVentas?.message || errCompras?.message)
    } else {
      setVentas(dataVentas || [])
      setCompras(dataCompras || [])
    }
    setCargando(false)
  }

  function obtenerFecha(item) {
    return item?.created_at || item?.fecha || null
  }

  function esDeLaSemanaActual(fechaStr) {
    if (!fechaStr || !ahora) return false
    const fecha = new Date(fechaStr)
    const inicioSemana = new Date(ahora)
    const dia = ahora.getDay()
    const diff = ahora.getDate() - dia + (dia === 0 ? -6 : 1)
    inicioSemana.setDate(diff)
    inicioSemana.setHours(0, 0, 0, 0)
    return fecha >= inicioSemana
  }

  function esDelMesActual(fechaStr) {
    if (!fechaStr || !ahora) return false
    const fecha = new Date(fechaStr)
    return (
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    )
  }

  const filtroFn = periodo === 'semana' ? esDeLaSemanaActual : esDelMesActual

  const ventasFiltradas = ventas.filter((v) => filtroFn(obtenerFecha(v)))
  const comprasFiltradas = compras.filter((c) => filtroFn(obtenerFecha(c)))

  const totalVentas = ventasFiltradas.reduce((acc, v) => {
    const subtotal = v.precio_unitario ? v.precio_unitario * v.cantidad : 0
    return acc + subtotal
  }, 0)

  const totalCompras = comprasFiltradas.reduce((acc, c) => {
    return acc + (Number(c.costo_total) || 0)
  }, 0)

  const balanceNeto = totalVentas - totalCompras

  const ventasPorMetodo = ventasFiltradas.reduce((acc, v) => {
    const metodo = v.metodo_pago || 'Efectivo'
    const monto = v.precio_unitario ? v.precio_unitario * v.cantidad : 0
    acc[metodo] = (acc[metodo] || 0) + monto
    return acc
  }, {})

  return (
    <main>
      <h1>Balance Financiero</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setPeriodo('semana')}
          className={`btn ${periodo === 'semana' ? '' : 'btn-secondary'}`}
        >
          📅 Esta Semana
        </button>
        <button
          onClick={() => setPeriodo('mes')}
          className={`btn ${periodo === 'mes' ? '' : 'btn-secondary'}`}
        >
          📆 Este Mes
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</p>}

      {cargando || !ahora ? (
        <p>Cargando balance...</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ borderLeft: '5px solid #16a34a' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                INGRESOS (VENTAS)
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#16a34a', marginTop: 4 }}>
                ${totalVentas.toLocaleString()}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {ventasFiltradas.length} operaciones
              </p>
            </div>

            <div className="card" style={{ borderLeft: '5px solid #ef4444' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                EGRESOS (COMPRAS)
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#ef4444', marginTop: 4 }}>
                ${totalCompras.toLocaleString()}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {comprasFiltradas.length} reposiciones
              </p>
            </div>

            <div
              className="card"
              style={{
                borderLeft: `5px solid ${balanceNeto >= 0 ? '#2563eb' : '#dc2626'}`,
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                BALANCE NETO (GANANCIA)
              </span>
              <h2
                style={{
                  fontSize: '1.8rem',
                  color: balanceNeto >= 0 ? '#2563eb' : '#dc2626',
                  marginTop: 4,
                }}
              >
                ${balanceNeto.toLocaleString()}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {periodo === 'semana' ? 'Resumen semanal' : 'Resumen mensual'}
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>
              💳 Ventas por Método de Pago
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
              }}
            >
              {Object.keys(ventasPorMetodo).length === 0 ? (
                <p style={{ color: '#64748b' }}>No hay ventas registradas en este período.</p>
              ) : (
                Object.entries(ventasPorMetodo).map(([metodo, monto]) => (
                  <div
                    key={metodo}
                    style={{
                      background: '#f8fafc',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{metodo}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                      ${monto.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>
              📜 Detalle de Ventas ({periodo === 'semana' ? 'Esta Semana' : 'Este Mes'})
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio Un.</th>
                    <th>Total</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                        Sin registros en este período.
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((v) => {
                      const f = obtenerFecha(v)
                      return (
                        <tr key={v.id}>
                          <td>
                            {f
                              ? new Date(f).toLocaleString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td>
                            <strong>{v.productos?.nombre || 'Producto sin nombre'}</strong>
                          </td>
                          <td>{v.cantidad}</td>
                          <td>${v.precio_unitario || 0}</td>
                          <td>
                            <strong>${(v.precio_unitario || 0) * v.cantidad}</strong>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{ background: '#e2e8f0', color: '#334155' }}
                            >
                              {v.metodo_pago || 'Efectivo'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
