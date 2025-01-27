from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Khởi tạo DefaultRouter
router = DefaultRouter()

# Đăng ký các ViewSet
router.register('users', views.UserViewSet, basename='user')
router.register('profile', views.ProfileViewset, basename='profile')
router.register('posts', views.PostViewSet, basename='post')
router.register('groups', views.GroupViewSet, basename='group')
router.register('notifications', views.NotificationViewSet, basename='notification')
router.register('events', views.EventViewSet, basename='event')
router.register('comments', views.CommentViewSet, basename='comment')
router.register('reactions', views.ReactionViewSet, basename='reaction')
router.register('surveys', views.SurveyViewSet, basename='survey')
router.register('survey-responses', views.SurveyResponseViewSet, basename='survey-response')
router.register('survey-questions', views.SurveyQuestionViewSet, basename='survey-question') # Thêm
router.register('survey-options', views.SurveyOptionViewSet, basename='survey-option') # Thêm
router.register('roles', views.RoleViewSet, basename='roles')
router.register(r'surveys/list', views.SurveyListViewSet, basename='survey-list') # Thêm dòng này
router.register('someone-profile',views.SomeOneProfileViewset,basename='someone-profile')
# Định nghĩa URL patterns
urlpatterns = [
    path('', include(router.urls)),
    # Điều chỉnh đường dẫn thống kê, sử dụng action thay vì view riêng
    path('surveys/<int:pk>/statistics/', views.SurveyViewSet.as_view({'get': 'statistics'}), name='survey-statistics'),
    # Thêm đường dẫn đóng khảo sát
    path('surveys/<int:pk>/close_survey/', views.SurveyViewSet.as_view({'patch': 'close_survey'}), name='close-survey'),
]