from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from pydantic import BaseModel
from app.database import get_db
from app.services import chat_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/chat", tags=["AI Chat Assistant"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"

class NewSessionRequest(BaseModel):
    language: str = "en"

@router.post("/sessions")
def create_session(
    req: NewSessionRequest,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    session = chat_service.create_session(db, user.id, req.language)
    return {
        "success": True,
        "data": {
            "id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat()
        }
    }

@router.get("/sessions")
def get_sessions(
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Get user's chat sessions"""
    sessions = chat_service.get_sessions(db, user.id)
    return {
        "success": True,
        "data": [
            {
                "id": str(s.id),
                "title": s.title,
                "message_count": len(s.messages) if hasattr(s, 'messages') else 0,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat()
            }
            for s in sessions
        ]
    }

@router.post("/messages")
def send_message(
    req: ChatRequest,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""
    try:
        # Validate session
        if not req.session_id:
            # Create new session
            session = chat_service.create_session(db, user.id, req.language)
            session_id = str(session.id)
        else:
            session_id = req.session_id
            
            # Verify session belongs to user
            session = db.query(chat_service.ChatSession).filter(
                chat_service.ChatSession.id == session_id,
                chat_service.ChatSession.user_id == user.id
            ).first()
            
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        
        # Send message
        result = chat_service.send_message(db, session_id, req.message, req.language)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))
        
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "message": result["message"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{session_id}")
def get_messages(
    session_id: str,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Get messages for a session"""
    # Verify session belongs to user
    session = db.query(chat_service.ChatSession).filter(
        chat_service.ChatSession.id == session_id,
        chat_service.ChatSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = chat_service.get_messages(db, session_id)
    
    return {
        "success": True,
        "data": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat()
            }
            for m in messages
        ]
    }

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Delete a chat session"""
    # Verify session belongs to user
    session = db.query(chat_service.ChatSession).filter(
        chat_service.ChatSession.id == session_id,
        chat_service.ChatSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chat_service.delete_session(db, session_id)
    
    return {"success": True, "message": "Session deleted"}
