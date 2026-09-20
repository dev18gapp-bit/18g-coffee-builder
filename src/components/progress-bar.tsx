interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div style={styles.wrap}>
      <div style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ ...styles.dot, ...(i <= current ? styles.dotActive : {}) }} />
        ))}
      </div>
      <span style={styles.label}>
        Step {current + 1} of {total}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    display: 'flex',
    gap: 8,
  },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245,236,215,0.18)',
    transition: 'background-color 0.3s ease',
  },
  dotActive: {
    backgroundColor: '#C9A84C',
  },
  label: {
    color: 'rgba(245,236,215,0.45)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
};
