'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function entrar(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError('Email o contraseña incorrectos')
    window.location.href = '/'
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1>Ingresar</h1>
      <form onSubmit={entrar} style={{ display: 'grid', gap: 8 }}>
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required style={{ padding: 8 }} />
        <input type="password" placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)} required style={{ padding: 8 }} />
        <button type="submit" style={{ padding: 8 }}>Entrar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  )
}