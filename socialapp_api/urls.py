
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('',include('socialapp.urls')),
    path('admin/', admin.site.urls),
]