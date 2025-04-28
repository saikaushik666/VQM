from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from queue_manager.consumers import QueueConsumer

websocket_urlpatterns = [
    path('ws/queue/', QueueConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "websocket": URLRouter(websocket_urlpatterns),
})