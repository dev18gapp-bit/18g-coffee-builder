import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header style={styles.header}>
      <Link href="/" style={styles.headerLogoLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.jpg" alt="18g Coffee & Roastery" style={styles.headerLogoImg} />
      </Link>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(1100px, 92%)',
    zIndex: 50,
    minHeight: 125,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px clamp(20px, 5vw, 56px)',
    backgroundColor: '#F0EBE1',
    border: '1px solid rgba(44,34,24,0.1)',
    borderRadius: 12,
  },
  headerLogoLink: {
    cursor: 'pointer',
  },
  headerLogoImg: {
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    height: 160,
    width: 'auto',
    mixBlendMode: 'multiply' as const,
  },
};
