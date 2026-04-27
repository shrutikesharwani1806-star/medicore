import { useState } from 'react';
import { Upload, FileText, Sparkles, X, Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer?.files || []);
    addFiles(dropped);
  };

  const handleFileInput = (e) => {
    addFiles(Array.from(e.target.files || []));
  };

  const addFiles = (newFiles) => {
    const formatted = newFiles.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
    }));
    setFiles((prev) => [...prev, ...formatted]);
    toast.success(`${newFiles.length} file(s) added`);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowSummary(true);
      toast.success('AI analysis complete!');
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Medical Reports</h1>
        <p className="text-sm text-slate-500">Upload and analyze your medical reports with AI</p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 animate-slide-up
          ${dragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-white hover:border-primary-300'}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="mx-auto w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
          <Upload className={`w-7 h-7 text-primary-500 ${dragActive ? 'animate-bounce' : ''}`} />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">
          Drag & drop your reports here
        </p>
        <p className="text-xs text-slate-400 mb-4">PDF, JPG, PNG up to 10MB</p>
        <label className="inline-block">
          <input type="file" multiple onChange={handleFileInput} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
          <span className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 cursor-pointer transition-colors">
            Browse Files
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 animate-slide-up">
          <h3 className="text-sm font-semibold text-slate-700">Uploaded Files ({files.length})</h3>
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{file.size}</p>
              </div>
              <button onClick={() => removeFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button onClick={handleAnalyze} loading={analyzing} icon={Sparkles} className="w-full">
            Analyze with AI
          </Button>
        </div>
      )}

      {/* AI Summary */}
      {showSummary && (
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-6 border border-primary-100 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-primary-800">AI Health Summary</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p><span className="font-medium">Blood Count:</span> All values within normal range. Hemoglobin at 14.2 g/dL (healthy).</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p><span className="font-medium">Cholesterol:</span> Total cholesterol at 185 mg/dL — within recommended limits.</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p><span className="font-medium">Vitamin D:</span> Slightly low at 22 ng/mL. Consider supplementation and sun exposure.</p>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p><span className="font-medium">Overall:</span> Good health status. Schedule a follow-up in 6 months.</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            ⚠️ This is a simulated AI analysis for demonstration purposes only.
          </p>
        </div>
      )}
    </div>
  );
}
