import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FolderCode,
  Play,
  Terminal,
} from 'lucide-react';

interface PythonScriptViewerProps {
  pythonCode: string;
}

export const PythonScriptViewer: React.FC<PythonScriptViewerProps> = ({ pythonCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biopilot_twin.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl mb-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              Standalone Python Digital Twin Server
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-yellow-400 border border-slate-700">
                biopilot_twin.py
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-dependency Python 3 digital twin engine with embedded telemetry server, Monod biokinetics, and web UI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Code!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-yellow-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download .py File
          </button>
        </div>
      </div>

      {/* Quick Setup Instructions for VS Code */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
          <Terminal className="w-4 h-4" />
          How to Run in Visual Studio / VS Code:
        </div>
        <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            Download or copy <code className="text-yellow-300 font-mono">biopilot_twin.py</code> into a local project folder.
          </li>
          <li>
            Open the folder in <strong>Visual Studio Code</strong> (e.g. <code className="text-yellow-300 font-mono">code .</code>) or standard Visual Studio.
          </li>
          <li>
            Open a terminal (<kbd className="bg-slate-800 px-1 rounded border border-slate-700 text-[10px]">Ctrl + `</kbd>) and execute:
            <div className="mt-1 bg-slate-900 border border-slate-800 rounded p-2 font-mono text-cyan-300 text-[11px] select-all">
              python biopilot_twin.py
            </div>
          </li>
          <li>
            Open your browser at{' '}
            <a
              href="http://localhost:8000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline font-mono"
            >
              http://localhost:8000
            </a>{' '}
            to view the standalone interactive digital twin, or integrate with its JSON APIs:
            <span className="text-slate-400 block text-[11px] mt-0.5 font-mono">
              GET /api/telemetry • POST /api/step • POST /api/optimize
            </span>
          </li>
        </ol>
      </div>

      {/* Code Window with Syntax-like block */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="font-mono text-slate-300 text-[11px] ml-2">biopilot_twin.py</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Python 3.8+ (No external pip packages needed)</span>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed select-all">
          {pythonCode}
        </pre>
      </div>
    </div>
  );
};
