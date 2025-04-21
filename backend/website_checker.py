from sqlalchemy import text  
from models import db  
from urllib.parse import urlparse

def get_domain_from_url(url):
    """
    Extract the main domain name from a URL.
    
    Args:
        url (str): The full URL to parse
        
    Returns:
        str: The main domain name without subdomains
    """
    # Parse the URL
    parsed = urlparse(url)
    # Get the network location (hostname)
    hostname = parsed.netloc
    
    # Split hostname by dots and get the main domain parts
    parts = hostname.split('.')
    
    # Handle www and other subdomains
    if parts[0] == 'www':
        parts = parts[1:]
    
    # Return the main domain name
    return parts[0]


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
