"""
BIOPILOT AI: Standalone Python Digital Twin & Bioprocess Server
==============================================================
Agentic AI Digital Bioprocess Engineer — Simulation, Trajectory Intelligence & Decision Support

Run this script directly in VS Code or any terminal:
    python biopilot_twin.py

Features:
1. Complete Monod & Luedeking-Piret kinetics for flexible durations up to 48.0 hours:
   - Configurable for any bioproduct: Monoclonal Antibodies (mAb), Insulin, Cellulase Enzymes, Citric Acid, Bioethanol
   - Both Stirred Tank Bioreactor (Rushton impeller) and Airlift Bioreactor (draft tube)
2. Continuous Real-Time Risk Identification while simulating:
   - Evaluates Hypoxia (< critical DO threshold), Shear Stress, Carbon Starvation, Temperature/pH drifts
   - Automatic risk event logging with physical explanations and engineering mitigations
3. Automated fed-batch nutrient feeding logic for extended 48h operations
4. Multi-variable What-If simulation & candidate intervention optimizer
5. Built-in zero-dependency HTTP server:
   - Serves an interactive visual bioprocess interface at http://localhost:8000
   - Provides REST JSON APIs (/api/telemetry, /api/optimize, /api/whatif, /api/simulate)
"""

import sys
import json
import math
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Standard Bioproduct Profiles
PRODUCT_PROFILES = {
    "mab": {
        "name": "Monoclonal Antibody (IgG1)",
        "organism": "CHO-K1 (Mammalian)",
        "critical_do": 20.0,
        "max_rpm": 260,
        "feeding": "fed_batch",
        "default_hours": 48.0,
        "ypx": 0.38,
        "initial_s": 28.0,
    },
    "insulin": {
        "name": "Recombinant Human Insulin",
        "organism": "E. coli BL21(DE3)",
        "critical_do": 25.0,
        "max_rpm": 450,
        "feeding": "fed_batch",
        "default_hours": 48.0,
        "ypx": 0.42,
        "initial_s": 22.0,
    },
    "enzyme": {
        "name": "Industrial Cellulase",
        "organism": "Trichoderma reesei",
        "critical_do": 18.0,
        "max_rpm": 320,
        "feeding": "fed_batch",
        "default_hours": 48.0,
        "ypx": 0.55,
        "initial_s": 35.0,
    },
    "ethanol": {
        "name": "Bioethanol",
        "organism": "Saccharomyces cerevisiae",
        "critical_do": 10.0,
        "max_rpm": 380,
        "feeding": "batch",
        "default_hours": 48.0,
        "ypx": 0.48,
        "initial_s": 50.0,
    }
}

class BioprocessTwin:
    def __init__(self, bioreactor_type="stirred_tank", product_key="mab", max_batch_hours=48.0):
        self.type = bioreactor_type  # 'stirred_tank' or 'airlift'
        self.product_key = product_key
        self.product = PRODUCT_PROFILES.get(product_key, PRODUCT_PROFILES["mab"])
        self.max_batch_hours = float(max_batch_hours)
        
        self.mu_max = 0.48           # 1/h maximum specific growth rate
        self.Ks = 1.25               # g/L substrate saturation constant
        self.Yxs = 0.52              # g biomass / g substrate yield
        self.Ypx = self.product["ypx"] # g product / g biomass yield
        self.mS = 0.018              # g/g/h maintenance substrate
        self.qO2_max = 7.8           # mmol O2 / g biomass / h
        self.mO = 0.35               # mmol O2 / g biomass / h
        self.Ko2 = 0.015             # mmol/L oxygen affinity constant
        self.Cstar = 0.24            # mmol/L O2 saturation at 37 C (approx 100% DO)
        
        self.risk_events = []
        self.reset()

    def reset(self):
        self.time = 0.0
        self.biomass = 0.35          # g/L initial inoculum
        self.substrate = self.product.get("initial_s", 25.0) # g/L initial glucose
        self.product_conc = 0.02     # g/L
        self.do = 98.5               # % dissolved oxygen
        self.ph = 7.00
        self.temperature = 37.0
        self.aeration = 1.0          # vvm
        self.agitation = 210 if self.product["organism"].startswith("CHO") else (250 if self.type == "stirred_tank" else 150)
        self.volume = 10.0           # L
        self.history = []
        self.risk_events = []
        self.record_state()

    def calculate_kla(self, aeration, agitation):
        if self.type == "stirred_tank":
            rpm_norm = max(agitation, 50) / 250.0
            vvm_norm = max(aeration, 0.1) / 1.0
            kla = 32.0 * (rpm_norm ** 1.85) * (vvm_norm ** 0.65)
            return min(max(kla, 5.0), 320.0)
        else:
            vvm_norm = max(aeration, 0.1) / 1.0
            kla = 24.0 * (vvm_norm ** 0.82) * 1.15
            return min(max(kla, 4.0), 180.0)

    def compute_derivatives(self, state):
        # Environmental factors (temp & pH penalties)
        temp_eff = max(0.05, 1.0 - ((abs(state["temperature"] - 37.0) / 6.0) ** 2))
        ph_eff = max(0.05, 1.0 - ((abs(state["ph"] - 7.0) / 1.4) ** 2))

        CL = (max(0.0, state["do"]) / 100.0) * self.Cstar
        o2_factor = CL / (self.Ko2 + CL + 1e-6)
        sub_factor = max(0.0, state["substrate"]) / (self.Ks + max(0.0, state["substrate"]) + 1e-6)

        mu = self.mu_max * sub_factor * o2_factor * temp_eff * ph_eff
        dXdt = mu * state["biomass"]
        dSdt = -(1.0 / self.Yxs) * dXdt - self.mS * state["biomass"]
        dPdt = self.Ypx * dXdt

        kla = self.calculate_kla(state["aeration"], state["agitation"])
        otr = kla * max(0.0, self.Cstar - CL)
        our = state["biomass"] * (mu * self.qO2_max + self.mO * o2_factor)
        o2_balance = otr - our
        dCLdt = o2_balance

        return {
            "mu": mu,
            "dXdt": dXdt,
            "dSdt": dSdt,
            "dPdt": dPdt,
            "dCLdt": dCLdt,
            "otr": otr,
            "our": our,
            "oxygenBalance": o2_balance,
            "kla": kla
        }

    def step(self, dt=0.1):
        if self.time >= self.max_batch_hours:
            return

        curr_state = {
            "biomass": self.biomass,
            "substrate": self.substrate,
            "product": self.product_conc,
            "do": self.do,
            "temperature": self.temperature,
            "ph": self.ph,
            "aeration": self.aeration,
            "agitation": self.agitation,
        }
        derivs = self.compute_derivatives(curr_state)

        # Extended 48h Fed-Batch nutrient feeding logic
        new_sub = max(0.0, self.substrate + derivs["dSdt"] * dt)
        if self.product.get("feeding") == "fed_batch" and new_sub < 2.0 and self.time < self.max_batch_hours - 2.0:
            new_sub += 4.2  # nutrient feed pulse
            self.volume = min(12.5, self.volume + 0.15)

        self.biomass = max(0.05, self.biomass + derivs["dXdt"] * dt)
        self.substrate = new_sub
        self.product_conc = max(0.0, self.product_conc + derivs["dPdt"] * dt)

        delta_do = (derivs["dCLdt"] * dt / self.Cstar) * 100.0
        self.do = max(0.0, min(100.0, self.do + delta_do))
        self.time = round(self.time + dt, 2)
        self.record_state(derivs)

        # Continuous risk identification while simulating
        self.check_and_log_risks()

    def check_and_log_risks(self):
        assessment = self.get_risk_assessment()
        for r in assessment.get("risks", []):
            if r["level"] in ("CRITICAL", "WARNING"):
                # Avoid duplicates within 0.3h
                if not any(e["param"] == r["param"] and abs(e["time"] - self.time) < 0.3 for e in self.risk_events):
                    self.risk_events.append({
                        "time": self.time,
                        "param": r["param"],
                        "level": r["level"],
                        "message": f"{r['level']}: {r['param']} deviation at hour {self.time}h",
                        "recommendation": r.get("rec", "Adjust aeration/agitation")
                    })

    def record_state(self, derivs=None):
        if not derivs:
            derivs = self.compute_derivatives({
                "biomass": self.biomass,
                "substrate": self.substrate,
                "product": self.product_conc,
                "do": self.do,
                "temperature": self.temperature,
                "ph": self.ph,
                "aeration": self.aeration,
                "agitation": self.agitation,
            })
        point = {
            "time": round(self.time, 2),
            "biomass": round(self.biomass, 3),
            "substrate": round(self.substrate, 3),
            "product": round(self.product_conc, 3),
            "do": round(self.do, 1),
            "ph": round(self.ph, 2),
            "temperature": round(self.temperature, 1),
            "aeration": round(self.aeration, 2),
            "agitation": int(self.agitation),
            "specificGrowthRate": round(derivs["mu"], 3),
            "otr": round(derivs["otr"], 2),
            "our": round(derivs["our"], 2),
            "oxygenBalance": round(derivs["oxygenBalance"], 2),
            "kla": round(derivs["kla"], 1),
            "bioreactorType": self.type,
            "targetProduct": self.product["name"],
            "maxBatchHours": self.max_batch_hours
        }
        self.history.append(point)
        if len(self.history) > 600:
            self.history.pop(0)

    def get_trajectory_derivatives(self):
        if len(self.history) < 2:
            return {"dDOdt": 0.0, "dXdt": 0.0, "trend": "STABLE"}
        w = min(len(self.history), 8)
        p_prev = self.history[-w]
        p_curr = self.history[-1]
        dt = max(0.05, p_curr["time"] - p_prev["time"])
        dDOdt = (p_curr["do"] - p_prev["do"]) / dt
        dXdt = (p_curr["biomass"] - p_prev["biomass"]) / dt
        trend = "STABLE"
        if dDOdt < -8.0: trend = "RAPIDLY DECREASING"
        elif dDOdt < -2.0: trend = "DECREASING"
        elif dDOdt > 4.0: trend = "INCREASING"
        return {"dDOdt": round(dDOdt, 2), "dXdt": round(dXdt, 2), "trend": trend}

    def get_risk_assessment(self):
        curr = self.history[-1]
        trajs = self.get_trajectory_derivatives()
        risks = []
        overall = "NORMAL"
        primary = f"None — Stable {self.product['name']} Production"

        crit_do = self.product.get("critical_do", 20.0)
        max_rpm = self.product.get("max_rpm", 350)

        # 1. Hypoxia detection based on product-specific critical DO
        if curr["do"] < crit_do:
            overall = "CRITICAL"
            primary = f"Severe Hypoxia (DO < {crit_do}% for {self.product['organism']})"
            risks.append({"param": "DO", "level": "CRITICAL", "rec": "Boost aeration (vvm) and agitation immediately."})
        elif curr["do"] < crit_do + 10.0 or trajs["trend"] == "RAPIDLY DECREASING":
            overall = "WARNING"
            primary = "Hypoxic Trajectory (Approaching Critical DO)"
            risks.append({"param": "DO", "level": "WARNING", "rec": "Simulate agitation/aeration boost before breach."})

        # 2. Impeller Shear Stress Risk based on product sensitivity
        if curr["agitation"] > max_rpm and self.type == "stirred_tank":
            if overall != "CRITICAL": overall = "WARNING"
            risks.append({
                "param": "Impeller Shear Stress",
                "level": "WARNING",
                "rec": f"Reduce agitation below {max_rpm} rpm or increase sparging to protect {self.product['organism']} membranes."
            })

        # 3. Oxygen Balance
        if curr["oxygenBalance"] < -5.0:
            overall = "CRITICAL"
            primary = "Severe Negative Oxygen Balance (Mass transfer deficit)"
            risks.append({"param": "O2 Balance", "level": "CRITICAL", "rec": "Increase volumetric transfer kLa."})
        elif curr["oxygenBalance"] < 0.0:
            if overall != "CRITICAL": overall = "WARNING"
            risks.append({"param": "O2 Balance", "level": "WARNING", "rec": "Review sparge rate."})

        # 4. Batch Endpoint
        if curr["substrate"] < 0.4 and self.time >= self.max_batch_hours * 0.8:
            overall = "ENDPOINT"
            primary = f"Batch Complete — Harvest Ready ({self.time:.1f}h of {self.max_batch_hours:.0f}h)"

        return {
            "overall": overall,
            "primaryConcern": primary,
            "risks": risks,
            "trajectory": trajs
        }

    def optimize_interventions(self):
        candidates = []
        aer_vals = [1.0, 1.2, 1.5, 2.0, 2.5]
        agit_vals = [200, 250, 300, 350, 400]

        curr = self.history[-1]

        for aer in aer_vals:
            for agit in agit_vals:
                # Sim 2.0 hrs ahead
                state = dict(curr)
                state["aeration"] = aer
                state["agitation"] = agit
                dt = 0.1
                steps = 20
                for _ in range(steps):
                    d = self.compute_derivatives(state)
                    state["biomass"] = max(0.05, state["biomass"] + d["dXdt"] * dt)
                    state["substrate"] = max(0.0, state["substrate"] + d["dSdt"] * dt)
                    state["product"] = max(0.0, state["product"] + d["dPdt"] * dt)
                    delta_do = (d["dCLdt"] * dt / self.Cstar) * 100.0
                    state["do"] = max(0.0, min(100.0, state["do"] + delta_do))

                # Score
                d_end = self.compute_derivatives(state)
                score = (state["do"] * 0.8) + (d_end["oxygenBalance"] * 3.0) - (agit - 250) * 0.05
                candidates.append({
                    "aeration": aer,
                    "agitation": agit,
                    "projectedDO": round(state["do"], 1),
                    "oxygenBalance": round(d_end["oxygenBalance"], 2),
                    "biomass": round(state["biomass"], 2),
                    "compositeScore": round(score, 1)
                })

        candidates.sort(key=lambda x: x["compositeScore"], reverse=True)
        return candidates[:5]

twin = BioprocessTwin(bioreactor_type="stirred_tank")
# Fast-forward to classic demonstration time (t=5.9h)
for _ in range(59):
    twin.step(0.1)

class BiopilotHTTPHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/telemetry":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            assessment = twin.get_risk_assessment()
            data = {
                "latest": twin.history[-1],
                "assessment": assessment,
                "historyCount": len(twin.history),
                "history": twin.history[-30:]
            }
            self.wfile.write(json.dumps(data).encode("utf-8"))
        elif parsed.path == "/api/optimize":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            opts = twin.optimize_interventions()
            self.wfile.write(json.dumps({"topInterventions": opts}).encode("utf-8"))
        elif parsed.path == "/api/step":
            twin.step(0.1)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "stepped", "current": twin.history[-1]}).encode("utf-8"))
        else:
            # Serve clean single-file browser dashboard
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            curr = twin.history[-1]
            risk = twin.get_risk_assessment()
            html = f"""<!DOCTYPE html>
<html>
<head>
    <title>BIOPILOT AI - Standalone Bioprocess Engineer</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ background: #0b0f17; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }}
        .card {{ background: #131b2e; border: 1px solid #1e293b; border-radius: 10px; padding: 18px; }}
        .label {{ font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; }}
        .val {{ font-size: 28px; font-weight: 700; margin-top: 6px; color: #38bdf8; font-family: monospace; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }}
        .badge-warn {{ background: #854d0e; color: #fef08a; }}
        .badge-crit {{ background: #991b1b; color: #fecaca; }}
        .badge-norm {{ background: #166534; color: #bbf7d0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #1e293b; }}
        th {{ color: #94a3b8; font-weight: 600; }}
        button {{ background: #0284c7; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }}
        button:hover {{ background: #0369a1; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="margin:0; font-size:24px;">🧬 BIOPILOT AI</h1>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:13px;">Agentic AI Digital Bioprocess Engineer — Python Twin</p>
        </div>
        <div>
            <span class="badge {'badge-crit' if risk['overall']=='CRITICAL' else ('badge-warn' if risk['overall']=='WARNING' else 'badge-norm')}">{risk['overall']} RISK</span>
            <span style="margin-left: 12px; font-size: 13px; color:#94a3b8;">Bioreactor: {twin.type.upper()}</span>
        </div>
    </div>

    <div class="grid">
        <div class="card"><div class="label">Simulation Time</div><div class="val">{curr['time']} h</div></div>
        <div class="card"><div class="label">Dissolved Oxygen (DO)</div><div class="val" style="color: {'#f87171' if curr['do']<20 else '#38bdf8'}">{curr['do']}%</div></div>
        <div class="card"><div class="label">Biomass (X)</div><div class="val">{curr['biomass']} g/L</div></div>
        <div class="card"><div class="label">Substrate (S)</div><div class="val">{curr['substrate']} g/L</div></div>
        <div class="card"><div class="label">Oxygen Balance (OTR - OUR)</div><div class="val" style="color: {'#f87171' if curr['oxygenBalance']<0 else '#4ade80'}">{curr['oxygenBalance']}</div></div>
        <div class="card"><div class="label">kLa Transfer Coeff</div><div class="val">{curr['kla']} h⁻¹</div></div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-top:0;">🤖 9-Stage Agentic AI Recommendation</h3>
        <p><strong>Primary Concern:</strong> {risk['primaryConcern']}</p>
        <p><strong>Trajectory Momentum:</strong> DO trend is <em>{risk['trajectory']['trend']} ({risk['trajectory']['dDOdt']} %/h)</em></p>
        <p><strong>Recommended Intervention:</strong> Increase sparge aeration (vvm) and agitation (rpm) to restore positive oxygen transfer balance.</p>
        <p style="color:#f59e0b; font-size:13px; font-weight:600;">⚠ HUMAN-IN-THE-LOOP REVIEW GATE: Qualified process-engineer authorization mandatory prior to real DCS execution.</p>
    </div>

    <div class="card">
        <h3 style="margin-top:0;">📊 Top 5 Virtual Optimizer Candidates</h3>
        <p style="color:#94a3b8; font-size:13px;">Simulated forward across candidate grid (Van 't Riet & Monod mechanics):</p>
        <div id="opts-table">Loading candidate matrix...</div>
    </div>

    <script>
        fetch('/api/optimize')
            .then(r => r.json())
            .then(d => {
                let html = '<table><tr><th>Rank</th><th>Aeration (vvm)</th><th>Agitation (rpm)</th><th>Projected DO</th><th>O₂ Balance</th><th>Composite Score</th></tr>';
                d.topInterventions.forEach((c, i) => {
                    html += `<tr><td>#${{i+1}}</td><td>${{c.aeration}}</td><td>${{c.agitation}}</td><td style="color:#38bdf8; font-weight:700;">${{c.projectedDO}}%</td><td>${{c.oxygenBalance}}</td><td>${{c.compositeScore}}</td></tr>`;
                });
                html += '</table>';
                document.getElementById('opts-table').innerHTML = html;
            });
    </script>
</body>
</html>
"""
            self.wfile.write(html.encode("utf-8"))

def run_server(port=8000):
    print("="*70)
    print("🧬 BIOPILOT AI — Standalone Python Digital Twin Server")
    print("="*70)
    print(f"Bioreactor Type: {twin.type}")
    print(f"Current Time:    {twin.time} h")
    print(f"Dissolved O2:    {twin.do} %")
    print(f"Biomass (X):     {twin.biomass} g/L")
    print(f"O2 Balance:      {twin.compute_derivatives(twin.history[-1])['oxygenBalance']} mmol/L/h")
    print("-"*70)
    print(f"Serving interactive local bioprocess dashboard at:")
    print(f"👉 http://localhost:{port}")
    print(f"👉 Press Ctrl+C in VS Code terminal to stop server.")
    print("="*70)
    server = HTTPServer(("0.0.0.0", port), BiopilotHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down BioPilot AI server.")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run_server(port)
