"""
Items serializers for API responses.
"""
from rest_framework import serializers
from .models import Category, Brand, Item


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for category model."""
    
    full_path = serializers.CharField(read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'code', 'name', 'description', 'parent', 'full_path',
            'default_discount_percentage', 'is_active', 'items_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_items_count(self, obj):
        """Get count of active items in this category."""
        return obj.items.filter(is_active=True).count()
    
    def validate_code(self, value):
        """Validate category code uniqueness."""
        if self.instance and self.instance.code == value:
            return value
        
        if Category.objects.filter(code=value).exists():
            raise serializers.ValidationError("A category with this code already exists.")
        return value


class BrandSerializer(serializers.ModelSerializer):
    """Serializer for brand model."""
    
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = [
            'id', 'code', 'name', 'description', 'default_discount_percentage',
            'is_active', 'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_items_count(self, obj):
        """Get count of active items for this brand."""
        return obj.items.filter(is_active=True).count()
    
    def validate_code(self, value):
        """Validate brand code uniqueness."""
        if self.instance and self.instance.code == value:
            return value
        
        if Brand.objects.filter(code=value).exists():
            raise serializers.ValidationError("A brand with this code already exists.")
        return value


class ItemSerializer(serializers.ModelSerializer):
    """Serializer for item model."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    effective_discount = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'code', 'name', 'description', 'status', 'category', 'category_name',
            'brand', 'brand_name', 'unit_price', 'cost_price', 'unit_type',
            'current_stock', 'minimum_stock', 'total_sales_ytd', 'total_quantity_sold_ytd',
            'is_active', 'profit_margin', 'is_low_stock', 'effective_discount',
            'discounted_price', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_sales_ytd', 'total_quantity_sold_ytd', 'created_at', 'updated_at'
        ]
    
    def get_effective_discount(self, obj):
        """Get effective discount percentage."""
        return obj.get_effective_discount()
    
    def get_discounted_price(self, obj):
        """Get discounted price."""
        return obj.calculate_discounted_price()
    
    def validate_code(self, value):
        """Validate item code uniqueness."""
        if self.instance and self.instance.code == value:
            return value
        
        if Item.objects.filter(code=value).exists():
            raise serializers.ValidationError("An item with this code already exists.")
        return value


class ItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating items."""
    
    class Meta:
        model = Item
        fields = [
            'code', 'name', 'description', 'status', 'category', 'brand',
            'unit_price', 'cost_price', 'unit_type', 'current_stock', 'minimum_stock'
        ]
    
    def validate_code(self, value):
        """Validate item code uniqueness."""
        if Item.objects.filter(code=value).exists():
            raise serializers.ValidationError("An item with this code already exists.")
        return value


class ItemSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for item lists and references."""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'id', 'code', 'name', 'category_name', 'brand_name', 
            'unit_price', 'unit_type', 'is_active'
        ]


class CategorySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for category references."""
    
    class Meta:
        model = Category
        fields = ['id', 'code', 'name', 'is_active']


class BrandSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for brand references."""
    
    class Meta:
        model = Brand
        fields = ['id', 'code', 'name', 'is_active']
