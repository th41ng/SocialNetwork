from email.policy import default

from django.db import router
from django.urls import path, include
from . import views
from rest_framework.routers import  DefaultRouter

router = DefaultRouter()
router.register('post', views.PostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
