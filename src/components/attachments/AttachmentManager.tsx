import React, { useState, useEffect } from 'react';
import { 
  Paperclip, FileText, Image as ImageIcon, 
  FileSpreadsheet, Download, Plus 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { dataService } from '../../services/dataService';
import { Attachment, AttachmentType } from '../../types/database';
import { formatDate, sanitizeUrl } from '../../lib/utils';

interface AttachmentManagerProps {
  projectId: string;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ projectId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<AttachmentType>('pdf');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    const update = () => setAttachments(dataService.getAttachments(projectId));
    update();
    return dataService.subscribe(update);
  }, [projectId]);

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    dataService.addAttachment({
      project_id: projectId,
      name: fileName.trim(),
      file_type: fileType,
      size_bytes: Math.floor(Math.random() * 4000000) + 500000,
      url: fileUrl.trim() || '#',
    });

    setFileName('');
    setFileUrl('');
    setShowUpload(false);
  };

  const getFileIcon = (type: AttachmentType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'sheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className="p-5 space-y-4 bg-vault-card border-vault-border">
      <div className="flex items-center justify-between pb-3 border-b border-vault-border">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-vault-textPrimary">Project Attachments</h3>
          <span className="text-xs text-vault-textMuted font-semibold">({attachments.length})</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUpload(!showUpload)}
          className="text-emerald-500 hover:text-emerald-400"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Upload
        </Button>
      </div>

      {showUpload && (
        <form onSubmit={handleAddAttachment} className="p-3 bg-vault-cardHover rounded-xl border border-vault-border space-y-2.5">
          <input
            type="text"
            placeholder="File name (e.g. Design_System_v2.pdf)..."
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            autoFocus
            className="w-full bg-vault-card border border-vault-border rounded-lg px-3 py-1.5 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as AttachmentType)}
              className="bg-vault-card border border-vault-border rounded-lg px-2.5 py-1 text-xs text-vault-textPrimary"
            >
              <option value="pdf">PDF Document</option>
              <option value="image">Image Asset</option>
              <option value="sheet">Spreadsheet</option>
              <option value="doc">Text Document</option>
            </select>
            <input
              type="text"
              placeholder="Optional URL..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="flex-1 bg-vault-card border border-vault-border rounded-lg px-3 py-1 text-xs text-vault-textPrimary focus:outline-none focus:border-emerald-500"
            />
            <Button variant="primary" size="sm" type="submit">
              Save
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="p-3 rounded-xl bg-vault-cardHover border border-vault-border hover:border-vault-borderLight transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-vault-card border border-vault-border shrink-0">
                {getFileIcon(att.file_type)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-vault-textPrimary truncate" title={att.name}>
                  {att.name}
                </p>
                <p className="text-[10px] text-vault-textMuted mt-0.5">
                  {formatSize(att.size_bytes)} • {formatDate(att.created_at)}
                </p>
              </div>
            </div>

            <a
              href={sanitizeUrl(att.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-vault-textMuted hover:text-emerald-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
              title="Download / View"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
};
