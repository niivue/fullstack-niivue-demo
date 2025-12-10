import uuid
import shutil
import os
from typing import List, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from pathlib import Path
from app.models import Scene, SceneCreate, ScenePublic, ProcessingStatus
from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure upload directory
UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".nii", ".nii.gz", ".dcm", ".mgz", ".img", ".hdr"}

# Get base URL from environment or use default
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

def get_file_url(filename: str, request: Request = None) -> str:
    """Generate file URL based on server configuration."""
    if request:
        # Use request to build URL dynamically
        base_url = f"{request.url.scheme}://{request.url.hostname}"
        if request.url.port:
            base_url += f":{request.url.port}"
        return f"{base_url}{settings.API_V1_STR}/static/uploads/{filename}"
    else:
        # Fallback to configured base URL
        return f"{BASE_URL}{settings.API_V1_STR}/static/uploads/{filename}"

def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    file_path = Path(filename)
    # Handle .nii.gz as a special case
    if filename.endswith('.nii.gz'):
        return True
    return file_path.suffix.lower() in ALLOWED_EXTENSIONS

@router.post("/files", response_model=dict)
async def upload_files(
    request: Request,
    files: List[UploadFile] = File(...)
) -> dict:
    """
    Upload multiple medical image files and return their URLs.
    This endpoint handles file storage and returns URLs that can be used
    with the scenes endpoints for processing.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    uploaded_files = []
    
    for file in files:
        # Validate file type
        if not is_allowed_file(file.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed: {file.filename}. "
                       f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        if file.filename.endswith('.nii.gz'):
            file_extension = '.nii.gz'
        
        unique_filename = f"{file_id}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        print(f"Saving file {file.filename} as {unique_filename} at {file_path}")
        try:
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create file URL with dynamic server URL
            file_url = get_file_url(unique_filename, request)
            
            uploaded_files.append({
                "original_name": file.filename,
                "filename": unique_filename,
                "url": file_url,
                "size": file_path.stat().st_size
            })
            
        except Exception as e:
            # Cleanup on error
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to save file {file.filename}: {str(e)}"
            )
    
    return {
        "message": f"Successfully uploaded {len(uploaded_files)} files",
        "files": uploaded_files
    }

@router.post("/scene-with-files", response_model=ScenePublic)
async def create_scene_with_uploaded_files(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    files: List[UploadFile] = File(...),
    scene_title: str = Form(None)
) -> Scene:
    """
    Upload files and immediately create a scene with them.
    This is a convenience endpoint that combines file upload and scene creation.
    """
    # First upload the files
    upload_result = await upload_files(request, files)
    
    # Create NiiVue document with uploaded file URLs
    nv_document = {
        "title": scene_title or f"Uploaded Scene - {len(upload_result['files'])} files",
        "imageOptionsArray": [
            {
                "name": file_info["original_name"],
                "url": file_info["url"],
                "colormap": "gray",
                "opacity": 1
            }
            for file_info in upload_result["files"]
        ]
    }
    print(f"Creating scene with NiiVue document: {nv_document}")
    # Create scene
    scene_data = SceneCreate(
        nv_document=nv_document,
        status=ProcessingStatus.PENDING
    )

    scene = Scene.model_validate(scene_data, update={"owner_id": current_user.id})
    session.add(scene)
    session.commit()
    session.refresh(scene)
    
    return scene

@router.delete("/files/{filename}")
async def delete_uploaded_file(filename: str) -> dict:
    """
    Delete an uploaded file from the server.
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path.unlink()
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete file: {str(e)}"
        )

@router.get("/files")
async def list_uploaded_files(request: Request, session: SessionDep,
    current_user: CurrentUser) -> dict:
    """
    List all uploaded files.
    """
    if not UPLOAD_DIR.exists():
        return {"files": []}
    
    files = []
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            files.append({
                "filename": file_path.name,
                "url": get_file_url(file_path.name, request),
                "size": file_path.stat().st_size,
                "created": file_path.stat().st_ctime
            })
    
    return {"files": sorted(files, key=lambda x: x["created"], reverse=True)}
