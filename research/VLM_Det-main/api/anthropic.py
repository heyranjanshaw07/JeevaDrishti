import time
import requests
import json

class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = 0

    def wait(self):
        if self.requests >= self.max_requests:
            time.sleep(self.time_window)
            self.requests = 0
        self.requests += 1

class AnthropicAPI:
    def __init__(self, api_key, model, thinking_budget, max_tokens=4096, retries=3, delay=5):
        self.api_key = api_key
        self.model = model
        self.thinking_budget = thinking_budget
        self.max_tokens = max_tokens
        self.url = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",  # Add the required version header
        }
        self.rate_limiter = RateLimiter(max_requests=5, time_window=1)  # Adjust as needed
        self.retries = retries
        self.delay = delay

    def get_shape_information(self, inputs: dict, example_pairs) -> str:
        self.rate_limiter.wait()

        messages = []
        messages.append({"role": "user", "content": inputs['prompt']})

        for shape, img_crop_list in example_pairs.items():
            for crop in img_crop_list:
                messages.append({"role": "user", "content": [{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": crop}}, {"type": "text", "text": f'Intended classification output: {shape}'}]})

        messages.append({"role": "user", "content": [{"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": inputs['image']}}, {"type": "text", "text": inputs['prompt']}]})

        if not self.thinking_budget:
            payload = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "messages": messages
            }
        else:
            payload = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "thinking": {
                    "type": "enabled",
                    "budget_tokens": self.thinking_budget
                },
                "messages": messages
            }

        attempt = 0
        while attempt < self.retries:
            try:
                response = requests.post(self.url, headers=self.headers, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    if "content" in result and result["content"]:
                        text = [elem["text"] for elem in result["content"] if elem["type"]=="text"][0].strip()
                        #text = result["content"][0]['text'].strip()
                        if len(text.split()) == 1: # Ensure single-word response
                            return text
                        else:
                            return None
                    else:
                        raise Exception(f"Unexpected API response format: {result}")
                else:
                    raise Exception(f"Failed to call the API: {response.status_code} - {response.text}")

            except Exception as e:
                print(f"API call failed on attempt {attempt+1}/{self.retries}: {str(e)}")
                if attempt + 1 == self.retries:
                    print(f"Skipping this image after {self.retries} failed attempts.")
                    return None
                else:
                    time.sleep(self.delay)
                    attempt += 1
