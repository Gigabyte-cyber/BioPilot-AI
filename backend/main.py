import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# CONFIGURATION
# ============================================================

OPENAI_MODEL = "gpt-5.6-luna"


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="BioPilot AI Backend",
    description=(
        "ChatGPT-powered AI backend for BioPilot AI "
        "bioprocess engineering decision support."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class CopilotRequest(BaseModel):
    message: str
    language: str = "English"
    process_state: dict = Field(default_factory=dict)


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BioPilot AI Backend",
        "ai_provider": "OpenAI",
        "model": OPENAI_MODEL,
        "message": "BioPilot AI ChatGPT backend is running.",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "ai_provider": "OpenAI",
        "model": OPENAI_MODEL,
    }


# ============================================================
# OPENAI CONNECTION TEST
# ============================================================

@app.get("/test-openai")
def test_openai():

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "provider": "OpenAI",
            "message": "OpenAI API key is not configured.",
        }

    try:

        client = OpenAI(
            api_key=api_key,
            timeout=30.0,
        )

        response = client.responses.create(
            model=OPENAI_MODEL,
            input=(
                "Reply with exactly: "
                "BioPilot OpenAI connection successful."
            ),
        )

        output = response.output_text

        if not output:
            return {
                "status": "error",
                "provider": "OpenAI",
                "model": OPENAI_MODEL,
                "message": "OpenAI returned an empty response.",
            }

        return {
            "status": "success",
            "provider": "OpenAI",
            "model": OPENAI_MODEL,
            "response": output,
        }

    except Exception as e:

        return {
            "status": "error",
            "provider": "OpenAI",
            "model": OPENAI_MODEL,
            "error_type": type(e).__name__,
            "message": str(e),
        }


# ============================================================
# CHATGPT BIOPROCESS ENGINEERING REASONER
# ============================================================

def ask_chatgpt(
    message: str,
    language: str,
    process_state: dict,
):

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OpenAI API key is not configured."
        )

    client = OpenAI(
        api_key=api_key,
        timeout=60.0,
    )

    prompt = f"""
You are BioPilot AI's Engineering Copilot.

You are an expert bioprocess engineering reasoning assistant
supporting fermentation process monitoring, simulation,
optimization, troubleshooting, and engineering decision support.

============================================================
BIOPILOT AI SYSTEM CONTEXT
============================================================

BioPilot AI is a simulation-based digital twin and
decision-support system for bioprocess engineering.

The system can monitor and simulate variables such as:

- Biomass
- Substrate
- Product
- Dissolved Oxygen (DO)
- Temperature
- pH
- Aeration
- Agitation
- Growth Rate
- Oxygen Transfer Rate (OTR)
- Oxygen Uptake/Demand (OUR)
- kLa
- Feeding conditions

The system is NOT directly connected to a physical bioreactor.

============================================================
IMPORTANT SAFETY AND ACCURACY RULES
============================================================

1. You do NOT control physical equipment.

2. You do NOT claim that an intervention has been physically
   executed.

3. All recommendations are simulation-oriented or
   decision-support recommendations.

4. Do not invent process measurements.

5. Clearly distinguish:
   - Observed process data
   - Engineering interpretation
   - Assumptions
   - Recommendations

6. If the supplied process state is incomplete, say what
   information is missing.

7. The human engineer remains responsible for the final
   engineering decision.

8. Do not present a recommendation as a guaranteed outcome.

============================================================
ENGINEERING RESPONSIBILITIES
============================================================

Analyze the engineer's question using appropriate
bioprocess engineering principles.

Consider the following when relevant:

- Dissolved oxygen (DO)
- Oxygen Transfer Rate (OTR)
- Oxygen Uptake Rate / Oxygen Demand (OUR)
- kLa
- Biomass concentration
- Substrate concentration
- Product concentration
- Temperature
- pH
- Aeration
- Agitation
- Growth rate
- Feeding
- Oxygen limitation
- Substrate limitation
- Process phase
- Fermentation trajectory

Use relationships such as:

Monod growth:

μ = μmax × S / (Ks + S)

Oxygen transfer:

OTR = kLa(C* − CL)

Use these relationships conceptually when appropriate.
Do not calculate values unless the required parameters
are actually available.

============================================================
ENGINEER QUESTION
============================================================

{message}

============================================================
CURRENT BIOPILOT PROCESS STATE
============================================================

{process_state}

============================================================
RESPONSE LANGUAGE
============================================================

Respond in {language}.

============================================================
RESPONSE FORMAT
============================================================

CONCLUSION:

Give the main engineering conclusion in 1–2 clear sentences.


PROCESS EVIDENCE:

Identify the important observations from the supplied
BioPilot process state.

Only report values that are actually provided.


ENGINEERING REASONING:

Explain the likely engineering mechanism or process
relationship behind the observation.

Use appropriate bioprocess engineering concepts.


RECOMMENDATION:

Give the most appropriate simulation-oriented engineering
action or next step.

Do not claim that the action has been physically executed.


EXPECTED EFFECT:

Explain what the engineer would expect to observe in the
simulation if the proposed intervention is appropriate.

Avoid guarantees.


MONITOR:

List the most important process variables that should be
monitored after the simulated intervention.


CONFIDENCE:

Choose one:

HIGH
MEDIUM
LOW

Briefly explain why.


HUMAN DECISION GATE:

State that the recommendation should be reviewed by the
human engineer before any real-world implementation.

Remember:

BioPilot AI provides engineering decision support.
It does not autonomously control physical equipment.
"""

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=prompt,
    )

    output = response.output_text

    if not output:
        raise RuntimeError(
            "ChatGPT returned an empty response."
        )

    return output


# ============================================================
# CHATGPT-ONLY BIOPILOT COPILOT
# ============================================================

@app.post("/api/copilot")
def copilot(request: CopilotRequest):

    # --------------------------------------------------------
    # Validate engineer question
    # --------------------------------------------------------

    message = request.message.strip()

    if not message:

        return {
            "status": "error",
            "provider": "OpenAI",
            "message": "Engineer question cannot be empty.",
        }

    # --------------------------------------------------------
    # Ask ChatGPT
    # --------------------------------------------------------

    try:

        answer = ask_chatgpt(
            message=message,
            language=request.language,
            process_state=request.process_state,
        )

        # ----------------------------------------------------
        # Successful response
        # ----------------------------------------------------

        return {
            "status": "success",

            "provider": "OpenAI",

            "model": OPENAI_MODEL,

            "language": request.language,

            "question": message,

            "answer": answer,

            "process_state": request.process_state,

            "human_approval_required": True,

            "simulation_only": True,
        }

    # --------------------------------------------------------
    # Error handling
    # --------------------------------------------------------

    except Exception as e:

        return {
            "status": "error",

            "provider": "OpenAI",

            "model": OPENAI_MODEL,

            "error_type": type(e).__name__,

            "message": str(e),

            "human_approval_required": True,

            "simulation_only": True,
        }