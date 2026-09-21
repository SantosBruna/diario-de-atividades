"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, PlusCircle, BarChart3 } from "lucide-react";
import styles from "../app/layout.module.css";

const navItems = [
  { href: "/", label: "Hoje", icon: LayoutDashboard },
  { href: "/registrar", label: "Registrar", icon: PlusCircle },
  { href: "/semana", label: "Semana", icon: Calendar },
  { href: "/dados", label: "Dados", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>Diário</div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
          >
            <Icon size={24} />
            <span className={styles.navText}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
