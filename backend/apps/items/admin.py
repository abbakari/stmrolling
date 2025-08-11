"""
Django admin configuration for Items models.
"""
from django.contrib import admin
from .models import Category, Brand, Item


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model."""
    
    list_display = ('code', 'name', 'parent', 'default_discount_percentage', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent', 'created_at')
    search_fields = ('code', 'name', 'description')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'parent')
        }),
        ('Discount Settings', {
            'fields': ('default_discount_percentage',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    """Admin interface for Brand model."""
    
    list_display = ('code', 'name', 'default_discount_percentage', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description')
        }),
        ('Discount Settings', {
            'fields': ('default_discount_percentage',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    """Admin interface for Item model."""
    
    list_display = (
        'code', 'name', 'category', 'brand', 'unit_price', 'current_stock',
        'is_low_stock', 'status', 'is_active', 'created_at'
    )
    
    list_filter = (
        'status', 'category', 'brand', 'unit_type', 'is_active', 'created_at'
    )
    
    search_fields = ('code', 'name', 'description', 'category__name', 'brand__name')
    
    readonly_fields = ('total_sales_ytd', 'total_quantity_sold_ytd', 'profit_margin', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'description', 'status')
        }),
        ('Classification', {
            'fields': ('category', 'brand')
        }),
        ('Pricing', {
            'fields': ('unit_price', 'cost_price', 'unit_type')
        }),
        ('Inventory', {
            'fields': ('current_stock', 'minimum_stock')
        }),
        ('Performance', {
            'fields': ('total_sales_ytd', 'total_quantity_sold_ytd', 'profit_margin'),
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
        return super().get_queryset(request).select_related('category', 'brand')
    
    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock'
