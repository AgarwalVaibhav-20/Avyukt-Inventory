import { useState, useEffect, type ChangeEvent, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, UserX, UserPlus, Search, Plus, Upload, Download,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter,
  Edit2, Trash2, Eye, X, Check, Building2, Phone, Mail, CreditCard,
  MapPin, StickyNote, AlertCircle,
  FileText, Wallet, Globe,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createCustomer,
  deleteCustomer as deleteCustomerRecord,
  fetchCustomers,
} from "@/store/slices/customerSlice";
import { fetchWarehouses } from "@/store/slices/warehouseSlice";
import type {
  CustomerRecord,
  CustomerStatus,
  CustomerType,
} from "@/services/customerService";
import ConfirmDeleteModal from "../common/ConfirmDeleteModal";

type Customer = CustomerRecord;

interface CustomerForm {
  name: string;
  code: string;
  phone: string;
  email: string;
  gst: string;
  pan: string;
  billing: string;
  shipping: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  creditLimit: string;
  paymentTerms: string;
  salesPerson: string;
  warehouse: string;
}

const STATES = ["Andhra Pradesh","Delhi","Gujarat","Karnataka","Kerala","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal"];
const CUSTOMER_TYPES = ["Retail","Wholesale","Distributor","Corporate"];
const PAYMENT_TERMS = ["Immediate","Net 15","Net 30","Net 45","Net 60","Net 90"];
const SALES_PERSONS = ["Amit Sharma","Priya Patel","Rohit Singh","Sunita Rao"];

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
const getCustomerHue = (id: string) =>
  Array.from(id || "0").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

// ── Badges ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CustomerStatus }) {
  return status === "Active"
    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
    : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Inactive</span>;
}

// ── Floating label input ─────────────────────────────────────────────
function TypeBadge({ type }: { type: CustomerType }) {
  const map: Record<CustomerType, string> = {
    Wholesale: "bg-blue-50 text-blue-700 border-blue-200",
    Retail: "bg-purple-50 text-purple-700 border-purple-200",
    Distributor: "bg-amber-50 text-amber-700 border-amber-200",
    Corporate: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[type] || map.Retail}`}>{type}</span>;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

// ── Floating label input ─────────────────────────────────────────────
function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: LucideIcon;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  return (
    <div className="relative">
      <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
        error ? "border-red-400 bg-red-50" :
        focused ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" :
        "border-gray-200 bg-white hover:border-gray-300"
      }`}>
        {Icon && <Icon size={15} className={`ml-3 flex-shrink-0 transition-colors ${focused ? "text-blue-500" : "text-gray-400"}`} />}
        <input
          type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-3 py-3 pt-5 text-sm text-gray-800 outline-none placeholder-transparent"
          placeholder={label}
        />
        <label className={`pointer-events-none absolute transition-all duration-200 ${Icon ? "left-9" : "left-3"} ${
          focused || hasValue ? "top-1.5 text-[10px] font-bold tracking-wide text-blue-500" : "top-3.5 text-sm text-gray-400"
        }`}>{label}{required && " *"}</label>
      </div>
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

function FloatingSelect({
  label,
  options,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  icon?: LucideIcon;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
        focused ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-gray-200 bg-white hover:border-gray-300"
      }`}>
        {Icon && <Icon size={15} className={`ml-3 flex-shrink-0 ${focused ? "text-blue-500" : "text-gray-400"}`} />}
        <select value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-3 py-3 pt-5 text-sm text-gray-800 outline-none appearance-none cursor-pointer">
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <label className={`pointer-events-none absolute transition-all duration-200 ${Icon ? "left-9" : "left-3"} ${
          value ? "top-1.5 text-[10px] font-bold tracking-wide text-blue-500" : "top-3.5 text-sm text-gray-400"
        }`}>{label}</label>
        <ChevronDown size={14} className="mr-3 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}

function FloatingSearchSelect({
  label,
  options,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
}) {
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
        focused ? "border-blue-500 bg-blue-50/50 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-gray-200 bg-white hover:border-gray-300"
      }`}>
        {Icon && <Icon size={15} className={`ml-3 flex-shrink-0 ${focused ? "text-blue-500" : "text-gray-400"}`} />}
        <input
          type="text"
          value={focused ? search : value}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setSearch(""); }}
          placeholder={label}
          className="w-full bg-transparent px-3 py-3 pt-5 text-sm text-gray-800 outline-none placeholder-transparent"
        />
        <label className={`pointer-events-none absolute transition-all duration-200 ${Icon ? "left-9" : "left-3"} ${
          value || search ? "top-1.5 text-[10px] font-bold tracking-wide text-blue-500" : "top-3.5 text-sm text-gray-400"
        }`}>{label}</label>
        <ChevronDown size={14} className="mr-3 text-gray-400 flex-shrink-0" />
      </div>
      {focused && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border-2 border-blue-500 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(o => (
              <div
                key={o}
                onClick={() => {
                  onChange(o);
                  setSearch("");
                  setFocused(false);
                }}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === o
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
              >
                {o}
              </div>
            ))
          ) : (
            <div className="px-3 py-2.5 text-sm text-gray-400">No warehouses found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Customer Modal ───────────────────────────────────────────────
function AddCustomerModal({
  open,
  onClose,
  onSave,
  warehouses = [],
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: CustomerForm) => void;
  warehouses?: string[];
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:"",code:"",phone:"",email:"",gst:"",pan:"",billing:"",shipping:"",city:"",state:"",pincode:"",type:"",creditLimit:"",paymentTerms:"",salesPerson:"",warehouse:"" });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});
  const set = (k: keyof CustomerForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const sections = [
    { title: "Basic Info", subtitle: "Core customer details" },
    { title: "Address", subtitle: "Location & contact" },
    { title: "Business", subtitle: "Credit & preferences" },
  ];

  const validate = () => {
    const e: Partial<Record<keyof CustomerForm, string>> = {};
    if (!form.name) e.name = "Customer name is required";
    if (!form.phone) e.phone = "Phone number is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (step === 0 && !validate()) return; setStep(s => Math.min(s+1,2)); };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{scale:0.95,opacity:0,y:16}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.95,opacity:0,y:16}}
          className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.15)" }}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New Customer</h2>
              <p className="text-xs text-gray-400 mt-0.5">{sections[step].subtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X size={18}/></button>
          </div>

          {/* Steps */}
          <div className="px-6 py-4 flex gap-3 flex-shrink-0 bg-gray-50/60">
            {sections.map((s,i) => (
              <div key={i} className="flex-1 flex flex-col gap-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${i < step ? "bg-blue-500" : i === step ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${i < step ? "bg-blue-500 text-white" : i === step ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {i < step ? <Check size={9}/> : i+1}
                  </div>
                  <span className={`text-[11px] font-semibold ${i === step ? "text-blue-600" : i < step ? "text-blue-500" : "text-gray-400"}`}>{s.title}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:0.18}}>
                {step === 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><FloatingInput label="Customer Name" value={form.name} onChange={set("name")} error={errors.name} icon={Building2} required /></div>
                    <FloatingInput label="Customer Code" value={form.code} onChange={set("code")} icon={FileText} />
                    <FloatingInput label="Phone Number" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} icon={Phone} required />
                    <div className="sm:col-span-2"><FloatingInput label="Email Address" type="email" value={form.email} onChange={set("email")} error={errors.email} icon={Mail} /></div>
                    <FloatingInput label="GST Number" value={form.gst} onChange={set("gst")} icon={Globe} />
                    <FloatingInput label="PAN Number" value={form.pan} onChange={set("pan")} icon={CreditCard} />
                  </div>
                )}
                {step === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><FloatingInput label="Billing Address" value={form.billing} onChange={set("billing")} icon={MapPin} /></div>
                    <div className="sm:col-span-2"><FloatingInput label="Shipping Address" value={form.shipping} onChange={set("shipping")} icon={MapPin} /></div>
                    <FloatingInput label="City" value={form.city} onChange={set("city")} />
                    <FloatingSelect label="State" options={STATES} value={form.state} onChange={set("state")} />
                    <FloatingInput label="Pincode" value={form.pincode} onChange={set("pincode")} />
                  </div>
                )}
                {step === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingSelect label="Customer Type" options={CUSTOMER_TYPES} value={form.type} onChange={set("type")} />
                    <FloatingInput label="Credit Limit (₹)" type="number" value={form.creditLimit} onChange={set("creditLimit")} icon={CreditCard} />
                    <FloatingSelect label="Payment Terms" options={PAYMENT_TERMS} value={form.paymentTerms} onChange={set("paymentTerms")} />
                    <FloatingSelect label="Sales Person" options={SALES_PERSONS} value={form.salesPerson} onChange={set("salesPerson")} />
                    <div className="sm:col-span-2"><FloatingSearchSelect label="Preferred Warehouse" options={warehouses} value={form.warehouse} onChange={(val) => setForm(f => ({...f, warehouse: val}))} icon={Building2} /></div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/40">
            <button onClick={() => step === 0 ? onClose() : setStep(s=>s-1)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
              {step === 0 ? "Cancel" : "← Back"}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Step {step+1} of 3</span>
              <button onClick={step === 2 ? () => { onSave(form); onClose(); } : handleNext}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: "linear-gradient(135deg,#2563eb,#0ea5e9)", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
                {step === 2 ? "Save Customer" : "Next →"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Customer Profile Panel ───────────────────────────────────────────
function CustomerProfile({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const location = [customer.city, customer.state].filter(Boolean).join(", ");
  const detailRows = [
    { label: "Mobile", value: customer.mobile, icon: Phone },
    { label: "Email", value: customer.email, icon: Mail },
    { label: "GST Number", value: customer.gst, icon: Globe },
    { label: "PAN Number", value: customer.pan, icon: CreditCard },
    { label: "Payment Terms", value: customer.paymentTerms, icon: Wallet },
    { label: "Sales Person", value: customer.salesPerson, icon: UserCheck },
    { label: "Preferred Warehouse", value: customer.warehouse, icon: Building2 },
  ].filter((row) => row.value);
  const addressRows = [
    { label: "Billing Address", value: customer.billing },
    { label: "Shipping Address", value: customer.shipping },
    { label: "Location", value: [location, customer.pincode].filter(Boolean).join(" - ") },
  ].filter((row) => row.value);
  const txns: Array<{ date: string; inv: string; amount: number; type: string; status: string }> = [];

  return (
    <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white overflow-y-auto shadow-2xl"
      style={{ borderLeft: "1px solid #e5e7eb" }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: `hsl(${getCustomerHue(customer.id)},60%,50%)` }}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{customer.name}</h3>
              <p className="text-xs text-gray-400">{customer.code} · {customer.city}, {customer.state}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label:"Credit Limit", value:`₹${fmt(customer.creditLimit)}`, color:"text-blue-600", bg:"bg-blue-50 border-blue-100" },
            { label:"Outstanding", value:`₹${fmt(customer.outstanding)}`, color:"text-amber-600", bg:"bg-amber-50 border-amber-100" },
            { label:"Type", value:customer.type, color:"text-purple-600", bg:"bg-purple-50 border-purple-100" },
            { label:"Status", value:customer.status, color:customer.status==="Active"?"text-emerald-600":"text-red-600", bg:customer.status==="Active"?"bg-emerald-50 border-emerald-100":"bg-red-50 border-red-100" },
          ].map((s,i) => (
            <div key={i} className={`rounded-xl p-3 border ${s.bg}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">{s.label}</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">Customer Details</h4>
            <Building2 size={14} className="text-gray-400"/>
          </div>
          {detailRows.length > 0 ? (
            detailRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-b-0">
                  <Icon size={14} className="text-gray-400 flex-shrink-0"/>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{row.value}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-sm text-gray-400">No extra customer details saved yet.</div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">Address</h4>
            <MapPin size={14} className="text-gray-400"/>
          </div>
          {addressRows.length > 0 ? (
            addressRows.map((row) => (
              <div key={row.label} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{row.label}</p>
                <p className="text-sm font-semibold text-gray-800">{row.value}</p>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-gray-400">No address saved yet.</div>
          )}
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">Recent Transactions</h4>
            <FileText size={14} className="text-gray-400"/>
          </div>
          {txns.map((t,i) => (
            <div key={i} className={`px-4 py-3 flex items-center justify-between ${i<txns.length-1?"border-b border-gray-50":""} hover:bg-gray-50 transition-colors`}>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t.inv}</p>
                <p className="text-xs text-gray-400">{t.date} · {t.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">₹{fmt(t.amount)}</p>
                <span className={`text-[10px] font-semibold ${t.status==="Paid"?"text-emerald-600":"text-amber-600"}`}>{t.status}</span>
              </div>
            </div>
          ))}
          {txns.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
                <FileText size={16} className="text-gray-300"/>
              </div>
              <p className="text-sm font-semibold text-gray-500">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">Invoices and credit notes will appear here after they are linked to this customer.</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={14} className="text-gray-400"/>
            <h4 className="text-sm font-bold text-gray-800">Notes</h4>
          </div>
          <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-blue-400 resize-none transition-colors bg-gray-50" rows={3} placeholder="Add a note about this customer…"/>
          <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Save Note</button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
export default function CustomerPage() {
  const dispatch = useAppDispatch();
  const { customers, loading, error } = useAppSelector((state) => state.customers);
  const { warehouses } = useAppSelector((state) => state.warehouse);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<keyof Customer>("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const PER_PAGE = 5;

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (error) showNotification(error, "error");
  }, [error]);

  const showNotification = (msg: string, type = "success") => {
    setNotification({msg,type}); setTimeout(() => setNotification(null), 3000);
  };

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      return (c.name.toLowerCase().includes(q)||c.code.toLowerCase().includes(q)||c.email.toLowerCase().includes(q)||c.mobile.includes(q)) &&
        (filterType==="All"||c.type===filterType) && (filterStatus==="All"||c.status===filterStatus);
    })
    .sort((a,b) => {
      const av=a[sortCol], bv=b[sortCol];
      const cmp = typeof av==="number" && typeof bv==="number" ? av-bv : String(av).localeCompare(String(bv));
      return sortDir==="asc" ? cmp : -cmp;
    });

  const pages = Math.ceil(filtered.length/PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const now = new Date();
  const stats = [
    { label: "Total Customers", value: fmt(customers.length), icon: Users, color: "#2563eb", bg: "#eff6ff" },
    { label: "Active Customers", value: fmt(customers.filter((customer) => customer.status === "Active").length), icon: UserCheck, color: "#10b981", bg: "#f0fdf4" },
    { label: "Inactive", value: fmt(customers.filter((customer) => customer.status === "Inactive").length), icon: UserX, color: "#ef4444", bg: "#fef2f2" },
    { label: "Outstanding", value: formatCurrency(customers.reduce((total, customer) => total + customer.outstanding, 0)), icon: Wallet, color: "#f59e0b", bg: "#fffbeb" },
    {
      label: "New This Month",
      value: fmt(customers.filter((customer) => {
        if (!customer.createdAt) return false;
        const createdAt = new Date(customer.createdAt);
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }).length),
      icon: UserPlus,
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
  ];
  const sort = (col: keyof Customer) => { if(sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortCol(col);setSortDir("asc");} };
  const toggleRow = (id: string) => setSelectedRows(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll = () => setSelectedRows(s=>s.size===paged.length?new Set<string>():new Set(paged.map(c=>c.id)));
  const WAREHOUSES = useMemo(() => warehouses.map((w) => w.name).filter(Boolean), [warehouses]);

  const deleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    try {
      await dispatch(deleteCustomerRecord(customerToDelete.id)).unwrap();
      showNotification("Customer deleted");
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (err: any) {
      showNotification(String(err || "Failed to delete customer"), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const addCustomer = async (form: CustomerForm) => {
    try {
      await dispatch(createCustomer(form)).unwrap();
      showNotification("Customer added successfully!");
    } catch (err: any) {
      showNotification(String(err || "Failed to add customer"), "error");
    }
  };

  const SortIcon = ({col}: { col: keyof Customer }) => sortCol!==col ? <ChevronDown size={12} className="text-gray-300"/> : sortDir==="asc" ? <ChevronUp size={12} className="text-blue-500"/> : <ChevronDown size={12} className="text-blue-500"/>;
  const TH = ({label,col}: { label: string; col: keyof Customer }) => (
    <th className="px-4 py-3.5 text-left cursor-pointer select-none group" onClick={()=>sort(col)}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
        <SortIcon col={col}/>
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-white" style={{fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
      `}</style>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-sm text-gray-400 mt-1">{customers.length} total customers · Manage your customer base</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all">
              <Upload size={15}/>Import
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all">
              <Download size={15}/>Export
            </button> */}
            <button onClick={()=>setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-px"
              style={{background:"linear-gradient(135deg,#2563eb,#0ea5e9)",boxShadow:"0 4px 12px rgba(37,99,235,0.3)"}}>
              <Plus size={16}/>Add Customer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading
            ? Array(5).fill(0).map((_,i)=><Skeleton key={i} className="h-28"/>)
            : stats.map((s,i)=>(
              <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                className="rounded-2xl p-4 border-2 border-transparent hover:border-gray-100 transition-all cursor-pointer group"
                style={{background:s.bg, boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-white shadow-sm">
                    <s.icon size={16} style={{color:s.color}}/>
                  </div>
                </div>
                <p className="text-xl font-extrabold text-gray-900 mb-0.5">{s.value}</p>
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
              </motion.div>
            ))}
        </div>

        {/* Table card */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>

          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-800 text-sm">Customer List</h2>
              {selectedRows.size>0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200">
                  {selectedRows.size} selected
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">{filtered.length}</span>
            </div>
            <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
              <div className="md:hidden relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-gray-400"/>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search…"
                  className="pl-8 pr-3 py-2 rounded-xl text-xs border-2 border-gray-100 text-gray-700 outline-none focus:border-blue-400"/>
              </div>
              <select value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(1);}}
                className="px-3 py-2 rounded-xl text-xs border-2 border-gray-100 text-gray-600 outline-none cursor-pointer font-medium bg-white hover:border-gray-200 transition-colors">
                <option value="All">All Types</option>
                {CUSTOMER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}
                className="px-3 py-2 rounded-xl text-xs border-2 border-gray-100 text-gray-600 outline-none cursor-pointer font-medium bg-white hover:border-gray-200 transition-colors">
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="p-2 rounded-xl border-2 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors bg-white">
                <Filter size={14}/>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-4 py-3.5 w-10">
                    <input type="checkbox" checked={selectedRows.size===paged.length&&paged.length>0} onChange={toggleAll}
                      className="w-4 h-4 rounded accent-blue-500 cursor-pointer"/>
                  </th>
                  <TH label="Customer" col="name"/>
                  <TH label="Code" col="code"/>
                  <th className="px-4 py-3.5 text-left"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mobile</span></th>
                  <th className="px-4 py-3.5 text-left"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</span></th>
                  <TH label="Type" col="type"/>
                  <TH label="Credit Limit" col="creditLimit"/>
                  <TH label="Outstanding" col="outstanding"/>
                  <TH label="Status" col="status"/>
                  <th className="px-4 py-3.5 text-center"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(5).fill(0).map((_,i)=>(
                    <tr key={i} className="border-b border-gray-50">
                      {Array(10).fill(0).map((_,j)=>(
                        <td key={j} className="px-4 py-3.5"><Skeleton className="h-5 w-full"/></td>
                      ))}
                    </tr>
                  ))
                  : paged.length===0
                    ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                              <Users size={26} className="text-gray-300"/>
                            </div>
                            <p className="font-semibold text-gray-500 mb-1">No customers found</p>
                            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )
                    : paged.map((c,i)=>(
                      <motion.tr key={c.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
                        className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${selectedRows.has(c.id)?"bg-blue-50/50":""}`}>
                        <td className="px-4 py-3.5">
                          <input type="checkbox" checked={selectedRows.has(c.id)} onChange={()=>toggleRow(c.id)}
                            className="w-4 h-4 rounded accent-blue-500 cursor-pointer"/>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{background:`hsl(${getCustomerHue(c.id)},55%,55%)`}}>
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{c.name}</p>
                              <p className="text-xs text-gray-400">{c.city}, {c.state}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">{c.code}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{c.mobile}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[160px] truncate">{c.email}</td>
                        <td className="px-4 py-3.5"><TypeBadge type={c.type}/></td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap">₹{fmt(c.creditLimit)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-semibold ${c.outstanding>0?"text-amber-600":"text-gray-300"}`}>
                            {c.outstanding>0?`₹${fmt(c.outstanding)}`:"—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={c.status}/></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={()=>setProfileCustomer(c)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors" title="View">
                              <Eye size={15}/>
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                              <Edit2 size={15}/>
                            </button>
                            <button onClick={()=>deleteCustomer(c)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40">
            <p className="text-xs text-gray-400 font-medium">
              Showing {Math.min((page-1)*PER_PAGE+1,filtered.length)}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 transition-all">
                <ChevronLeft size={16}/>
              </button>
              {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page===p?"text-white shadow-sm":"text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200"}`}
                  style={page===p?{background:"linear-gradient(135deg,#2563eb,#0ea5e9)"}:{}}>
                  {p}
                </button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages||pages===0}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-200 transition-all">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Modals */}
      <AddCustomerModal open={modalOpen} onClose={()=>setModalOpen(false)} onSave={addCustomer} warehouses={WAREHOUSES}/>
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        itemName={customerToDelete?.name}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
      />

      <AnimatePresence>
        {profileCustomer && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={()=>setProfileCustomer(null)}/>
            <CustomerProfile customer={profileCustomer} onClose={()=>setProfileCustomer(null)}/>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{opacity:0,y:40,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:40,scale:0.95}}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-white shadow-xl"
            style={{background:notification.type==="success"?"linear-gradient(135deg,#10b981,#0d9488)":"linear-gradient(135deg,#ef4444,#dc2626)",boxShadow:"0 10px 30px rgba(0,0,0,0.15)"}}>
            <Check size={15}/>{notification.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
