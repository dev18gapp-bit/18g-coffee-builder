interface OptionCardProps {
  name: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}

export default function OptionCard({ name, description, icon, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ ...styles.card, ...(selected ? styles.cardSelected : {}) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" style={styles.icon} />
      <span style={styles.name}>{name}</span>
      <span style={styles.description}>{description}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(201,168,76,0.22)',
    borderRadius: 16,
    padding: '28px 20px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
  },
  cardSelected: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.1)',
    transform: 'scale(1.03)',
  },
  icon: {
    width: 64,
    height: 64,
  },
  name: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-playfair)',
    fontSize: 18,
    fontWeight: 600,
  },
  description: {
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    lineHeight: 1.5,
  },
};
