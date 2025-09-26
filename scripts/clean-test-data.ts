/**
 * Script para limpiar datos de prueba de SOPHIA
 * Úsalo para reiniciar el estado y probar desde cero
 *
 * Ejecutar con:
 *   - Limpiar todos: npx tsx scripts/clean-test-data.ts
 *   - Limpiar específico: npx tsx scripts/clean-test-data.ts user@email.com
 */

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

async function cleanTestData(userEmail?: string) {
  console.log('🧹 Iniciando limpieza de datos de prueba...\n')

  try {
    let userId: string | undefined

    // Si se proporcionó un email, buscar el usuario
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })

      if (!user) {
        console.log(`❌ No se encontró usuario con email: ${userEmail}`)
        return
      }

      userId = user.id
      console.log(`👤 Limpiando datos del usuario: ${user.name} (${user.email})\n`)
    } else {
      console.log('🌍 Limpiando datos de TODOS los usuarios\n')
    }

    // Obtener sesiones a limpiar
    const sessionIds = await prisma.lessonSession.findMany({
      where: userId ? { userId } : {},
      select: { id: true }
    }).then(sessions => sessions.map(s => s.id))

    if (sessionIds.length === 0) {
      console.log('ℹ️  No hay sesiones para limpiar')
      return
    }

    // 1. Limpiar AIOutcome (depende de StudentResponse)
    const aiOutcomes = await prisma.aIOutcome.deleteMany({
      where: { sessionId: { in: sessionIds } }
    })
    console.log(`✅ Eliminados ${aiOutcomes.count} registros de AIOutcome`)

    // 2. Limpiar StudentResponse (depende de ChatMessage y LessonSession)
    const studentResponses = await prisma.studentResponse.deleteMany({
      where: { sessionId: { in: sessionIds } }
    })
    console.log(`✅ Eliminados ${studentResponses.count} registros de StudentResponse`)

    // 3. Limpiar ChatMessage (depende de LessonSession)
    const chatMessages = await prisma.chatMessage.deleteMany({
      where: { sessionId: { in: sessionIds } }
    })
    console.log(`✅ Eliminados ${chatMessages.count} mensajes de chat`)

    // 4. Limpiar LessonSession
    const lessonSessions = await prisma.lessonSession.deleteMany({
      where: userId ? { userId } : {}
    })
    console.log(`✅ Eliminadas ${lessonSessions.count} sesiones de lección`)

    console.log('\n🎉 Limpieza completada exitosamente!')
    console.log('📝 Nota: Las tablas User y Account NO se tocaron (datos de autenticación)')

    if (userId) {
      console.log(`\n🚀 El usuario ${userEmail} puede comenzar desde cero en /lessons/1`)
    } else {
      console.log('\n🚀 Todos los usuarios pueden comenzar desde cero en /lessons/1')
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Obtener email del argumento de línea de comandos
const userEmail = process.argv[2]

// Verificar si se pidió ayuda
if (userEmail === '--help' || userEmail === '-h') {
  console.log('📚 Uso del script de limpieza de datos de SOPHIA\n')
  console.log('Comandos:')
  console.log('  npx tsx scripts/clean-test-data.ts                  - Limpia datos de TODOS los usuarios')
  console.log('  npx tsx scripts/clean-test-data.ts user@email.com   - Limpia datos de un usuario específico')
  console.log('  npx tsx scripts/clean-test-data.ts --help           - Muestra esta ayuda\n')
  console.log('Ejemplos:')
  console.log('  npx tsx scripts/clean-test-data.ts')
  console.log('  npx tsx scripts/clean-test-data.ts bruno@example.com')
  process.exit(0)
}

// Validar formato de email si se proporcionó
if (userEmail && !userEmail.includes('@')) {
  console.log(`❌ Email inválido: ${userEmail}`)
  console.log('   Use --help para ver ejemplos de uso')
  process.exit(1)
}

// Configurar mensaje de confirmación
if (userEmail) {
  console.log('⚠️  ADVERTENCIA: Este script eliminará los datos de SOPHIA para:')
  console.log(`   Usuario: ${userEmail}`)
  console.log('   Se eliminarán: sesiones, mensajes, respuestas, evaluaciones')
  console.log('   NO se eliminará la cuenta del usuario\n')
} else {
  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de SOPHIA')
  console.log('   (sesiones, mensajes, respuestas, evaluaciones de TODOS los usuarios)')
  console.log('   NO eliminará usuarios ni cuentas\n')
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('¿Estás seguro? (s/n): ', (answer: string) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    cleanTestData(userEmail)
      .then(() => rl.close())
  } else {
    console.log('❌ Operación cancelada')
    rl.close()
    process.exit(0)
  }
})