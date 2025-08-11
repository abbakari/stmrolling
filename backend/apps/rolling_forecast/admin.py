"""
Django admin configuration for Rolling Forecast models.
"""
from django.contrib import admin
from .models import RollingForecast


@admin.register(RollingForecast)
class RollingForecastAdmin(admin.ModelAdmin):
    """Admin interface for Rolling Forecast model."""
    
    list_display = (
        'customer', 'item', 'year', 'month', 'forecasted_amount', 'budget_amount',
        'amount_variance', 'amount_variance_percentage', 'forecast_type', 'confidence_level',
        'is_latest', 'version', 'status', 'created_at'
    )
    
    list_filter = (
        'year', 'month', 'forecast_type', 'status', 'is_latest', 'confidence_level',
        'created_at', 'salesperson'
    )
    
    search_fields = (
        'customer__name', 'customer__code', 'item__name', 'item__code',
        'salesperson__username', 'created_by__username'
    )
    
    readonly_fields = (
        'quantity_variance', 'amount_variance', 'quantity_variance_percentage',
        'amount_variance_percentage', 'created_at', 'updated_at', 'version'
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'item', 'year', 'month')
        }),
        ('Forecast Data', {
            'fields': (
                'forecasted_quantity', 'forecasted_amount', 'forecast_type', 'confidence_level'
            )
        }),
        ('Budget Comparison', {
            'fields': (
                'budget_quantity', 'budget_amount', 'quantity_variance', 'amount_variance',
                'quantity_variance_percentage', 'amount_variance_percentage'
            ),
            'classes': ('collapse',)
        }),
        ('Version Control', {
            'fields': ('is_latest', 'version'),
            'classes': ('collapse',)
        }),
        ('Status & Workflow', {
            'fields': ('status', 'salesperson', 'created_by', 'approved_by', 'approved_at')
        }),
        ('Additional Information', {
            'fields': ('notes', 'forecast_reasoning', 'market_conditions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related(
            'customer', 'item', 'item__category', 'item__brand',
            'salesperson', 'created_by', 'approved_by'
        )
    
    def save_model(self, request, obj, form, change):
        """Set created_by when creating new forecast."""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
