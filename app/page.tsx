import { auth, signIn, signOut } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">sophia_web</h1>

      {session ? (
        <>
          <p>Hola, {session.user?.name ?? session.user?.email}</p>
          <form action={async () => { 'use server'; await signOut() }}>
            <button className="px-3 py-2 rounded bg-gray-200">Cerrar sesión</button>
          </form>
          <a className="underline" href="/lessons">Ir a Lessons (protegido)</a>
        </>
      ) : (
        <form action={async () => { 'use server'; await signIn('google') }}>
          <button className="px-3 py-2 rounded bg-black text-white">Ingresar con Google</button>
        </form>
      )}
    </main>
  )
}
