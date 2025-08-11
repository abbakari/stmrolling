"""
Analytics models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.postgres.fields import JSONField

User = get_user_model()


class AnalyticsReportManager(models.Manager):
    """Custom manager for Analytics Reports."""
    
    def published(self):
        """Get published reports."""
        return self.filter(status='published')
    
    def by_type(self, report_type):
        """Get reports by type."""
        return self.filter(report_type=report_type)
    
    def recent(self, days=30):
        """Get recent reports."""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created_at__gte=cutoff_date)


class AnalyticsReport(models.Model):
    """
    Analytics report model for storing computed analytics data.
    """
    class ReportType(models.TextChoices):
        SALES_PERFORMANCE = 'sales_performance', 'Sales Performance'
        FORECAST_ACCURACY = 'forecast_accuracy', 'Forecast Accuracy'
        CUSTOMER_ANALYSIS = 'customer_analysis', 'Customer Analysis'
        PRODUCT_ANALYSIS = 'product_analysis', 'Product Analysis'
        INVENTORY_ANALYSIS = 'inventory_analysis', 'Inventory Analysis'
        SALESPERSON_PERFORMANCE = 'salesperson_performance', 'Salesperson Performance'
        SEASONAL_TRENDS = 'seasonal_trends', 'Seasonal Trends'
        VARIANCE_ANALYSIS = 'variance_analysis', 'Variance Analysis'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PROCESSING = 'processing', 'Processing'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    # Report metadata
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, null=True)
    
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices,
        db_index=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True
    )
    
    # Time period
    period_start = models.DateField(db_index=True)
    period_end = models.DateField(db_index=True)
    
    # Report data (stored as JSON for flexibility)
    data = JSONField(
        default=dict,
        help_text="Report data in JSON format"
    )
    
    # Metadata
    parameters = JSONField(
        default=dict,
        help_text="Report generation parameters"
    )
    
    # Performance metrics
    generation_time_seconds = models.FloatField(
        default=0,
        help_text="Time taken to generate report"
    )
    
    data_points_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of data points processed"
    )
    
    # User tracking
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reports',
        db_index=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    objects = AnalyticsReportManager()

    class Meta:
        db_table = 'analytics_reports'
        verbose_name = 'Analytics Report'
        verbose_name_plural = 'Analytics Reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'status'], name='reports_type_status_idx'),
            models.Index(fields=['period_start', 'period_end'], name='reports_period_idx'),
            models.Index(fields=['created_by', 'report_type'], name='reports_user_type_idx'),
            models.Index(fields=['status', 'published_at'], name='reports_status_published_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"

    def publish(self):
        """Publish the report."""
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save()

    def archive(self):
        """Archive the report."""
        self.status = self.Status.ARCHIVED
        self.save()

    @property
    def is_published(self):
        """Check if report is published."""
        return self.status == self.Status.PUBLISHED

    @classmethod
    def get_latest_by_type(cls, report_type, limit=5):
        """Get latest reports by type."""
        return cls.objects.filter(
            report_type=report_type,
            status=cls.Status.PUBLISHED
        ).order_by('-published_at')[:limit]


class KPIMetric(models.Model):
    """
    Key Performance Indicator metrics with time series data.
    """
    class MetricType(models.TextChoices):
        SALES_TOTAL = 'sales_total', 'Total Sales'
        SALES_GROWTH = 'sales_growth', 'Sales Growth Rate'
        FORECAST_ACCURACY = 'forecast_accuracy', 'Forecast Accuracy'
        CUSTOMER_ACQUISITION = 'customer_acquisition', 'Customer Acquisition'
        INVENTORY_TURNOVER = 'inventory_turnover', 'Inventory Turnover'
        PROFIT_MARGIN = 'profit_margin', 'Profit Margin'
        BUDGET_VARIANCE = 'budget_variance', 'Budget Variance'
        CUSTOMER_RETENTION = 'customer_retention', 'Customer Retention'

    class Period(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'
        YEARLY = 'yearly', 'Yearly'

    # Metric identification
    metric_type = models.CharField(
        max_length=50,
        choices=MetricType.choices,
        db_index=True
    )
    
    period_type = models.CharField(
        max_length=20,
        choices=Period.choices,
        db_index=True
    )
    
    # Time period
    period_date = models.DateField(db_index=True)
    
    # Metric values
    value = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        db_index=True
    )
    
    target_value = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Target/benchmark value"
    )
    
    previous_value = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Previous period value for comparison"
    )
    
    # Calculated fields
    variance_from_target = models.DecimalField(
        max_digits=20,
        decimal_places=4,
        default=0,
        help_text="Difference from target"
    )
    
    growth_rate = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=0,
        help_text="Growth rate compared to previous period"
    )
    
    # Dimensional attributes (for grouping/filtering)
    dimension_customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True
    )
    
    dimension_item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True
    )
    
    dimension_salesperson = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True
    )
    
    # Metadata
    calculation_method = models.TextField(
        blank=True,
        null=True,
        help_text="Description of how this metric was calculated"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'kpi_metrics'
        verbose_name = 'KPI Metric'
        verbose_name_plural = 'KPI Metrics'
        ordering = ['-period_date', 'metric_type']
        indexes = [
            models.Index(fields=['metric_type', 'period_date'], name='kpi_type_date_idx'),
            models.Index(fields=['period_type', 'period_date'], name='kpi_period_date_idx'),
            models.Index(fields=['dimension_customer', 'metric_type'], name='kpi_customer_type_idx'),
            models.Index(fields=['dimension_item', 'metric_type'], name='kpi_item_type_idx'),
            models.Index(fields=['dimension_salesperson', 'metric_type'], name='kpi_sales_type_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'metric_type', 'period_type', 'period_date',
                    'dimension_customer', 'dimension_item', 'dimension_salesperson'
                ],
                name='unique_kpi_metric'
            ),
        ]

    def __str__(self):
        return f"{self.get_metric_type_display()} - {self.period_date} ({self.value})"

    def save(self, *args, **kwargs):
        """Override save to calculate derived fields."""
        # Calculate variance from target
        if self.target_value is not None:
            self.variance_from_target = self.value - self.target_value
        
        # Calculate growth rate
        if self.previous_value is not None and self.previous_value != 0:
            self.growth_rate = ((self.value - self.previous_value) / abs(self.previous_value)) * 100
        
        super().save(*args, **kwargs)

    @property
    def is_above_target(self):
        """Check if metric is above target."""
        if self.target_value is not None:
            return self.value > self.target_value
        return None

    @property
    def performance_indicator(self):
        """Get performance indicator color."""
        if self.target_value is None:
            return 'neutral'
        
        variance_percentage = (abs(self.variance_from_target) / self.target_value) * 100
        
        if self.value >= self.target_value:
            if variance_percentage <= 5:
                return 'excellent'  # Green
            else:
                return 'good'  # Light green
        else:
            if variance_percentage <= 10:
                return 'warning'  # Yellow
            else:
                return 'danger'  # Red

    @classmethod
    def get_dashboard_metrics(cls, period_type='monthly', limit_months=12):
        """Get dashboard metrics with caching."""
        cache_key = f'dashboard_metrics_{period_type}_{limit_months}'
        metrics = cache.get(cache_key)
        
        if metrics is None:
            cutoff_date = timezone.now().date() - timezone.timedelta(days=30 * limit_months)
            
            metrics = cls.objects.filter(
                period_type=period_type,
                period_date__gte=cutoff_date
            ).select_related(
                'dimension_customer',
                'dimension_item',
                'dimension_salesperson'
            ).order_by('-period_date')
            
            metrics = list(metrics)
            cache.set(cache_key, metrics, 900)  # Cache for 15 minutes
        
        return metrics

    @classmethod
    def calculate_sales_metrics(cls, period_date, period_type='monthly'):
        """Calculate and store sales-related metrics for a period."""
        from apps.sales_budget.models import SalesBudget
        from apps.rolling_forecast.models import RollingForecast
        
        # Define date range based on period type
        if period_type == 'monthly':
            start_date = period_date.replace(day=1)
            if period_date.month == 12:
                end_date = period_date.replace(year=period_date.year + 1, month=1, day=1) - timezone.timedelta(days=1)
            else:
                end_date = period_date.replace(month=period_date.month + 1, day=1) - timezone.timedelta(days=1)
        else:
            start_date = period_date
            end_date = period_date
        
        # Calculate total sales
        total_sales = SalesBudget.objects.filter(
            created_at__date__range=[start_date, end_date],
            status=SalesBudget.Status.APPROVED
        ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        
        # Create or update sales total metric
        cls.objects.update_or_create(
            metric_type=cls.MetricType.SALES_TOTAL,
            period_type=period_type,
            period_date=period_date,
            defaults={'value': total_sales}
        )
        
        # Calculate forecast accuracy
        forecast_accuracy = RollingForecast.objects.filter(
            created_at__date__range=[start_date, end_date],
            is_latest=True,
            status=RollingForecast.Status.APPROVED
        ).aggregate(
            avg_accuracy=models.Avg('amount_variance_percentage')
        )['avg_accuracy'] or 0
        
        # Convert to positive accuracy percentage
        accuracy_percentage = max(0, 100 - abs(forecast_accuracy))
        
        cls.objects.update_or_create(
            metric_type=cls.MetricType.FORECAST_ACCURACY,
            period_type=period_type,
            period_date=period_date,
            defaults={'value': accuracy_percentage}
        )


# Cache invalidation signals
@receiver([post_save, post_delete], sender=AnalyticsReport)
def invalidate_report_cache(sender, **kwargs):
    """Invalidate report related cache."""
    cache_keys = [
        'analytics_dashboard_data',
        'recent_reports',
    ]
    cache.delete_many(cache_keys)


@receiver([post_save, post_delete], sender=KPIMetric)
def invalidate_kpi_cache(sender, **kwargs):
    """Invalidate KPI related cache."""
    cache_keys = [
        'dashboard_metrics_daily_12',
        'dashboard_metrics_weekly_12',
        'dashboard_metrics_monthly_12',
        'dashboard_metrics_quarterly_12',
        'kpi_dashboard_data',
    ]
    cache.delete_many(cache_keys)
