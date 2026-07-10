import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config';

export default function AddClientView({ onBack, onClientAdded, onClientUpdated, user, editData, themeColor = ' var(--app-accent, var(--app-accent, #00BCD4))' }) {
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
    if (!formData.phone.trim()) newErrors.phone = 'Office phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.password && formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields correctly.');
      // Scroll to and focus the first field with an error, in form order
      const fieldOrder = ['name', 'company', 'email', 'contactPersonName', 'phone', 'address', 'confirmPassword'];
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
        // Optimistic add — show the client immediately with a temporary id,
        // then swap in the real saved record once the server responds.
        const tempId = `temp_${Date.now()}`;
        const optimisticClient = { ...payload, _id: tempId, name: payload.clientName };
        if (onClientAdded) onClientAdded(optimisticClient);
        toast.success('Client added successfully!');

        axios.post(`${BASE_URL}/api/clients/add`, payload, {
          headers: { Authorization: `Bearer ${user?.token || ""}` }
        }).then(res => {
          // Swap the temp client for the server-confirmed one, if the caller supports it
          if (onClientAdded && res.data?.client) onClientAdded(res.data.client, tempId);
        }).catch(err => {
          toast.error('Failed to save client. Please try again.');
          console.error('Client add failed:', err);
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'save'} client`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: '#F4F6F8', width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, fontFamily: "'Nunito', sans-serif", color: '#1A2332', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fff', borderBottom: '1px solid #E0E6EA', position: 'sticky', top: 0, zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94A3B0' }}>✕</button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Logo Section */}
          <div id="logo" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Client Logo</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Upload a company logo or avatar</div></div>

            </div>
            <div style={{ padding: 20 }}>
              <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24, border: '2px dashed #E0E6EA', borderRadius: 12, background: '#F4F6F8', cursor: 'pointer' }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, background: '#fff', border: '1.5px solid #E0E6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#94A3B0' }}>📷</span>}
                </div>
                <button type="button" style={{ background: TC, color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}> Choose logo</button>
                <span style={{ fontSize: 12, color: '#94A3B0' }}>PNG, JPG or SVG · Max 2MB · Recommended 200✕200px</span>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Basic Info */}
          <div id="basic" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>

            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Client type <span style={{ color: '#EF5350' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { id: 'b2b', icon: 'Company', label: 'B2B', sub: 'Company / Business' },
                    { id: 'b2c', icon: 'Profile', label: 'B2C', sub: 'Individual person' },
                    { id: 'freelancer', icon: 'Job', label: 'Freelancer', sub: 'Consultant / Solo' }
                  ].map(t => (
                    <div key={t.id} onClick={() => setFormData({ ...formData, clientType: t.id })} style={{ border: `2px solid ${formData.clientType === t.id ? ' var(--app-accent, var(--app-accent, #00BCD4))' : '#E0E6EA'}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', background: formData.clientType === t.id ? TC_LIGHT : '#fff', position: 'relative' }}>

                      <span style={{ fontSize: 24, color: formData.clientType === t.id ? TC : '#94A3B0', display: 'block', marginBottom: 6 }}>{t.icon}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: formData.clientType === t.id ? '#0097A7' : '#5A6A7A' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B0', marginTop: 2 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client / display name <span style={{ color: '#EF5350' }}>*</span></label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp or Raj Kumar" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.name ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />
                  {errors.name && <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company name <span style={{ color: '#EF5350' }}>*</span></label>
                  <input name="company" value={formData.company} onChange={handleChange} placeholder="Registered company name" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.company ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />
                  {errors.company && <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>{errors.company}</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category / industry</label>
                  {customInputMode.category ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input name="category" value={formData.category} onChange={handleChange} placeholder="Type custom category..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.category) { setCustomCats(prev => { const next = Array.from(new Set([...prev, formData.category])); try { localStorage.setItem('mb_customCategories', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, category: false })); } }} />
                      <button type="button" onClick={() => { if (formData.category) { setCustomCats(prev => { const next = Array.from(new Set([...prev, formData.category])); try { localStorage.setItem('mb_customCategories', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, category: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                    </div>
                  ) : (
                    <select name="category" value={formData.category} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                      <option value="">Select a category</option>
                      <option value="__custom__">+ Custom</option>
                      <option value="Web Development">Web Development</option><option value="Mobile App Development">Mobile App Development</option><option value="UI/UX Design">UI/UX Design</option><option value="Digital Marketing">Digital Marketing</option><option value="IT Consulting">IT Consulting</option><option value="E-commerce">E-commerce</option><option value="Healthcare">Healthcare</option><option value="Education">Education</option><option value="Finance">Finance</option><option value="Real Estate">Real Estate</option><option value="Manufacturing">Manufacturing</option><option value="Retail">Retail</option><option value="Logistics">Logistics</option><option value="Media & Entertainment">Media & Entertainment</option>
                      {customCats.map(c => <option key={c} value={c}>{c}</option>)}
                      {formData.category && !['Web Development', 'Mobile App Development', 'UI/UX Design', 'Digital Marketing', 'IT Consulting', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Real Estate', 'Manufacturing', 'Retail', 'Logistics', 'Media & Entertainment'].includes(formData.category) && !customCats.includes(formData.category) && (
                        <option value={formData.category}>{formData.category}</option>
                      )}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company tax / GST no.</label>
                  <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="e.g. 22AAAAA0000A1Z5" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client source</label>
                  {customInputMode.source ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input name="source" value={formData.source} onChange={handleChange} placeholder="Type custom source..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.source) { setCustomSources(prev => { const next = Array.from(new Set([...prev, formData.source])); try { localStorage.setItem('mb_customSources', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, source: false })); } }} />
                      <button type="button" onClick={() => { if (formData.source) { setCustomSources(prev => { const next = Array.from(new Set([...prev, formData.source])); try { localStorage.setItem('mb_customSources', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, source: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                    </div>
                  ) : (
                    <select name="source" value={formData.source} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                      <option value="">Select Client Source</option>
                      <option value="__custom__">+ Custom</option>
                      <option value="Referral">Referral</option><option value="Website / Organic">Website / Organic</option><option value="Social Media">Social Media</option><option value="Cold Outreach">Cold Outreach</option><option value="LinkedIn">LinkedIn</option><option value="Event / Conference">Event / Conference</option><option value="Google Ads">Google Ads</option><option value="Word of Mouth">Word of Mouth</option>
                      {customSources.map(s => <option key={s} value={s}>{s}</option>)}
                      {formData.source && !['Referral', 'Website / Organic', 'Social Media', 'Cold Outreach', 'LinkedIn', 'Event / Conference', 'Google Ads', 'Word of Mouth'].includes(formData.source) && !customSources.includes(formData.source) && (
                        <option value={formData.source}>{formData.source}</option>
                      )}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarded on</label>
                  <input type="date" disabled name="onboardedOn" value={formData.onboardedOn} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8', opacity: 0.8, cursor: 'not-allowed' }} />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <div style={{ display: 'flex', gap: 8, height: 42 }}>
                    <button onClick={() => setFormData({ ...formData, status: 'Active' })} style={{ flex: 1, height: '100%', borderRadius: 8, border: `1.5px solid ${formData.status === 'Active' ? '#26A69A' : '#E0E6EA'}`, background: formData.status === 'Active' ? '#E0F2F1' : '#F4F6F8', color: formData.status === 'Active' ? '#26A69A' : '#94A3B0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>Yes Active</button>
                    <button onClick={() => setFormData({ ...formData, status: 'Inactive' })} style={{ flex: 1, height: '100%', borderRadius: 8, border: `1.5px solid ${formData.status === 'Inactive' ? '#EF9A9A' : '#E0E6EA'}`, background: formData.status === 'Inactive' ? '#FFEBEE' : '#F4F6F8', color: formData.status === 'Inactive' ? '#EF5350' : '#94A3B0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>CloseInactive</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div id="contact" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📞</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Primary Contact</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Main point of contact at this client</div></div>

            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact person name <span style={{ color: '#EF5350' }}>*</span></label><input name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} placeholder="Full name" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.contactPersonName ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />{errors.contactPersonName && <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>{errors.contactPersonName}</div>}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</label><input name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. CEO, Project Manager" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email address <span style={{ color: '#EF5350' }}>*</span></label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@company.com" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.email ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alt. email</label><input type="email" name="altEmail" value={formData.altEmail} onChange={handleChange} placeholder="Secondary email" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact person mobile</label><input name="contactPersonNo" value={formData.contactPersonNo} onChange={handleChange} placeholder="+91 98765 43210" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Office phone <span style={{ color: '#EF5350' }}>*</span></label><input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 44 1234 5678" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.phone ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />{errors.phone && <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>{errors.phone}</div>}</div>
            </div>
          </div>

          {/* Address */}
          <div id="address" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📍</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Address</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Billing and office location</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Street / building address <span style={{ color: '#EF5350' }}>*</span></label><input name="address" value={formData.address} onChange={handleChange} placeholder="Flat no, building name, street" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.address ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />{errors.address && <div style={{ fontSize: 11, color: '#EF5350', marginTop: 4 }}>{errors.address}</div>}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label><input name="city" value={formData.city} onChange={handleChange} placeholder="Chennai" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State / province</label><input name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pincode / ZIP</label><input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</label>
                {customInputMode.country ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="country" value={formData.country} onChange={handleChange} placeholder="Type custom country..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.country) { setCustomCountries(prev => { const next = Array.from(new Set([...prev, formData.country])); try { localStorage.setItem('mb_customCountries', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, country: false })); } }} />
                    <button type="button" onClick={() => { if (formData.country) { setCustomCountries(prev => { const next = Array.from(new Set([...prev, formData.country])); try { localStorage.setItem('mb_customCountries', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, country: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                  </div>
                ) : (
                  <select name="country" value={formData.country} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">Select Country</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="India">India</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option><option value="United Arab Emirates">United Arab Emirates</option><option value="Singapore">Singapore</option><option value="Australia">Australia</option><option value="Canada">Canada</option><option value="Germany">Germany</option><option value="France">France</option>
                    {customCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.country && !['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Canada', 'Germany', 'France'].includes(formData.country) && !customCountries.includes(formData.country) && (
                      <option value={formData.country}>{formData.country}</option>
                    )}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Online Presence */}
          <div id="online" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌐</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Online Presence</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website URL</label><input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.company.com" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn profile</label><input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/company/..." style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
            </div>
          </div>

          {/* Billing & Terms */}
          <div id="billing" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💳</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Billing & Terms</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing currency</label>
                {customInputMode.billingCurrency ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="billingCurrency" value={formData.billingCurrency} onChange={handleChange} placeholder="Type custom currency..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.billingCurrency) { setCustomCurrencies(prev => { const next = Array.from(new Set([...prev, formData.billingCurrency])); try { localStorage.setItem('mb_customCurrencies', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, billingCurrency: false })); } }} />
                    <button type="button" onClick={() => { if (formData.billingCurrency) { setCustomCurrencies(prev => { const next = Array.from(new Set([...prev, formData.billingCurrency])); try { localStorage.setItem('mb_customCurrencies', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, billingCurrency: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                  </div>
                ) : (
                  <select name="billingCurrency" value={formData.billingCurrency} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">Select Billing Currency</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="INR — Indian Rupee">INR — Indian Rupee</option><option value="USD — US Dollar">USD — US Dollar</option><option value="GBP — British Pound">GBP — British Pound</option><option value="EUR — Euro">EUR — Euro</option><option value="AED — UAE Dirham">AED — UAE Dirham</option><option value="SGD — Singapore Dollar">SGD — Singapore Dollar</option><option value="AUD — Australian Dollar">AUD — Australian Dollar</option>
                    {customCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.billingCurrency && !['INR — Indian Rupee', 'USD — US Dollar', 'GBP — British Pound', 'EUR — Euro', 'AED — UAE Dirham', 'SGD — Singapore Dollar', 'AUD — Australian Dollar'].includes(formData.billingCurrency) && !customCurrencies.includes(formData.billingCurrency) && (
                      <option value={formData.billingCurrency}>{formData.billingCurrency}</option>
                    )}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment terms</label>
                {customInputMode.paymentTerms ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="Type custom terms..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.paymentTerms) { setCustomPaymentTerms(prev => { const next = Array.from(new Set([...prev, formData.paymentTerms])); try { localStorage.setItem('mb_customPaymentTerms', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, paymentTerms: false })); } }} />
                    <button type="button" onClick={() => { if (formData.paymentTerms) { setCustomPaymentTerms(prev => { const next = Array.from(new Set([...prev, formData.paymentTerms])); try { localStorage.setItem('mb_customPaymentTerms', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, paymentTerms: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                  </div>
                ) : (
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">Select Payment Terms</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Due on receipt">Due on receipt</option><option value="Net 7">Net 7</option><option value="Net 15">Net 15</option><option value="Net 30">Net 30</option><option value="Net 45">Net 45</option><option value="Net 60">Net 60</option><option value="50% Advance + 50% on delivery">50% Advance + 50% on delivery</option>
                    {customPaymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
                    {formData.paymentTerms && !['Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance + 50% on delivery'].includes(formData.paymentTerms) && !customPaymentTerms.includes(formData.paymentTerms) && (
                      <option value={formData.paymentTerms}>{formData.paymentTerms}</option>
                    )}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit limit</label><input type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} placeholder="e.g. 50000" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment mode</label>
                {customInputMode.PaymentMode ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input name="PaymentMode" value={formData.PaymentMode} onChange={handleChange} placeholder="Type custom mode..." style={{ flex: 1, height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (formData.PaymentMode) { setCustomPaymentModes(prev => { const next = Array.from(new Set([...prev, formData.PaymentMode])); try { localStorage.setItem('mb_customPaymentModes', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, PaymentMode: false })); } }} />
                    <button type="button" onClick={() => { if (formData.PaymentMode) { setCustomPaymentModes(prev => { const next = Array.from(new Set([...prev, formData.PaymentMode])); try { localStorage.setItem('mb_customPaymentModes', JSON.stringify(next)); } catch (err) { } return next; }); } setCustomInputMode(prev => ({ ...prev, PaymentMode: false })); }} style={{ width: 42, height: 42, background: '#F4F6F8', border: '1.5px solid #E0E6EA', borderRadius: 8, cursor: 'pointer', color: '#5A6A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
                  </div>
                ) : (
                  <select name="PaymentMode" value={formData.PaymentMode} onChange={handleSelectChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">Select Payment Mode</option>
                    <option value="__custom__">+ Custom</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option><option value="UPI">UPI</option><option value="Cheque">Cheque</option><option value="Credit Card">Credit Card</option><option value="Cash">Cash</option><option value="PayPal">PayPal</option><option value="Stripe">Stripe</option>
                    {customPaymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                    {formData.PaymentMode && !['Bank Transfer / NEFT', 'UPI', 'Cheque', 'Credit Card', 'Cash', 'PayPal', 'Stripe'].includes(formData.PaymentMode) && !customPaymentModes.includes(formData.PaymentMode) && (
                      <option value={formData.PaymentMode}>{formData.PaymentMode}</option>
                    )}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Portal Access */}
          <div id="portal" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔒</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Portal Access</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Set client portal password" style={{ width: '100%', height: 42, padding: '0 46px 0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }) }} placeholder="Re-enter password" style={{ width: '100%', height: 42, padding: '0 46px 0 14px', border: `1.5px solid ${errors.confirmPassword ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }} />
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{showConfirmPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {errors.confirmPassword && <div style={{ fontSize: 11, color: '#EF5350' }}>{errors.confirmPassword}</div>}
              </div>

            </div>
          </div>

          {/* Internal Notes */}

          <div id="notes" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: `linear-gradient(90deg, ${TC_LIGHT} 0%, #ffffff 100%)` }}>
              <div style={{ width: 36, height: 36, background: TC, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📝</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Internal Notes</div></div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any internal context, special instructions, or notes about this client..." style={{ width: '100%', height: 80, padding: '10px 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8', resize: 'vertical' }}></textarea>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, color: '#94A3B0', display: 'flex', alignItems: 'center', gap: 6 }}></div>
            <div style={{ display: 'flex', gap: 10 }}>

              <button onClick={submitForm} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', background: saving ? '#80DEEA' : ' var(--app-accent, var(--app-accent, #00BCD4))', color: 'white', border: '1.5px solid  var(--app-accent, var(--app-accent, #00BCD4))', opacity: saving ? 0.8 : 1, transition: 'all 0.2s' }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                    {isEdit ? 'Updating' : 'Saving'}
                  </span>
                ) : (isEdit ? '✅ Update Client' : '👤 Add Client')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
