from datetime import datetime
import requests
import concurrent.futures
from bs4 import BeautifulSoup
from ArticleExtractor import ArticleExtractor
import random
import json
from typing import Optional, List, Dict
from urllib.parse import urljoin, urlparse
import re

def normalize_url(url: str, base_url: str) -> Optional[str]:
    """Normalize relative URLs to absolute URLs."""
    if not url:
        return None
    if bool(urlparse(url).netloc):
        return url
    return urljoin(base_url, url)

def _extract_with_requests(url: str, min_text_length: int = 300):
    """
    Fetch and parse an article using requests and BeautifulSoup.
    Extract the title, text content, and images using multiple heuristics.
    Improved to use ArticleExtractor's effective content and image extraction methods.
    """
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Title extraction
        title_elem = soup.find("title")
        title = title_elem.get_text(strip=True) if title_elem else "No Title"

        # Find main content using ArticleExtractor's approach
        main_content = find_main_content(soup)

        # Extract text content from main content if available, otherwise from the whole page
        if main_content:
            text_content = clean_content(main_content)
        else:
            text_content = soup.get_text(separator="\n").strip()

        # If the text is too short, fallback by returning None
        if len(text_content) < min_text_length:
            return None

        # Extract images using ArticleExtractor's approach
        images = extract_images(main_content if main_content else soup, url)

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

def find_main_content(soup):
    """Identify the main article content using standard selectors and, if needed, a text density fallback."""
    # Try common semantic and regex-based selectors first.
    main_content_candidates = [
        ("article", None),
        ("main", None),
        ("div", {"id": re.compile(r'(content|main|article|primary|body)', re.I)}),
        ("div", {"class": re.compile(r'(content|main|article|primary|body|post|entry)', re.I)}),
        ("section", {"class": re.compile(r'(article|content|post)', re.I)}),
    ]

    for tag, attrs in main_content_candidates:
        try:
            candidate = soup.find(tag, attrs)
            if candidate and len(candidate.get_text(strip=True)) > 300:
                return candidate
        except Exception as e:
            print(f"Error finding main content with {tag}, {attrs}: {e}")
            continue

    # Fallback: use a text density heuristic on all <div> elements.
    candidates = soup.find_all('div')
    best_candidate = None
    best_score = 0

    for candidate in candidates:
        paragraphs = candidate.find_all('p')
        if not paragraphs:
            continue
        text = candidate.get_text(separator=' ', strip=True)
        score = len(text) * len(paragraphs)  # density score

        if score > best_score and len(text) > 300:
            best_score = score
            best_candidate = candidate

    if best_candidate:
        return best_candidate

    # Final fallback: concatenate all paragraph tags into a new container.
    paragraphs = soup.find_all("p")
    if paragraphs:
        wrapper_div = soup.new_tag("div")
        for p in paragraphs:
            wrapper_div.append(p)
        return wrapper_div

    return soup.body

def clean_content(element):
    """Extract text from paragraphs, removing short or empty ones."""
    if not element:
        return ''

    try:
        paragraphs = element.find_all('p')
        cleaned_paragraphs = []
        for p in paragraphs:
            text = p.get_text().strip()
            if text and len(text) > 20:
                cleaned_paragraphs.append(text)
        return '\n\n'.join(cleaned_paragraphs)
    except Exception as e:
        print(f"Error cleaning content: {e}")
        return ''

def extract_images(content_element, base_url) -> List[Dict[str, str]]:
    """Extract images from the article content using multiple search methods."""
    if not content_element:
        return []

    image_sources = set()
    images = []

    search_methods = [
        lambda: content_element.find_all("img", src=True),
        lambda: content_element.find_all("img", {"class": re.compile(r"(image|photo)", re.I)}),
        lambda: content_element.select('img[src*="/"]')
    ]

    for method in search_methods:
        try:
            found_images = method()
            for img in found_images:
                image_data = process_image_element(img, base_url)
                if image_data and image_data['src'] not in image_sources:
                    image_sources.add(image_data['src'])
                    images.append(image_data)
        except Exception as e:
            print(f"Error in image search method: {e}")

    return images

def process_image_element(img, base_url) -> Optional[Dict[str, str]]:
    """
    Process an individual image element and extract relevant data.
    Uses a more robust approach from ArticleExtractor.
    """
    try:
        # Get image source
        src = img.get("src")

        # Skip invalid sources
        if not src or src.startswith("data:") or src.startswith("blob:"):
            # Attempt to find lazy-loading attributes
            for attr in ['data-src', 'data-original-src', 'data-lazy-src']:
                if img.get(attr):
                    src = img.get(attr)
                    break
            if not src or src.startswith("data:") or src.startswith("blob:"):
                return None

        # Normalize URL
        src = normalize_url(src, base_url)
        if not src:
            return None

        # Use the enhanced validation from ArticleExtractor
        if not is_valid_article_image_enhanced(img):
            return None

        return {
            'src': src,
            'alt': img.get('alt', ''),
            'title': img.get('title', ''),
            'width': img.get('width', ''),
            'height': img.get('height', '')
        }
    except Exception as e:
        print(f"Error processing image element: {e}")
        return None

def is_valid_article_image_enhanced(img) -> bool:
    """
    Enhanced version of is_valid_article_image that combines both approaches.
    Uses the best parts from both ArticleAnalyzer and ArticleExtractor.
    """
    # 1) Check dimensions (using a compromise between the two implementations)
    MIN_DIMENSION = 200  # A middle ground between 100 (ArticleExtractor) and 300 (ArticleAnalyzer)

    width = img.get('width')
    height = img.get('height')
    if width and height:
        try:
            if int(width) < MIN_DIMENSION or int(height) < MIN_DIMENSION:
                return False
        except ValueError:
            pass  # If the width/height aren't numeric, we'll just keep going.

    # 2) Check image src for ad-related keywords.
    src = (img.get("src") or "").lower()
    ad_src_keywords = [
        "simgad", "dianomi", "doubleclick", "adserver", "adimg",
        "googlesyndication", "adservice", "taboola"
    ]
    if any(keyword in src for keyword in ad_src_keywords):
        return False

    # 3) Check for ad/sponsored keywords in alt or title attributes.
    alt_text = (img.get("alt") or "").lower()
    title_text = (img.get("title") or "").lower()
    ad_text_keywords = [
        "advert", "advertisement", "sponsored", "promo", "taboola",
        "googleads", "ad banner", "paid partnership", "commercial",
        "recommended", "sponsor"
    ]
    if any(keyword in alt_text for keyword in ad_text_keywords):
        return False
    if any(keyword in title_text for keyword in ad_text_keywords):
        return False

    # 4) Traverse parent elements to check for ad indicators (from both implementations)
    parent_indicators = []
    parent = img.parent
    while parent and hasattr(parent, 'name') and parent.name:
        # If it's an <a> tag, check href for ad/spammy keywords
        if parent.name == "a" and parent.get("href"):
            href = parent.get("href").lower()
            if any(kw in href for kw in ["googleads", "adserver", "doubleclick", "taboola"]):
                return False

        # Collect class and id attributes
        if "class" in parent.attrs:
            if isinstance(parent.attrs["class"], list):
                parent_indicators.extend(parent.attrs["class"])
            else:
                parent_indicators.append(parent.attrs["class"])
        if "id" in parent.attrs:
            parent_indicators.append(parent.attrs["id"])

        parent = parent.parent

    indicators_text = " ".join(parent_indicators).lower()

    # Combined list of ad indicators from both implementations
    ad_indicators = [
        "ad", "advert", "advertisement", "sponsor", "sponsored", "promo",
        "taboola", "googleads", "ad-container", "ad-box", "doubleclick",
        "googlesyndication", "commercial", "partner", "outbrain",
        "recommend", "recommended", "you-may-like", "sponsored-stories",
        "thumbnail", "teaser", "widget", "sidebar", "banner",
        "preview", "icon", "logo", "social", "share", "suggestion",
        "next-article", "related"
    ]

    # If any known ad/sponsored/thumbnail keywords appear in parent classes/IDs, skip.
    if any(indicator in indicators_text for indicator in ad_indicators):
        return False

    return True

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
        """
        Fetch web detection results from Google Cloud Vision API and apply extra filtering:
          - Pre-check: if the image URL itself contains ad indicators, skip it.
          - After detection: if any of the top 3 entities contain disallowed ad-related words,
            skip the image.
        """
        # Pre-check on URL
        ad_indicators_url = [
            "simgad", "dianomi", "doubleclick", "adserver", "googlesyndication", "adservice"
        ]
        if any(indicator in image_url.lower() for indicator in ad_indicators_url):
            print(f"Skipping image {image_url} due to ad keyword in URL.")
            return None

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
            response.raise_for_status()  # Raise error for HTTP issues
            response_data = response.json()

            # Check for API errors.
            if "error" in response_data:
                raise Exception(f"Vision API Error: {response_data['error']['message']}")

            web_detection = response_data["responses"][0].get("webDetection", {})
            if not web_detection:
                print("No web detection results found.")
                return None

            # Filter and sort entities (with non-empty description)
            entities = web_detection.get("webEntities", [])
            entities = [e for e in entities if e.get("description")]
            if not entities:
                print("No entities with description found.")
                return None

            # Sort entities by score (defaulting to 0 if missing) and take the top three.
            entities = sorted(entities, key=lambda x: x.get("score", 0), reverse=True)
            top_entities = entities[:3]

            # Define disallowed entity keywords that suggest the image might be an ad.
            disallowed_entities = [
                "logo", "advert", "advertisement", "sponsored", "promo", "taboola",
                "googleads", "ad", "banner", "commercial", "adserver", "doubleclick"
            ]

            # Check if any of the top entities are disallowed.
            for entity in top_entities:
                desc = entity.get("description", "").lower()
                if any(bad in desc for bad in disallowed_entities):
                    print(f"Skipping image {image_url} due to disallowed entity: '{desc}'.")
                    return None

            return {
                "entities": top_entities,
                "pages_with_matching_images": web_detection.get("pagesWithMatchingImages", []),
                "full_matching_images": web_detection.get("fullMatchingImages", []),
                "partial_matching_images": web_detection.get("partialMatchingImages", []),
            }
        except requests.RequestException as e:
            print(f"HTTP Request Error: {e}")
        except Exception as e:
            print(f"Error analyzing web detection: {e}")
        return None
