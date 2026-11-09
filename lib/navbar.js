'use client'

import { supabase } from './supabase'

export default function Navbar() {
  async function salir() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 16px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2563eb', textDecoration: 'none' }}>
          📦 StockApp
        </a>
        
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>Productos</a>
          <a href="/compras" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>+ Compra</a>
          <a href="/ventas" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>+ Venta</a>
          <a href="/stock" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>Stock</a>
          <a href="/historial" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>Historial</a>
          <button onClick={salir} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.85rem' }}>Salir</button>
        </nav>
      </div>
    </header>
  )
}