
from django.db.models.fields import return_None
from rest_framework import viewsets, permissions, generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User, Post
from .serializers import UserRegistrationSerializer, UpdatePasswordSerializer, PostSerializer
from django.utils import timezone
from datetime import timedelta
from django.http import Http404


class UserViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['get_current_user']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        """
        Trả về thông tin người dùng hiện tại.
        """
        return Response(UserRegistrationSerializer(request.user).data)

    @action(methods=['post'], url_path='update-password', detail=False)
    def update_password(self, request):
        """
        Giúp giảng viên đổi mật khẩu khi nhận tài khoản với mật khẩu mặc định.
        """
        serializer = UpdatePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mật khẩu đã được thay đổi."}, status=200)
        return Response(serializer.errors, status=400)

    @action(methods=['post'], url_path='reset-password-deadline', detail=True)
    def reset_password_deadline(self, request, pk=None):
        """
        Action dành cho quản trị viên để reset thời gian thay đổi mật khẩu và mở lại tài khoản người dùng bị khoá.
        """
        user = User.objects.get(pk=self.kwargs['pk'])

        # Kiểm tra nếu người dùng đã bị khoá
        if not user.is_active:
            user.is_active = True  # Mở lại tài khoản
            user.password_reset_deadline = timezone.now() + timedelta(
                days=1)  # Thiết lập lại thời gian thay đổi mật khẩu
            user.save()
            return Response({
                "message": f"Đã reset thời gian đổi mật khẩu cho người dùng {user.username}. Tài khoản đã được mở lại."
            }, status=200)

        return Response({"error": "Tài khoản này chưa bị khoá hoặc không cần reset."}, status=400)


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Cho phép tất cả truy cập với phương thức GET,
    nhưng yêu cầu đăng nhập với các phương thức khác (POST, PUT, DELETE).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:  # SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
            return True
        return request.user and request.user.is_authenticated

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


