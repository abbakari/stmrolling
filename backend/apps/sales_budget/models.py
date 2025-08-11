"""
Sales Budget models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

User = get_user_model()


class SalesBudgetManager(models.Manager):
    """Custom manager for Sales Budget with optimizations."""
    
    def for_year(self, year):
        """Get sales budget for specific year."""
        return self.filter(year=year)
    
    def for_period(self, year, month=None, quarter=None):
        """Get sales budget for specific period."""
        queryset = self.filter(year=year)
        if month:
            queryset = queryset.filter(month=month)
        elif quarter:
            # Quarter-based filtering
            quarter_months = {
                1: [1, 2, 3],
                2: [4, 5, 6], 
                3: [7, 8, 9],
                4: [10, 11, 12]
            }
            queryset = queryset.filter(month__in=quarter_months.get(quarter, []))
        return queryset
    
    def by_salesperson(self, salesperson_id):
        """Get sales budget entries by salesperson."""
        return self.filter(
            models.Q(customer__salesperson_id=salesperson_id) |
            models.Q(salesperson_id=salesperson_id)
        )
    
    def with_full_details(self):
        """Get sales budget with all related data."""
        return self.select_related(
            'customer',
            'item',
            'item__category',
            'item__brand',
            'salesperson',
            'created_by'
        )


class SalesBudget(models.Model):
    """
    Sales Budget model with performance optimizations.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class DistributionType(models.TextChoices):
        EQUAL = 'equal', 'Equal Distribution'
        PERCENTAGE = 'percentage', 'Percentage Distribution'
        SEASONAL = 'seasonal', 'Seasonal Distribution'
        MANUAL = 'manual', 'Manual Distribution'

    # Core relationships
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='sales_budget_entries',
        db_index=True
    )
    
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        related_name='sales_budget_entries',
        db_index=True
    )
    
    # Time period
    year = models.PositiveIntegerField(
        db_index=True,
        help_text="Budget year"
    )
    
    month = models.PositiveIntegerField(
        choices=[
            (1, 'January'), (2, 'February'), (3, 'March'),
            (4, 'April'), (5, 'May'), (6, 'June'),
            (7, 'July'), (8, 'August'), (9, 'September'),
            (10, 'October'), (11, 'November'), (12, 'December')
        ],
        db_index=True,
        help_text="Budget month"
    )
    
    # Budget data
    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Discount percentage applied"
    )
    
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True  # For aggregation queries
    )
    
    # Distribution information
    distribution_type = models.CharField(
        max_length=20,
        choices=DistributionType.choices,
        default=DistributionType.EQUAL,
        db_index=True
    )
    
    # Seasonal growth multiplier (used when distribution_type is 'seasonal')
    seasonal_multiplier = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text="Seasonal growth multiplier for this month"
    )
    
    # Manual budget entry flag
    is_manual_entry = models.BooleanField(
        default=False,
        db_index=True,
        help_text="True if this entry was manually entered (BUD 2026)"
    )
    
    # Status and workflow
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    
    # User tracking
    salesperson = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_sales_budget',
        db_index=True
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sales_budget',
        db_index=True
    )
    
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_sales_budget'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Notes and comments
    notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = SalesBudgetManager()

    class Meta:
        db_table = 'sales_budget'
        verbose_name = 'Sales Budget'
        verbose_name_plural = 'Sales Budget'
        ordering = ['-year', '-month', 'customer__name', 'item__name']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['year', 'month'], name='sales_budget_period_idx'),
            models.Index(fields=['customer', 'year'], name='sales_budget_customer_year_idx'),
            models.Index(fields=['item', 'year'], name='sales_budget_item_year_idx'),
            models.Index(fields=['salesperson', 'year'], name='sales_budget_sales_year_idx'),
            models.Index(fields=['status', 'year'], name='sales_budget_status_year_idx'),
            models.Index(fields=['distribution_type', 'year'], name='sales_budget_dist_year_idx'),
            models.Index(fields=['is_manual_entry', 'year'], name='sales_budget_manual_year_idx'),
            models.Index(fields=['total_amount', 'year'], name='sales_budget_amount_year_idx'),
            models.Index(fields=['created_at', 'status'], name='sb_created_status_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['customer', 'item', 'year', 'month'],
                name='unique_customer_item_period'
            ),
            models.CheckConstraint(
                check=models.Q(quantity__gte=0),
                name='sales_budget_quantity_positive'
            ),
            models.CheckConstraint(
                check=models.Q(unit_price__gte=0),
                name='sales_budget_price_positive'
            ),
            models.CheckConstraint(
                check=models.Q(total_amount__gte=0),
                name='sales_budget_total_positive'
            ),
            models.CheckConstraint(
                check=models.Q(discount_percentage__gte=0, discount_percentage__lte=100),
                name='sales_budget_discount_valid'
            ),
        ]

    def __str__(self):
        return f"{self.customer.name} - {self.item.name} ({self.year}-{self.month:02d})"

    def save(self, *args, **kwargs):
        """Override save to calculate total amount."""
        # Calculate total amount considering discount
        gross_amount = self.quantity * self.unit_price
        if self.discount_percentage > 0:
            discount_amount = (gross_amount * self.discount_percentage) / 100
            self.total_amount = gross_amount - discount_amount
        else:
            self.total_amount = gross_amount
        
        super().save(*args, **kwargs)

    @property
    def gross_amount(self):
        """Calculate gross amount before discount."""
        return self.quantity * self.unit_price

    @property
    def discount_amount(self):
        """Calculate discount amount."""
        if self.discount_percentage > 0:
            return (self.gross_amount * self.discount_percentage) / 100
        return Decimal('0.00')

    @property
    def quarter(self):
        """Get quarter for this month."""
        return (self.month - 1) // 3 + 1

    def apply_seasonal_distribution(self):
        """Apply seasonal growth multiplier to this entry."""
        if self.distribution_type == self.DistributionType.SEASONAL:
            # Apply seasonal multiplier to quantity
            base_quantity = self.quantity / self.seasonal_multiplier if self.seasonal_multiplier > 0 else self.quantity
            self.quantity = base_quantity * self.seasonal_multiplier
            self.save()

    @classmethod
    def get_monthly_totals(cls, year, customer_id=None, item_id=None):
        """Get monthly budget totals with caching."""
        cache_key = f'monthly_totals_{year}_{customer_id}_{item_id}'
        totals = cache.get(cache_key)
        
        if totals is None:
            queryset = cls.objects.filter(year=year, status=cls.Status.APPROVED)
            
            if customer_id:
                queryset = queryset.filter(customer_id=customer_id)
            if item_id:
                queryset = queryset.filter(item_id=item_id)
            
            totals = queryset.values('month').annotate(
                total_amount=models.Sum('total_amount'),
                total_quantity=models.Sum('quantity')
            ).order_by('month')
            
            totals = list(totals)
            cache.set(cache_key, totals, 300)  # Cache for 5 minutes
        
        return totals

    @classmethod
    def get_annual_summary(cls, year):
        """Get annual summary with caching."""
        cache_key = f'annual_summary_{year}'
        summary = cache.get(cache_key)
        
        if summary is None:
            summary = cls.objects.filter(
                year=year,
                status=cls.Status.APPROVED
            ).aggregate(
                total_amount=models.Sum('total_amount'),
                total_quantity=models.Sum('quantity'),
                entry_count=models.Count('id'),
                customer_count=models.Count('customer', distinct=True),
                item_count=models.Count('item', distinct=True)
            )
            cache.set(cache_key, summary, 600)  # Cache for 10 minutes
        
        return summary


class SalesBudgetTemplate(models.Model):
    """
    Template for sales budget creation to speed up data entry.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    
    # Default values
    default_distribution_type = models.CharField(
        max_length=20,
        choices=SalesBudget.DistributionType.choices,
        default=SalesBudget.DistributionType.EQUAL
    )
    
    default_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )
    
    # Template configuration
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_budget_templates'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_budget_templates'
        verbose_name = 'Sales Budget Template'
        verbose_name_plural = 'Sales Budget Templates'
        ordering = ['name']

    def __str__(self):
        return self.name


# Cache invalidation signals
@receiver([post_save, post_delete], sender=SalesBudget)
def invalidate_sales_budget_cache(sender, instance, **kwargs):
    """Invalidate sales budget related cache when entries are modified."""
    year = instance.year
    customer_id = instance.customer_id
    item_id = instance.item_id
    
    cache_keys = [
        f'monthly_totals_{year}_None_None',
        f'monthly_totals_{year}_{customer_id}_None',
        f'monthly_totals_{year}_None_{item_id}',
        f'monthly_totals_{year}_{customer_id}_{item_id}',
        f'annual_summary_{year}',
        'sales_dashboard_data',
    ]
    cache.delete_many(cache_keys)
