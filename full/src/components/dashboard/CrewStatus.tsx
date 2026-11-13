import { Danger, InfoCircle, TickCircle, Warning2 } from 'iconsax-react';
import styles from './CrewDashboard.module.css';

const states = {
  nominal: { Icon: TickCircle, label: 'Nominal' },
  review: { Icon: Warning2, label: 'Needs review' },
  critical: { Icon: Danger, label: 'Critical alert' },
  missing: { Icon: InfoCircle, label: 'No reading' },
};

export type Status = keyof typeof states;

export default function CrewStatus({ status, label }: { status: Status; label?: string }) {
  const { Icon, label: defaultLabel } = states[status];
  return (
    <span className={`${styles.rowStatus} ${styles[status]}`}>
      <Icon size={16} color="currentColor" variant="Bold" aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
