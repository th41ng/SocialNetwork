from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import StatisticsView


# Thêm đường dẫn cho các API
# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký các ViewSet
router.register('users', views.UserViewSet, basename='user')  # UserViewSet
router.register('profile', views.ProfileViewset, basename='profile')  # ProfileViewSet
router.register('posts', views.PostViewSet, basename='post')  # PostViewSet
router.register('groups', views.GroupViewSet, basename='group')  # GroupViewSet
router.register('notifications', views.NotificationViewSet, basename='notification')  # NotificationViewSet
router.register('events', views.EventViewSet, basename='event')  # EventViewSet
router.register('comments', views.CommentViewSet, basename='comment')
router.register('reactions', views.ReactionViewSet, basename='reaction')
router.register('surveys', views.SurveyViewSet, basename='survey')
router.register('survey-responses', views.SurveyResponseViewSet, basename='survey-response')
# Định nghĩa URL patterns
urlpatterns = [
    path('', include(router.urls)),
    # API thống kê khảo sát
    path('surveys/<int:pk>/statistics/', views.SurveyStatisticsView.as_view(), name='survey-statistics'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
]
