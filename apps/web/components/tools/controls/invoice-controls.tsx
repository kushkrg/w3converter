"use client";

import { useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Upload, X, Building2, User, FileText, ListOrdered, Calculator } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  theme: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  items: Omit<LineItem, "id">[];
  discount: number;
  discountType: "percent" | "fixed";
  notes: string;
  paymentTerms: string;
}

interface InvoiceControlsProps {
  onChange: (data: InvoiceFormData) => void;
  onLogoFile: (file: File | null) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: "USD", symbol: "$",  label: "USD — US Dollar" },
  { code: "EUR", symbol: "€",  label: "EUR — Euro" },
  { code: "GBP", symbol: "£",  label: "GBP — British Pound" },
  { code: "CAD", symbol: "C$", label: "CAD — Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD — Australian Dollar" },
  { code: "INR", symbol: "₹",  label: "INR — Indian Rupee" },
  { code: "JPY", symbol: "¥",  label: "JPY — Japanese Yen" },
];

const THEMES = [
  { id: "blue",   label: "Blue",   color: "#2560E4" },
  { id: "red",    label: "Red",    color: "#C01818" },
  { id: "green",  label: "Green",  color: "#118866" },
  { id: "dark",   label: "Dark",   color: "#1D1D27" },
  { id: "purple", label: "Purple", color: "#7746CB" },
];

const PAYMENT_TERMS = ["Due on Receipt", "Net 7", "Net 14", "Net 30", "Net 60", "Custom"];

const today     = new Date().toISOString().slice(0, 10);
const plus30    = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
const newItem = (): LineItem => ({ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxRate: 0 });

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, sym: string) {
  return `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60 bg-muted/30 rounded-t-xl">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={cn("grid gap-3", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1")}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InvoiceControls({ onChange, onLogoFile }: InvoiceControlsProps) {
  // Invoice settings
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [issueDate,     setIssueDate]     = useState(today);
  const [dueDate,       setDueDate]       = useState(plus30);
  const [currency,      setCurrency]      = useState("USD");
  const [theme,         setTheme]         = useState("blue");

  // Company
  const [companyName,    setCompanyName]    = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity,    setCompanyCity]    = useState("");
  const [companyEmail,   setCompanyEmail]   = useState("");
  const [companyPhone,   setCompanyPhone]   = useState("");
  const [logoFile,       setLogoFileState]  = useState<File | null>(null);
  const [logoPreview,    setLogoPreview]    = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Client
  const [clientName,    setClientName]    = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail,   setClientEmail]   = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "Service / Product", quantity: 1, unitPrice: 100, taxRate: 0 },
  ]);

  // Summary
  const [discount,     setDiscount]     = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [notes,        setNotes]        = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");

  const currObj = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]!;
  const sym = currObj.symbol;

  // Computed totals
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxTotal  = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.taxRate / 100), 0);
  const discAmt   = discountType === "percent" ? subtotal * (discount / 100) : discount;
  const total     = subtotal + taxTotal - discAmt;

  // Emit full state to parent, accepting overrides for fields updated this tick
  const emit = useCallback((overrides: Partial<InvoiceFormData> = {}) => {
    onChange({
      invoiceNumber, issueDate, dueDate,
      currency, currencySymbol: currObj.symbol,
      theme,
      companyName, companyAddress, companyCity, companyEmail, companyPhone,
      clientName, clientCompany, clientAddress, clientEmail,
      items: items.map(({ id: _id, ...rest }) => rest),
      discount, discountType,
      notes, paymentTerms,
      ...overrides,
    });
  }, [invoiceNumber, issueDate, dueDate, currency, currObj.symbol, theme,
      companyName, companyAddress, companyCity, companyEmail, companyPhone,
      clientName, clientCompany, clientAddress, clientEmail, items,
      discount, discountType, notes, paymentTerms, onChange]);

  // Item helpers
  function updateItem(id: string, field: keyof Omit<LineItem, "id">, value: string | number) {
    const updated = items.map((i) => i.id === id ? { ...i, [field]: value } : i);
    setItems(updated);
    emit({ items: updated.map(({ id: _id, ...rest }) => rest) });
  }
  function addItem() {
    const updated = [...items, newItem()];
    setItems(updated);
    emit({ items: updated.map(({ id: _id, ...rest }) => rest) });
  }
  function removeItem(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated.length ? updated : [newItem()]);
    emit({ items: (updated.length ? updated : [newItem()]).map(({ id: _id, ...rest }) => rest) });
  }

  function handleLogo(file: File | null) {
    setLogoFileState(file);
    onLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
    else { setLogoPreview(null); }
  }

  return (
    <div className="space-y-4">

      {/* ── Invoice Settings ─────────────────────────────────── */}
      <SectionCard icon={FileText} title="Invoice Settings">
        <div className="space-y-3">
          <FieldRow cols={3}>
            <Field label="Invoice Number">
              <Input value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value); emit({ invoiceNumber: e.target.value }); }} className="font-mono" placeholder="INV-001" />
            </Field>
            <Field label="Issue Date">
              <Input type="date" value={issueDate} onChange={(e) => { setIssueDate(e.target.value); emit({ issueDate: e.target.value }); }} />
            </Field>
            <Field label="Due Date">
              <Input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); emit({ dueDate: e.target.value }); }} />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Currency">
              <select
                value={currency}
                onChange={(e) => {
                  const c = CURRENCIES.find((x) => x.code === e.target.value) ?? CURRENCIES[0]!;
                  setCurrency(c.code);
                  emit({ currency: c.code, currencySymbol: c.symbol });
                }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Payment Terms">
              <select
                value={paymentTerms}
                onChange={(e) => { setPaymentTerms(e.target.value); emit({ paymentTerms: e.target.value }); }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </FieldRow>

          {/* Theme */}
          <Field label="Color Theme">
            <div className="flex gap-2 flex-wrap">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  onClick={() => { setTheme(t.id); emit({ theme: t.id }); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    theme === t.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* ── Your Business ────────────────────────────────────── */}
      <SectionCard icon={Building2} title="Your Business">
        <div className="space-y-3">
          {/* Logo upload */}
          <Field label="Company Logo (optional)">
            {logoFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                {logoPreview && <img src={logoPreview} alt="logo" className="h-8 w-auto max-w-[80px] object-contain rounded" />}
                <span className="flex-1 text-sm font-medium truncate">{logoFile.name}</span>
                <button type="button" onClick={() => handleLogo(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors px-4 py-2.5 text-sm text-muted-foreground"
              >
                <Upload className="h-4 w-4" />
                Upload logo (PNG, JPG)
              </button>
            )}
            <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0] ?? null)} />
          </Field>

          <Field label="Company Name">
            <Input value={companyName} onChange={(e) => { setCompanyName(e.target.value); emit({ companyName: e.target.value }); }} placeholder="Acme Corp" />
          </Field>
          <FieldRow>
            <Field label="Email">
              <Input type="email" value={companyEmail} onChange={(e) => { setCompanyEmail(e.target.value); emit({ companyEmail: e.target.value }); }} placeholder="hello@acme.com" />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={companyPhone} onChange={(e) => { setCompanyPhone(e.target.value); emit({ companyPhone: e.target.value }); }} placeholder="+1 234 567 890" />
            </Field>
          </FieldRow>
          <Field label="Street Address">
            <Input value={companyAddress} onChange={(e) => { setCompanyAddress(e.target.value); emit({ companyAddress: e.target.value }); }} placeholder="123 Main Street" />
          </Field>
          <Field label="City / State / ZIP">
            <Input value={companyCity} onChange={(e) => { setCompanyCity(e.target.value); emit({ companyCity: e.target.value }); }} placeholder="New York, NY 10001" />
          </Field>
        </div>
      </SectionCard>

      {/* ── Bill To ──────────────────────────────────────────── */}
      <SectionCard icon={User} title="Bill To">
        <div className="space-y-3">
          <FieldRow>
            <Field label="Client Name">
              <Input value={clientName} onChange={(e) => { setClientName(e.target.value); emit({ clientName: e.target.value }); }} placeholder="John Doe" />
            </Field>
            <Field label="Company (optional)">
              <Input value={clientCompany} onChange={(e) => { setClientCompany(e.target.value); emit({ clientCompany: e.target.value }); }} placeholder="Client Inc." />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Email">
              <Input type="email" value={clientEmail} onChange={(e) => { setClientEmail(e.target.value); emit({ clientEmail: e.target.value }); }} placeholder="client@email.com" />
            </Field>
            <Field label="Address">
              <Input value={clientAddress} onChange={(e) => { setClientAddress(e.target.value); emit({ clientAddress: e.target.value }); }} placeholder="456 Client Ave, City" />
            </Field>
          </FieldRow>
        </div>
      </SectionCard>

      {/* ── Line Items ───────────────────────────────────────── */}
      <SectionCard icon={ListOrdered} title="Line Items">
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_68px_88px_60px_36px] gap-2 px-1">
            {["Description", "Qty", "Unit Price", "Tax %", ""].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase text-muted-foreground">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {items.map((item) => {
            const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
            return (
              <div key={item.id} className="grid grid-cols-[1fr_68px_88px_60px_36px] gap-2 items-center bg-muted/20 rounded-xl border border-border/60 px-3 py-2">
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Item description"
                  className="h-8 text-sm bg-transparent border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Input
                  type="number" min="0" step="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm text-center"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{sym}</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm pl-6"
                  />
                </div>
                <Input
                  type="number" min="0" max="100" step="1"
                  value={item.taxRate}
                  onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {/* Line total hint */}
                <div className="col-span-5 text-right text-[11px] text-muted-foreground pr-10 -mt-1">
                  = {fmt(lineTotal, sym)}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="w-full border border-dashed border-border rounded-xl h-9 text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Line Item
          </Button>
        </div>
      </SectionCard>

      {/* ── Summary & Notes ──────────────────────────────────── */}
      <SectionCard icon={Calculator} title="Summary & Notes">
        <div className="space-y-4">
          {/* Discount */}
          <FieldRow>
            <Field label="Discount">
              <div className="flex gap-1.5">
                <Input
                  type="number" min="0" step="0.01"
                  value={discount}
                  onChange={(e) => { const v = parseFloat(e.target.value) || 0; setDiscount(v); emit({ discount: v }); }}
                  className="flex-1"
                  placeholder="0"
                />
                <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
                  {(["percent", "fixed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setDiscountType(t); emit({ discountType: t }); }}
                      className={cn(
                        "px-2.5 text-xs font-medium transition-colors",
                        discountType === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {t === "percent" ? "%" : sym}
                    </button>
                  ))}
                </div>
              </div>
            </Field>
            {/* Live totals preview */}
            <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal, sym)}</span></div>
              {taxTotal > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{fmt(taxTotal, sym)}</span></div>}
              {discAmt > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>- {fmt(discAmt, sym)}</span></div>}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span>{fmt(total, sym)}</span></div>
            </div>
          </FieldRow>

          <Field label="Notes / Payment Instructions">
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); emit({ notes: e.target.value }); }}
              placeholder="Thank you for your business. Please make payment within the agreed terms."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
