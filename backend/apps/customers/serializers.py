"""
Customer serializers for API responses.
"""
from rest_framework import serializers
from .models import Customer, CustomerContact


class CustomerContactSerializer(serializers.ModelSerializer):
    """Serializer for customer contacts."""
    
    class Meta:
        model = CustomerContact
        fields = [
            'id', 'name', 'title', 'email', 'phone', 
            'is_primary', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for customer model."""
    
    contacts = CustomerContactSerializer(many=True, read_only=True)
    salesperson_name = serializers.CharField(source='salesperson.full_name', read_only=True)
    is_high_value = serializers.BooleanField(read_only=True)
    credit_utilization = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'code', 'name', 'status', 'category', 'email', 'phone', 'address',
            'credit_limit', 'payment_terms', 'salesperson', 'salesperson_name',
            'total_sales_ytd', 'last_order_date', 'is_active', 'is_high_value',
            'credit_utilization', 'contacts', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_sales_ytd', 'created_at', 'updated_at']
    
    def validate_code(self, value):
        """Validate customer code uniqueness."""
        if self.instance and self.instance.code == value:
            return value
        
        if Customer.objects.filter(code=value).exists():
            raise serializers.ValidationError("A customer with this code already exists.")
        return value


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating customers."""
    
    class Meta:
        model = Customer
        fields = [
            'code', 'name', 'status', 'category', 'email', 'phone', 'address',
            'credit_limit', 'payment_terms', 'salesperson'
        ]
    
    def validate_code(self, value):
        """Validate customer code uniqueness."""
        if Customer.objects.filter(code=value).exists():
            raise serializers.ValidationError("A customer with this code already exists.")
        return value


class CustomerSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for customer lists and references."""
    
    salesperson_name = serializers.CharField(source='salesperson.full_name', read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'code', 'name', 'status', 'category', 'salesperson_name', 'is_active']
