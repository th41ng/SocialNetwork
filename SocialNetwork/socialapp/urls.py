from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký các ViewSet
router.register('users', views.UserViewSet, basename='user')
router.register('profile', views.ProfileViewset, basename='profile')
router.register('posts', views.PostViewSet, basename='post')
router.register('notifications', views.NotificationViewSet, basename='notification')
router.register('events', views.EventViewSet, basename='event')
router.register('comments', views.CommentViewSet, basename='comment')
router.register('reactions', views.ReactionViewSet, basename='reaction')
router.register('surveys', views.SurveyViewSet, basename='survey')
router.register('survey-responses', views.  SurveyResponseViewSet, basename='survey-response')
router.register('roles', views.RoleViewSet, basename='roles')
router.register('someone-profile',views.SomeOneProfileViewset,basename='someone-profile')
router.register('post-categories', views.PostCategoryViewSet, basename='post-category')

# Định nghĩa URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
