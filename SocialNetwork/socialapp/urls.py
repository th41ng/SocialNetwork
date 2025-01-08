from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views




router = DefaultRouter()


router.register('users', views.UserViewSet, basename='user')  # Đăng ký UserViewSet
router.register('profile', views.ProfileViewset, basename='profile')  # Đăng ký profile
router.register('posts', views.PostViewSet, basename='post')  # Đăng ký PostViewSet



urlpatterns = [
    path('', include(router.urls)),
]

