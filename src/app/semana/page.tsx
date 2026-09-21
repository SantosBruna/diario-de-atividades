import { prisma } from "@/lib/prisma";
import { AreaChart, ImpactChart } from "@/components/Charts";
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
      </div>

      <div className={styles.chartsGrid} style={{ gridTemplateColumns: '1fr' }}>
        <AreaChart data={areaChartData} />
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
