import { FileX } from 'lucide-react';

export default function EmptyState({ icon: Icon = FileX, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="p-4 bg-slate-100 rounded-2xl mb-4">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-600 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 text-center max-w-xs mb-4">{description}</p>
      )}
      {action && action}
    </div>
  );
}
