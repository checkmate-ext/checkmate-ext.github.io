import re
import json
import random
from typing import Optional, List, Dict
from datetime import datetime
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from urllib.parse import urljoin, urlparse

class ArticleExtractor:
    def __init__(self, use_proxy=False, proxy=None):
        options = uc.ChromeOptions()

        # Essential configuration
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--start-maximized')
        options.add_argument('--disable-popup-blocking')

        if use_proxy and proxy:
            options.add_argument(f'--proxy-server={proxy}')

        options.add_argument('--disable-blink-features')
        options.add_argument('--disable-notifications')
        options.add_argument(f'--window-size={random.randint(1050, 1920)},{random.randint(800, 1080)}')
        options.add_argument('--accept-lang=en-US,en')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')

        # Initialize driver safely
        self.driver = None
        try:
            self.driver = uc.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.set_page_load_timeout(40)
        except Exception as e:
            print(f"Error initializing the Chrome driver: {e}")

    def normalize_url(self, url, base_url):
        """Normalize relative URLs to absolute URLs."""
        if not url:
            return None
        if bool(urlparse(url).netloc):
            return url
        return urljoin(base_url, url)

    def extract_article(self, url):
        # Clear cookies and cache
        if not self.driver:
            return {
                'title': '',
                'content': 'Could not initialize driver.',
                'date': None,
                'url': url,
                'images': []
            }

        try:
            self.driver.delete_all_cookies()
        except Exception as e:
            print(f"Error deleting cookies: {e}")

        try:
            self.driver.get(url)
        except Exception as e:
            print(f"Error navigating to {url}: {e}")
            return {
                'title': '',
                'content': 'Page load error',
                'url': url,
                'images': []
            }

        try:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        except Exception as e:
            print(f"Error executing scroll script: {e}")

        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        title = self.find_title(soup)
        content_element = self.find_main_content(soup)
        content = self.clean_content(content_element) if content_element else ''
        images = self.extract_images(content_element, url) if content_element else []

        if not content or len(content) < 100:
            content = "Could not extract meaningful content"

        return {
            'title': title,
            'content': content,
            'url': url,
            'images': images
        }

    def find_main_content(self, soup):
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

    def extract_images(self, content_element, base_url) -> List[Dict[str, str]]:
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
                    image_data = self.process_image_element(img, base_url)
                    if image_data and image_data['src'] not in image_sources:
                        image_sources.add(image_data['src'])
                        images.append(image_data)
            except Exception as e:
                print(f"Error in image search method: {e}")

        return images

    def process_image_element(self, img, base_url) -> Optional[Dict[str, str]]:
        """Process an individual image element and extract relevant data."""
        try:
            src = img.get("src")
            if not src or src.startswith("data:") or src.startswith("blob:"):
                for attr in ['data-src', 'data-original-src', 'data-lazy-src']:
                    if img.get(attr):
                        src = img.get(attr)
                        break
                if not src or src.startswith("data:") or src.startswith("blob:"):
                    return None
            src = self.normalize_url(src, base_url)
            if not src:
                return None
            if not self.is_valid_article_image(img):
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

    def is_valid_article_image(self, img) -> bool:
        """Check if the image is a valid article image."""
        width = img.get('width')
        height = img.get('height')
        if width and height:
            try:
                if int(width) < 100 or int(height) < 100:
                    return False
            except ValueError:
                pass

        parent_classes = []
        parent = img.parent
        while parent and parent.name:
            if 'class' in parent.attrs:
                parent_classes.extend(parent.attrs['class'])
            parent = parent.parent

        skip_indicators = [
            'ad', 'advertisement', 'sponsor', 'promo', 'related', 'sidebar',
            'preview', 'thumbnail', 'icon', 'logo', 'banner', 'social',
            'share', 'recommended', 'suggestion', 'next-article'
        ]

        return not any(indicator in ' '.join(parent_classes).lower() for indicator in skip_indicators)

    def find_title(self, soup):
        """Attempt to find the page's title by multiple methods."""
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
        return ''

    def clean_content(self, element):
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