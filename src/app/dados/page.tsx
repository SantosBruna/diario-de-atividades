"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Edit } from "lucide-react";
import styles from "./page.module.css";

type Activity = {
  id: string;
  date: string;
  title: string;
  area: string;
  activityType: string;
  durationMinutes: number;
  importance: number;
  impact: number;
  returns: string;
  energyBefore: string;
  energyAfter: string;
  status: string;
};

export default function Dados() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterImportance, setFilterImportance] = useState("");
  const [filterImpact, setFilterImpact] = useState("");
  const [filterReturns, setFilterReturns] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const AREAS = ['Carreira', 'Renda', 'Projetos', 'Estudos', 'Casa', 'Vida pessoal', 'Administrativo', 'Lazer'];
  const TYPES = ['Concentração', 'Criativa', 'Operacional', 'Administrativa', 'Física', 'Social', 'Descanso'];
  const RETURNS = ['Renda imediata', 'Renda futura', 'Carreira', 'Projeto pessoal', 'Conhecimento', 'Manutenção', 'Bem-estar', 'Lazer'];


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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const filteredActivities = activities.filter(a => {
    if (filterStart && new Date(a.date) < new Date(filterStart + 'T00:00:00')) return false;
    if (filterEnd && new Date(a.date) > new Date(filterEnd + 'T23:59:59')) return false;
    if (filterArea && a.area !== filterArea) return false;
    if (filterType && a.activityType !== filterType) return false;
    if (filterImportance && a.importance?.toString() !== filterImportance) return false;
    if (filterImpact && a.impact?.toString() !== filterImpact) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterReturns && (!a.returns || !a.returns.includes(filterReturns))) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterStart("");
    setFilterEnd("");
    setFilterArea("");
    setFilterType("");
    setFilterImportance("");
    setFilterImpact("");
    setFilterReturns("");
    setFilterStatus("");
  };

  const handleExportCSV = () => {
    if (filteredActivities.length === 0) return;
    
    const headers = ["Data", "Atividade", "Área", "Tipo", "Duração (min)", "Importância", "Impacto", "Retorno", "Energia", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredActivities.map(a => [
        new Date(a.date).toLocaleDateString(),
        `"${a.title.replace(/"/g, '""')}"`,
        a.area || "",
        a.activityType || "",
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

      <div className={styles.chartCard} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className={styles.chartTitle} style={{ margin: 0 }}>Filtros</h3>
          <button className={styles.btnSecondary} onClick={clearFilters} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Limpar Filtros</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Data Inicial</label>
            <input type="date" className={styles.input} value={filterStart} onChange={e => setFilterStart(e.target.value)} style={{ padding: '0.35rem 0.5rem' }} />
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Data Final</label>
            <input type="date" className={styles.input} value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={{ padding: '0.35rem 0.5rem' }} />
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Área</label>
            <select className={styles.input} value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todas</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Tipo</label>
            <select className={styles.input} value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todos</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Importância</label>
            <select className={styles.input} value={filterImportance} onChange={e => setFilterImportance(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todas</option>
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Impacto</label>
            <select className={styles.input} value={filterImpact} onChange={e => setFilterImpact(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Retorno</label>
            <select className={styles.input} value={filterReturns} onChange={e => setFilterReturns(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todos</option>
              {RETURNS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} style={{ fontSize: '0.75rem' }}>Status</label>
            <select className={styles.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '0.35rem 0.5rem' }}>
              <option value="">Todos</option>
              {['Concluída', 'Parcial', 'Interrompida', 'Em andamento'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

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
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum dado encontrado.</td>
                </tr>
              ) : (
                filteredActivities.map(activity => (
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
                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className={styles.iconBtn} onClick={() => router.push(`/registrar?id=${activity.id}`)} title="Editar">
                        <Edit size={16} />
                      </button>
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
