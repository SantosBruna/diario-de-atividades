"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Sparkles, Play, Square, Save, Loader2 } from "lucide-react";
import { parseActivityWithAI, saveActivity, getActivity, updateActivity } from "../actions";
import styles from "./page.module.css";
import { useRouter, useSearchParams } from "next/navigation";

const AREAS = ['Carreira', 'Renda', 'Projetos', 'Estudos', 'Casa', 'Vida pessoal', 'Administrativo', 'Lazer'];
const TYPES = ['Concentração', 'Criativa', 'Operacional', 'Administrativa', 'Física', 'Social', 'Descanso'];
const RETURNS = ['Renda imediata', 'Renda futura', 'Carreira', 'Projeto pessoal', 'Conhecimento', 'Manutenção', 'Bem-estar', 'Lazer'];

function RegistrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [aiText, setAiText] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    area: "",
    activityType: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    durationMinutes: "",
    importance: "",
    impact: "",
    returns: [] as string[],
    energyBefore: "",
    energyAfter: "",
    status: "Concluída",
    notes: ""
  });

  // Timer logic
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingAI(true);
      getActivity(id).then(res => {
        setIsLoadingAI(false);
        if (res.data) {
          const d = res.data;
          setFormData({
            title: d.title || "",
            description: d.description || "",
            area: d.area || "",
            activityType: d.activityType || "",
            date: d.date ? new Date(d.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            startTime: d.startTime || "",
            endTime: d.endTime || "",
            durationMinutes: d.durationMinutes?.toString() || "",
            importance: d.importance?.toString() || "",
            impact: d.impact?.toString() || "",
            returns: d.returns ? JSON.parse(d.returns) : [],
            energyBefore: d.energyBefore || "",
            energyAfter: d.energyAfter || "",
            status: d.status || "Concluída",
            notes: d.notes || ""
          });
          setShowForm(true);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setTimerRunning(true);
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }));
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
    const now = new Date();
    const duration = Math.ceil(timerSeconds / 60);
    setFormData(prev => ({
      ...prev,
      endTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      durationMinutes: duration.toString()
    }));
    setShowForm(true);
  };

  const handleAiSubmit = async () => {
    if (!aiText.trim()) return;
    setIsLoadingAI(true);
    const result = await parseActivityWithAI(aiText);
    setIsLoadingAI(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.data) {
      const d = result.data;
      setFormData(prev => ({
        ...prev,
        title: d.title || "",
        description: d.description || "",
        area: d.area || "",
        activityType: d.activityType || "",
        startTime: d.startTime || prev.startTime,
        endTime: d.endTime || prev.endTime,
        durationMinutes: d.durationMinutes?.toString() || prev.durationMinutes,
        importance: d.importance?.toString() || "",
        impact: d.impact?.toString() || "",
        returns: Array.isArray(d.returns) ? d.returns : [],
        energyBefore: d.energyBefore || "",
        energyAfter: d.energyAfter || ""
      }));
      setShowForm(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("O título é obrigatório");
      return;
    }
    
    setIsSaving(true);
    const dataToSave = {
      ...formData,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
      importance: formData.importance ? parseInt(formData.importance) : null,
      impact: formData.impact ? parseInt(formData.impact) : null,
      date: new Date(formData.date)
    };

    const res = id ? await updateActivity(id, dataToSave) : await saveActivity(dataToSave);
    setIsSaving(false);

    if (res.error) {
      alert(res.error);
    } else {
      router.push(id ? "/dados" : "/");
    }
  };

  const handleReturnChange = (ret: string) => {
    setFormData(prev => {
      const exists = prev.returns.includes(ret);
      if (exists) {
        return { ...prev, returns: prev.returns.filter(r => r !== ret) };
      }
      return { ...prev, returns: [...prev.returns, ret] };
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{id ? "Editar Atividade" : "Registrar Atividade"}</h1>

      {!showForm && !id && (
        <div className={styles.timerSection}>
          <div>
            <span className={styles.label}>Modo Cronômetro</span>
            <div className={styles.timerTime}>{formatTimer(timerSeconds)}</div>
          </div>
          <div>
            {!timerRunning ? (
              <button className={styles.btnPrimary} onClick={handleStartTimer}>
                <Play size={18} /> Iniciar
              </button>
            ) : (
              <button className={styles.btnSecondary} onClick={handleStopTimer} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                <Square size={18} /> Finalizar
              </button>
            )}
          </div>
        </div>
      )}

      {!showForm && !timerRunning && !id && (
        <div className={styles.aiSection}>
          <label className={styles.label}>O que você fez?</label>
          <textarea 
            className={styles.textarea} 
            placeholder="Ex: Das 14h às 15h30 trabalhei no meu radar de notícias..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={styles.btnPrimary} 
              onClick={handleAiSubmit}
              disabled={isLoadingAI || !aiText.trim()}
            >
              {isLoadingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Estruturar atividade
            </button>
            <button className={styles.btnSecondary} onClick={() => setShowForm(true)}>
              Registrar manualmente
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className={styles.aiSection}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Confirmar Dados</h2>
          
          <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <label className={styles.label}>Título *</label>
              <input required className={styles.input} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Descrição</label>
              <textarea className={styles.textarea} style={{ minHeight: '80px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Data</label>
              <input type="date" className={styles.input} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Duração (minutos)</label>
              <input type="number" className={styles.input} value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Início (HH:MM)</label>
              <input type="time" className={styles.input} value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Fim (HH:MM)</label>
              <input type="time" className={styles.input} value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Área</label>
              <select className={styles.input} value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})}>
                <option value="">Selecione...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={styles.label}>Tipo de atividade</label>
              <select className={styles.input} value={formData.activityType} onChange={e => setFormData({...formData, activityType: e.target.value})}>
                <option value="">Selecione...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={styles.label}>Importância (1-5)</label>
              <input type="number" min="1" max="5" className={styles.input} value={formData.importance} onChange={e => setFormData({...formData, importance: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Impacto (1-5)</label>
              <input type="number" min="1" max="5" className={styles.input} value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} />
            </div>
            <div>
              <label className={styles.label}>Energia Antes</label>
              <select className={styles.input} value={formData.energyBefore} onChange={e => setFormData({...formData, energyBefore: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Energia Depois</label>
              <select className={styles.input} value={formData.energyAfter} onChange={e => setFormData({...formData, energyAfter: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Status</label>
              <select className={styles.input} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Concluída">Concluída</option>
                <option value="Parcial">Parcial</option>
                <option value="Interrompida">Interrompida</option>
                <option value="Em andamento">Em andamento</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label className={styles.label}>Retornos</label>
            <div className={styles.checkboxGroup}>
              {RETURNS.map(ret => (
                <label key={ret} className={styles.checkboxItem}>
                  <input 
                    type="checkbox" 
                    checked={formData.returns.includes(ret)}
                    onChange={() => handleReturnChange(ret)}
                  />
                  {ret}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label className={styles.label}>Observações</label>
            <textarea className={styles.textarea} style={{ minHeight: '80px' }} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className={styles.btnPrimary} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Atividade
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Registrar() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>}>
      <RegistrarForm />
    </Suspense>
  );
}
