import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import logging
from sqlmodel import Field, Session, SQLModel, create_engine, select, text
from dotenv import load_dotenv
from functools import lru_cache
import time
import asyncio

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

logger = logging.getLogger(__name__)

# Configure CORS to allow requests from your frontend
origins = [
    "http://localhost:5173",  # Default Vite dev server
    "http://127.0.0.1:5173",  # Default Vite dev server alternative
    "http://localhost:3000",  # Common React dev server
    "http://127.0.0.1:3000",  # Common React dev server alternative
    "http://localhost:8000",  # Backend itself
    "http://127.0.0.1:8000",  # Backend itself alternative
]

# Add logging for CORS issues
@app.middleware("http")
async def log_cors_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Origin: {request.headers.get('origin')}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set. Please create a .env file.")

engine = create_engine(DATABASE_URL, echo=False) # Disabled SQL statement logging

def create_db_and_tables():
    # Drop and recreate the budget table to include the spent column
    with Session(engine) as session:
        try:
            # Drop the existing budget table
            session.exec(text("DROP TABLE IF EXISTS budget CASCADE"))
            session.commit()
            logger.info("Dropped existing budget table")
        except Exception as e:
            logger.error(f"Error dropping budget table: {e}")
            raise

    # Create all tables with the new schema
    SQLModel.metadata.create_all(engine)
    logger.info("Created tables with updated schema")

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

# SQLModel for Transaction
class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float
    category: str
    description: str
    date: str # Storing as ISO string for simplicity, consider Date type for more complex date operations
    type: str # 'income' or 'expense'
    recurring: bool = False
    tags: Optional[str] = None # Store as comma-separated string for simplicity

    # This ensures Pydantic can convert to/from ORM models
    model_config = {
        "from_attributes": True
    }

# SQLModel for Budget
class Budget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str
    allocated: float
    period: str = "monthly"  # monthly, weekly, yearly
    spent: float = Field(default=0.0)  # Track spent amount with default value

    model_config = {
        "from_attributes": True
    }

# Pydantic models for API input/output
class BudgetBase(BaseModel):
    category: str
    allocated: float
    spent: float # Include spent for insight generation logic

class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    date: str
    type: str
    recurring: bool
    tags: Optional[str] = None

class FinancialData(BaseModel):
    transactions: List[TransactionBase]
    budgets: List[BudgetBase]

class AIInsight(BaseModel):
    type: str # 'warning', 'tip', 'achievement', 'prediction'
    title: str
    description: str
    action: Optional[str] = None
    confidence: float

class TransactionDescription(BaseModel):
    description: str

# Add a simple cache for common transactions
COMMON_CATEGORIES = {
    "groceries": "Food",
    "food": "Food",
    "restaurant": "Food",
    "coffee": "Food",
    "uber": "Transportation",
    "taxi": "Transportation",
    "bus": "Transportation",
    "train": "Transportation",
    "netflix": "Entertainment",
    "spotify": "Entertainment",
    "movie": "Entertainment",
    "concert": "Entertainment",
    "book": "Education",
    "course": "Education",
    "tuition": "Education",
    "doctor": "Healthcare",
    "pharmacy": "Healthcare",
    "dental": "Healthcare",
    "amazon": "Shopping",
    "clothes": "Shopping",
    "shoes": "Shopping",
    "electricity": "Utilities",
    "internet": "Utilities",
    "water": "Utilities",
    "phone": "Utilities",
    "salary": "Income",
    "payment": "Income",
    "scholarship": "Income",
    "gift": "Other",
    "donation": "Other"
}

@lru_cache(maxsize=1000)
def get_cached_category(description: str) -> str:
    """Cache for previously categorized transactions"""
    return None

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/transactions/", response_model=Transaction)
def create_transaction(transaction: Transaction, session: Session = Depends(get_session)):
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@app.get("/transactions/", response_model=List[Transaction])
def read_transactions(session: Session = Depends(get_session)):
    transactions = session.exec(select(Transaction)).all()
    return transactions

@app.post("/categorize")
async def categorize_transaction(data: TransactionDescription):
    description = data.description

    # Define the prompt for the Mistral model
    # We'll ask Mistral to categorize the transaction into one of the predefined categories.
    # The categories are based on the ones found in src/components/TransactionForm.tsx
    system_prompt = """You are an intelligent financial assistant. Your task is to categorize transaction descriptions into one of the following categories:
- Food
- Transportation
- Entertainment
- Education
- Healthcare
- Shopping
- Utilities
- Income
- Other

You MUST provide ONLY the exact category name from the list above as your answer. Do NOT include any other text, explanations, or punctuation.

Here are some examples of categorizing transactions:

Description: "Weekly groceries for the dorm"
Category: Food

Description: "Subway pass for campus commuting"
Category: Transportation

Description: "Netflix monthly subscription"
Category: Entertainment

Description: "Textbooks for my psychology class"
Category: Education

Description: "Co-pay for doctor's visit"
Category: Healthcare

Description: "New pair of running shoes"
Category: Shopping

Description: "Monthly internet bill"
Category: Utilities

Description: "Part-time job salary deposit"
Category: Income

Description: "Gift for my roommate's birthday"
Category: Other
"""

    prompt = f"Categorize the following transaction: '{description}'"

    ollama_payload = {
        "model": "mistral",
        "prompt": prompt,
        "system": system_prompt,
        "stream": False, # We want the full response at once
        "options": {
            "temperature": 0.1, # Keep it low for consistent categorization
        }
    }

    try:
        logger.info(f"Starting categorization request for description: '{description}'")
        async with httpx.AsyncClient() as client:
            ollama_url = "http://localhost:11434/api/generate"
            logger.info("Sending request to Ollama API...")
            response = await client.post(ollama_url, json=ollama_payload, timeout=300.0)  # Increased timeout to 5 minutes
            logger.info("Received response from Ollama API")
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)

            ollama_response = response.json()
            
            # The response from Ollama's /api/generate endpoint will contain the model's output in the "response" field
            # We need to extract and clean this.
            model_output = ollama_response.get("response", "").strip()

            # For robust parsing, we might want to ensure the output matches a known category
            valid_categories = [
                "Food", "Transportation", "Entertainment", "Education",
                "Healthcare", "Shopping", "Utilities", "Income", "Other"
            ]
            
            # Simple check: if the model output is one of our valid categories
            # In a real app, you might want more sophisticated parsing or fuzzy matching
            suggested_category = "Other" # Default to 'Other' if not recognized
            for category in valid_categories:
                if category.lower() in model_output.lower():
                    suggested_category = category
                    break

            return {"category": suggested_category}

    except httpx.RequestError as e:
        logger.exception(f"Ollama API request failed: {e}")
        if isinstance(e, httpx.ReadTimeout):
            logger.error("Request timed out after 300 seconds. This might indicate that the model is taking too long to process or there might be resource constraints.")
        raise HTTPException(status_code=500, detail=f"Ollama API request failed: {e}")
    except httpx.HTTPStatusError as e:
        logger.exception(f"Ollama API returned an error: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Ollama API returned an error: {e.response.text}")
    except json.JSONDecodeError:
        logger.exception("Failed to parse Ollama API response as JSON.")
        raise HTTPException(status_code=500, detail="Failed to parse Ollama API response as JSON.")
    except Exception as e:
        logger.exception(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/generate_insights", response_model=List[AIInsight])
async def generate_insights(data: FinancialData):
    transactions = data.transactions
    budgets = data.budgets

    # Build a comprehensive prompt for the Mistral model
    budget_info = "\n".join([
        f"- {b.category}: Allocated {b.allocated:.2f}, Spent {b.spent:.2f}"
        for b in budgets
    ])

    transaction_info = "\n".join([
        f"- {t.category}: {t.description} (Amount: {t.amount:.2f}, Type: {t.type})"
        for t in transactions[-10:] # Last 10 transactions for brevity
    ])

    system_prompt = """You are an intelligent financial AI assistant. Your task is to provide insightful tips, warnings, or achievements based on the user's financial data.
Analyze the provided budget allocations and recent transactions.

Output Format: Provide a JSON array of insights. Each insight MUST have 'type' (warning, tip, achievement), 'title', 'description', and 'confidence' (0.0-1.0). 'action' is optional.
Example:
[
  {"type": "tip", "title": "Save on Food", "description": "Consider cooking at home more often.", "confidence": 0.9},
  {"type": "warning", "title": "Budget Exceeded", "description": "You've exceeded your entertainment budget.", "confidence": 0.95},
  {"type": "achievement", "title": "Great Savings!", "description": "You stayed under budget for transportation.", "confidence": 0.8}
]
"""

    prompt = f"""
Here is the user's financial data:

Budgets:
{budget_info}

Recent Transactions:
{transaction_info}

Based on this, generate a list of 3-5 concise financial insights. Focus on actionable tips, clear warnings about budget overruns, or positive achievements.
"""

    ollama_payload = {
        "model": "mistral",
        "prompt": prompt,
        "system": system_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.5,
            "top_k": 20,
            "num_predict": 200,
            "stop": ["]\n", "```"]
        }
    }

    max_retries = 3
    retry_delay = 2  # seconds
    timeout = 300.0  # Increased timeout to 300 seconds (5 minutes)

    for attempt in range(max_retries):
        try:
            logger.info(f"Attempt {attempt + 1}/{max_retries} to generate insights with timeout {timeout}s...")
            
            # Create a new client for each attempt to ensure fresh connection
            async with httpx.AsyncClient(timeout=timeout) as client:
                ollama_url = "http://localhost:11434/api/generate"
                
                # First check if Ollama is available
                try:
                    health_check = await client.get("http://localhost:11434/api/tags", timeout=5.0)
                    health_check.raise_for_status()
                except (httpx.RequestError, httpx.HTTPStatusError) as e:
                    logger.error(f"Ollama service is not available: {e}")
                    raise HTTPException(
                        status_code=503,
                        detail="Ollama service is not available. Please ensure Ollama is running."
                    )

                # Proceed with the actual request
                response = await client.post(ollama_url, json=ollama_payload)
                response.raise_for_status()

                ollama_response = response.json()
                model_output = ollama_response.get("response", "").strip()

                try:
                    insights_data = json.loads(model_output)
                    insights = [AIInsight(**item) for item in insights_data]
                    return insights
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse model output as JSON: {model_output}")
                    if attempt == max_retries - 1:  # Last attempt
                        raise HTTPException(
                            status_code=500,
                            detail="Failed to generate valid insights. Please try again."
                        )
                    continue  # Try again if not last attempt

        except httpx.TimeoutException:
            logger.warning(f"Request timed out on attempt {attempt + 1}")
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=504,
                    detail="Request timed out after multiple attempts. Please try again later."
                )
            await asyncio.sleep(retry_delay)
            
        except httpx.RequestError as e:
            logger.error(f"Request failed on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to connect to Ollama service. Please ensure it's running."
                )
            await asyncio.sleep(retry_delay)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error on attempt {attempt + 1}: {e.response.text}")
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Ollama service returned an error: {e.response.text}"
                )
            await asyncio.sleep(retry_delay)
            
        except Exception as e:
            logger.exception(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=500,
                    detail="An unexpected error occurred while generating insights."
                )
            await asyncio.sleep(retry_delay)

    # This should never be reached due to the raises above, but just in case
    raise HTTPException(
        status_code=500,
        detail="Failed to generate insights after multiple attempts."
    )

@app.post("/budgets/", response_model=Budget)
def create_budget(budget: Budget, session: Session = Depends(get_session)):
    session.add(budget)
    session.commit()
    session.refresh(budget)
    return budget

@app.get("/budgets/", response_model=List[Budget])
def read_budgets(session: Session = Depends(get_session)):
    budgets = session.exec(select(Budget)).all()
    return budgets

@app.put("/budgets/{budget_id}", response_model=Budget)
def update_budget(budget_id: int, budget_update: BudgetBase, session: Session = Depends(get_session)):
    budget = session.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    for key, value in budget_update.dict().items():
        setattr(budget, key, value)
    
    session.add(budget)
    session.commit()
    session.refresh(budget)
    return budget

@app.delete("/budgets/{budget_id}")
def delete_budget(budget_id: int, session: Session = Depends(get_session)):
    budget = session.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    session.delete(budget)
    session.commit()
    return {"message": "Budget deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 