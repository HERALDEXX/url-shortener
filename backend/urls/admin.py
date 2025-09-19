# backend/urls/admin.py
"""
Django Admin configuration for LinkCrush
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Sum, Avg
from django.utils import timezone
from datetime import timedelta

from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.core.exceptions import PermissionDenied
from django import forms

from .models import URLModel

# Safe unregister (avoid AlreadyRegistered errors)
try:
    admin.site.unregister(User)
except Exception:
    pass
  
# --- Forms with validation to prevent both flags being True ---
class AdminUserCreationForm(UserCreationForm):
    """
    Exposes is_staff/is_superuser/groups on the add user form and prevents
    selecting both is_staff and is_superuser.
    """
    is_staff = forms.BooleanField(required=False)
    is_superuser = forms.BooleanField(required=False)
    groups = forms.ModelMultipleChoiceField(queryset=Group.objects.all(), required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "is_staff", "is_superuser", "groups")

    def clean(self):
        cleaned = super().clean()
        is_staff = cleaned.get("is_staff")
        is_superuser = cleaned.get("is_superuser")
        if is_staff and is_superuser:
            raise forms.ValidationError(
                "You cannot set both 'is_staff' and 'is_superuser' at the same time. "
                "Choose the appropriate role for this user."
            )
        return cleaned

class AdminUserChangeForm(UserChangeForm):
    """
    Change form also validates the two flags so edits can't produce invalid state.
    """
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        # Some change forms may not include explicit boolean fields, guard accordingly
        is_staff = cleaned.get("is_staff")
        is_superuser = cleaned.get("is_superuser")
        # Only validate when both fields are present (avoids false positives)
        if is_staff is not None and is_superuser is not None and is_staff and is_superuser:
            raise forms.ValidationError(
                "You cannot set both 'is_staff' and 'is_superuser' at the same time."
            )
        return cleaned

@admin.register(User)
class CustomUserAdmin(DefaultUserAdmin):
    """User admin with validation and permissions"""
    add_form = AdminUserCreationForm
    form = AdminUserChangeForm

    list_display = ("username", "email", "is_staff", "is_superuser", "is_active")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("username", "email")
    ordering = ("username",)

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", "email", "password1", "password2",
                "is_staff", "is_superuser", "groups", "user_permissions",
            ),
        }),
    )

    # Restrict to superusers only
    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def save_model(self, request, obj, form, change):
        """Server-side validation and group management"""
        creating = not change

        if getattr(obj, "is_staff", False) and getattr(obj, "is_superuser", False):
            raise PermissionDenied("User cannot be both staff and superuser.")

        if creating and getattr(obj, "is_superuser", False) and not request.user.is_superuser:
            raise PermissionDenied("Only superusers may create superuser accounts.")

        super().save_model(request, obj, form, change)

        # Manage Moderators group
        try:
            moderators_group, _ = Group.objects.get_or_create(name="Moderators")
            if obj.is_staff and not obj.is_superuser:
                if not obj.groups.filter(name="Moderators").exists():
                    obj.groups.add(moderators_group)
            elif not obj.is_staff and obj.groups.filter(name="Moderators").exists():
                obj.groups.remove(moderators_group)
        except Exception:
            pass

# URL Model Admin with all the enhancements
class CustomClickCountFilter(admin.SimpleListFilter):
    title = 'click count range'
    parameter_name = 'click_range'

    def lookups(self, request, model_admin):
        return [
            ('0', 'No clicks (0)'),
            ('1-9', 'Low activity (1-9)'),
            ('10-49', 'Medium activity (10-49)'),
            ('50-99', 'High activity (50-99)'),
            ('100+', 'Very high activity (100+)'),
        ]

    def queryset(self, request, queryset):
        val = self.value()
        if val == '0':
            return queryset.filter(click_count=0)
        if val == '1-9':
            return queryset.filter(click_count__range=[1, 9])
        if val == '10-49':
            return queryset.filter(click_count__range=[10, 49])
        if val == '50-99':
            return queryset.filter(click_count__range=[50, 99])
        if val == '100+':
            return queryset.filter(click_count__gte=100)
        return queryset

@admin.register(URLModel)
class URLModelAdmin(admin.ModelAdmin):
    list_display = [
        'short_code_display', 'original_url_display', 'click_count_display',
        'created_at_display', 'days_active', 'action_buttons'
    ]

    list_filter = ['created_at', CustomClickCountFilter]
    search_fields = ['short_code', 'original_url']
    ordering = ['-created_at']
    list_per_page = 25

    readonly_fields = [
        'short_code', 'click_count', 'created_at', 'updated_at',
        'full_short_url', 'url_preview', 'click_analytics'
    ]

    fields = [
        'original_url', 'short_code', 'full_short_url', 'url_preview',
        'click_count', 'click_analytics', 'created_at', 'updated_at',
    ]

    def short_code_display(self, obj):
        return format_html(
            '<code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; '
            'font-family: monospace; font-weight: bold; color: #1e40af;">{}</code>',
            obj.short_code
        )
    short_code_display.short_description = 'Short Code'
    short_code_display.admin_order_field = 'short_code'

    def original_url_display(self, obj):
        display_url = obj.original_url[:57] + '...' if len(obj.original_url) > 60 else obj.original_url
        return format_html(
            '<a href="{}" target="_blank" title="{}" style="color: #1d4ed8; text-decoration: none;">{}</a>',
            obj.original_url, obj.original_url, display_url
        )
    original_url_display.short_description = 'Original URL'
    original_url_display.admin_order_field = 'original_url'

    def click_count_display(self, obj):
        if obj.click_count == 0:
            color = '#6b7280'
        elif obj.click_count < 10:
            color = '#059669'
        elif obj.click_count < 50:
            color = '#d97706'
        else:
            color = '#dc2626'
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 12px; '
            'font-size: 11px; font-weight: bold;">{} clicks</span>',
            color, obj.click_count
        )
    click_count_display.short_description = 'Clicks'
    click_count_display.admin_order_field = 'click_count'

    def created_at_display(self, obj):
        now = timezone.now()
        diff = now - obj.created_at
        if diff.days == 0:
            return "Today"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        elif diff.days < 30:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        else:
            return obj.created_at.strftime('%b %d, %Y')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'

    def days_active(self, obj):
        days = (timezone.now() - obj.created_at).days
        return f"{days} days" if days != 1 else "1 day"
    days_active.short_description = 'Active For'

    def action_buttons(self, obj):
        short_url = f"http://localhost:8000/{obj.short_code}"
        delete_url = reverse("admin:urls_urlmodel_delete", args=[obj.pk])
        return format_html(
            '<div style="white-space: nowrap;">'
            '<a href="{}" target="_blank" style="background: #3b82f6; color: white; padding: 4px 8px; '
            'border-radius: 4px; text-decoration: none; font-size: 11px; margin-right: 4px;">Test</a>'
            '<a href="javascript:navigator.clipboard.writeText(\'{}\'); alert(\'Copied to clipboard!\');" '
            'style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; '
            'text-decoration: none; font-size: 11px; margin-right: 4px;">Copy</a>'
            '<a href="{}" style="background: #dc2626; color: white; padding: 4px 8px; '
            'border-radius: 4px; text-decoration: none; font-size: 11px;" '
            'onclick="return confirm(\'Are you sure you want to delete this link?\');">Delete</a>'
            '</div>',
            short_url, short_url, delete_url
        )
    action_buttons.short_description = 'Actions'

    def full_short_url(self, obj):
        short_url = f"http://localhost:8000/{obj.short_code}"
        return format_html(
            '<div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">'
            '<strong>Short URL:</strong><br>'
            '<a href="{}" target="_blank" style="color: #1d4ed8; font-family: monospace; font-size: 16px; '
            'text-decoration: none;">{}</a><br><br>'
            '<button onclick="navigator.clipboard.writeText(\'{}\'); this.innerHTML=\'Copied!\'; '
            'setTimeout(()=>this.innerHTML=\'Copy URL\', 2000);" style="background: #3b82f6; color: white; '
            'border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Copy URL</button>'
            '</div>',
            short_url, short_url, short_url
        )
    full_short_url.short_description = 'Short URL'

    def url_preview(self, obj):
        return format_html(
            '<div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">'
            '<strong>Original URL:</strong><br>'
            '<img src="https://www.google.com/s2/favicons?domain={}" style="width: 16px; height: 16px; '
            'margin-right: 8px; vertical-align: middle;">'
            '<a href="{}" target="_blank" style="color: #1d4ed8; text-decoration: none; word-break: break-all;">{}</a>'
            '</div>',
            obj.original_url.split('/')[2] if '://' in obj.original_url else '',
            obj.original_url, obj.original_url
        )
    url_preview.short_description = 'URL Preview'

    def click_analytics(self, obj):
        days_active = (timezone.now() - obj.created_at).days + 1
        avg_clicks_per_day = obj.click_count / days_active if days_active > 0 else 0
        return format_html(
            '<div style="background: #f0f9ff; padding: 12px; border-radius: 6px; border: 1px solid #bae6fd;">'
            '<h4 style="margin: 0 0 8px 0; color: #0c4a6e;">Click Analytics</h4>'
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">'
            '<div><strong>Total:</strong><br><span style="font-size: 18px; color: #1e40af;">{}</span></div>'
            '<div><strong>Days:</strong><br><span style="font-size: 18px; color: #1e40af;">{}</span></div>'
            '<div><strong>Avg/Day:</strong><br><span style="font-size: 18px; color: #1e40af;">{:.1f}</span></div>'
            '<div><strong>Performance:</strong><br><span style="font-size: 18px; color: {};">{}</span></div>'
            '</div></div>',
            obj.click_count, days_active, avg_clicks_per_day,
            '#059669' if avg_clicks_per_day > 5 else '#d97706' if avg_clicks_per_day > 1 else '#6b7280',
            'Excellent' if avg_clicks_per_day > 5 else 'Good' if avg_clicks_per_day > 1 else 'Low'
        )
    click_analytics.short_description = 'Analytics'

    actions = ['reset_click_counts', 'export_selected_urls']

    def reset_click_counts(self, request, queryset):
        updated = queryset.update(click_count=0)
        self.message_user(request, f'Reset click counts for {updated} URL(s).')
    reset_click_counts.short_description = "Reset click counts"

    def export_selected_urls(self, request, queryset):
        count = queryset.count()
        self.message_user(request, f'Would export {count} URL(s) to CSV (feature coming soon!)')
    export_selected_urls.short_description = "Export selected URLs"

    def changelist_view(self, request, extra_context=None):
        total_urls = URLModel.objects.count()
        total_clicks = URLModel.objects.aggregate(Sum('click_count'))['click_count__sum'] or 0
        avg_clicks = URLModel.objects.aggregate(Avg('click_count'))['click_count__avg'] or 0
        top_url = URLModel.objects.order_by('-click_count').first()

        week_ago = timezone.now() - timedelta(days=7)
        recent_urls = URLModel.objects.filter(created_at__gte=week_ago).count()

        extra_context = extra_context or {}
        extra_context['summary_stats'] = {
            'total_urls': total_urls,
            'total_clicks': total_clicks,
            'avg_clicks': round(avg_clicks, 1),
            'top_url': top_url,
            'recent_urls': recent_urls,
        }
        return super().changelist_view(request, extra_context=extra_context)

# Admin customization
admin.site.site_header = "LinkCrush Administration"
admin.site.site_title = "LinkCrush Admin"
admin.site.index_title = "Welcome to LinkCrush Administration"
