from os.path import basename

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký UserViewSet vào router
router.register('users', views.UserViewSet, basename='user') #Đăng kí
router.register('profile',views.UserViewSet,basename='profile') #Trang cá nhân

# Đưa các URL của router vào urlpatterns
urlpatterns = [
    path('', include(router.urls)),  # Đảm bảo rằng router URL được bao gồm
]
