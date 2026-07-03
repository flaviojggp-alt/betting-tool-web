'use client'
import { useEffect, useState } from 'react'
import { supabase, Bet, BankrollSettings } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bets, setBets] = useState<Bet[]>([])
  const [settings, setSettings] = useState<BankrollSettings | null>(null)
  const [activeTab, setActiveTab] = useState('historial')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/'; return }
      setUser(data.user)
      loadData(data.user.id)
    })
  }, [])

  const loadData = async (userId: string) => {
    const [betsRes, settingsRes] = await Promise.all([
      supabase.from('bets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('bankroll_settings').select('*').eq('user_id', userId).single(),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const pendingBets = bets.filter(b => b.result === 'pending')
  const resolvedBets = bets.filter(b => b.result !== 'pending')
  const wins = resolvedBets.filter(b => b.result === 'win').length
  const totalStaked = resolvedBets.reduce((s, b) => s + (b.amount || 0), 0)
  const roi = resolvedBets.length && totalStaked > 0
    ? ((resolvedBets.reduce((s, b) => s + (b.result === 'win' ? (b.amount||0) * (b.odds - 1) : -(b.amount||0)), 0) /
        totalStaked) * 100).toFixed(1)
    : '0.0'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">Analizador de Apuestas</h1>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-800">
          Salir
        </button>
      </header>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{bets.length}</div>
          <div className="text-xs text-gray-400">Total apuestas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">{pendingBets.length}</div>
          <div className="text-xs text-gray-400">Pendientes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{wins}</div>
          <div className="text-xs text-gray-400">Ganadas</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${parseFloat(roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(roi) >= 0 ? '+' : ''}{roi}%
          </div>
          <div className="text-xs text-gray-400">ROI</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-1">
        {['historial', 'banca', 'herramienta'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">

        {/* HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="space-y-3">
            {bets.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm">Aun no hay apuestas registradas.</p>
                <p className="text-gray-400 text-xs mt-1">Usa la herramienta HTML para analizar partidos.</p>
              </div>
            )}
            {bets.map(bet => (
              <div key={bet.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{bet.match}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bet.market} · {bet.odds}x · {bet.confidence}% conf.</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(bet.created_at).toLocaleDateString('es')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      bet.result === 'win' ? 'bg-green-100 text-green-700' :
                      bet.result === 'loss' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {bet.result === 'win' ? 'Ganada' : bet.result === 'loss' ? 'Perdida' : 'Pendiente'}
                    </span>
                    {bet.amount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{settings?.currency || 'S/'}{bet.amount}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BANCA */}
        {activeTab === 'banca' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-1">Saldo actual</p>
              <p className="text-3xl font-semibold text-gray-900">
                {settings?.currency || 'S/'}{(settings?.current_balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Configuracion</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Moneda</span>
                  <p className="text-gray-900">{settings?.currency || 'S/'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Max por apuesta</span>
                  <p className="text-gray-900">{settings?.currency || 'S/'}{settings?.max_bet_amount || 50}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Max apuestas/dia</span>
                  <p className="text-gray-900">{settings?.max_bets_per_day || 5}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Casa</span>
                  <p className="text-gray-900">{settings?.bookmaker || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HERRAMIENTA */}
        {activeTab === 'herramienta' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-700 font-medium mb-2">Herramienta de analisis HTML</p>
            <p className="text-xs text-gray-400 mb-4">
              La herramienta de prediccion sigue siendo el archivo betting-tool-v3.html.
              Proximamente estara integrada aqui.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs text-gray-500 font-medium mb-2">Tu conexion Supabase:</p>
              <p className="text-xs text-gray-400 font-mono break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Configura las variables de entorno'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
