"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import styles from "../app/page.module.css";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#84cc16", "#06b6d4"];

export function SimpleBarChart({ data, title, dataKey, fill, yAxisUnit = "" }: { data: Record<string, unknown>[], title: string, dataKey: string, fill: string, yAxisUnit?: string }) {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} ${yAxisUnit}`.trim(), title]}
            />
            <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AreaChart({ data }: { data: Record<string, unknown>[] }) {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Tempo por Área</h3>
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: '#f8fafc' }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.name}</p>
        <p style={{ margin: '0' }}>Duração: {data.x} min</p>
        <p style={{ margin: '0' }}>Impacto: {data.y}</p>
        {data.area && <p style={{ margin: '0' }}>Área: {data.area}</p>}
      </div>
    );
  }
  return null;
};

export function ImpactChart({ data }: { data: Record<string, unknown>[] }) {
  // Data format expected: { x: tempo (min), y: impacto, z: tamanho da bolha }
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Tempo × Impacto</h3>
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" name="Duração" unit="min" stroke="#94a3b8" />
            <YAxis type="number" dataKey="y" name="Impacto" domain={[0, 5]} stroke="#94a3b8" />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Volume" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Atividades" data={data} fill="#8b5cf6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
