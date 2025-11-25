import requests
import json
import os

API_KEY = os.environ.get("OPENROUTER_API_KEY")

response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    json={
        "model": "openai/gpt-4o-mini",  # Try this instead
        "messages": [
            {
                "role": "user",
                "content": "What is the meaning of life?"
            }
        ]
    }
)

print("Status Code:", response.status_code)
if response.status_code == 200:
    print("Success!")
    print(response.json()['choices'][0]['message']['content'])
else:
    print("Error:", response.text)