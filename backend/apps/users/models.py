"""
User models with performance optimizations.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class User(AbstractUser):
    """
    Custom user model with performance optimizations.
    """
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MANAGER = 'manager', 'Manager'
        SALESPERSON = 'salesperson', 'Salesperson'
        VIEWER = 'viewer', 'Viewer'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
        db_index=True  # Index for fast role-based queries
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True  # Index for department filtering
    )
    
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    is_active = models.BooleanField(
        default=True,
        db_index=True  # Index for active user queries
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True  # Index for date-based queries
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optimization: Add related_name to avoid reverse accessor conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_set',
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_set',
        related_query_name='custom_user',
    )

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            # Composite indexes for common query patterns
            models.Index(fields=['role', 'is_active'], name='users_role_active_idx'),
            models.Index(fields=['department', 'is_active'], name='users_dept_active_idx'),
            models.Index(fields=['created_at', 'role'], name='users_created_role_idx'),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def is_admin(self):
        """Check if user is admin."""
        return self.role == self.Role.ADMIN or self.is_superuser

    def can_manage_users(self):
        """Check if user can manage other users."""
        return self.role in [self.Role.ADMIN, self.Role.MANAGER]

    @classmethod
    def get_active_users(cls):
        """Get all active users with caching."""
        cache_key = 'active_users_list'
        users = cache.get(cache_key)
        if users is None:
            users = list(cls.objects.filter(is_active=True).select_related())
            cache.set(cache_key, users, 300)  # Cache for 5 minutes
        return users


class UserProfile(models.Model):
    """
    Extended user profile for additional information.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        db_index=True
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True
    )
    
    bio = models.TextField(blank=True, null=True)
    
    # Performance tracking
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    login_count = models.PositiveIntegerField(default=0)
    
    # Preferences
    default_page_size = models.PositiveIntegerField(default=50)
    preferred_view_mode = models.CharField(
        max_length=20,
        choices=[
            ('customer_item', 'Customer-Item'),
            ('item_wise', 'Item-wise'),
        ],
        default='customer_item'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username}'s Profile"


# Cache invalidation signals
@receiver([post_save, post_delete], sender=User)
def invalidate_user_cache(sender, **kwargs):
    """Invalidate user-related cache when users are modified."""
    cache_keys = [
        'active_users_list',
        f'user_permissions_{kwargs["instance"].id}',
    ]
    cache.delete_many(cache_keys)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create user profile when user is created."""
    if created:
        UserProfile.objects.create(user=instance)
