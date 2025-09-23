import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'

import { ArrowRight, Sparkles, Zap } from 'lucide-react';


export default async function Home() {
  const session = await auth()

  return (
    <main className="h-screen bg-white text-black overflow-hidden relative">
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-sm border-b border-white/5 transition-all duration-700 opacity-100 translate-y-0`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-700 to-yellow-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-light tracking-tight">SophIA</span>
          </div>

          <div className="flex items-center space-x-8">

            {session ? (
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600">Hola, {session.user?.name ?? session.user?.email}</p>
                <Link
                  href="/lessons"
                  className="cursor-pointer px-6 py-2 bg-cyan-700/25 hover:bg-cyan-800/50 hover:text-white rounded-lg text-md transition-all backdrop-blur-sm"
                >
                  Ir a Lecciones
                </Link>
                <form action={async () => { 'use server'; await signOut() }}>
                  <button className="cursor-pointer px-6 py-2 bg-yellow-600/25 hover:bg-yellow-800/50 hover:text-white rounded-lg text-md transition-all backdrop-blur-sm">
                    Salir
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="cursor-pointer px-6 py-2 bg-yellow-600/25 hover:bg-yellow-800/50 hover:text-white rounded-lg text-md transition-all backdrop-blur-sm"
              >
                Ingresar
              </Link>
            )}

          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className={`max-w-5xl mx-auto text-center transition-all duration-1000 opacity-100 translate-y-0`}>
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-black/5 backdrop-blur-sm rounded-full border border-white/10 mb-8">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-yellow-600">Educación potenciada con IA</span>
          </div>

          {/* Título principal con gradiente */}
          <h1 className="text-6xl md:text-7xl font-extralight tracking-tight mb-6">
            <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">
              Aprendizaje que se
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-700 to-yellow-400 bg-clip-text text-transparent font-light">
              adapta a ti
            </span>
          </h1>

          {/* Descripción */}
          <p className="text-xl text-gray-800 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Sophia te guiará por un camino de aprendizaje único y personalizado, según tu ritmo y estilo.
          </p>

          <div className="flex items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/login"
              className="cursor-pointer group px-8 py-4 bg-gradient-to-r from-cyan-700 to-yellow-600 rounded-lg text-white font-medium transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 inline-flex items-center space-x-2"
            >
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
