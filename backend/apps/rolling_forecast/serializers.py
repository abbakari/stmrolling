"""
Rolling Forecast serializers for API responses.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import RollingForecast
from apps.customers.serializers import CustomerSummarySerializer
from apps.items.serializers import ItemSummarySerializer
from apps.users.serializers import UserSummarySerializer


class RollingForecastSerializer(serializers.ModelSerializer):
    """Serializer for rolling forecast model."""
    
    customer_info = CustomerSummarySerializer(source='customer', read_only=True)
    item_info = ItemSummarySerializer(source='item', read_only=True)
    salesperson_info = UserSummarySerializer(source='salesperson', read_only=True)
    created_by_info = UserSummarySerializer(source='created_by', read_only=True)
    
    quarter = serializers.IntegerField(read_only=True)
    is_favorable_variance = serializers.BooleanField(read_only=True)
    variance_category = serializers.CharField(read_only=True)
    
    class Meta:
        model = RollingForecast
        fields = [
            'id', 'customer', 'customer_info', 'item', 'item_info', 'year', 'month',
            'forecasted_quantity', 'forecasted_amount', 'budget_quantity', 'budget_amount',
            'quantity_variance', 'amount_variance', 'quantity_variance_percentage',
            'amount_variance_percentage', 'forecast_type', 'confidence_level',
            'is_latest', 'version', 'status', 'salesperson', 'salesperson_info',
            'created_by', 'created_by_info', 'approved_by', 'approved_at',
            'notes', 'forecast_reasoning', 'market_conditions', 'quarter',
            'is_favorable_variance', 'variance_category', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'quantity_variance', 'amount_variance', 'quantity_variance_percentage',
            'amount_variance_percentage', 'created_by', 'approved_by', 'approved_at',
            'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Validate rolling forecast entry."""
        # Validate date
        year = attrs.get('year')
        month = attrs.get('month')
        
        if year and year < timezone.now().year:
            raise serializers.ValidationError("Cannot create forecast for past years.")
        
        if month and (month < 1 or month > 12):
            raise serializers.ValidationError("Month must be between 1 and 12.")
        
        # Validate forecast values
        if attrs.get('forecasted_quantity', 0) < 0:
            raise serializers.ValidationError("Forecasted quantity cannot be negative.")
        
        if attrs.get('forecasted_amount', 0) < 0:
            raise serializers.ValidationError("Forecasted amount cannot be negative.")
        
        if attrs.get('confidence_level', 0) < 0 or attrs.get('confidence_level', 0) > 100:
            raise serializers.ValidationError("Confidence level must be between 0 and 100.")
        
        return attrs
    
    def create(self, validated_data):
        """Create rolling forecast entry with user tracking."""
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


class RollingForecastCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating rolling forecast entries."""
    
    class Meta:
        model = RollingForecast
        fields = [
            'customer', 'item', 'year', 'month', 'forecasted_quantity', 'forecasted_amount',
            'budget_quantity', 'budget_amount', 'forecast_type', 'confidence_level',
            'salesperson', 'notes', 'forecast_reasoning', 'market_conditions'
        ]
    
    def validate(self, attrs):
        """Validate creation data."""
        # Check for duplicate entries (only one latest forecast per customer-item-period)
        customer = attrs.get('customer')
        item = attrs.get('item')
        year = attrs.get('year')
        month = attrs.get('month')
        
        existing_latest = RollingForecast.objects.filter(
            customer=customer,
            item=item,
            year=year,
            month=month,
            is_latest=True
        ).exists()
        
        if existing_latest:
            # This will create a new version, which is handled in the model's save method
            pass
        
        return super().validate(attrs)


class RollingForecastBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk creating rolling forecast entries."""

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
    forecast_data = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['customer'].queryset = self.get_customer_queryset()
        self.fields['items'].child.queryset = self.get_items_queryset()


class ForecastVarianceAnalysisSerializer(serializers.Serializer):
    """Serializer for forecast variance analysis data."""
    
    period = serializers.CharField()
    total_forecast_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_budget_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_variance = serializers.DecimalField(max_digits=15, decimal_places=2)
    variance_percentage = serializers.DecimalField(max_digits=8, decimal_places=2)
    positive_variances = serializers.IntegerField()
    negative_variances = serializers.IntegerField()
    total_entries = serializers.IntegerField()
    accuracy_score = serializers.DecimalField(max_digits=5, decimal_places=2)


class MonthlyForecastSerializer(serializers.Serializer):
    """Serializer for monthly forecast data."""
    
    month = serializers.IntegerField()
    month_name = serializers.CharField()
    total_forecast = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_budget = serializers.DecimalField(max_digits=15, decimal_places=2)
    variance = serializers.DecimalField(max_digits=15, decimal_places=2)
    variance_percentage = serializers.DecimalField(max_digits=8, decimal_places=2)
    confidence_avg = serializers.DecimalField(max_digits=5, decimal_places=2)
    entry_count = serializers.IntegerField()
