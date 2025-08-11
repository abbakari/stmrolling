"""
Items and Product models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from decimal import Decimal


class CategoryManager(models.Manager):
    """Custom manager for Category model."""
    
    def active(self):
        """Get active categories."""
        return self.filter(is_active=True)
    
    def with_items_count(self):
        """Get categories with item counts."""
        return self.annotate(
            items_count=models.Count('items', filter=models.Q(items__is_active=True))
        )


class Category(models.Model):
    """
    Product category model with optimizations.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True
    )
    
    name = models.CharField(
        max_length=100,
        db_index=True
    )
    
    description = models.TextField(blank=True, null=True)
    
    # Hierarchy support
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        db_index=True
    )
    
    # Discount configuration for this category
    default_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Default discount percentage for items in this category"
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CategoryManager()

    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
        indexes = [
            models.Index(fields=['parent', 'is_active'], name='categories_parent_active_idx'),
            models.Index(fields=['code', 'is_active'], name='categories_code_active_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def full_path(self):
        """Get full category path."""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name

    def get_discount_percentage(self):
        """Get effective discount percentage (including parent categories)."""
        if self.default_discount_percentage > 0:
            return self.default_discount_percentage
        elif self.parent:
            return self.parent.get_discount_percentage()
        return Decimal('0.00')


class BrandManager(models.Manager):
    """Custom manager for Brand model."""
    
    def active(self):
        """Get active brands."""
        return self.filter(is_active=True)


class Brand(models.Model):
    """
    Product brand model with optimizations.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True
    )
    
    name = models.CharField(
        max_length=100,
        db_index=True
    )
    
    description = models.TextField(blank=True, null=True)
    
    # Discount configuration for this brand
    default_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Default discount percentage for items of this brand"
    )
    
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = BrandManager()

    class Meta:
        db_table = 'brands'
        verbose_name = 'Brand'
        verbose_name_plural = 'Brands'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class ItemManager(models.Manager):
    """Custom manager for Item model with optimizations."""
    
    def active(self):
        """Get active items."""
        return self.filter(is_active=True)
    
    def with_full_details(self):
        """Get items with all related data."""
        return self.select_related('category', 'brand').prefetch_related(
            'sales_budget_entries',
            'rolling_forecast_entries'
        )
    
    def by_category(self, category_id):
        """Get items by category."""
        return self.filter(category_id=category_id, is_active=True)
    
    def by_brand(self, brand_id):
        """Get items by brand."""
        return self.filter(brand_id=brand_id, is_active=True)


class Item(models.Model):
    """
    Product/Item model with performance optimizations.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        DISCONTINUED = 'discontinued', 'Discontinued'

    class UnitType(models.TextChoices):
        PIECE = 'pcs', 'Pieces'
        KILOGRAM = 'kg', 'Kilogram'
        LITER = 'ltr', 'Liter'
        METER = 'mtr', 'Meter'
        BOX = 'box', 'Box'
        CARTON = 'ctn', 'Carton'

    # Basic Information
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,  # Primary lookup field
        help_text="Unique item code/SKU"
    )
    
    name = models.CharField(
        max_length=200,
        db_index=True  # For name-based searches
    )
    
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    
    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='items',
        db_index=True
    )
    
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name='items',
        db_index=True
    )
    
    # Pricing
    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For price-based analysis
    )
    
    cost_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    unit_type = models.CharField(
        max_length=10,
        choices=UnitType.choices,
        default=UnitType.PIECE
    )
    
    # Inventory tracking
    current_stock = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For inventory queries
    )
    
    minimum_stock = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    # Performance tracking
    total_sales_ytd = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For sales analysis
    )
    
    total_quantity_sold_ytd = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = ItemManager()

    class Meta:
        db_table = 'items'
        verbose_name = 'Item'
        verbose_name_plural = 'Items'
        ordering = ['name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['category', 'is_active'], name='items_category_active_idx'),
            models.Index(fields=['brand', 'is_active'], name='items_brand_active_idx'),
            models.Index(fields=['status', 'category'], name='items_status_category_idx'),
            models.Index(fields=['unit_price', 'category'], name='items_price_category_idx'),
            models.Index(fields=['total_sales_ytd', 'brand'], name='items_sales_brand_idx'),
            models.Index(fields=['current_stock', 'minimum_stock'], name='items_stock_levels_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(unit_price__gte=0),
                name='items_unit_price_positive'
            ),
            models.CheckConstraint(
                check=models.Q(cost_price__gte=0),
                name='items_cost_price_positive'
            ),
            models.CheckConstraint(
                check=models.Q(current_stock__gte=0),
                name='items_current_stock_positive'
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def profit_margin(self):
        """Calculate profit margin percentage."""
        if self.unit_price > 0 and self.cost_price > 0:
            return ((self.unit_price - self.cost_price) / self.unit_price) * 100
        return 0

    @property
    def is_low_stock(self):
        """Check if item is below minimum stock level."""
        return self.current_stock <= self.minimum_stock

    def get_effective_discount(self):
        """Get effective discount based on category and brand."""
        category_discount = self.category.get_discount_percentage()
        brand_discount = self.brand.default_discount_percentage
        
        # Use the higher discount between category and brand
        return max(category_discount, brand_discount)

    def calculate_discounted_price(self):
        """Calculate price after applying discount."""
        discount_percentage = self.get_effective_discount()
        if discount_percentage > 0:
            discount_amount = (self.unit_price * discount_percentage) / 100
            return self.unit_price - discount_amount
        return self.unit_price

    def update_sales_ytd(self):
        """Update year-to-date sales from sales budget entries."""
        from apps.sales_budget.models import SalesBudget
        from django.utils import timezone
        
        current_year = timezone.now().year
        ytd_data = SalesBudget.objects.filter(
            item=self,
            year=current_year
        ).aggregate(
            total_amount=models.Sum('total_amount'),
            total_quantity=models.Sum('quantity')
        )
        
        self.total_sales_ytd = ytd_data['total_amount'] or 0
        self.total_quantity_sold_ytd = ytd_data['total_quantity'] or 0
        self.save(update_fields=['total_sales_ytd', 'total_quantity_sold_ytd', 'updated_at'])

    @classmethod
    def get_top_selling_items(cls, limit=10):
        """Get top selling items with caching."""
        cache_key = f'top_selling_items_{limit}'
        items = cache.get(cache_key)
        
        if items is None:
            items = list(
                cls.objects.filter(is_active=True)
                .order_by('-total_sales_ytd')[:limit]
                .select_related('category', 'brand')
            )
            cache.set(cache_key, items, 300)  # Cache for 5 minutes
        
        return items

    @classmethod
    def get_low_stock_items(cls):
        """Get items with low stock levels."""
        cache_key = 'low_stock_items'
        items = cache.get(cache_key)
        
        if items is None:
            items = list(
                cls.objects.filter(
                    is_active=True,
                    current_stock__lte=models.F('minimum_stock')
                ).select_related('category', 'brand')
            )
            cache.set(cache_key, items, 60)  # Cache for 1 minute (more frequent updates)
        
        return items


# Cache invalidation signals
@receiver([post_save, post_delete], sender=Item)
def invalidate_item_cache(sender, **kwargs):
    """Invalidate item-related cache when items are modified."""
    cache_keys = [
        'top_selling_items_10',
        'top_selling_items_20',
        'low_stock_items',
        'active_items_list',
    ]
    cache.delete_many(cache_keys)


@receiver([post_save, post_delete], sender=Category)
def invalidate_category_cache(sender, **kwargs):
    """Invalidate category-related cache."""
    cache.delete('active_categories_list')


@receiver([post_save, post_delete], sender=Brand)
def invalidate_brand_cache(sender, **kwargs):
    """Invalidate brand-related cache."""
    cache.delete('active_brands_list')
