from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth_utils import get_current_user

router = APIRouter()

class CreatePostRequest(BaseModel):
    content: str
    image_url: Optional[str] = None
    workout_id: Optional[int] = None

@router.get("/feed")
def get_feed(limit: int = 20, current_user: dict = Depends(get_current_user)):
    db = get_db()
    rows = db.execute(
        """SELECT p.*, u.name as author_name, u.email as author_email,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as likes_count,
           (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as user_liked
           FROM posts p
           JOIN users u ON p.user_id = u.id
           ORDER BY p.created_at DESC
           LIMIT ?""",
        (current_user["user_id"], limit)
    ).fetchall()
    db.close()
    return [
        {
            "id": r["id"],
            "content": r["content"],
            "image_url": r["image_url"],
            "workout_id": r["workout_id"],
            "likes_count": r["likes_count"],
            "user_liked": bool(r["user_liked"]),
            "author": {"name": r["author_name"], "email": r["author_email"]},
            "created_at": r["created_at"]
        }
        for r in rows
    ]

@router.post("/post")
def create_post(req: CreatePostRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO posts (user_id, content, image_url, workout_id) VALUES (?,?,?,?)",
        (current_user["user_id"], req.content, req.image_url, req.workout_id)
    )
    db.commit()
    db.close()
    return {"id": cursor.lastrowid, "message": "Post created"}

@router.post("/like/{post_id}")
def toggle_like(post_id: int, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = db.execute(
        "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?",
        (post_id, current_user["user_id"])
    ).fetchone()

    if existing:
        db.execute("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
                   (post_id, current_user["user_id"]))
        liked = False
    else:
        db.execute("INSERT INTO post_likes (post_id, user_id) VALUES (?,?)",
                   (post_id, current_user["user_id"]))
        liked = True

    likes = db.execute("SELECT COUNT(*) as cnt FROM post_likes WHERE post_id = ?", (post_id,)).fetchone()
    db.commit()
    db.close()
    return {"liked": liked, "likes_count": likes["cnt"]}

@router.delete("/post/{post_id}")
def delete_post(post_id: int, current_user: dict = Depends(get_current_user)):
    db = get_db()
    post = db.execute("SELECT user_id FROM posts WHERE id = ?", (post_id,)).fetchone()
    if not post or post["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    db.execute("DELETE FROM post_likes WHERE post_id = ?", (post_id,))
    db.commit()
    db.close()
    return {"message": "Post deleted"}
