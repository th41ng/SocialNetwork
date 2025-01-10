from rest_framework import viewsets, permissions, generics
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied

from . import models
from .models import User, Post, Group, Notification, GroupMember, Event
from .serializers import UserRegistrationSerializer, UpdatePasswordSerializer, PostSerializer, \
    ProfileWithPostsSerializer, GroupSerializer, NotificationSerializer, EventSerializer, GroupMemberSerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q


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


class ProfileViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    API để lấy thông tin người dùng hiện tại và danh sách bài viết của họ.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Trả về thông tin người dùng hiện tại và danh sách bài viết của họ.
        """
        # Thông tin người dùng hiện tại
        user = request.user

        # Danh sách bài viết của người dùng
        posts = Post.objects.filter(user=user).order_by('-created_date')

        # Kết hợp thông tin người dùng và bài viết
        serializer = ProfileWithPostsSerializer({
            "user": user,
            "posts": posts,
        }, context={'request': request})

        return Response(serializer.data)





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


#Tạo nhóm chỉ định sự kiện
class GroupViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    API cho phép quản lý các nhóm.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Lưu nhóm với người tạo là user hiện tại.
        """
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        """
        Trả về các nhóm mà người dùng đã tạo hoặc tham gia.
        """
        return Group.objects.filter(
            Q(created_by=self.request.user) |
            Q(members__user=self.request.user)
        ).distinct()


class AdminPermission(IsAuthenticated):
    """
    Kiểm tra xem người dùng có phải là quản trị viên không.
    """
    def has_permission(self, request, view):
        # Kiểm tra nếu người dùng có quyền 'is_staff' (quản trị viên)
        if request.user.is_staff:  # Assuming that the 'is_staff' field determines admin users
            return True
        raise PermissionDenied("You must be an admin to create notifications.")

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API quản lý thông báo. Chỉ cho phép quản trị viên tạo thông báo.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [AdminPermission]  # Chỉ cho phép quản trị viên

    def perform_create(self, serializer):
        """
        Lưu thông báo và tự động liên kết người tạo (quản trị viên).
        """
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        """
        Người dùng chỉ thấy thông báo của họ hoặc nhóm mà họ thuộc.
        """
        user_groups = GroupMember.objects.filter(user=self.request.user).values_list('group', flat=True)
        return Notification.objects.filter(
            Q(recipient_group__in=user_groups) |
            Q(created_by=self.request.user)
        ).distinct()


class EventViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    API quản lý sự kiện.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        return Event.objects.filter(
            models.Q(created_by=self.request.user) |
            models.Q(attendees=self.request.user)
        ).distinct()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        """
        Hành động tùy chỉnh để người dùng đăng ký tham gia sự kiện.
        """
        event = get_object_or_404(Event, pk=pk)
        if request.user in event.attendees.all():
            return Response({"message": "Bạn đã đăng ký sự kiện này trước đó."}, status=400)

        event.attendees.add(request.user)
        return Response({"message": "Bạn đã đăng ký tham gia sự kiện thành công."}, status=200)


class GroupMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupMember.objects.all()
    serializer_class = GroupMemberSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()
# Kết thúc code Tạo nhóm chỉ định sự kiện


