import type { ComponentProps, ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import MissionActionContent from '../MissionActionContent';
import styles from './DashboardControls.module.css';

export function DashboardButton({ children, type = 'button', ...props }: Omit<ComponentProps<'button'>, 'className'>) {
  return (
    <button {...props} type={type} className={`mission-link ${styles.action}`}>
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

export function DashboardSelect({ label, children, multiple, size, ...props }: ComponentProps<'select'> & { label: string }) {
  const isDropdown = !multiple && (!size || size === 1);

  return (
    <Field label={label}>
      <span className={isDropdown ? styles.dropdown : undefined}>
        <select {...props} multiple={multiple} size={size}>{children}</select>
        {isDropdown && <LuChevronDown size={16} aria-hidden="true" />}
      </span>
    </Field>
  );
}

export function DashboardTextarea({ label, ...props }: ComponentProps<'textarea'> & { label: string }) {
  return <Field label={label}><textarea {...props} /></Field>;
}

export function DashboardCheckbox({ label, ...props }: Omit<ComponentProps<'input'>, 'type'> & { label: string }) {
  return <label className={styles.checkbox}><input {...props} type="checkbox" />{label}</label>;
}
