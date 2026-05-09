import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { documentService } from '@/services/documentService';
import { movementService } from '@/services/movementService';
import { ConsignmentEntry, DocumentAttachment } from '@/types';
import {
  Download,
  File,
  History,
  Loader2,
  Paperclip,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';

const categories = ['Document', 'Image', 'Spreadsheet', 'Archive', 'Other'];
const tags = ['Invoice', 'Contract', 'Report', 'Certificate', 'Manual', 'Other'];
const referenceTypes: DocumentAttachment['referenceType'][] = [
  'General',
  'Item',
  'Order',
  'Invoice',
  'CustomerStock',
];

const DocumentVersionsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState<DocumentAttachment[]>([]);
  const [customerStock, setCustomerStock] = useState<ConsignmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [referenceType, setReferenceType] =
    useState<DocumentAttachment['referenceType']>('General');
  const [referenceId, setReferenceId] = useState('');
  const [category, setCategory] = useState('Document');
  const [tag, setTag] = useState('Other');
  const [notes, setNotes] = useState('');
  const [versionFileById, setVersionFileById] = useState<Record<string, File | null>>({});

  const selectedCustomerStock = customerStock.find((entry) => entry.id === referenceId);

  useEffect(() => {
    const refType = searchParams.get('referenceType') as DocumentAttachment['referenceType'] | null;
    const refId = searchParams.get('referenceId') || '';

    if (refType && referenceTypes.includes(refType)) {
      setReferenceType(refType);
      setReferenceId(refId);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    const [attachments, consignments] = await Promise.all([
      documentService.getAttachments({ limit: 200 }),
      movementService.getConsignmentEntries(),
    ]);
    setFiles(attachments);
    setCustomerStock(consignments);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return files.filter((file) => {
      const matchesSearch =
        !term ||
        file.fileName.toLowerCase().includes(term) ||
        file.referenceLabel?.toLowerCase().includes(term) ||
        file.referenceType.toLowerCase().includes(term);
      const matchesReference = referenceType === 'General' ? true : file.referenceType === referenceType;
      const matchesReferenceId = !referenceId || file.referenceId === referenceId;
      return matchesSearch && matchesReference && matchesReferenceId;
    });
  }, [files, referenceId, referenceType, search]);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please choose a file to upload.');
      return;
    }

    if (referenceType === 'CustomerStock' && !referenceId) {
      alert('Please select the customer stock record this document belongs to.');
      return;
    }

    setUploading(true);
    try {
      await documentService.uploadAttachment(selectedFile, {
        name: selectedFile.name,
        category,
        tag,
        notes,
        uploadedBy: 'Admin User',
        referenceType,
        referenceId: referenceType === 'CustomerStock' ? referenceId : '',
        referenceLabel:
          referenceType === 'CustomerStock' && selectedCustomerStock
            ? `${selectedCustomerStock.reference} / ${selectedCustomerStock.partyName}`
            : '',
      });
      setSelectedFile(null);
      setNotes('');
      await loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleVersionUpload = async (attachmentId: string) => {
    const file = versionFileById[attachmentId];
    if (!file) {
      alert('Choose a file for the new version first.');
      return;
    }

    setUploading(true);
    try {
      await documentService.uploadAttachmentVersion(attachmentId, file, {
        uploadedBy: 'Admin User',
        notes: `New version uploaded from document control`,
      });
      setVersionFileById((current) => ({ ...current, [attachmentId]: null }));
      await loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Version upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete file?')) {
      await documentService.deleteAttachment(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Paperclip className="text-slate-600" size={20} /> Attachments & Version Control
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload documents, track versions, and link files to customer stock movements.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="xl:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                File
              </span>
              <input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tag
              </span>
              <select
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {tags.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Link To
              </span>
              <select
                value={referenceType}
                onChange={(event) => {
                  setReferenceType(event.target.value as DocumentAttachment['referenceType']);
                  setReferenceId('');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {referenceTypes.map((value) => (
                  <option key={value} value={value}>
                    {value === 'CustomerStock' ? 'Customer Stock' : value}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Upload
            </button>
          </div>

          {referenceType === 'CustomerStock' && referenceId && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-800">
                Showing documents linked to this customer stock movement.
              </p>
              <button
                type="button"
                onClick={() => navigate('/customer/cs-consign')}
                className="rounded bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-100"
              >
                Open Customer Stock
              </button>
            </div>
          )}

          {referenceType === 'CustomerStock' && (
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Customer Stock Record
              </span>
              <select
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select customer stock movement</option>
                {customerStock.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.reference} / {entry.partyName} / {entry.itemName} / {entry.type}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Notes
            </span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for this upload"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-3 py-8 text-center">
              <Loader2 className="inline animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-slate-500">No files uploaded.</div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-slate-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="rounded-lg bg-slate-100 p-3">
                    <File className="text-slate-500" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-slate-800">{file.fileName}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.size} / v{file.version}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      By {file.uploadedBy} on {file.uploadDate}
                    </p>
                    {file.referenceType !== 'General' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (file.referenceType === 'CustomerStock' && file.referenceId) {
                            setReferenceType('CustomerStock');
                            setReferenceId(file.referenceId);
                            setSearchParams({
                              referenceType: 'CustomerStock',
                              referenceId: file.referenceId,
                            });
                          }
                        }}
                        className="mt-2 rounded bg-blue-50 px-2 py-1 text-left text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        {file.referenceType === 'CustomerStock' ? 'Customer Stock' : file.referenceType}
                        {file.referenceLabel ? ` / ${file.referenceLabel}` : ''}
                      </button>
                    )}
                  </div>
                  <button onClick={() => handleDelete(file.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Download size={13} /> Open
                    </a>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                    <History size={13} /> New Version
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setVersionFileById((current) => ({
                          ...current,
                          [file.id]: event.target.files?.[0] || null,
                        }))
                      }
                    />
                  </label>
                  {versionFileById[file.id] && (
                    <button
                      onClick={() => handleVersionUpload(file.id)}
                      disabled={uploading}
                      className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Upload v{file.version + 1}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVersionsView;
