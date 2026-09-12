import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import pythonTwinSource from '../biopilot_twin.py?raw';
import {
  BioreactorType,
  CandidateIntervention,
  ProcessMemoryItem,
  ProcessPoint,
} from './types/bioprocess';
import {
  calculateDerivedVariables,
  createInitialProcessPoint,
  generateSimulationHistoryUpTo,
  integrateNextStep,
} from './lib/bioprocessModel';
import { calculateTrajectories } from './lib/trajectoryEngine';
import { classifyFermentationPhase } from './lib/phaseDetector';
import { evaluateProcessRisk, extractLiveRiskAlerts } from './lib/riskEngine';
import { optimizeInterventions } from './lib/optimizerEngine';
import {
  buildAgentWorkflow,
  calculateEvidenceScore,
  runRootCauseAnalysis,
} from './lib/agentEngine';
import { DEFAULT_PRODUCT, LiveRiskEvent, PRESET_PRODUCTS, ProductProfile } from './types/product';

// Components
import { Header } from './components/Header';
import { BiopilotIntelligenceSummary } from './components/BiopilotIntelligenceSummary';
import { SimulationControls } from './components/SimulationControls';
import { LiveSimulationRiskBanner } from './components/LiveSimulationRiskBanner';
import { ProductConfigModal } from './components/ProductConfigModal';
import { LiveMetricCards } from './components/LiveMetricCards';
import { BioreactorVisualization } from './components/BioreactorVisualization';
import { FermentationIntelligence } from './components/FermentationIntelligence';
import { ProcessTrajectoryCharts } from './components/ProcessTrajectoryCharts';
import { AgentWorkflowPipeline } from './components/AgentWorkflowPipeline';
import { AIDiagnosisAndRootCause } from './components/AIDiagnosisAndRootCause';
import { ExplainableAIPanel } from './components/ExplainableAIPanel';
import { WhatIfSimulationLab } from './components/WhatIfSimulationLab';
import { InterventionOptimizer } from './components/InterventionOptimizer';
import { HistoricalMemoryLog } from './components/HistoricalMemoryLog';
import { HumanApprovalModal } from './components/HumanApprovalModal';
import { CompetitionDemoMode } from './components/CompetitionDemoMode';
import { EngineeringChallengeMode } from './components/EngineeringChallengeMode';
import { JudgeExecutiveView } from './components/JudgeExecutiveView';
import { PythonScriptViewer } from './components/PythonScriptViewer';

export default function App() {
  // Navigation tabs / modes
  const [activeTab, setActiveTab] = useState<'workspace' | 'competition' | 'challenge' | 'judge' | 'python'>('workspace');

  // Active bioproduct profile and flexible batch duration (up to 48.0 hours)
  const [activeProduct, setActiveProduct] = useState<ProductProfile>(PRESET_PRODUCTS[0]);
  const [batchDurationHours, setBatchDurationHours] = useState<number>(24.0);
  const [isProductConfigOpen, setIsProductConfigOpen] = useState<boolean>(false);

  // Bioreactor configuration
  const [bioreactorType, setBioreactorType] = useState<BioreactorType>('stirred_tank');

  // Simulation execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [serverMode, setServerMode] = useState<'typescript' | 'python'>('typescript');

  // Real-time risk audit events detected during simulation run
  const [liveRiskEvents, setLiveRiskEvents] = useState<LiveRiskEvent[]>([
    {
      id: 'init-risk-1',
      timeHour: 3.4,
      level: 'WARNING',
      parameter: 'Oxygen Balance (OTR - OUR)',
      currentValue: -0.8,
      threshold: '≥ 0.0 mmol/L/h',
      unit: 'mmol/L/h',
      message: 'WARNING: Oxygen Balance is -0.8 mmol/L/h (Demand surpassing aeration transfer)',
      physicalCause: 'Rapid exponential cell division driving cellular OUR past baseline aeration capability.',
      remedy: 'Increase aeration airflow or agitation speed.',
      timestamp: '03:24:00',
    },
    {
      id: 'init-risk-2',
      timeHour: 5.8,
      level: 'CRITICAL',
      parameter: 'Dissolved Oxygen (DO)',
      currentValue: 15.2,
      threshold: '≥ 20.0%',
      unit: '%',
      message: 'CRITICAL: Dissolved Oxygen (DO) is 15.2% (Below critical 20.0% hypoxia threshold)',
      physicalCause: 'Severe hypoxia alert: DO has dropped below critical threshold for CHO-K1 / mAb cell line.',
      remedy: 'Immediately boost aeration to ≥2.0 vvm or agitation to 350 rpm.',
      timestamp: '05:48:00',
    },
  ]);

  // Initial trajectory seed up to 5.8h where early oxygen limitation starts developing
  const [history, setHistory] = useState<ProcessPoint[]>(() => {
    return generateSimulationHistoryUpTo(
      5.8,
      'stirred_tank',
      1.0,
      250,
      undefined,
      PRESET_PRODUCTS[0],
      24.0
    );
  });

  // Human approval state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isHumanApproved, setIsHumanApproved] = useState(false);
  const [approvedIntervention, setApprovedIntervention] = useState<CandidateIntervention | null>(null);

  // Historical Process Memory log
  const [memoryItems, setMemoryItems] = useState<ProcessMemoryItem[]>([
    {
      id: 'mem-1',
      timeHours: 3.4,
      phase: 'Exponential Growth',
      riskLevel: 'WARNING',
      primaryConcern: 'Oxygen balance inflection from positive to deficit (-0.8 mM/h)',
      recommendation: 'Surveillance alert: prepare aeration step-up if DO drops below 35%',
      simulatedOutcome: 'Early advisory stage; no physical actuator change executed',
      engineerApproval: 'APPROVED',
      engineerNotes: 'Acknowledged kinetic demand rise. Kept baseline for next 2 hours.',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
    },
    {
      id: 'mem-2',
      timeHours: 5.8,
      phase: 'Exponential Growth',
      riskLevel: 'CRITICAL',
      primaryConcern: 'Hypoxic DO descent (15.2%) under biological OUR demand spike',
      recommendation: 'Increase aeration to 2.0 vvm and agitation to 350 rpm',
      simulatedOutcome: 'Projected DO recovery to +33.8% and balance +5.2 mM/h',
      engineerApproval: 'PENDING',
      engineerNotes: '',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Current Process Point is the latest item in history (with safe fallback)
  const current = history[history.length - 1] || createInitialProcessPoint(bioreactorType, activeProduct);

  // Derived Real-Time Intelligence Engines with Product & Flexible 48h Context
  const trajectories = useMemo(() => calculateTrajectories(history), [history]);
  const phaseAnalysis = useMemo(() => classifyFermentationPhase(current, trajectories), [current, trajectories]);
  const risk = useMemo(
    () => evaluateProcessRisk(current, trajectories, activeProduct, batchDurationHours),
    [current, trajectories, activeProduct, batchDurationHours]
  );
  const rootCause = useMemo(
    () => runRootCauseAnalysis(current, risk, trajectories, phaseAnalysis.currentPhase),
    [current, risk, trajectories, phaseAnalysis.currentPhase]
  );
  const candidateInterventions = useMemo(() => optimizeInterventions(current, bioreactorType), [current, bioreactorType]);
  const bestIntervention = candidateInterventions.find((c) => c.isBest) || candidateInterventions[0] || null;
  const evidence = useMemo(() => calculateEvidenceScore(current, trajectories, risk), [current, trajectories, risk]);
  const agentWorkflow = useMemo(
    () => buildAgentWorkflow(current, phaseAnalysis.currentPhase, risk, rootCause, bestIntervention, evidence),
    [current, phaseAnalysis.currentPhase, risk, rootCause, bestIntervention, evidence]
  );

  // Real-time risk detection listener during simulation run
  useEffect(() => {
    if (current && risk) {
      const alerts = extractLiveRiskAlerts(current, risk, activeProduct);
      if (alerts.length > 0) {
        setLiveRiskEvents((prev) => {
          const newAlerts = alerts.filter(
            (alert) =>
              !prev.some(
                (existing) =>
                  existing.parameter === alert.parameter &&
                  Math.abs(existing.timeHour - alert.timeHour) < 0.25
              )
          );
          if (newAlerts.length === 0) return prev;
          return [...prev, ...newAlerts];
        });
      }
    }
  }, [current.time, risk.overallLevel, activeProduct]);

  // Simulation tick step (handles up to 48.0 hours)
  const handleStepForward = useCallback(
    (stepDt: number = 0.2) => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last.time >= batchDurationHours) return prev; // Stop at target batch limit
        const next = integrateNextStep(last, stepDt, bioreactorType, activeProduct, batchDurationHours);
        return [...prev, next];
      });
    },
    [bioreactorType, activeProduct, batchDurationHours]
  );

  // Auto-play interval loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      const ms = Math.max(120, Math.floor(500 / simulationSpeed));
      interval = setInterval(() => {
        handleStepForward(0.15 * simulationSpeed);
      }, ms);
    }
    return () => clearInterval(interval);
  }, [isRunning, simulationSpeed, handleStepForward]);

  // Change Bioreactor Type
  const handleBioreactorChange = (newType: BioreactorType) => {
    setBioreactorType(newType);
    const newAgit = newType === 'stirred_tank' ? (activeProduct.shearSensitivity === 'HIGH' ? 210 : 250) : 150;
    const recomputed = generateSimulationHistoryUpTo(
      current.time,
      newType,
      current.aeration,
      newAgit,
      undefined,
      activeProduct,
      batchDurationHours
    );
    setHistory(recomputed);
  };

  // Switch or configure product profile with flexible duration up to 48h
  const handleSelectProduct = (newProduct: ProductProfile, newBatchHours: number) => {
    setActiveProduct(newProduct);
    setBatchDurationHours(newBatchHours);
    const targetTime = Math.min(current.time, newBatchHours);
    const recomputed = generateSimulationHistoryUpTo(
      targetTime,
      bioreactorType,
      current.aeration,
      current.agitation,
      undefined,
      newProduct,
      newBatchHours
    );
    setHistory(recomputed);
  };

  // Reset Simulation to 0 Hours
  const handleReset = () => {
    setIsRunning(false);
    setIsHumanApproved(false);
    setApprovedIntervention(null);
    const initial = [createInitialProcessPoint(bioreactorType, activeProduct)];
    setHistory(initial);
  };

  // Jump to specific time (e.g. from scrubber or demo milestones)
  const handleJumpToTime = (targetHour: number, aer: number = current.aeration, agit: number = current.agitation) => {
    const newHist = generateSimulationHistoryUpTo(
      targetHour,
      bioreactorType,
      aer,
      agit,
      undefined,
      activeProduct,
      batchDurationHours
    );
    setHistory(newHist);
  };

  // Apply Intervention parameters directly to the live twin
  const handleApplyIntervention = (aer: number, agit: number, temp?: number, ph?: number) => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      const updated = {
        ...last,
        aeration: aer,
        agitation: agit,
        temperature: temp ?? last.temperature,
        ph: ph ?? last.ph,
      };
      const reDerived = calculateDerivedVariables(updated, bioreactorType, undefined, activeProduct);
      return [...prev.slice(0, -1), reDerived];
    });
  };

  // 1-Click Quick Auto-Mitigate action when live risk detected
  const handleQuickMitigate = () => {
    const safeMaxRpm = activeProduct.maxRecommendedRpm || 350;
    const targetAgit = Math.min(safeMaxRpm, Math.max(current.agitation + 80, 320));
    const targetAer = Math.min(2.5, Number((current.aeration + 0.6).toFixed(1)));
    handleApplyIntervention(targetAer, targetAgit);
  };

  // Human Engineer Approves an Intervention
  const handleApproveIntervention = (engineerName: string, notes: string) => {
    setIsHumanApproved(true);
    if (bestIntervention) {
      setApprovedIntervention(bestIntervention);
      // Apply the approved parameters
      handleApplyIntervention(bestIntervention.aeration, bestIntervention.agitation);

      // Record to immutable audit memory log
      const newRecord: ProcessMemoryItem = {
        id: `mem-${Date.now()}`,
        timeHours: current.time,
        phase: phaseAnalysis.currentPhase,
        riskLevel: risk.overallLevel,
        primaryConcern: risk.primaryConcern,
        recommendation: `Set aeration: ${bestIntervention.aeration} vvm, agitation: ${bestIntervention.agitation} rpm`,
        simulatedOutcome: `Projected DO +${bestIntervention.projectedDO.toFixed(1)}%, balance +${bestIntervention.oxygenBalance.toFixed(1)} mM/h`,
        engineerApproval: 'APPROVED',
        engineerNotes: `${engineerName} — ${notes}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMemoryItems((prev) => [newRecord, ...prev]);
    }
  };

  // Inject Disturbance for Engineering Challenge Mode
  const handleInjectDisturbance = (disturbanceId: string) => {
    setIsHumanApproved(false);
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      let newAer = last.aeration;
      let newAgit = last.agitation;
      let newTemp = last.temperature;
      let newPh = last.ph;
      let newDo = last.do;
      let newSub = last.substrate;

      switch (disturbanceId) {
        case 'oxygen_limitation':
          newDo = Math.min(newDo, 13.5);
          newAer = 0.8;
          break;
        case 'low_aeration':
          newAer = 0.4;
          newDo = Math.min(newDo, 12.0);
          break;
        case 'low_agitation':
          newAgit = 100;
          newDo = Math.min(newDo, 14.0);
          break;
        case 'temp_excursion':
          newTemp = 40.2;
          break;
        case 'ph_acid_drift':
          newPh = 6.20;
          break;
        case 'substrate_starvation':
          newSub = 0.35;
          break;
      }

      const updated = {
        ...last,
        aeration: newAer,
        agitation: newAgit,
        temperature: newTemp,
        ph: newPh,
        do: newDo,
        substrate: newSub,
      };
      const reDerived = calculateDerivedVariables(updated, bioreactorType);
      return [...prev.slice(0, -1), reDerived];
    });
  };

  const handleResetToNominal = () => {
    handleApplyIntervention(1.0, bioreactorType === 'stirred_tank' ? 250 : 150, 37.0, 7.0);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Time(h),Biomass(g/L),Substrate(g/L),Product(g/L),DO(%),OTR(mM/h),OUR(mM/h),OxygenBalance(mM/h),kLa(1/h),Aeration(vvm),Agitation(rpm),Temp(C),pH\n';
    const rows = history
      .map(
        (p) =>
          `${p.time},${p.biomass},${p.substrate},${p.product},${p.do},${p.otr},${p.our},${p.oxygenBalance},${p.kla},${p.aeration},${p.agitation},${p.temperature},${p.ph}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biopilot_telemetry_batch_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      app: 'BIOPILOT AI',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      bioreactorType,
      currentSnapshot: current,
      phase: phaseAnalysis,
      risk,
      rootCause,
      bestIntervention,
      evidence,
      memoryAuditTrail: memoryItems,
      historyLength: history.length,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biopilot_audit_package_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="biopilot-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bioreactorType={bioreactorType}
        setBioreactorType={handleBioreactorChange}
        onSelectBioreactorType={handleBioreactorChange}
        simulationTime={current.time}
        isRunning={isRunning}
        simulationSpeed={simulationSpeed}
        serverMode={serverMode}
        setServerMode={setServerMode}
        onExportCSV={handleExportCSV}
        onOpenPythonCode={() => setActiveTab('python')}
        activeProduct={activeProduct}
        onOpenProductConfig={() => setIsProductConfigOpen(true)}
        maxBatchHours={batchDurationHours}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {/* Top High-Density Intelligence Summary Strip */}
        <BiopilotIntelligenceSummary
          phase={phaseAnalysis.currentPhase}
          currentPhase={phaseAnalysis.currentPhase}
          oxygenBalance={current.oxygenBalance}
          risk={risk}
          riskLevel={risk.overallLevel}
          primaryConcern={risk.primaryConcern}
          trajectories={trajectories}
          bestIntervention={bestIntervention}
          recommendation={
            bestIntervention
              ? `Increase aeration to ${bestIntervention.aeration} vvm and agitation to ${bestIntervention.agitation} rpm`
              : 'Maintain steady-state'
          }
          isHumanApproved={isHumanApproved}
          onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
          onAuthorizeClick={() => setIsApprovalModalOpen(true)}
        />

        {/* Real-Time Simulation Risk Identification & Mitigation Banner */}
        <LiveSimulationRiskBanner
          current={current}
          risk={risk}
          product={activeProduct}
          isRunning={isRunning}
          batchHours={batchDurationHours}
          liveRiskEvents={liveRiskEvents}
          onQuickMitigate={handleQuickMitigate}
          onOpenInterventionModal={() => setIsApprovalModalOpen(true)}
        />

        {/* Dynamic Tab / View Router */}
        {activeTab === 'competition' && (
          <CompetitionDemoMode
            current={current}
            onSetSimulationState={handleJumpToTime}
            onTriggerApprovalModal={() => setIsApprovalModalOpen(true)}
            isHumanApproved={isHumanApproved}
          />
        )}

        {activeTab === 'challenge' && (
          <EngineeringChallengeMode
            current={current}
            risk={risk}
            rootCause={rootCause}
            bestIntervention={bestIntervention}
            onInjectDisturbance={handleInjectDisturbance}
            onResetNominal={handleResetToNominal}
            onTriggerApprovalModal={() => setIsApprovalModalOpen(true)}
            isHumanApproved={isHumanApproved}
          />
        )}

        {activeTab === 'judge' && (
          <JudgeExecutiveView
            current={current}
            phase={phaseAnalysis.currentPhase}
            risk={risk}
            rootCause={rootCause}
            bestIntervention={bestIntervention}
            evidence={evidence}
            trajectories={trajectories}
            onOpenApprovalModal={() => setIsApprovalModalOpen(true)}
            isHumanApproved={isHumanApproved}
          />
        )}

        {activeTab === 'python' && (
          <PythonScriptViewer pythonCode={pythonTwinSource} />
        )}

        {/* Primary Engineering Workspace View */}
        {activeTab === 'workspace' && (
          <>
            {/* Simulation Playback and Scrubber Bar with flexible hours within 48h */}
            <SimulationControls
              currentTime={current.time}
              simulationTime={current.time}
              maxTime={batchDurationHours}
              isRunning={isRunning}
              isPlaying={isRunning}
              simulationSpeed={simulationSpeed}
              speed={simulationSpeed}
              onTogglePlay={() => setIsRunning(!isRunning)}
              onStepForward={() => handleStepForward(0.2)}
              onReset={handleReset}
              onChangeSpeed={setSimulationSpeed}
              onSetSpeed={setSimulationSpeed}
              onSeekTime={(t) => handleJumpToTime(t)}
              onJumpToTime={(t) => handleJumpToTime(t)}
              activeProduct={activeProduct}
              onOpenProductConfig={() => setIsProductConfigOpen(true)}
              onChangeBatchDuration={(h) => handleSelectProduct(activeProduct, h)}
            />

            {/* Real-time 9 Key Process Metric Cards */}
            <LiveMetricCards current={current} trajectories={trajectories} risk={risk} />

            {/* Split Row: Bioreactor Physical Visualizer + Fermentation Intelligence Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              <div className="lg:col-span-5 flex">
                <BioreactorVisualization
                  current={current}
                  bioreactorType={bioreactorType}
                  isAgitating={isRunning || current.agitation > 0}
                />
              </div>
              <div className="lg:col-span-7 flex flex-col">
                <FermentationIntelligence
                  current={current}
                  phaseAnalysis={phaseAnalysis}
                  trajectories={trajectories}
                />
              </div>
            </div>

            {/* 6 Real-Time Dynamic Process Graphs (24 Hours Clear Presentation) */}
            <ProcessTrajectoryCharts
              history={history}
              product={activeProduct}
              maxBatchHours={batchDurationHours}
              currentTime={current.time}
            />

            {/* 9-Stage Closed-Loop Agent Workflow Pipeline */}
            <AgentWorkflowPipeline
              agents={agentWorkflow}
              onTriggerApprovalModal={() => setIsApprovalModalOpen(true)}
              isHumanApproved={isHumanApproved}
            />

            {/* AI Diagnosis & Root Cause + Explainable AI Verification */}
            <AIDiagnosisAndRootCause risk={risk} rootCause={rootCause} />

            <ExplainableAIPanel
              evidence={evidence}
              risk={risk}
              bestIntervention={bestIntervention}
            />

            {/* Interactive In Silico What-If Sandbox Lab */}
            <WhatIfSimulationLab
              current={current}
              bioreactorType={bioreactorType}
              onApplyInterventionToProcess={handleApplyIntervention}
            />

            {/* Multi-Objective Intervention Optimizer Matrix */}
            <InterventionOptimizer
              candidates={candidateInterventions}
              onSelectCandidate={(cand) => handleApplyIntervention(cand.aeration, cand.agitation)}
              onOpenApprovalForCandidate={(cand) => {
                setApprovedIntervention(cand);
                setIsApprovalModalOpen(true);
              }}
            />

            {/* Historical Process Memory & Audit Trail with CSV/JSON Export */}
            <HistoricalMemoryLog
              memoryItems={memoryItems}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              onClearMemory={() => setMemoryItems([])}
            />
          </>
        )}
      </main>

      {/* Product & Flexible 48h Batch Configuration Modal */}
      <ProductConfigModal
        isOpen={isProductConfigOpen}
        onClose={() => setIsProductConfigOpen(false)}
        activeProduct={activeProduct}
        batchHours={batchDurationHours}
        onSelectProduct={handleSelectProduct}
      />

      {/* Human-in-the-Loop Process Review Gate Modal */}
      <HumanApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        bestIntervention={bestIntervention}
        risk={risk}
        simulationTime={current.time}
        onApprove={handleApproveIntervention}
        isAlreadyApproved={isHumanApproved}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            BIOPILOT AI © 2026 • Virtual Bioprocess Twin & Agentic Decision Support
          </span>
          <span className="text-slate-400">
            Advisory decision-support system. Physical setpoint actuation subject to 21 CFR Part 11 human authorization.
          </span>
        </div>
      </footer>
    </div>
  );
}
