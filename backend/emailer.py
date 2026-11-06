import os
import re
import ipaddress
import logging
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    if resp.status_code >= 400:
        try:
            info = resp.json()
        except ValueError:
            info = {}
        if info.get("code") in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
            logger.warning(f"Email paused: {info.get('code')} ({resp.status_code}): {info.get('message', '')}")
        else:
            logger.error(f"Email send failed: {resp.status_code} {resp.text}")
        resp.raise_for_status()
    return resp.json().get("id")


def welcome_email_html() -> str:
    brand = escape(EMAIL_FROM_NAME)
    return (
        '<table role="presentation" width="100%" style="background:#050505"><tr><td align="center" style="padding:32px 16px">'
        '<table role="presentation" width="560" style="max-width:560px;background:#0a0a0a;border:1px solid #27272a">'
        '<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#ffffff">'
        '<p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#dfff00;font-weight:bold">You\'re on the list</p>'
        f'<h1 style="margin:0 0 16px;font-size:34px;line-height:1;text-transform:uppercase;color:#ffffff">Welcome to my world.</h1>'
        '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#d4d4d8">Real talk — thank you for pulling up. '
        'Hip-hop is life over here, and now you\'re part of it.</p>'
        '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#d4d4d8">Here\'s what lands in your inbox from now on:</p>'
        '<ul style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.8;color:#d4d4d8">'
        '<li>Free beat drops before anyone else</li>'
        '<li>Promos and early access on new merch</li>'
        '<li>First word on new projects and collabs</li>'
        '</ul>'
        '<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d4d4d8">Artists, songwriters, singers, producers — '
        'if you\'ve got something to say, reply to this email and let\'s get to work.</p>'
        '<p style="margin:0;font-size:16px;font-weight:bold;color:#ff3300;text-transform:uppercase;letter-spacing:2px">— Dez</p>'
        '</td></tr>'
        f'<tr><td style="padding:16px 32px;border-top:1px solid #27272a;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#71717a">'
        f'Sent by {brand} because you signed up for the mailing list. We never ask for your password or card details by email.'
        '</td></tr></table></td></tr></table>'
    )
