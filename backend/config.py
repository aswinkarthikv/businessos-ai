import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'aierp-super-secret-key-12345')
    
    # Database Configuration: Default to SQLite if DATABASE_URL is not set
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///aierp.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Gemini API Configuration
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
