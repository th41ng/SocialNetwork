from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký các ViewSet
router.register('users', views.UserViewSet, basename='user')  # UserViewSet
router.register('profile', views.ProfileViewset, basename='profile')  # ProfileViewSet
router.register('posts', views.PostViewSet, basename='post')  # PostViewSet
router.register('groups', views.GroupViewSet, basename='group')  # GroupViewSet
router.register('notifications', views.NotificationViewSet, basename='notification')  # NotificationViewSet
router.register('events', views.EventViewSet, basename='event')  # EventViewSet

# Định nghĩa URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
