import React from 'react';
import {
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Lock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ProcessMemoryItem } from '../types/bioprocess';

interface HistoricalMemoryLogProps {
  memoryItems: ProcessMemoryItem[];
  onExportCSV: () => void;
  onExportJSON: () => void;
  onClearMemory: () => void;
}

export const HistoricalMemoryLog: React.FC<HistoricalMemoryLogProps> = ({
  memoryItems,
  onExportCSV,
  onExportJSON,
  onClearMemory,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl mb-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Historical Process Memory & Traceability Log
            </h3>
            <p className="text-[11px] text-slate-400">
              Immutable time-stamped record of AI diagnoses, intervention projections, and engineering approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            className="text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Download full process timeline as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={onExportJSON}
            className="text-xs font-semibold px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Download AI memory and audit decisions as JSON"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Export JSON
          </button>
        </div>
      </div>

      {memoryItems.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs">
          No historical intervention events recorded yet. Memory logging occurs automatically when risks are flagged or interventions authorized.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                <th className="pb-2">Time (h)</th>
                <th className="pb-2">Fermentation Phase</th>
                <th className="pb-2">Risk Status</th>
                <th className="pb-2">Diagnosed Concern</th>
                <th className="pb-2">AI Recommendation</th>
                <th className="pb-2">Simulated Outcome</th>
                <th className="pb-2">Engineer Approval</th>
                <th className="pb-2">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-mono text-cyan-300 font-bold whitespace-nowrap">
                    {item.timeHours.toFixed(1)} h
                  </td>
                  <td className="py-2.5 text-slate-300 font-medium whitespace-nowrap">
                    {item.phase}
                  </td>
                  <td className="py-2.5 font-sans">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.riskLevel === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : item.riskLevel === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {item.riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-200 font-medium">{item.primaryConcern}</td>
                  <td className="py-2.5 text-slate-300 max-w-[200px] truncate" title={item.recommendation}>
                    {item.recommendation}
                  </td>
                  <td className="py-2.5 text-slate-300 max-w-[180px] truncate" title={item.simulatedOutcome}>
                    {item.simulatedOutcome}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        item.engineerApproval === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {item.engineerApproval === 'APPROVED' ? (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-400" />
                      )}
                      {item.engineerApproval}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px] max-w-[180px] truncate font-mono" title={item.engineerNotes}>
                    {item.engineerNotes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
