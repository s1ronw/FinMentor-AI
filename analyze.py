import sys
import json
from g4f.client import Client

client = Client()

def analyze_bank_statement(text):
    prompt = f"""
    Analyze the following bank statement text and extract:
    1. Account Number
    2. Statement Period
    3. Total Assets
    4. Transactions (list of date, description, amount)
    Return the result as a JSON object.
    Text:
    {text}
    """
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    pdf_text = sys.argv[1]
    analysis = analyze_bank_statement(pdf_text)
    print(analysis)