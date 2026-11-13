'use client';

import { useState, type FormEvent } from 'react';
import { DashboardButton, DashboardCheckbox, DashboardInput, DashboardSelect, DashboardTextarea } from './DashboardControls';
import styles from './DashboardStarter.module.css';

export default function DashboardStarter() {
  const [status, setStatus] = useState('');

  function previewEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = new FormData(event.currentTarget);
    setStatus(`Preview: ${entry.get('title')} · Mission day ${entry.get('day') || '—'}`);
  }

  return (
    <main className={styles.page}>
      <h1>Dashboard</h1>
      <form className={styles.form} onSubmit={previewEntry} onChange={() => setStatus('')} onReset={() => setStatus('')}>
        <div className={styles.fields}>
          <DashboardInput label="Entry title" name="title" placeholder="e.g. Crew check-in" required />
          <DashboardSelect label="Category" name="category" defaultValue="" required>
            <option value="" disabled>Select a category</option>
            <option value="crew">Crew health</option>
            <option value="habitat">Habitat</option>
            <option value="equipment">Equipment</option>
          </DashboardSelect>
          <DashboardInput label="Mission day" name="day" type="number" min={1} step={1} placeholder="e.g. 1" />
          <DashboardInput label="Date" name="date" type="date" />
        </div>
        <DashboardTextarea label="Notes" name="notes" placeholder="Add an observation" />
        <DashboardCheckbox label="Flag for follow-up" name="followUp" />
        <div className={styles.actions}>
          <DashboardButton type="submit">Preview entry</DashboardButton>
          <button className={styles.reset} type="reset">Reset fields</button>
        </div>
        <p className={styles.status} role="status">{status}</p>
      </form>
    </main>
  );
}
