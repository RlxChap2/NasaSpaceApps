'use client';

import { useState } from 'react';
import { LuClipboardList, LuPalette, LuPlus, LuScanLine, LuWatch } from 'react-icons/lu';

const questions = [
  {
    id: 'explore',
    Icon: LuScanLine,
    question: 'What can I explore?',
    answer: 'A full anatomical body, an internal organ view, colored example health records and daily observations for four crew members.',
  },
  {
    id: 'colors',
    Icon: LuPalette,
    question: 'What do the colors mean?',
    answer: 'Green represents a good example status with routine monitoring. Yellow needs review. Red needs attention. White means no linked health data.',
  },
  {
    id: 'records',
    Icon: LuClipboardList,
    question: 'Where do the daily records come from?',
    answer: 'The daily records come from the supplied simulated astronaut dataset. They include sleep, stress, mood, heart rate, blood pressure, temperature, glucose and cabin CO₂.',
  },
  {
    id: 'wearable',
    Icon: LuWatch,
    question: 'Is the platform connected to a wearable?',
    answer: 'The current experience uses simulated records and manual entries. Wearable connections and operational medical use are future work.',
  },
];

export default function MissionFaq() {
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  return (
    <section className="mission-faq" id="questions" aria-labelledby="mission-faq-title">
      <h2 id="mission-faq-title" data-reveal>A CLOSER<br /><span>LOOK.</span></h2>
      <div data-reveal>
        {questions.map(({ id, Icon, question, answer }) => {
          const isOpen = openQuestions.includes(id);
          const panelId = `mission-faq-${id}`;

          return (
            <article className="mission-faq-item" key={id} data-open={isOpen}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenQuestions(open =>
                    open.includes(id) ? open.filter(item => item !== id) : [...open, id]
                  )}
                >
                  <Icon className="mission-faq-topic" aria-hidden="true" />
                  {question}
                  <span className="mission-faq-toggle" aria-hidden="true"><LuPlus size={16} /></span>
                </button>
              </h3>
              <div className="mission-faq-answer" id={panelId} inert={!isOpen}>
                <div><p>{answer}</p></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
