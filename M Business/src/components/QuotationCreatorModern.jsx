import React, { useState, useEffect, useCallback, useRef } from 'react';
import QuotationCreator from './QuotationCreator';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BASE_URL } from '../config';

function QuoToast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: 'var(--surface)', border: '2px solid #22c55e', borderRadius: 16, padding: '14px 24px', fontSize: 14, fontWeight: 800, color: '#22c55e', boxShadow: '0 8px 24px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp 0.3s ease-out' }}>
      ✅ {msg}
    </div>
  );
}

export default function QuotationCreatorModern(props) {
  const [showModernForm, setShowModernForm] = useState(!!props.newlyAddedClientName);
  const [editEntry, setEditEntry] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  // If a client was just added while we were mid-way through the Modern
  // Form (via "+ New Client"), the parent tears this whole tab down and
  // rebuilds it — so jump straight back into the form instead of the list.
  useEffect(() => {
    if (props.newlyAddedClientName) {
      setShowModernForm(true);
    }
  }, [props.newlyAddedClientName]);

  const handleNew = () => {
    setEditEntry(null);
    setShowModernForm(true);
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setShowModernForm(true);
  };

  const handleBack = () => {
    setShowModernForm(false);
    setEditEntry(null);
    // Force QuotationCreator to re-mount and re-fetch the latest list
    setListRefreshKey(k => k + 1);
  };

  if (!showModernForm) {
    return <QuotationCreator key={listRefreshKey} {...props} onNewQuotation={handleNew} onEditQuotation={handleEdit} />;
  }
  return <ModernForm onBack={handleBack} editEntry={editEntry} {...props} />;
}

const genId = () => Date.now() + Math.random();
const today = new Date().toISOString().split('T')[0];
const quoteNo = 'QUO-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);
function ModernForm({ onBack, user, clients = [], editEntry = null, onAddClient, newlyAddedClientName }) {
  // ── Pre-fill from existing entry if editing ──
  // The API returns: entry.qt (saved form data), entry.items (line items),
  // entry.id (MongoDB _id), entry.client (top-level shortcut), entry.status
  const existingQt = editEntry?.qt || {};
  const existingItems = editEntry?.items || [];
  const isEditing = !!editEntry;

  // ── Resolve all field names — DB saves with legacy names, form uses new names ──
  // DB field  →  Form field
  // qt.client  →  toName        (client name)
  // qt.project →  title         (project title)
  // qt.date    →  quoteDate     (quote date)
  // qt.companyName → fromCompany
  // qt.companyEmail → fromEmail
  // qt.companyPhone → fromPhone
  const resolvedToName = existingQt.toName || existingQt.client || editEntry?.client || '';
  const resolvedTitle = existingQt.title || existingQt.project || '';
  const resolvedQuoteDate = existingQt.quoteDate || existingQt.date || today;
  const resolvedFromCompany = existingQt.fromCompany || existingQt.companyName || user?.companyName || '';
  const resolvedFromName = existingQt.fromName || user?.ownerName || user?.name || '';
  const resolvedFromEmail = existingQt.fromEmail || existingQt.companyEmail || user?.email || '';
  const resolvedFromPhone = existingQt.fromPhone || existingQt.companyPhone || user?.phone || '';
  const resolvedNotes = existingQt.notes || existingQt.terms || '';
  const resolvedValidity = existingQt.validity || '30';
  const resolvedStatus = (existingQt.status || editEntry?.status || 'DRAFT').toUpperCase();

  // ── Form fields ──
  const [qt, setQt] = useState({
    quoteNo: existingQt.quoteNo || editEntry?.quoteNo || quoteNo,
    quoteDate: resolvedQuoteDate,
    title: resolvedTitle,
    type: existingQt.type || '',
    description: existingQt.description || '',
    fromCompany: resolvedFromCompany,
    fromName: resolvedFromName,
    fromEmail: resolvedFromEmail,
    fromPhone: resolvedFromPhone,
    toName: resolvedToName,
    toContact: existingQt.toContact || '',
    toEmail: existingQt.toEmail || '',
    toPhone: existingQt.toPhone || '',
    toAddress: existingQt.toAddress || '',
    overview: existingQt.overview || '',
    validity: resolvedValidity,
    notes: resolvedNotes,
    status: resolvedStatus,
  });
  const upd = (f, v) => setQt(p => ({ ...p, [f]: v }));

  // ── Tags ──
  const [tags, setTags] = useState(
    Array.isArray(existingQt.tags) && existingQt.tags.length > 0 ? [...existingQt.tags] : []
  );
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput('');
  };
  const removeTag = (t) => setTags(p => p.filter(x => x !== t));

  // ── Phases ──
  const defaultPhases = [
    { id: 1, title: 'Discovery & Design', desc: 'Requirements gathering, wireframing, UI mockups, client review and design approval.', open: true, features: [{ id: 1, text: 'Wireframes (all pages)' }, { id: 2, text: 'UI Design – Desktop + Mobile' }, { id: 3, text: 'Brand style guide' }] },
    { id: 2, title: 'Development', desc: 'Full frontend development, backend integration, CMS setup, responsive design and SEO optimisation.', open: true, features: [{ id: 4, text: 'Responsive frontend (React.js)' }, { id: 5, text: 'CMS integration' }, { id: 6, text: 'Contact form with email notifications' }, { id: 7, text: 'SEO meta tags & sitemap' }] },
    { id: 3, title: 'Testing & Launch', desc: 'Cross-browser testing, performance optimisation, final revisions, deployment and post-launch support.', open: true, features: [{ id: 8, text: 'Cross-browser & device testing' }, { id: 9, text: 'Performance & speed optimisation' }, { id: 10, text: 'Production deployment' }, { id: 11, text: '30-day post-launch support' }] },
  ];
  const [phases, setPhases] = useState(
    Array.isArray(existingQt.phases) && existingQt.phases.length > 0
      ? existingQt.phases.map((ph, i) => ({
        id: ph.id || i + 1,
        title: ph.title || `Phase ${i + 1}`,
        desc: ph.desc || '',
        open: true,
        features: (ph.features || []).map((f, fi) => ({
          id: f.id || fi + 1,
          text: typeof f === 'string' ? f : (f.text || ''),
        })),
      }))
      : defaultPhases
  );
  const addPhase = () => setPhases(p => [...p, { id: genId(), title: 'New Phase', desc: '', open: true, features: [] }]);
  const removePhase = (id) => setPhases(p => p.filter(ph => ph.id !== id));
  const togglePhase = (id) => setPhases(p => p.map(ph => ph.id === id ? { ...ph, open: !ph.open } : ph));
  const updPhaseTitle = (id, v) => setPhases(p => p.map(ph => ph.id === id ? { ...ph, title: v } : ph));
  const updPhaseDesc = (id, v) => setPhases(p => p.map(ph => ph.id === id ? { ...ph, desc: v } : ph));
  const addFeature = (phaseId) => setPhases(p => p.map(ph => ph.id === phaseId ? { ...ph, features: [...ph.features, { id: genId(), text: '' }] } : ph));
  const updFeature = (phaseId, featId, v) => setPhases(p => p.map(ph => ph.id === phaseId ? { ...ph, features: ph.features.map(f => f.id === featId ? { ...f, text: v } : f) } : ph));
  const removeFeature = (phaseId, featId) => setPhases(p => p.map(ph => ph.id === phaseId ? { ...ph, features: ph.features.filter(f => f.id !== featId) } : ph));

  // ── Inclusions / Exclusions ──
  const [inclusions, setInclusions] = useState(
    Array.isArray(existingQt.inclusions) && existingQt.inclusions.length > 0
      ? existingQt.inclusions.map((item, i) => ({
        id: item.id || i + 1,
        text: typeof item === 'string' ? item : (item.text || ''),
      }))
      : [{ id: 1, text: '3 rounds of revisions' }, { id: 2, text: 'Source code handover' }, { id: 3, text: '30-day support post launch' }]
  );
  const [exclusions, setExclusions] = useState(
    Array.isArray(existingQt.exclusions) && existingQt.exclusions.length > 0
      ? existingQt.exclusions.map((item, i) => ({
        id: item.id || i + 1,
        text: typeof item === 'string' ? item : (item.text || ''),
      }))
      : [{ id: 1, text: 'Domain & hosting charges' }, { id: 2, text: 'Content writing / copywriting' }, { id: 3, text: 'Third-party API costs' }]
  );
  const addIncl = () => setInclusions(p => [...p, { id: genId(), text: '' }]);
  const updIncl = (id, v) => setInclusions(p => p.map(i => i.id === id ? { ...i, text: v } : i));
  const removeIncl = (id) => setInclusions(p => p.filter(i => i.id !== id));
  const addExcl = () => setExclusions(p => [...p, { id: genId(), text: '' }]);
  const updExcl = (id, v) => setExclusions(p => p.map(i => i.id === id ? { ...i, text: v } : i));
  const removeExcl = (id) => setExclusions(p => p.filter(i => i.id !== id));

  // ── Line Items — DB saves as {description, quantity, rate}, form uses {desc, qty, rate} ──
  const [items, setItems] = useState(
    existingItems.length > 0
      ? existingItems.map((item, i) => ({
        id: item.id || i + 1,
        desc: item.description || item.desc || '',
        qty: parseFloat(item.quantity ?? item.qty) || 1,
        rate: parseFloat(item.rate) || 0,
      }))
      : [
        { id: 1, desc: 'UI/UX Design', qty: 1, rate: 18000 },
        { id: 2, desc: 'Frontend Development', qty: 1, rate: 25000 },
        { id: 3, desc: 'CMS Integration', qty: 1, rate: 12000 },
      ]
  );
  const addItem = () => setItems(p => [...p, { id: genId(), desc: '', qty: 1, rate: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(p => p.filter(i => i.id !== id)); };
  const updItem = (id, f, v) => setItems(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));

  // ── Totals ──
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.qty) || 0), 0);
  const fmt = (n) => 'INR ' + Number(n).toLocaleString('en-IN');

  // ── Validity — handle custom days (any value not in the preset list) ──
  const presetValidities = ['7', '15', '30', '45', '60', 'Custom'];
  const isCustomValidity = resolvedValidity && !presetValidities.includes(String(resolvedValidity));
  const [customValidity, setCustomValidity] = useState(isCustomValidity ? String(resolvedValidity) : '');
  // If saved validity was a custom number (e.g. "21"), select the Custom button and put value in input
  if (isCustomValidity && qt.validity !== 'Custom') {
    qt.validity = 'Custom';
  }

  // ── Status ──
  const statuses = [
    { value: 'DRAFT', icon: 'Edit', label: 'Draft' },
    { value: 'SENT', icon: 'Export', label: 'Sent' },
    { value: 'NEGOTIATION', icon: 'Partnership', label: 'Negotiation' },
    { value: 'ACCEPTED', icon: 'Success', label: 'Accepted' },
    { value: 'REJECTED', icon: 'Error', label: 'Rejected' },
  ];

  // ── Save ──
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };
  const previewRef = useRef(null);


  // ── Client searchable dropdown ──
  const [clientDropOpen, setClientDropOpen] = useState(!!newlyAddedClientName);
  const [clientSearch, setClientSearch] = useState('');
  const [clientFieldError, setClientFieldError] = useState('');

  useEffect(() => {
    if (newlyAddedClientName) {
      upd('toName', newlyAddedClientName);
      const matched = clients.find(c => (c.clientName || c.name) === newlyAddedClientName);
      if (matched) {
        upd('toContact', matched.contactPersonName || matched.contactPerson || '');
        upd('toEmail', matched.email || '');
        upd('toPhone', matched.contactPersonNo || matched.phone || '');
        upd('toAddress', matched.address || matched.city || '');
      }
      setClientDropOpen(true);
    }
  }, [newlyAddedClientName, clients]);


  const generateQuotationPdf = async () => {
    const element = previewRef.current;
    if (!element) return null;

    const resolveCssVars = (el) => {
      const rootComputed = getComputedStyle(document.documentElement);
      const elComputed = getComputedStyle(el);
      const resolveVar = (varExpr) => {
        let expr = varExpr;
        let prev;
        do {
          prev = expr;
          expr = expr.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_, name, fallback) => {
            const fromEl = elComputed.getPropertyValue(name).trim();
            const fromRoot = rootComputed.getPropertyValue(name).trim();
            return fromEl || fromRoot || (fallback ? fallback.trim() : '');
          });
        } while (expr !== prev && expr.includes('var('));
        return expr;
      };
      const walk = (node) => {
        if (node.nodeType === 1) {
          const st = node.getAttribute('style') || '';
          if (st.includes('var(')) node.setAttribute('style', resolveVar(st));
          Array.from(node.children).forEach(walk);
        }
      };
      walk(el);
    };

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const elemW = element.scrollWidth;
    const elemH = element.scrollHeight;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      width: elemW,
      height: elemH,
      windowWidth: elemW,
      windowHeight: elemH,
      onclone: (doc) => {
        const el = doc.querySelector('.quo-preview');
        if (el) {
          resolveCssVars(el);
          el.style.width = elemW + 'px';
          el.style.maxWidth = 'none';
          el.style.overflow = 'visible';
        }
      }
    });

    const A4_W = 210;
    const A4_H = 297;
    const imgAspect = canvas.width / canvas.height;
    const finalW = A4_W;
    const finalH = A4_W / imgAspect;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    let heightLeft = finalH;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
    heightLeft -= A4_H;
    while (heightLeft > 0) {
      position = heightLeft - finalH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
      heightLeft -= A4_H;
    }
    return pdf;
  };

  const handleDownloadPdf = async () => {
    try {
      showToast('Generating PDF…');
      const pdf = await generateQuotationPdf();
      if (!pdf) return;
      pdf.save(`Quotation_${qt.quoteNo}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error', err);
      showToast('Failed to generate PDF');
    }
  };

  const handlePrint = async () => {
    try {
      showToast('Preparing print…');
      const pdf = await generateQuotationPdf();
      if (!pdf) return;
      pdf.autoPrint();
      const blobURL = pdf.output('bloburl');
      window.open(blobURL, '_blank');
    } catch (err) {
      console.error('Print error', err);
      showToast('Failed to prepare print view');
    }
  };

  const handleShare = async () => {
    try {
      showToast('Generating PDF to share…');
      const pdf = await generateQuotationPdf();
      if (!pdf) return;
      const blob = pdf.output('blob');
      const file = new File([blob], `Quotation_${qt.quoteNo}.pdf`, { type: 'application/pdf' });
      const text = `*${qt.fromCompany || 'Your Business'}*\n\nQuotation: ${qt.quoteNo}\nProject: ${qt.title || ''}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: `Quotation ${qt.quoteNo}`, text, files: [file] });
          showToast('Quotation shared successfully!');
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
      showToast('Sharing not supported on this device — PDF downloaded instead.');
    } catch (err) {
      console.error('Share error', err);
      showToast('Failed to share quotation');
    }
  };

  const handleSave = async (statusArg = 'draft') => {
    const normalStatus = statusArg.toLowerCase();
    if (normalStatus === 'sent' && !qt.toName) {
      setClientFieldError('Client is required');
      requestAnimationFrame(() => {
        const el = document.querySelector('[data-field="client-company-name"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      return;
    }
    setClientFieldError('');
    setSaving(true);
    try {
      const payload = {
        qt: {
          ...qt,
          status: normalStatus,
          client: qt.toName,    // for list display
          project: qt.title,     // for list display
          date: qt.quoteDate, // for list display
          toName: qt.toName,
          title: qt.title,
          quoteDate: qt.quoteDate,
          fromCompany: qt.fromCompany,
          fromName: qt.fromName,
          fromEmail: qt.fromEmail,
          fromPhone: qt.fromPhone,
          tags,
          phases,
          inclusions,
          exclusions,
        },
        items: items.map(item => ({
          id: item.id,
          description: item.desc,
          quantity: item.qty,
          rate: item.rate,
          desc: item.desc,
          qty: item.qty,
        })),
        status: normalStatus,
      };

      const existingId = editEntry?.id || editEntry?._id;
      if (existingId) {
        await axios.put(`${BASE_URL}/api/quotations/${existingId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/quotations`, payload);
      }

      setSaving(false);
      setSaved(true);
      if (normalStatus === 'sent') {
        showToast(`Quotation sent successfully to ${qt.toName}!`);
      } else {
        showToast('Quotation saved successfully!');
      }
      setTimeout(() => { setSaved(false); onBack(); }, normalStatus === 'sent' ? 900 : 1200);
    } catch (e) {
      console.error('Save error', e);
      setSaving(false);
      alert('Failed to save quotation. Please try again.');
    }
  };
  // ── Valid until date ──
  const validUntil = (() => {
    const days = qt.validity === 'Custom' ? (parseInt(customValidity) || 30) : (parseInt(qt.validity) || 30);
    const d = new Date(qt.quoteDate || today);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  const CSS = `
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    :root{
      --teal: var(--app-accent, var(--app-accent, #00BCD4));--teal2:var(--app-accent2, #00ACC1);--teal3:#26D0CE;--teal4:#006E7F;
      --teal-light:var(--teal-light, var(--teal-light, #E0F7FA));--teal-lighter:var(--teal-lighter, #F0FDFE);
      --bg:#F5FAFA;--surface:#FFFFFF;--surface2:#F8FAFB;--border:#E0EEF0;--border2:#C5DDE0;
      --text:#1A2E35;--text2:#607D86;--text3:#A0B8BE;
      --green:#26C281;--green-bg:#E8FAF3;
      --amber:#F5A623;--amber-bg:#FEF5E6;
      --red:#F05C5C;--red-bg:#FEF2F2;
      --purple:#7C5CFC;--purple-bg:#EEE9FF;
      --blue:#2563EB;--blue-bg:#EFF4FF;
      --font:'Nunito',sans-serif;--radius:14px;
    }
    .mqc-wrap{font-family:var(--font);font-size:14px;background:var(--bg);color:var(--text);min-height:100vh}
    .mqc-topbar{background:var(--surface);border-bottom:1.5px solid var(--border);padding:0 28px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,188,212,.06)}
    .mqc-topbar-left{display:flex;align-items:center;gap:10px}
    .mqc-back{display:flex;align-items:center;gap:5px;padding:7px 13px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s}
    .mqc-back:hover{border-color:var(--teal);color:var(--teal)}
    .mqc-topbar-title{font-size:16px;font-weight:800;color:var(--text)}
    .mqc-actions{display:flex;align-items:center;gap:8px}
    .mqc-btn-outline{display:flex;align-items:center;gap:5px;padding:8px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s}
    .mqc-btn-outline:hover{border-color:var(--teal);color:var(--teal)}
    .mqc-btn-teal{display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--teal);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;transition:all .15s;box-shadow:0 3px 10px rgba(0,188,212,.25)}
    .mqc-btn-teal:hover{background:var(--teal2)}
    .mqc-btn-amber{background:var(--amber)!important;box-shadow:0 3px 10px rgba(245,166,35,.2)!important}
    .mqc-btn-green{background:var(--green)!important;box-shadow:0 3px 10px rgba(38,194,129,.25)!important}
    .mqc-content{padding:20px 28px 40px;display:grid;grid-template-columns:1fr 420px;gap:20px;align-items:start}
    .mqc-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px}
    .mqc-card:last-child{margin-bottom:0}
    .mqc-card-header{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)}
    .mqc-card-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
    .mqc-card-title{font-size:13px;font-weight:800;color:var(--text)}
    .mqc-card-badge{margin-left:auto;font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:var(--amber-bg);color:var(--amber)}
    .mqc-card-body{padding:18px}
    .mqc-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
    .mqc-form-group{margin-bottom:14px}
    .mqc-form-group:last-child{margin-bottom:0}
    .mqc-label{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;display:block}
    .mqc-input{width:100%;padding:10px 13px;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-input:focus{border-color:var(--teal);background:var(--surface);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
    .mqc-input::placeholder{color:var(--text3)}
    .mqc-input:read-only{background:var(--surface2);color:var(--text3)}
    .mqc-select{width:100%;padding:10px 13px;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;cursor:pointer;appearance:none;transition:all .15s;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A0B8BE' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
    .mqc-select:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
    .mqc-textarea{width:100%;padding:10px 13px;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;resize:vertical;min-height:80px;transition:all .15s;line-height:1.6}
    .mqc-textarea:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
    .mqc-textarea::placeholder{color:var(--text3)}
    .mqc-status-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}
    .mqc-status-chip{padding:9px 6px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;text-align:center;transition:all .15s;font-family:var(--font)}
    .mqc-status-chip:hover{border-color:var(--teal)}
    .mqc-status-chip.sel{border-color:var(--teal);background:var(--teal-lighter)}
    .mqc-sc-icon{font-size:16px;margin-bottom:3px}
    .mqc-sc-label{font-size:9px;font-weight:700;color:var(--text2)}
    .mqc-status-chip.sel .mqc-sc-label{color:var(--teal)}
    .mqc-scope-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}
    .mqc-scope-tag{display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--teal-lighter);border:1.5px solid var(--teal-light);border-radius:20px;font-size:11px;font-weight:700;color:var(--teal)}
    .mqc-tag-x{cursor:pointer;font-size:12px;line-height:1;border:none;background:none;color:var(--teal);padding:0}
    .mqc-tag-x:hover{color:var(--red)}
    .mqc-add-tag-row{display:flex;gap:8px;margin-top:8px}
    .mqc-tag-input{flex:1;padding:8px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-tag-input:focus{border-color:var(--teal)}
    .mqc-tag-input::placeholder{color:var(--text3)}
    .mqc-tag-btn{padding:8px 14px;background:var(--teal-light);border:1.5px solid var(--teal);border-radius:9px;font-size:11px;font-weight:700;color:var(--teal);cursor:pointer;font-family:var(--font);transition:all .15s;white-space:nowrap}
    .mqc-tag-btn:hover{background:var(--teal);color:#fff}
    .mqc-items-table{width:100%;border-collapse:collapse;margin-bottom:12px}
    .mqc-items-table thead tr th{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:8px;text-align:left;background:var(--surface2);border-bottom:1px solid var(--border)}
    .mqc-items-table tbody tr td{padding:5px;border-bottom:1px solid var(--border);vertical-align:middle}
    .mqc-items-table tbody tr:last-child td{border-bottom:none}
    .mqc-item-input{width:100%;padding:8px 9px;background:var(--bg);border:1.5px solid transparent;border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-item-input:focus{border-color:var(--teal);background:var(--surface)}
    .mqc-item-input::placeholder{color:var(--text3)}
    .mqc-item-num{width:70px;text-align:right}
    .mqc-item-total{font-size:12px;font-weight:700;color:var(--text);padding:0 8px;text-align:right;min-width:80px}
    .mqc-del-btn{width:25px;height:25px;border-radius:6px;background:none;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--text3);transition:all .15s}
    .mqc-del-btn:hover{border-color:var(--red);color:var(--red);background:var(--red-bg)}
    .mqc-add-item-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;background:var(--teal-lighter);border:1.5px dashed var(--teal);border-radius:9px;font-size:12px;font-weight:700;color:var(--teal);cursor:pointer;font-family:var(--font);transition:all .15s}
    .mqc-add-item-btn:hover{background:var(--teal-light)}
    .mqc-totals{border-top:1px solid var(--border);padding-top:14px;margin-top:4px}
    .mqc-tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
    .mqc-tot-label{color:var(--text2);font-weight:600}
    .mqc-tot-val{font-weight:700;color:var(--text)}
    .mqc-grand{padding:10px 14px;background:linear-gradient(135deg,var(--teal-lighter),var(--teal-light));border-radius:10px;border:1.5px solid var(--teal-light);margin-top:6px;display:flex;justify-content:space-between;align-items:center}
    .mqc-grand-label{font-size:14px;font-weight:800;color:var(--text)}
    .mqc-grand-val{font-size:20px;font-weight:900;color:var(--teal)}
    .mqc-validity-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
    .mqc-val-opt{padding:9px 6px;border:1.5px solid var(--border);border-radius:9px;cursor:pointer;text-align:center;transition:all .15s}
    .mqc-val-opt:hover{border-color:var(--teal)}
    .mqc-val-opt.sel{border-color:var(--teal);background:var(--teal-lighter);color:var(--teal)}
    .mqc-val-days{font-size:15px;font-weight:800;color:var(--text)}
    .mqc-val-opt.sel .mqc-val-days{color:var(--teal)}
    .mqc-val-label{font-size:9px;color:var(--text3);font-weight:600}
    .mqc-val-opt.sel .mqc-val-label{color:var(--teal)}
    .mqc-phase-block{background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden;transition:border-color .15s}
    .mqc-phase-block:hover{border-color:var(--teal)}
    .mqc-phase-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border)}
    .mqc-phase-num{font-size:10px;font-weight:800;color:var(--teal);background:var(--teal-light);padding:2px 8px;border-radius:20px;flex-shrink:0}
    .mqc-phase-title-input{flex:1;padding:6px 10px;background:var(--bg);border:1.5px solid transparent;border-radius:8px;font-size:13px;font-weight:700;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-phase-title-input:focus{border-color:var(--teal);background:var(--surface)}
    .mqc-phase-toggle{width:26px;height:26px;border-radius:7px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:var(--text3);transition:all .15s;flex-shrink:0}
    .mqc-phase-toggle:hover{border-color:var(--teal);color:var(--teal)}
    .mqc-phase-del{width:26px;height:26px;border-radius:7px;background:none;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--text3);transition:all .15s;flex-shrink:0}
    .mqc-phase-del:hover{border-color:var(--red);color:var(--red);background:var(--red-bg)}
    .mqc-phase-body{padding:14px}
    .mqc-feat-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px}
    .mqc-feat-row{display:flex;align-items:center;gap:7px;margin-bottom:6px}
    .mqc-feat-check{width:14px;height:14px;border-radius:4px;background:var(--teal-light);border:1.5px solid var(--teal);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--teal);font-weight:800}
    .mqc-feat-input{flex:1;padding:7px 10px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-feat-input:focus{border-color:var(--teal)}
    .mqc-feat-del{width:22px;height:22px;border-radius:5px;background:none;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--text3);transition:color .15s;flex-shrink:0}
    .mqc-feat-del:hover{color:var(--red)}
    .mqc-add-feat-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;background:var(--teal-lighter);border:1.5px dashed var(--teal);border-radius:8px;font-size:11px;font-weight:700;color:var(--teal);cursor:pointer;font-family:var(--font);transition:all .15s}
    .mqc-add-feat-btn:hover{background:var(--teal-light)}
    .mqc-incl-row{display:flex;align-items:center;gap:7px;margin-bottom:6px}
    .mqc-incl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .mqc-incl-input{flex:1;padding:7px 10px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
    .mqc-incl-input:focus{border-color:var(--teal)}
    .mqc-incl-del{width:20px;height:20px;border-radius:5px;background:none;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--text3);flex-shrink:0;transition:color .15s}
    .mqc-incl-del:hover{color:var(--red)}
    .mqc-preview-side{position:sticky;top:78px}
    .mqc-preview-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)}
    .mqc-preview-toolbar{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-bottom:1px solid var(--border);background:var(--surface2)}
    .mqc-pt-title{font-size:12px;font-weight:800;color:var(--text)}
    .mqc-pt-btn{display:flex;align-items:center;gap:4px;padding:5px 10px;background:var(--surface);border:1.5px solid var(--border);border-radius:7px;font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s}
    .mqc-pt-btn:hover{border-color:var(--teal);color:var(--teal)}
    .quo-preview{padding:22px;font-family:var(--font);font-size:12px;color:#1A2E35;background:#fff;min-height:600px;border-radius:0 0 14px 14px}
    .quo-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:14px;border-bottom:3px solid var(--teal)}
    .quo-logo-box{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--teal),var(--teal4));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;margin-bottom:7px}
    .quo-company{font-size:13px;font-weight:800;color:var(--text)}
    .quo-company-sub{font-size:10px;color:var(--text3);line-height:1.7;margin-top:2px}
    .quo-title-area{text-align:right}
    .quo-word{font-size:22px;font-weight:900;color:var(--teal);letter-spacing:-.4px}
    .quo-id{font-size:11px;font-weight:700;color:var(--text);margin-top:3px}
    .quo-dates{font-size:10px;color:var(--text3);line-height:1.8;margin-top:2px}
    .quo-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;margin-top:5px}
    .quo-badge.draft{background:var(--surface2);color:var(--text3);border:1px solid var(--border)}
    .quo-badge.sent{background:var(--blue-bg);color:var(--blue)}
    .quo-badge.accepted{background:var(--green-bg);color:var(--green)}
    .quo-badge.negotiation{background:var(--purple-bg);color:var(--purple)}
    
    .quo-parties{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
    .quo-party-lbl{font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .quo-party-name{font-size:12px;font-weight:800;color:var(--text)}
    .quo-party-detail{font-size:10px;color:var(--text3);line-height:1.7;margin-top:2px}
    
    .quo-scope{margin-bottom:14px;padding:10px 12px;background:var(--teal-lighter);border-radius:9px;border-left:3px solid var(--teal)}
    .quo-scope-title{font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px}
    .quo-scope-tags{display:flex;flex-wrap:wrap;gap:5px}
    .quo-scope-tag{padding:2px 8px;background:var(--teal-light);border-radius:20px;font-size:10px;font-weight:700;color:var(--teal)}
    
    .quo-items-table{width:100%;border-collapse:collapse;margin-bottom:14px}
    .quo-items-table thead tr{background:linear-gradient(135deg,var(--teal),var(--teal4))}
    .quo-items-table thead th{padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:left;letter-spacing:.3px}
    .quo-items-table thead th:last-child{text-align:right}
    .quo-items-table tbody tr{border-bottom:1px solid var(--border)}
    .quo-items-table tbody tr:nth-child(even){background:var(--surface2)}
    .quo-items-table tbody td{padding:7px 9px;font-size:11px;color:var(--text)}
    .quo-items-table tbody td:last-child{text-align:right;font-weight:700}
    
    .quo-totals{margin-left:auto;width:200px;margin-bottom:14px}
    .quo-tot-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid var(--border)}
    .quo-tot-row:last-child{border-bottom:none}
    .quo-tot-row .lbl{color:var(--text2)}
    .quo-tot-row .val{font-weight:700;color:var(--text)}
    .quo-grand-row{display:flex;justify-content:space-between;padding:7px 10px;background:linear-gradient(135deg,var(--teal),var(--teal4));border-radius:7px;margin-top:5px}
    .quo-grand-row .lbl{font-size:11px;font-weight:800;color:#fff}
    .quo-grand-row .val{font-size:13px;font-weight:900;color:#fff}
    
    .quo-validity{padding:8px 10px;background:var(--amber-bg);border-radius:8px;border-left:3px solid var(--amber);margin-bottom:12px}
    .quo-validity-text{font-size:10px;color:var(--amber);font-weight:700}
    
    .quo-footer{display:flex;justify-content:space-between;align-items:flex-end;padding-top:12px;border-top:1px solid var(--border)}
    .quo-notes-lbl{font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
    .quo-notes-text{font-size:10px;color:var(--text3);line-height:1.6;max-width:220px}
    .quo-sig-line{width:90px;height:1px;background:var(--text3);margin-left:auto;margin-bottom:3px}
    .quo-sig-name{font-size:10px;font-weight:700;color:var(--text);text-align:right}
    .quo-sig-role{font-size:9px;color:var(--text3);text-align:right}
    
    .quo-cta{margin-top:12px;padding:10px 12px;background:var(--teal-lighter);border-radius:8px;border:1px solid var(--teal-light);text-align:center}
    .quo-cta-text{font-size:10px;color:var(--text2);margin-bottom:6px;font-weight:600}
    .quo-cta-btns{display:flex;gap:8px;justify-content:center}
    .quo-cta-btn{padding:5px 14px;border-radius:20px;font-size:10px;font-weight:800;cursor:pointer;font-family:var(--font)}
    .quo-cta-btn.accept{background:var(--green);color:#fff;border:none}
    .quo-cta-btn.negotiate{background:none;border:1.5px solid var(--purple);color:var(--purple)}
    
    .pv-phase-block{margin-bottom:12px;border:1px solid var(--border);border-radius:10px;overflow:hidden}
    .pvpb-header{display:flex;align-items:center;gap:8px;padding:7px 10px;background:linear-gradient(90deg,var(--teal-lighter),var(--surface))}
    .pvpb-num{font-size:9px;font-weight:800;color:var(--teal);background:var(--teal-light);padding:1px 7px;border-radius:20px}
    .pvpb-title{font-size:12px;font-weight:800;color:var(--text)}
    .pvpb-body{padding:8px 10px}
    .pvpb-desc{font-size:10px;color:var(--text2);line-height:1.6;margin-bottom:7px}
    .pvpb-features{display:flex;flex-direction:column;gap:3px}
    .pvpb-feat{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text2)}
    .pvpb-feat::before{content:'\\2713';color:var(--teal);font-size:10px;font-weight:800;flex-shrink:0}
    @media(max-width:1100px){.mqc-content{grid-template-columns:1fr}.mqc-preview-side{position:static}}
    @media(max-width:768px){.mqc-content{padding:14px 16px 40px;grid-template-columns:1fr}.mqc-form-row{grid-template-columns:1fr}}
  `;

  const initials = (qt.fromCompany || 'YT').substring(0, 2).toUpperCase();

  return (
    <div className="mqc-wrap">
      <style>{CSS}</style>

      {/* TOPBAR */}
      <header className="mqc-topbar">
        <div className="mqc-topbar-left">
          <button className="mqc-back" onClick={onBack}>
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }}></i> Quotations
          </button>
          <div className="mqc-topbar-title">{isEditing ? 'Edit Quotation' : 'Create Quotation'}</div>
        </div>
        <div className="mqc-actions">
          <button className="mqc-btn-outline" onClick={() => handleSave('draft')} disabled={saving}>
            <i className="ti ti-device-floppy" style={{ fontSize: 13 }}></i>
            {saved ? 'Saved!' : saving ? 'Saving…' : isEditing ? 'Update Draft' : 'Save Draft'}
          </button>
          <button className="mqc-btn-teal mqc-btn-amber" onClick={() => handleSave('sent')} disabled={saving}>
            <i className="ti ti-send" style={{ fontSize: 13 }}></i> {isEditing ? 'Update & Send' : 'Send Quote'}
          </button>
          <button className="mqc-btn-teal mqc-btn-green" onClick={onBack}>
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }}></i> {isEditing ? 'Cancel' : 'Back'}
          </button>
        </div>
      </header>

      <div className="mqc-content">
        {/* ----------- FORM SIDE ----------- */}
        <div>

          {/* Quotation Details */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}><i className="ti ti-file-description"></i></div>
              <div className="mqc-card-title">Quotation Details</div>

            </div>
            <div className="mqc-card-body">
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Quotation Number</label>
                  <input className="mqc-input" value={qt.quoteNo} readOnly />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Quote Date</label>
                  <input className="mqc-input" type="date" value={qt.quoteDate} onChange={e => upd('quoteDate', e.target.value)} />
                </div>
              </div>
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Project / Work Title</label>
                  <input className="mqc-input" placeholder="e.g. Corporate Website Redesign" value={qt.title} onChange={e => upd('title', e.target.value)} />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Project Type</label>
                  {(() => {
                    const presetTypes = ['Web Development', 'Mobile App', 'UI/UX Design', 'Digital Marketing', 'Custom Software', 'Maintenance & Support', 'Consulting'];
                    const isCustomMode = qt.type === '__custom__' || (qt.type && !presetTypes.includes(qt.type));
                    return isCustomMode ? (
                      <input
                        className="mqc-input"
                        type="text"
                        placeholder="Enter custom project type"
                        value={qt.type === '__custom__' ? '' : qt.type}
                        onChange={e => upd('type', e.target.value)}
                        onBlur={e => { if (!e.target.value.trim()) upd('type', presetTypes[0]); }}
                        autoFocus
                      />
                    ) : (
                      <select className="mqc-select" value={qt.type || ''} onChange={e => upd('type', e.target.value === '__custom__' ? '__custom__' : e.target.value)}>
                        <option value="" >Select Project Type</option>
                        <option value="__custom__">Custom</option>
                        {presetTypes.map(t => <option key={t}>{t}</option>)}
                      </select>
                    );
                  })()}
                </div>
              </div>
              <div className="mqc-form-group">
                <label className="mqc-label">Brief Description</label>
                <textarea className="mqc-textarea" placeholder="Describe the project scope briefly…" value={qt.description} onChange={e => upd('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><i className="ti ti-flag"></i></div>
              <div className="mqc-card-title">Quotation Status</div>
            </div>
            <div className="mqc-card-body">
              <div className="mqc-status-grid">
                {statuses.map(s => (
                  <div key={s.value} className={`mqc-status-chip ${qt.status === s.value ? 'sel' : ''}`} onClick={() => upd('status', s.value)}>
                    <div className="mqc-sc-icon">{s.icon}</div>
                    <div className="mqc-sc-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* From */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}><i className="ti ti-building"></i></div>
              <div className="mqc-card-title">From (Your Details)</div>
            </div>
            <div className="mqc-card-body">
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Company Name</label>
                  <input className="mqc-input" value={qt.fromCompany} onChange={e => upd('fromCompany', e.target.value)} />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Your Name</label>
                  <input className="mqc-input" value={qt.fromName} onChange={e => upd('fromName', e.target.value)} />
                </div>
              </div>
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Email</label>
                  <input className="mqc-input" type="email" value={qt.fromEmail} onChange={e => upd('fromEmail', e.target.value)} />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Phone</label>
                  <input className="mqc-input" type="tel" value={qt.fromPhone} onChange={e => upd('fromPhone', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Prepared For */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}><i className="ti ti-user-circle"></i></div>
              <div className="mqc-card-title">Prepared For Client</div>
            </div>
            <div className="mqc-card-body">

              {/* ── Searchable Client Dropdown ── */}
              <div className="mqc-form-group" data-field="client-company-name" style={{ position: 'relative', zIndex: clientDropOpen ? 50 : 1 }}>
                <label className="mqc-label">Client / Company Name</label>

                {/* Trigger box */}
                <div
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setClientDropOpen(o => !o); setClientSearch(''); if (clientFieldError) setClientFieldError(''); }}
                  style={{
                    width: '100%', padding: '10px 36px 10px 13px', background: 'var(--bg)',
                    border: `1.5px solid ${clientFieldError ? '#EF4444' : clientDropOpen ? 'var(--teal)' : 'var(--border)'}`,
                    borderRadius: 10, fontSize: 13, color: qt.toName ? 'var(--text)' : 'var(--text3)',
                    cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', gap: 8, minHeight: 42,
                    boxShadow: clientDropOpen ? '0 0 0 3px rgba(0,188,212,.08)' : 'none',
                    transition: 'all .15s'
                  }}>
                  {qt.toName ? (
                    <>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {qt.toName[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700 }}>{qt.toName}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text3)' }}>— Select or type client name —</span>
                  )}
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: `translateY(-50%) rotate(${clientDropOpen ? 180 : 0}deg)`, fontSize: 10, color: 'var(--text3)', transition: 'transform .2s' }}>▼</span>
                </div>
                {clientFieldError && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{clientFieldError}</div>}

                {/* Dropdown panel — no fixed backdrop, no scroll freeze */}
                {clientDropOpen && (
                  <>
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, boxShadow: '0 12px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                      zIndex: 50, overflow: 'hidden', maxHeight: 220, display: 'flex', flexDirection: 'column',
                      marginBottom: 24
                    }}>
                      {/* Search input */}
                      <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ position: 'relative' }}>
                          <i className="ti ti-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)' }}></i>
                          <input
                            autoFocus
                            placeholder="Search client name…"
                            value={clientSearch}
                            onChange={e => setClientSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setClientDropOpen(false), 180)}
                            style={{
                              width: '100%', padding: '8px 10px 8px 30px',
                              border: '1.5px solid var(--border)', borderRadius: 8,
                              fontSize: 12, background: 'var(--bg)', color: 'var(--text)',
                              outline: 'none', fontFamily: 'var(--font)', boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* New Client — always visible, independent of search results */}
                      {onAddClient && (
                        <div
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setClientDropOpen(false);
                            setClientSearch('');
                            onAddClient();
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>+</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>+ New Client</div>
                        </div>
                      )}

                      {/* Client list */}
                      <div style={{ maxHeight: 140, overflowY: 'auto', flex: 1 }}>
                        {/* Manual entry option */}
                        {clientSearch.trim() && !clients.some(c => (c.clientName || c.name || '').toLowerCase() === clientSearch.toLowerCase()) && (
                          <div
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              upd('toName', clientSearch.trim());
                              setClientDropOpen(false);
                              setClientSearch('');
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: 'var(--teal-lighter)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--teal-lighter)'}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>+</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>Use "{clientSearch.trim()}"</div>
                              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Enter manually — not from client list</div>
                            </div>
                          </div>
                        )}

                        {/* Filtered client rows */}
                        {clients
                          .filter(c => {
                            const name = (c.clientName || c.name || '').toLowerCase();
                            const company = (c.companyName || '').toLowerCase();
                            const q = clientSearch.toLowerCase();
                            return !q || name.includes(q) || company.includes(q);
                          })
                          .map((c, i) => {
                            const name = c.clientName || c.name || '';
                            const company = c.companyName || '';
                            const isSel = qt.toName === name;
                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  upd('toName', name);
                                  upd('toContact', c.contactPersonName || c.contactPerson || '');
                                  upd('toEmail', c.email || '');
                                  upd('toPhone', c.contactPersonNo || c.phone || '');
                                  upd('toAddress', c.address || c.city || '');
                                  setClientDropOpen(false);
                                  setClientSearch('');
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 14px', cursor: 'pointer',
                                  background: isSel ? 'var(--teal-lighter)' : 'transparent',
                                  borderBottom: '1px solid var(--border)'
                                }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface2)'; }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--teal4))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                  {name[0]?.toUpperCase() || '?'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                  {company && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{company}</div>}
                                </div>
                                {isSel && <span style={{ fontSize: 14, color: 'var(--teal)', flexShrink: 0 }}>✓</span>}
                              </div>
                            );
                          })}

                        {/* Empty state */}
                        {clients.filter(c => {
                          const name = (c.clientName || c.name || '').toLowerCase();
                          const company = (c.companyName || '').toLowerCase();
                          const q = clientSearch.toLowerCase();
                          return !q || name.includes(q) || company.includes(q);
                        }).length === 0 && !clientSearch.trim() && (
                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No clients found.</div>
                          )}
                      </div>



                      {/* Clear selection */}
                      {qt.toName && (
                        <div
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            upd('toName', ''); upd('toContact', '');
                            upd('toEmail', ''); upd('toPhone', ''); upd('toAddress', '');
                            setClientDropOpen(false); setClientSearch('');
                          }}
                          style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--red)', cursor: 'pointer', textAlign: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          ✕ Clear selection
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Auto-filled fields — shown after client is selected */}
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Contact Person</label>
                  <input className="mqc-input" placeholder="Name of contact" value={qt.toContact} onChange={e => upd('toContact', e.target.value)} />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Phone</label>
                  <input className="mqc-input" type="tel" placeholder="+91 XXXXX XXXXX" value={qt.toPhone} onChange={e => upd('toPhone', e.target.value)} />
                </div>
              </div>
              <div className="mqc-form-row">
                <div className="mqc-form-group">
                  <label className="mqc-label">Email</label>
                  <input className="mqc-input" type="email" placeholder="client@email.com" value={qt.toEmail} onChange={e => upd('toEmail', e.target.value)} />
                </div>
                <div className="mqc-form-group">
                  <label className="mqc-label">Address / Location</label>
                  <input className="mqc-input" placeholder="Client city or address" value={qt.toAddress} onChange={e => upd('toAddress', e.target.value)} />
                </div>
              </div>

              {/* Selected client info badge */}
              {qt.toName && clients.some(c => (c.clientName || c.name) === qt.toName) && (() => {
                const sc = clients.find(c => (c.clientName || c.name) === qt.toName);
                return (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--teal-lighter)', borderRadius: 8, border: '1px solid var(--teal-light)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {sc.companyName && <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>🏢 {sc.companyName}</span>}
                    {sc.gstNumber && <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>GST: {sc.gstNumber}</span>}
                    {sc.city && <span style={{ fontSize: 11, color: 'var(--text2)' }}>📍 {sc.city}</span>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Scope of Work */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}><i className="ti ti-tags"></i></div>
              <div className="mqc-card-title">Scope of Work</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>

              </div>
            </div>
            <div className="mqc-card-body">
              {/* Deliverable Tags */}
              <label className="mqc-label">Deliverables / Tags</label>
              <div className="mqc-scope-tags">
                {tags.map(t => (
                  <div key={t} className="mqc-scope-tag">
                    {t} <button className="mqc-tag-x" onClick={() => removeTag(t)}><i className="ti ti-x"></i></button>
                  </div>
                ))}
              </div>
              <div className="mqc-add-tag-row">
                <input className="mqc-tag-input" placeholder="Add a deliverable…" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <button className="mqc-tag-btn" onClick={addTag}><i className="ti ti-plus" style={{ fontSize: 13 }}></i> Add</button>
              </div>

              {/* Overview */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <label className="mqc-label">Project Overview</label>
                <textarea className="mqc-textarea" placeholder="Provide a high-level overview…" style={{ minHeight: 90 }} value={qt.overview} onChange={e => upd('overview', e.target.value)} />
              </div>

              {/* Phases */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label className="mqc-label" style={{ marginBottom: 0 }}>Phases / Modules</label>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
                </div>
                {phases.map((ph, idx) => (
                  <div key={ph.id} className="mqc-phase-block">
                    <div className="mqc-phase-header">
                      <div className="mqc-phase-num">Phase {idx + 1}</div>
                      <input type="text" className="mqc-phase-title-input" value={ph.title} placeholder="Phase title" onChange={e => updPhaseTitle(ph.id, e.target.value)} />
                      <button className="mqc-phase-toggle" onClick={() => togglePhase(ph.id)}>
                        <i className={`ti ti-chevron-${ph.open ? 'up' : 'down'}`}></i>
                      </button>
                      <button className="mqc-phase-del" onClick={() => removePhase(ph.id)}>
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                    {ph.open && (
                      <div className="mqc-phase-body">
                        <textarea className="mqc-textarea" placeholder="Describe what this phase covers…" style={{ minHeight: 64, marginBottom: 10 }} value={ph.desc} onChange={e => updPhaseDesc(ph.id, e.target.value)} />
                        <div className="mqc-feat-label">Features / Deliverables in this phase:</div>
                        {ph.features.map(feat => (
                          <div key={feat.id} className="mqc-feat-row">
                            <div className="mqc-feat-check">✓</div>
                            <input type="text" className="mqc-feat-input" value={feat.text} placeholder="Feature description" onChange={e => updFeature(ph.id, feat.id, e.target.value)} />
                            <button className="mqc-feat-del" onClick={() => removeFeature(ph.id, feat.id)}><i className="ti ti-x"></i></button>
                          </div>
                        ))}
                        <button className="mqc-add-feat-btn" onClick={() => addFeature(ph.id)}>
                          <i className="ti ti-plus" style={{ fontSize: 12 }}></i> Add Feature
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Inclusions / Exclusions */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div className="mqc-form-row" style={{ marginBottom: 0 }}>
                  <div className="mqc-form-group">
                    <label className="mqc-label" style={{ color: 'var(--green)' }}><i className="ti ti-circle-check" style={{ fontSize: 13 }}></i> What's Included</label>
                    {inclusions.map(i => (
                      <div key={i.id} className="mqc-incl-row">
                        <div className="mqc-incl-dot" style={{ background: 'var(--green)' }}></div>
                        <input type="text" className="mqc-incl-input" value={i.text} onChange={e => updIncl(i.id, e.target.value)} placeholder="Add inclusion…" />
                        <button className="mqc-incl-del" onClick={() => removeIncl(i.id)}><i className="ti ti-x"></i></button>
                      </div>
                    ))}
                    <button className="mqc-add-feat-btn" style={{ marginTop: 6 }} onClick={addIncl}><i className="ti ti-plus" style={{ fontSize: 12 }}></i> Add</button>
                  </div>
                  <div className="mqc-form-group">
                    <label className="mqc-label" style={{ color: 'var(--red)' }}><i className="ti ti-circle-x" style={{ fontSize: 13 }}></i> What's Excluded</label>
                    {exclusions.map(i => (
                      <div key={i.id} className="mqc-incl-row">
                        <div className="mqc-incl-dot" style={{ background: 'var(--red)' }}></div>
                        <input type="text" className="mqc-incl-input" value={i.text} onChange={e => updExcl(i.id, e.target.value)} placeholder="Add exclusion…" />
                        <button className="mqc-incl-del" onClick={() => removeExcl(i.id)}><i className="ti ti-x"></i></button>
                      </div>
                    ))}
                    <button className="mqc-add-feat-btn" style={{ marginTop: 6 }} onClick={addExcl}><i className="ti ti-plus" style={{ fontSize: 12 }}></i> Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><i className="ti ti-list-numbers"></i></div>
              <div className="mqc-card-title">Line Items / Pricing</div>
            </div>
            <div className="mqc-card-body">
              <table className="mqc-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: 60 }}>Qty</th>
                    <th style={{ width: 100 }}>Rate (INR)</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Total</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><input className="mqc-item-input" placeholder="Item description" value={item.desc} onChange={e => updItem(item.id, 'desc', e.target.value)} /></td>
                      <td><input className="mqc-item-input mqc-item-num" type="number" min="1" value={item.qty} onChange={e => updItem(item.id, 'qty', e.target.value)} /></td>
                      <td><input className="mqc-item-input mqc-item-num" type="number" min="0" value={item.rate} onChange={e => updItem(item.id, 'rate', e.target.value)} /></td>
                      <td className="mqc-item-total">{fmt((parseFloat(item.rate) || 0) * (parseFloat(item.qty) || 0))}</td>
                      <td>
                        <button className="mqc-del-btn" onClick={() => removeItem(item.id)}><i className="ti ti-x"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="mqc-add-item-btn" onClick={addItem}><i className="ti ti-plus"></i> Add Line Item</button>
              <div className="mqc-totals">
                <div className="mqc-tot-row"><span className="mqc-tot-label">Subtotal</span><span className="mqc-tot-val">{fmt(subtotal)}</span></div>
                <div className="mqc-grand"><span className="mqc-grand-label">Total</span><span className="mqc-grand-val">{fmt(subtotal)}</span></div>
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}><i className="ti ti-clock"></i></div>
              <div className="mqc-card-title">Validity Period</div>
            </div>
            <div className="mqc-card-body">
              <div className="mqc-validity-grid">
                {['7', '15', '30', '45', '60', 'Custom'].map(v => (
                  <div key={v} className={`mqc-val-opt ${qt.validity === v ? 'sel' : ''}`} onClick={() => upd('validity', v)}>
                    <div className="mqc-val-days">{v === 'Custom' ? 'Edit' : v}</div>
                    <div className="mqc-val-label">{v === 'Custom' ? 'Custom' : 'days'}</div>
                  </div>
                ))}
              </div>
              {qt.validity === 'Custom' && (
                <input className="mqc-input" type="number" min="1" placeholder="Enter days" value={customValidity}
                  onChange={e => { setCustomValidity(e.target.value); }} style={{ marginTop: 8 }} />
              )}
              <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 700, marginTop: 8, background: 'var(--amber-bg)', padding: '6px 12px', borderRadius: 8, borderLeft: '3px solid var(--amber)' }}>
                Alarm Valid until: {validUntil}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mqc-card">
            <div className="mqc-card-header">
              <div className="mqc-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><i className="ti ti-notes"></i></div>
              <div className="mqc-card-title">Notes & Terms</div>
            </div>
            <div className="mqc-card-body">
              <textarea className="mqc-textarea" placeholder="Add payment terms, notes for the client…" style={{ minHeight: 100 }} value={qt.notes} onChange={e => upd('notes', e.target.value)} />
            </div>
          </div>

        </div>

        {/* ----------- LIVE PREVIEW ----------- */}
        <div className="mqc-preview-side">
          <div className="mqc-preview-card">
            <div className="mqc-preview-toolbar">
              <span className="mqc-pt-title">Document Live Preview</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="mqc-pt-btn" onClick={handlePrint}><i className="ti ti-printer" style={{ fontSize: 11 }}></i> Print</button>
                <button className="mqc-pt-btn" onClick={handleDownloadPdf}><i className="ti ti-download" style={{ fontSize: 11 }}></i> PDF</button>
                <button className="mqc-pt-btn" onClick={handleShare}><i className="ti ti-share" style={{ fontSize: 11 }}></i> Share</button>
              </div>
            </div>
            <div className="quo-preview" ref={previewRef}>
              {/* Header */}
              <div className="quo-header">
                <div>
                  <div className="quo-logo-box">{initials}</div>
                  <div className="quo-company">{qt.fromCompany || '—'}</div>
                  <div className="quo-company-sub">
                    {qt.fromEmail}<br />{qt.fromPhone}
                  </div>
                </div>
                <div className="quo-title-area">
                  <div className="quo-word">QUOTATION</div>
                  <div className="quo-id">#{qt.quoteNo}</div>
                  <div className="quo-dates">
                    <span>Date: {new Date(qt.quoteDate || today).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span><br />
                    <span style={{ color: 'var(--amber)' }}>Valid until: {validUntil}</span>
                  </div>
                  <div className={`quo-badge ${qt.status.toLowerCase()}`}>{qt.status}</div>
                </div>
              </div>

              {/* Parties */}
              <div className="quo-parties">
                <div>
                  <div className="quo-party-lbl">Prepared By</div>
                  <div className="quo-party-name">{qt.fromName || '—'}</div>
                  <div className="quo-party-detail">
                    {qt.fromCompany}<br />
                    Chennai, Tamil Nadu
                  </div>
                </div>
                <div>
                  <div className="quo-party-lbl">Prepared For</div>
                  <div className="quo-party-name" style={{ color: qt.toName ? 'var(--text)' : 'var(--text3)' }}>
                    {qt.toName || '— Client Name —'}
                  </div>
                  <div className="quo-party-detail">
                    {qt.toName ? (
                      <>
                        {qt.toContact && <>{qt.toContact}<br /></>}
                        {qt.toEmail && <>{qt.toEmail}<br /></>}
                        {qt.toPhone && <>{qt.toPhone}<br /></>}
                        {qt.toAddress}
                      </>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>Fill in client details</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Project */}
              <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8, borderLeft: '3px solid var(--teal)', marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 3 }}>Project</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: qt.title ? 'var(--text)' : 'var(--text3)' }}>{qt.title || '— Project Title —'}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{qt.type}</div>
                {qt.description && (
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 6, lineHeight: 1.6 }}>{qt.description}</div>
                )}
              </div>

              {/* Scope tags */}
              {tags.length > 0 && (
                <div className="quo-scope">
                  <div className="quo-scope-title">Scope of Work</div>
                  <div className="quo-scope-tags">
                    {tags.map(t => <span key={t} className="quo-scope-tag">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Project Overview — Visible to Client */}
              {qt.overview && (
                <div style={{ padding: '8px 10px', background: 'var(--teal-lighter)', borderRadius: 8, borderLeft: '3px solid var(--teal)', marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>
                    Project Overview <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)', textTransform: 'none', letterSpacing: 0 }}></span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', lineHeight: 1.7 }}>{qt.overview}</div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              {(inclusions.some(i => i.text.trim()) || exclusions.some(i => i.text.trim())) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {inclusions.some(i => i.text.trim()) && (
                    <div style={{ padding: '8px 10px', background: 'var(--green-bg)', borderRadius: 8, borderLeft: '3px solid var(--green)' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>✓ What's Included</div>
                      {inclusions.filter(i => i.text.trim()).map(i => (
                        <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 10, color: 'var(--text2)', marginBottom: 3, lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0 }}>•</span> {i.text}
                        </div>
                      ))}
                    </div>
                  )}
                  {exclusions.some(i => i.text.trim()) && (
                    <div style={{ padding: '8px 10px', background: 'var(--red-bg)', borderRadius: 8, borderLeft: '3px solid var(--red)' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>✗ What's Excluded</div>
                      {exclusions.filter(i => i.text.trim()).map(i => (
                        <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 10, color: 'var(--text2)', marginBottom: 3, lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--red)', fontWeight: 800, flexShrink: 0 }}>•</span> {i.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Phases */}
              <div style={{ marginBottom: 14 }}>
                {phases.map((ph, idx) => (
                  <div key={ph.id} className="pv-phase-block">
                    <div className="pvpb-header">
                      <span className="pvpb-num">Phase {idx + 1}</span>
                      <span className="pvpb-title">{ph.title || `Phase ${idx + 1}`}</span>
                    </div>
                    <div className="pvpb-body">
                      {ph.desc && <div className="pvpb-desc">{ph.desc}</div>}
                      {ph.features.length > 0 && (
                        <div className="pvpb-features">
                          {ph.features.filter(f => f.text.trim()).map(f => (
                            <div key={f.id} className="pvpb-feat">{f.text}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Items table */}
              <table className="quo-items-table">
                <thead>
                  <tr>
                    <th>#</th><th>Description</th><th>Qty</th><th>Price</th><th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.desc || '—'}</td>
                      <td>{item.qty}</td>
                      <td>{fmt(item.rate)}</td>
                      <td>{fmt((parseFloat(item.rate) || 0) * (parseFloat(item.qty) || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="quo-totals">
                <div className="quo-tot-row"><span className="lbl">Subtotal</span><span className="val">{fmt(subtotal)}</span></div>
                <div className="quo-grand-row"><span className="lbl">Total Quoted</span><span className="val">{fmt(subtotal)}</span></div>
              </div>

              {/* Validity */}
              <div className="quo-validity">
                <div className="quo-validity-text">
                  ⏰ This quotation is valid for{' '}
                  <strong>
                    {qt.validity === 'Custom'
                      ? (customValidity ? `${customValidity} days` : 'Custom period')
                      : `${qt.validity} days`}
                  </strong>{' '}
                  from the date of issue · Expires: {validUntil}
                </div>
              </div>

              {/* Footer */}
              <div className="quo-footer">
                <div>
                  <div className="quo-notes-lbl">Notes</div>
                  <div className="quo-notes-text">{qt.notes || 'Payment terms and conditions apply.'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="quo-sig-line"></div>
                  <div className="quo-sig-name">{qt.fromName || 'Authorised Signatory'}</div>
                  <div className="quo-sig-role">{qt.fromCompany}</div>
                </div>
              </div>

              {/* CTA */}
              <div className="quo-cta">
                <div className="quo-cta-text">Client action on this quotation:</div>
                <div className="quo-cta-btns">
                  <button className="quo-cta-btn accept">Success Accept Quote</button>
                  <button className="quo-cta-btn negotiate">Partnership Negotiate</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <QuoToast msg={toast} />
    </div>
  );
}