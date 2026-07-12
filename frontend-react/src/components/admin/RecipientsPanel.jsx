import { useState, useEffect, useCallback } from 'react';
import { PageHero, KpiCard, Card, StatusBadge } from '../ui';

const WG_CONTACTS_KEY = 'wg_contacts';

const DEFAULT_CONTACTS = [
  { id: 'c001', name: 'Ajmal',   phone: '+91 9876543210', location: 'Kochi Coast', enabled: true },
  { id: 'c002', name: 'Shadeed', phone: '+91 9123456780', location: 'Alappuzha',   enabled: true },
  { id: 'c003', name: 'Adil',    phone: '+91 9988776655', location: 'Kollam',       enabled: false },
  { id: 'c004', name: 'Sinan',   phone: '+91 9090909090', location: 'Kozhikode',   enabled: true },
];

function loadContacts() {
  try {
    const stored = localStorage.getItem(WG_CONTACTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CONTACTS;
}

function saveContacts(contacts) {
  try { localStorage.setItem(WG_CONTACTS_KEY, JSON.stringify(contacts)); } catch {}
}

function genId() { return 'c' + Date.now() + Math.floor(Math.random() * 1000); }

export default function RecipientsPanel({ showToast }) {
  const [contacts, setContacts] = useState(() => loadContacts());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', location: '', enabled: true });
  const [formError, setFormError] = useState('');

  useEffect(() => { saveContacts(contacts); }, [contacts]);

  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q);
    const matchesFilter = filterStatus === 'all' || (filterStatus === 'enabled' && c.enabled) || (filterStatus === 'disabled' && !c.enabled);
    return matchesSearch && matchesFilter;
  });

  const enabled = contacts.filter(c => c.enabled).length;
  const disabled = contacts.length - enabled;

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', phone: '', location: '', enabled: true });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, phone: contact.phone, location: contact.location || '', enabled: contact.enabled });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = () => {
    setFormError('');
    if (!formData.name.trim()) { setFormError('Name is required.'); return; }
    if (!formData.phone.trim()) { setFormError('Phone number is required.'); return; }
    if (!/^\+?\d[\d\s\-]{6,}$/.test(formData.phone.replace(/\s/g, ''))) {
      setFormError('Please enter a valid phone number (e.g. +919876543210).'); return;
    }

    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...formData } : c));
      showToast?.('✅ Contact updated successfully', 'success');
    } else {
      setContacts(prev => [...prev, { id: genId(), ...formData }]);
      showToast?.('✅ Contact added successfully', 'success');
    }
    setModalOpen(false);
  };

  const openDeleteModal = (contact) => { setDeleteTarget(contact); setDeleteModalOpen(true); };

  const confirmDelete = () => {
    if (deleteTarget) {
      setContacts(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast?.(`🗑️ ${deleteTarget.name} removed`, 'info');
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const exportContacts = () => {
    const json = JSON.stringify(contacts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'contacts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast?.('📥 contacts.json exported', 'success');
  };

  // Escape to close modals
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setModalOpen(false); setDeleteModalOpen(false); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex flex-col flex-1 animate-fade-slide-up">
      <PageHero
        eyebrow="SMS Alert Management"
        title="Alert Recipients"
        subtitle="Manage contacts who receive SMS warnings when a surge is triggered · Prototype mode"
      />
      <div className="px-4 md:px-8 py-7 flex-1">
        {/* Info Note */}
        <div className="flex items-start gap-3 px-4.5 py-3.5 bg-wg-blue-xlt border border-wg-blue-lt rounded-[7px] text-xs text-wg-muted leading-relaxed mb-5">
          <span className="text-lg shrink-0 mt-0.5">📡</span>
          <div>
            <strong className="text-navy">Future Integration:</strong> These phone numbers will be used by the backend GSM module to send SMS alerts when system status becomes{' '}
            <StatusBadge status="WARNING" className="text-[10px] align-middle" />.
            Only <strong>Enabled</strong> contacts will receive messages. In prototype mode, contacts are stored in your browser.
            Export as <code className="bg-wg-border px-1.5 py-0.5 rounded text-[11px]">contacts.json</code> to use with your backend.
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Total Contacts" value={contacts.length} sub="In recipients list" accent="blue" delay={50} />
          <KpiCard label="Enabled" value={<span className="text-wg-normal">{enabled}</span>} sub="Will receive SMS alerts" accent="normal" delay={100} />
          <KpiCard label="Disabled" value={<span className="text-wg-muted-2">{disabled}</span>} sub="Paused, won't receive SMS" accent="blue" delay={150} />
          <KpiCard label="SMS Trigger" value={<span className="text-[15px] text-wg-warn">WARNING</span>} sub="Status level that sends SMS" accent="warn" delay={200} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or location…"
                className="pl-9 pr-3.5 py-2 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none w-[220px] focus:border-wg-blue-3 transition-colors font-[family-name:var(--font-family-sora)]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border-[1.5px] border-wg-border rounded-[7px] text-xs text-navy bg-white outline-none font-[family-name:var(--font-family-sora)]"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2 bg-wg-blue-2 text-white border-none rounded-[7px] text-[13px] font-semibold cursor-pointer hover:bg-wg-blue transition-all shadow-md shadow-wg-blue-2/25 font-[family-name:var(--font-family-sora)]"
          >
            ＋ Add Contact
          </button>
        </div>

        {/* Table */}
        <Card
          title={<>
            <span>{filteredContacts.length === contacts.length ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}` : `${filteredContacts.length} of ${contacts.length} contacts shown`}</span>
            <button onClick={exportContacts} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11px] font-semibold border-[1.5px] border-wg-border text-wg-muted bg-white cursor-pointer hover:border-wg-blue-2 hover:text-wg-blue transition-colors font-[family-name:var(--font-family-sora)]">
              ↓ Export JSON
            </button>
          </>}
          className="mb-5"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[540px]">
            <thead>
              <tr>
                {['Name', 'Phone Number', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 bg-wg-blue-xlt text-wg-blue text-[10px] uppercase tracking-wider font-bold border-b border-wg-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="text-center py-12 text-wg-muted-2">
                      <div className="text-5xl mb-3">📭</div>
                      <div className="text-base font-bold text-wg-muted mb-1">{contacts.length === 0 ? 'No contacts yet' : 'No results found'}</div>
                      <div className="text-[13px]">{contacts.length === 0 ? 'Click "＋ Add Contact" to add your first alert recipient.' : 'Try adjusting your search or filter.'}</div>
                    </div>
                  </td>
                </tr>
              ) : filteredContacts.map(c => (
                <tr key={c.id} className="hover:bg-sky-50/50">
                  <td className="px-4 py-3 border-b border-wg-border font-semibold text-navy">{c.name}</td>
                  <td className="px-4 py-3 border-b border-wg-border font-mono text-[13px] text-navy tracking-wide">{c.phone}</td>
                  <td className="px-4 py-3 border-b border-wg-border text-wg-muted text-xs">{c.location || '—'}</td>
                  <td className="px-4 py-3 border-b border-wg-border">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${c.enabled ? 'bg-wg-normal-bg text-wg-normal border-wg-normal-bd' : 'bg-gray-100 text-wg-muted-2 border-wg-border'}`}>
                      <span className="w-[5px] h-[5px] rounded-full bg-current" />
                      {c.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-wg-border">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => openEditModal(c)} className="px-3.5 py-1 border-[1.5px] border-wg-blue-lt bg-wg-blue-xlt text-wg-blue rounded-md text-[11px] font-semibold cursor-pointer hover:border-wg-blue-2 hover:bg-wg-blue-lt transition-all font-[family-name:var(--font-family-sora)]">✏️ Edit</button>
                      <button onClick={() => openDeleteModal(c)} className="px-3.5 py-1 border-[1.5px] border-wg-warn-bd bg-wg-warn-bg text-wg-warn rounded-md text-[11px] font-semibold cursor-pointer hover:bg-red-100 hover:border-wg-warn transition-all font-[family-name:var(--font-family-sora)]">🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        {/* SMS Logic Reference */}
        <Card title="SMS Alert Logic — Phase 2 Reference" className="mb-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-wg-off rounded-[7px] p-4 border-l-[3px] border-l-wg-blue-2">
              <div className="text-[10px] font-bold tracking-wider uppercase text-wg-muted-2 mb-1.5">Trigger Condition</div>
              <div className="text-[13px] text-navy">Status transitions to <strong>WARNING</strong> from any prior state</div>
            </div>
            <div className="bg-wg-off rounded-[7px] p-4 border-l-[3px] border-l-wg-normal">
              <div className="text-[10px] font-bold tracking-wider uppercase text-wg-muted-2 mb-1.5">Recipients</div>
              <div className="text-[13px] text-navy">All contacts with <strong>Enabled</strong> status receive SMS immediately</div>
            </div>
            <div className="bg-wg-off rounded-[7px] p-4 border-l-[3px] border-l-wg-watch">
              <div className="text-[10px] font-bold tracking-wider uppercase text-wg-muted-2 mb-1.5">Message Template</div>
              <div className="text-xs text-wg-muted font-mono bg-sky-50 px-2 py-1.5 rounded mt-1">
                ⚠ WAVEGUARD WARNING: Surge detected at WG-01. Stay away from sea. -Kothamangalam Authority
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-navy text-white/30 px-4 md:px-8 py-4 text-[11px] flex items-center justify-between">
        <span>WaveGuard – Alert Recipients · Prototype Storage</span>
        <span>Kothamangalam, Kerala</span>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-navy/45 z-[999] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-[460px] max-w-[94vw] shadow-[0_24px_64px_rgba(8,25,46,0.3)] overflow-hidden animate-fade-slide-up">
            <div className="bg-gradient-to-r from-navy-2 to-wg-blue px-7 py-5.5 text-white flex items-center justify-between">
              <div className="font-[family-name:var(--font-family-dm-serif)] text-xl">{editingContact ? 'Edit Contact' : 'Add Contact'}</div>
              <button onClick={() => setModalOpen(false)} className="bg-white/15 border-none text-white w-[30px] h-[30px] rounded-lg cursor-pointer text-lg flex items-center justify-center hover:bg-white/25 transition-colors">✕</button>
            </div>
            <div className="px-7 py-6">
              <div className="mb-4.5">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-wg-muted mb-1.5">Full Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Fisherman Leader"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-wg-border rounded-[7px] text-sm text-navy bg-white outline-none focus:border-wg-blue-3 focus:shadow-[0_0_0_3px_rgba(58,158,232,.1)] transition-all font-[family-name:var(--font-family-sora)] placeholder:text-wg-muted-2" autoFocus />
              </div>
              <div className="mb-4.5">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-wg-muted mb-1.5">Phone Number * <span className="text-[10px] font-normal text-wg-muted-2">(include country code)</span></label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))} placeholder="e.g. +919876543210"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-wg-border rounded-[7px] text-sm text-navy bg-white outline-none focus:border-wg-blue-3 focus:shadow-[0_0_0_3px_rgba(58,158,232,.1)] transition-all font-[family-name:var(--font-family-sora)] placeholder:text-wg-muted-2" />
              </div>
              <div className="mb-4.5">
                <label className="block text-[11px] font-bold tracking-wider uppercase text-wg-muted mb-1.5">Location / Zone</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData(d => ({ ...d, location: e.target.value }))} placeholder="e.g. Beach Zone 1"
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-wg-border rounded-[7px] text-sm text-navy bg-white outline-none focus:border-wg-blue-3 focus:shadow-[0_0_0_3px_rgba(58,158,232,.1)] transition-all font-[family-name:var(--font-family-sora)] placeholder:text-wg-muted-2" />
              </div>
              <div className="flex items-center justify-between px-3.5 py-3 bg-wg-off rounded-[7px] border border-wg-border">
                <div>
                  <div className="text-[13px] font-medium">Enable SMS Alerts</div>
                  <div className="text-[11px] text-wg-muted mt-0.5">This contact will receive SMS when WARNING is triggered</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={formData.enabled} onChange={(e) => setFormData(d => ({ ...d, enabled: e.target.checked }))} />
                  <span className="toggle-slider" />
                </label>
              </div>
              {formError && (
                <div className="bg-wg-warn-bg border border-wg-warn-bd text-wg-warn text-xs font-medium px-3.5 py-2 rounded-[7px] mt-3">{formError}</div>
              )}
            </div>
            <div className="px-7 py-4 border-t border-wg-border flex items-center justify-between bg-wg-off">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2 border-[1.5px] border-wg-border bg-white text-wg-muted rounded-[7px] text-[13px] font-semibold cursor-pointer hover:border-wg-blue-2 hover:text-wg-blue transition-all font-[family-name:var(--font-family-sora)]">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-wg-blue-2 text-white border-none rounded-[7px] text-[13px] font-bold cursor-pointer hover:bg-wg-blue transition-all shadow-md shadow-wg-blue-2/25 font-[family-name:var(--font-family-sora)]">💾 {editingContact ? 'Update Contact' : 'Save Contact'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 bg-navy/45 z-[999] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setDeleteModalOpen(false)}>
          <div className="bg-white rounded-2xl w-[380px] max-w-[94vw] shadow-[0_24px_64px_rgba(8,25,46,0.3)] overflow-hidden animate-fade-slide-up">
            <div className="bg-gradient-to-r from-red-800 to-wg-warn px-7 py-5.5 text-white flex items-center justify-between">
              <div className="font-[family-name:var(--font-family-dm-serif)] text-xl">Delete Contact</div>
              <button onClick={() => setDeleteModalOpen(false)} className="bg-white/15 border-none text-white w-[30px] h-[30px] rounded-lg cursor-pointer text-lg flex items-center justify-center hover:bg-white/25 transition-colors">✕</button>
            </div>
            <div className="px-7 py-6 text-center">
              <div className="text-[44px] mb-3">🗑️</div>
              <div className="text-[17px] font-bold text-navy mb-1.5">Remove this contact?</div>
              <div className="text-[13px] text-wg-muted leading-relaxed">
                <strong>{deleteTarget.name}</strong> ({deleteTarget.phone}) will be permanently removed from the alert recipients list.
              </div>
            </div>
            <div className="px-7 py-4 border-t border-wg-border flex items-center justify-end gap-2.5 bg-wg-off">
              <button onClick={() => setDeleteModalOpen(false)} className="px-5 py-2 border-[1.5px] border-wg-border bg-white text-wg-muted rounded-[7px] text-[13px] font-semibold cursor-pointer hover:border-wg-blue-2 hover:text-wg-blue transition-all font-[family-name:var(--font-family-sora)]">Cancel</button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-wg-warn text-white border-none rounded-[7px] text-[13px] font-bold cursor-pointer hover:bg-red-700 transition-all font-[family-name:var(--font-family-sora)]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
