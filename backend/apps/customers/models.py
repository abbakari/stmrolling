"""
Customer models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomerManager(models.Manager):
    """Custom manager for Customer model with optimizations."""
    
    def active(self):
        """Get active customers."""
        return self.filter(is_active=True)
    
    def with_sales_data(self):
        """Get customers with prefetched sales data."""
        return self.select_related().prefetch_related(
            'sales_budget_entries',
            'rolling_forecast_entries'
        )
    
    def by_salesperson(self, salesperson_id):
        """Get customers assigned to a specific salesperson."""
        return self.filter(salesperson_id=salesperson_id, is_active=True)


class Customer(models.Model):
    """
    Customer model with database optimizations.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        PROSPECT = 'prospect', 'Prospect'
        SUSPENDED = 'suspended', 'Suspended'

    class Category(models.TextChoices):
        PREMIUM = 'premium', 'Premium'
        STANDARD = 'standard', 'Standard'
        BASIC = 'basic', 'Basic'

    # Basic Information
    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,  # Primary lookup field
        help_text="Unique customer code"
    )
    
    name = models.CharField(
        max_length=200,
        db_index=True  # For name-based searches
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True  # For status filtering
    )
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.STANDARD,
        db_index=True  # For category-based analysis
    )
    
    # Contact Information
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Business Information
    credit_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For credit analysis
    )
    
    payment_terms = models.PositiveIntegerField(
        default=30,
        help_text="Payment terms in days"
    )
    
    # Relationships
    salesperson = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers',
        db_index=True,  # For salesperson-based queries
        limit_choices_to={'role__in': ['salesperson', 'manager', 'admin']}
    )
    
    # Performance tracking
    total_sales_ytd = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For sales analysis
    )
    
    last_order_date = models.DateField(
        blank=True,
        null=True,
        db_index=True  # For activity tracking
    )
    
    # Status tracking
    is_active = models.BooleanField(
        default=True,
        db_index=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomerManager()

    class Meta:
        db_table = 'customers'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['salesperson', 'is_active'], name='customers_sales_active_idx'),
            models.Index(fields=['status', 'category'], name='customers_status_cat_idx'),
            models.Index(fields=['created_at', 'salesperson'], name='customers_created_sales_idx'),
            models.Index(fields=['total_sales_ytd', 'category'], name='customers_sales_cat_idx'),
            models.Index(fields=['last_order_date', 'is_active'], name='customers_order_active_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(credit_limit__gte=0),
                name='customers_credit_limit_positive'
            ),
            models.CheckConstraint(
                check=models.Q(total_sales_ytd__gte=0),
                name='customers_total_sales_positive'
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def is_high_value(self):
        """Check if customer is high value based on sales."""
        return self.total_sales_ytd > 100000  # Configurable threshold

    @property
    def credit_utilization(self):
        """Calculate credit utilization percentage."""
        if self.credit_limit > 0:
            return (self.total_sales_ytd / self.credit_limit) * 100
        return 0

    def update_sales_ytd(self):
        """Update year-to-date sales from sales budget entries."""
        from apps.sales_budget.models import SalesBudget
        
        current_year = timezone.now().year
        ytd_sales = SalesBudget.objects.filter(
            customer=self,
            year=current_year
        ).aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
        
        self.total_sales_ytd = ytd_sales
        self.save(update_fields=['total_sales_ytd', 'updated_at'])

    @classmethod
    def get_top_customers(cls, limit=10):
        """Get top customers by sales with caching."""
        cache_key = f'top_customers_{limit}'
        customers = cache.get(cache_key)
        
        if customers is None:
            customers = list(
                cls.objects.filter(is_active=True)
                .order_by('-total_sales_ytd')[:limit]
                .select_related('salesperson')
            )
            cache.set(cache_key, customers, 300)  # Cache for 5 minutes
        
        return customers


class CustomerContact(models.Model):
    """
    Contact persons for customers.
    """
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_contacts'
        verbose_name = 'Customer Contact'
        verbose_name_plural = 'Customer Contacts'
        ordering = ['-is_primary', 'name']
        indexes = [
            models.Index(fields=['customer', 'is_primary'], name='contacts_customer_primary_idx'),
            models.Index(fields=['customer', 'is_active'], name='contacts_customer_active_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.customer.name})"


# Cache invalidation signals
@receiver([post_save, post_delete], sender=Customer)
def invalidate_customer_cache(sender, **kwargs):
    """Invalidate customer-related cache when customers are modified."""
    cache_keys = [
        'top_customers_10',
        'top_customers_20',
        'active_customers_list',
    ]
    cache.delete_many(cache_keys)


# Import timezone here to avoid circular imports
from django.utils import timezone
