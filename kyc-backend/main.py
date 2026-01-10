from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pytesseract
import cv2
import numpy as np
import re
import os
import uuid
from typing import Optional, Dict, Tuple
from difflib import SequenceMatcher
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="KYC Verification API")

# Configuration
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models for request validation
class KYCFormData(BaseModel):
    name: str
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None

class MatchScore(BaseModel):
    field: str
    extracted: str
    provided: str
    score: float
    match: bool

def preprocess_image(image_path: str, doc_type: str = "pan") -> Optional[np.ndarray]:
    """Enhanced image preprocessing for better OCR results."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            logger.error(f"Failed to read image: {image_path}")
            return None
        
        # Resize if image is too large or too small
        height, width = img.shape[:2]
        if width < 500:
            scale = 500 / width
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        elif width > 2000:
            scale = 2000 / width
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply multiple preprocessing techniques
        # 1. Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        
        # 2. Adaptive thresholding for varying lighting
        adaptive_thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # 3. Morphological operations to remove noise
        kernel = np.ones((1, 1), np.uint8)
        morph = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_CLOSE, kernel)
        
        # 4. Otsu's thresholding
        _, otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Return the best result (usually Otsu for clean documents)
        return otsu
        
    except Exception as e:
        logger.error(f"Error in image preprocessing: {str(e)}")
        return None

def smart_pan_correction(text: str) -> str:
    """
    Corrects common OCR mistakes based on PAN structure:
    Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
    """
    if len(text) != 10:
        return text

    # Mapping for character correction
    to_letter = {'0': 'O', '1': 'I', '5': 'S', '8': 'B', '2': 'Z', '6': 'G'}
    to_digit = {'O': '0', 'I': '1', 'S': '5', 'B': '8', 'Z': '2', 'G': '6', 'Q': '0'}

    chars = list(text.upper())
    
    # Correct first 5 characters (letters)
    for i in range(5):
        if chars[i].isdigit() and chars[i] in to_letter:
            chars[i] = to_letter[chars[i]]
        elif not chars[i].isalpha():
            chars[i] = to_letter.get(chars[i], chars[i])
            
    # Correct middle 4 characters (digits)
    for i in range(5, 9):
        if chars[i].isalpha() and chars[i] in to_digit:
            chars[i] = to_digit[chars[i]]
        elif not chars[i].isdigit():
            chars[i] = to_digit.get(chars[i], chars[i])
            
    # Correct last character (letter)
    if chars[9].isdigit() and chars[9] in to_letter:
        chars[9] = to_letter[chars[9]]

    return "".join(chars)

def extract_pan_from_image(image_path: str) -> Tuple[Optional[str], str, Dict]:
    """Extract PAN number with enhanced accuracy."""
    processed_img = preprocess_image(image_path, "pan")
    if processed_img is None:
        return None, "Failed to process image", {}

    extracted_data = {}
    
    try:
        # Try multiple PSM modes for better results
        psm_modes = [3, 6, 11, 12]
        all_text = []
        
        for psm in psm_modes:
            config = f'--oem 3 --psm {psm}'
            text = pytesseract.image_to_string(processed_img, config=config)
            all_text.append(text)
        
        # Combine all extracted text
        raw_text = "\n".join(all_text)
        
        # Extract PAN number
        words = re.findall(r'[A-Z0-9]{10}', raw_text.upper())
        
        pan_found = None
        for word in words:
            corrected = smart_pan_correction(word)
            if re.fullmatch(r'[A-Z]{5}[0-9]{4}[A-Z]', corrected):
                pan_found = corrected
                break
        
        if not pan_found:
            # Try with spaces removed
            clean_text = raw_text.replace(" ", "").replace("\n", "")
            words = re.findall(r'[A-Z0-9]{10}', clean_text.upper())
            for word in words:
                corrected = smart_pan_correction(word)
                if re.fullmatch(r'[A-Z]{5}[0-9]{4}[A-Z]', corrected):
                    pan_found = corrected
                    break
        
        # Extract name (usually appears after "Name" keyword)
        name_match = re.search(r'(?:Name|NAME)\s*[:\-]?\s*([A-Z\s]+)', raw_text)
        if name_match:
            extracted_data['name'] = name_match.group(1).strip()
        
        # Extract date of birth
        dob_match = re.search(r'(?:Date of Birth|DOB|Birth)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})', raw_text)
        if dob_match:
            extracted_data['dob'] = dob_match.group(1)
        
        if pan_found:
            extracted_data['pan'] = pan_found
            return pan_found, "PAN extracted successfully", extracted_data
        else:
            return None, "Could not find valid PAN pattern", extracted_data
            
    except Exception as e:
        logger.error(f"Error extracting PAN: {str(e)}")
        return None, f"Error during extraction: {str(e)}", {}

def extract_aadhaar_from_image(image_path: str) -> Tuple[Optional[str], str, Dict]:
    """Extract Aadhaar number with enhanced accuracy."""
    processed_img = preprocess_image(image_path, "aadhaar")
    if processed_img is None:
        return None, "Failed to process image", {}

    extracted_data = {}
    
    try:
        # Try multiple configurations
        psm_modes = [3, 6, 11]
        all_text = []
        
        for psm in psm_modes:
            config = f'--oem 3 --psm {psm}'
            text = pytesseract.image_to_string(processed_img, config=config)
            all_text.append(text)
        
        raw_text = "\n".join(all_text)
        
        # Extract 12-digit Aadhaar number (with or without spaces)
        # Format: XXXX XXXX XXXX or XXXXXXXXXXXX
        aadhaar_patterns = [
            r'\b(\d{4}\s\d{4}\s\d{4})\b',
            r'\b(\d{12})\b'
        ]
        
        aadhaar_found = None
        for pattern in aadhaar_patterns:
            matches = re.findall(pattern, raw_text)
            if matches:
                aadhaar_found = matches[0].replace(" ", "")
                if len(aadhaar_found) == 12:
                    break
        
        # Extract name
        name_patterns = [
            r'(?:Name|NAME)\s*[:\-]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)',
            r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})',
        ]
        
        for pattern in name_patterns:
            name_match = re.search(pattern, raw_text, re.MULTILINE)
            if name_match:
                extracted_data['name'] = name_match.group(1).strip()
                break
        
        # Extract date of birth
        dob_patterns = [
            r'(?:DOB|Date of Birth|Birth)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})',
            r'(\d{2}[\/\-]\d{2}[\/\-]\d{4})',
        ]
        
        for pattern in dob_patterns:
            dob_match = re.search(pattern, raw_text)
            if dob_match:
                extracted_data['dob'] = dob_match.group(1)
                break
        
        # Extract address (more complex, usually multiple lines)
        address_match = re.search(r'(?:Address|ADDRESS)[:\-]?\s*(.+?)(?:\n\n|$)', raw_text, re.DOTALL)
        if address_match:
            extracted_data['address'] = address_match.group(1).strip()
        
        if aadhaar_found:
            extracted_data['aadhaar'] = aadhaar_found
            return aadhaar_found, "Aadhaar extracted successfully", extracted_data
        else:
            return None, "Could not find valid Aadhaar pattern", extracted_data
            
    except Exception as e:
        logger.error(f"Error extracting Aadhaar: {str(e)}")
        return None, f"Error during extraction: {str(e)}", {}

def calculate_similarity(str1: str, str2: str) -> float:
    """Calculate similarity score between two strings."""
    if not str1 or not str2:
        return 0.0
    
    str1 = str1.lower().strip()
    str2 = str2.lower().strip()
    
    return SequenceMatcher(None, str1, str2).ratio() * 100

def verify_and_score(extracted_data: Dict, form_data: KYCFormData) -> Dict:
    """Compare extracted data with form data and calculate match scores."""
    scores = []
    overall_match = True
    
    # Define matching threshold
    THRESHOLD = 80.0
    
    # Compare PAN
    if form_data.pan_number and 'pan' in extracted_data:
        pan_score = calculate_similarity(extracted_data['pan'], form_data.pan_number)
        pan_match = pan_score >= THRESHOLD
        scores.append(MatchScore(
            field="PAN",
            extracted=extracted_data['pan'],
            provided=form_data.pan_number,
            score=round(pan_score, 2),
            match=pan_match
        ))
        if not pan_match:
            overall_match = False
    
    # Compare Aadhaar
    if form_data.aadhaar_number and 'aadhaar' in extracted_data:
        aadhaar_score = calculate_similarity(extracted_data['aadhaar'], form_data.aadhaar_number)
        aadhaar_match = aadhaar_score >= THRESHOLD
        scores.append(MatchScore(
            field="Aadhaar",
            extracted=extracted_data['aadhaar'],
            provided=form_data.aadhaar_number,
            score=round(aadhaar_score, 2),
            match=aadhaar_match
        ))
        if not aadhaar_match:
            overall_match = False
    
    # Compare Name
    if form_data.name and 'name' in extracted_data:
        name_score = calculate_similarity(extracted_data['name'], form_data.name)
        name_match = name_score >= THRESHOLD
        scores.append(MatchScore(
            field="Name",
            extracted=extracted_data['name'],
            provided=form_data.name,
            score=round(name_score, 2),
            match=name_match
        ))
        if not name_match:
            overall_match = False
    
    # Compare DOB
    if form_data.date_of_birth and 'dob' in extracted_data:
        dob_score = calculate_similarity(extracted_data['dob'], form_data.date_of_birth)
        dob_match = dob_score >= THRESHOLD
        scores.append(MatchScore(
            field="Date of Birth",
            extracted=extracted_data['dob'],
            provided=form_data.date_of_birth,
            score=round(dob_score, 2),
            match=dob_match
        ))
        if not dob_match:
            overall_match = False
    
    # Calculate overall score
    if scores:
        overall_score = sum(s.score for s in scores) / len(scores)
    else:
        overall_score = 0.0
    
    return {
        "overall_match": overall_match,
        "overall_score": round(overall_score, 2),
        "field_scores": [s.dict() for s in scores],
        "extracted_data": extracted_data
    }

@app.post("/kyc/pan")
async def pan_kyc(file: UploadFile = File(...)):
    """Extract PAN details from uploaded image."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_extensions}")
    
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, temp_filename)

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extract PAN
        pan, message, extracted_data = extract_pan_from_image(file_path)

        if pan:
            return JSONResponse({
                "status": "SUCCESS",
                "pan": pan,
                "message": message,
                "extracted_data": extracted_data
            })
        else:
            return JSONResponse({
                "status": "FAILED",
                "pan": None,
                "message": message,
                "extracted_data": extracted_data
            }, status_code=422)
            
    except Exception as e:
        logger.error(f"Error processing PAN: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Cleanup
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file: {str(e)}")

@app.post("/kyc/aadhaar")
async def aadhaar_kyc(file: UploadFile = File(...)):
    """Extract Aadhaar details from uploaded image."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {allowed_extensions}")
    
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, temp_filename)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        aadhaar, message, extracted_data = extract_aadhaar_from_image(file_path)

        if aadhaar:
            return JSONResponse({
                "status": "SUCCESS",
                "aadhaar": aadhaar,
                "message": message,
                "extracted_data": extracted_data
            })
        else:
            return JSONResponse({
                "status": "FAILED",
                "aadhaar": None,
                "message": message,
                "extracted_data": extracted_data
            }, status_code=422)
            
    except Exception as e:
        logger.error(f"Error processing Aadhaar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file: {str(e)}")

@app.post("/kyc/verify")
async def verify_kyc(
    pan_file: UploadFile = File(...),
    aadhaar_file: UploadFile = File(...),
    name: str = Form(...),
    pan_number: str = Form(...),
    aadhaar_number: str = Form(...),
    date_of_birth: Optional[str] = Form(None),
    address: Optional[str] = Form(None)
):
    """Complete KYC verification with scoring."""
    
    form_data = KYCFormData(
        name=name,
        pan_number=pan_number,
        aadhaar_number=aadhaar_number,
        date_of_birth=date_of_birth,
        address=address
    )
    
    all_extracted_data = {}
    
    # Process PAN
    pan_temp = f"{uuid.uuid4()}_{pan_file.filename}"
    pan_path = os.path.join(UPLOAD_DIR, pan_temp)
    
    try:
        with open(pan_path, "wb") as buffer:
            buffer.write(await pan_file.read())
        
        pan, pan_msg, pan_data = extract_pan_from_image(pan_path)
        all_extracted_data.update(pan_data)
        
    finally:
        if os.path.exists(pan_path):
            os.remove(pan_path)
    
    # Process Aadhaar
    aadhaar_temp = f"{uuid.uuid4()}_{aadhaar_file.filename}"
    aadhaar_path = os.path.join(UPLOAD_DIR, aadhaar_temp)
    
    try:
        with open(aadhaar_path, "wb") as buffer:
            buffer.write(await aadhaar_file.read())
        
        aadhaar, aadhaar_msg, aadhaar_data = extract_aadhaar_from_image(aadhaar_path)
        all_extracted_data.update(aadhaar_data)
        
    finally:
        if os.path.exists(aadhaar_path):
            os.remove(aadhaar_path)
    
    # Verify and score
    verification_result = verify_and_score(all_extracted_data, form_data)
    
    return JSONResponse({
        "status": "SUCCESS" if verification_result["overall_match"] else "FAILED",
        "verification_result": verification_result,
        "timestamp": datetime.now().isoformat()
    })

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "tesseract_configured": os.path.exists(TESSERACT_PATH)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)