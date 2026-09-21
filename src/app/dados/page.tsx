"use client";

import { useEffect, useState } from "react";
import { Download, Trash2, Edit } from "lucide-react";
import styles from "./page.module.css";

type Activity = {
  id: string;
  date: string;
  title: string;
  area: string;
  durationMinutes: number;
  importance: number;
  impact: number;
  returns: string;
  energyBefore: string;
  status: string;
};

export default function Dados() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este registro?")) return;
    
    try {
      await fetch(`/api/activities?id=${id}`, { method: "DELETE" });
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportCSV = () => {
    if (activities.length === 0) return;
    
    const headers = ["Data", "Atividade", "Área", "Duração (min)", "Importância", "Impacto", "Retorno", "Energia", "Status"];
    const csvContent = [
      headers.join(","),
      ...activities.map(a => [
        new Date(a.date).toLocaleDateString(),
        `"${a.title.replace(/"/g, '""')}"`,
        a.area || "",
        a.durationMinutes || "",
        a.importance || "",
        a.impact || "",
        `"${a.returns ? JSON.parse(a.returns).join(" / ") : ""}"`,
        a.energyBefore || "",
        a.status || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "diario_de_atividades.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 className={styles.title} style={{ marginBottom: '0.5rem' }}>Dados Brutos</h1>
            <p className={styles.subtitle}>Consulte e exporte todos os seus registros.</p>
          </div>
          <button className={styles.btnPrimary} onClick={handleExportCSV}>
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Atividade</th>
                <th>Área</th>
                <th>Duração</th>
                <th>Impacto</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum dado encontrado.</td>
                </tr>
              ) : (
                activities.map(activity => (
                  <tr key={activity.id}>
                    <td>{new Date(activity.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{activity.title}</td>
                    <td>{activity.area || '-'}</td>
                    <td>{activity.durationMinutes ? `${activity.durationMinutes}m` : '-'}</td>
                    <td>{activity.impact || '-'}</td>
                    <td>
                      <span className={styles.statusBadge} data-status={activity.status}>
                        {activity.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={styles.iconBtn} onClick={() => handleDelete(activity.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
