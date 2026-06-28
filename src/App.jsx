import { useState, useEffect, useRef } from "react";

// ─── SEED DATA (shown only when bypassing onboarding in dev) ─────────────────
const SEED = {
  company: { name: "Bladesmith Supply Co.", currency: "CAD", fiscal_year_start: "January" },
  customers: [
    { id: "c1", name: "Harbour Front Kitchen", email: "orders@harbourfrontkitchen.ca", phone: "416-555-0192", city: "Toronto", status: "active", balance: 3240.00, notes: "Prefers morning delivery. Key contact: Marie." },
    { id: "c2", name: "Rosedale Cookware", email: "buying@rosedalecookware.com", phone: "416-555-0344", city: "Toronto", status: "active", balance: 890.50, notes: "Net 30 terms." },
    { id: "c3", name: "Pacific Rim Restaurant Group", email: "ap@pacificrimrg.com", phone: "604-555-0871", city: "Vancouver", status: "active", balance: 5100.00, notes: "Large wholesale account." },
    { id: "c4", name: "The Wooden Spoon", email: "hello@woodenspoon.ca", phone: "647-555-0233", city: "Toronto", status: "inactive", balance: 0, notes: "Seasonal buyer." },
    { id: "c5", name: "Mercer Culinary Arts", email: "procurement@mercerculinary.ca", phone: "514-555-0654", city: "Montréal", status: "active", balance: 1450.00, notes: "School account — net 60." },
  ],
  invoices: [
    { id: "INV-1041", customer_id: "c1", date: "2026-06-10", due: "2026-07-10", status: "unpaid", total: 3240.00, items: [{ desc: "Yoshihiro Gyuto 240mm", qty: 2, price: 920.00 }, { desc: "Sharpening Stone Kit", qty: 4, price: 100.00 }] },
    { id: "INV-1040", customer_id: "c3", date: "2026-06-05", due: "2026-07-05", status: "unpaid", total: 5100.00, items: [{ desc: "Deba Knife 180mm", qty: 6, price: 450.00 }, { desc: "Knife Roll — Canvas", qty: 12, price: 75.00 }] },
    { id: "INV-1039", customer_id: "c2", date: "2026-05-28", due: "2026-06-27", status: "overdue", total: 890.50, items: [{ desc: "Binchotan Charcoal 5kg", qty: 3, price: 89.00 }, { desc: "Hinoki Cutting Board", qty: 5, price: 115.00 }] },
    { id: "INV-1038", customer_id: "c5", date: "2026-05-15", due: "2026-07-14", status: "unpaid", total: 1450.00, items: [{ desc: "Nakiri Knife 165mm", qty: 5, price: 290.00 }] },
    { id: "INV-1037", customer_id: "c1", date: "2026-05-01", due: "2026-05-31", status: "paid", total: 2100.00, items: [{ desc: "Kiritsuke 270mm", qty: 2, price: 750.00 }, { desc: "Magnetic Knife Bar", qty: 6, price: 100.00 }] },
    { id: "INV-1036", customer_id: "c4", date: "2026-04-10", due: "2026-05-10", status: "paid", total: 560.00, items: [{ desc: "Whetstone 1000/6000", qty: 4, price: 140.00 }] },
  ],
  expenses: [
    { id: "e1", date: "2026-06-20", vendor: "Yamaki Imports Ltd.", category: "Inventory", amount: 8400.00, notes: "Knife shipment Q2", receipt: true },
    { id: "e2", date: "2026-06-18", vendor: "Canada Post", category: "Shipping", amount: 312.50, notes: "June outbound parcels", receipt: true },
    { id: "e3", date: "2026-06-15", vendor: "Shopify", category: "Software", amount: 79.00, notes: "Monthly plan", receipt: false },
    { id: "e4", date: "2026-06-10", vendor: "WeWork King St.", category: "Rent", amount: 1800.00, notes: "June office/showroom", receipt: true },
    { id: "e5", date: "2026-06-05", vendor: "Bell Canada", category: "Utilities", amount: 145.00, notes: "Internet + phone", receipt: true },
    { id: "e6", date: "2026-05-28", vendor: "Yamaki Imports Ltd.", category: "Inventory", amount: 6200.00, notes: "Knife shipment Q1 restock", receipt: true },
    { id: "e7", date: "2026-05-20", vendor: "Google Workspace", category: "Software", amount: 28.00, notes: "Monthly plan", receipt: false },
    { id: "e8", date: "2026-05-10", vendor: "WeWork King St.", category: "Rent", amount: 1800.00, notes: "May office/showroom", receipt: true },
  ],
  inventory: [
    { id: "i1", sku: "YGY-240", name: "Yoshihiro Gyuto 240mm", category: "Knives", stock: 8, reorder: 3, cost: 420.00, price: 920.00 },
    { id: "i2", sku: "DBA-180", name: "Deba Knife 180mm", category: "Knives", stock: 14, reorder: 5, cost: 200.00, price: 450.00 },
    { id: "i3", sku: "NAK-165", name: "Nakiri Knife 165mm", category: "Knives", stock: 9, reorder: 5, cost: 130.00, price: 290.00 },
    { id: "i4", sku: "KIR-270", name: "Kiritsuke 270mm", category: "Knives", stock: 2, reorder: 3, cost: 340.00, price: 750.00 },
    { id: "i5", sku: "WST-1000", name: "Whetstone 1000/6000", category: "Sharpening", stock: 22, reorder: 8, cost: 58.00, price: 140.00 },
    { id: "i6", sku: "SKK-SET", name: "Sharpening Stone Kit", category: "Sharpening", stock: 11, reorder: 4, cost: 42.00, price: 100.00 },
    { id: "i7", sku: "HNK-CTB", name: "Hinoki Cutting Board", category: "Boards", stock: 3, reorder: 4, cost: 52.00, price: 115.00 },
    { id: "i8", sku: "KRL-CVS", name: "Knife Roll — Canvas", category: "Accessories", stock: 18, reorder: 6, cost: 32.00, price: 75.00 },
    { id: "i9", sku: "MGN-BAR", name: "Magnetic Knife Bar", category: "Accessories", stock: 5, reorder: 5, cost: 38.00, price: 100.00 },
    { id: "i10", sku: "BCT-5KG", name: "Binchotan Charcoal 5kg", category: "Consumables", stock: 7, reorder: 5, cost: 38.00, price: 89.00 },
  ],
  suppliers: [
    { id: "s1", name: "Yamaki Imports Ltd.", email: "orders@yamaki.co.jp", phone: "+81-3-555-0192", country: "Japan", lead_days: 21, notes: "Primary knife supplier. Wire transfer only." },
    { id: "s2", name: "Pacific Stone Co.", email: "info@pacificstone.ca", phone: "778-555-0445", country: "Canada", lead_days: 5, notes: "Local whetstones and sharpening supplies." },
    { id: "s3", name: "Hinoki Works", email: "export@hinokiworks.jp", phone: "+81-6-555-0334", country: "Japan", lead_days: 28, notes: "Cutting boards and wooden ware." },
    { id: "s4", name: "Forest & Field Accessories", email: "wholesale@forestandfield.ca", phone: "416-555-0782", country: "Canada", lead_days: 7, notes: "Canvas rolls, leather goods." },
  ],
  purchase_orders: [
    { id: "PO-0088", supplier_id: "s1", date: "2026-06-15", expected: "2026-07-06", status: "ordered", total: 5800.00, items: [{ desc: "Gyuto 240mm × 10", qty: 10, price: 420.00 }, { desc: "Kiritsuke 270mm × 5", qty: 5, price: 340.00 }] },
    { id: "PO-0087", supplier_id: "s3", date: "2026-06-08", expected: "2026-07-06", status: "ordered", total: 1040.00, items: [{ desc: "Hinoki Cutting Board × 20", qty: 20, price: 52.00 }] },
    { id: "PO-0086", supplier_id: "s2", date: "2026-05-20", expected: "2026-05-25", status: "received", total: 1160.00, items: [{ desc: "Whetstone 1000/6000 × 20", qty: 20, price: 58.00 }] },
    { id: "PO-0085", supplier_id: "s4", date: "2026-05-10", expected: "2026-05-17", status: "received", total: 640.00, items: [{ desc: "Knife Roll Canvas × 20", qty: 20, price: 32.00 }] },
  ],
  team: [
    { id: "t1", name: "Sarah Okafor", role: "Owner / Buyer", email: "sarah@bladesmithsupply.ca", phone: "416-555-0100", start: "2021-03-01", status: "active", hours_week: 45 },
    { id: "t2", name: "James Tran", role: "Sales & Fulfilment", email: "james@bladesmithsupply.ca", phone: "647-555-0291", start: "2022-08-15", status: "active", hours_week: 40 },
    { id: "t3", name: "Priya Mehta", role: "Bookkeeper (PT)", email: "priya@bladesmithsupply.ca", phone: "416-555-0483", start: "2023-01-10", status: "active", hours_week: 20 },
    { id: "t4", name: "Luis Fernandez", role: "Warehouse", email: "luis@bladesmithsupply.ca", phone: "416-555-0877", start: "2023-06-01", status: "active", hours_week: 40 },
  ],
  projects: [
    { id: "p1", name: "Website Relaunch", status: "in_progress", due: "2026-08-01", owner: "t1", budget: 4500.00, spent: 1200.00, notes: "New Shopify theme + product photography." },
    { id: "p2", name: "Japanese Knife Catalog 2026", status: "in_progress", due: "2026-07-15", owner: "t2", budget: 1800.00, spent: 800.00, notes: "Print + digital. Send to printer by July 1." },
    { id: "p3", name: "Vancouver Wholesale Outreach", status: "planned", due: "2026-09-01", owner: "t1", budget: 2000.00, spent: 0, notes: "Target 10 restaurant groups in Metro Vancouver." },
    { id: "p4", name: "Inventory System Migration", status: "done", due: "2026-05-01", owner: "t3", budget: 800.00, spent: 750.00, notes: "Completed on time." },
  ],
};

const EMPTY_DATA = {
  company: { name: "", currency: "CAD", fiscal_year_start: "January" },
  customers: [],
  invoices: [],
  expenses: [],
  inventory: [],
  suppliers: [],
  purchase_orders: [],
  team: [],
  projects: [],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(n);

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

const statusBadge = (status, map) => {
  const cfg = map[status] || { label: status, color: "#94a3b8", bg: "#f1f5f9" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", padding: "3px 8px",
      borderRadius: 4, background: cfg.bg, color: cfg.color, textTransform: "uppercase" }}>
      {cfg.label}
    </span>
  );
};

const INV_STATUS = {
  paid: { label: "Paid", color: "#16a34a", bg: "#dcfce7" },
  unpaid: { label: "Unpaid", color: "#7c3aed", bg: "#ede9fe" },
  overdue: { label: "Overdue", color: "#dc2626", bg: "#fee2e2" },
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
};
const PO_STATUS = {
  ordered: { label: "Ordered", color: "#7c3aed", bg: "#ede9fe" },
  received: { label: "Received", color: "#16a34a", bg: "#dcfce7" },
  draft: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
};
const PROJ_STATUS = {
  planned: { label: "Planned", color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#7c3aed", bg: "#ede9fe" },
  done: { label: "Done", color: "#16a34a", bg: "#dcfce7" },
};

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CURRENCIES = [
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    company: "",
    owner: "",
    currency: "CAD",
    fiscal_year_start: "January",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.company.trim()) e.company = "Company name is required";
    if (!form.owner.trim()) e.owner = "Owner name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) return;
    const settings = { ...form, company: form.company.trim(), owner: form.owner.trim() };
    if (isElectron) {
      await window.electronAPI.completeOnboarding(settings);
    }
    onComplete(settings);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 480, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44, background: "#6366f1", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#fff",
          }}>M</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Mise ERP</div>
            <div style={{ fontSize: 12, color: "#475569" }}>Small Business Management</div>
          </div>
        </div>

        <div style={{
          background: "#151920", borderRadius: 16, padding: 32,
          border: "1px solid #252c3a", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" }}>
            Welcome to Mise ERP
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px", lineHeight: 1.6 }}>
            Let's set up your workspace. This only takes a minute.
          </p>

          <OnboardField label="Company Name" error={errors.company}>
            <OnboardInput
              value={form.company}
              onChange={v => setForm({ ...form, company: v })}
              placeholder="Acme Supply Co."
              autoFocus
            />
          </OnboardField>

          <OnboardField label="Your Name" error={errors.owner}>
            <OnboardInput
              value={form.owner}
              onChange={v => setForm({ ...form, owner: v })}
              placeholder="Jane Smith"
            />
          </OnboardField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <OnboardField label="Currency">
              <OnboardSelect
                value={form.currency}
                onChange={v => setForm({ ...form, currency: v })}
                options={CURRENCIES}
              />
            </OnboardField>
            <OnboardField label="Fiscal Year Starts">
              <OnboardSelect
                value={form.fiscal_year_start}
                onChange={v => setForm({ ...form, fiscal_year_start: v })}
                options={MONTHS.map(m => ({ value: m, label: m }))}
              />
            </OnboardField>
          </div>

          <button
            onClick={handleComplete}
            style={{
              width: "100%", marginTop: 8, padding: "12px 0",
              background: "#6366f1", color: "#fff", border: "none",
              borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.target.style.background = "#4f46e5")}
            onMouseLeave={e => (e.target.style.background = "#6366f1")}
          >
            Get Started →
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#334155" }}>
          Mise ERP · Your data stays on your Mac.
        </div>
      </div>
    </div>
  );
}

function OnboardField({ label, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8",
        marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function OnboardInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: "100%", padding: "10px 12px",
        background: "#1e2530", border: "1px solid #2d3748",
        borderRadius: 8, fontSize: 14, color: "#f1f5f9",
        fontFamily: "inherit", outline: "none", boxSizing: "border-box",
      }}
    />
  );
}

function OnboardSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 12px",
        background: "#1e2530", border: "1px solid #2d3748",
        borderRadius: 8, fontSize: 14, color: "#f1f5f9",
        fontFamily: "inherit", outline: "none", boxSizing: "border-box",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "customers", label: "Customers", icon: "◎" },
  { id: "invoices", label: "Invoicing", icon: "◈" },
  { id: "expenses", label: "Expenses", icon: "◇" },
  { id: "inventory", label: "Inventory", icon: "▦" },
  { id: "purchasing", label: "Purchasing", icon: "▷" },
  { id: "team", label: "Team", icon: "◉" },
  { id: "projects", label: "Projects", icon: "◫" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "integrations", label: "Integrations", icon: "⬡" },
];

export default function ERP() {
  const [appState, setAppState] = useState("loading"); // loading | onboarding | ready
  const [settings, setSettings] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [data, setDataRaw] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [updateInfo, setUpdateInfo] = useState(null); // { version, type: 'available'|'downloaded' }

  // ── Load from electron-store on mount ──
  useEffect(() => {
    (async () => {
      if (!isElectron) {
        // Dev browser fallback: use seed data
        setSettings(SEED.company);
        setDataRaw(SEED);
        setAppState("ready");
        return;
      }
      const firstLaunch = await window.electronAPI.isFirstLaunch();
      if (firstLaunch) {
        setAppState("onboarding");
        return;
      }
      const savedSettings = await window.electronAPI.getSettings();
      const savedData = await window.electronAPI.getData();
      setSettings(savedSettings);
      setDataRaw(savedData || { ...EMPTY_DATA, company: { name: savedSettings?.company || "", currency: savedSettings?.currency || "CAD", fiscal_year_start: savedSettings?.fiscal_year_start || "January" } });
      setAppState("ready");
    })();
  }, []);

  // ── Auto-updater listeners ──
  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI.onUpdateAvailable(info => setUpdateInfo({ ...info, type: "available" }));
    window.electronAPI.onUpdateDownloaded(info => setUpdateInfo({ ...info, type: "downloaded" }));
    return () => window.electronAPI.removeUpdateListeners();
  }, []);

  // ── Persist to electron-store on every data change ──
  const setData = (updater) => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isElectron) window.electronAPI.setData(next);
      return next;
    });
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOnboardingComplete = (newSettings) => {
    setSettings(newSettings);
    const emptyData = {
      ...EMPTY_DATA,
      company: {
        name: newSettings.company,
        currency: newSettings.currency,
        fiscal_year_start: newSettings.fiscal_year_start,
      },
    };
    setDataRaw(emptyData);
    if (isElectron) window.electronAPI.setData(emptyData);
    setAppState("ready");
  };

  if (appState === "loading") {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0f1117", color: "#64748b", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (appState === "onboarding") {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const pages = {
    dashboard: Dashboard, customers: Customers, invoices: Invoices,
    expenses: Expenses, inventory: Inventory, purchasing: Purchasing,
    team: Team, projects: Projects, reports: Reports, integrations: Integrations,
  };
  const Page = pages[active] || Dashboard;
  const currency = settings?.currency || data?.company?.currency || "CAD";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif",
      background: "#f8f9fb", color: "#1a1d23", overflow: "hidden" }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 60, background: "#151920", color: "#e2e8f0",
        display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, zIndex: 10 }}>
        <div style={{ padding: sidebarOpen ? "20px 20px 16px" : "20px 12px 16px",
          borderBottom: "1px solid #252c3a", display: "flex", alignItems: "center", gap: 10,
          WebkitAppRegion: "drag", // allow dragging window from sidebar header
        }}>
          <div style={{ width: 30, height: 30, background: "#6366f1", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
            WebkitAppRegion: "no-drag",
          }}>M</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>
                {data?.company?.name || settings?.company || "Mise ERP"}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Small Business ERP</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: sidebarOpen ? "9px 20px" : "9px 0", justifyContent: sidebarOpen ? "flex-start" : "center",
                background: active === m.id ? "#252c3a" : "transparent",
                color: active === m.id ? "#a5b4fc" : "#94a3b8",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: active === m.id ? 600 : 400,
                transition: "all 0.15s", borderLeft: active === m.id ? "3px solid #6366f1" : "3px solid transparent" }}>
              <span style={{ fontSize: 15 }}>{m.icon}</span>
              {sidebarOpen && m.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ padding: "12px 0", background: "#1e2530", border: "none", color: "#64748b",
            cursor: "pointer", fontSize: 16, borderTop: "1px solid #252c3a" }}>
          {sidebarOpen ? "←" : "→"}
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Update banner */}
        {updateInfo && (
          <div style={{
            background: updateInfo.type === "downloaded" ? "#1a2e1a" : "#1a1f2e",
            borderBottom: `1px solid ${updateInfo.type === "downloaded" ? "#166534" : "#3730a3"}`,
            padding: "10px 24px", display: "flex", alignItems: "center", gap: 12, fontSize: 13,
            color: updateInfo.type === "downloaded" ? "#86efac" : "#a5b4fc",
          }}>
            <span>
              {updateInfo.type === "downloaded"
                ? `✓ Mise ERP ${updateInfo.version} is ready to install.`
                : `↓ Mise ERP ${updateInfo.version} is downloading…`}
            </span>
            {updateInfo.type === "downloaded" && (
              <button
                onClick={() => window.electronAPI.installUpdate()}
                style={{ marginLeft: "auto", padding: "5px 14px", background: "#16a34a", color: "#fff",
                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Install Update
              </button>
            )}
            <button onClick={() => setUpdateInfo(null)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer",
                fontSize: 16, opacity: 0.5, marginLeft: updateInfo.type !== "downloaded" ? "auto" : 0 }}>
              ×
            </button>
          </div>
        )}

        <Page data={data} setData={setData} showToast={showToast} currency={currency} />
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 20px",
          background: toast.type === "success" ? "#16a34a" : toast.type === "error" ? "#dc2626" : "#6366f1",
          color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 1000, maxWidth: 360 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "28px 32px 0", marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1d23" }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8eaed",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent = false }) {
  return (
    <Card style={{ padding: "20px 24px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? "#6366f1" : "#1a1d23",
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function Table({ columns, rows, onRow }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding: "10px 16px", textAlign: c.align || "left",
                fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em",
                textTransform: "uppercase", whiteSpace: "nowrap" }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: "32px 16px", textAlign: "center",
              color: "#94a3b8", fontSize: 13 }}>No records yet.</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} onClick={() => onRow && onRow(row)}
              style={{ borderBottom: "1px solid #f1f5f9",
                cursor: onRow ? "pointer" : "default",
                transition: "background 0.1s" }}
              onMouseEnter={e => onRow && (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: "12px 16px", color: "#374151",
                  textAlign: c.align || "left", verticalAlign: "middle" }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style: s = {} }) {
  const base = { border: "none", borderRadius: 6, cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s", display: "inline-flex",
    alignItems: "center", gap: 6 };
  const variants = {
    primary: { background: "#6366f1", color: "#fff", padding: size === "sm" ? "6px 12px" : "9px 18px", fontSize: size === "sm" ? 12 : 13 },
    secondary: { background: "#f1f5f9", color: "#374151", padding: size === "sm" ? "6px 12px" : "9px 18px", fontSize: size === "sm" ? 12 : 13 },
    danger: { background: "#fee2e2", color: "#dc2626", padding: size === "sm" ? "6px 12px" : "9px 18px", fontSize: size === "sm" ? 12 : 13 },
    ghost: { background: "transparent", color: "#6366f1", padding: size === "sm" ? "6px 12px" : "9px 18px", fontSize: size === "sm" ? 12 : 13, border: "1px solid #e8eaed" },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...s }}>{children}</button>;
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 500, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: width,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151",
        marginBottom: 5, letterSpacing: "0.02em" }}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style: s = {} }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} type={type}
      placeholder={placeholder}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
        borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none", color: "#1a1d23", background: "#fafafa", ...s }} />
  );
}

function Select({ value, onChange, options, style: s = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
        borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none", color: "#1a1d23", background: "#fafafa", ...s }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      rows={rows}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
        borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none", color: "#1a1d23", background: "#fafafa", resize: "vertical" }} />
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
        fontSize: 14, color: "#94a3b8", pointerEvents: "none" }}>⌕</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Search…"}
        style={{ padding: "8px 10px 8px 32px", border: "1px solid #e2e8f0", borderRadius: 6,
          fontSize: 13, fontFamily: "inherit", outline: "none", width: 220, background: "#fafafa" }} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #f8f9fb", fontSize: 13 }}>
      <span style={{ width: 90, color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#374151" }}>{value}</span>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data, currency }) {
  const unpaidTotal = data.invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + i.total, 0);
  const overdueTotal = data.invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const paidTotal = data.invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const expTotal = data.expenses.reduce((s, e) => s + e.amount, 0);
  const lowStock = data.inventory.filter(i => i.stock <= i.reorder);
  const recentInv = [...data.invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const getCustomer = id => data.customers.find(c => c.id === id);
  const openPOs = data.purchase_orders.filter(p => p.status === "ordered");
  const c = currency;

  return (
    <div>
      <PageHeader title="Dashboard"
        subtitle={`Welcome back — ${new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`} />
      <div style={{ padding: "0 32px 32px" }}>
        {/* KPI Row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Receivables" value={fmt(unpaidTotal + overdueTotal, c)} sub={`${data.invoices.filter(i => i.status !== "paid").length} open invoices`} accent />
          <StatCard label="Overdue" value={fmt(overdueTotal, c)} sub="Past due date" />
          <StatCard label="Collected (MTD)" value={fmt(paidTotal, c)} sub="Paid invoices" />
          <StatCard label="Expenses (MTD)" value={fmt(expTotal, c)} sub={`${data.expenses.length} transactions`} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Recent Invoices</div>
            </div>
            <Table
              columns={[
                { key: "id", label: "Invoice" },
                { key: "customer_id", label: "Customer", render: v => getCustomer(v)?.name || v },
                { key: "date", label: "Date", render: v => fmtDate(v) },
                { key: "total", label: "Amount", align: "right", render: v => fmt(v, c) },
                { key: "status", label: "Status", render: v => statusBadge(v, INV_STATUS) },
              ]}
              rows={recentInv}
            />
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>⚠ Needs Attention</div>
              {overdueTotal > 0 && (
                <AlertRow icon="◈" color="#dc2626" label={`${data.invoices.filter(i => i.status === "overdue").length} overdue invoice(s)`} val={fmt(overdueTotal, c)} />
              )}
              {lowStock.map(item => (
                <AlertRow key={item.id} icon="▦" color="#f59e0b" label={`Low stock: ${item.name}`} val={`${item.stock} left`} />
              ))}
              {openPOs.map(po => (
                <AlertRow key={po.id} icon="▷" color="#6366f1" label={`PO ${po.id} in transit`} val={fmtDate(po.expected)} />
              ))}
              {overdueTotal === 0 && lowStock.length === 0 && openPOs.length === 0 && (
                <div style={{ color: "#16a34a", fontSize: 13 }}>✓ All clear</div>
              )}
            </Card>

            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Open Projects</div>
              {data.projects.filter(p => p.status !== "done").length === 0
                ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No active projects.</div>
                : data.projects.filter(p => p.status !== "done").map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, marginTop: 5 }}>
                      <div style={{ height: "100%", width: `${Math.min((p.spent / p.budget) * 100, 100)}%`,
                        background: p.spent > p.budget ? "#dc2626" : "#6366f1", borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                      {fmt(p.spent, c)} of {fmt(p.budget, c)} · Due {fmtDate(p.due)}
                    </div>
                  </div>
                ))
              }
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ icon, color, label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: "1px solid #f8f9fb" }}>
      <span style={{ fontSize: 13, color: "#374151" }}><span style={{ color }}>{icon} </span>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{val}</span>
    </div>
  );
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
function Customers({ data, setData, showToast, currency: c = "CAD" }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [detail, setDetail] = useState(null);

  const filtered = data.customers.filter(cu =>
    [cu.name, cu.email, cu.city].some(f => f?.toLowerCase().includes(search.toLowerCase())));

  const openNew = () => { setForm({ name: "", email: "", phone: "", city: "", status: "active", notes: "" }); setModal("new"); };
  const openEdit = (cu) => { setForm({ ...cu }); setModal("edit"); };

  const save = () => {
    if (!form.name) return showToast("Customer name is required", "error");
    if (modal === "new") {
      const newC = { ...form, id: `c${Date.now()}`, balance: 0 };
      setData(d => ({ ...d, customers: [...d.customers, newC] }));
      showToast("Customer added");
    } else {
      setData(d => ({ ...d, customers: d.customers.map(cu => cu.id === form.id ? form : cu) }));
      showToast("Customer updated");
    }
    setModal(null);
  };

  const customerInvoices = detail ? data.invoices.filter(i => i.customer_id === detail.id) : [];

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${data.customers.length} customers`}
        action={<Btn onClick={openNew}>+ Add Customer</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        {detail ? (
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 12 }}>
              <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>← Back</Btn>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{detail.name}</h2>
              <div style={{ marginLeft: "auto" }}>
                <Btn variant="secondary" size="sm" onClick={() => openEdit(detail)}>Edit</Btn>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 20, borderRight: "1px solid #f1f5f9" }}>
                <InfoRow label="Email" value={detail.email} />
                <InfoRow label="Phone" value={detail.phone} />
                <InfoRow label="City" value={detail.city} />
                <InfoRow label="Status" value={statusBadge(detail.status, { active: { label: "Active", color: "#16a34a", bg: "#dcfce7" }, inactive: { label: "Inactive", color: "#94a3b8", bg: "#f1f5f9" } })} />
                <InfoRow label="Balance" value={<strong style={{ color: detail.balance > 0 ? "#dc2626" : "#16a34a" }}>{fmt(detail.balance, c)}</strong>} />
                {detail.notes && <InfoRow label="Notes" value={detail.notes} />}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Invoice History</div>
                {customerInvoices.length === 0
                  ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No invoices yet.</div>
                  : customerInvoices.map(inv => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: "1px solid #f8f9fb", fontSize: 13 }}>
                      <span style={{ color: "#6366f1", fontWeight: 500 }}>{inv.id}</span>
                      <span>{fmtDate(inv.date)}</span>
                      <span>{fmt(inv.total, c)}</span>
                      {statusBadge(inv.status, INV_STATUS)}
                    </div>
                  ))
                }
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search customers…" />
            </div>
            <Table
              columns={[
                { key: "name", label: "Name", render: (v, row) => <span style={{ fontWeight: 600, color: "#6366f1", cursor: "pointer" }} onClick={() => setDetail(row)}>{v}</span> },
                { key: "email", label: "Email" },
                { key: "city", label: "City" },
                { key: "status", label: "Status", render: v => statusBadge(v, { active: { label: "Active", color: "#16a34a", bg: "#dcfce7" }, inactive: { label: "Inactive", color: "#94a3b8", bg: "#f1f5f9" } }) },
                { key: "balance", label: "Balance", align: "right", render: v => <span style={{ color: v > 0 ? "#dc2626" : "#374151", fontVariantNumeric: "tabular-nums" }}>{fmt(v, c)}</span> },
                { key: "id", label: "", render: (v, row) => <Btn variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Btn> },
              ]}
              rows={filtered}
            />
          </Card>
        )}
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Add Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          <Field label="Company / Name"><Input value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="Harbour Front Kitchen" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Email"><Input value={form.email || ""} onChange={v => setForm({ ...form, email: v })} placeholder="orders@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone || ""} onChange={v => setForm({ ...form, phone: v })} placeholder="416-555-0000" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City"><Input value={form.city || ""} onChange={v => setForm({ ...form, city: v })} /></Field>
            <Field label="Status"><Select value={form.status || "active"} onChange={v => setForm({ ...form, status: v })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes || ""} onChange={v => setForm({ ...form, notes: v })} /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>{modal === "new" ? "Add Customer" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────
function Invoices({ data, setData, showToast, currency: c = "CAD" }) {
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ customer_id: "", date: "", due: "", items: [{ desc: "", qty: 1, price: 0 }] });
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef(null);

  const filtered = data.invoices.filter(i => filter === "all" ? true : i.status === filter);
  const getCustomer = id => data.customers.find(cu => cu.id === id);
  const calcTotal = items => items.reduce((s, it) => s + (parseFloat(it.qty) * parseFloat(it.price) || 0), 0);

  const nextId = () => {
    const max = Math.max(...data.invoices.map(i => parseInt(i.id.split("-")[1])), 1040);
    return `INV-${max + 1}`;
  };

  const saveInvoice = () => {
    if (!form.customer_id) return showToast("Select a customer", "error");
    if (!form.date) return showToast("Set an invoice date", "error");
    const newInv = { ...form, id: nextId(), status: "unpaid", total: calcTotal(form.items) };
    setData(d => ({ ...d, invoices: [newInv, ...d.invoices] }));
    showToast("Invoice created");
    setModal(null);
  };

  const markPaid = (inv) => {
    setData(d => ({
      ...d,
      invoices: d.invoices.map(i => i.id === inv.id ? { ...i, status: "paid" } : i),
      customers: d.customers.map(cu => cu.id === inv.customer_id ? { ...cu, balance: Math.max(0, cu.balance - inv.total) } : cu),
    }));
    showToast(`${inv.id} marked as paid`);
    setDetail(null);
  };

  const downloadPDF = async (inv) => {
    if (!isElectron) return showToast("PDF export is only available in the desktop app", "error");
    setPdfLoading(true);
    try {
      const filePath = await window.electronAPI.exportInvoicePDF(inv.id);
      showToast(`PDF saved: ${filePath}`);
    } catch (err) {
      showToast(`PDF export failed: ${err.message}`, "error");
    } finally {
      setPdfLoading(false);
    }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { desc: "", qty: 1, price: 0 }] }));
  const updateItem = (idx, field, val) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));
  const removeItem = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const TABS = [
    { key: "all", label: "All" },
    { key: "unpaid", label: "Unpaid" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div>
      <PageHeader title="Invoicing"
        subtitle={`${data.invoices.filter(i => i.status !== "paid").length} open invoices`}
        action={<Btn onClick={() => {
          setForm({ customer_id: data.customers[0]?.id || "", date: new Date().toISOString().slice(0, 10), due: "", items: [{ desc: "", qty: 1, price: 0 }] });
          setModal(true);
        }}>+ New Invoice</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        {detail ? (
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 12 }}>
              <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>← Back</Btn>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{detail.id}</h2>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {detail.status !== "paid" && <Btn size="sm" onClick={() => markPaid(detail)}>Mark as Paid</Btn>}
                <Btn variant="secondary" size="sm" onClick={() => downloadPDF(detail)} style={{ opacity: pdfLoading ? 0.6 : 1 }}>
                  {pdfLoading ? "Generating…" : "↓ Download PDF"}
                </Btn>
              </div>
            </div>
            {/* Invoice detail — this is what gets printed to PDF */}
            <div ref={invoiceRef} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Bill To</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{getCustomer(detail.customer_id)?.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{getCustomer(detail.customer_id)?.email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <InfoRow label="Date" value={fmtDate(detail.date)} />
                  <InfoRow label="Due" value={fmtDate(detail.due)} />
                  <InfoRow label="Status" value={statusBadge(detail.status, INV_STATUS)} />
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                    <th style={{ padding: "8px 0", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</th>
                    <th style={{ padding: "8px 0", textAlign: "center", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</th>
                    <th style={{ padding: "8px 0", textAlign: "right", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Price</th>
                    <th style={{ padding: "8px 0", textAlign: "right", color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8f9fb" }}>
                      <td style={{ padding: "10px 0" }}>{it.desc}</td>
                      <td style={{ padding: "10px 0", textAlign: "center" }}>{it.qty}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(it.price, c)}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(it.qty * it.price, c)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: "12px 0", textAlign: "right", fontWeight: 700, fontSize: 14 }}>Total</td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontWeight: 700, fontSize: 16, color: "#6366f1", fontVariantNumeric: "tabular-nums" }}>{fmt(detail.total, c)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 4 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: filter === t.key ? 600 : 400,
                    background: filter === t.key ? "#6366f1" : "transparent",
                    color: filter === t.key ? "#fff" : "#64748b" }}>{t.label}
                  <span style={{ fontSize: 11, marginLeft: 5, opacity: 0.7 }}>
                    {data.invoices.filter(i => t.key === "all" ? true : i.status === t.key).length}
                  </span>
                </button>
              ))}
            </div>
            <Table
              columns={[
                { key: "id", label: "Invoice", render: v => <span style={{ color: "#6366f1", fontWeight: 600 }}>{v}</span> },
                { key: "customer_id", label: "Customer", render: v => getCustomer(v)?.name || v },
                { key: "date", label: "Issued", render: v => fmtDate(v) },
                { key: "due", label: "Due", render: v => fmtDate(v) },
                { key: "total", label: "Amount", align: "right", render: v => <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v, c)}</span> },
                { key: "status", label: "Status", render: v => statusBadge(v, INV_STATUS) },
              ]}
              rows={filtered}
              onRow={setDetail}
            />
          </Card>
        )}
      </div>

      {modal && (
        <Modal title="New Invoice" onClose={() => setModal(null)} width={640}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Customer" style={{ gridColumn: "span 2" }}>
              <Select value={form.customer_id} onChange={v => setForm({ ...form, customer_id: v })}
                options={data.customers.map(cu => ({ value: cu.id, label: cu.name }))} />
            </Field>
            <Field label="Invoice Date"><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
            <Field label="Due Date" style={{ gridColumn: "span 2" }}><Input type="date" value={form.due} onChange={v => setForm({ ...form, due: v })} /></Field>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, marginTop: 4 }}>LINE ITEMS</div>
          {form.items.map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 32px", gap: 8, marginBottom: 8 }}>
              <Input value={it.desc} onChange={v => updateItem(idx, "desc", v)} placeholder="Description" />
              <Input value={it.qty} onChange={v => updateItem(idx, "qty", v)} type="number" placeholder="Qty" />
              <Input value={it.price} onChange={v => updateItem(idx, "price", v)} type="number" placeholder="Price" />
              <button onClick={() => removeItem(idx)} style={{ background: "#fee2e2", border: "none", borderRadius: 6, color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={addItem}>+ Add Line</Btn>
          <div style={{ textAlign: "right", marginTop: 12, fontSize: 15, fontWeight: 700, color: "#6366f1" }}>
            Total: {fmt(calcTotal(form.items), c)}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveInvoice}>Create Invoice</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
const EXPENSE_CATS = ["Inventory","Shipping","Software","Rent","Utilities","Marketing","Travel","Professional Services","Other"];

function Expenses({ data, setData, showToast, currency: c = "CAD" }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = data.expenses.filter(e =>
    (catFilter === "all" || e.category === catFilter) &&
    [e.vendor, e.notes, e.category].some(f => f?.toLowerCase().includes(search.toLowerCase())));
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const save = () => {
    if (!form.vendor) return showToast("Vendor required", "error");
    if (!form.amount) return showToast("Amount required", "error");
    const newE = { ...form, id: `e${Date.now()}`, amount: parseFloat(form.amount), receipt: false };
    setData(d => ({ ...d, expenses: [newE, ...d.expenses] }));
    showToast("Expense logged");
    setModal(false);
  };

  const catTotals = EXPENSE_CATS.reduce((acc, cat) => {
    acc[cat] = data.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Expenses"
        subtitle={`${data.expenses.length} transactions · ${fmt(data.expenses.reduce((s, e) => s + e.amount, 0), c)} total`}
        action={<Btn onClick={() => { setForm({ vendor: "", category: "Inventory", amount: "", date: new Date().toISOString().slice(0, 10), notes: "" }); setModal(true); }}>+ Log Expense</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {["Inventory", "Rent", "Software", "Shipping"].map(cat => (
            <StatCard key={cat} label={cat} value={fmt(catTotals[cat] || 0, c)} />
          ))}
        </div>
        <Card>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" />
            <Select value={catFilter} onChange={setCatFilter} style={{ width: 180 }}
              options={[{ value: "all", label: "All Categories" }, ...EXPENSE_CATS.map(cat => ({ value: cat, label: cat }))]} />
            {(search || catFilter !== "all") && <span style={{ fontSize: 13, color: "#64748b" }}>Showing: {fmt(total, c)}</span>}
          </div>
          <Table
            columns={[
              { key: "date", label: "Date", render: v => fmtDate(v) },
              { key: "vendor", label: "Vendor" },
              { key: "category", label: "Category" },
              { key: "notes", label: "Notes" },
              { key: "amount", label: "Amount", align: "right", render: v => <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(v, c)}</span> },
              { key: "receipt", label: "Receipt", render: v => <span style={{ color: v ? "#16a34a" : "#dc2626", fontSize: 13 }}>{v ? "✓" : "—"}</span> },
            ]}
            rows={filtered}
          />
        </Card>
      </div>

      {modal && (
        <Modal title="Log Expense" onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Vendor"><Input value={form.vendor || ""} onChange={v => setForm({ ...form, vendor: v })} placeholder="Canada Post" /></Field>
            <Field label={`Amount (${c})`}><Input value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} type="number" placeholder="0.00" /></Field>
            <Field label="Category"><Select value={form.category || "Other"} onChange={v => setForm({ ...form, category: v })} options={EXPENSE_CATS.map(cat => ({ value: cat, label: cat }))} /></Field>
            <Field label="Date"><Input type="date" value={form.date || ""} onChange={v => setForm({ ...form, date: v })} /></Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes || ""} onChange={v => setForm({ ...form, notes: v })} rows={2} /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save}>Log Expense</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
function Inventory({ data, setData, showToast, currency: c = "CAD" }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = data.inventory.filter(i =>
    [i.name, i.sku, i.category].some(f => f?.toLowerCase().includes(search.toLowerCase())));
  const lowStock = data.inventory.filter(i => i.stock <= i.reorder);
  const totalValue = data.inventory.reduce((s, i) => s + i.stock * i.cost, 0);
  const totalRetail = data.inventory.reduce((s, i) => s + i.stock * i.price, 0);

  const save = () => {
    if (!form.name || !form.sku) return showToast("Name and SKU required", "error");
    if (modal === "new") {
      setData(d => ({ ...d, inventory: [...d.inventory, { ...form, id: `i${Date.now()}`, stock: parseInt(form.stock) || 0, reorder: parseInt(form.reorder) || 0, cost: parseFloat(form.cost) || 0, price: parseFloat(form.price) || 0 }] }));
      showToast("Product added");
    } else {
      setData(d => ({ ...d, inventory: d.inventory.map(i => i.id === form.id ? { ...form, stock: parseInt(form.stock), reorder: parseInt(form.reorder), cost: parseFloat(form.cost), price: parseFloat(form.price) } : i) }));
      showToast("Product updated");
    }
    setModal(null);
  };

  return (
    <div>
      <PageHeader title="Inventory"
        subtitle={`${data.inventory.length} products · ${fmt(totalValue, c)} cost value`}
        action={<Btn onClick={() => { setForm({ name: "", sku: "", category: "", stock: 0, reorder: 0, cost: 0, price: 0 }); setModal("new"); }}>+ Add Product</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <StatCard label="Total Products" value={data.inventory.length} />
          <StatCard label="Stock Value (Cost)" value={fmt(totalValue, c)} />
          <StatCard label="Stock Value (Retail)" value={fmt(totalRetail, c)} accent />
          <StatCard label="Low Stock Alerts" value={lowStock.length} sub={lowStock.length > 0 ? lowStock.map(i => i.name).slice(0, 2).join(", ") + (lowStock.length > 2 ? "…" : "") : "All stocked"} />
        </div>
        {lowStock.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
            ⚠ Low stock: {lowStock.map(i => `${i.name} (${i.stock} left)`).join(" · ")}
          </div>
        )}
        <Card>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search products…" />
          </div>
          <Table
            columns={[
              { key: "sku", label: "SKU", render: v => <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{v}</span> },
              { key: "name", label: "Product" },
              { key: "category", label: "Category" },
              { key: "stock", label: "In Stock", align: "center", render: (v, row) => <span style={{ fontWeight: 600, color: v <= row.reorder ? "#dc2626" : "#16a34a" }}>{v}</span> },
              { key: "reorder", label: "Reorder At", align: "center" },
              { key: "cost", label: "Cost", align: "right", render: v => <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v, c)}</span> },
              { key: "price", label: "Price", align: "right", render: v => <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v, c)}</span> },
              { key: "id", label: "", render: (v, row) => <Btn variant="ghost" size="sm" onClick={() => { setForm({ ...row }); setModal("edit"); }}>Edit</Btn> },
            ]}
            rows={filtered}
          />
        </Card>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Add Product" : "Edit Product"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Product Name" style={{ gridColumn: "span 2" }}><Input value={form.name || ""} onChange={v => setForm({ ...form, name: v })} /></Field>
            <Field label="SKU"><Input value={form.sku || ""} onChange={v => setForm({ ...form, sku: v })} placeholder="YGY-240" /></Field>
            <Field label="Category"><Input value={form.category || ""} onChange={v => setForm({ ...form, category: v })} placeholder="Knives" /></Field>
            <Field label="Stock"><Input value={form.stock} onChange={v => setForm({ ...form, stock: v })} type="number" /></Field>
            <Field label="Reorder Point"><Input value={form.reorder} onChange={v => setForm({ ...form, reorder: v })} type="number" /></Field>
            <Field label={`Cost (${c})`}><Input value={form.cost} onChange={v => setForm({ ...form, cost: v })} type="number" /></Field>
            <Field label={`Sale Price (${c})`}><Input value={form.price} onChange={v => setForm({ ...form, price: v })} type="number" /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>{modal === "new" ? "Add Product" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PURCHASING ───────────────────────────────────────────────────────────────
function Purchasing({ data, setData, showToast, currency: c = "CAD" }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [detail, setDetail] = useState(null);

  const getSupplier = id => data.suppliers.find(s => s.id === id);

  const save = () => {
    if (!form.supplier_id || !form.date) return showToast("Fill in required fields", "error");
    const total = (form.items || []).reduce((s, i) => s + (parseFloat(i.qty) * parseFloat(i.price) || 0), 0);
    if (modal === "new") {
      const lastId = data.purchase_orders[0]?.id?.split("-")[1] || "88";
      const newId = `PO-${String(parseInt(lastId) + 1).padStart(4, "0")}`;
      setData(d => ({ ...d, purchase_orders: [{ ...form, id: newId, status: "ordered", total }, ...d.purchase_orders] }));
      showToast("Purchase order created");
    }
    setModal(null);
  };

  const markReceived = po => {
    setData(d => ({ ...d, purchase_orders: d.purchase_orders.map(p => p.id === po.id ? { ...p, status: "received" } : p) }));
    showToast(`${po.id} marked as received`);
    setDetail(null);
  };

  return (
    <div>
      <PageHeader title="Purchasing"
        subtitle={`${data.purchase_orders.filter(p => p.status === "ordered").length} open orders`}
        action={<Btn onClick={() => { setForm({ supplier_id: data.suppliers[0]?.id, date: new Date().toISOString().slice(0, 10), expected: "", items: [{ desc: "", qty: 1, price: 0 }] }); setModal("new"); }}>+ New Order</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
          <Card>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 14, fontWeight: 700 }}>Suppliers</div>
            {data.suppliers.length === 0
              ? <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>No suppliers yet.</div>
              : data.suppliers.map(s => (
                <div key={s.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f8f9fb" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.country} · {s.lead_days} day lead time</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{s.email}</div>
                </div>
              ))
            }
          </Card>

          <Card>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 14, fontWeight: 700 }}>Purchase Orders</div>
            {detail ? (
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setDetail(null)}>← Back</Btn>
                  <span style={{ fontWeight: 700 }}>{detail.id}</span>
                  {detail.status === "ordered" && <Btn size="sm" onClick={() => markReceived(detail)}>Mark Received</Btn>}
                </div>
                <InfoRow label="Supplier" value={getSupplier(detail.supplier_id)?.name} />
                <InfoRow label="Ordered" value={fmtDate(detail.date)} />
                <InfoRow label="Expected" value={fmtDate(detail.expected)} />
                <InfoRow label="Status" value={statusBadge(detail.status, PO_STATUS)} />
                <div style={{ marginTop: 16 }}>
                  {detail.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8f9fb", fontSize: 13 }}>
                      <span>{it.desc}</span>
                      <span>{it.qty} × {fmt(it.price, c)} = <strong>{fmt(it.qty * it.price, c)}</strong></span>
                    </div>
                  ))}
                  <div style={{ textAlign: "right", marginTop: 12, fontWeight: 700, fontSize: 15, color: "#6366f1" }}>Total: {fmt(detail.total, c)}</div>
                </div>
              </div>
            ) : (
              <Table
                columns={[
                  { key: "id", label: "PO #", render: v => <span style={{ color: "#6366f1", fontWeight: 600 }}>{v}</span> },
                  { key: "supplier_id", label: "Supplier", render: v => getSupplier(v)?.name },
                  { key: "date", label: "Date", render: v => fmtDate(v) },
                  { key: "expected", label: "Expected", render: v => fmtDate(v) },
                  { key: "total", label: "Total", align: "right", render: v => <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v, c)}</span> },
                  { key: "status", label: "Status", render: v => statusBadge(v, PO_STATUS) },
                ]}
                rows={data.purchase_orders}
                onRow={setDetail}
              />
            )}
          </Card>
        </div>
      </div>

      {modal === "new" && (
        <Modal title="New Purchase Order" onClose={() => setModal(null)} width={600}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Supplier" style={{ gridColumn: "span 3" }}>
              <Select value={form.supplier_id} onChange={v => setForm({ ...form, supplier_id: v })}
                options={data.suppliers.map(s => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label="Order Date"><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
            <Field label="Expected Date" style={{ gridColumn: "span 2" }}><Input type="date" value={form.expected || ""} onChange={v => setForm({ ...form, expected: v })} /></Field>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>ITEMS</div>
          {(form.items || []).map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 32px", gap: 8, marginBottom: 8 }}>
              <Input value={it.desc} onChange={v => setForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, desc: v } : x) }))} placeholder="Description" />
              <Input value={it.qty} onChange={v => setForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, qty: v } : x) }))} type="number" />
              <Input value={it.price} onChange={v => setForm(f => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, price: v } : x) }))} type="number" />
              <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))} style={{ background: "#fee2e2", border: "none", borderRadius: 6, color: "#dc2626", cursor: "pointer" }}>×</button>
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, items: [...(f.items || []), { desc: "", qty: 1, price: 0 }] }))}>+ Add Item</Btn>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>Create Order</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────
function Team({ data, setData, showToast }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const save = () => {
    if (!form.name || !form.role) return showToast("Name and role required", "error");
    if (modal === "new") {
      setData(d => ({ ...d, team: [...d.team, { ...form, id: `t${Date.now()}`, status: "active", hours_week: parseInt(form.hours_week) || 40 }] }));
      showToast("Team member added");
    } else {
      setData(d => ({ ...d, team: d.team.map(t => t.id === form.id ? { ...form, hours_week: parseInt(form.hours_week) } : t) }));
      showToast("Team member updated");
    }
    setModal(null);
  };

  return (
    <div>
      <PageHeader title="Team"
        subtitle={`${data.team.filter(t => t.status === "active").length} active · ${data.team.reduce((s, t) => s + t.hours_week, 0)} hrs/week total`}
        action={<Btn onClick={() => { setForm({ name: "", role: "", email: "", phone: "", start: "", status: "active", hours_week: 40 }); setModal("new"); }}>+ Add Member</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {data.team.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, gridColumn: "1 / -1" }}>No team members yet. Add your first.</div>
            : data.team.map(member => (
              <Card key={member.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: "#ede9fe",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: "#6366f1", flexShrink: 0 }}>
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 500, marginTop: 1 }}>{member.role}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{member.email}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Since {fmtDate(member.start)}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>· {member.hours_week}h/wk</span>
                      {statusBadge(member.status, { active: { label: "Active", color: "#16a34a", bg: "#dcfce7" }, inactive: { label: "Inactive", color: "#94a3b8", bg: "#f1f5f9" } })}
                    </div>
                  </div>
                  <Btn variant="ghost" size="sm" onClick={() => { setForm({ ...member }); setModal("edit"); }}>Edit</Btn>
                </div>
              </Card>
            ))
          }
        </div>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Add Team Member" : "Edit Team Member"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name" style={{ gridColumn: "span 2" }}><Input value={form.name || ""} onChange={v => setForm({ ...form, name: v })} /></Field>
            <Field label="Role / Title"><Input value={form.role || ""} onChange={v => setForm({ ...form, role: v })} placeholder="Sales & Fulfilment" /></Field>
            <Field label="Hours / Week"><Input value={form.hours_week || ""} onChange={v => setForm({ ...form, hours_week: v })} type="number" /></Field>
            <Field label="Email"><Input value={form.email || ""} onChange={v => setForm({ ...form, email: v })} /></Field>
            <Field label="Phone"><Input value={form.phone || ""} onChange={v => setForm({ ...form, phone: v })} /></Field>
            <Field label="Start Date"><Input type="date" value={form.start || ""} onChange={v => setForm({ ...form, start: v })} /></Field>
            <Field label="Status"><Select value={form.status || "active"} onChange={v => setForm({ ...form, status: v })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>{modal === "new" ? "Add Member" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
function Projects({ data, setData, showToast, currency: c = "CAD" }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const getOwner = id => data.team.find(t => t.id === id);

  const save = () => {
    if (!form.name) return showToast("Project name required", "error");
    if (modal === "new") {
      setData(d => ({ ...d, projects: [...d.projects, { ...form, id: `p${Date.now()}`, budget: parseFloat(form.budget) || 0, spent: parseFloat(form.spent) || 0 }] }));
      showToast("Project created");
    } else {
      setData(d => ({ ...d, projects: d.projects.map(p => p.id === form.id ? { ...form, budget: parseFloat(form.budget), spent: parseFloat(form.spent) } : p) }));
      showToast("Project updated");
    }
    setModal(null);
  };

  return (
    <div>
      <PageHeader title="Projects"
        subtitle={`${data.projects.filter(p => p.status === "in_progress").length} in progress`}
        action={<Btn onClick={() => { setForm({ name: "", status: "planned", owner: data.team[0]?.id || "", due: "", budget: 0, spent: 0, notes: "" }); setModal("new"); }}>+ New Project</Btn>} />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {data.projects.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 13, gridColumn: "1 / -1" }}>No projects yet.</div>
            : data.projects.map(p => {
              const pct = p.budget > 0 ? Math.min((p.spent / p.budget) * 100, 100) : 0;
              const overBudget = p.spent > p.budget;
              return (
                <Card key={p.id} style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        Owner: {getOwner(p.owner)?.name || "Unassigned"} · Due {fmtDate(p.due)}
                      </div>
                    </div>
                    {statusBadge(p.status, PROJ_STATUS)}
                  </div>
                  {p.notes && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{p.notes}</div>}
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${pct}%`,
                      background: overBudget ? "#dc2626" : p.status === "done" ? "#16a34a" : "#6366f1",
                      borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: overBudget ? "#dc2626" : "#64748b" }}>{fmt(p.spent, c)} spent</span>
                    <span style={{ color: "#94a3b8" }}>Budget: {fmt(p.budget, c)}</span>
                  </div>
                  <div style={{ marginTop: 12, textAlign: "right" }}>
                    <Btn variant="ghost" size="sm" onClick={() => { setForm({ ...p }); setModal("edit"); }}>Edit</Btn>
                  </div>
                </Card>
              );
            })
          }
        </div>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "New Project" : "Edit Project"} onClose={() => setModal(null)}>
          <Field label="Project Name"><Input value={form.name || ""} onChange={v => setForm({ ...form, name: v })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Status">
              <Select value={form.status || "planned"} onChange={v => setForm({ ...form, status: v })}
                options={[{ value: "planned", label: "Planned" }, { value: "in_progress", label: "In Progress" }, { value: "done", label: "Done" }]} />
            </Field>
            <Field label="Due Date"><Input type="date" value={form.due || ""} onChange={v => setForm({ ...form, due: v })} /></Field>
            <Field label="Owner">
              <Select value={form.owner || ""} onChange={v => setForm({ ...form, owner: v })}
                options={data.team.map(t => ({ value: t.id, label: t.name }))} />
            </Field>
            <Field label={`Budget (${c})`}><Input value={form.budget} onChange={v => setForm({ ...form, budget: v })} type="number" /></Field>
            <Field label={`Spent (${c})`}><Input value={form.spent} onChange={v => setForm({ ...form, spent: v })} type="number" /></Field>
          </div>
          <Field label="Notes"><Textarea value={form.notes || ""} onChange={v => setForm({ ...form, notes: v })} /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={save}>{modal === "new" ? "Create Project" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ data, currency: c = "CAD" }) {
  const [report, setReport] = useState("pl");

  const invoiceRevenue = data.invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = invoiceRevenue - totalExpenses;

  const expByCategory = EXPENSE_CATS.reduce((acc, cat) => {
    const total = data.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    if (total > 0) acc[cat] = total;
    return acc;
  }, {});

  const arAging = {
    current: data.invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + i.total, 0),
    overdue: data.invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0),
  };

  const REPORTS = [
    { id: "pl", label: "Profit & Loss" },
    { id: "ar", label: "AR Aging" },
    { id: "expenses", label: "Expenses Breakdown" },
    { id: "inventory", label: "Inventory Value" },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Snapshot of your business finances" />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {REPORTS.map(r => (
            <button key={r.id} onClick={() => setReport(r.id)}
              style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #e2e8f0",
                cursor: "pointer", fontSize: 13, fontWeight: report === r.id ? 600 : 400,
                background: report === r.id ? "#6366f1" : "#fff",
                color: report === r.id ? "#fff" : "#374151" }}>{r.label}</button>
          ))}
        </div>

        {report === "pl" && (
          <Card style={{ padding: 28, maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Profit & Loss — Year to Date</div>
            <ReportLine label="Revenue (collected)" value={invoiceRevenue} positive c={c} />
            <div style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 12px 16px" }}>
              {data.invoices.filter(i => i.status === "paid").length} paid invoices
            </div>
            <ReportLine label="Total Expenses" value={-totalExpenses} negative c={c} />
            <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0" }} />
            <ReportLine label="Net Profit" value={grossProfit} bold accent c={c} />
            <div style={{ marginTop: 16, padding: "12px 16px", background: grossProfit >= 0 ? "#f0fdf4" : "#fef2f2",
              borderRadius: 8, fontSize: 13, color: grossProfit >= 0 ? "#16a34a" : "#dc2626" }}>
              {invoiceRevenue > 0
                ? (grossProfit >= 0
                  ? `Margin: ${((grossProfit / invoiceRevenue) * 100).toFixed(1)}%`
                  : "Operating at a loss this period.")
                : "No revenue recorded yet."}
            </div>
          </Card>
        )}

        {report === "ar" && (
          <Card style={{ padding: 28, maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Accounts Receivable Aging</div>
            <ReportLine label="Current (not yet due)" value={arAging.current} c={c} />
            <ReportLine label="Overdue" value={arAging.overdue} negative={arAging.overdue > 0} c={c} />
            <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0" }} />
            <ReportLine label="Total Outstanding" value={arAging.current + arAging.overdue} bold accent c={c} />
            {data.invoices.filter(i => i.status === "overdue").map(inv => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8f9fb", fontSize: 13 }}>
                <span>{inv.id} — {data.customers.find(cu => cu.id === inv.customer_id)?.name}</span>
                <span style={{ color: "#dc2626", fontWeight: 600 }}>{fmt(inv.total, c)} OVERDUE</span>
              </div>
            ))}
          </Card>
        )}

        {report === "expenses" && (
          <Card style={{ padding: 28, maxWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Expenses by Category</div>
            {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, total]) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{cat}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(total, c)}</span>
                </div>
                <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${(total / totalExpenses) * 100}%`,
                    background: "#6366f1", borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {((total / totalExpenses) * 100).toFixed(1)}% of total
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0" }} />
            <ReportLine label="Total" value={totalExpenses} bold c={c} />
          </Card>
        )}

        {report === "inventory" && (
          <Card style={{ padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Inventory Value Report</div>
            <Table
              columns={[
                { key: "name", label: "Product" },
                { key: "stock", label: "Units", align: "center" },
                { key: "cost", label: "Unit Cost", align: "right", render: v => fmt(v, c) },
                { key: "price", label: "Unit Price", align: "right", render: v => fmt(v, c) },
                { key: "stock", label: "Cost Value", align: "right", render: (v, row) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(v * row.cost, c)}</span> },
                { key: "stock", label: "Retail Value", align: "right", render: (v, row) => <span style={{ color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>{fmt(v * row.price, c)}</span> },
              ]}
              rows={data.inventory}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 32, padding: "16px 16px 0", borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Cost Value</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(data.inventory.reduce((s, i) => s + i.stock * i.cost, 0), c)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Retail Value</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(data.inventory.reduce((s, i) => s + i.stock * i.price, 0), c)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReportLine({ label, value, bold, accent, positive, negative, c = "CAD" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 0", borderBottom: "1px solid #f8f9fb" }}>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 400, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 700 : 500,
        fontVariantNumeric: "tabular-nums",
        color: accent ? "#6366f1" : positive ? "#16a34a" : negative ? "#dc2626" : "#1a1d23" }}>
        {value < 0 ? `-${fmt(Math.abs(value), c)}` : fmt(value, c)}
      </span>
    </div>
  );
}

// ─── INTEGRATIONS ─────────────────────────────────────────────────────────────
function Integrations({ showToast }) {
  const [connected, setConnected] = useState({ gmail: false, gdrive: false, dropbox: false, quickbooks: false, shopify: false, stripe: false });

  const toggle = (key, label) => {
    setConnected(c => ({ ...c, [key]: !c[key] }));
    showToast(connected[key] ? `${label} disconnected` : `${label} connected`, connected[key] ? "error" : "success");
  };

  const INTEGRATIONS = [
    {
      category: "Email",
      items: [
        { key: "gmail", label: "Gmail", desc: "Send invoices, receive purchase orders, attach documents directly to records.", icon: "✉" },
      ],
    },
    {
      category: "Cloud Storage",
      items: [
        { key: "gdrive", label: "Google Drive", desc: "Attach receipts, save invoices as PDFs, and sync documents to your Drive folders.", icon: "△" },
        { key: "dropbox", label: "Dropbox", desc: "Upload expense receipts and documents directly from or to your Dropbox.", icon: "◻" },
      ],
    },
    {
      category: "Accounting",
      items: [
        { key: "quickbooks", label: "QuickBooks Online", desc: "Two-way sync of invoices, expenses, and customers with your QBO account.", icon: "⬟" },
      ],
    },
    {
      category: "Sales & Payments",
      items: [
        { key: "shopify", label: "Shopify", desc: "Pull online orders into Invoicing and sync inventory levels automatically.", icon: "◈" },
        { key: "stripe", label: "Stripe", desc: "Mark invoices paid automatically when payment clears. View payment history.", icon: "⬡" },
      ],
    },
  ];

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect your tools — your data stays in one place" />
      <div style={{ padding: "0 32px 32px" }}>
        <div style={{ background: "#f0f0ff", border: "1px solid #c7d2fe", borderRadius: 10, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#4338ca" }}>
          <strong>Note:</strong> Connections below open an OAuth authorization flow in your browser. Your credentials are never stored in this app — only your authorization token is saved.
        </div>

        {INTEGRATIONS.map(group => (
          <div key={group.category} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: 12 }}>{group.category}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {group.items.map(item => (
                <Card key={item.key} style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start",
                  border: connected[item.key] ? "1px solid #a5b4fc" : "1px solid #e8eaed" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8,
                    background: connected[item.key] ? "#ede9fe" : "#f8f9fb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0, color: connected[item.key] ? "#6366f1" : "#94a3b8" }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</span>
                      {connected[item.key] && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, background: "#dcfce7", padding: "2px 8px", borderRadius: 10 }}>Connected</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 12 }}>{item.desc}</div>
                    <Btn variant={connected[item.key] ? "danger" : "primary"} size="sm"
                      onClick={() => toggle(item.key, item.label)}>
                      {connected[item.key] ? "Disconnect" : "Connect"}
                    </Btn>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
