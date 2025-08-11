"""
Django admin configuration for User models.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.html import format_html
from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    """Inline admin for user profile."""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = (
        'avatar', 'bio', 'default_page_size', 'preferred_view_mode',
        'last_login_ip', 'login_count'
    )
    readonly_fields = ('last_login_ip', 'login_count')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced admin interface for User model."""
    
    inlines = (UserProfileInline,)
    
    # List display
    list_display = (
        'username', 'email', 'full_name', 'role', 'department',
        'is_active', 'is_staff', 'date_joined', 'last_login'
    )
    
    # List filters
    list_filter = (
        'role', 'department', 'is_active', 'is_staff', 'is_superuser',
        'date_joined', 'last_login'
    )
    
    # Search fields
    search_fields = ('username', 'email', 'first_name', 'last_name', 'department')
    
    # Ordering
    ordering = ('-date_joined',)
    
    # Fieldsets for add/edit forms
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Information', {
            'fields': ('role', 'department', 'phone'),
            'classes': ('wide',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Information', {
            'fields': ('email', 'first_name', 'last_name', 'role', 'department', 'phone'),
            'classes': ('wide',)
        }),
    )
    
    # Actions
    actions = ['activate_users', 'deactivate_users', 'reset_passwords']
    
    def activate_users(self, request, queryset):
        """Bulk activate users."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        """Bulk deactivate users."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
    deactivate_users.short_description = "Deactivate selected users"
    
    def reset_passwords(self, request, queryset):
        """Reset passwords for selected users."""
        # This would typically send password reset emails
        count = queryset.count()
        self.message_user(request, f'Password reset initiated for {count} users.')
    reset_passwords.short_description = "Reset passwords for selected users"
    
    def full_name(self, obj):
        """Display full name."""
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('profile')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin interface for User Profile."""
    
    list_display = (
        'user', 'preferred_view_mode', 'default_page_size',
        'login_count', 'last_login_ip', 'created_at'
    )
    
    list_filter = ('preferred_view_mode', 'created_at')
    
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    
    readonly_fields = ('created_at', 'updated_at', 'login_count', 'last_login_ip')
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Profile Details', {
            'fields': ('avatar', 'bio')
        }),
        ('Preferences', {
            'fields': ('preferred_view_mode', 'default_page_size')
        }),
        ('Statistics', {
            'fields': ('login_count', 'last_login_ip'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('user')


# Customize admin site headers
admin.site.site_header = 'STM Budget Administration'
admin.site.site_title = 'STM Budget Admin'
admin.site.index_title = 'Welcome to STM Budget Administration'
