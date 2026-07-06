import base64
import re
import os

def build():
    # 1. We start by reading the jsx_converted.txt
    with open('c:\\M Business\\M Business\\jsx_converted.txt', 'r', encoding='utf-8') as f:
        jsx_content = f.read()

    # 2. Extract CSS
    style_match = re.search(r'/\* CSS STYLES \*/\n(.*?)\n/\* JSX CONTENT \*/', jsx_content, re.DOTALL)
    css_content = style_match.group(1).strip() if style_match else ""

    # 3. Extract JSX
    jsx_match = re.search(r'/\* JSX CONTENT \*/\n(.*)', jsx_content, re.DOTALL)
    body_jsx = jsx_match.group(1).strip() if jsx_match else ""

    # We need to wrap it in a React component
    react_code = f"""import React, {{ useState, useRef, useEffect }} from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import {{ jsPDF }} from "jspdf";
import {{ BASE_URL }} from "../config";

export default function QuotationCreatorModern({{ user, clients = [], projects = [] }}) {{
  const [qtList, setQtList] = useState([]);
  const [step, setStep] = useState("form"); // "list", "form", "preview"
  
  // States mapping to the new UI
  const [qt, setQt] = useState({{
    quoteNo: "QUO-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000),
    quoteDate: new Date().toISOString().split('T')[0],
    title: "",
    type: "Web Development",
    description: "",
    fromCompany: "YENCODE Technologies",
    fromName: "Prabhu R",
    fromEmail: "",
    fromPhone: "+91 89254 33533",
    toName: "",
    toContact: "",
    toEmail: "",
    toPhone: "",
    toAddress: "",
    overview: "",
    validity: "30",
    notes: ""
  }});

  const [tags, setTags] = useState(["UI/UX Design", "Frontend Dev", "CMS Setup"]);
  const [tagInput, setTagInput] = useState("");

  const [phases, setPhases] = useState([
    {{ id: 1, title: "Discovery & Design", desc: "Requirements gathering, wireframing...", features: ["Wireframes (all pages)", "UI Design – Desktop + Mobile", "Brand style guide"] }},
    {{ id: 2, title: "Development", desc: "Full frontend development using React.js...", features: ["Responsive frontend (React.js)", "CMS integration", "Contact form", "SEO meta tags"] }}
  ]);

  const [inclusions, setInclusions] = useState(["3 rounds of revisions", "Source code handover", "30-day support post launch"]);
  const [exclusions, setExclusions] = useState(["Domain & hosting charges", "Content writing / copywriting", "Third-party API costs"]);

  const [items, setItems] = useState([
    {{ id: 1, desc: "UI/UX Design", qty: 1, rate: 18000 }},
    {{ id: 2, desc: "Frontend Development", qty: 1, rate: 25000 }},
    {{ id: 3, desc: "CMS Integration", qty: 1, rate: 12000 }}
  ]);

  const upd = (f, v) => setQt(p => ({{ ...p, [f]: v }}));
  
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.qty) || 0), 0);
  const total = subtotal; // Assuming no GST in the UI right now, can add later

  const handleSaveDraft = () => {{
    alert("Draft saved!");
  }};

  const convertToInvoice = () => {{
    alert("Converted to invoice!");
  }};
  
  const sendQuote = () => {{
    alert("Quote sent!");
  }};

  return (
    <div style={{{{ flex: 1, minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}}}>
      <style>{{`
        {css_content.replace('`', '\\`')}
        .main {{ margin-left: 0 !important; }}
        .sidebar {{ display: none !important; }}
      `}}</style>

      {{/* We are injecting the full body JSX from the user's HTML, but replacing specific parts with React state */}}
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="back-btn" onClick={{() => setStep("list")}}><i className="ti ti-arrow-left" style={{{{fontSize: "13px"}}}}></i> Quotations</button>
            <div className="topbar-title">Create Quotation</div>
          </div>
          <div className="topbar-actions">
            <button className="btn-outline" onClick={{handleSaveDraft}}><i className="ti ti-device-floppy" style={{{{fontSize: "13px"}}}}></i> Save Draft</button>
            <button className="btn-teal btn-amber" onClick={{sendQuote}}><i className="ti ti-send" style={{{{fontSize: "13px"}}}}></i> Send Quote</button>
          </div>
        </header>
        <div className="content" ref={mainScrollRef}>
          <h1>Work in Progress - Complex JSX injection requires manual fixing</h1>
          {{/* The original HTML is too complex with raw javascript attributes. A full rewrite of the JSX is needed */}}
        </div>
      </div>
    </div>
  );
}}
"""
    with open('c:\\M Business\\M Business\\src\\components\\QuotationCreatorModern.jsx', 'w', encoding='utf-8') as f:
        f.write(react_code)
    print("Created QuotationCreatorModern.jsx")

if __name__ == "__main__":
    build()
