# Sophia Web

Es una aplicación hecha con NextJS 15.5 (App Router)

## Server UP in dev mode:
- .env
```env
DATABASE_URL="..."

AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3001"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

- server:
```bash
npm install
npm run dev
```

## Changelog

### Versión 1.0.1
- **Fix:** Corregido error de navegación usando `<Link>` en lugar de `<a>`
- **Fix:** Implementado logout correcto con Server Actions y revalidación de caché
- **Mejora:** Agregados tipos TypeScript apropiados para NextAuth callbacks
- **Nuevo:** Archivo `types/next-auth.d.ts` para extender interfaces de sesión
- **Docs:** Agregada documentación técnica en CLAUDE.md sobre NextAuth v5 con Next.js 15

### Versión 1.0
- Project Structure
- Tailwind v4.1
- NextAuth 5.x + Google Provider
- Prisma
- PostgreSQL + Neon
- Middleware