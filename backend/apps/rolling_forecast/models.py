"""
Rolling Forecast models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

User = get_user_model()


class RollingForecastManager(models.Manager):
    """Custom manager for Rolling Forecast with optimizations."""
    
    def for_period(self, year, month=None, quarter=None):
        """Get rolling forecast for specific period."""
        queryset = self.filter(year=year)
        if month:
            queryset = queryset.filter(month=month)
        elif quarter:
            quarter_months = {
                1: [1, 2, 3], 2: [4, 5, 6], 
                3: [7, 8, 9], 4: [10, 11, 12]
            }
            queryset = queryset.filter(month__in=quarter_months.get(quarter, []))
        return queryset
    
    def latest_forecast(self):
        """Get the most recent forecast entries."""
        return self.filter(is_latest=True)
    
    def by_salesperson(self, salesperson_id):
        """Get forecast entries by salesperson."""
        return self.filter(
            models.Q(customer__salesperson_id=salesperson_id) |
            models.Q(salesperson_id=salesperson_id)
        )
    
    def with_full_details(self):
        """Get forecast with all related data."""
        return self.select_related(
            'customer',
            'item', 
            'item__category',
            'item__brand',
            'salesperson',
            'created_by'
        )


class RollingForecast(models.Model):
    """
    Rolling Forecast model with performance optimizations.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    class ForecastType(models.TextChoices):
        OPTIMISTIC = 'optimistic', 'Optimistic'
        REALISTIC = 'realistic', 'Realistic'
        PESSIMISTIC = 'pessimistic', 'Pessimistic'

    # Core relationships
    customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        related_name='rolling_forecast_entries',
        db_index=True
    )
    
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        related_name='rolling_forecast_entries',
        db_index=True
    )
    
    # Time period
    year = models.PositiveIntegerField(db_index=True)
    month = models.PositiveIntegerField(
        choices=[
            (1, 'January'), (2, 'February'), (3, 'March'),
            (4, 'April'), (5, 'May'), (6, 'June'),
            (7, 'July'), (8, 'August'), (9, 'September'),
            (10, 'October'), (11, 'November'), (12, 'December')
        ],
        db_index=True
    )
    
    # Forecast data
    forecasted_quantity = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    forecasted_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    # Comparison with budget
    budget_quantity = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Original budget quantity for comparison"
    )
    
    budget_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Original budget amount for comparison"
    )
    
    # Variance calculations
    quantity_variance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True,
        help_text="Forecast - Budget quantity"
    )
    
    amount_variance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True,
        help_text="Forecast - Budget amount"
    )
    
    quantity_variance_percentage = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        db_index=True,
        help_text="Percentage variance in quantity"
    )
    
    amount_variance_percentage = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        db_index=True,
        help_text="Percentage variance in amount"
    )
    
    # Forecast classification
    forecast_type = models.CharField(
        max_length=20,
        choices=ForecastType.choices,
        default=ForecastType.REALISTIC,
        db_index=True
    )
    
    confidence_level = models.PositiveIntegerField(
        default=80,
        help_text="Confidence level (0-100%)"
    )
    
    # Version control
    is_latest = models.BooleanField(
        default=True,
        db_index=True,
        help_text="True if this is the latest forecast version"
    )
    
    version = models.PositiveIntegerField(
        default=1,
        help_text="Forecast version number"
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
        related_name='assigned_forecasts',
        db_index=True
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_forecasts',
        db_index=True
    )
    
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_forecasts'
    )
    
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Notes and reasoning
    notes = models.TextField(blank=True, null=True)
    forecast_reasoning = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for forecast adjustments"
    )
    
    # External factors
    market_conditions = models.TextField(
        blank=True,
        null=True,
        help_text="Market conditions affecting forecast"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = RollingForecastManager()

    class Meta:
        db_table = 'rolling_forecast'
        verbose_name = 'Rolling Forecast'
        verbose_name_plural = 'Rolling Forecasts'
        ordering = ['-year', '-month', '-version', 'customer__name', 'item__name']
        indexes = [
            models.Index(fields=['year', 'month'], name='forecast_period_idx'),
            models.Index(fields=['customer', 'year'], name='forecast_customer_year_idx'),
            models.Index(fields=['item', 'year'], name='forecast_item_year_idx'),
            models.Index(fields=['salesperson', 'year'], name='forecast_sales_year_idx'),
            models.Index(fields=['status', 'year'], name='forecast_status_year_idx'),
            models.Index(fields=['is_latest', 'year'], name='forecast_latest_year_idx'),
            models.Index(fields=['forecast_type', 'year'], name='forecast_type_year_idx'),
            models.Index(fields=['quantity_variance_percentage'], name='forecast_qty_var_idx'),
            models.Index(fields=['amount_variance_percentage'], name='forecast_amt_var_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['customer', 'item', 'year', 'month', 'version'],
                name='unique_customer_item_period_version'
            ),
            models.CheckConstraint(
                check=models.Q(forecasted_quantity__gte=0),
                name='forecast_quantity_positive'
            ),
            models.CheckConstraint(
                check=models.Q(forecasted_amount__gte=0),
                name='forecast_amount_positive'
            ),
            models.CheckConstraint(
                check=models.Q(confidence_level__gte=0, confidence_level__lte=100),
                name='forecast_confidence_valid'
            ),
        ]

    def __str__(self):
        return f"{self.customer.name} - {self.item.name} Forecast ({self.year}-{self.month:02d} v{self.version})"

    def save(self, *args, **kwargs):
        """Override save to calculate variances."""
        # Calculate variances
        self.quantity_variance = self.forecasted_quantity - self.budget_quantity
        self.amount_variance = self.forecasted_amount - self.budget_amount
        
        # Calculate percentage variances
        if self.budget_quantity > 0:
            self.quantity_variance_percentage = (self.quantity_variance / self.budget_quantity) * 100
        else:
            self.quantity_variance_percentage = 0
            
        if self.budget_amount > 0:
            self.amount_variance_percentage = (self.amount_variance / self.budget_amount) * 100
        else:
            self.amount_variance_percentage = 0
        
        # Handle version control
        if self.pk is None:  # New record
            # Check if this is a new version
            existing_count = RollingForecast.objects.filter(
                customer=self.customer,
                item=self.item,
                year=self.year,
                month=self.month
            ).count()
            
            if existing_count > 0:
                self.version = existing_count + 1
                # Mark previous versions as not latest
                RollingForecast.objects.filter(
                    customer=self.customer,
                    item=self.item,
                    year=self.year,
                    month=self.month
                ).update(is_latest=False)
        
        super().save(*args, **kwargs)

    @property
    def quarter(self):
        """Get quarter for this month."""
        return (self.month - 1) // 3 + 1

    @property
    def is_favorable_variance(self):
        """Check if variance is favorable (forecast > budget)."""
        return self.amount_variance > 0

    @property
    def variance_category(self):
        """Categorize variance level."""
        abs_percentage = abs(self.amount_variance_percentage)
        if abs_percentage <= 5:
            return 'minimal'
        elif abs_percentage <= 15:
            return 'moderate'
        elif abs_percentage <= 30:
            return 'significant'
        else:
            return 'major'

    def update_from_budget(self, sales_budget_entry):
        """Update budget comparison fields from sales budget."""
        self.budget_quantity = sales_budget_entry.quantity
        self.budget_amount = sales_budget_entry.total_amount
        self.save()

    @classmethod
    def get_variance_summary(cls, year, customer_id=None, item_id=None):
        """Get variance summary with caching."""
        cache_key = f'variance_summary_{year}_{customer_id}_{item_id}'
        summary = cache.get(cache_key)
        
        if summary is None:
            queryset = cls.objects.filter(
                year=year,
                is_latest=True,
                status=cls.Status.APPROVED
            )
            
            if customer_id:
                queryset = queryset.filter(customer_id=customer_id)
            if item_id:
                queryset = queryset.filter(item_id=item_id)
            
            summary = queryset.aggregate(
                total_forecast_amount=models.Sum('forecasted_amount'),
                total_budget_amount=models.Sum('budget_amount'),
                total_variance=models.Sum('amount_variance'),
                avg_variance_percentage=models.Avg('amount_variance_percentage'),
                positive_variances=models.Count('id', filter=models.Q(amount_variance__gt=0)),
                negative_variances=models.Count('id', filter=models.Q(amount_variance__lt=0)),
                total_entries=models.Count('id')
            )
            
            cache.set(cache_key, summary, 300)  # Cache for 5 minutes
        
        return summary

    @classmethod
    def get_monthly_forecast_totals(cls, year, forecast_type='realistic'):
        """Get monthly forecast totals with caching."""
        cache_key = f'monthly_forecast_totals_{year}_{forecast_type}'
        totals = cache.get(cache_key)
        
        if totals is None:
            totals = cls.objects.filter(
                year=year,
                forecast_type=forecast_type,
                is_latest=True,
                status=cls.Status.APPROVED
            ).values('month').annotate(
                total_forecast=models.Sum('forecasted_amount'),
                total_budget=models.Sum('budget_amount'),
                total_variance=models.Sum('amount_variance')
            ).order_by('month')
            
            totals = list(totals)
            cache.set(cache_key, totals, 300)  # Cache for 5 minutes
        
        return totals


# Cache invalidation signals
@receiver([post_save, post_delete], sender=RollingForecast)
def invalidate_forecast_cache(sender, instance, **kwargs):
    """Invalidate forecast related cache when entries are modified."""
    year = instance.year
    customer_id = instance.customer_id
    item_id = instance.item_id
    
    cache_keys = [
        f'variance_summary_{year}_None_None',
        f'variance_summary_{year}_{customer_id}_None',
        f'variance_summary_{year}_None_{item_id}',
        f'variance_summary_{year}_{customer_id}_{item_id}',
        f'monthly_forecast_totals_{year}_optimistic',
        f'monthly_forecast_totals_{year}_realistic',
        f'monthly_forecast_totals_{year}_pessimistic',
        'forecast_dashboard_data',
    ]
    cache.delete_many(cache_keys)
