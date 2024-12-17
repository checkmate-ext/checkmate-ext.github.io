import requests
from Scrapper import Scrapper


class GoogleSearch:
    def __init__(self, api_key: str, cx: str, vision_api_key, article_url: str):
        self.api_key = api_key
        self.cx = cx
        self.vision_api_key = vision_api_key
        scrapper = Scrapper()
        self.article = scrapper.extract_article(article_url)
        self.extracted_articles = self.__get_similar_articles(scrapper)
        self.vision_api_url = f"https://vision.googleapis.com/v1/images:annotate?key={self.vision_api_key}"

    def __get_similar_articles(self, scrapper: Scrapper):
        similar_articles = self.__search(self.article['title'])
        extracted_articles = []
        for i, article in enumerate(similar_articles, start=1):
            extracted_article = scrapper.extract_article(article['link'])
            extracted_articles.append(extracted_article)
        return extracted_articles

    def __search(self, query: str, num_results: int = 10):
        """Search Google Custom Search API for the given query."""
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.api_key,
            "cx": self.cx,
            "q": query,
            "num": num_results,
        }
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json().get("items", [])
        except Exception as e:
            print(f"Error during search: {e}")
            return []

    def get_similar(self):
        return self.extracted_articles

    def get_images_data(self):
        images_data = []
        for image in self.article['images']:
            image_url = image['src']
            images_data.append(self.__analyze_web_detection(image_url))
        return images_data

    def __analyze_web_detection(self, image_url):
        """Fetch web detection results from Google Cloud Vision API."""
        payload = {
            "requests": [
                {
                    "image": {"source": {"imageUri": image_url}},
                    "features": [{"type": "WEB_DETECTION"}],
                }
            ]
        }
        try:
            response = requests.post(self.vision_api_url, json=payload)
            response.raise_for_status()  # Raise an error for HTTP issues
            response_data = response.json()

            # Check for API errors
            if "error" in response_data:
                raise Exception(f"Vision API Error: {response_data['error']['message']}")

            web_detection = response_data["responses"][0].get("webDetection", {})
            if not web_detection:
                print("No web detection results found.")
                return None

            # Extract web detection details
            entities = web_detection.get("webEntities", [])
            pages_with_matching_images = web_detection.get("pagesWithMatchingImages", [])
            full_matching_images = web_detection.get("fullMatchingImages", [])
            partial_matching_images = web_detection.get("partialMatchingImages", [])
            return {
                "entities": entities,
                "pages_with_matching_images": pages_with_matching_images,
                "full_matching_images": full_matching_images,
                "partial_matching_images": partial_matching_images,
            }
        except requests.RequestException as e:
            print(f"HTTP Request Error: {e}")
        except Exception as e:
            print(f"Error analyzing web detection: {e}")
        return None


G_API_KEY = 'AIzaSyCzoprS2n7aVkRIHeqrUpdnaD0y15sVHXI'
CX_ID = "f2b2655b7da834a7c"
VISION_API_KEY = 'AIzaSyBhep9MR0ioD2qSB8hWe0FHSxh71nehOkk'

url = "https://www.theguardian.com/us-news/2024/nov/26/massachusetts-death-bomb-threats-synagogue"
google_search = GoogleSearch(G_API_KEY, CX_ID, VISION_API_KEY, url)

print(google_search.get_images_data())
