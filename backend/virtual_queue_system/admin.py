from django.contrib import admin
from django.contrib.admin import AdminSite
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

class CustomAdminSite(AdminSite):
    site_header = _('Queue Management System Admin')
    site_title = _('Queue Management System')
    index_title = _('Dashboard')
    site_url = '/admin'

    def get_app_list(self, request):
        """
        Customize the app list ordering - put queue_manager first
        """
        app_list = super().get_app_list(request)
        
        # Reorder apps to prioritize queue_manager
        ordered_apps = []
        
        # Add queue_manager first
        queue_app = next((app for app in app_list if app['app_label'] == 'queue_manager'), None)
        if queue_app:
            ordered_apps.append(queue_app)
            
        # Add auth next
        auth_app = next((app for app in app_list if app['app_label'] == 'auth'), None)
        if auth_app:
            ordered_apps.append(auth_app)
            
        # Add remaining apps
        for app in app_list:
            if app not in ordered_apps:
                ordered_apps.append(app)
                
        return ordered_apps

    def each_context(self, request):
        context = super().each_context(request)
        # Add custom context variables if needed
        context['custom_variable'] = 'value'
        return context

# Instantiate the custom admin site
admin_site = CustomAdminSite(name='custom_admin')