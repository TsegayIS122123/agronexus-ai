import logging
import os
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.chat import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

# Try to import LangChain-related classes, fallback to simple responses
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
    logger.info("✅ LangChain loaded successfully")
except ImportError as e:
    LANGCHAIN_AVAILABLE = False
    logger.warning(f"⚠️ LangChain not available: {e}. Using fallback responses.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Simple knowledge base for fallback
KNOWLEDGE_BASE = {
    "teff rust": "Teff rust is a fungal disease. Treatment: Remove infected plants, apply fungicides, and ensure proper spacing.",
    "wheat smut": "Wheat smut is caused by infected seeds. Use certified seeds, treat with hot water, and rotate crops.",
    "planting teff": "Plant teff in July-August in central Ethiopia. Ensure soil temperature is above 15°C.",
    "fertilizer wheat": "Apply 100-150 kg/ha DAP at planting and 100-200 kg/ha urea in split applications.",
    "coffee rust": "Coffee leaf rust shows yellow-orange spots. Apply fungicides and maintain 40-50% shade.",
    "maize storage": "Dry maize to 12-13% moisture, use hermetic bags, store in ventilated areas.",
    "maize spacing": "Plant maize 75cm between rows and 25-30cm between plants.",
    "soil fertility": "Use compost, manure, crop rotation with legumes, and green manure cover crops.",
    "teff pests": "Common teff pests: cutworms, armyworms, and rats. Control with early planting and pesticides.",
    "wheat harvest": "Harvest wheat when fully mature (12-14% moisture), 4-5 months after planting.",
}

# Try to initialize LangChain
if LANGCHAIN_AVAILABLE and GEMINI_API_KEY:
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.7
        )
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GEMINI_API_KEY
        )
        logger.info("✅ Gemini initialized successfully")
    except Exception as e:
        logger.error(f"❌ Gemini initialization failed: {e}")
        LANGCHAIN_AVAILABLE = False

def get_response(query: str) -> str:
    """Get response using LangChain or fallback"""
    # Check if query matches knowledge base
    query_lower = query.lower()
    for key, value in KNOWLEDGE_BASE.items():
        if key in query_lower:
            return value
    
    # Try LangChain if available
    if LANGCHAIN_AVAILABLE and GEMINI_API_KEY:
        try:
            # Simple prompt without RAG for now
            prompt = f"""You are AgroNexus AI, a farming assistant for Ethiopian farmers.
            Question: {query}
            Answer: Provide practical, specific advice for Ethiopian farmers."""
            
            response = llm.invoke(prompt)
            return response.content
        except Exception as e:
            logger.error(f"LangChain error: {e}")
            return get_fallback_response(query)
    
    return get_fallback_response(query)

def get_fallback_response(query: str) -> str:
    """Fallback responses when LLM is unavailable"""
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["weather", "rain", "sun"]):
        return "🌤️ Check the Weather section in your dashboard for 5-day forecasts in your region."
    
    if any(word in query_lower for word in ["market", "price", "sell"]):
        return "💰 Check the Price Prediction section for current and forecasted crop prices."
    
    if any(word in query_lower for word in ["disease", "sick", "rust", "smut"]):
        return "🩺 Use Disease Detection to upload a photo and get instant diagnosis."
    
    if any(word in query_lower for word in ["plant", "crop", "grow", "seed"]):
        return "🌾 For planting advice, visit Farmer Resources. Ask about specific crops like teff or wheat."
    
    return "📚 I'm here to help! Ask me about crops, diseases, markets, weather, or farming practices."

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
        ai_response = get_response(user_message)
        
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
