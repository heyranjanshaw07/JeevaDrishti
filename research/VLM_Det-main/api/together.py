import time
import requests

class RateLimiter:
    def __init__(self, max_requests, time_window):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = 0
        self.last_reset = time.time()
    
    def wait(self):
        current_time = time.time()
        if current_time - self.last_reset >= self.time_window:
            self.requests = 0
            self.last_reset = current_time
        
        if self.requests >= self.max_requests:
            time.sleep(self.time_window)
            self.requests = 0
        self.requests += 1

class TogetherAPI:
    def __init__(self, api_key, model, retries=10, delay=5):
        self.api_key = api_key
        self.model = model
        self.url = "https://api.together.xyz/v1/chat/completions"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        self.rate_limiter = RateLimiter(max_requests=10, time_window=1)
        self.retries = retries
        self.delay = delay
    
    def get_shape_information(self, inputs: dict, example_pairs) -> str:
        self.rate_limiter.wait()
        

        content = []
        

        content.append({"type": "text", "text": inputs['prompt']})
        

        for shape, img_crop_list in example_pairs.items():
            for crop in img_crop_list:
                content.append({
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/jpeg;base64,{crop}"}
                })
                content.append({
                    "type": "text", 
                    "text": f'{{"Intended classification output: "}}'
                })
                content.append({
                    "type": "text", 
                    "text": f'{shape}'
                })

                #print(content[:-2], content[:-1], "\n")
        

        content.append({"type": "text", "text": inputs['prompt']})
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{inputs['image']}"
            }
        })
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": content
                }   
            ],
            "temperature": 1.0
        }
        

        attempt = 0
        while attempt < self.retries:
            try:
                response = requests.post(self.url, headers=self.headers, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    if "choices" in result and result["choices"]:
                        return result["choices"][0]['message']['content']
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
