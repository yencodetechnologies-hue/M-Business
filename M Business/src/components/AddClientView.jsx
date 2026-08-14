import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config';
import {
  X, ImagePlus, Building2, Phone, MapPin, Globe2, CreditCard, Lock,
  StickyNote, Check, Eye, EyeOff, User, Users, Briefcase, Loader2,
  UserPlus, CheckCircle2
} from 'lucide-react';

const STY = {
  label: { fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  input: { width: '100%', height: 44, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 10, fontSize: 14, background: '#F8FAFB', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s' },
  errText: { fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: 600 },
  required: { color: '#EF4444' }
};

function SectionCard({ icon: Icon, title, sub, tc, tcLight, children, id }) {
  return (
    <div id={id} className="acv-section" style={{ background: '#fff', border: '1px solid #EDF1F4', borderRadius: 18, boxShadow: '0 2px 10px rgba(20,30,50,0.05)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 22px', borderBottom: '1px solid #EEF2F5', background: `linear-gradient(90deg, ${tcLight} 0%, #ffffff 90%)` }}>
        <div style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${tc}, ${tc}cc)`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${tc}40`, flexShrink: 0 }}>
          <Icon size={18} color="#fff" strokeWidth={2.3} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#16202B' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: '#8B9AA8', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div style={STY.field}>
      <label style={STY.label}>{label} {required && <span style={STY.required}>*</span>}</label>
      {children}
      {error && <div style={STY.errText}>{error}</div>}
    </div>
  );
}

function TextField({ label, required, error, tc, ...props }) {
  return (
    <Field label={label} required={required} error={error}>
      <input
        {...props}
        className="acv-input"
        style={{ ...STY.input, borderColor: error ? '#EF4444' : '#E0E6EA' }}
      />
    </Field>
  );
}

export default function AddClientView({ onBack, onClientAdded, onClientUpdated, user, editData, themeColor = 'var(--app-accent, #00BCD4)' }) {
  const TC = themeColor; // shorthand
  const TC_LIGHT = `${themeColor}18`; // ~10% opacity tint
  const isEdit = !!editData;
  const today = new Date().toISOString().split('T')[0];

  const [customCats, setCustomCats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customCategories') || '[]'); } catch { return []; }
  });
  const [customSources, setCustomSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customSources') || '[]'); } catch { return []; }
  });
  const [customCountries, setCustomCountries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customCountries') || '[]'); } catch { return []; }
  });
  const [customPaymentTerms, setCustomPaymentTerms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customPaymentTerms') || '[]'); } catch { return []; }
  });
  const [customPaymentModes, setCustomPaymentModes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customPaymentModes') || '[]'); } catch { return []; }
  });
  const [customCurrencies, setCustomCurrencies] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customCurrencies') || '[]'); } catch { return []; }
  });

  const [formData, setFormData] = useState({
    clientType: editData?.clientType || 'b2b',
    name: editData?.clientName || editData?.name || '',
    company: editData?.companyName || editData?.company || '',
    category: editData?.category || '',
    gstNumber: editData?.gstNumber || '',
    source: editData?.clientSource || editData?.source || '',
    onboardedOn: editData?.onboardedOn ? editData.onboardedOn.substring(0, 10) : today,
    status: editData?.status || 'Active',
    contactPersonName: editData?.contactPersonName || '',
    designation: editData?.designation || '',
    email: editData?.email || '',
    altEmail: editData?.altEmail || '',
    contactPersonNo: editData?.contactPersonNo || '',
    phone: editData?.officePhone || editData?.phone || '',
    address: editData?.address || '',
    city: editData?.city || '',
    state: editData?.state || '',
    pincode: editData?.pincode || '',
    country: editData?.country || '',
    website: editData?.websiteUrl || editData?.website || '',
    linkedin: editData?.linkedinUrl || editData?.linkedin || '',
    billingCurrency: editData?.billingCurrency || '',
    paymentTerms: editData?.paymentTerms || '',
    creditLimit: editData?.creditLimit || '',
    PaymentMode: editData?.PaymentMode || '',
    password: '',
    notes: editData?.internalNotes || editData?.notes || '',
    logoUrl: editData?.logoUrl || '',
    sendCredentials: !editData
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('logo');

  const [customInputMode, setCustomInputMode] = useState({
    category: false,
    source: false,
    country: false,
    paymentTerms: false,
    PaymentMode: false,
    billingCurrency: false
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEdit) {
      const predefinedCats = ['', 'Web Development', 'Mobile App Development', 'UI/UX Design', 'Digital Marketing', 'IT Consulting', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Real Estate', 'Manufacturing', 'Retail', 'Logistics', 'Media & Entertainment'];
      const predefinedSources = ['', 'Referral', 'Website / Organic', 'Social Media', 'Cold Outreach', 'LinkedIn', 'Event / Conference', 'Google Ads', 'Word of Mouth'];
      const predefinedCountries = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Canada', 'Germany', 'France'];
      const predefinedTerms = ['', 'Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance + 50% on delivery'];
      const predefinedModes = ['', 'Bank Transfer / NEFT', 'UPI', 'Cheque', 'Credit Card', 'Cash', 'PayPal', 'Stripe'];

      setCustomInputMode({
        category: editData.category && !predefinedCats.includes(editData.category),
        source: (editData.clientSource || editData.source) && !predefinedSources.includes(editData.clientSource || editData.source),
        country: editData.country && !predefinedCountries.includes(editData.country),
        paymentTerms: editData.paymentTerms && !predefinedTerms.includes(editData.paymentTerms),
        PaymentMode: editData.PaymentMode && !predefinedModes.includes(editData.PaymentMode)
      });
    }
  }, [isEdit, editData]);

  useEffect(() => {
    // calculate progress
    const fields = Object.values(formData).filter(v => typeof v === 'string' && v.trim() !== '');
    const pct = Math.round((fields.length / 28) * 100);
    setProgress(pct > 100 ? 100 : pct);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    if (value === '__custom__') {
      setCustomInputMode(prev => ({ ...prev, [name]: true }));
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setCustomInputMode(prev => ({ ...prev, [name]: false }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logoUrl: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const submitForm = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Client / display name is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (!formData.contactPersonName.trim()) newErrors.contactPersonName = 'Contact person name is required';

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.password || !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Scroll to and focus the first field with an error, in form order
      const fieldOrder = ['name', 'company', 'contactPersonName', 'email', 'phone', 'address', 'password', 'confirmPassword'];
      const firstErrorField = fieldOrder.find(f => newErrors[f]);
      if (firstErrorField) {
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstErrorField}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }, 50);
      }
      return;
    }

    try {
      setSaving(true);
      const payload = {
        clientName: formData.name,
        companyName: formData.company,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password || "123456",
        status: formData.status,
        contactPersonName: formData.contactPersonName,
        contactPersonNo: formData.contactPersonNo,
        gstNumber: formData.gstNumber,
        logoUrl: formData.logoUrl,
        clientType: formData.clientType,
        category: formData.category,
        clientSource: formData.source,
        onboardedOn: formData.onboardedOn,
        designation: formData.designation,
        altEmail: formData.altEmail,
        officePhone: formData.phone,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
        websiteUrl: formData.website,
        linkedinUrl: formData.linkedin,
        billingCurrency: formData.billingCurrency,
        paymentTerms: formData.paymentTerms,
        creditLimit: formData.creditLimit,
        PaymentMode: formData.PaymentMode,
        internalNotes: formData.notes,
        sendCredentials: !isEdit && !!formData.sendCredentials,
        companyId: user?.companyId || user?.company || user?._id || user?.id || ""
      };

      if (isEdit) {
        // Optimistic update — update UI immediately without waiting for server
        if (onClientUpdated) onClientUpdated({ ...editData, ...payload });
        onBack();
        toast.success('Client updated successfully!');

        // Fire the request in background — no await
        axios.put(`${BASE_URL}/api/clients/${editData._id}`, payload, {
          headers: { Authorization: `Bearer ${user?.token || ""}` }
        }).catch(err => {
          toast.error('Failed to save changes. Please try again.');
          console.error('Client update failed:', err);
        });
      } else {

        const res = await axios.post(`${BASE_URL}/api/clients/add`, payload, {
          headers: { Authorization: `Bearer ${user?.token || ""}` }
        });
        if (onClientAdded && res.data?.client) {
          onClientAdded(res.data.client);
        } else {
          onBack();
        }
        toast.success('Client added successfully!');
      }

    } catch (err) {
      const errMsg = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'save'} client`;
      toast.error(errMsg);
      if (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('already exists')) {
        setErrors(prev => ({ ...prev, email: errMsg }));
        requestAnimationFrame(() => {
          const el = document.querySelector('input[name="email"]');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,15,30,0.55)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`
        @keyframes acv-spin { to { transform: rotate(360deg); } }
        @keyframes acv-pop { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .acv-modal::-webkit-scrollbar { width: 7px; }
        .acv-modal::-webkit-scrollbar-track { background: transparent; }
        .acv-modal::-webkit-scrollbar-thumb { background: #D8E0E6; border-radius: 6px; }
        .acv-input:focus, .acv-select:focus, .acv-textarea:focus { border-color: ${TC} !important; background: #fff !important; box-shadow: 0 0 0 4px ${TC_LIGHT}; }
        .acv-section { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .acv-type-card { transition: all 0.15s ease; }
        .acv-type-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(20,30,50,0.08); }
        .acv-submit-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 8px 20px ${TC}55; }
        .acv-cancel-btn:hover { background: #EEF2F5 !important; }
        .acv-logo-drop:hover { border-color: ${TC} !important; background: ${TC_LIGHT} !important; }
        .acv-eye-btn:hover { color: ${TC} !important; }
      `}</style>

      <div className="acv-modal" style={{
        background: '#F6F8FA', width: '100%', maxWidth: 840, maxHeight: '92vh', overflowY: 'auto',
        borderRadius: 22, fontFamily: "'Nunito', sans-serif", color: '#1A2332', display: 'flex',
        flexDirection: 'column', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
        animation: 'acv-pop 0.22s cubic-bezier(0.16,1,0.3,1)'
      }}>

        {/* Header */}
        <div style={{
          padding: '22px 26px', background: `linear-gradient(120deg, ${TC} 0%, ${TC}cc 100%)`,
          position: 'sticky', top: 0, zIndex: 10, color: '#fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isEdit ? <CheckCircle2 size={21} strokeWidth={2.2} /> : <UserPlus size={21} strokeWidth={2.2} />}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.85)' }}>{isEdit ? 'Update this client’s profile & portal details' : 'Fill in the details to onboard a new client'}</p>
              </div>
            </div>
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={18} strokeWidth={2.4} />
            </button>
          </div>

          {/* progress bar */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>
              <span>PROFILE COMPLETION</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, borderRadius: 6, background: '#fff', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Logo Section */}
          <SectionCard id="logo" icon={ImagePlus} title="Client Logo" sub="Upload a company logo or avatar" tc={TC} tcLight={TC_LIGHT}>
            <div onClick={() => fileInputRef.current.click()} className="acv-logo-drop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 28, border: '2px dashed #DCE3E8', borderRadius: 14, background: '#F8FAFB', cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <div style={{ width: 76, height: 76, borderRadius: 16, background: '#fff', border: '1.5px solid #E0E6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(20,30,50,0.06)' }}>
                {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImagePlus size={28} color="#B0BCC7" strokeWidth={1.8} />}
              </div>
              <button type="button" style={{ background: TC, color: 'white', padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Choose logo</button>
              <span style={{ fontSize: 12, color: '#94A3B0' }}>PNG, JPG or SVG · Max 2MB · Recommended 200✕200px</span>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
          </SectionCard>

          {/* Basic Info */}
          <SectionCard id="basic" icon={Building2} title="Basic Info" sub="Core client identity and classification" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...STY.label, marginBottom: 8, display: 'block' }}>Client type <span style={STY.required}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { id: 'b2b', icon: Building2, label: 'B2B', sub: 'Company / Business' },
                  { id: 'b2c', icon: User, label: 'B2C', sub: 'Individual person' },
                  { id: 'freelancer', icon: Briefcase, label: 'Freelancer', sub: 'Consultant / Solo' }
                ].map(t => {
                  const isSel = formData.clientType === t.id;
                  const Ico = t.icon;
                  return (
                    <div key={t.id} onClick={() => setFormData({ ...formData, clientType: t.id })} className="acv-type-card" style={{ border: `2px solid ${isSel ? TC : '#E0E6EA'}`, borderRadius: 13, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', background: isSel ? TC_LIGHT : '#fff', position: 'relative' }}>
                      {isSel && <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" strokeWidth={3.5} /></div>}
                      <Ico size={22} color={isSel ? TC : '#94A3B0'} strokeWidth={2} style={{ display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSel ? TC : '#5A6A7A' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B0', marginTop: 2 }}>{t.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TextField label="Client / display name" required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp or Raj Kumar" error={errors.name} />
              <TextField label="Company name" required name="company" value={formData.company} onChange={handleChange} placeholder="Registered company name" error={errors.company} />

              <Field label="Category / industry">
                {customInputMode.category ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="category" value={formData.category} onChange={handleChange} placeholder="Type custom category..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.category) { setCustomCats(prev => { const next = Array.from(new Set([...prev, formData.category])); try { localStorage.setItem('mb_customCategories', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, category: false })); } }} />
                    <button type="button" onClick={() => { if (formData.category) { setCustomCats(prev => { const next = Array.from(new Set([...prev, formData.category])); try { localStorage.setItem('mb_customCategories', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, category: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="category" value={formData.category} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select a category</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Web Development">Web Development</option><option value="Mobile App Development">Mobile App Development</option><option value="UI/UX Design">UI/UX Design</option><option value="Digital Marketing">Digital Marketing</option><option value="IT Consulting">IT Consulting</option><option value="E-commerce">E-commerce</option><option value="Healthcare">Healthcare</option><option value="Education">Education</option><option value="Finance">Finance</option><option value="Real Estate">Real Estate</option><option value="Manufacturing">Manufacturing</option><option value="Retail">Retail</option><option value="Logistics">Logistics</option><option value="Media & Entertainment">Media & Entertainment</option>
                    {customCats.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.category && !['Web Development', 'Mobile App Development', 'UI/UX Design', 'Digital Marketing', 'IT Consulting', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Real Estate', 'Manufacturing', 'Retail', 'Logistics', 'Media & Entertainment'].includes(formData.category) && !customCats.includes(formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                  </select>
                )}
              </Field>

              <TextField label="Company tax / GST no." name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="e.g. 22AAAAA0000A1Z5" />

              <Field label="Client source">
                {customInputMode.source ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="source" value={formData.source} onChange={handleChange} placeholder="Type custom source..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.source) { setCustomSources(prev => { const next = Array.from(new Set([...prev, formData.source])); try { localStorage.setItem('mb_customSources', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, source: false })); } }} />
                    <button type="button" onClick={() => { if (formData.source) { setCustomSources(prev => { const next = Array.from(new Set([...prev, formData.source])); try { localStorage.setItem('mb_customSources', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, source: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="source" value={formData.source} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select Client Source</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Referral">Referral</option><option value="Website / Organic">Website / Organic</option><option value="Social Media">Social Media</option><option value="Cold Outreach">Cold Outreach</option><option value="LinkedIn">LinkedIn</option><option value="Event / Conference">Event / Conference</option><option value="Google Ads">Google Ads</option><option value="Word of Mouth">Word of Mouth</option>
                    {customSources.map(s => <option key={s} value={s}>{s}</option>)}
                    {formData.source && !['Referral', 'Website / Organic', 'Social Media', 'Cold Outreach', 'LinkedIn', 'Event / Conference', 'Google Ads', 'Word of Mouth'].includes(formData.source) && !customSources.includes(formData.source) && (
                      <option value={formData.source}>{formData.source}</option>
                    )}
                  </select>
                )}
              </Field>

              <Field label="Onboarded on">
                <input type="date" disabled name="onboardedOn" value={formData.onboardedOn} onChange={handleChange} style={{ ...STY.input, opacity: 0.7, cursor: 'not-allowed' }} />
              </Field>
            </div>
          </SectionCard>

          {/* Primary Contact */}
          <SectionCard id="contact" icon={Phone} title="Primary Contact" sub="Main point of contact at this client" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TextField label="Contact person name" required name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} placeholder="Full name" error={errors.contactPersonName} />
              <TextField label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. CEO, Project Manager" />
              <TextField label="Email address" required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@company.com" error={errors.email} />
              <TextField label="Alt. email" type="email" name="altEmail" value={formData.altEmail} onChange={handleChange} placeholder="Secondary email" />
              <TextField label="Contact person mobile" name="contactPersonNo" value={formData.contactPersonNo} onChange={handleChange} placeholder="+91 98765 43210" />
              <TextField label="Office phone" required name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 44 1234 5678" error={errors.phone} />
            </div>
          </SectionCard>

          {/* Address */}
          <SectionCard id="address" icon={MapPin} title="Address" sub="Billing and office location" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <TextField label="Street / building address" required name="address" value={formData.address} onChange={handleChange} placeholder="Flat no, building name, street" error={errors.address} />
              </div>
              <TextField label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Chennai" />
              <TextField label="State / province" name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" />
              <TextField label="Pincode / ZIP" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" />
              <Field label="Country">
                {customInputMode.country ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="country" value={formData.country} onChange={handleChange} placeholder="Type custom country..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.country) { setCustomCountries(prev => { const next = Array.from(new Set([...prev, formData.country])); try { localStorage.setItem('mb_customCountries', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, country: false })); } }} />
                    <button type="button" onClick={() => { if (formData.country) { setCustomCountries(prev => { const next = Array.from(new Set([...prev, formData.country])); try { localStorage.setItem('mb_customCountries', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, country: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="country" value={formData.country} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select Country</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="India">India</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option><option value="United Arab Emirates">United Arab Emirates</option><option value="Singapore">Singapore</option><option value="Australia">Australia</option><option value="Canada">Canada</option><option value="Germany">Germany</option><option value="France">France</option>
                    {customCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.country && !['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Canada', 'Germany', 'France'].includes(formData.country) && !customCountries.includes(formData.country) && (
                      <option value={formData.country}>{formData.country}</option>
                    )}
                  </select>
                )}
              </Field>
            </div>
          </SectionCard>

          {/* Online Presence */}
          <SectionCard id="online" icon={Globe2} title="Online Presence" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TextField label="Website URL" type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.company.com" />
              <TextField label="LinkedIn profile" type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/company/..." />
            </div>
          </SectionCard>

          {/* Billing & Terms */}
          <SectionCard id="billing" icon={CreditCard} title="Billing & Terms" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Billing currency">
                {customInputMode.billingCurrency ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="billingCurrency" value={formData.billingCurrency} onChange={handleChange} placeholder="Type custom currency..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.billingCurrency) { setCustomCurrencies(prev => { const next = Array.from(new Set([...prev, formData.billingCurrency])); try { localStorage.setItem('mb_customCurrencies', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, billingCurrency: false })); } }} />
                    <button type="button" onClick={() => { if (formData.billingCurrency) { setCustomCurrencies(prev => { const next = Array.from(new Set([...prev, formData.billingCurrency])); try { localStorage.setItem('mb_customCurrencies', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, billingCurrency: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="billingCurrency" value={formData.billingCurrency} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select Billing Currency</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="INR — Indian Rupee">INR — Indian Rupee</option><option value="USD — US Dollar">USD — US Dollar</option><option value="GBP — British Pound">GBP — British Pound</option><option value="EUR — Euro">EUR — Euro</option><option value="AED — UAE Dirham">AED — UAE Dirham</option><option value="SGD — Singapore Dollar">SGD — Singapore Dollar</option><option value="AUD — Australian Dollar">AUD — Australian Dollar</option>
                    {customCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.billingCurrency && !['INR — Indian Rupee', 'USD — US Dollar', 'GBP — British Pound', 'EUR — Euro', 'AED — UAE Dirham', 'SGD — Singapore Dollar', 'AUD — Australian Dollar'].includes(formData.billingCurrency) && !customCurrencies.includes(formData.billingCurrency) && (
                      <option value={formData.billingCurrency}>{formData.billingCurrency}</option>
                    )}
                  </select>
                )}
              </Field>
              <Field label="Payment terms">
                {customInputMode.paymentTerms ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="Type custom terms..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.paymentTerms) { setCustomPaymentTerms(prev => { const next = Array.from(new Set([...prev, formData.paymentTerms])); try { localStorage.setItem('mb_customPaymentTerms', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, paymentTerms: false })); } }} />
                    <button type="button" onClick={() => { if (formData.paymentTerms) { setCustomPaymentTerms(prev => { const next = Array.from(new Set([...prev, formData.paymentTerms])); try { localStorage.setItem('mb_customPaymentTerms', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, paymentTerms: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select Payment Terms</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Due on receipt">Due on receipt</option><option value="Net 7">Net 7</option><option value="Net 15">Net 15</option><option value="Net 30">Net 30</option><option value="Net 45">Net 45</option><option value="Net 60">Net 60</option><option value="50% Advance + 50% on delivery">50% Advance + 50% on delivery</option>
                    {customPaymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
                    {formData.paymentTerms && !['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance + 50% on delivery'].includes(formData.paymentTerms) && !customPaymentTerms.includes(formData.paymentTerms) && (
                      <option value={formData.paymentTerms}>{formData.paymentTerms}</option>
                    )}
                  </select>
                )}
              </Field>
              <TextField label="Credit limit" type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} placeholder="e.g. 50000" />
              <Field label="Payment mode">
                {customInputMode.PaymentMode ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="PaymentMode" value={formData.PaymentMode} onChange={handleChange} placeholder="Type custom mode..." className="acv-input" style={{ ...STY.input, flex: 1 }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.PaymentMode) { setCustomPaymentModes(prev => { const next = Array.from(new Set([...prev, formData.PaymentMode])); try { localStorage.setItem('mb_customPaymentModes', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, PaymentMode: false })); } }} />
                    <button type="button" onClick={() => { if (formData.PaymentMode) { setCustomPaymentModes(prev => { const next = Array.from(new Set([...prev, formData.PaymentMode])); try { localStorage.setItem('mb_customPaymentModes', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, PaymentMode: false })); }} style={{ width: 44, height: 44, background: '#F8FAFB', border: '1.5px solid #E0E6EA', borderRadius: 10, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                  </div>
                ) : (
                  <select name="PaymentMode" value={formData.PaymentMode} onChange={handleSelectChange} className="acv-select" style={STY.input}>
                    <option value="">Select Payment Mode</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option><option value="Credit Card">Credit Card</option><option value="Cash">Cash</option><option value="PayPal">PayPal</option><option value="Stripe">Stripe</option>
                    {customPaymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                    {formData.PaymentMode && !['Bank Transfer / NEFT', 'UPI', 'Cheque', 'Credit Card', 'Cash', 'PayPal', 'Stripe'].includes(formData.PaymentMode) && !customPaymentModes.includes(formData.PaymentMode) && (
                      <option value={formData.PaymentMode}>{formData.PaymentMode}</option>
                    )}
                  </select>
                )}
              </Field>
            </div>
          </SectionCard>

          {/* Portal Access */}
          <SectionCard id="portal" icon={Lock} title="Portal Access" tc={TC} tcLight={TC_LIGHT}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Portal password" required error={errors.password}>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={e => { handleChange(e); setErrors({ ...errors, password: '' }); }} placeholder="Set client portal password" className="acv-input" style={{ ...STY.input, padding: '0 46px 0 14px', borderColor: errors.password ? '#EF4444' : '#E0E6EA' }} />
                  <button onClick={() => setShowPass(!showPass)} className="acv-eye-btn" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword}>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }) }} placeholder="Re-enter password" className="acv-input" style={{ ...STY.input, padding: '0 46px 0 14px', borderColor: errors.confirmPassword ? '#EF4444' : '#E0E6EA' }} />
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} className="acv-eye-btn" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </Field>
            </div>
          </SectionCard>

          {/* Internal Notes */}
          <SectionCard id="notes" icon={StickyNote} title="Internal Notes" tc={TC} tcLight={TC_LIGHT}>
            <Field label="Remarks">
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any internal context, instructions, or notes about this client..." className="acv-textarea" style={{ ...STY.input, height: 90, padding: '12px 14px', resize: 'vertical' }}></textarea>
            </Field>
          </SectionCard>

          {/* Footer actions */}
          <div style={{ background: '#fff', border: '1px solid #EDF1F4', borderRadius: 16, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(20,30,50,0.05)', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12.5, color: '#94A3B0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={STY.required}>*</span> Required fields
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onBack} className="acv-cancel-btn" style={{ padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#F4F6F8', color: '#5A6A7A', border: '1.5px solid #E0E6EA', transition: 'background 0.15s' }}>
                Cancel
              </button>
              <button onClick={submitForm} disabled={saving} className="acv-submit-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', background: TC, color: 'white', border: `1.5px solid ${TC}`, opacity: saving ? 0.75 : 1, transition: 'all 0.15s', boxShadow: `0 4px 14px ${TC}40` }}>
                {saving ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'acv-spin 0.8s linear infinite' }} />
                    {isEdit ? 'Updating…' : 'Saving…'}
                  </>
                ) : (
                  <>
                    {isEdit ? <CheckCircle2 size={16} /> : <UserPlus size={16} />}
                    {isEdit ? 'Update Client' : 'Add Client'}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
