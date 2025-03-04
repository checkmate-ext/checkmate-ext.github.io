from datetime import datetime
import requests
import concurrent.futures
from bs4 import BeautifulSoup
from ArticleExtractor import ArticleExtractor
import random
import json


def _extract_with_requests(url, min_text_length=300):
    """
    Attempt to fetch + parse article using requests + BeautifulSoup.
    Return a dict similar to what ArticleExtractor returns:
        {
            'title': str,
            'content': str,
            'date': None,
            'url': url,
            'images': [
                {
                    'src': str,  # full image URL
                    'alt': str,  # alternative text
                }
            ],
            'similarity_score': float
        }
    If the result seems too small or fails, return None to signal fallback.
    """
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Title extraction
        title_elem = soup.find("title")
        title = title_elem.get_text(strip=True) if title_elem else "No Title"

        # Extract text content
        text_content = soup.get_text(separator="\n").strip()

        # If the text is too short, treat it as "not enough data"
        if len(text_content) < min_text_length:
            return None

        # Image extraction
        images = []
        for img in soup.find_all('img'):
            # Get full image URL (absolute path)
            img_src = img.get('src')
            if img_src:
                # Convert relative URLs to absolute
                if not img_src.startswith(('http://', 'https://')):
                    from urllib.parse import urljoin
                    img_src = urljoin(url, img_src)

                images.append({
                    'src': img_src,
                    'alt': img.get('alt', '')
                })

        return {
            "title": title,
            "content": text_content,
            "date": None,
            "url": url,
            "images": images,
            "similarity_score": random.random()
        }
    except Exception as e:
        print(f"Lightweight fetch failed for {url}: {e}")
        return None


def _extract_article_hybrid(url, main_article=None):
    """
    Hybrid approach:
    1) Try requests + BeautifulSoup first.
    2) If that yields insufficient content, fallback to ArticleExtractor
       (which uses undetectable Chrome).
    """
    article_data = _extract_with_requests(url)
    if article_data is not None:
        if main_article is None:
            clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            clean_content = ' '.join(clean_content.split())
            try:
                response = requests.post(
                    "http://52.90.193.31:8000/predict",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                )
                response.raise_for_status()
                article_data['objectivity_score'] = response.json().get('score', random.random())
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting objectivity score from API: {e}")
                article_data['objectivity_score'] = -1
        else:
            article_data['similarity_score'] = random.random()
        return article_data

    try:
        scrapper = ArticleExtractor()
        article_data = scrapper.extract_article(url)
        if main_article is None:
            clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            clean_content = ' '.join(clean_content.split())
            try:
                response = requests.post(
                    "http://52.90.193.31:8000/predict",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                )
                response.raise_for_status()
                article_data['objectivity_score'] = response.json().get('score', random.random())
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting objectivity score from API: {e}")
                article_data['objectivity_score'] = -1
        else:
            article_data['similarity_score'] = random.random()
        if scrapper.driver:
            scrapper.driver.quit()
        return article_data
    except Exception as e:
        print(f"Browser-based extraction failed for {url}: {e}")
        return None


class ArticleAnalyzer:
    def __init__(self, api_key: str, cx: str, vision_api_key: str, article_url: str):
        self.api_key = api_key
        self.cx = cx
        self.vision_api_key = vision_api_key

        self.article = _extract_article_hybrid(article_url)
        print("Main Article:", self.article)

        # Retrieve similar articles (in parallel)
        self.extracted_articles = self.__get_similar_articles()

        # Vision API endpoint
        self.vision_api_url = f"https://vision.googleapis.com/v1/images:annotate?key={self.vision_api_key}"

    def __get_similar_articles(self):
        # 1) Search for similar articles by the main article title
        similar_articles = self.__search(self.article.get('title', ''))

        # 2) Collect the links
        urls = [item['link'] for item in similar_articles if 'link' in item]

        # 3) Parallel extraction
        extracted_articles = []

        with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
            future_to_url = {
                executor.submit(_extract_article_hybrid, url, self.article): url
                for url in urls
            }
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    data = future.result()
                    if data:
                        extracted_articles.append(data)
                except Exception as e:
                    print(f"Error extracting {url}: {e}")

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
        # If the main article lacks an 'images' field, handle gracefully
        for image in self.article.get('images', []):
            image_url = image.get('src')
            if image_url:
                images_data.append(self.__analyze_web_detection(image_url))
        return images_data

    def __analyze_web_detection(self, image_url: str):
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
