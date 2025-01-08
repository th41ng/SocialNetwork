from rest_framework import viewsets, permissions, generics
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from .models import User, Post
from .serializers import UserRegistrationSerializer, UpdatePasswordSerializer, PostSerializer
from django.utils import timezone
from datetime import timedelta



class UserViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    Xử lý API cho User.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Cung cấp quyền truy cập cho các phương thức khác nhau.
        """
        if self.action in ['get_current_user']:
            return [permissions.IsAuthenticated()]  # Chỉ cho phép người dùng đã đăng nhập
        return [permissions.AllowAny()]  # Các hành động khác đều được phép truy cập

    @action(methods=['get'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        """
        Trả về thông tin người dùng hiện tại.
        """
        return Response(UserRegistrationSerializer(request.user).data)

    @action(methods=['post'], url_path='update-password', detail=False)
    def update_password(self, request):
        """
        Đổi mật khẩu cho người dùng hiện tại.
        """
        serializer = UpdatePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mật khẩu đã được thay đổi."}, status=200)
        return Response(serializer.errors, status=400)

    @action(methods=['post'], url_path='reset-password-deadline', detail=True)
    def reset_password_deadline(self, request, pk=None):
        """
        Reset thời gian đổi mật khẩu và mở lại tài khoản bị khóa (dành cho Admin).
        """
        try:
            user = User.objects.get(pk=self.kwargs['pk'])  # Tìm người dùng theo ID
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if not user.is_active:
            user.is_active = True
            user.password_reset_deadline = timezone.now() + timedelta(days=1)  # Reset deadline
            user.save()
            return Response({
                "message": f"Đã reset thời gian đổi mật khẩu cho người dùng {user.username}. Tài khoản đã được mở lại."
            }, status=200)

        return Response({"error": "Tài khoản này chưa bị khoá hoặc không cần reset."}, status=400)


# Quyền truy cập: Chỉ cho phép người dùng đã đăng nhập hoặc chỉ cho phép xem
class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Quyền truy cập:
    - Cho phép tất cả xem (GET, HEAD, OPTIONS).
    - Yêu cầu đăng nhập với các hành động khác (POST, PUT, DELETE).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated



class PostViewSet(viewsets.ModelViewSet):
    """
    Xử lý API cho Post.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Kiểm tra quyền truy cập cho bài viết

    def perform_create(self, serializer):
        """
        Gắn người dùng hiện tại vào bài viết khi tạo mới.
        """
        serializer.save(user=self.request.user)  # Tự động gán người dùng hiện tại là tác giả của bài viết

    def perform_update(self, serializer):
        """
        Kiểm tra quyền sở hữu trước khi chỉnh sửa bài viết.
        """
        post = self.get_object()
        if post.user != self.request.user:  # Kiểm tra xem người dùng hiện tại có phải là tác giả không
            raise PermissionDenied("Bạn không có quyền chỉnh sửa bài viết này.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Kiểm tra quyền sở hữu trước khi xóa bài viết.
        """
        if instance.user != self.request.user:  # Kiểm tra quyền xóa bài viết
            raise PermissionDenied("Bạn không có quyền xóa bài viết này.")
        instance.delete()  # Xóa bài viết
