import { prisma } from "@/lib/prisma";
import { AreaChart, ImpactChart } from "@/components/Charts";
import styles from "./page.module.css";

// Evita cache na página principal
export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();

  const startOfToday = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const activities = await prisma.activity.findMany({
    where: {
      date: {
        gte: startOfToday,
        lt: startOfTomorrow,
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

  // Prepare Data for Impact Chart
  const impactChartData = activities
    .filter(a => a.durationMinutes && a.impact)
    .map(a => ({
      name: a.title,
      area: a.area,
      x: a.durationMinutes,
      y: a.impact,
      z: 100 // tamanho base da bolha
    }));

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Hoje</h1>
        <p className={styles.subtitle}>Visão geral das suas atividades de hoje.</p>
      </header>

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
      </div>

      <div className={styles.chartsGrid}>
        {areaChartData.length > 0 ? (
          <AreaChart data={areaChartData} />
        ) : (
          <div className={styles.chartCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Sem dados para o gráfico de áreas.</p>
          </div>
        )}

        {impactChartData.length > 0 ? (
          <ImpactChart data={impactChartData} />
        ) : (
          <div className={styles.chartCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>Sem dados para o gráfico de impacto.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className={styles.chartTitle}>Timeline</h3>
        {activities.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Nenhuma atividade registrada hoje.</p>
        ) : (
          <div className={styles.timeline}>
            {activities.map((activity) => (
              <div key={activity.id} className={styles.activityCard}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityTime}>
                    {activity.startTime} {activity.endTime ? `- ${activity.endTime}` : ''}
                  </span>
                </div>
                {activity.description && <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{activity.description}</p>}

                <div className={styles.badges}>
                  {activity.area && <span className={`${styles.badge} ${styles.badgeArea}`}>{activity.area}</span>}
                  {activity.impact && <span className={`${styles.badge} ${styles.badgeImpact}`}>Impacto: {activity.impact}</span>}
                  {activity.activityType && <span className={styles.badge}>{activity.activityType}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
