import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Plus, Trash2, GripVertical, Info, LayoutGrid, Minimize2, Settings2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import MobileHeader from '~/components/layout/MobileHeader';
import { cn } from '~/lib/utils';

type TemplateType = 'default' | 'minimal' | 'custom';

const templates = [
  { id: 'default' as const, name: 'Default', desc: 'Full workflow with review stage', icon: LayoutGrid, columns: ['To Do', 'In Progress', 'Review', 'Done'] },
  { id: 'minimal' as const, name: 'Minimal', desc: 'Simple two-column workflow', icon: Minimize2, columns: ['To Do', 'Done'] },
  { id: 'custom' as const, name: 'Custom', desc: 'Create your own columns', icon: Settings2, columns: [] },
];

export default function BoardTemplate() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TemplateType>('default');
  const [customColumns, setCustomColumns] = useState(['To Do', 'Done']);

  const addColumn = () => {
    if (customColumns.length < 8) setCustomColumns([...customColumns, 'New Column']);
  };

  const removeColumn = (index: number) => {
    if (customColumns.length > 2) setCustomColumns(customColumns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, value: string) => {
    const updated = [...customColumns];
    updated[index] = value;
    setCustomColumns(updated);
  };

  const activeTemplate = templates.find((t) => t.id === selected);
  const previewColumns = selected === 'custom' ? customColumns : activeTemplate?.columns ?? [];

  return (
    <MobileShell>
      <MobileHeader title="Board Template" showBack backTo="/projects/new" />
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 max-w-[600px] mx-auto">
          <p className="text-sm text-[#64748B] mb-6">Choose a template to set up your board columns. You can customize columns later in Board Settings.</p>

          <div className="flex flex-col gap-4 mb-6">
            {templates.map((tpl) => {
              const isActive = selected === tpl.id;
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelected(tpl.id)}
                  className={cn(
                    'relative w-full border-2 rounded-[12px] p-4 text-left transition-all',
                    isActive ? 'bg-[#F0F7FF] border-[#4A90D9]' : 'bg-white border-[#E5E7EB] hover:border-[#94A3B8]'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', isActive ? 'bg-[#4A90D9] text-white' : 'bg-[#F1F5F9] text-[#64748B]')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#1E293B]">{tpl.name}</h4>
                        <p className="text-[11px] text-[#64748B]">{tpl.desc}</p>
                      </div>
                    </div>
                    {isActive && <Check className="w-6 h-6 text-[#4A90D9]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Editor */}
          {selected === 'custom' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#1E293B]">Custom Columns</h4>
                <span className="text-[11px] text-[#64748B]">{customColumns.length} columns</span>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {customColumns.map((col, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-[#94A3B8] cursor-grab" />
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => updateColumn(i, e.target.value)}
                      className="flex-1 h-[44px] px-3 bg-white border border-[#E5E7EB] rounded-[6px] text-sm outline-none focus:border-[#4A90D9] transition-colors"
                    />
                    <button onClick={() => removeColumn(i)} className="text-[#CBD5E1] hover:text-red-500 transition-colors p-1" aria-label={`Remove column ${col}`}>
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addColumn} className="w-full h-[44px] border border-dashed border-[#CBD5E1] rounded-[6px] bg-[#F9FAFB] text-[#64748B] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition-all">
                <Plus className="w-[18px] h-[18px]" /> Add Column
              </button>
              <p className="text-[11px] text-[#94A3B8] mt-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> You can set WIP limits in Board Settings after creation.
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="mb-[100px]">
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Preview</h4>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex gap-2.5 min-w-max">
                {previewColumns.map((col, i) => (
                  <div key={i} className="w-[80px] flex flex-col gap-1.5">
                    <div className="text-[10px] font-semibold text-[#1E293B] text-center mb-1 truncate">{col || 'Untitled'}</div>
                    <div className="h-[60px] bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0] p-1.5 flex flex-col gap-1">
                      {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                        <div key={j} className="h-2 bg-white rounded-sm border border-[#E5E7EB]" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-[#E5E7EB] p-4 z-30">
        <button onClick={() => navigate('/projects/new')} className="w-full h-[48px] bg-[#4A90D9] text-white font-semibold rounded-[6px] flex items-center justify-center shadow-sm hover:bg-[#3B82F6] active:scale-[0.98] transition-all">
          Select Template
        </button>
      </div>
    </MobileShell>
  );
}
