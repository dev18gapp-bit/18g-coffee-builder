'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { type ImagePayload } from '@/lib/files';
import PhotoUpload from '@/components/photo-upload';

interface OptionRow {
  id: string;
  category: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
}

interface StepImageRow {
  step_id: string;
  image_url: string | null;
}

type Category = 'bean' | 'milk' | 'syrup' | 'temperature';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'bean', label: 'Beans' },
  { id: 'milk', label: 'Milk' },
  { id: 'syrup', label: 'Syrup' },
  { id: 'temperature', label: 'Temperature' },
];

const STEP_IMAGE_SLOTS: { id: string; label: string }[] = [
  { id: 'grind', label: 'Grind' },
  { id: 'espresso', label: 'Espresso' },
  { id: 'cup', label: 'Cup' },
];

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('bean');
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [stepImages, setStepImages] = useState<StepImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState<ImagePayload | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // localStorage isn't available during the static-export server render,
    // so reading it (and thus knowing the real token) can only happen once
    // this runs client-side after hydration — this setState is intentional
    // and hydration-safe, not the effect-derived-state footgun the rule is
    // meant to catch.
    const stored = localStorage.getItem('coffeeBuilderAdminToken');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(stored);
  }, [router]);

  const load = useCallback(
    async (activeToken: string, activeCategory: Category) => {
      setLoading(true);
      setError('');
      try {
        const [optionsRes, stepImagesRes] = await Promise.all([
          fetch(`${API_URL}/coffee-builder-admin/options?category=${activeCategory}`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
          fetch(`${API_URL}/coffee-builder-admin/step-images`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          }),
        ]);
        if (optionsRes.status === 401 || stepImagesRes.status === 401) {
          localStorage.removeItem('coffeeBuilderAdminToken');
          router.push('/admin/login');
          return;
        }
        setOptions(await optionsRes.json());
        setStepImages(await stepImagesRes.json());
      } catch {
        setError('Could not load options — check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    // Fetch the catalog whenever the token first arrives or the tab
    // changes — a standard "sync with an external system" effect; `load`
    // sets loading state as its very first statement, which is what trips
    // the (overly broad, here) lint rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) load(token, category);
  }, [token, category, load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setCreating(true);
    try {
      await fetch(`${API_URL}/coffee-builder-admin/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category,
          name: newName.trim(),
          description: newDescription.trim(),
          sortOrder: options.length,
          ...(newImage ? { image: newImage } : {}),
        }),
      });
      setNewName('');
      setNewDescription('');
      setNewImage(null);
      await load(token, category);
    } finally {
      setCreating(false);
    }
  }

  async function patchOption(id: string, patch: Record<string, unknown>) {
    if (!token) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`${API_URL}/coffee-builder-admin/options/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not save that change.');
        return;
      }
      await load(token, category);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOption(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Remove "${name}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await fetch(`${API_URL}/coffee-builder-admin/options/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await load(token, category);
    } finally {
      setBusyId(null);
    }
  }

  async function swap(index: number, direction: -1 | 1) {
    const a = options[index];
    const b = options[index + direction];
    if (!a || !b || !token) return;
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`${API_URL}/coffee-builder-admin/options/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: b.sort_order }),
        }),
        fetch(`${API_URL}/coffee-builder-admin/options/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sortOrder: a.sort_order }),
        }),
      ]);
      await load(token, category);
    } finally {
      setBusyId(null);
    }
  }

  async function uploadStepImage(stepId: string, image: ImagePayload) {
    if (!token) return;
    setBusyId(`step_${stepId}`);
    setError('');
    try {
      const res = await fetch(`${API_URL}/coffee-builder-admin/step-images/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not upload that photo.');
        return;
      }
      await load(token, category);
    } finally {
      setBusyId(null);
    }
  }

  function signOut() {
    localStorage.removeItem('coffeeBuilderAdminToken');
    router.push('/admin/login');
  }

  if (!token) return null;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.label}>COFFEE BUILDER ADMIN</p>
          <div style={styles.divider} />
        </div>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign Out
        </button>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      <section style={styles.section}>
        <p style={styles.sectionTitle}>Step Photos</p>
        <p style={styles.sectionHint}>One photo each for the steps that aren&apos;t a pick-a-flavor list.</p>
        <div style={styles.stepImageRow}>
          {STEP_IMAGE_SLOTS.map((slot) => {
            const row = stepImages.find((s) => s.step_id === slot.id);
            return (
              <div key={slot.id} style={styles.stepImageCard}>
                <span style={styles.stepImageLabel}>{slot.label}</span>
                <PhotoUpload
                  imageUrl={row?.image_url}
                  size={72}
                  busy={busyId === `step_${slot.id}`}
                  onUpload={(image) => uploadStepImage(slot.id, image)}
                  onError={setError}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div style={styles.tabs}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            style={{ ...styles.tab, ...(category === c.id ? styles.tabActive : {}) }}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <form style={styles.addForm} onSubmit={handleCreate}>
        <div style={styles.addFormRow}>
          <input
            style={styles.addInput}
            placeholder={`New ${category} name…`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            style={{ ...styles.addInput, flex: 2 }}
            placeholder="Short description (aroma notes, flavor, etc.)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button type="submit" style={styles.addBtn} disabled={creating || !newName.trim()}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </div>
        <PhotoUpload
          imageUrl={newImage ? `data:${newImage.contentType};base64,${newImage.data}` : null}
          onUpload={setNewImage}
          onError={setError}
        />
      </form>

      {loading ? (
        <p style={styles.emptyText}>Loading…</p>
      ) : options.length === 0 ? (
        <p style={styles.emptyText}>Nothing here yet — add the first {category} above.</p>
      ) : (
        <div style={styles.list}>
          {options.map((o, i) => (
            <div key={o.id} style={{ ...styles.row, opacity: o.active ? 1 : 0.45 }}>
              <div style={styles.reorder}>
                <button
                  style={styles.reorderBtn}
                  disabled={i === 0 || busyId === o.id}
                  onClick={() => swap(i, -1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  style={styles.reorderBtn}
                  disabled={i === options.length - 1 || busyId === o.id}
                  onClick={() => swap(i, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <PhotoUpload
                imageUrl={o.image_url}
                busy={busyId === o.id}
                onUpload={(image) => patchOption(o.id, { image })}
                onError={setError}
              />

              <div style={styles.rowFields}>
                <input
                  style={styles.rowInput}
                  defaultValue={o.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== o.name && patchOption(o.id, { name: e.target.value.trim() })}
                />
                <input
                  style={{ ...styles.rowInput, ...styles.rowDescription }}
                  defaultValue={o.description}
                  onBlur={(e) => e.target.value !== o.description && patchOption(o.id, { description: e.target.value })}
                />
              </div>

              <label style={styles.activeToggle}>
                <input
                  type="checkbox"
                  checked={o.active}
                  onChange={(e) => patchOption(o.id, { active: e.target.checked })}
                />
                Active
              </label>

              <button style={styles.deleteBtn} onClick={() => deleteOption(o.id, o.name)} disabled={busyId === o.id}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#100C08',
    padding: 'clamp(24px, 5vw, 60px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  label: {
    color: '#F5ECD7',
    fontSize: 10,
    fontFamily: 'var(--font-raleway)',
    fontWeight: 700,
    letterSpacing: '4px',
    marginBottom: 12,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#C9A84C',
    opacity: 0.6,
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    padding: '8px 16px',
    color: 'rgba(245,236,215,0.6)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  section: {
    marginBottom: 32,
    maxWidth: 820,
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 10,
    padding: '18px 22px',
  },
  sectionTitle: {
    color: '#F5ECD7',
    fontFamily: 'var(--font-playfair)',
    fontSize: 16,
    fontWeight: 600,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 16,
    color: 'rgba(245,236,215,0.45)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
  },
  stepImageRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
  },
  stepImageCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepImageLabel: {
    color: 'rgba(245,236,215,0.55)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  tabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 4,
    padding: '8px 18px',
    color: 'rgba(245,236,215,0.5)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  tabActive: {
    borderColor: '#C9A84C',
    color: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
    maxWidth: 820,
  },
  addFormRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  addInput: {
    flex: 1,
    minWidth: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
    outline: 'none',
  },
  addBtn: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    border: '1px solid rgba(201,168,76,0.5)',
    borderRadius: 6,
    padding: '10px 22px',
    color: '#C9A84C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  emptyText: {
    color: 'rgba(245,236,215,0.4)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
  },
  errorText: {
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 13,
    marginBottom: 16,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 820,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: '1px solid rgba(245,236,215,0.12)',
    borderRadius: 8,
    padding: '12px 16px',
  },
  reorder: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  reorderBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.2)',
    borderRadius: 4,
    width: 26,
    height: 22,
    color: 'rgba(245,236,215,0.6)',
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
  },
  rowFields: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    minWidth: 0,
  },
  rowInput: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#F5ECD7',
    fontFamily: 'var(--font-raleway)',
    fontSize: 14,
    fontWeight: 600,
    // No custom :focus style available on inline styles — leaving the
    // native outline in place so it's still clear which field is active.
  },
  rowDescription: {
    color: 'rgba(245,236,215,0.55)',
    fontWeight: 400,
    fontSize: 13,
    flex: 2,
  },
  activeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(245,236,215,0.55)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(229,161,92,0.4)',
    borderRadius: 4,
    padding: '6px 14px',
    color: '#E5A15C',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
