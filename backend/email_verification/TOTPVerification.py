import pyotp
from base64 import b32encode
import hashlib


class TOTPVerification:
    def __init__(self, secret_key):
        self.secret_key = secret_key

    def generate_secret(self, email):
        # Create unique secret based on email and app secret
        unique = f"{email}:{self.secret_key}"
        return b32encode(hashlib.sha256(unique.encode()).digest()).decode('utf-8')

    def generate_code(self, email):
        secret = self.generate_secret(email)
        totp = pyotp.TOTP(secret, interval=300)  # 10 minute validity
        return totp.now()

    def verify_code(self, email, code):
        secret = self.generate_secret(email)
        totp = pyotp.TOTP(secret, interval=300)
        return totp.verify(code)
