#!/usr/bin/env python
"""
Download and setup Vosk model for offline voice transcription

This script downloads the vosk-model-small-en-us-0.15 model and extracts it
to the models directory for use by the transcription service.

Usage:
    python download_vosk_model.py
"""

import os
import sys
import requests
import zipfile
from pathlib import Path

def download_file(url, filename):
    """Download a file with progress bar."""
    print(f"Downloading {filename}...")
    
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    downloaded = 0
    
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                
                if total_size > 0:
                    percent = (downloaded / total_size) * 100
                    print(f"\rProgress: {percent:.1f}%", end='', flush=True)
    
    print(f"\nDownloaded {filename}")

def extract_zip(zip_path, extract_to):
    """Extract zip file to directory."""
    print(f"Extracting {zip_path} to {extract_to}...")
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    
    print(f"Extracted to {extract_to}")

def main():
    """Download and setup Vosk model."""
    
    # Model information
    model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    model_name = "vosk-model-small-en-us-0.15"
    
    # Create models directory
    models_dir = Path(__file__).parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    # Check if model already exists
    model_path = models_dir / model_name
    if model_path.exists():
        print(f"Model already exists at {model_path}")
        print("If you want to re-download, delete the model directory first.")
        return
    
    # Download model
    zip_path = models_dir / f"{model_name}.zip"
    
    try:
        download_file(model_url, zip_path)
        
        # Extract model
        extract_zip(zip_path, models_dir)
        
        # Clean up zip file
        zip_path.unlink()
        
        print(f"\n✅ Vosk model successfully installed at {model_path}")
        print("\nTo test the installation:")
        print("1. Start the Django server: python manage.py runserver")
        print("2. Check transcription status: GET /api/openai/transcription-status/")
        print("3. Test transcription: POST /api/openai/transcribe/")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Download failed: {e}")
        sys.exit(1)
    except zipfile.BadZipFile as e:
        print(f"❌ Extraction failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
