import React, { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { DocumentAttachment } from '../types';
import { Paperclip, Upload, Trash2, File, Loader2 } from 'lucide-react';

const DocumentVersionsView: React.FC = () => {
  const [files, setFiles] = useState<DocumentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await documentService.getAttachments();
    setFiles(data);
    setLoading(false);
  };

  const handleUpload = async () => {
      // Simulation
      setUploading(true);
      await documentService.uploadAttachment({
          fileName: `Document_${Date.now()}.pdf`,
          fileType: 'pdf',
          size: '1.2 MB',
          uploadedBy: 'Admin User',
          referenceType: 'General',
          version: 1
      });
      setUploading(false);
      loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete file?')) {
          await documentService.deleteAttachment(id);
          loadData();
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Paperclip className="text-slate-600" size={20}/> Attachments & Version Control
                </h2>
                <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 text-sm font-medium flex gap-2 items-center"
                >
                    {uploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>} Upload Document
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-3 text-center py-8"><Loader2 className="animate-spin inline"/></div> :
                 files.length === 0 ? <div className="col-span-3 text-center text-slate-500 py-8">No files uploaded.</div> :
                 files.map(file => (
                    <div key={file.id} className="border border-slate-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <File className="text-slate-500" size={24}/>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{file.fileName}</h4>
                            <p className="text-xs text-slate-500 mt-1">{file.size} • v{file.version}</p>
                            <p className="text-xs text-slate-400 mt-1">By {file.uploadedBy} on {file.uploadDate}</p>
                        </div>
                        <button onClick={() => handleDelete(file.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default DocumentVersionsView;
