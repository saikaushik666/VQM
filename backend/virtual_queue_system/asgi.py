import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import queue_manager.routing

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'virtual_queue_system.settings')

# Import websocket_urlpatterns AFTER setting DJANGO_SETTINGS_MODULE
from queue_manager.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})