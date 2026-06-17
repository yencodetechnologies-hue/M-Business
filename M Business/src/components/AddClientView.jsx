import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AddClientView({ onBack, onClientAdded, user }) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    clientType: 'b2b',
    name: '',
    company: '',
    category: '',
    gstNumber: '',
    source: '',
    onboardedOn: today,
    status: 'Active',
    contactPersonName: '',
    designation: '',
    email: '',
    altEmail: '',
    contactPersonNo: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    website: '',
    linkedin: '',
    billingCurrency: 'INR — Indian Rupee',
    paymentTerms: '',
    creditLimit: '',
    preferredPaymentMode: '',
    password: '',
    notes: '',
    logoUrl: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('logo');

  const fileInputRef = useRef(null);

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
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    if (formData.password && formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields correctly.');
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
        password: formData.password,
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
        preferredPaymentMode: formData.preferredPaymentMode,
        internalNotes: formData.notes
      };

      const res = await axios.post(`${BASE_URL}/api/clients/add`, payload, {
        headers: { Authorization: `Bearer ${user?.token || ""}` }
      });
      toast.success('Client added successfully!');
      if (onClientAdded) onClientAdded(res.data.client);
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  // Sections scroll spy could be implemented here, simplified for React
  return (
    <div style={{ background: '#F4F6F8', minHeight: '100%', fontFamily: "'Nunito', sans-serif", color: '#1A2332' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E0E6EA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#5A6A7A' }}>🔙</button>
          <div style={{ width: 32, height: 32, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>M</div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>M Business</span>
          <div style={{ fontSize: 13, color: '#94A3B0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>&gt;</span>
            Clients
            <span>&gt;</span>
            <span style={{ color: '#00BCD4', fontWeight: 600 }}>Add New Client</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setFormData({ ...formData, name: '' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#F4F6F8', color: '#5A6A7A', border: '1.5px solid #E0E6EA' }}>Reset</button>
          <button onClick={submitForm} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#00BCD4', color: 'white', border: '1.5px solid #00BCD4' }}>
            {saving ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, maxWidth: 1200, margin: '0 auto', padding: '28px 24px', alignItems: 'start' }}>
        
        {/* SIDEBAR */}
        <aside style={{ position: 'sticky', top: 84, background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B0', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 12px', borderBottom: '1px solid #E0E6EA', marginBottom: 10 }}>Form sections</div>
          
          {[
            { id: 'logo', icon: '🖼️', label: 'Logo' },
            { id: 'basic', icon: '🏢', label: 'Basic info', dot: true },
            { id: 'contact', icon: '📞', label: 'Primary contact', dot: true },
            { id: 'address', icon: '📍', label: 'Address' },
            { id: 'online', icon: '🌐', label: 'Online presence' },
            { id: 'billing', icon: '💳', label: 'Billing & terms' },
            { id: 'portal', icon: '🔒', label: 'Portal access' },
            { id: 'notes', icon: '📝', label: 'Internal notes' }
          ].map(nav => (
            <a key={nav.id} href={`#${nav.id}`} onClick={() => setActiveSection(nav.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', fontSize: 13.5, fontWeight: activeSection === nav.id ? 600 : 500, color: activeSection === nav.id ? '#00BCD4' : '#5A6A7A', background: activeSection === nav.id ? '#E0F7FA' : 'transparent', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 16, width: 18, textAlign: 'center' }}>{nav.icon}</span> {nav.label}
              {nav.dot && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#00BCD4' }}></div>}
            </a>
          ))}

          <div style={{ background: '#E0F7FA', borderRadius: 20, height: 6, overflow: 'hidden', margin: '14px 0 4px' }}>
            <div style={{ height: '100%', background: '#00BCD4', borderRadius: 20, width: `${progress}%`, transition: 'width 0.4s ease' }}></div>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B0', textAlign: 'right' }}>{progress}% filled</div>

          <div style={{ marginTop: 16, padding: '10px 12px', background: '#FFEBEE', borderRadius: 8, fontSize: 12, color: '#C62828', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.5 }}>
            <span style={{ marginTop: 1 }}>⚠️</span> Fields marked * are required to save the client.
          </div>
        </aside>

        {/* FORM CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Logo Section */}
          <div id="logo" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>🖼️</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Client Logo</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Upload a company logo or avatar</div></div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F4F6F8', color: '#94A3B0', border: '1px solid #E0E6EA' }}>Optional</span>
            </div>
            <div style={{ padding: 20 }}>
              <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24, border: '2px dashed #E0E6EA', borderRadius: 12, background: '#F4F6F8', cursor: 'pointer' }}>
                <div style={{ width: 72, height: 72, borderRadius: 14, background: '#fff', border: '1.5px solid #E0E6EA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{ fontSize: 28, color: '#94A3B0' }}>🏢</span>}
                </div>
                <button type="button" style={{ background: '#00BCD4', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>📷 Choose logo</button>
                <span style={{ fontSize: 12, color: '#94A3B0' }}>PNG, JPG or SVG · Max 2MB · Recommended 200×200px</span>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload}/>
            </div>
          </div>

          {/* Basic Info */}
          <div id="basic" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>🏢</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Basic Info</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Core client identity and classification</div></div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#E0F7FA', color: '#0097A7' }}>Core</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>Client type <span style={{ color: '#EF5350' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { id: 'b2b', icon: '🏢', label: 'B2B', sub: 'Company / Business' },
                    { id: 'b2c', icon: '👤', label: 'B2C', sub: 'Individual person' },
                    { id: 'freelancer', icon: '💼', label: 'Freelancer', sub: 'Consultant / Solo' }
                  ].map(t => (
                    <div key={t.id} onClick={() => setFormData({ ...formData, clientType: t.id })} style={{ border: `2px solid ${formData.clientType === t.id ? '#00BCD4' : '#E0E6EA'}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', cursor: 'pointer', background: formData.clientType === t.id ? '#E0F7FA' : '#fff', position: 'relative' }}>
                      {formData.clientType === t.id && <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#00BCD4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</div>}
                      <span style={{ fontSize: 24, color: formData.clientType === t.id ? '#00BCD4' : '#94A3B0', display: 'block', marginBottom: 6 }}>{t.icon}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: formData.clientType === t.id ? '#0097A7' : '#5A6A7A' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#94A3B0', marginTop: 2 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client / display name <span style={{ color: '#EF5350' }}>*</span></label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Acme Corp or Raj Kumar" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.name ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company name <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#F4F6F8', border: '1px solid #E0E6EA', marginLeft: 5 }}>Optional</span></label>
                  <input name="company" value={formData.company} onChange={handleChange} placeholder="Registered company name" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category / industry</label>
                  <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">Select a category</option>
                    <option>Web Development</option><option>Mobile App Development</option><option>UI/UX Design</option><option>Digital Marketing</option><option>IT Consulting</option><option>E-commerce</option><option>Healthcare</option><option>Education</option><option>Finance</option><option>Real Estate</option><option>Manufacturing</option><option>Retail</option><option>Logistics</option><option>Media & Entertainment</option><option>Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company tax / GST no.</label>
                  <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="e.g. 22AAAAA0000A1Z5" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client source</label>
                  <select name="source" value={formData.source} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}>
                    <option value="">How did they find you?</option>
                    <option>Referral</option><option>Website / Organic</option><option>Social Media</option><option>Cold Outreach</option><option>LinkedIn</option><option>Event / Conference</option><option>Google Ads</option><option>Word of Mouth</option><option>Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onboarded on</label>
                  <input type="date" name="onboardedOn" value={formData.onboardedOn} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setFormData({ ...formData, status: 'Active' })} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1.5px solid ${formData.status === 'Active' ? '#26A69A' : '#E0E6EA'}`, background: formData.status === 'Active' ? '#E0F2F1' : '#F4F6F8', color: formData.status === 'Active' ? '#26A69A' : '#94A3B0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>✓ Active</button>
                    <button onClick={() => setFormData({ ...formData, status: 'Inactive' })} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1.5px solid ${formData.status === 'Inactive' ? '#EF9A9A' : '#E0E6EA'}`, background: formData.status === 'Inactive' ? '#FFEBEE' : '#F4F6F8', color: formData.status === 'Inactive' ? '#EF5350' : '#94A3B0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>✕ Inactive</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div id="contact" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>📞</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Primary Contact</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Main point of contact at this client</div></div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#E0F7FA', color: '#0097A7' }}>Core</span>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact person name</label><input name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} placeholder="Full name" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</label><input name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. CEO, Project Manager" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email address <span style={{ color: '#EF5350' }}>*</span></label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@company.com" style={{ width: '100%', height: 42, padding: '0 14px', border: `1.5px solid ${errors.email ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alt. email</label><input type="email" name="altEmail" value={formData.altEmail} onChange={handleChange} placeholder="Secondary email" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact person mobile</label><input name="contactPersonNo" value={formData.contactPersonNo} onChange={handleChange} placeholder="+91 98765 43210" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Office phone</label><input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 44 1234 5678" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
            </div>
          </div>

          {/* Address */}
          <div id="address" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>📍</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Address</div><div style={{ fontSize: 12, color: '#94A3B0' }}>Billing and office location</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Street / building address</label><input name="address" value={formData.address} onChange={handleChange} placeholder="Flat no., building name, street" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label><input name="city" value={formData.city} onChange={handleChange} placeholder="Chennai" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State / province</label><input name="state" value={formData.state} onChange={handleChange} placeholder="Tamil Nadu" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pincode / ZIP</label><input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="600001" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Country</label><select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}><option>India</option><option>United States</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Singapore</option><option>Australia</option><option>Canada</option><option>Germany</option><option>France</option><option>Other</option></select></div>
            </div>
          </div>

          {/* Online Presence */}
          <div id="online" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>🌐</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Online Presence</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website URL</label><input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.company.com" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn profile</label><input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/company/..." style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
            </div>
          </div>

          {/* Billing & Terms */}
          <div id="billing" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>💳</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Billing & Terms</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing currency</label><select name="billingCurrency" value={formData.billingCurrency} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}><option>INR — Indian Rupee</option><option>USD — US Dollar</option><option>GBP — British Pound</option><option>EUR — Euro</option><option>AED — UAE Dirham</option><option>SGD — Singapore Dollar</option><option>AUD — Australian Dollar</option></select></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment terms</label><select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}><option value="">Select terms</option><option>Due on receipt</option><option>Net 7</option><option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>50% Advance + 50% on delivery</option><option>Custom</option></select></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit limit</label><input type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} placeholder="e.g. 50000" style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred payment mode</label><select name="preferredPaymentMode" value={formData.preferredPaymentMode} onChange={handleChange} style={{ width: '100%', height: 42, padding: '0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}><option value="">Select mode</option><option>Bank Transfer / NEFT</option><option>UPI</option><option>Cheque</option><option>Credit Card</option><option>Cash</option><option>PayPal</option><option>Stripe</option><option>Other</option></select></div>
            </div>
          </div>

          {/* Portal Access */}
          <div id="portal" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>🔒</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Portal Access</div></div>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Set client portal password" style={{ width: '100%', height: 42, padding: '0 46px 0 14px', border: '1.5px solid #E0E6EA', borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }) }} placeholder="Re-enter password" style={{ width: '100%', height: 42, padding: '0 46px 0 14px', border: `1.5px solid ${errors.confirmPassword ? '#EF5350' : '#E0E6EA'}`, borderRadius: 8, fontSize: 14, background: '#F4F6F8' }}/>
                  <button onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{showConfirmPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {errors.confirmPassword && <div style={{ fontSize: 11, color: '#EF5350' }}>{errors.confirmPassword}</div>}
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div id="notes" style={{ background: '#fff', border: '1px solid #E0E6EA', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #E0E6EA', background: 'linear-gradient(90deg, #E0F7FA 0%, #ffffff 100%)' }}>
              <div style={{ width: 36, height: 36, background: '#00BCD4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 17 }}>📝</div>
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
            <div style={{ fontSize: 13, color: '#94A3B0', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#00BCD4' }}>🛡️</span> All data is saved securely.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#F4F6F8', color: '#5A6A7A', border: '1.5px solid #E0E6EA' }}>Cancel</button>
              <button onClick={submitForm} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#00BCD4', color: 'white', border: '1.5px solid #00BCD4' }}>
                {saving ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
