from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import base64
import io
from typing import Optional, List
from PyPDF2 import PdfReader

# Importar Agents SDK
from agents import (
    FileSearchTool, WebSearchTool,
    RunContextWrapper, Agent, ModelSettings, TResponseInputItem,
    Runner, RunConfig, trace
)
# Reasoning removed - not supported by gpt-4o

app = FastAPI(title="Gestor Familiar API")

# Configurar CORS para permitir requests desde Netlify
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción: especifica tu dominio de Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CONFIGURACIÓN DE AGENTS SDK
# ============================================

# Tool definitions
file_search = FileSearchTool(
    vector_store_ids=["vs_6963e0d893648191981088fde3bb184f"]
)

web_search_preview = WebSearchTool(
    search_context_size="medium",
    user_location={
        "country": "ES",
        "type": "approximate"
    }
)

class GestorFamiliarContext:
    def __init__(self, workflow_input_as_text: str):
        self.workflow_input_as_text = workflow_input_as_text

def gestor_familiar_instructions(
    run_context: RunContextWrapper[GestorFamiliarContext], 
    _agent: Agent[GestorFamiliarContext]
):
    workflow_input_as_text = run_context.context.workflow_input_as_text
    return f"""Ets un agent que dona suport i informació respecte la informació familiar com ara, aniversaris, llocs de naixement, parelles etcétera. 

A la pregunta:
 {workflow_input_as_text}

Vas a buscar la informació a la tool Arbre Familiar. En la respuesta no des la referencia de donde has obtenido la información.
També pots buscar informació a la web i analitzar imatges o PDFs que t'enviïn.
A la resposta no indiquis la referència origen.
Respon sempre en català i intenta ser breu."""

# Crear el agente
gestor_familiar = Agent(
    name="Gestor familiar",
    instructions=gestor_familiar_instructions,
    model="gpt-4o",  # Modelo estable
    tools=[
        file_search,
        web_search_preview
    ],
    model_settings=ModelSettings(
        store=True
    )
)

# ============================================
# MODELOS DE REQUEST/RESPONSE
# ============================================

class WorkflowInput(BaseModel):
    input_as_text: str

class FileData(BaseModel):
    name: str
    type: str  # mime type: image/jpeg, image/png, application/pdf
    data: str  # base64 encoded

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []
    files: Optional[List[FileData]] = []

class ChatResponse(BaseModel):
    response: str
    status: str

# ============================================
# FUNCIONES AUXILIARES PARA ARCHIVOS
# ============================================

def extract_pdf_text(base64_data: str) -> str:
    """Extrae texto de un PDF codificado en base64"""
    try:
        pdf_bytes = base64.b64decode(base64_data)
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"[Error al leer PDF: {str(e)}]"

def is_image(mime_type: str) -> bool:
    """Comprueba si el tipo MIME es una imagen"""
    return mime_type.startswith("image/")

def is_pdf(mime_type: str) -> bool:
    """Comprueba si el tipo MIME es un PDF"""
    return mime_type == "application/pdf"

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Gestor Familiar API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check for Railway"""
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Endpoint principal para el chat con Agents SDK
    Soporta archivos: imágenes (análisis visual) y PDFs (extracción de texto)
    """
    try:
        # Preparar el mensaje con contexto de archivos
        message_text = request.message
        pdf_context = ""

        # Procesar archivos adjuntos
        content_items = []

        if request.files:
            for file in request.files:
                if is_pdf(file.type):
                    # Extraer texto del PDF y añadirlo al contexto
                    pdf_text = extract_pdf_text(file.data)
                    if pdf_text:
                        pdf_context += f"\n\n[Contingut del PDF '{file.name}']: {pdf_text}"
                elif is_image(file.type):
                    # Añadir imagen para análisis visual
                    content_items.append({
                        "type": "input_image",
                        "image_url": f"data:{file.type};base64,{file.data}"
                    })

        # Combinar mensaje con contexto de PDFs
        full_message = message_text
        if pdf_context:
            full_message = f"{message_text}\n{pdf_context}"

        # Añadir el texto del mensaje
        content_items.insert(0, {
            "type": "input_text",
            "text": full_message
        })

        # Construir historial de conversación
        conversation_history: list[TResponseInputItem] = [
            {
                "role": "user",
                "content": content_items
            }
        ]
        
        # Ejecutar el agente con trace
        with trace("agent familiar"):
            gestor_familiar_result_temp = await Runner.run(
                gestor_familiar,
                input=[*conversation_history],
                run_config=RunConfig(trace_metadata={
                    "__trace_source__": "agent-builder",
                    "workflow_id": "wf_69678af259b88190b90406b5dee162630cb508e02a638d96"
                }),
                context=GestorFamiliarContext(
                    workflow_input_as_text=full_message
                )
            )
            
            # Obtener la respuesta final
            result = gestor_familiar_result_temp.final_output_as(str)
        
        return ChatResponse(
            response=result,
            status="success"
        )
        
    except Exception as e:
        print(f"Error al procesar la solicitud: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar la solicitud: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
