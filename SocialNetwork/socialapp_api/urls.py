from django.contrib import admin
from django.urls import path, include
from oauth2_provider.views import TokenView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    path('', include('socialapp.urls')),
]
