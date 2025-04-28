from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django import forms
from .models import User, ServiceCategory, Service, Queue, Window

# First define all your ModelAdmin classes
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'phone_number')
    ordering = ('-date_joined',)
    readonly_fields = ('last_updated', 'date_joined')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email', 'phone_number', 'user_type')}),
        ('Permissions', {
            'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser', 'is_service_provider', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_updated', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'user_type'),
        }),
    )

class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_count', 'icon')
    search_fields = ('name', 'description')
    
    def service_count(self, obj):
        return obj.services.count()
    service_count.short_description = 'Services'

class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'provider', 'status', 'average_service_time', 'queue_count')
    list_filter = ('status', 'category', 'provider')
    search_fields = ('name', 'description', 'provider__username')
    raw_id_fields = ('provider',)
    list_editable = ('status',)
    readonly_fields = ('created_at', 'updated_at')
    
    def queue_count(self, obj):
        count = obj.queues.count()
        url = reverse('admin:queue_manager_queue_changelist') + f'?service__id__exact={obj.id}'
        return format_html('<a href="{}">{} Queues</a>', url, count)
    queue_count.short_description = 'Active Queues'

class QueueAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'service', 'status', 'position', 'priority', 'join_time')
    list_filter = ('status', 'service', 'service__provider')
    search_fields = ('user__username', 'service__name', 'notes')
    raw_id_fields = ('user', 'service')
    readonly_fields = ('join_time', 'start_time', 'end_time')
    list_editable = ('status', 'priority')
    date_hierarchy = 'join_time'

class WindowAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'service_provider', 'current_queue_link', 'services_list', 'location')
    list_filter = ('status', 'service_provider')
    search_fields = ('name', 'location', 'service_provider__username')
    filter_horizontal = ('services',)
    readonly_fields = ('last_active',)
    list_editable = ('status',)
    
    def current_queue_link(self, obj):
        if obj.current_queue:
            url = reverse('admin:queue_manager_queue_change', args=[obj.current_queue.id])
            return format_html('<a href="{}">Queue #{}</a>', url, obj.current_queue.id)
        return "-"
    current_queue_link.short_description = 'Current Queue'
    
    def services_list(self, obj):
        return ", ".join([s.name for s in obj.services.all()[:3]])
    services_list.short_description = 'Services'

# Now register all models with the admin site
admin.site.register(User, CustomUserAdmin)
admin.site.register(ServiceCategory, ServiceCategoryAdmin)
admin.site.register(Service, ServiceAdmin)
admin.site.register(Queue, QueueAdmin)
admin.site.register(Window, WindowAdmin)