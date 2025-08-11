"""
Inventory models with performance optimizations.
"""
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class InventoryManager(models.Manager):
    """Custom manager for Inventory with optimizations."""
    
    def low_stock(self):
        """Get items with low stock."""
        return self.filter(
            current_stock__lte=models.F('minimum_stock_level')
        )
    
    def out_of_stock(self):
        """Get out of stock items."""
        return self.filter(current_stock=0)
    
    def by_location(self, location):
        """Get inventory by location."""
        return self.filter(location__icontains=location)
    
    def with_item_details(self):
        """Get inventory with item details."""
        return self.select_related(
            'item',
            'item__category',
            'item__brand'
        )


class Inventory(models.Model):
    """
    Inventory tracking model with performance optimizations.
    """
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        RESERVED = 'reserved', 'Reserved'
        DAMAGED = 'damaged', 'Damaged'
        EXPIRED = 'expired', 'Expired'

    # Core relationship
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        related_name='inventory_records',
        db_index=True
    )
    
    # Location information
    location = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Warehouse/storage location"
    )
    
    # Stock levels
    current_stock = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    minimum_stock_level = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    maximum_stock_level = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    reorder_point = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True
    )
    
    # Stock status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        db_index=True
    )
    
    # Cost information
    unit_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text="Current unit cost"
    )
    
    total_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        db_index=True,
        help_text="Total inventory value (quantity * unit_cost)"
    )
    
    # Quality information
    batch_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True
    )
    
    expiry_date = models.DateField(
        blank=True,
        null=True,
        db_index=True
    )
    
    # Tracking
    last_counted_date = models.DateField(
        blank=True,
        null=True,
        db_index=True,
        help_text="Last physical count date"
    )
    
    last_counted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='counted_inventory'
    )
    
    # Movement tracking
    last_movement_date = models.DateTimeField(
        blank=True,
        null=True,
        db_index=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = InventoryManager()

    class Meta:
        db_table = 'inventory'
        verbose_name = 'Inventory'
        verbose_name_plural = 'Inventory'
        ordering = ['item__name', 'location']
        indexes = [
            models.Index(fields=['item', 'location'], name='inventory_item_location_idx'),
            models.Index(fields=['current_stock', 'minimum_stock_level'], name='inventory_stock_levels_idx'),
            models.Index(fields=['status', 'location'], name='inventory_status_location_idx'),
            models.Index(fields=['expiry_date', 'status'], name='inventory_expiry_status_idx'),
            models.Index(fields=['total_value', 'location'], name='inventory_value_location_idx'),
            models.Index(fields=['last_movement_date'], name='inventory_movement_date_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['item', 'location', 'batch_number'],
                name='unique_item_location_batch'
            ),
            models.CheckConstraint(
                check=models.Q(current_stock__gte=0),
                name='inventory_current_stock_positive'
            ),
            models.CheckConstraint(
                check=models.Q(minimum_stock_level__gte=0),
                name='inventory_min_stock_positive'
            ),
            models.CheckConstraint(
                check=models.Q(unit_cost__gte=0),
                name='inventory_unit_cost_positive'
            ),
        ]

    def __str__(self):
        return f"{self.item.name} @ {self.location} ({self.current_stock})"

    def save(self, *args, **kwargs):
        """Override save to calculate total value."""
        self.total_value = self.current_stock * self.unit_cost
        super().save(*args, **kwargs)
        
        # Update last movement date
        self.last_movement_date = timezone.now()

    @property
    def is_low_stock(self):
        """Check if stock is below minimum level."""
        return self.current_stock <= self.minimum_stock_level

    @property
    def is_expired(self):
        """Check if item is expired."""
        if self.expiry_date:
            return self.expiry_date <= timezone.now().date()
        return False

    @property
    def days_until_expiry(self):
        """Calculate days until expiry."""
        if self.expiry_date:
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None

    @property
    def stock_level_percentage(self):
        """Calculate stock level as percentage of maximum."""
        if self.maximum_stock_level > 0:
            return (self.current_stock / self.maximum_stock_level) * 100
        return 0

    def needs_reorder(self):
        """Check if item needs reordering."""
        return self.current_stock <= self.reorder_point

    @classmethod
    def get_low_stock_summary(cls):
        """Get low stock summary with caching."""
        cache_key = 'low_stock_summary'
        summary = cache.get(cache_key)
        
        if summary is None:
            summary = {
                'low_stock_count': cls.objects.low_stock().count(),
                'out_of_stock_count': cls.objects.out_of_stock().count(),
                'total_value_at_risk': cls.objects.low_stock().aggregate(
                    total=models.Sum('total_value')
                )['total'] or 0,
                'items_expiring_soon': cls.objects.filter(
                    expiry_date__lte=timezone.now().date() + timezone.timedelta(days=30),
                    expiry_date__gte=timezone.now().date()
                ).count()
            }
            cache.set(cache_key, summary, 300)  # Cache for 5 minutes
        
        return summary


class InventoryMovement(models.Model):
    """
    Track all inventory movements for audit trail.
    """
    class MovementType(models.TextChoices):
        RECEIPT = 'receipt', 'Receipt'
        ISSUE = 'issue', 'Issue'
        TRANSFER = 'transfer', 'Transfer'
        ADJUSTMENT = 'adjustment', 'Adjustment'
        SALE = 'sale', 'Sale'
        RETURN = 'return', 'Return'
        DAMAGED = 'damaged', 'Damaged'
        EXPIRED = 'expired', 'Expired'

    # Core relationships
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='movements',
        db_index=True
    )
    
    item = models.ForeignKey(
        'items.Item',
        on_delete=models.CASCADE,
        related_name='inventory_movements',
        db_index=True
    )
    
    # Movement details
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        db_index=True
    )
    
    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Positive for inbound, negative for outbound"
    )
    
    unit_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    total_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    # Before and after stock levels
    stock_before = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    stock_after = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    # Reference information
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        help_text="PO, Invoice, or other reference number"
    )
    
    notes = models.TextField(blank=True, null=True)
    
    # User tracking
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='inventory_movements',
        db_index=True
    )
    
    # Timestamps
    movement_date = models.DateTimeField(
        default=timezone.now,
        db_index=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_movements'
        verbose_name = 'Inventory Movement'
        verbose_name_plural = 'Inventory Movements'
        ordering = ['-movement_date']
        indexes = [
            models.Index(fields=['item', 'movement_date'], name='movements_item_date_idx'),
            models.Index(fields=['movement_type', 'movement_date'], name='movements_type_date_idx'),
            models.Index(fields=['created_by', 'movement_date'], name='movements_user_date_idx'),
            models.Index(fields=['reference_number'], name='movements_reference_idx'),
        ]

    def __str__(self):
        return f"{self.movement_type} - {self.item.name} ({self.quantity})"

    def save(self, *args, **kwargs):
        """Override save to calculate total cost."""
        self.total_cost = abs(self.quantity) * self.unit_cost
        super().save(*args, **kwargs)

    @classmethod
    def create_movement(cls, inventory, movement_type, quantity, unit_cost=0, 
                       reference_number=None, notes=None, created_by=None):
        """Create a new inventory movement and update stock levels."""
        # Get current stock before movement
        stock_before = inventory.current_stock
        
        # Calculate new stock level
        stock_after = stock_before + quantity
        
        # Create movement record
        movement = cls.objects.create(
            inventory=inventory,
            item=inventory.item,
            movement_type=movement_type,
            quantity=quantity,
            unit_cost=unit_cost or inventory.unit_cost,
            stock_before=stock_before,
            stock_after=stock_after,
            reference_number=reference_number,
            notes=notes,
            created_by=created_by
        )
        
        # Update inventory stock level
        inventory.current_stock = stock_after
        inventory.save()
        
        return movement


# Cache invalidation signals
@receiver([post_save, post_delete], sender=Inventory)
def invalidate_inventory_cache(sender, **kwargs):
    """Invalidate inventory related cache when records are modified."""
    cache_keys = [
        'low_stock_summary',
        'inventory_dashboard_data',
    ]
    cache.delete_many(cache_keys)


@receiver([post_save, post_delete], sender=InventoryMovement)
def invalidate_movement_cache(sender, **kwargs):
    """Invalidate movement related cache."""
    cache_keys = [
        'inventory_dashboard_data',
        'movement_summary',
    ]
    cache.delete_many(cache_keys)
