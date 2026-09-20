'use client';

import { useEffect, useRef, useState } from 'react';
import SiteHeader from '@/components/site-header';
import ProgressBar from '@/components/progress-bar';
import OptionCard from '@/components/option-card';
import { STEPS, findOption, fetchCoffeeBuilderOptions, type CoffeeStep, type Selections } from '@/lib/coffee-flow';

const AUTO_ADVANCE_MS = 650;

export default function BuilderPage() {
  const [steps, setSteps] = useState<CoffeeStep[]>(STEPS);
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Pull the live bean/milk/syrup catalog once on load. Falls back silently
  // to the placeholder lists in coffee-flow.ts if the fetch fails or a
  // category has nothing added in admin yet — the kiosk should never sit
  // there blank.
  useEffect(() => {
    fetchCoffeeBuilderOptions().then((fetched) => {
      if (!fetched) return;
      setSteps((prev) =>
        prev.map((s) => {
          if (!s.optionsCategory) return s;
          const live = fetched[s.optionsCategory];
          return live.length > 0 ? { ...s, options: live } : s;
        })
      );
    });
  }, []);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleSelect(optionId: string) {
    setSelections((prev) => ({ ...prev, [step.id]: optionId }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, AUTO_ADVANCE_MS);
  }

  function handleStartOver() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setSelections({});
    setStepIndex(0);
  }

  const recapSteps = steps.filter((s) => s.kind === 'choice');

  return (
    <>
      <SiteHeader />
      <main style={styles.page}>
        <div style={styles.topBar}>
          {!isFirst && !isLast && (
            <button type="button" onClick={goBack} style={styles.backBtn}>
              ← Back
            </button>
          )}
          <div style={styles.progressSlot}>
            <ProgressBar current={stepIndex} total={steps.length} />
          </div>
        </div>

        <div key={step.id} style={styles.stage}>
          <p style={styles.eyebrow}>{step.eyebrow}</p>
          <h1 style={styles.title}>{step.title}</h1>
          <p style={styles.subtitle}>{step.subtitle}</p>

          {step.kind === 'choice' && (
            <div style={styles.grid}>
              {step.options?.map((option) => (
                <OptionCard
                  key={option.id}
                  name={option.name}
                  description={option.description}
                  icon={option.imageUrl || step.icon}
                  selected={selections[step.id] === option.id}
                  onSelect={() => handleSelect(option.id)}
                />
              ))}
            </div>
          )}

          {step.kind === 'process' && (
            <div style={styles.processBlock}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={step.icon} alt="" style={styles.processIcon} />
              <button type="button" onClick={goNext} style={styles.primaryBtn}>
                {step.cta ?? 'Next'}
              </button>
            </div>
          )}

          {step.kind === 'summary' && (
            <div style={styles.processBlock}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={step.icon} alt="" style={styles.processIcon} />
              <div style={styles.recap}>
                {recapSteps.map((recapStep) => {
                  const chosen = findOption(recapStep, selections[recapStep.id]);
                  if (!chosen) return null;
                  return (
                    <div key={recapStep.id} style={styles.recapRow}>
                      <span style={styles.recapLabel}>{recapStep.title.replace('Choose Your ', '').replace('?', '')}</span>
                      <span style={styles.recapValue}>{chosen.name}</span>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={handleStartOver} style={styles.primaryBtn}>
                {step.cta ?? 'Start Over'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'var(--coffee-ground)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 32px 64px',
  },
  topBar: {
    position: 'relative',
    width: '100%',
    maxWidth: 960,
    marginTop: 96,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSlot: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 999,
    padding: '10px 20px',
    color: 'rgba(245,236,215,0.7)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  stage: {
    width: '100%',
    maxWidth: 960,
    marginTop: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    animation: 'fadeIn 0.5s ease',
  },
  eyebrow: {
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '4px',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-playfair)',
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: 600,
    lineHeight: 1.15,
  },
  subtitle: {
    marginTop: 14,
    maxWidth: 560,
    color: 'rgba(245,236,215,0.55)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 16,
    lineHeight: 1.6,
  },
  grid: {
    marginTop: 40,
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
  },
  processBlock: {
    marginTop: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  processIcon: {
    width: 140,
    height: 140,
    animation: 'popIn 0.5s ease',
  },
  primaryBtn: {
    backgroundColor: '#C9A84C',
    border: 'none',
    borderRadius: 999,
    padding: '18px 44px',
    color: '#100C08',
    fontFamily: 'var(--font-raleway)',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  recap: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 16,
    padding: '24px 28px',
  },
  recapRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
  },
  recapLabel: {
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  recapValue: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'right',
  },
};
