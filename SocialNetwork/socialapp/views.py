from django.db.models import Count, Q
from rest_framework import viewsets, permissions, generics, status
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.contrib.auth.hashers import check_password, make_password

from .models import (
    Reaction,
    Comment,
    Survey,
    SurveyResponse,
    Role,
    User,
    Post,
    Notification,
    GroupMember,
    Event,
    PostCategory
)

from .serializers import (
    ReactionSerializer,
    CommentSerializer,
    SurveySerializer,
    SurveyResponseSerializer,
    RoleSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    PostSerializer,
    ProfileWithPostsSerializer,
    NotificationSerializer,
    PostCategorySerializer,
    EventSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['update_user', 'change_password']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


    @action(detail=False, methods=['patch'], url_path='update', permission_classes=[permissions.IsAuthenticated])
    def update_user(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Đăng ký thành công!", "user": serializer.data},
            status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='change-password', permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        # Kiểm tra mật khẩu cũ
        if not check_password(old_password, user.password):
            return Response({"error": "Mật khẩu hiện tại không đúng."}, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra xác nhận mật khẩu mới
        if new_password != confirm_password:
            return Response({"error": "Mật khẩu mới không khớp."}, status=status.HTTP_400_BAD_REQUEST)

        # Cập nhật mật khẩu
        user.password = make_password(new_password)
        user.password_reset_deadline = None
        user.save()

        return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)



class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    @action(detail=False, methods=['get'], url_path='all')
    def get_all_roles(self, request):
        roles = self.get_queryset()
        data = [{"id": role.id, "name": role.name} for role in roles]
        return Response(data)


class ProfileViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user

        return Post.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        user = request.user

        # Danh sách bài viết của người dùng
        posts = Post.objects.filter(user=user).order_by('-created_date')

        # thông tin nguời dùng và bài viết
        serializer = ProfileWithPostsSerializer({
            "user": user,
            "posts": posts,
        }, context={'request': request})

        return Response(serializer.data)


class SomeOneProfileViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id is None:
            raise ValidationError("user_id là bắt buộc.")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError("Người dùng không tồn tại.")

        return Post.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        user_id = request.query_params.get('user_id')

        if user_id is None:
            return Response({"detail": "user_id là bắt buộc."}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Người dùng không tồn tại."}, status=404)

        posts = Post.objects.filter(user=user).order_by('-created_date')

        #  thông tin người dùng và bài viết
        serializer = ProfileWithPostsSerializer(instance={
            "user": user,
            "posts": posts,
        }, context={'request': request})

        return Response(serializer.data)

class IsAuthenticatedOrReadOnly(BasePermission):
    """
    - Cho phép tất cả xem
    - Yêu cầu đăng nhập (post,put,delete)
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class PostCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PostCategory.objects.all()
    serializer_class = PostCategorySerializer


class PostViewSet(viewsets.ModelViewSet):

    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        """
        Gắn người dùng hiện tại vào bài viết khi tạo mới
        """
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):

        post = self.get_object()
        if post.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa bài viết này.")
        serializer.save()

    def perform_destroy(self, instance):

        if instance.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa bài viết này.")
        instance.delete()

    @action(methods=['post'], detail=True, url_path='react', permission_classes=[IsAuthenticated])
    def react(self, request, pk=None):
        """
        Thả cảm xúc vào bài viết.
        """
        post = self.get_object()
        reaction_type = request.data.get('reaction_type')

        if reaction_type not in dict(Reaction.REACTION_CHOICES):
            raise ValidationError("Loại cảm xúc không hợp lệ.")

        # Kt nếu người dùng đã thả cảm xúc
        reaction, created = Reaction.objects.update_or_create(
            target_type='post',
            target_id=post.id,
            user=request.user,
            defaults={'reaction_type': reaction_type}
        )

        message = "Đã thêm cảm xúc." if created else "Đã cập nhật cảm xúc."
        return Response({
            "message": message,
            "reaction": ReactionSerializer(reaction, context={'request': request}).data
        })

    @action(methods=['delete'], detail=True, url_path='remove-reaction', permission_classes=[IsAuthenticated])
    def remove_reaction(self, request, pk=None):
        post = self.get_object()
        reaction = Reaction.objects.filter(target_type='post', target_id=post.id, user=request.user).first()

        if reaction:
            reaction.delete()
            return Response({"message": "Đã xóa cảm xúc."}, status=204)
        return Response({"message": "Không tìm thấy cảm xúc để xóa."}, status=404)

    @action(methods=['get'], detail=True, url_path='reactions-summary')
    def reactions_summary(self, request, pk=None):
        """
       tổng hợp cảm xúc post
        """
        post = self.get_object()
        reactions = Reaction.objects.filter(target_type='post', target_id=post.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))

        return Response({
            "reaction_summary": {reaction['reaction_type']: reaction['count'] for reaction in summary}
        })

    @action(methods=['post'], detail=True, url_path='lock-comments', permission_classes=[IsAuthenticated])
    def lock_comments(self, request, pk=None):
        """
        Khóa bình luận
        """
        post = self.get_object()
        if post.user != request.user:
            raise PermissionDenied("Bạn không có quyền khóa bình luận bài viết này.")
        post.is_comment_locked = True
        post.save()
        return Response({"message": "Đã khóa bình luận cho bài viết này."}, status=200)

    @action(methods=['post'], detail=True, url_path='unlock-comments', permission_classes=[IsAuthenticated])
    def unlock_comments(self, request, pk=None):
        """
        Mở khóa bình luận
        """
        post = self.get_object()
        if post.user != request.user:
            raise PermissionDenied("Bạn không có quyền mở khóa bình luận bài viết này.")
        post.is_comment_locked = False
        post.save()
        return Response({"message": "Đã mở khóa bình luận cho bài viết này."}, status=200)

    @action(methods=['get'], detail=False, url_path='my-posts', permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        """
        Lấy danh sách bài đăng của người dùng hiện tại.
        """
        user = request.user
        posts = Post.objects.filter(user=user).order_by('-created_date')  # Lấy bài đăng theo thứ tự mới nhất
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)




class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            reaction = serializer.save()
            if reaction:
                # cập nhật cảm xúc thành công
                return Response(
                    ReactionSerializer(reaction, context={"request": request}).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                # cảm xúc bị xóa
                return Response({"message": "Reaction removed."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class CommentViewSet(viewsets.ModelViewSet):

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] #"""cho phep chưa đăng nhập vẫn xem đc"""

    def perform_create(self, serializer):

        try:
            post = Post.objects.get(id=self.request.data['post'])
        except Post.DoesNotExist:
            raise ValidationError("Bài viết không tồn tại.")

        if post.is_comment_locked:
            raise ValidationError("Bài viết này đã khóa bình luận.")

        serializer.save(user=self.request.user, post=post)

    def perform_update(self, serializer):

        comment = self.get_object()
        if comment.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa bình luận này.")
        serializer.save()

    def perform_destroy(self, instance):

        if instance.user != self.request.user and instance.post.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa bình luận này.")
        instance.delete()

    @action(methods=['post'], detail=True, url_path='react', permission_classes=[IsAuthenticated])
    def react(self, request, pk=None):
        """
        reactions cho bình luận.
        """
        comment = self.get_object()
        reaction_type = request.data.get('reaction_type')

        if reaction_type not in dict(Reaction.REACTION_CHOICES):
            raise ValidationError("Loại cảm xúc không hợp lệ.")

        # Kiểm tra nếu người dùng đã thả cảm xúc
        reaction, created = Reaction.objects.update_or_create(
            target_type='comment',
            target_id=comment.id,
            user=request.user,
            defaults={'reaction_type': reaction_type}
        )

        message = "Đã thêm cảm xúc." if created else "Đã cập nhật cảm xúc."
        return Response({
            "message": message,
            "reaction": ReactionSerializer(reaction, context={'request': request}).data
        })

    @action(methods=['delete'], detail=True, url_path='remove-reaction', permission_classes=[IsAuthenticated])
    def remove_reaction(self, request, pk=None):

        comment = self.get_object()
        reaction = Reaction.objects.filter(target_type='comment', target_id=comment.id, user=request.user).first()

        if reaction:
            reaction.delete()
            return Response({"message": "Đã xóa cảm xúc."}, status=204)
        return Response({"message": "Không tìm thấy cảm xúc để xóa."}, status=404)

    @action(methods=['get'], detail=True, url_path='reactions-summary')
    def reactions_summary(self, request, pk=None):
        """
      tổng hợp cảm xúc cmt
        """
        comment = self.get_object()
        reactions = Reaction.objects.filter(target_type='comment', target_id=comment.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))

        return Response({
            "reaction_summary": {reaction['reaction_type']: reaction['count'] for reaction in summary}
        })

class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.filter(status='active')
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
            return Survey.objects.filter(status='active')



class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        survey_id = self.request.data.get('survey')

        try:
            survey = Survey.objects.get(id=survey_id)
        except Survey.DoesNotExist:
            raise ValidationError("Khảo sát không tồn tại.")

        if survey.status == 'closed':
            raise ValidationError("Khảo sát đã đóng và không thể thêm phản hồi.")

        existing_response = SurveyResponse.objects.filter(user=self.request.user, survey=survey).first()
        if existing_response:
            raise ValidationError("Bạn đã trả lời khảo sát này trước đó.")

        serializer.save(user=self.request.user, survey=survey)




class NotificationViewSet(viewsets.ModelViewSet):

    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):

        serializer.save(created_by=self.request.user)

    def get_queryset(self):

        user_groups = GroupMember.objects.filter(user=self.request.user).values_list('group', flat=True)
        return Notification.objects.filter(
            Q(recipient_group__in=user_groups) |
            Q(recipient_user=self.request.user)
        ).distinct()


class EventViewSet(viewsets.ModelViewSet):

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        event_id = self.kwargs.get('pk')
        queryset = Event.objects.all()
        if event_id:
            queryset = queryset.filter(id=event_id)
        return queryset
