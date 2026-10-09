"""All database tables. Mirrors the original store schema so existing data can be imported."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, BigInteger, Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric,
    String, Text, UniqueConstraint, Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base

J = JSON().with_variant(JSONB(), "postgresql")


def now():
    return datetime.now(timezone.utc)


def pk():
    return Column(Uuid, primary_key=True, default=uuid.uuid4)


def created():
    return Column(DateTime(timezone=True), default=now, nullable=False)


def updated():
    return Column(DateTime(timezone=True), default=now, onupdate=now, nullable=False)


# ---------- Auth ----------
class User(Base):
    __tablename__ = "users"
    id = pk()
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = created()


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role"),)
    id = pk()
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # admin | staff | user
    created_at = created()


class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(Text); email = Column(Text); phone = Column(Text)
    address = Column(Text); city = Column(Text); postal_code = Column(Text); avatar_url = Column(Text)
    created_at = created(); updated_at = updated()


# ---------- Catalogue ----------
class Product(Base):
    __tablename__ = "products"
    id = pk()
    slug = Column(Text, unique=True, nullable=False, index=True)
    name = Column(Text, nullable=False)
    brand = Column(Text, nullable=False, default="Timera")
    collection = Column(Text, nullable=False, default="")
    category = Column(Text)
    product_type = Column(Text, nullable=False, default="watch")  # watch | perfume
    price = Column(Numeric(12, 2), nullable=False, default=0)
    sale_price = Column(Numeric(12, 2))
    compare_at = Column(Numeric(12, 2))
    image_url = Column(Text, nullable=False, default="")
    gallery = Column(J, nullable=False, default=list)
    videos = Column(J, default=list)
    colors = Column(J, nullable=False, default=list)
    sizes = Column(J, nullable=False, default=list)
    features = Column(J, nullable=False, default=list)
    movement = Column(Text, nullable=False, default="")
    case_material = Column(Text, nullable=False, default="")
    strap = Column(Text, nullable=False, default="")
    water_resistance = Column(Text, nullable=False, default="")
    fragrance_family = Column(Text); concentration = Column(Text); size_ml = Column(Integer)
    top_notes = Column(J, nullable=False, default=list)
    heart_notes = Column(J, nullable=False, default=list)
    base_notes = Column(J, nullable=False, default=list)
    longevity = Column(Text); sillage = Column(Text); gender = Column(Text)
    rating = Column(Numeric(3, 2), nullable=False, default=5)
    reviews = Column(Integer, nullable=False, default=0)
    badge = Column(Text)
    stock = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=False, default="")
    featured = Column(Boolean, nullable=False, default=False)
    active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    deal_id = Column(Uuid)
    seo_title = Column(Text); seo_description = Column(Text); seo_keywords = Column(Text)
    created_at = created(); updated_at = updated()


class Collection(Base):
    __tablename__ = "collections"
    id = pk(); name = Column(Text, nullable=False); slug = Column(Text, unique=True, nullable=False)
    tagline = Column(Text); image_url = Column(Text)
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class Category(Base):
    __tablename__ = "categories"
    id = pk(); name = Column(Text, nullable=False); slug = Column(Text, unique=True, nullable=False)
    description = Column(Text); image_url = Column(Text)
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class Deal(Base):
    __tablename__ = "deals"
    id = pk(); title = Column(Text, nullable=False); slug = Column(Text, unique=True)
    subtitle = Column(Text); description = Column(Text); badge = Column(Text)
    discount_percent = Column(Integer, nullable=False, default=0); code = Column(Text)
    image_url = Column(Text); cta_label = Column(Text); cta_href = Column(Text)
    starts_at = Column(DateTime(timezone=True)); ends_at = Column(DateTime(timezone=True))
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class Coupon(Base):
    __tablename__ = "coupons"
    id = pk(); code = Column(Text, unique=True, nullable=False); description = Column(Text)
    discount_type = Column(Text, nullable=False, default="percent")  # percent | fixed
    discount_value = Column(Numeric(12, 2), nullable=False, default=0)
    min_order = Column(Numeric(12, 2), nullable=False, default=0)
    usage_limit = Column(Integer); used_count = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime(timezone=True)); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class HeroSlide(Base):
    __tablename__ = "hero_slides"
    id = pk(); eyebrow = Column(Text); title = Column(Text, nullable=False); title_accent = Column(Text)
    description = Column(Text); cta_label = Column(Text); cta_href = Column(Text)
    image_url = Column(Text, nullable=False, default=""); video_url = Column(Text)
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class Popup(Base):
    __tablename__ = "popups"
    id = pk(); title = Column(Text, nullable=False); message = Column(Text); image_url = Column(Text)
    badge = Column(Text); cta_label = Column(Text); cta_href = Column(Text); coupon_code = Column(Text)
    delay_seconds = Column(Integer, nullable=False, default=5)
    trigger_type = Column(Text, nullable=False, default="delay")
    frequency = Column(Text, nullable=False, default="session")
    starts_at = Column(DateTime(timezone=True)); ends_at = Column(DateTime(timezone=True))
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class Review(Base):
    __tablename__ = "reviews"
    id = pk(); product_id = Column(Uuid, ForeignKey("products.id", ondelete="SET NULL"))
    customer_name = Column(Text, nullable=False); customer_role = Column(Text)
    rating = Column(Integer, nullable=False, default=5); title = Column(Text); body = Column(Text)
    approved = Column(Boolean, nullable=False, default=False); featured = Column(Boolean, nullable=False, default=False)
    created_at = created(); updated_at = updated()


class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = pk(); slug = Column(Text, unique=True, nullable=False); title = Column(Text, nullable=False)
    excerpt = Column(Text); content = Column(Text); author = Column(Text, nullable=False, default="Timera")
    category = Column(Text, nullable=False, default="Journal"); image_url = Column(Text)
    published = Column(Boolean, nullable=False, default=True)
    published_at = Column(DateTime(timezone=True), nullable=False, default=now)
    created_at = created(); updated_at = updated()


class Faq(Base):
    __tablename__ = "faqs"
    id = pk(); question = Column(Text, nullable=False); answer = Column(Text, nullable=False)
    category = Column(Text); sort_order = Column(Integer, nullable=False, default=0)
    active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class TrustSection(Base):
    __tablename__ = "trust_sections"
    id = pk(); group_name = Column(Text, nullable=False); heading = Column(Text, nullable=False)
    body = Column(Text); bullets = Column(J, nullable=False, default=list); icon = Column(Text)
    sort_order = Column(Integer, nullable=False, default=0); active = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


# ---------- Orders ----------
class Order(Base):
    __tablename__ = "orders"
    id = pk()
    order_number = Column(Text, unique=True, nullable=False, index=True)
    user_id = Column(Uuid)
    customer_name = Column(Text, nullable=False); customer_email = Column(Text, nullable=False)
    customer_phone = Column(Text); shipping_address = Column(Text); city = Column(Text)
    payment_method = Column(Text, nullable=False, default="cod")
    items = Column(J, nullable=False, default=list)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    shipping = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    coupon_code = Column(Text)
    status = Column(Text, nullable=False, default="pending")
    status_history = Column(J, nullable=False, default=list)
    notes = Column(Text); tracking_number = Column(Text); courier = Column(Text)
    estimated_delivery = Column(DateTime(timezone=True))
    idempotency_key = Column(Text, unique=True)
    utm_source = Column(Text); utm_medium = Column(Text); utm_campaign = Column(Text)
    utm_content = Column(Text); utm_term = Column(Text)
    fbclid = Column(Text); fbp = Column(Text); fbc = Column(Text)
    attribution = Column(J, nullable=False, default=dict)
    purchase_event_id = Column(Text)
    created_at = created(); updated_at = updated()


class OrderEmail(Base):
    __tablename__ = "order_emails"
    id = pk(); order_id = Column(Uuid); order_number = Column(Text)
    recipient = Column(Text, nullable=False); customer_name = Column(Text)
    template = Column(Text, nullable=False); subject = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="queued"); error = Column(Text)
    created_at = created()


class CartLead(Base):
    __tablename__ = "cart_leads"
    id = pk(); session_id = Column(Text, unique=True, nullable=False); user_id = Column(Uuid)
    name = Column(Text); email = Column(Text); phone = Column(Text); address = Column(Text); city = Column(Text)
    stage = Column(Text, nullable=False, default="cart")  # cart | checkout | ordered
    items = Column(J, nullable=False, default=list); item_count = Column(Integer, nullable=False, default=0)
    cart_value = Column(Numeric(12, 2), nullable=False, default=0); currency = Column(Text, nullable=False, default="PKR")
    order_number = Column(Text); page_path = Column(Text); referrer = Column(Text); user_agent = Column(Text)
    contacted = Column(Boolean, nullable=False, default=False); notes = Column(Text)
    created_at = created(); updated_at = updated()


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = pk(); event_name = Column(Text, nullable=False, index=True); session_id = Column(Text)
    page_path = Column(Text); referrer = Column(Text); product_id = Column(Uuid)
    product_slug = Column(Text); product_name = Column(Text); order_number = Column(Text)
    value = Column(Numeric(12, 2)); currency = Column(Text, nullable=False, default="PKR")
    metadata_ = Column("metadata", J, nullable=False, default=dict); user_agent = Column(Text)
    created_at = created()


class MetaEventLog(Base):
    __tablename__ = "meta_event_log"
    __table_args__ = (UniqueConstraint("event_name", "event_id", "event_source"),)
    id = pk(); event_name = Column(Text, nullable=False); event_id = Column(Text, nullable=False)
    event_source = Column(Text, nullable=False, default="server"); order_number = Column(Text); order_id = Column(Uuid)
    value = Column(Numeric(12, 2)); currency = Column(Text, nullable=False, default="PKR")
    status = Column(Text, nullable=False, default="pending"); error = Column(Text); fbtrace_id = Column(Text)
    events_received = Column(Integer); test_event = Column(Boolean, nullable=False, default=False)
    attribution = Column(J, nullable=False, default=dict)
    created_at = created()


class MetaInsightDaily(Base):
    __tablename__ = "meta_insights_daily"
    id = pk(); date_start = Column(Date, nullable=False); level = Column(Text, nullable=False)
    campaign_id = Column(Text); campaign_name = Column(Text); adset_id = Column(Text); adset_name = Column(Text)
    ad_id = Column(Text); ad_name = Column(Text)
    spend = Column(Numeric(14, 2), nullable=False, default=0); impressions = Column(BigInteger, nullable=False, default=0)
    clicks = Column(BigInteger, nullable=False, default=0); purchases = Column(BigInteger, nullable=False, default=0)
    purchase_value = Column(Numeric(14, 2), nullable=False, default=0); currency = Column(Text, nullable=False, default="PKR")
    synced_at = Column(DateTime(timezone=True), nullable=False, default=now)


# ---------- Singletons ----------
class SiteSettings(Base):
    __tablename__ = "site_settings"
    id = pk()
    brand_name = Column(Text, nullable=False, default="Timera"); brand_suffix = Column(Text)
    brand_tagline = Column(Text); logo_url = Column(Text)
    marquee_enabled = Column(Boolean, nullable=False, default=True); marquee_items = Column(J, nullable=False, default=list)
    featured_in = Column(J, nullable=False, default=list); warranty_years = Column(Integer, nullable=False, default=1)
    nav_links = Column(J, nullable=False, default=list); footer_links = Column(J, nullable=False, default=list)
    contact_email = Column(Text); contact_phone = Column(Text); contact_hours = Column(Text)
    whatsapp_number = Column(Text); address = Column(Text)
    instagram_url = Column(Text); facebook_url = Column(Text); tiktok_url = Column(Text); youtube_url = Column(Text)
    feature_enabled = Column(Boolean, nullable=False, default=False); feature_eyebrow = Column(Text)
    feature_title = Column(Text); feature_title_accent = Column(Text); feature_description = Column(Text)
    feature_cta_label = Column(Text); feature_cta_href = Column(Text); feature_image_url = Column(Text)
    feature_ends_at = Column(DateTime(timezone=True))
    hero_video_url = Column(Text)
    video_wrist_url = Column(Text); video_wrist_title = Column(Text)
    video_showcase_url = Column(Text); video_showcase_title = Column(Text)
    video_ugc_url = Column(Text); video_ugc_title = Column(Text)
    meta_pixel_id = Column(Text); google_tag_id = Column(Text); google_ads_purchase_label = Column(Text)
    tracking_enabled = Column(Boolean, nullable=False, default=True)
    created_at = created(); updated_at = updated()


class PaymentSettings(Base):
    __tablename__ = "payment_settings"
    id = pk()
    currency = Column(Text, nullable=False, default="PKR"); currency_symbol = Column(Text, nullable=False, default="Rs")
    cod_enabled = Column(Boolean, nullable=False, default=True); cod_charge = Column(Numeric(12, 2), nullable=False, default=0)
    delivery_charge = Column(Numeric(12, 2), nullable=False, default=250)
    free_delivery_above = Column(Numeric(12, 2), nullable=False, default=5000)
    easypaisa_enabled = Column(Boolean, nullable=False, default=False); easypaisa_number = Column(Text); easypaisa_account_name = Column(Text)
    jazzcash_enabled = Column(Boolean, nullable=False, default=False); jazzcash_number = Column(Text); jazzcash_account_name = Column(Text)
    bank_enabled = Column(Boolean, nullable=False, default=False); bank_name = Column(Text); bank_account_title = Column(Text)
    bank_account_number = Column(Text); bank_iban = Column(Text)
    warranty_months = Column(Integer, nullable=False, default=12); warranty_note = Column(Text, nullable=False, default="1–2 year warranty depending on product")
    payment_note = Column(Text)
    created_at = created(); updated_at = updated()


class MetaSettings(Base):
    __tablename__ = "meta_settings"
    id = pk(); pixel_id = Column(Text); ad_account_id = Column(Text)
    api_version = Column(Text, nullable=False, default="v21.0"); test_event_code = Column(Text)
    capi_enabled = Column(Boolean, nullable=False, default=True); marketing_api_enabled = Column(Boolean, nullable=False, default=False)
    last_sync_at = Column(DateTime(timezone=True)); last_error = Column(Text)
    created_at = created(); updated_at = updated()
