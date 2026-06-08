import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Eye,
  FileCog,
  Layers3,
  Loader2,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { settingsService } from '@/services/settingsService';
import { FormDefinition, FormEditorField } from '@/types';

const emptyField = (): FormEditorField => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  key: '',
  label: '',
  type: 'text',
  required: false,
  visible: true,
  section: 'General',
  placeholder: '',
  options: [],
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const FormEditorView: React.FC = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      const data = await settingsService.getFormDefinitions();
      setForms(data);
      setSelectedId((current) => current || data[0]?.id || '');
      setLoading(false);
    };

    loadForms();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const selectedForm = forms.find((form) => form.id === selectedId) || null;
    setDraft(selectedForm ? JSON.parse(JSON.stringify(selectedForm)) : null);
  }, [selectedId, forms]);

  const modules = useMemo(
    () => Array.from(new Set(forms.map((form) => form.moduleLabel))).sort(),
    [forms],
  );

  const filteredForms = useMemo(
    () =>
      forms.filter((form) => {
        const matchesSearch =
          !searchTerm ||
          form.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.moduleLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.route.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModule =
          moduleFilter === 'all' || form.moduleLabel === moduleFilter;
        const matchesStatus =
          statusFilter === 'all' || form.status === statusFilter;
        return matchesSearch && matchesModule && matchesStatus;
      }),
    [forms, searchTerm, moduleFilter, statusFilter],
  );

  const activeFormsCount = forms.filter((form) => form.status === 'Active').length;
  const totalFieldsCount = forms.reduce((sum, form) => sum + form.fields.length, 0);
  const attachmentEnabledCount = forms.filter((form) => form.allowAttachments).length;
  const approvalEnabledCount = forms.filter((form) => form.approvalRequired).length;
  const identifierPreview =
    draft?.identifierTemplate
      ? settingsService.formatIdentifierTemplate(draft.identifierTemplate, 1, new Date('2026-05-18T00:00:00'))
      : '';
  const prDatePreview =
    draft?.dateDisplayFormat
      ? settingsService.formatDisplayDate('2026-05-18T00:00:00', draft.dateDisplayFormat)
      : '';

  const updateDraft = (patch: Partial<FormDefinition>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateField = (fieldId: string, patch: Partial<FormEditorField>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.id === fieldId ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  };

  const addField = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            fields: [...current.fields, emptyField()],
          }
        : current,
    );
  };

  const removeField = (fieldId: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            fields: current.fields.filter((field) => field.id !== fieldId),
          }
        : current,
    );
  };

  const handleSave = async () => {
    if (!draft) return;

    const invalidField = draft.fields.find((field) => !field.label.trim() || !field.key.trim());
    if (invalidField) {
      alert('Every field needs both a label and a key before saving.');
      return;
    }

    setSaving(true);
    const updated = await settingsService.updateFormDefinition({
      ...draft,
      updatedBy: 'Admin User',
    });
    setForms((current) => current.map((form) => (form.id === updated.id ? updated : form)));
    setDraft(updated);
    setSaving(false);
  };

  const handleReset = async () => {
    if (!draft) return;
    setSaving(true);
    const reset = await settingsService.resetFormDefinition(draft.id);
    setForms((current) => current.map((form) => (form.id === reset.id ? reset : form)));
    setDraft(reset);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <Loader2 className="mx-auto mb-3 animate-spin-slow text-blue-600" size={28} />
        <p className="text-sm font-medium text-slate-600">Loading form registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Project Forms', value: forms.length, icon: ClipboardList, tone: 'from-blue-600 to-blue-700' },
          { label: 'Active Forms', value: activeFormsCount, icon: Eye, tone: 'from-emerald-600 to-emerald-700' },
          { label: 'Managed Fields', value: totalFieldsCount, icon: Layers3, tone: 'from-amber-600 to-amber-700' },
          { label: 'Approval Forms', value: approvalEnabledCount, icon: ShieldCheck, tone: 'from-indigo-600 to-indigo-700' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-xl bg-gradient-to-br ${card.tone} p-3 text-white shadow-lg`}>
                  <Icon size={20} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Live
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm text-slate-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <FileCog size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Form Library</h2>
                <p className="text-sm text-slate-500">Browse every form exposed in the current project menu.</p>
              </div>
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search forms, modules, routes..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">All modules</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">All status</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="max-h-[920px] space-y-3 overflow-y-auto p-4">
            {filteredForms.map((form) => {
              const isSelected = form.id === selectedId;
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedId(form.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {form.moduleLabel}
                      </p>
                      <h3 className={`mt-1 text-base font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {form.formName}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {form.status}
                    </span>
                  </div>
                  <p className={`mb-3 text-xs ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{form.route}</p>
                  <div className={`flex items-center justify-between text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    <span>{form.fields.length} fields</span>
                    <span>{formatDate(form.updatedAt)}</span>
                  </div>
                </button>
              );
            })}

            {filteredForms.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-600">No forms matched the current filters.</p>
              </div>
            )}
          </div>
        </div>

        {draft ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                      <SquarePen size={14} />
                      Form Editor Workspace
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{draft.formName}</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">{draft.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={16} />
                      Reset Defaults
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin-slow" /> : <Save size={16} />}
                      Save Form
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Module</p>
                  <p className="text-lg font-bold text-slate-900">{draft.moduleLabel}</p>
                  <p className="mt-2 text-xs text-slate-500">{draft.route}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Fields</p>
                  <p className="text-lg font-bold text-slate-900">{draft.fields.length}</p>
                  <p className="mt-2 text-xs text-slate-500">{attachmentEnabledCount} forms currently allow attachments</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Last Updated</p>
                  <p className="text-lg font-bold text-slate-900">{formatDate(draft.updatedAt)}</p>
                  <p className="mt-2 text-xs text-slate-500">Updated by {draft.updatedBy}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900">Form Configuration</h3>
                <p className="mt-1 text-sm text-slate-500">Tune metadata, layout behavior, and governance rules for the selected form.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Display Name</label>
                  <input
                    value={draft.formName}
                    onChange={(event) => updateDraft({ formName: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Status</label>
                  <select
                    value={draft.status}
                    onChange={(event) => updateDraft({ status: event.target.value as FormDefinition['status'] })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description</label>
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(event) => updateDraft({ description: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Layout</label>
                  <select
                    value={draft.layout}
                    onChange={(event) => updateDraft({ layout: event.target.value as FormDefinition['layout'] })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Single Column">Single Column</option>
                    <option value="Two Column">Two Column</option>
                    <option value="Wizard">Wizard</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Route</label>
                  <input
                    value={draft.route}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                  />
                </div>
                {draft.menuId === 'in-req' && (
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">PR Identifier Template</label>
                    <input
                      value={draft.identifierTemplate || ''}
                      onChange={(event) => updateDraft({ identifierTemplate: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500"
                      placeholder="PR-{FY_START}-{FY_END}-{SEQ:5}"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Tokens: {"{FY_START}"} {"{FY_END}"} {"{FY}"} {"{YYYY}"} {"{YY}"} {"{MM}"} {"{DD}"} {"{SEQ:5}"}
                    </p>
                    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Preview</p>
                      <p className="mt-1 font-mono text-2xl font-black text-indigo-600">{identifierPreview}</p>
                      <p className="mt-1 text-xs text-slate-500">This format will be used for new purchase requisition numbers.</p>
                    </div>
                  </div>
                )}
                {draft.menuId === 'in-req' && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">PR Date Format</label>
                    <select
                      value={draft.dateDisplayFormat || 'YYYY-MM-DD'}
                      onChange={(event) =>
                        updateDraft({
                          dateDisplayFormat: event.target.value as FormDefinition['dateDisplayFormat'],
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Date Preview</p>
                      <p className="mt-1 font-mono text-2xl font-black text-emerald-700">{prDatePreview}</p>
                      <p className="mt-1 text-xs text-slate-500">This format will be used anywhere the PR date is shown in the requisition flow.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 p-6 md:grid-cols-3">
                {[
                  {
                    label: 'Allow Attachments',
                    checked: draft.allowAttachments,
                    onChange: (checked: boolean) => updateDraft({ allowAttachments: checked }),
                  },
                  {
                    label: 'Allow Comments',
                    checked: draft.allowComments,
                    onChange: (checked: boolean) => updateDraft({ allowComments: checked }),
                  },
                  {
                    label: 'Approval Required',
                    checked: draft.approvalRequired,
                    onChange: (checked: boolean) => updateDraft({ approvalRequired: checked }),
                  },
                ].map((toggle) => (
                  <label key={toggle.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{toggle.label}</p>
                      <p className="text-xs text-slate-500">Control how this form behaves for end users.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toggle.checked}
                      onChange={(event) => toggle.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Field Builder</h3>
                  <p className="mt-1 text-sm text-slate-500">Manage labels, keys, types, and visibility for the selected form.</p>
                </div>
                <button
                  onClick={addField}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  Add Field
                </button>
              </div>

              <div className="space-y-4 p-6">
                {draft.fields.map((field, index) => (
                  <div key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                          <PencilLine size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Field {index + 1}</p>
                          <p className="text-xs text-slate-500">{field.section || 'General'} section</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Field Label</label>
                        <input
                          value={field.label}
                          onChange={(event) => updateField(field.id, { label: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Field Key</label>
                        <input
                          value={field.key}
                          onChange={(event) => updateField(field.id, { key: event.target.value.replace(/\s+/g, '_') })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Type</label>
                        <select
                          value={field.type}
                          onChange={(event) => updateField(field.id, { type: event.target.value as FormEditorField['type'] })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                          <option value="textarea">Textarea</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Section</label>
                        <input
                          value={field.section}
                          onChange={(event) => updateField(field.id, { section: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Placeholder</label>
                        <input
                          value={field.placeholder || ''}
                          onChange={(event) => updateField(field.id, { placeholder: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                        />
                      </div>
                      {field.type === 'select' && (
                        <div className="xl:col-span-3">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Options</label>
                          <input
                            value={(field.options || []).join(', ')}
                            onChange={(event) =>
                              updateField(field.id, {
                                options: event.target.value
                                  .split(',')
                                  .map((value) => value.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
                            placeholder="Comma separated options"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) => updateField(field.id, { required: event.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Required
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={field.visible}
                          onChange={(event) => updateField(field.id, { visible: event.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Visible
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">Select a form to start editing.</p>
            <p className="mt-2 text-sm text-slate-500">Choose a form from the library to manage fields, layout, and control rules.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormEditorView;
