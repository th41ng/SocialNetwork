from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import cloudinary
import cloudinary.uploader

from django.db.models.functions import TruncYear, ExtractQuarter, TruncMonth

from rest_framework import viewsets, permissions, generics
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from django.contrib.auth.hashers import check_password, make_password

# Import đầy đủ các serializers và models
from .models import (
    Reaction,
    Comment,
    Survey,
    SurveyResponse,
    SurveyQuestion,
    SurveyOption,
    Role,
    User,
    Post,
    Group,
    Notification,
    GroupMember,
    Event,
    SurveyAnswer,
    PostCategory
)
from .serializers import (
    ReactionSerializer,
    CommentSerializer,
    SurveySerializer,
    SurveyResponseSerializer,
    SurveyQuestionSerializer,
    SurveyOptionSerializer,
    AnswerSerializer,
    RoleSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    PostSerializer,
    ProfileWithPostsSerializer,
    GroupSerializer,
    NotificationSerializer,
    EventSerializer,
    GroupMemberSerializer,
    PostCategorySerializer
)

from django.utils import timezone
from datetime import timedelta


class UserViewSet(viewsets.ModelViewSet):
    """
    Xử lý API cho User.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Cung cấp quyền truy cập cho các phương thức khác nhau.
        """
        if self.action in ['get_current_user', 'update_user', 'change_password']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get'], url_path='current', permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        """
        Lấy thông tin người dùng hiện tại.
        """
        user = request.user
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='update', permission_classes=[permissions.IsAuthenticated])
    def update_user(self, request):
        """
        Cập nhật thông tin người dùng hiện tại.
        """
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register(self, request):
        """
        Đăng ký người dùng mới.
        """
        serializer = UserRegistrationSerializer(data=request.data)  # Sử dụng UserRegistrationSerializer để đăng ký
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Đăng ký thành công!", "user": serializer.data},
            status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='change-password',
            permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """
        Đổi mật khẩu người dùng hiện tại.
        """
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
    """
    API cho Role, hỗ trợ CRUD và lấy danh sách tất cả roles.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer  # Chỉ định serializer

    @action(detail=False, methods=['get'], url_path='all')
    def get_all_roles(self, request):
        """
        Lấy tất cả roles mà không yêu cầu xác thực.
        """
        roles = self.get_queryset()
        data = [{"id": role.id, "name": role.name} for role in roles]
        return Response(data)


class ProfileViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    API để lấy thông tin profile của người dùng cụ thể (hoặc hiện tại) và danh sách bài viết của họ.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Lấy danh sách bài viết của người dùng hiện tại hoặc người dùng khác (nếu có user_id).
        """
        user_id = self.request.query_params.get('user_id')
        if user_id:
            user = get_object_or_404(User, id=user_id)
        else:
            user = self.request.user

        return Post.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        """
        Trả về thông tin profile của người dùng và danh sách bài viết của họ.
        """
        # Lấy thông tin người dùng từ query params
        user_id = request.query_params.get('user_id')
        if user_id:
            user = get_object_or_404(User, id=user_id)
        else:
            user = request.user

        # Danh sách bài viết của người dùng
        posts = Post.objects.filter(user=user).order_by('-created_date')

        # Kết hợp thông tin người dùng và bài viết
        serializer = ProfileWithPostsSerializer({
            "user": user,
            "posts": posts,
        }, context={'request': request})

        return Response(serializer.data)


class SomeOneProfileViewset(viewsets.ModelViewSet, generics.RetrieveAPIView):
    """
    API để lấy thông tin người dùng khác và danh sách bài viết của họ.
    """

    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id is None:
            raise ValidationError("user_id là bắt buộc.")

        # Lấy người dùng thay vì bài viết
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError("Người dùng không tồn tại.")

        return Post.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        """
        Trả về thông tin người dùng và danh sách bài viết của họ theo user_id.
        """
        user_id = request.query_params.get('user_id')

        if user_id is None:
            return Response({"detail": "user_id là bắt buộc."}, status=400)

        # Lấy thông tin người dùng
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Người dùng không tồn tại."}, status=404)

        # Danh sách bài viết của người dùng
        posts = Post.objects.filter(user=user).order_by('-created_date')

        # Kết hợp thông tin người dùng và bài viết
        serializer = ProfileWithPostsSerializer(instance={
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
                # Nếu thêm/cập nhật cảm xúc thành công
                return Response(
                    ReactionSerializer(reaction, context={"request": request}).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                # Nếu cảm xúc bị xóa
                return Response({"message": "Reaction removed."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CommentViewSet(viewsets.ModelViewSet):
    """
    Xử lý API cho bình luận (Comment).
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # """cho phep chưa đăng nhập vẫn xem đc"""

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
    queryset = Survey.objects.filter(status='active')
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Chỉ quản trị viên mới có quyền tạo khảo sát.")
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        # Chỉ trả về các khảo sát đang active, hoặc các khảo sát do user hiện tại tạo (nếu là staff)
        if self.request.user.is_staff:
            return Survey.objects.filter(Q(status='active') | Q(created_by=self.request.user))
        else:
            return Survey.objects.filter(status='active')

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        survey = self.get_object()
        statistics_data = []

        for question in survey.questions.all():
            question_data = {
                'question_id': question.id,
                'question_text': question.text,
                'question_type': question.question_type,
                'results': []
            }

            if question.question_type == 'text':
                answers = SurveyAnswer.objects.filter(question=question).values_list('text_answer', flat=True)
                question_data['results'] = list(answers)
            elif question.question_type == 'multiple_choice':
                choices = SurveyOption.objects.filter(question=question)
                for choice in choices:
                    count = SurveyAnswer.objects.filter(question=question, option=choice).count()
                    question_data['results'].append({
                        'choice_text': choice.text,
                        'count': count
                    })

            statistics_data.append(question_data)

        return Response(statistics_data)

    @action(detail=True, methods=['patch'])
    def close_survey(self, request, pk=None):
        survey = self.get_object()
        if not request.user.is_staff and request.user != survey.created_by:
            raise PermissionDenied("Bạn không có quyền đóng khảo sát này.")

        survey.status = 'closed'
        survey.save()
        return Response({"message": "Đã đóng khảo sát."}, status=status.HTTP_200_OK)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class SurveyResponseViewSet(viewsets.ModelViewSet):
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        survey_id = self.request.data.get('survey')
        # answers_data = self.request.data.get('answers', []) # Dòng này không cần thiết nữa

        try:
            survey = Survey.objects.get(id=survey_id)
        except Survey.DoesNotExist:
            raise ValidationError("Khảo sát không tồn tại.")

        if survey.status == 'closed':
            raise ValidationError("Khảo sát đã đóng và không thể thêm phản hồi.")

        existing_response = SurveyResponse.objects.filter(user=self.request.user, survey=survey).first()
        if existing_response:
            raise ValidationError("Bạn đã trả lời khảo sát này trước đó.")

        # Chỉ lưu SurveyResponse, các SurveyAnswer đã được xử lý trong serializer
        serializer.save(user=self.request.user, survey=survey)

        # Xóa bỏ hoàn toàn phần code tạo SurveyAnswer bên dưới
        # for answer_data in answers_data:
        #     question_id = answer_data.get('question')
        #     text_answer = answer_data.get('text_answer')
        #     option_id = answer_data.get('option')

        #     try:
        #         question = SurveyQuestion.objects.get(pk=question_id)
        #     except SurveyQuestion.DoesNotExist:
        #         raise ValidationError(f"Câu hỏi với ID {question_id} không tồn tại.")

        #     if question.question_type == 'text':
        #         SurveyAnswer.objects.create(response=response, question=question, text_answer=text_answer)
        #     elif question.question_type == 'multiple_choice' and option_id:
        #         try:
        #             option = SurveyOption.objects.get(pk=option_id)
        #             SurveyAnswer.objects.create(response=response, question=question, option=option)
        #         except SurveyOption.DoesNotExist:
        #             raise ValidationError(f"Lựa chọn với ID {option_id} không tồn tại.")


class SurveyQuestionViewSet(viewsets.ModelViewSet):
    queryset = SurveyQuestion.objects.all()
    serializer_class = SurveyQuestionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Lấy survey_id từ request data
        survey_id = self.request.data.get('survey')
        if not survey_id:
            raise ValidationError("Thiếu ID khảo sát.")

        # Kiểm tra xem survey có tồn tại và thuộc quyền sở hữu của user hiện tại không
        try:
            survey = Survey.objects.get(id=survey_id)
            if survey.created_by != self.request.user:
                raise PermissionDenied("Bạn không có quyền thêm câu hỏi vào khảo sát này.")
        except Survey.DoesNotExist:
            raise ValidationError("Khảo sát không tồn tại.")

        # Lưu question và liên kết với survey
        serializer.save(survey=survey)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.survey.created_by != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa câu hỏi trong khảo sát này.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.survey.created_by != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa câu hỏi trong khảo sát này.")
        instance.delete()


class SurveyOptionViewSet(viewsets.ModelViewSet):
    queryset = SurveyOption.objects.all()
    serializer_class = SurveyOptionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Lấy question_id từ request data
        question_id = self.request.data.get('question')
        if not question_id:
            raise ValidationError("Thiếu ID câu hỏi.")

        # Kiểm tra xem question có tồn tại và thuộc về survey của user hiện tại không
        try:
            question = SurveyQuestion.objects.get(id=question_id)
            if question.survey.created_by != self.request.user:
                raise PermissionDenied("Bạn không có quyền thêm lựa chọn vào câu hỏi này.")
        except SurveyQuestion.DoesNotExist:
            raise ValidationError("Câu hỏi không tồn tại.")

        # Lưu option và liên kết với question
        serializer.save(question=question)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.question.survey.created_by != self.request.user:
            raise PermissionDenied("Bạn không có quyền chỉnh sửa lựa chọn trong câu hỏi này.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.question.survey.created_by != self.request.user:
            raise PermissionDenied("Bạn không có quyền xóa lựa chọn trong câu hỏi này.")
        instance.delete()


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
        # instance.delete()  # Xóa bài viết


# Thêm class SurveyListViewSet
class SurveyListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Survey.objects.filter(status='active')
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        queryset = self.get_queryset()
        serializer = SurveySerializer(queryset, many=True)
        return Response(serializer.data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    # Tạo nhóm chỉ định sự kiện


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
    permission_classes = [IsAuthenticated]  # Chỉ cho phép quản trị viên

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
        if getattr(self, 'swagger_fake_view', False):
            return Event.objects.none()

        return Event.objects.filter(
            Q(created_by=self.request.user) | Q(attendees=self.request.user)
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


class StatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_type = request.query_params.get('type')  # 'users' hoặc 'posts'
        period = request.query_params.get('period')  # 'year', 'month', hoặc 'quarter'

        if data_type not in ['users', 'posts']:
            return Response({"error": "Invalid type parameter. Choose 'users' or 'posts'."}, status=400)
        if period not in ['year', 'month', 'quarter']:
            return Response({"error": "Invalid period parameter. Choose 'year', 'month', or 'quarter'."}, status=400)

        model = User if data_type == 'users' else Post

        if period == 'year':
            data = model.objects.annotate(
                year=TruncYear('date_joined' if data_type == 'users' else 'created_date')).values('year').annotate(
                count=Count('id')).order_by('year')
        elif period == 'month':
            data = model.objects.annotate(
                month=TruncMonth('date_joined' if data_type == 'users' else 'created_date')).values('month').annotate(
                count=Count('id')).order_by('month')
        elif period == 'quarter':
            data = model.objects.annotate(
                year=TruncYear('date_joined' if data_type == 'users' else 'created_date'),
                quarter=ExtractQuarter('date_joined' if data_type == 'users' else 'created_date')
            ).values('year', 'quarter').annotate(count=Count('id')).order_by('year', 'quarter')

        # Format dữ liệu trả về
        if period == 'quarter':
            formatted_data = [
                {"period": f"{item['year'].year}-Q{item['quarter']}", "count": item['count']}
                for item in data
            ]
        else:
            formatted_data = [
                {"period": item['year'].strftime('%Y') if period == 'year' else item['month'].strftime('%Y-%m'),
                 "count": item['count']}
                for item in data
            ]

        return Response({"data": formatted_data})


class UploadImageView(APIView):
    def post(self, request, format=None):
        image_data = request.data.get('image')

        if not image_data:
            return Response({"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Upload ảnh từ Base64 lên Cloudinary
            upload_result = cloudinary.uploader.upload(image_data, use_filename=True, unique_filename=False)
            image_url = upload_result['secure_url']  # URL ảnh đã upload lên Cloudinary
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)

