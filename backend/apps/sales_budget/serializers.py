"""
Sales Budget serializers for API responses.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import SalesBudget, SalesBudgetTemplate
from apps.customers.serializers import CustomerSummarySerializer
from apps.items.serializers import ItemSummarySerializer
from apps.users.serializers import UserSummarySerializer


class SalesBudgetSerializer(serializers.ModelSerializer):
    """Serializer for sales budget model."""
    
    customer_info = CustomerSummarySerializer(source='customer', read_only=True)
    item_info = ItemSummarySerializer(source='item', read_only=True)
    salesperson_info = UserSummarySerializer(source='salesperson', read_only=True)
    created_by_info = UserSummarySerializer(source='created_by', read_only=True)
    
    gross_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    quarter = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SalesBudget
        fields = [
            'id', 'customer', 'customer_info', 'item', 'item_info', 'year', 'month',
            'quantity', 'unit_price', 'discount_percentage', 'total_amount',
            'distribution_type', 'seasonal_multiplier', 'is_manual_entry',
            'status', 'salesperson', 'salesperson_info', 'created_by', 'created_by_info',
            'approved_by', 'approved_at', 'notes', 'gross_amount', 'discount_amount',
            'quarter', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_amount', 'created_by', 'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Validate sales budget entry."""
        # Validate date
        year = attrs.get('year')
        month = attrs.get('month')
        
        if year and year < timezone.now().year:
            raise serializers.ValidationError("Cannot create budget for past years.")
        
        if month and (month < 1 or month > 12):
            raise serializers.ValidationError("Month must be between 1 and 12.")
        
        # Validate quantity and price
        if attrs.get('quantity', 0) < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        
        if attrs.get('unit_price', 0) < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        
        if attrs.get('discount_percentage', 0) > 100:
            raise serializers.ValidationError("Discount percentage cannot exceed 100%.")
        
        return attrs
    
    def create(self, validated_data):
        """Create sales budget entry with user tracking."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            
            # Auto-assign salesperson if not provided
            if not validated_data.get('salesperson'):
                customer = validated_data.get('customer')
                if customer and customer.salesperson:
                    validated_data['salesperson'] = customer.salesperson
                elif request.user.role in [request.user.Role.SALESPERSON, request.user.Role.MANAGER]:
                    validated_data['salesperson'] = request.user
        
        return super().create(validated_data)


class SalesBudgetCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sales budget entries."""
    
    class Meta:
        model = SalesBudget
        fields = [
            'customer', 'item', 'year', 'month', 'quantity', 'unit_price',
            'discount_percentage', 'distribution_type', 'seasonal_multiplier',
            'is_manual_entry', 'salesperson', 'notes'
        ]
    
    def validate(self, attrs):
        """Validate creation data."""
        # Check for duplicate entries
        customer = attrs.get('customer')
        item = attrs.get('item')
        year = attrs.get('year')
        month = attrs.get('month')
        
        if SalesBudget.objects.filter(
            customer=customer,
            item=item,
            year=year,
            month=month
        ).exists():
            raise serializers.ValidationError(
                "A budget entry already exists for this customer-item-period combination."
            )
        
        return super().validate(attrs)


class SalesBudgetBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk creating sales budget entries."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialize fields with querysets
        from apps.customers.models import Customer
        from apps.items.models import Item

        self.fields['customer'] = serializers.PrimaryKeyRelatedField(
            queryset=self.get_customer_queryset(),
            read_only=False
        )
        self.fields['items'] = serializers.ListField(
            child=serializers.PrimaryKeyRelatedField(queryset=self.get_items_queryset()),
            min_length=1
        )
    year = serializers.IntegerField(min_value=2020, max_value=2030)
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=0)
    distribution_type = serializers.ChoiceField(choices=SalesBudget.DistributionType.choices)
    
    def get_customer_queryset(self):
        request = self.context.get('request')
        if request and request.user:
            from apps.customers.models import Customer

            # Filter customers based on user permissions
            if request.user.role == request.user.Role.SALESPERSON:
                return Customer.objects.filter(
                    salesperson=request.user, is_active=True
                )
            else:
                return Customer.objects.filter(is_active=True)
        from apps.customers.models import Customer
        return Customer.objects.filter(is_active=True)

    def get_items_queryset(self):
        from apps.items.models import Item
        return Item.objects.filter(is_active=True)



class SalesBudgetTemplateSerializer(serializers.ModelSerializer):
    """Serializer for sales budget templates."""
    
    created_by_info = UserSummarySerializer(source='created_by', read_only=True)
    
    class Meta:
        model = SalesBudgetTemplate
        fields = [
            'id', 'name', 'description', 'default_distribution_type',
            'default_discount_percentage', 'is_active', 'created_by',
            'created_by_info', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create template with user tracking."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class SalesBudgetSummarySerializer(serializers.Serializer):
    """Serializer for sales budget summary data."""
    
    period = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_quantity = serializers.DecimalField(max_digits=15, decimal_places=2)
    entry_count = serializers.IntegerField()
    avg_unit_price = serializers.DecimalField(max_digits=15, decimal_places=2)


class MonthlyBudgetSerializer(serializers.Serializer):
    """Serializer for monthly budget data."""
    
    month = serializers.IntegerField()
    month_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_quantity = serializers.DecimalField(max_digits=15, decimal_places=2)
    entry_count = serializers.IntegerField()
    top_items = serializers.ListField()
    top_customers = serializers.ListField()
