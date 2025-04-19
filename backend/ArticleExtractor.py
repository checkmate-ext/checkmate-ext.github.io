import re
import json
import random
import time
from typing import Optional, List, Dict
from datetime import datetime
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from urllib.parse import urljoin, urlparse
import requests


class ArticleExtractor:
    def __init__(self, use_proxy=False, proxy=None):
        options = uc.ChromeOptions()
        # Essential configuration
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--start-maximized')
        options.add_argument('--disable-popup-blocking')
        options.add_argument('--headless')          # ← run in headless mode
        options.add_argument('--disable-gpu')       # ← disable GPU (good practice with headless)

        # Set a custom user agent to help bypass anti-bot measures
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                             "AppleWebKit/537.36 (KHTML, like Gecko) "
                             "Chrome/112.0.0.0 Safari/537.36")

        if use_proxy and proxy:
            options.add_argument(f'--proxy-server={proxy}')

        options.add_argument('--disable-blink-features')
        options.add_argument('--disable-notifications')
        options.add_argument(f'--window-size={random.randint(1050, 1920)},{random.randint(800, 1080)}')
        options.add_argument('--accept-lang=en-US,en')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')

        # Initialize driver safely and increase page load timeout
        self.driver = None
        try:
            self.driver = uc.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.set_page_load_timeout(60)  # Increased timeout
        except Exception as e:
            print(f"Error initializing the Chrome driver: {e}")

    def normalize_url(self, url, base_url):
        if not url:
            return None
        if bool(urlparse(url).netloc):
            return url
        return urljoin(base_url, url)

    def extract_article(self, url):
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

        # Retry mechanism for loading the page (explicit wait removed)
        max_retries = 2
        for attempt in range(max_retries):
            try:
                self.driver.get(url)
                break  # Exit loop if successful
            except Exception as e:
                print(f"Error loading page (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    return {
                        'title': '',
                        'content': 'Page load error',
                        'date': None,
                        'url': url,
                        'images': []
                    }
                try:
                    self.driver.delete_all_cookies()
                except Exception as e:
                    print(f"Error deleting cookies on retry: {e}")
                time.sleep(1)  # brief pause before retrying

        try:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        except Exception as e:
            print(f"Error executing scroll script: {e}")

        soup = BeautifulSoup(self.driver.page_source, 'html.parser')

        # Use the enhanced methods first, with fallback to original heuristics
        title = self.find_enhanced_title(soup) or self.find_title(soup)
        content_element = self.find_enhanced_content(soup) or self.find_main_content(soup)
        content = self.clean_content(content_element) if content_element else ''
        date = self.find_date(soup)
        images = self.extract_images(content_element, url) if content_element else []

        if not content or len(content) < 100:
            content = "Could not extract meaningful content"

        return {
            'title': title,
            'content': content,
            'date': date,
            'url': url,
            'images': images
        }

    def find_enhanced_title(self, soup):
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

    def find_enhanced_content(self, soup):
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

    def find_main_content(self, soup):
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

    def extract_images(self, content_element, base_url) -> List[Dict[str, str]]:
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

    def find_date(self, soup) -> Optional[str]:
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
                    standardized = self.standardize_date(date_str)
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
                        standardized = self.standardize_date(date.split('T')[0])
                        if standardized:
                            return standardized
            except Exception as e:
                print(f"Error parsing JSON-LD date: {e}")

        try:
            time_tag = soup.find('time')
            if time_tag:
                datetime_attr = time_tag.get('datetime') or time_tag.get('content')
                if datetime_attr:
                    standardized = self.standardize_date(datetime_attr.split('T')[0])
                    if standardized:
                        return standardized
        except Exception as e:
            print(f"Error parsing time tag: {e}")

        for pattern in date_patterns:
            try:
                date_match = re.search(pattern, str(soup))
                if date_match:
                    standardized = self.standardize_date(date_match.group())
                    if standardized:
                        return standardized
            except Exception as e:
                print(f"Error matching date pattern '{pattern}': {e}")

        return None

    def standardize_date(self, date_str: str) -> Optional[str]:
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

    def find_title(self, soup):
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

    def clean_content(self, element):
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
