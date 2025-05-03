from sqlalchemy import text  
from models import db
from urllib.parse import urlparse

import tldextract

def get_domain_from_url(url):
    """
    Extract the main domain name from a URL using tldextract.

    Args:
        url (str): The full URL to parse

    Returns:
        str: The main domain name without subdomains
    """
    if not url:
        return ""

    try:
        # Extract domain parts using tldextract
        extracted = tldextract.extract(url)

        # Return the registered domain (without subdomains)
        # This handles all edge cases with different TLDs properly
        return extracted.domain
    except Exception as e:
        print(f"Error extracting domain from {url}: {e}")
        return ""

def check_website_score(url):
    domain = get_domain_from_url(url)

    try:
        query = text("SELECT credibility_score FROM trusted_websites WHERE website_name = :domain")
        website = db.session.execute(query, {"domain": domain}).fetchone()

        if website:
            return {"website": domain, "credibility_score": website[0]}
        else:
            return {"website": domain, "credibility_score": None, "message": "Website not found in database."}

    except Exception as e:
        return {"error": str(e)}