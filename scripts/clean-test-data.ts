/**
 * Script para limpiar datos de prueba de SOPHIA
 * Úsalo para reiniciar el estado y probar desde cero
 *
 * Ejecutar con: npx tsx scripts/clean-test-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanTestData() {
  console.log('🧹 Iniciando limpieza de datos de prueba...\n')

  try {
    // 1. Limpiar AIOutcome (depende de StudentResponse)
    const aiOutcomes = await prisma.aIOutcome.deleteMany({})
    console.log(`✅ Eliminados ${aiOutcomes.count} registros de AIOutcome`)

    // 2. Limpiar StudentResponse (depende de ChatMessage y LessonSession)
    const studentResponses = await prisma.studentResponse.deleteMany({})
    console.log(`✅ Eliminados ${studentResponses.count} registros de StudentResponse`)

    // 3. Limpiar ChatMessage (depende de LessonSession)
    const chatMessages = await prisma.chatMessage.deleteMany({})
    console.log(`✅ Eliminados ${chatMessages.count} mensajes de chat`)

    // 4. Limpiar LessonSession
    const lessonSessions = await prisma.lessonSession.deleteMany({})
    console.log(`✅ Eliminadas ${lessonSessions.count} sesiones de lección`)

    console.log('\n🎉 Limpieza completada exitosamente!')
    console.log('📝 Nota: Las tablas User y Account NO se tocaron (datos de autenticación)')
    console.log('\n🚀 Ahora puedes probar SOPHIA desde cero en /lessons/1')

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Confirmación de seguridad
console.log('⚠️  ADVERTENCIA: Este script eliminará todos los datos de SOPHIA')
console.log('   (sesiones, mensajes, respuestas, evaluaciones)')
console.log('   NO eliminará usuarios ni cuentas\n')

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question('¿Estás seguro? (s/n): ', (answer: string) => {
  if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
    cleanTestData()
      .then(() => readline.close())
  } else {
    console.log('❌ Operación cancelada')
    readline.close()
    process.exit(0)
  }
})