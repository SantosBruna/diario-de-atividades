import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes
  await prisma.activity.deleteMany({})

  console.log('Criando dados de demonstração...')

  const today = new Date()
  const activities = []

  const areas = ['Carreira', 'Renda', 'Projetos', 'Estudos', 'Casa', 'Vida pessoal', 'Administrativo', 'Lazer']
  const types = ['Concentração', 'Criativa', 'Operacional', 'Administrativa', 'Física', 'Social', 'Descanso']
  const returns = ['Renda imediata', 'Renda futura', 'Carreira', 'Projeto pessoal', 'Conhecimento', 'Manutenção', 'Bem-estar', 'Lazer']
  
  for (let i = 0; i < 7; i++) {
    // Para os últimos 7 dias
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0) // Normalizar para meia noite localmente pode ser útil dependendo da visualização

    // Gerar 3 a 6 atividades por dia
    const numActivities = Math.floor(Math.random() * 4) + 3

    for (let j = 0; j < numActivities; j++) {
      const startHour = 8 + j * 2
      const endHour = startHour + 1
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(endHour).padStart(2, '0')}:30`
      const durationMinutes = 90
      
      const area = areas[Math.floor(Math.random() * areas.length)]
      const activityType = types[Math.floor(Math.random() * types.length)]
      const ret = [returns[Math.floor(Math.random() * returns.length)]]
      const impact = Math.floor(Math.random() * 5) + 1
      const importance = Math.floor(Math.random() * 5) + 1
      
      activities.push({
        title: `[DEMO] Atividade de ${area}`,
        description: `Esta é uma atividade gerada automaticamente para o dia ${date.toLocaleDateString()}`,
        date: date,
        startTime,
        endTime,
        durationMinutes,
        area,
        activityType,
        importance,
        impact,
        returns: JSON.stringify(ret),
        energyBefore: 'Média',
        energyAfter: 'Baixa',
        status: 'Concluída',
        notes: 'Dados de demonstração para MVP'
      })
    }
  }

  for (const activity of activities) {
    await prisma.activity.create({
      data: activity
    })
  }

  console.log(`Foram criadas ${activities.length} atividades fictícias.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
