from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khai báo router cho các ViewSet
router = DefaultRouter()


router.register('users', views.UserViewSet, basename='user')
router.register('profile', views.ProfileViewset, basename='profile')
router.register('posts', views.PostViewSet, basename='post')
router.register('comments', views.CommentViewSet, basename='comment')
router.register('reactions', views.ReactionViewSet, basename='reaction')
router.register('surveys', views.SurveyViewSet, basename='survey')
router.register('survey-responses', views.SurveyResponseViewSet, basename='survey-response')

urlpatterns = [
    path('', include(router.urls)),
]
