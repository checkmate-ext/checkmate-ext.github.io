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


def check_similarity(text1, text2):
    import os
    from google import genai
    import numpy as np

    # Get API key from environment variables
    api_key = os.getenv("GENAI_API_KEY")

    if not api_key:
        print("Warning: GENAI_API_KEY not found in environment variables")
        return 0.0

    client = genai.Client(api_key=api_key)

    result1 = client.models.embed_content(
        model="text-embedding-004",
        contents=text1,
    )

    result2 = client.models.embed_content(
        model="text-embedding-004",
        contents=text2,
    )

    embedding1 = np.array(result1.embeddings[0].values)
    embedding2 = np.array(result2.embeddings[0].values)

    def cosine_similarity(vec1, vec2):
        dot_product = np.dot(vec1, vec2)
        norm_vec1 = np.linalg.norm(vec1)
        norm_vec2 = np.linalg.norm(vec2)
        return dot_product / (norm_vec1 * norm_vec2)

    similarity = cosine_similarity(embedding1, embedding2)
    print(f"Cosine Similarity: {similarity}")
    return float(similarity)


def normalize_url(url: str, base_url: str) -> Optional[str]:
    """Normalize relative URLs to absolute URLs."""
    if not url:
        return None
    if bool(urlparse(url).netloc):
        return url
    return urljoin(base_url, url)


def is_valid_article_image(img) -> bool:
    """
    Check if the image is a valid article image.
    Uses width/height attributes and inspects the image source, alt/title attributes,
    and parent elements for common ad/sponsored/thumbnail keywords.
    """

    # 1) Enforce a larger minimum dimension to skip small thumbnails.
    MIN_DIMENSION = 300

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

    # 4) Traverse parent elements to check for:
    #    - anchor tags with ad keywords in href
    #    - class/id indicating "ad", "sponsored", "promo", "thumbnail", etc.
    parent_indicators = []
    parent = img.parent
    while parent:
        # If it's an <a> tag, check href for ad/spammy keywords
        if parent.name == "a" and parent.get("href"):
            href = parent.get("href").lower()
            if any(kw in href for kw in ["googleads", "adserver", "doubleclick", "taboola"]):
                return False

        # Collect class and id attributes
        if "class" in parent.attrs:
            parent_indicators.extend(parent.attrs["class"])
        if "id" in parent.attrs:
            parent_indicators.append(parent.attrs["id"])

        parent = parent.parent

    indicators_text = " ".join(parent_indicators).lower()

    # Common parent indicators for ads, sponsored sections, or small thumbnails
    ad_indicators = [
        "ad", "advert", "advertisement", "sponsor", "sponsored", "promo",
        "taboola", "googleads", "ad-container", "ad-box", "doubleclick",
        "googlesyndication", "commercial", "partner", "outbrain",
        "recommend", "recommended", "you-may-like", "sponsored-stories",
        "thumbnail", "teaser", "widget", "sidebar", "banner"
    ]

    # If any known ad/sponsored/thumbnail keywords appear in parent classes/IDs, skip.
    if any(indicator in indicators_text for indicator in ad_indicators):
        return False

    return True


def process_image_element(img, base_url: str) -> Optional[Dict[str, str]]:
    """
    Process an individual image element and extract its data.
    If the image source is missing or looks like a data/blob URI,
    attempts to use lazy-loading attributes.
    """
    try:
        src = img.get("src")
        if not src or src.startswith("data:") or src.startswith("blob:"):
            for attr in ['data-src', 'data-original-src', 'data-lazy-src']:
                if img.get(attr):
                    src = img.get(attr)
                    break
            if not src or src.startswith("data:") or src.startswith("blob:"):
                return None

        src = normalize_url(src, base_url)
        if not src:
            return None

        if not is_valid_article_image(img):
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


def find_enhanced_title(soup):
    """Extract title using advanced selectors, copied from ArticleExtractor."""
    meta_title = soup.find('meta', property='og:title')
    if meta_title and meta_title.get('content'):
        return meta_title.get('content').strip()

    h1_candidates = soup.find_all('h1')
    for h in h1_candidates:
        text = h.get_text().strip()
        if text and len(text) > 10:
            if h.has_attr('class'):
                class_str = ' '.join(h['class']).lower()
                if 'headline' in class_str or 'title' in class_str:
                    return text
            else:
                return text

    title_tag = soup.find('title')
    if title_tag:
        return title_tag.get_text().strip()

    return ""


def find_enhanced_content(soup):
    """Find the main content using advanced selectors, copied from ArticleExtractor."""
    selectors = [
        ('div', {'class': re.compile(r'(ArticleBody|article-body|entry-content|content-body)', re.I)}),
        ('article', None),
        ('section', {'class': re.compile(r'(article|content)', re.I)})
    ]

    for tag, attrs in selectors:
        try:
            candidate = soup.find(tag, attrs=attrs)
            if candidate:
                paragraphs = candidate.find_all('p')
                if paragraphs and len(paragraphs) > 3:
                    return candidate
        except Exception as e:
            print(f"Error using enhanced selector {tag} with attrs {attrs}: {e}")

    try:
        divs = soup.find_all("div")
        text_rich_divs = [div for div in divs if len(div.get_text(strip=True)) > 300]
        if text_rich_divs:
            candidate = max(text_rich_divs, key=lambda d: len(d.get_text(strip=True)))
            return candidate
    except Exception as e:
        print(f"Error finding text-rich div: {e}")

    return soup.body


def find_main_content(soup):
    """Find the main content with common patterns, copied from ArticleExtractor."""
    main_content_candidates = [
        ("article", None),
        ("main", None),
        ("div", {"id": re.compile(r'(content|main|article|primary|body)', re.I)}),
        ("div", {"class": re.compile(r'(content|main|article|primary|body|post|entry)', re.I)}),
        ("section", {"class": re.compile(r'(article|content|post)', re.I)})
    ]

    for tag, attrs in main_content_candidates:
        try:
            candidate = soup.find(tag, attrs=attrs)
            if candidate:
                return candidate
        except Exception as e:
            print(f"Error finding main content with {tag}, {attrs}: {e}")
            continue

    try:
        divs = soup.find_all("div")
        text_rich_divs = [div for div in divs if len(div.get_text(strip=True)) > 300]
        if text_rich_divs:
            candidate = max(text_rich_divs, key=lambda d: len(d.get_text(strip=True)))
            return candidate
    except Exception as e:
        print(f"Error finding text-rich div: {e}")

    try:
        paragraphs = soup.find_all("p")
        if paragraphs:
            wrapper_div = soup.new_tag("div")
            for p in paragraphs:
                wrapper_div.append(p)
            return wrapper_div
    except Exception as e:
        print(f"Error finding paragraphs: {e}")

    return soup.body


def extract_images(content_element, base_url):
    """Extract images from content, copied from ArticleExtractor."""
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


def find_title(soup):
    """Backup method to find title, copied from ArticleExtractor."""
    for title_finder in [
        lambda s: s.find('h1', class_=re.compile(r'title|headline|article-title', re.I)),
        lambda s: s.find('h1'),
        lambda s: s.find('meta', property='og:title'),
        lambda s: s.find('meta', {'name': 'title'}),
        lambda s: s.find('title')
    ]:
        try:
            element = title_finder(soup)
            if element:
                if element.name in ['meta']:
                    return element.get('content', '').strip()
                return element.get_text().strip()
        except Exception as e:
            print(f"Error finding title with {title_finder.__name__}: {e}")
    return ""


def clean_content(element):
    """Clean the content by extracting paragraphs, copied from ArticleExtractor."""
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


def find_date(soup):
    """Find the publication date using various methods, copied from ArticleExtractor."""
    date_patterns = [
        r'\d{4}-\d{2}-\d{2}',
        r'\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
        r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        r'\d{1,2}/\d{1,2}/\d{4}',
        r'(\d+)\s*(weeks?|months?|years?)\s+ago',
        r'half\s+an?\s+(hour|day)\s+ago',
        r'a\s+few\s+(minutes|hours|days|weeks)\s+ago',
        r'yesterday'
    ]

    for meta_property in [
        'article:published_time',
        'og:published_time',
        'publication_date',
        'date',
        'datePublished',
        'publish_date'
    ]:
        try:
            meta = (soup.find('meta', property=meta_property)
                    or soup.find('meta', attrs={'name': meta_property}))
            if meta and meta.get('content'):
                date_str = meta['content'].split('T')[0]
                standardized = standardize_date(date_str)
                if standardized:
                    return standardized
        except Exception as e:
            print(f"Error parsing meta date ({meta_property}): {e}")

    script_tags = soup.find_all('script', type='application/ld+json')
    for script in script_tags:
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                date = data.get('datePublished') or data.get('dateCreated')
                if date:
                    standardized = standardize_date(date.split('T')[0])
                    if standardized:
                        return standardized
        except Exception as e:
            print(f"Error parsing JSON-LD date: {e}")

    try:
        time_tag = soup.find('time')
        if time_tag:
            datetime_attr = time_tag.get('datetime') or time_tag.get('content')
            if datetime_attr:
                standardized = standardize_date(datetime_attr.split('T')[0])
                if standardized:
                    return standardized
    except Exception as e:
        print(f"Error parsing time tag: {e}")

    for pattern in date_patterns:
        try:
            date_match = re.search(pattern, str(soup))
            if date_match:
                standardized = standardize_date(date_match.group())
                if standardized:
                    return standardized
        except Exception as e:
            print(f"Error matching date pattern '{pattern}': {e}")

    return None


def standardize_date(date_str):
    """Standardize date to YYYY-MM-DD format, copied from ArticleExtractor."""
    date_formats = [
        '%Y-%m-%d',
        '%B %d, %Y',
        '%d %B %Y',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d',
    ]
    date_str = date_str.strip()
    for fmt in date_formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            return parsed_date.strftime('%Y-%m-%d')
        except ValueError:
            continue
    print(f"Could not parse date: {date_str}")
    return None


def is_valid_content(content: str) -> bool:
    """
    Check if the extracted content is valid and meaningful.
    Returns False if content is too short, contains error messages,
    or doesn't appear to be actual article content.
    """
    if not content or len(content) < 100:
        return False

    # Check for common error messages or placeholder text
    error_indicators = [
        'could not extract meaningful content',
        'page load error',
        'could not initialize driver',
        'failed to extract',
        'no content found',
        'access denied',
        'robot check',
        'captcha'
    ]

    if any(indicator in content.lower() for indicator in error_indicators):
        return False

    # Check for actual paragraphs (simple heuristic)
    paragraphs = content.split('\n\n')
    valid_paragraphs = [p for p in paragraphs if len(p.strip()) > 40]

    if len(valid_paragraphs) < 2:
        return False

    return True


def validate_article_data(article_data: dict) -> bool:
    """
    Validate the complete article data to ensure it's a proper article.
    Returns True if the article appears valid, False otherwise.
    """
    if not article_data:
        return False

    # Check if we have the minimum required fields
    if not all(key in article_data for key in ['title', 'content', 'url']):
        return False

    # Title should be meaningful
    if not article_data.get('title') or len(article_data.get('title', '')) < 5:
        return False

    # Content should be valid
    if not is_valid_content(article_data.get('content', '')):
        return False

    return True


def _extract_with_requests(url: str, min_text_length: int = 300):
    """
    Fetch and parse an article using requests and BeautifulSoup.
    Extract the title, text content, and images using multiple heuristics.
    Enhanced with methods from ArticleExtractor.
    Returns None if extraction fails or content is insufficient.
    """
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Title extraction using enhanced methods
        title = find_enhanced_title(soup) or find_title(soup)

        # Content extraction using enhanced methods
        content_element = find_enhanced_content(soup) or find_main_content(soup)
        text_content = clean_content(content_element) if content_element else ''

        # Date extraction
        date = find_date(soup)

        # If the text is too short or contains error indicators, return None
        if len(text_content) < min_text_length:
            return None

        # Check for error messages or placeholder text
        error_indicators = [
            'could not extract meaningful content',
            'page load error',
            'could not initialize driver',
            'failed to extract',
            'no content found',
            'access denied',
            'robot check',
            'captcha'
        ]

        if any(indicator in text_content.lower() for indicator in error_indicators):
            print(f"Requests extraction returned error content for {url}")
            return None

        # Image extraction
        images = extract_images(content_element, url) if content_element else []

        return {
            "title": title,
            "content": text_content,
            "date": date,
            "url": url,
            "images": images,
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
    3) If both methods fail, return None (which will trigger an ArticleExtractionError)
    """
    article_data = _extract_with_requests(url)
    if article_data is not None:
        if main_article is None:
            clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            clean_content = ' '.join(clean_content.split())
            print(clean_content)
            try:
                print("before request :DDDDDDD")
                response = requests.post(
                    "http://54.152.36.106:8000/subjectivity",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                    timeout=5,
                )
                response.raise_for_status()
                print("after request:DDDDDD")
                article_data['objectivity_score'] = response.json().get('objectivity_prob', -1)
                print('object: is', article_data['objectivity_score'])
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting objectivity score from API: {e}")
                article_data['objectivity_score'] = -1
        else:
            main_clean_content = main_article['content'].replace('\n', ' ').replace('\r', ' ')
            main_clean_content = ' '.join(main_clean_content.split())

            similar_clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            similar_clean_content = ' '.join(similar_clean_content.split())
            article_data['similarity_score'] = check_similarity(similar_clean_content, main_clean_content)
        return article_data

    # If the requests+BeautifulSoup approach failed, try the browser-based approach
    try:
        scrapper = ArticleExtractor()
        article_data = scrapper.extract_article(url)

        # Check if we actually got meaningful content
        if not article_data.get('content') or len(article_data.get('content', '')) < 100:
            print(f"Browser-based extraction failed to get sufficient content for {url}")
            if scrapper.driver:
                scrapper.driver.quit()
            return None

        # Also check for error messages in the content
        error_indicators = [
            'could not extract meaningful content',
            'page load error',
            'could not initialize driver',
            'failed to extract',
            'no content found',
            'access denied',
            'robot check',
            'captcha'
        ]

        content = article_data.get('content', '').lower()
        if any(indicator in content for indicator in error_indicators):
            print(f"Browser-based extraction returned error content for {url}")
            if scrapper.driver:
                scrapper.driver.quit()
            return None

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
            main_clean_content = main_article['content'].replace('\n', ' ').replace('\r', ' ')
            main_clean_content = ' '.join(main_clean_content.split())

            similar_clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            similar_clean_content = ' '.join(similar_clean_content.split())
            article_data['similarity_score'] = check_similarity(similar_clean_content, main_clean_content)
        if scrapper.driver:
            scrapper.driver.quit()
        return article_data
    except Exception as e:
        print(f"Browser-based extraction failed for {url}: {e}")
        if 'scrapper' in locals() and scrapper.driver:
            scrapper.driver.quit()
        return None


# Define a custom exception for article extraction errors
class ArticleExtractionError(Exception):
    """Raised when an article cannot be extracted properly."""
    pass


class ArticleAnalyzer:
    def __init__(self, api_key: str, cx: str, vision_api_key: str, article_url: str):
        self.api_key = api_key
        self.cx = cx
        self.vision_api_key = vision_api_key

        print("testing :D")
        # Extract the main article
        self.article = _extract_article_hybrid(article_url)
        print("passed the extract hybrid :DDD")
        # Raise an error if article extraction failed
        if self.article is None:
            raise ArticleExtractionError(f"Failed to extract content from {article_url}")

        # Validate the article data using our comprehensive validation function
        if not validate_article_data(self.article):
            raise ArticleExtractionError(f"Failed to extract meaningful content from {article_url}")

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
