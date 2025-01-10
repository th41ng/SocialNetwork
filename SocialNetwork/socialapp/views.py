from django.db.models import Count
from rest_framework import viewsets, permissions, generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView

from .models import User, Post, Reaction, Comment, Survey, SurveyResponse, SurveyQuestion, SurveyOption
from .serializers import UserRegistrationSerializer, UpdatePasswordSerializer, PostSerializer, \
    ProfileWithPostsSerializer, ReactionSerializer, CommentSerializer, SurveySerializer, SurveyResponseSerializer
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
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """
        Kiểm tra quyền sở hữu trước khi chỉnh sửa bài viết.
        """
        post = self.get_object()
        if post.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa bài viết này.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Kiểm tra quyền sở hữu trước khi xóa bài viết.
        """
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

        # Kiểm tra nếu người dùng đã thả cảm xúc
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
        """
        Xóa cảm xúc của người dùng khỏi bài viết.
        """
        post = self.get_object()
        reaction = Reaction.objects.filter(target_type='post', target_id=post.id, user=request.user).first()

        if reaction:
            reaction.delete()
            return Response({"message": "Đã xóa cảm xúc."}, status=204)
        return Response({"message": "Không tìm thấy cảm xúc để xóa."}, status=404)

    @action(methods=['get'], detail=True, url_path='reactions-summary')
    def reactions_summary(self, request, pk=None):
        """
        Lấy tổng hợp số lượng cảm xúc cho bài viết.
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
        Khóa bình luận của bài viết.
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
        Mở khóa bình luận của bài viết.
        """
        post = self.get_object()
        if post.user != request.user:
            raise PermissionDenied("Bạn không có quyền mở khóa bình luận bài viết này.")
        post.is_comment_locked = False
        post.save()
        return Response({"message": "Đã mở khóa bình luận cho bài viết này."}, status=200)

class ReactionViewSet(viewsets.ModelViewSet):
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer



class CommentViewSet(viewsets.ModelViewSet):
    """
    Xử lý API cho bình luận (Comment).
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] #"""cho phep chưa đăng nhập vẫn xem đc"""

    def perform_create(self, serializer):
        """
        Gắn người dùng hiện tại vào bình luận khi tạo mới.
        """
        try:
            post = Post.objects.get(id=self.request.data['post'])
        except Post.DoesNotExist:
            raise ValidationError("Bài viết không tồn tại.")

        if post.is_comment_locked:
            raise ValidationError("Bài viết này đã khóa bình luận.")

        serializer.save(user=self.request.user, post=post)

    def perform_update(self, serializer):
        """
        Kiểm tra quyền sở hữu trước khi chỉnh sửa bình luận.
        """
        comment = self.get_object()
        if comment.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa bình luận này.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Kiểm tra quyền sở hữu trước khi xóa bình luận.
        """
        if instance.user != self.request.user and instance.post.user != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa bình luận này.")
        instance.delete()

    @action(methods=['post'], detail=True, url_path='react', permission_classes=[IsAuthenticated])
    def react(self, request, pk=None):
        """
        Thả cảm xúc vào bình luận.
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
        """
        Xóa cảm xúc của người dùng khỏi bình luận.
        """
        comment = self.get_object()
        reaction = Reaction.objects.filter(target_type='comment', target_id=comment.id, user=request.user).first()

        if reaction:
            reaction.delete()
            return Response({"message": "Đã xóa cảm xúc."}, status=204)
        return Response({"message": "Không tìm thấy cảm xúc để xóa."}, status=404)

    @action(methods=['get'], detail=True, url_path='reactions-summary')
    def reactions_summary(self, request, pk=None):
        """
        Lấy tổng hợp số lượng cảm xúc cho bình luận.
        """
        comment = self.get_object()
        reactions = Reaction.objects.filter(target_type='comment', target_id=comment.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))

        return Response({
            "reaction_summary": {reaction['reaction_type']: reaction['count'] for reaction in summary}
        })

class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Chỉ quản trị viên mới có quyền tạo khảo sát.")
        survey = serializer.save(created_by=self.request.user)

        # Thêm câu hỏi và đáp án mẫu (nếu cần)
        questions_data = self.request.data.get('questions', [])
        for question_data in questions_data:
            question = SurveyQuestion.objects.create(
                survey=survey,
                text=question_data['text'],
                question_type=question_data['question_type']
            )
            if 'options' in question_data:
                for option_data in question_data['options']:
                    SurveyOption.objects.create(question=question, text=option_data['text'])


class SurveyResponseViewSet(viewsets.ModelViewSet):
    """
    Xử lý API cho SurveyResponse (Phản hồi khảo sát).
    """
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Gắn user hiện tại và survey vào phản hồi khảo sát.
        """
        survey_id = self.request.data.get('survey')
        response_data = self.request.data.get('response_data', {})

        try:
            survey = Survey.objects.get(id=survey_id)
        except Survey.DoesNotExist:
            raise ValidationError("Khảo sát không tồn tại.")

        # Validate câu trả lời
        for question in survey.questions.all():
            question_id = str(question.id)
            if question.question_type == 'multiple_choice':
                if response_data.get(question_id) not in [o.text for o in question.options.all()]:
                    raise ValidationError(f"Invalid response for question: {question.text}")

        serializer.save(user=self.request.user, survey=survey)

class SurveyStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"error": "Khảo sát không tồn tại."}, status=404)

        statistics = {}
        for question in survey.questions.all():
            if question.question_type == 'multiple_choice':
                statistics[question.text] = {}
                for option in question.options.all():
                    count = SurveyResponse.objects.filter(
                        survey=survey,
                        response_data__contains={str(question.id): option.text}
                    ).count()
                    statistics[question.text][option.text] = count

        return Response(statistics)