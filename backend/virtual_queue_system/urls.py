from django.contrib import admin
from django.urls import path, include
from .admin import admin_site



urlpatterns = [
    path('admin/', admin_site.urls),
    path('admin-access/', admin.site.urls),
    path('api/', include('queue_manager.urls')),
]