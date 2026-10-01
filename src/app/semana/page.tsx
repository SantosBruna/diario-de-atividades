import { prisma } from "@/lib/prisma";
import { AreaChart, SimpleBarChart } from "@/components/Charts";
import styles from "../page.module.css";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Semana() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
  endOfWeek.setHours(23, 59, 59, 999);

  const activities = await prisma.activity.findMany({
    where: {
      date: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Calculate Metrics
  const totalMinutes = activities.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const highImpactCount = activities.filter(a => (a.impact || 0) >= 4).length;

  // Prepare Data for Area Chart
  const areaMap: Record<string, number> = {};
  activities.forEach(a => {
    if (a.area && a.durationMinutes) {
      areaMap[a.area] = (areaMap[a.area] || 0) + a.durationMinutes;
    }
  });
  const areaChartData = Object.entries(areaMap).map(([name, value]) => ({ name, value }));

  // Insights
  const careerTime = areaMap["Carreira"] || 0;
  const careerPercentage = totalMinutes > 0 ? ((careerTime / totalMinutes) * 100).toFixed(1) : "0";
  
  const lowImpactLongDuration = activities.filter(a => (a.durationMinutes || 0) > 60 && (a.impact || 0) <= 2).length;

  const impactAverages: Record<string, { total: number, count: number }> = {};
  activities.forEach(a => {
    if (a.area && a.impact) {
      if (!impactAverages[a.area]) impactAverages[a.area] = { total: 0, count: 0 };
      impactAverages[a.area].total += a.impact;
      impactAverages[a.area].count += 1;
    }
  });

  let maxImpactArea = "Nenhuma";
  let maxImpactVal = 0;
  Object.entries(impactAverages).forEach(([area, data]) => {
    const avg = data.total / data.count;
    if (avg > maxImpactVal) {
      maxImpactVal = avg;
      maxImpactArea = area;
    }
  });

  const insights = [
    `Você registrou ${totalHours}h nesta semana.`,
    `Carreira representou ${careerPercentage}% do tempo registrado.`,
    maxImpactArea !== "Nenhuma" ? `${maxImpactArea} teve a maior média de impacto.` : "",
    lowImpactLongDuration > 0 ? `Você teve ${lowImpactLongDuration} atividades com duração superior a 60 minutos e impacto igual ou inferior a 2.` : ""
  ].filter(i => i !== "");

  // Daily evolution
  const daysOfWeek = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const dailyMinutes = [0, 0, 0, 0, 0, 0, 0];
  const dailyHighImpact = [0, 0, 0, 0, 0, 0, 0];
  
  activities.forEach(a => {
    let dayIndex = a.date.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6;
    
    dailyMinutes[dayIndex] += a.durationMinutes || 0;
    if ((a.impact || 0) >= 4) {
      dailyHighImpact[dayIndex] += 1;
    }
  });

  const dailyEvolutionData = daysOfWeek.map((name, i) => ({ name, minutos: dailyMinutes[i] }));
  const dailyHighImpactData = daysOfWeek.map((name, i) => ({ name, quantidade: dailyHighImpact[i] }));

  // Energy
  const energyCount = { Alta: 0, Média: 0, Baixa: 0 };
  const energyImpactSum = { Alta: 0, Média: 0, Baixa: 0 };
  const energyImpactCount = { Alta: 0, Média: 0, Baixa: 0 };
  
  activities.forEach(a => {
    if (a.energyBefore) {
      const e = a.energyBefore as 'Alta' | 'Média' | 'Baixa';
      if (energyCount[e] !== undefined) {
        energyCount[e] += 1;
        if (a.impact) {
          energyImpactSum[e] += a.impact;
          energyImpactCount[e] += 1;
        }
      }
    }
  });

  const energyInsights = [];
  if (energyCount['Baixa'] > 0) energyInsights.push(`Você registrou ${energyCount['Baixa']} atividades iniciadas com energia baixa.`);
  if (energyCount['Alta'] > 0) energyInsights.push(`Você registrou ${energyCount['Alta']} atividades iniciadas com energia alta.`);
  if (energyImpactCount['Alta'] > 0) energyInsights.push(`Atividades iniciadas com energia alta tiveram impacto médio de ${(energyImpactSum['Alta'] / energyImpactCount['Alta']).toFixed(1)}.`);
  if (energyImpactCount['Baixa'] > 0) energyInsights.push(`Atividades iniciadas com energia baixa tiveram impacto médio de ${(energyImpactSum['Baixa'] / energyImpactCount['Baixa']).toFixed(1)}.`);

  // Period analysis
  const periodMinutes = { 'Manhã (06-12)': 0, 'Tarde (12-18)': 0, 'Noite (18-24)': 0 };
  const periodImpactSum = { 'Manhã (06-12)': 0, 'Tarde (12-18)': 0, 'Noite (18-24)': 0 };
  const periodImpactCount = { 'Manhã (06-12)': 0, 'Tarde (12-18)': 0, 'Noite (18-24)': 0 };

  activities.forEach(a => {
    if (a.startTime) {
      const hour = parseInt(a.startTime.split(':')[0]);
      let period = '';
      if (hour >= 6 && hour < 12) period = 'Manhã (06-12)';
      else if (hour >= 12 && hour < 18) period = 'Tarde (12-18)';
      else if (hour >= 18) period = 'Noite (18-24)';

      if (period) {
        periodMinutes[period as keyof typeof periodMinutes] += a.durationMinutes || 0;
        if (a.impact) {
          periodImpactSum[period as keyof typeof periodImpactSum] += a.impact;
          periodImpactCount[period as keyof typeof periodImpactCount] += 1;
        }
      }
    }
  });

  const periodData = ['Manhã (06-12)', 'Tarde (12-18)', 'Noite (18-24)'].map(p => ({
    name: p,
    minutos: periodMinutes[p as keyof typeof periodMinutes],
    impactoMedio: periodImpactCount[p as keyof typeof periodImpactCount] > 0 
      ? Number((periodImpactSum[p as keyof typeof periodImpactSum] / periodImpactCount[p as keyof typeof periodImpactCount]).toFixed(1)) 
      : 0
  }));


  return (
    <div>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <Calendar size={32} color="var(--primary)" />
          <h1 className={styles.title} style={{ marginBottom: 0 }}>Semana</h1>
        </div>
        <p className={styles.subtitle}>
          {startOfWeek.toLocaleDateString()} a {endOfWeek.toLocaleDateString()}
        </p>
      </header>

      {/* Insights Section */}
      <div className={styles.chartCard} style={{ height: 'auto', marginBottom: '2.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
        <h3 className={styles.chartTitle} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ✨ Insights da semana
        </h3>
        <ul style={{ listStylePosition: 'inside', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {insights.length > 0 ? (
            insights.map((insight, idx) => (
              <li key={idx} style={{ lineHeight: 1.5 }}>{insight}</li>
            ))
          ) : (
            <li>Registre mais atividades para gerar insights.</li>
          )}
        </ul>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Tempo Total</span>
          <span className={styles.metricValue}>{totalHours}h</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Atividades</span>
          <span className={styles.metricValue}>{activities.length}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Alto Impacto (≥ 4)</span>
          <span className={styles.metricValue}>{highImpactCount}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Carreira</span>
          <span className={styles.metricValue}>{((areaMap['Carreira'] || 0) / 60).toFixed(1)}h</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Renda</span>
          <span className={styles.metricValue}>{((areaMap['Renda'] || 0) / 60).toFixed(1)}h</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Projetos</span>
          <span className={styles.metricValue}>{((areaMap['Projetos'] || 0) / 60).toFixed(1)}h</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Casa</span>
          <span className={styles.metricValue}>{((areaMap['Casa'] || 0) / 60).toFixed(1)}h</span>
        </div>
      </div>

      <div className={styles.chartsGrid} style={{ marginTop: '2rem' }}>
        <AreaChart data={areaChartData} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
          <div className={styles.chartCard} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', flex: 1 }}>
            <h3 className={styles.chartTitle} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ Análise de Energia
            </h3>
            <ul style={{ listStylePosition: 'inside', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              {energyInsights.length > 0 ? (
                energyInsights.map((insight, idx) => (
                  <li key={idx} style={{ lineHeight: 1.5 }}>{insight}</li>
                ))
              ) : (
                <li>Registre a energia antes das atividades para ver insights.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid} style={{ marginTop: '2rem' }}>
        <SimpleBarChart data={dailyEvolutionData} title="Evolução Diária (Tempo)" dataKey="minutos" fill="#3b82f6" yAxisUnit="min" />
        <SimpleBarChart data={dailyHighImpactData} title="Atividades de Alto Impacto por Dia" dataKey="quantidade" fill="#f59e0b" />
      </div>

      <div className={styles.chartsGrid} style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <SimpleBarChart data={periodData} title="Tempo por Período do Dia" dataKey="minutos" fill="#8b5cf6" yAxisUnit="min" />
        <SimpleBarChart data={periodData} title="Impacto Médio por Período" dataKey="impactoMedio" fill="#10b981" />
      </div>

      <div>
        <h3 className={styles.chartTitle}>Atividades Recentes</h3>
        {activities.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Nenhuma atividade registrada nesta semana.</p>
        ) : (
          <div className={styles.timeline}>
            {activities.slice(-5).reverse().map((activity) => (
              <div key={activity.id} className={styles.activityCard}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityTime}>
                    {activity.date.toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.badges}>
                  {activity.area && <span className={`${styles.badge} ${styles.badgeArea}`}>{activity.area}</span>}
                  {activity.durationMinutes && <span className={styles.badge}>{activity.durationMinutes} min</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
