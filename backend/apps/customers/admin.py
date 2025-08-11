"""
Django admin configuration for Customer models.
"""
from django.contrib import admin
from .models import Customer, CustomerContact


class CustomerContactInline(admin.TabularInline):
    """Inline admin for customer contacts."""
    model = CustomerContact
    extra = 1
    fields = ('name', 'title', 'email', 'phone', 'is_primary', 'is_active')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """Admin interface for Customer model."""
    
    inlines = (CustomerContactInline,)
    
    list_display = (
        'code', 'name', 'status', 'category', 'salesperson',
        'total_sales_ytd', 'credit_limit', 'is_active', 'created_at'
    )
    
    list_filter = (
        'status', 'category', 'salesperson', 'is_active', 'created_at'
    )
    
    search_fields = ('code', 'name', 'email', 'salesperson__username')
    
    readonly_fields = ('total_sales_ytd', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'status', 'category')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Business Information', {
            'fields': ('credit_limit', 'payment_terms', 'salesperson')
        }),
        ('Performance', {
            'fields': ('total_sales_ytd', 'last_order_date'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('salesperson')


@admin.register(CustomerContact)
class CustomerContactAdmin(admin.ModelAdmin):
    """Admin interface for Customer Contact."""
    
    list_display = ('name', 'customer', 'title', 'email', 'phone', 'is_primary', 'is_active')
    list_filter = ('is_primary', 'is_active', 'customer')
    search_fields = ('name', 'email', 'customer__name')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer')
