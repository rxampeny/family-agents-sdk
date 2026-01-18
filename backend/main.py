from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional

# Importar Agents SDK
from agents import (
    FileSearchTool, WebSearchTool, ImageGenerationTool, 
    RunContextWrapper, Agent, ModelSettings, TResponseInputItem, 
    Runner, RunConfig, trace
)
from openai.types.shared.reasoning import Reasoning

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

image_generation = ImageGenerationTool(tool_config={
    "type": "image_generation",
    "background": "auto",
    "model": "gpt-image-1",
    "moderation": "auto",
    "output_format": "png",
    "partial_images": 3,
    "quality": "auto",
    "size": "auto"
})

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
També pots buscar informació a la web i crear imatges.
A la resposta no indiquis la referència origen.
Respon sempre en català i intenta ser breu."""

# Crear el agente
gestor_familiar = Agent(
    name="Gestor familiar",
    instructions=gestor_familiar_instructions,
    model="gpt-4o",  # Modelo estable
    tools=[
        file_search,
        web_search_preview,
        image_generation
    ],
    model_settings=ModelSettings(
        store=True,
        reasoning=Reasoning(
            effort="medium",
            summary="auto"
        )
    )
)

# ============================================
# MODELOS DE REQUEST/RESPONSE
# ============================================

class WorkflowInput(BaseModel):
    input_as_text: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []

class ChatResponse(BaseModel):
    response: str
    status: str

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
    """
    try:
        # Preparar el input del workflow
        workflow_input = WorkflowInput(input_as_text=request.message)
        
        # Ejecutar el workflow
        workflow = workflow_input.model_dump()
        
        # Construir historial de conversación
        conversation_history: list[TResponseInputItem] = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": workflow["input_as_text"]
                    }
                ]
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
                    workflow_input_as_text=workflow["input_as_text"]
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
