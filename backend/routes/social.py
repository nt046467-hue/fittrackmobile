from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import get_current_user
from models import Post, PostLike, User

router = APIRouter()

class CreatePostRequest(BaseModel):
    content: str
    image_url: Optional[str] = None
    workout_id: Optional[int] = None

@router.get("/feed")
def get_feed(limit: int = 20, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(
        Post,
        User.name.label("author_name"),
        User.email.label("author_email"),
        func.count(PostLike.id).label("likes_count")
    ).outerjoin(PostLike, Post.id == PostLike.post_id).join(
        User, Post.user_id == User.id
    ).group_by(Post.id).order_by(Post.created_at.desc()).limit(limit).all()
    
    user_likes = db.query(PostLike.post_id).filter(
        PostLike.user_id == current_user["user_id"]
    ).all()
    user_liked_posts = {like.post_id for like in user_likes}

    return [
        {
            "id": r.Post.id,
            "content": r.Post.content,
            "image_url": r.Post.image_url,
            "workout_id": r.Post.workout_id,
            "likes_count": r.likes_count or 0,
            "user_liked": r.Post.id in user_liked_posts,
            "author": {"name": r.author_name, "email": r.author_email},
            "created_at": r.Post.created_at
        }
        for r in rows
    ]

@router.post("/post")
def create_post(req: CreatePostRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    post = Post(
        user_id=current_user["user_id"],
        content=req.content,
        image_url=req.image_url,
        workout_id=req.workout_id
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"id": post.id, "message": "Post created"}

@router.post("/like/{post_id}")
def toggle_like(post_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user["user_id"]
    ).first()

    if existing:
        db.delete(existing)
        liked = False
    else:
        like = PostLike(post_id=post_id, user_id=current_user["user_id"])
        db.add(like)
        liked = True

    db.commit()
    
    likes_count = db.query(func.count(PostLike.id)).filter(
        PostLike.post_id == post_id
    ).scalar()
    
    return {"liked": liked, "likes_count": likes_count}

@router.delete("/post/{post_id}")
def delete_post(post_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or post.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(post)
    db.query(PostLike).filter(PostLike.post_id == post_id).delete()
    db.commit()
    return {"message": "Post deleted"}
