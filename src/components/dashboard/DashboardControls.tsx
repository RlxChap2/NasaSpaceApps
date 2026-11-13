import type { ComponentProps, ReactNode } from 'react';
import MissionActionContent from '../MissionActionContent';
import styles from './DashboardControls.module.css';

export function DashboardButton({ children, type = 'button', ...props }: Omit<ComponentProps<'button'>, 'className'>) {
  return (
    <button {...props} type={type} className="mission-link">
      <MissionActionContent>{children}</MissionActionContent>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

export function DashboardInput({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return <Field label={label}><input {...props} /></Field>;
}

export function DashboardSelect({ label, children, ...props }: ComponentProps<'select'> & { label: string }) {
  return <Field label={label}><select {...props}>{children}</select></Field>;
}

export function DashboardTextarea({ label, ...props }: ComponentProps<'textarea'> & { label: string }) {
  return <Field label={label}><textarea {...props} /></Field>;
}

export function DashboardCheckbox({ label, ...props }: Omit<ComponentProps<'input'>, 'type'> & { label: string }) {
  return <label className={styles.checkbox}><input {...props} type="checkbox" />{label}</label>;
}
