from datetime import datetime
import requests
import concurrent.futures
from bs4 import BeautifulSoup
from tldextract import tldextract

from ArticleExtractor import ArticleExtractor
import random
import json
from typing import Optional, List, Dict
from urllib.parse import urljoin, urlparse
import re
from website_checker import check_website_score
from textblob import TextBlob
from spellchecker import SpellChecker

def get_misspellings(text: str):
    # 1) Create a local SpellChecker instance
    spell = SpellChecker()
    # 2) Pull out only “words” of letters/apostrophes (2+ chars)
    raw = re.findall(r"\b[a-zA-Z']{2,}\b", text)
    # 3) Drop tokens that start with an uppercase letter
    filtered = [tok for tok in raw if not tok[0].isupper()]
    # 4) Lowercase for spell-checking
    words = [w.lower() for w in filtered]
    # 5) Spell-check with our local instance
    misspelled = spell.unknown(words)
    return words, misspelled

def normalize_domain(url: str) -> str:
    """
    Normalize domain names using tldextract to properly handle
    different subdomains and variations of the same publisher.

    Examples:
    - www.bbc.com -> bbc
    - sports.bbc.co.uk -> bbc
    - edition.cnn.com -> cnn
    - news.cnn.com -> cnn

    Args:
        url (str): The URL to normalize

    Returns:
        str: The normalized domain name (registered domain without TLD)
    """
    if not url:
        return ""

    try:
        # Extract domain parts using tldextract
        extracted = tldextract.extract(url)

        # Return the registered domain (without subdomains)
        return extracted.domain
    except Exception as e:
        print(f"Error normalizing domain for {url}: {e}")
        return url  # Return the original URL if parsing fails


def check_similarity(text1: str, text2: str) -> float:
    import os
    from google import genai
    import numpy as np

    # 1) Grab your key (now you know it’s valid)
    api_key = os.getenv("GENAI_API_KEY")
    if not api_key:
        raise RuntimeError("GENAI_API_KEY is not set")

    client = genai.Client(api_key=api_key)

    # 2) Embed both texts
    resp1 = client.models.embed_content(
        model="text-embedding-004",
        contents=text1,
    )
    resp2 = client.models.embed_content(
        model="text-embedding-004",
        contents=text2,
    )

    v1 = np.array(resp1.embeddings[0].values)
    v2 = np.array(resp2.embeddings[0].values)

    # 3) Compute cosine similarity
    dot = np.dot(v1, v2)
    norm = np.linalg.norm(v1) * np.linalg.norm(v2)
    if norm == 0:
        return 0.0
    return float(dot / norm)

def normalize_url(url: str, base_url: str) -> Optional[str]:
    """Normalize relative URLs to absolute URLs."""
    if not url:
        return None
    if bool(urlparse(url).netloc):
        return url
    return urljoin(base_url, url)

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

def _extract_with_requests(url: str, min_text_length: int = 100):
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

        return {
            "title": title,
            "content": text_content,
            "date": date,
            "url": url,
        }
    except Exception as e:
        print(f"Lightweight fetch failed for {url}: {e}")
        return None

def _extract_article_hybrid(url, main_article=None):
    article_data = _extract_with_requests(url)
    if article_data is not None:
        if main_article is None:
            # CLEAN AND GET SUBJECTIVITY
            clean_content = article_data['content'].replace('\n', ' ').replace('\r', ' ')
            clean_content = ' '.join(clean_content.split())
            #
            # ─── SPELL-CHECK via get_misspellings ───
            words, misspelled = get_misspellings(clean_content)

            article_data['spelling_issues']   = len(misspelled)
            article_data['linguistic_issues'] = len(misspelled)

            # debug output
            print(f"[SPELL-CHECK] Vocabulary size: {len(set(words))} unique words")
            print(f"[SPELL-CHECK] Found {len(misspelled)} misspelled word(s):")
            if misspelled:
                print("  " + ", ".join(sorted(misspelled)))

            try:
                resp = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/subjectivity",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                    timeout=120,
                )
                resp.raise_for_status()
                article_data['objectivity_score'] = resp.json().get('objectivity_prob', -1)
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting text-based objectivity: {e}")
                article_data['objectivity_score'] = -1

            # 2) title-based subjectivity
            try:
                title_resp = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/subjectivity",
                    headers={"Content-Type": "application/json"},
                    json={"text": article_data.get("title", "")},
                    timeout=120,
                )
                title_resp.raise_for_status()
                article_data['title_objectivity_score'] = title_resp.json().get('objectivity_prob', -1)
                print(f"title_objectivity_score: {article_data['title_objectivity_score']}")
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting title-based objectivity: {e}")
                article_data['title_objectivity_score'] = -1

            # BIAS
            try:
                bias_response = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/political",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                    timeout=120,
                )
                bias_response.raise_for_status()
                bias_json = bias_response.json()
                article_data['bias_prediction'] = bias_json.get('prediction', 'Unknown')
                article_data['bias_probabilities'] = bias_json.get('probabilities', {})
                print(f"bias_prediction is {article_data['bias_prediction']}")
                print(f"bias_probabilities are {article_data['bias_probabilities']}")
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting bias data from API: {e}")
                article_data['bias_prediction'] = 'Unknown'
                article_data['bias_probabilities'] = {}

        else:
            # SIMILARITY to main article (unchanged)
            main_clean = ' '.join(main_article['content'].split())
            sim_clean = ' '.join(article_data['content'].split())
            article_data['similarity_score'] = check_similarity(sim_clean, main_clean)
        return article_data

    try:
        scrapper = ArticleExtractor()
        article_data = scrapper.extract_article(url)

        # Check if we actually got meaningful content
        if not article_data.get('content') or len(article_data.get('content', '')) < 100:
            print(f"Browser-based extraction failed to get sufficient content for {url}")

            if scrapper.driver:
                scrapper.driver.quit()
            return None

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
            clean_content = ' '.join(article_data['content'].split())


            words, misspelled = get_misspellings(clean_content)

            # record counts
            article_data['spelling_issues']   = len(misspelled)
            article_data['linguistic_issues'] = len(misspelled)

            # debug output
            print(f"[SPELL-CHECK] Vocabulary size: {len(set(words))} unique words")
            print(f"[SPELL-CHECK] Found {len(misspelled)} misspelled word(s):")
            if misspelled:
                print("  " + ", ".join(sorted(misspelled)))

            try:
                resp = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/subjectivity",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                    timeout=120,
                )
                resp.raise_for_status()
                article_data['objectivity_score'] = resp.json().get('objectivity_prob', -1)
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting text-based objectivity: {e}")
                article_data['objectivity_score'] = -1

            # 2) title-based subjectivity
            try:
                title_resp = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/subjectivity",
                    headers={"Content-Type": "application/json"},
                    json={"text": article_data.get("title", "")},
                    timeout=120,
                )
                title_resp.raise_for_status()
                article_data['title_objectivity_score'] = title_resp.json().get('objectivity_prob', -1)
                print(f"title_objectivity_score: {article_data['title_objectivity_score']}")
            except (requests.RequestException, ValueError, KeyError) as e:
                print(f"Error getting title-based objectivity: {e}")
                article_data['title_objectivity_score'] = -1

            try:
                bias_response = requests.post(
                    "https://checkmate-api-1029076451566.us-central1.run.app/political",
                    headers={"Content-Type": "application/json"},
                    json={"text": clean_content},
                    timeout=120,
                )
                bias_response.raise_for_status()
                bias_json = bias_response.json()
                article_data['bias_prediction'] = bias_json.get('prediction', 'Unknown')
                article_data['bias_probabilities'] = bias_json.get('probabilities', {})
            except:
                article_data['bias_prediction'] = 'Unknown'
                article_data['bias_probabilities'] = {}

        else:
            # similarity to main_article unchanged
            article_data['similarity_score'] = check_similarity(
                ' '.join(article_data['content'].split()),
                ' '.join(main_article['content'].split())
            )
        if scrapper.driver:
            scrapper.driver.quit()
        return article_data
    except Exception as e:
        if 'scrapper' in locals() and scrapper.driver:
            scrapper.driver.quit()
        return None

class ArticleExtractionError(Exception):
    """Raised when an article cannot be extracted properly."""
    pass

class ArticleAnalyzer:
    def __init__(self, api_key: str, cx: str, article_url: str):
        print("[DEBUG] ArticleAnalyzer: Initializing for URL:", article_url)
        self.api_key = api_key
        self.cx = cx

        # Extract the main article
        self.article = _extract_article_hybrid(article_url)
        print("[DEBUG] ArticleAnalyzer: Article title used for search:", self.article.get('title', ''))

        if self.article is None:
            raise ArticleExtractionError(f"Failed to extract content from {article_url}")

        if not validate_article_data(self.article):
            raise ArticleExtractionError(f"Failed to extract meaningful content from {article_url}")

        print("[DEBUG] ArticleAnalyzer: Main article extracted successfully. Title:", self.article.get('title'))

        # Retrieve similar articles (in parallel)
        self.extracted_articles = self.__get_similar_articles()
        print(f"[DEBUG] ArticleAnalyzer: Retrieved {len(self.extracted_articles)} similar articles.")

        # ─ reliability call ─
        cred_info  = check_website_score(self.article['url'])
        cred_val   = cred_info.get("credibility_score")
        credibility_score = {0:"credible",1:"mixed",2:"uncredible"}.get(cred_val, "mixed")
        similarity_scores = [
            max(0.0, min(art.get('similarity_score', 0.0), 1.0))
            for art in self.extracted_articles
        ]

        # ── NEW: spelling error % ──
        clean = ' '.join(self.article['content'].split())
        words, misspelled = get_misspellings(clean)
        total_words = len(words) or 1
        spelling_error_pct = len(misspelled) / total_words
        self.article['pct'] = spelling_error_pct
        print(f"[SPELL-CHECK] {len(misspelled)} misspellings out of {total_words} words "
              f"→ {spelling_error_pct:.2f}% errors")

        # ─── BUILD UPDATED PAYLOAD ───
        rel_payload = {
            "bias_probs":            self.article.get('bias_probabilities', {}),
            "objectivity_score":     self.article.get('objectivity_score', -1),
            "title_objectivity":     self.article.get('title_objectivity_score', -1),
            "credibility_score":     credibility_score,
            "similarity_scores":     similarity_scores,
            "grammatical_error_rate":    spelling_error_pct,
        }
        print("[DEBUG] Reliability payload:", rel_payload)

        print("content:", self.article)
        try:
            rel_resp = requests.post(
                "https://checkmate-api-1029076451566.us-central1.run.app/reliability",
                json=rel_payload, timeout=120
            )
            rel_resp.raise_for_status()
            rel_json = rel_resp.json()
            # <-- pick up the right field:
            self.article['reliability_score'] = rel_json.get('reliability', -1)
            print(f"[DEBUG] reliability_score: {self.article['reliability_score']}")

        except requests.RequestException as e:
            body = getattr(e.response, 'text', '<no body>')
            print(f"[DEBUG] Error getting reliability score: {e}\nResponse body: {body}")
            self.article['reliability_score'] = -1


    def __get_similar_articles(self):
        """
        Get similar articles from Google Custom Search API using the article title.
        Extracts full content from URLs to calculate accurate similarity scores.
        But uses Google-provided titles for display to avoid unnecessary parsing.
        """
        print("[DEBUG] ArticleAnalyzer: Starting similar articles retrieval using title:", self.article.get('title', ''))
        similar_articles = self.__search(self.article.get('title', ''))
        print("[DEBUG] ArticleAnalyzer: Google Custom Search returned", len(similar_articles), "results.")

        # Extract the main article's domain for comparison
        main_article_domain = normalize_domain(self.article['url'])
        print(f"[DEBUG] ArticleAnalyzer: Main article domain (normalized): {main_article_domain}")

        # Create a mapping of URLs to their Google-provided titles
        url_to_title_map = {}
        filtered_urls = []

        for item in similar_articles:
            if 'link' not in item:
                continue

            url = item['link']
            google_title = item.get('title', '')  # Store Google title
            current_domain = normalize_domain(url)

            # Skip this URL if it's from the same domain as the main article
            if current_domain == main_article_domain:
                print(f"[DEBUG] ArticleAnalyzer: Skipping URL from same domain: {url} ({current_domain})")
                continue

            # Store the mapping and add URL to filtered list
            url_to_title_map[url] = google_title
            filtered_urls.append(url)

        print(f"[DEBUG] ArticleAnalyzer: Filtered from {len(similar_articles)} to {len(filtered_urls)} URLs after domain normalization.")

        # Extract content from filtered URLs (in parallel)
        extracted_articles = []
        with concurrent.futures.ProcessPoolExecutor(max_workers=4) as executor:
            future_to_url = {
                executor.submit(_extract_article_hybrid, url, self.article): url
                for url in filtered_urls
            }
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    print(f"[DEBUG] ArticleAnalyzer: Extracting article from URL: {url}")
                    data = future.result()
                    if data:
                        # Use the Google-provided title (when available)
                        if url in url_to_title_map and url_to_title_map[url]:
                            data['google_title'] = url_to_title_map[url]

                        extracted_articles.append(data)
                        print(f"[DEBUG] ArticleAnalyzer: Extraction successful for {url}")
                    else:
                        print(f"[DEBUG] ArticleAnalyzer: No data extracted for {url}")
                except Exception as e:
                    print(f"[DEBUG] ArticleAnalyzer: Error extracting {url}: {e}")

        return extracted_articles



    def __search(self, query: str, num_results: int = 10):
        print("[DEBUG] ArticleAnalyzer: Performing Google Custom Search with query:", query)
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
            search_response = response.json()
            print("[DEBUG] ArticleAnalyzer: Raw search response:", search_response)
            search_results = search_response.get("items", [])
            print("[DEBUG] ArticleAnalyzer: Search API returned", len(search_results), "items.")
            return search_results
        except Exception as e:
            print("[DEBUG] ArticleAnalyzer: Error during search:", e)
            return []


    def get_similar(self):
        """Return similar articles with accurate similarity scores and Google titles."""
        # Create a display-friendly version of similar articles with Google titles
        display_articles = []
        for article in self.extracted_articles:
            display_article = {
                'url': article['url'],
                # Use Google title if available, otherwise fallback to extracted title
                'title': article.get('google_title', article.get('title', 'Untitled Article')),
                'similarity_score': article.get('similarity_score', 0.5)
            }
            display_articles.append(display_article)

        # Sort by similarity score (highest first)
        display_articles.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)

        print(f"[DEBUG] ArticleAnalyzer: Returning {len(display_articles)} similar articles.")
        return display_articles
