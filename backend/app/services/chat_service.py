import logging
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import os
import pickle
from pathlib import Path

from app.models.chat import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

# Initialize LLM
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY not set. Chat will use fallback responses.")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0.7,
    convert_system_message_to_human=True
)

# Embeddings for RAG
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GEMINI_API_KEY
)

# Knowledge base directory
KNOWLEDGE_DIR = Path(__file__).parent / "chat" / "knowledge"
VECTOR_STORE_PATH = Path(__file__).parent / "chat" / "vector_store"

def load_knowledge_base():
    """Load and index knowledge base files"""
    if not KNOWLEDGE_DIR.exists():
        logger.warning("Knowledge base directory not found")
        return None
    
    texts = []
    for file_path in KNOWLEDGE_DIR.glob("*.txt"):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            texts.append(content)
    
    if not texts:
        return None
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.create_documents(texts)
    
    # Create vector store
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    # Save vector store
    vector_store.save_local(str(VECTOR_STORE_PATH))
    
    return vector_store

def get_vector_store():
    """Load vector store from disk or create if not exists"""
    if VECTOR_STORE_PATH.exists():
        try:
            return FAISS.load_local(
                str(VECTOR_STORE_PATH),
                embeddings,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
            return load_knowledge_base()
    else:
        return load_knowledge_base()

# Load vector store
vector_store = get_vector_store()

# RAG Prompt Template
prompt_template = """You are AgroNexus AI, a helpful farming assistant for Ethiopian farmers. 
Answer the question based on the context provided. Be specific, practical, and use local examples.
If the question is not related to agriculture, farming, or Ethiopian markets, politely say you only provide agricultural advice.

Context: {context}

Question: {question}

Answer:"""

rag_prompt = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

def get_chain():
    """Get RAG chain with vector store"""
    if vector_store is None:
        return None
    
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )
    
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": rag_prompt}
    )
    
    return chain

def get_fallback_response(query: str) -> str:
    """Fallback responses when LLM is unavailable"""
    query_lower = query.lower()
    
    if "weather" in query_lower:
        return "🌤️ For weather information, check the Weather section in your dashboard. You can find 5-day forecasts for your region."
    
    if "market" in query_lower or "price" in query_lower:
        return "💰 Check the Price Prediction section in your dashboard for current and forecasted crop prices in your region."
    
    if "disease" in query_lower:
        return "🩺 Use the Disease Detection feature in your dashboard to upload a photo and get instant diagnosis."
    
    if "plant" in query_lower or "crop" in query_lower:
        return "🌾 For planting advice, visit the Farmer Resources section. You can also ask about specific crops like teff, wheat, or maize."
    
    return "📚 I'm here to help with farming advice! You can ask about crops, diseases, market prices, weather, or general farming practices."

def create_session(db: Session, user_id: str, language: str = "en") -> ChatSession:
    """Create a new chat session"""
    session = ChatSession(
        user_id=user_id,
        language=language,
        title="New Conversation"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_sessions(db: Session, user_id: str, limit: int = 20):
    """Get user's chat sessions"""
    return db.query(ChatSession).filter(
        ChatSession.user_id == user_id
    ).order_by(ChatSession.updated_at.desc()).limit(limit).all()

def get_messages(db: Session, session_id: str):
    """Get messages for a session"""
    return db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

def send_message(db: Session, session_id: str, user_message: str, language: str = "en") -> Dict:
    """Send a message and get AI response"""
    try:
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=user_message,
            language=language
        )
        db.add(user_msg)
        db.commit()
        
        # Get AI response
        chain = get_chain()
        if chain and GEMINI_API_KEY:
            try:
                result = chain.invoke({"query": user_message})
                ai_response = result.get("result", get_fallback_response(user_message))
            except Exception as e:
                logger.error(f"LLM error: {e}")
                ai_response = get_fallback_response(user_message)
        else:
            ai_response = get_fallback_response(user_message)
        
        # Save AI response
        ai_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=ai_response,
            language=language
        )
        db.add(ai_msg)
        
        # Update session updated_at
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(ai_msg)
        
        return {
            "success": True,
            "message": {
                "id": str(ai_msg.id),
                "role": ai_msg.role,
                "content": ai_msg.content,
                "created_at": ai_msg.created_at.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        db.rollback()
        return {"success": False, "error": str(e)}

def delete_session(db: Session, session_id: str):
    """Delete a chat session"""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False
