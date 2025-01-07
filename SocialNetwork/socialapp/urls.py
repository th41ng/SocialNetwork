
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký UserViewSet vào router
router.register('users', views.UserViewSet, basename='user') #Đăng kí
router.register('profile',views.UserViewSet,basename='profile') #Trang cá nhân

# Đưa các URL của router vào urlpatterns

router = DefaultRouter()
router.register('post', views.PostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
