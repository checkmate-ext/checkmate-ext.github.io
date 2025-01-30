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
        # Check if the URL is already absolute
        if bool(urlparse(url).netloc):
            return url
        # Join the relative URL with the base URL
        return urljoin(base_url, url)

    def extract_article(self, url):
        # Clear cookies and cache
        if not self.driver:
            # If the driver couldn't be initialized, return fallback
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

        # Navigate to the page
        try:
            self.driver.get(url)
        except Exception as e:
            print(f"Error navigating to {url}: {e}")
            return {
                'title': '',
                'content': 'Page load error',
                'date': None,
                'url': url,
                'images': []
            }

        # Execute scroll to load dynamic content
        try:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        except Exception as e:
            print(f"Error executing scroll script: {e}")

        soup = BeautifulSoup(self.driver.page_source, 'html.parser')

        # Extract content
        title = self.find_title(soup)
        content_element = self.find_main_content(soup)
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

    def find_main_content(self, soup):
        """Identify the main content of the webpage using multiple heuristics."""
        main_content_candidates = [
            # Semantic HTML5 tags
            ("article", None),
            ("main", None),

            # ID-based selection with regex for more matches
            ("div", {"id": re.compile(r'(content|main|article|primary|body)', re.I)}),

            # Class-based selection with regex
            ("div", {"class": re.compile(r'(content|main|article|primary|body|post|entry)', re.I)}),

            # Specific semantic selectors
            ("section", {"class": re.compile(r'(article|content|post)', re.I)}),
        ]

        # Try predefined selectors
        for tag, attrs in main_content_candidates:
            try:
                main_content = soup.find(tag, attrs)
                if main_content:
                    return main_content
            except Exception as e:
                print(f"Error finding main content with {tag}, {attrs}: {e}")
                continue

        # Advanced heuristics for finding content
        try:
            divs = soup.find_all("div")
            text_rich_divs = [
                div for div in divs if len(div.get_text(strip=True)) > 300
            ]
            if text_rich_divs:
                # Sort by text length and return the most text-rich div
                main_content = max(text_rich_divs, key=lambda d: len(d.get_text(strip=True)))
                return main_content
        except Exception as e:
            print(f"Error finding text-rich div: {e}")

        # Paragraph-based fallback
        try:
            paragraphs = soup.find_all("p")
            text_paragraphs = [p for p in paragraphs if len(p.get_text(strip=True)) > 50]
            if text_paragraphs:
                wrapper_div = soup.new_tag("div")
                for p in text_paragraphs:
                    wrapper_div.append(p)
                return wrapper_div
        except Exception as e:
            print(f"Error finding paragraphs: {e}")

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
            src = self.normalize_url(src, base_url)
            if not src:
                return None

            # Skip small images and advertisements
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

        return not any(indicator in ' '.join(parent_classes).lower()
                       for indicator in skip_indicators)

    def find_date(self, soup) -> Optional[str]:
        """Extract article publication date using multiple methods."""
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

        # Check meta tags
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

        # Check JSON-LD structured data
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

        # Look for time tags
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

        # Search for dates in text
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
        """Convert various date formats to YYYY-MM-DD without raising exceptions."""
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

        # If parsing fails entirely, just return None (no exception thrown)
        print(f"Could not parse date: {date_str}")
        return None

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