import base64
import os
import io
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from dotenv import load_dotenv
load_dotenv()


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

origins = ["http://localhost:5500", "http://127.0.0.1:5500"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoadmapRequest(BaseModel):
    goal: str

class ApplicationRequest(BaseModel):
    resume_file: str
    job_description: str

class FocusSession(BaseModel):
    duration: int
    notes: str = ""

@app.get("/")
def root():
    return {"message": "Climbr API running 🚀"}

@app.post("/api/v1/roadmap/generate")
def generate_roadmap(req: RoadmapRequest):
    prompt = f"""
    Create a career roadmap for: {req.goal}.
    Split into 4 phases (6 months each).
    Each phase should include skills + one project.
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a career mentor."},
                  {"role": "user", "content": prompt}]
    )
    roadmap_text = response.choices[0].message.content
    return {"success": True, "roadmap": {"title": "AI Career Roadmap", "timeline": "24 months", "details": roadmap_text}}

@app.post("/api/v1/applications/generate")
def generate_application(req: ApplicationRequest):
    _ = base64.b64decode(req.resume_file)  # Just decode for now
    
    prompt = f"""
    Given this job description:
    {req.job_description}

    Generate:
    1. Tailored resume summary (skills and experience).
    2. A professional cover letter.
    Label sections clearly.
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a career assistant."},
                  {"role": "user", "content": prompt}]
    )
    output = response.choices[0].message.content

    return {
        "success": True,
        "application": {
            "resume": "📄 Tailored Resume\n\n" + output.split("Cover Letter:")[0].strip(),
            "cover_letter": "✉️ Cover Letter\n\n" + (output.split("Cover Letter:")[-1].strip() if "Cover Letter:" in output else output),
            "match_score": 92
        }
    }

@app.get("/api/v1/applications/download")
def download_pdf(resume: str = "Generated Resume", cover_letter: str = "Generated Cover Letter"):
    """
    Return AI-generated Resume + Cover Letter as PDF
    """
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, height - 50, "AI-Generated Job Application")

    pdf.setFont("Helvetica", 11)
    y = height - 100

   
    pdf.drawString(50, y, "📄 Resume:")
    y -= 20
    for line in resume.splitlines():
        pdf.drawString(60, y, line)
        y -= 15
        if y < 50: 
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = height - 50

    y -= 30
    pdf.drawString(50, y, "✉️ Cover Letter:")
    y -= 20

    
    for line in cover_letter.splitlines():
        pdf.drawString(60, y, line)
        y -= 15
        if y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = height - 50

    pdf.save()
    buffer.seek(0)

    return Response(content=buffer.getvalue(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=application.pdf"})

@app.post("/api/v1/focus/sessions")
def save_focus(session: FocusSession):
    return {"success": True, "saved": session.dict()}

@app.get("/api/v1/analytics/dashboard")
def dashboard():
    return {
        "success": True,
        "stats": {
            "goals": 3,
            "applications": 5,
            "focus_hours": 18,
            "insights": "🔥 Keep up the momentum! Try networking this week."
        }
    }
