import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import {
  evaluateProcessRisk,
  extractLiveRiskAlerts,
} from './lib/riskEngine';

import { optimizeInterventions } from './lib/optimizerEngine';

import {
  buildAgentWorkflow,
  calculateEvidenceScore,
  runRootCauseAnalysis,
} from './lib/agentEngine';

import {
  LiveRiskEvent,
  PRESET_PRODUCTS,
  ProductProfile,
} from './types/product';

// ============================================================
// COMPONENTS
// ============================================================

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
import { AICopilot } from './components/AICopilot';

// ============================================================
// APP
// ============================================================

export default function App() {

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const [activeTab, setActiveTab] = useState<
    'workspace' | 'competition' | 'challenge' | 'judge' | 'python'
  >('workspace');

  // ==========================================================
  // PRODUCT / BATCH CONFIGURATION
  // ==========================================================

  const [activeProduct, setActiveProduct] =
    useState<ProductProfile>(PRESET_PRODUCTS[0]);

  const [batchDurationHours, setBatchDurationHours] =
    useState<number>(24.0);

  const [isProductConfigOpen, setIsProductConfigOpen] =
    useState<boolean>(false);

  // ==========================================================
  // BIOREACTOR CONFIGURATION
  // ==========================================================

  const [bioreactorType, setBioreactorType] =
    useState<BioreactorType>('stirred_tank');

  // ==========================================================
  // SIMULATION EXECUTION STATE
  // ==========================================================

  const [isRunning, setIsRunning] =
    useState<boolean>(false);

  const [simulationSpeed, setSimulationSpeed] =
    useState<number>(1);

  // ==========================================================
  // SIMULATION ENGINE MODE
  // ==========================================================

  const [serverMode, setServerMode] =
    useState<'typescript' | 'python'>('typescript');

  // ==========================================================
  // LIVE RISK EVENTS
  // ==========================================================

  const [liveRiskEvents, setLiveRiskEvents] =
    useState<LiveRiskEvent[]>([]);

  // ==========================================================
  // INITIAL SIMULATION HISTORY
  // ==========================================================

  const [history, setHistory] =
    useState<ProcessPoint[]>(() => {

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

  // ==========================================================
  // HUMAN APPROVAL STATE
  // ==========================================================

  const [isApprovalModalOpen, setIsApprovalModalOpen] =
    useState(false);

  const [isHumanApproved, setIsHumanApproved] =
    useState(false);

  const [approvedIntervention, setApprovedIntervention] =
    useState<CandidateIntervention | null>(null);

  // ==========================================================
  // HISTORICAL PROCESS MEMORY
  // ==========================================================

  const [memoryItems, setMemoryItems] =
    useState<ProcessMemoryItem[]>([]);

  // ==========================================================
  // CURRENT PROCESS STATE
  // ==========================================================

  const current =
    history[history.length - 1] ||
    createInitialProcessPoint(
      bioreactorType,
      activeProduct
    );

  // ==========================================================
  // REAL-TIME INTELLIGENCE ENGINES
  // ==========================================================

  const trajectories = useMemo(
    () => calculateTrajectories(history),
    [history]
  );

  const phaseAnalysis = useMemo(
    () =>
      classifyFermentationPhase(
        current,
        trajectories
      ),
    [current, trajectories]
  );

  const risk = useMemo(
    () =>
      evaluateProcessRisk(
        current,
        trajectories,
        activeProduct,
        batchDurationHours
      ),
    [
      current,
      trajectories,
      activeProduct,
      batchDurationHours,
    ]
  );

  const rootCause = useMemo(
    () =>
      runRootCauseAnalysis(
        current,
        risk,
        trajectories,
        phaseAnalysis.currentPhase
      ),
    [
      current,
      risk,
      trajectories,
      phaseAnalysis.currentPhase,
    ]
  );

  const candidateInterventions = useMemo(
    () =>
      optimizeInterventions(
        current,
        bioreactorType
      ),
    [
      current,
      bioreactorType,
    ]
  );

  const bestIntervention =
    candidateInterventions.find(
      (candidate) => candidate.isBest
    ) ||
    candidateInterventions[0] ||
    null;

  const evidence = useMemo(
    () =>
      calculateEvidenceScore(
        current,
        trajectories,
        risk
      ),
    [
      current,
      trajectories,
      risk,
    ]
  );

  const agentWorkflow = useMemo(
    () =>
      buildAgentWorkflow(
        current,
        phaseAnalysis.currentPhase,
        risk,
        rootCause,
        bestIntervention,
        evidence
      ),
    [
      current,
      phaseAnalysis.currentPhase,
      risk,
      rootCause,
      bestIntervention,
      evidence,
    ]
  );

  // ==========================================================
  // CHATGPT COPILOT PROCESS CONTEXT
  // ==========================================================
  //
  // This is the key integration point.
  //
  // The REAL live BioPilot digital-twin state is packaged here
  // and sent to:
  //
  // React
  //   ↓
  // FastAPI
  //   ↓
  // ChatGPT
  //
  // No OpenAI API key is stored in React.
  // ==========================================================

  const copilotProcessState = useMemo(
    () => {

      const currentGrowthRate =
        typeof current.growthRate === 'number'
          ? current.growthRate
          : undefined;

      return {

        // ------------------------------------------------------
        // Simulation information
        // ------------------------------------------------------

        simulation_time_h:
          current.time,

        batch_duration_h:
          batchDurationHours,

        // ------------------------------------------------------
        // Process phase
        // ------------------------------------------------------

        process_phase:
          phaseAnalysis.currentPhase,

        // ------------------------------------------------------
        // Risk intelligence
        // ------------------------------------------------------

        risk_level:
          risk.overallLevel,

        primary_concern:
          risk.primaryConcern,

        // ------------------------------------------------------
        // Biological state
        // ------------------------------------------------------

        biomass_g_l:
          current.biomass,

        substrate_g_l:
          current.substrate,

        product_g_l:
          current.product,

        // ------------------------------------------------------
        // Process conditions
        // ------------------------------------------------------

        dissolved_oxygen_percent:
          current.do,

        temperature_c:
          current.temperature,

        pH:
          current.ph,

        // ------------------------------------------------------
        // Operating conditions
        // ------------------------------------------------------

        aeration_vvm:
          current.aeration,

        agitation_rpm:
          current.agitation,

        // ------------------------------------------------------
        // Kinetics
        // ------------------------------------------------------

        specific_growth_rate_per_h:
          currentGrowthRate,

        // ------------------------------------------------------
        // Oxygen transfer and demand
        // ------------------------------------------------------

        oxygen_transfer_mmol_l_h:
          current.otr,

        oxygen_demand_mmol_l_h:
          current.our,

        oxygen_balance_mmol_l_h:
          current.oxygenBalance,

        // ------------------------------------------------------
        // Mass transfer
        // ------------------------------------------------------

        kLa_per_h:
          current.kla,

        // ------------------------------------------------------
        // System configuration
        // ------------------------------------------------------

        bioreactor_type:
          bioreactorType,

        product:
          activeProduct.name,

        product_profile:
          activeProduct,

        // ------------------------------------------------------
        // BioPilot engineering intelligence
        // ------------------------------------------------------

        root_cause_analysis:
          rootCause,

        evidence_score:
          evidence,

        // ------------------------------------------------------
        // Best simulated intervention
        // ------------------------------------------------------

        best_intervention:
          bestIntervention
            ? {
                aeration:
                  bestIntervention.aeration,

                agitation:
                  bestIntervention.agitation,

                projected_do:
                  bestIntervention.projectedDO,

                oxygen_balance:
                  bestIntervention.oxygenBalance,

                score:
                  bestIntervention.score,

                is_best:
                  bestIntervention.isBest,
              }
            : null,

        // ------------------------------------------------------
        // Recent telemetry
        // ------------------------------------------------------

        recent_process_points:
          history.slice(-10).map(
            (point) => ({
              time_h:
                point.time,

              biomass_g_l:
                point.biomass,

              substrate_g_l:
                point.substrate,

              product_g_l:
                point.product,

              dissolved_oxygen_percent:
                point.do,

              temperature_c:
                point.temperature,

              pH:
                point.ph,

              aeration_vvm:
                point.aeration,

              agitation_rpm:
                point.agitation,

              growth_rate_per_h:
                point.growthRate,

              otr_mmol_l_h:
                point.otr,

              our_mmol_l_h:
                point.our,

              oxygen_balance_mmol_l_h:
                point.oxygenBalance,

              kLa_per_h:
                point.kla,
            })
          ),
      };
    },
    [
      current,
      batchDurationHours,
      phaseAnalysis.currentPhase,
      risk,
      bioreactorType,
      activeProduct,
      rootCause,
      evidence,
      bestIntervention,
      history,
    ]
  );

  // ==========================================================
  // REAL-TIME RISK DETECTION
  // ==========================================================

  useEffect(() => {

    if (!current || !risk) {
      return;
    }

    const alerts =
      extractLiveRiskAlerts(
        current,
        risk,
        activeProduct
      );

    if (alerts.length === 0) {
      return;
    }

    setLiveRiskEvents((previous) => {

      const newAlerts =
        alerts.filter(
          (alert) =>
            !previous.some(
              (existing) =>
                existing.parameter ===
                  alert.parameter &&
                Math.abs(
                  existing.timeHour -
                    alert.timeHour
                ) < 0.25
            )
        );

      if (newAlerts.length === 0) {
        return previous;
      }

      return [
        ...previous,
        ...newAlerts,
      ];

    });

  }, [
    current.time,
    current.do,
    current.substrate,
    current.temperature,
    current.ph,
    risk.overallLevel,
    risk.primaryConcern,
    activeProduct,
  ]);

  // ==========================================================
  // SIMULATION STEP
  // ==========================================================

  const handleStepForward = useCallback(
    (stepDt: number = 0.2) => {

      setHistory((previous) => {

        const last =
          previous[previous.length - 1];

        if (!last) {
          return previous;
        }

        if (
          last.time >=
          batchDurationHours
        ) {
          setIsRunning(false);
          return previous;
        }

        const remaining =
          batchDurationHours -
          last.time;

        const actualStep =
          Math.min(
            stepDt,
            remaining
          );

        if (actualStep <= 0) {
          setIsRunning(false);
          return previous;
        }

        const next =
          integrateNextStep(
            last,
            actualStep,
            bioreactorType,
            activeProduct,
            batchDurationHours
          );

        return [
          ...previous,
          next,
        ];

      });

    },
    [
      bioreactorType,
      activeProduct,
      batchDurationHours,
    ]
  );

  // ==========================================================
  // AUTO-PLAY SIMULATION
  // ==========================================================

  useEffect(() => {

    let interval:
      ReturnType<typeof setInterval> | undefined;

    if (isRunning) {

      const ms =
        Math.max(
          120,
          Math.floor(
            500 / simulationSpeed
          )
        );

      interval =
        setInterval(() => {

          handleStepForward(
            0.15 * simulationSpeed
          );

        }, ms);
    }

    return () => {

      if (interval) {
        clearInterval(interval);
      }

    };

  }, [
    isRunning,
    simulationSpeed,
    handleStepForward,
  ]);

  // ==========================================================
  // CHANGE BIOREACTOR TYPE
  // ==========================================================

  const handleBioreactorChange =
    (newType: BioreactorType) => {

      setBioreactorType(newType);

      setIsHumanApproved(false);
      setApprovedIntervention(null);

      const newAgit =
        newType === 'stirred_tank'
          ? (
              activeProduct.shearSensitivity ===
              'HIGH'
                ? 210
                : 250
            )
          : 150;

      const recomputed =
        generateSimulationHistoryUpTo(
          Math.min(
            current.time,
            batchDurationHours
          ),
          newType,
          current.aeration,
          newAgit,
          undefined,
          activeProduct,
          batchDurationHours
        );

      setHistory(recomputed);

    };

  // ==========================================================
  // CHANGE PRODUCT / BATCH DURATION
  // ==========================================================

  const handleSelectProduct =
    (
      newProduct: ProductProfile,
      newBatchHours: number
    ) => {

      setActiveProduct(newProduct);

      setBatchDurationHours(
        newBatchHours
      );

      setIsHumanApproved(false);
      setApprovedIntervention(null);
      setLiveRiskEvents([]);

      const targetTime =
        Math.min(
          current.time,
          newBatchHours
        );

      const recomputed =
        generateSimulationHistoryUpTo(
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

  // ==========================================================
  // RESET SIMULATION
  // ==========================================================

  const handleReset = () => {

    setIsRunning(false);

    setIsHumanApproved(false);

    setApprovedIntervention(null);

    setLiveRiskEvents([]);

    const initial = [
      createInitialProcessPoint(
        bioreactorType,
        activeProduct
      ),
    ];

    setHistory(initial);

  };

  // ==========================================================
  // JUMP TO SIMULATION TIME
  // ==========================================================

  const handleJumpToTime =
    (
      targetHour: number,
      aer: number = current.aeration,
      agit: number = current.agitation
    ) => {

      const safeTarget =
        Math.min(
          Math.max(
            0,
            targetHour
          ),
          batchDurationHours
        );

      const newHistory =
        generateSimulationHistoryUpTo(
          safeTarget,
          bioreactorType,
          aer,
          agit,
          undefined,
          activeProduct,
          batchDurationHours
        );

      setHistory(newHistory);

    };

  // ==========================================================
  // APPLY INTERVENTION TO LIVE DIGITAL TWIN
  // ==========================================================

  const handleApplyIntervention =
    (
      aer: number,
      agit: number,
      temp?: number,
      ph?: number
    ) => {

      setHistory((previous) => {

        const last =
          previous[previous.length - 1];

        if (!last) {
          return previous;
        }

        const updated = {

          ...last,

          aeration: aer,

          agitation: agit,

          temperature:
            temp ??
            last.temperature,

          ph:
            ph ??
            last.ph,

        };

        const reDerived =
          calculateDerivedVariables(
            updated,
            bioreactorType,
            undefined,
            activeProduct
          );

        return [
          ...previous.slice(0, -1),
          reDerived,
        ];

      });

    };

  // ==========================================================
  // QUICK MITIGATION
  // ==========================================================

  const handleQuickMitigate = () => {

    const safeMaxRpm =
      activeProduct.maxRecommendedRpm ||
      350;

    const targetAgit =
      Math.min(
        safeMaxRpm,
        Math.max(
          current.agitation + 80,
          320
        )
      );

    const targetAer =
      Math.min(
        2.5,
        Number(
          (
            current.aeration + 0.6
          ).toFixed(1)
        )
      );

    handleApplyIntervention(
      targetAer,
      targetAgit
    );

  };

  // ==========================================================
  // OPEN HUMAN APPROVAL MODAL
  // ==========================================================

  const openApprovalModal = (
    candidate?: CandidateIntervention | null
  ) => {

    setApprovedIntervention(
      candidate ?? null
    );

    setIsApprovalModalOpen(true);

  };

  // ==========================================================
  // HUMAN ENGINEER APPROVAL
  // ==========================================================

  const handleApproveIntervention =
    (
      engineerName: string,
      notes: string
    ) => {

      const interventionToApprove =
        approvedIntervention ??
        bestIntervention;

      if (!interventionToApprove) {
        return;
      }

      setIsHumanApproved(true);

      setApprovedIntervention(
        interventionToApprove
      );

      // --------------------------------------------------------
      // Apply approved parameters to the DIGITAL TWIN only.
      // --------------------------------------------------------

      handleApplyIntervention(
        interventionToApprove.aeration,
        interventionToApprove.agitation
      );

      // --------------------------------------------------------
      // Record engineering decision
      // --------------------------------------------------------

      const newRecord:
        ProcessMemoryItem = {

        id:
          `mem-${Date.now()}`,

        timeHours:
          current.time,

        phase:
          phaseAnalysis.currentPhase,

        riskLevel:
          risk.overallLevel,

        primaryConcern:
          risk.primaryConcern,

        recommendation:
          `Set aeration: ${interventionToApprove.aeration} vvm, agitation: ${interventionToApprove.agitation} rpm`,

        simulatedOutcome:
          `Projected DO +${interventionToApprove.projectedDO.toFixed(1)}%, balance +${interventionToApprove.oxygenBalance.toFixed(1)} mM/h`,

        engineerApproval:
          'APPROVED',

        engineerNotes:
          `${engineerName} — ${notes}`,

        timestamp:
          new Date().toLocaleTimeString(),

      };

      setMemoryItems(
        (previous) => [
          newRecord,
          ...previous,
        ]
      );

    };

  // ==========================================================
  // ENGINEERING CHALLENGE DISTURBANCE
  // ==========================================================

  const handleInjectDisturbance =
    (disturbanceId: string) => {

      setIsHumanApproved(false);
      setApprovedIntervention(null);

      setHistory((previous) => {

        const last =
          previous[previous.length - 1];

        if (!last) {
          return previous;
        }

        let newAer =
          last.aeration;

        let newAgit =
          last.agitation;

        let newTemp =
          last.temperature;

        let newPh =
          last.ph;

        let newDo =
          last.do;

        let newSub =
          last.substrate;

        switch (disturbanceId) {

          case 'oxygen_limitation':

            newDo =
              Math.min(
                newDo,
                13.5
              );

            newAer = 0.8;

            break;

          case 'low_aeration':

            newAer = 0.4;

            newDo =
              Math.min(
                newDo,
                12.0
              );

            break;

          case 'low_agitation':

            newAgit = 100;

            newDo =
              Math.min(
                newDo,
                14.0
              );

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

        const reDerived =
          calculateDerivedVariables(
            updated,
            bioreactorType,
            undefined,
            activeProduct
          );

        return [
          ...previous.slice(0, -1),
          reDerived,
        ];

      });

    };

  // ==========================================================
  // RESET TO NOMINAL CONDITIONS
  // ==========================================================

  const handleResetToNominal = () => {

    setIsHumanApproved(false);
    setApprovedIntervention(null);

    handleApplyIntervention(
      1.0,
      bioreactorType ===
        'stirred_tank'
        ? 250
        : 150,
      37.0,
      7.0
    );

  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const handleExportCSV = () => {

    const headers =
      'Time(h),Biomass(g/L),Substrate(g/L),Product(g/L),DO(%),OTR(mM/h),OUR(mM/h),OxygenBalance(mM/h),kLa(1/h),Aeration(vvm),Agitation(rpm),Temp(C),pH\n';

    const rows =
      history
        .map(
          (point) =>
            `${point.time},${point.biomass},${point.substrate},${point.product},${point.do},${point.otr},${point.our},${point.oxygenBalance},${point.kla},${point.aeration},${point.agitation},${point.temperature},${point.ph}`
        )
        .join('\n');

    const blob =
      new Blob(
        [
          headers + rows,
        ],
        {
          type: 'text/csv',
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      `biopilot_telemetry_batch_${Date.now()}.csv`;

    anchor.click();

    URL.revokeObjectURL(url);

  };

  // ==========================================================
  // EXPORT JSON
  // ==========================================================

  const handleExportJSON = () => {

    const data = {

      app:
        'BIOPILOT AI',

      version:
        '1.0.0',

      exportedAt:
        new Date().toISOString(),

      bioreactorType,

      activeProduct,

      batchDurationHours,

      currentSnapshot:
        current,

      copilotProcessState,

      phase:
        phaseAnalysis,

      risk,

      rootCause,

      bestIntervention,

      evidence,

      memoryAuditTrail:
        memoryItems,

      historyLength:
        history.length,

    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2
          ),
        ],
        {
          type: 'application/json',
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      `biopilot_audit_package_${Date.now()}.json`;

    anchor.click();

    URL.revokeObjectURL(url);

  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      id="biopilot-app-root"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Header

        activeTab={activeTab}

        setActiveTab={setActiveTab}

        bioreactorType={bioreactorType}

        setBioreactorType={
          handleBioreactorChange
        }

        onSelectBioreactorType={
          handleBioreactorChange
        }

        simulationTime={
          current.time
        }

        isRunning={
          isRunning
        }

        simulationSpeed={
          simulationSpeed
        }

        serverMode={
          serverMode
        }

        setServerMode={
          setServerMode
        }

        onExportCSV={
          handleExportCSV
        }

        onOpenPythonCode={
          () =>
            setActiveTab('python')
        }

        activeProduct={
          activeProduct
        }

        onOpenProductConfig={
          () =>
            setIsProductConfigOpen(true)
        }

        maxBatchHours={
          batchDurationHours
        }

      />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5"
      >

        {/* ====================================================
            INTELLIGENCE SUMMARY
        ==================================================== */}

        <BiopilotIntelligenceSummary

          phase={
            phaseAnalysis.currentPhase
          }

          currentPhase={
            phaseAnalysis.currentPhase
          }

          oxygenBalance={
            current.oxygenBalance
          }

          risk={
            risk
          }

          riskLevel={
            risk.overallLevel
          }

          primaryConcern={
            risk.primaryConcern
          }

          trajectories={
            trajectories
          }

          bestIntervention={
            bestIntervention
          }

          recommendation={

            bestIntervention

              ? `Increase aeration to ${bestIntervention.aeration} vvm and agitation to ${bestIntervention.agitation} rpm`

              : 'Maintain steady-state'

          }

          isHumanApproved={
            isHumanApproved
          }

          onOpenApprovalModal={
            () =>
              openApprovalModal()
          }

          onAuthorizeClick={
            () =>
              openApprovalModal()
          }

        />

        {/* ====================================================
            LIVE RISK BANNER
        ==================================================== */}

        <LiveSimulationRiskBanner

          current={
            current
          }

          risk={
            risk
          }

          product={
            activeProduct
          }

          isRunning={
            isRunning
          }

          batchHours={
            batchDurationHours
          }

          liveRiskEvents={
            liveRiskEvents
          }

          onQuickMitigate={
            handleQuickMitigate
          }

          onOpenInterventionModal={
            () =>
              openApprovalModal()
          }

        />

        {/* ====================================================
            COMPETITION MODE
        ==================================================== */}

        {activeTab === 'competition' && (

          <CompetitionDemoMode

            current={
              current
            }

            onSetSimulationState={
              handleJumpToTime
            }

            onTriggerApprovalModal={
              () =>
                openApprovalModal()
            }

            isHumanApproved={
              isHumanApproved
            }

          />

        )}

        {/* ====================================================
            ENGINEERING CHALLENGE MODE
        ==================================================== */}

        {activeTab === 'challenge' && (

          <EngineeringChallengeMode

            current={
              current
            }

            risk={
              risk
            }

            rootCause={
              rootCause
            }

            bestIntervention={
              bestIntervention
            }

            onInjectDisturbance={
              handleInjectDisturbance
            }

            onResetNominal={
              handleResetToNominal
            }

            onTriggerApprovalModal={
              () =>
                openApprovalModal()
            }

            isHumanApproved={
              isHumanApproved
            }

          />

        )}

        {/* ====================================================
            JUDGE VIEW
        ==================================================== */}

        {activeTab === 'judge' && (

          <JudgeExecutiveView

            current={
              current
            }

            phase={
              phaseAnalysis.currentPhase
            }

            risk={
              risk
            }

            rootCause={
              rootCause
            }

            bestIntervention={
              bestIntervention
            }

            evidence={
              evidence
            }

            trajectories={
              trajectories
            }

            onOpenApprovalModal={
              () =>
                openApprovalModal()
            }

            isHumanApproved={
              isHumanApproved
            }

          />

        )}

        {/* ====================================================
            PYTHON SOURCE VIEW
        ==================================================== */}

        {activeTab === 'python' && (

          <PythonScriptViewer
            pythonCode={
              pythonTwinSource
            }
          />

        )}

        {/* ====================================================
            MAIN ENGINEERING WORKSPACE
        ==================================================== */}

        {activeTab === 'workspace' && (

          <>

            {/* ==================================================
                SIMULATION CONTROLS
            ================================================== */}

            <SimulationControls

              currentTime={
                current.time
              }

              simulationTime={
                current.time
              }

              maxTime={
                batchDurationHours
              }

              isRunning={
                isRunning
              }

              isPlaying={
                isRunning
              }

              simulationSpeed={
                simulationSpeed
              }

              speed={
                simulationSpeed
              }

              onTogglePlay={
                () =>
                  setIsRunning(
                    (previous) =>
                      !previous
                  )
              }

              onStepForward={
                () =>
                  handleStepForward(0.2)
              }

              onReset={
                handleReset
              }

              onChangeSpeed={
                setSimulationSpeed
              }

              onSetSpeed={
                setSimulationSpeed
              }

              onSeekTime={
                (time) =>
                  handleJumpToTime(time)
              }

              onJumpToTime={
                (time) =>
                  handleJumpToTime(time)
              }

              activeProduct={
                activeProduct
              }

              onOpenProductConfig={
                () =>
                  setIsProductConfigOpen(true)
              }

              onChangeBatchDuration={
                (hours) =>
                  handleSelectProduct(
                    activeProduct,
                    hours
                  )
              }

            />

            {/* ==================================================
                LIVE METRIC CARDS
            ================================================== */}

            <LiveMetricCards

              current={
                current
              }

              trajectories={
                trajectories
              }

              risk={
                risk
              }

            />

            {/* ==================================================
                BIOREACTOR + FERMENTATION INTELLIGENCE
            ================================================== */}

            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4"
            >

              <div
                className="lg:col-span-5 flex"
              >

                <BioreactorVisualization

                  current={
                    current
                  }

                  bioreactorType={
                    bioreactorType
                  }

                  isAgitating={
                    isRunning ||
                    current.agitation > 0
                  }

                />

              </div>

              <div
                className="lg:col-span-7 flex flex-col"
              >

                <FermentationIntelligence

                  current={
                    current
                  }

                  phaseAnalysis={
                    phaseAnalysis
                  }

                  trajectories={
                    trajectories
                  }

                />

              </div>

            </div>

            {/* ==================================================
                PROCESS TRAJECTORY CHARTS
            ================================================== */}

            <ProcessTrajectoryCharts

              history={
                history
              }

              product={
                activeProduct
              }

              maxBatchHours={
                batchDurationHours
              }

              currentTime={
                current.time
              }

            />

            {/* ==================================================
                CHATGPT ENGINEERING COPILOT
            ================================================== */}

            <AICopilot

              processState={
                copilotProcessState
              }

            />

            {/* ==================================================
                AGENT WORKFLOW
            ================================================== */}

            <AgentWorkflowPipeline

              agents={
                agentWorkflow
              }

              onTriggerApprovalModal={
                () =>
                  openApprovalModal()
              }

              isHumanApproved={
                isHumanApproved
              }

            />

            {/* ==================================================
                AI DIAGNOSIS
            ================================================== */}

            <AIDiagnosisAndRootCause

              risk={
                risk
              }

              rootCause={
                rootCause
              }

            />

            {/* ==================================================
                EXPLAINABLE AI
            ================================================== */}

            <ExplainableAIPanel

              evidence={
                evidence
              }

              risk={
                risk
              }

              bestIntervention={
                bestIntervention
              }

            />

            {/* ==================================================
                WHAT-IF SIMULATION LAB
            ================================================== */}

            <WhatIfSimulationLab

              current={
                current
              }

              bioreactorType={
                bioreactorType
              }

              onApplyInterventionToProcess={
                handleApplyIntervention
              }

            />

            {/* ==================================================
                INTERVENTION OPTIMIZER
            ================================================== */}

            <InterventionOptimizer

              candidates={
                candidateInterventions
              }

              onSelectCandidate={
                (candidate) =>
                  handleApplyIntervention(
                    candidate.aeration,
                    candidate.agitation
                  )
              }

              onOpenApprovalForCandidate={
                (candidate) =>
                  openApprovalModal(
                    candidate
                  )
              }

            />

            {/* ==================================================
                HISTORICAL MEMORY
            ================================================== */}

            <HistoricalMemoryLog

              memoryItems={
                memoryItems
              }

              onExportCSV={
                handleExportCSV
              }

              onExportJSON={
                handleExportJSON
              }

              onClearMemory={
                () =>
                  setMemoryItems([])
              }

            />

          </>

        )}

      </main>

      {/* ======================================================
          PRODUCT CONFIGURATION
      ====================================================== */}

      <ProductConfigModal

        isOpen={
          isProductConfigOpen
        }

        onClose={
          () =>
            setIsProductConfigOpen(false)
        }

        activeProduct={
          activeProduct
        }

        batchHours={
          batchDurationHours
        }

        onSelectProduct={
          handleSelectProduct
        }

      />

      {/* ======================================================
          HUMAN APPROVAL MODAL
      ====================================================== */}

      <HumanApprovalModal

        isOpen={
          isApprovalModalOpen
        }

        onClose={
          () =>
            setIsApprovalModalOpen(false)
        }

        bestIntervention={
          approvedIntervention ??
          bestIntervention
        }

        risk={
          risk
        }

        simulationTime={
          current.time
        }

        onApprove={
          handleApproveIntervention
        }

        isAlreadyApproved={
          isHumanApproved
        }

      />

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono"
      >

        <div
          className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2"
        >

          <span>
            BIOPILOT AI © 2026 • Virtual Bioprocess Twin & Agentic Decision Support
          </span>

          <span className="text-slate-400">
            Simulation and engineering decision-support prototype. No physical equipment is controlled by this application.
          </span>

        </div>

      </footer>

    </div>

  );
}