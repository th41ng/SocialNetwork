from django.db.models import Count
from .models import Survey, SurveyResponse, SurveyQuestion, SurveyOption, SurveyAnswer, \
Post, User, PostCategory, Comment, Reaction, Notification, Event, Role
from socialapp_api import settings
from django.core.mail import send_mail
from django.utils.timezone import timedelta
from django.conf import settings
from rest_framework import serializers


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


#Code cho thông tin user
class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'avatar', 'cover_image',
            'phone_number', 'email', 'role',
            'student_id', 'student_id_verified', 'password_reset_deadline','first_name', 'last_name',
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'student_id_verified']

    #Cập nhật thông tin TK
    def update(self, instance, validated_data):
        # Cập nhật avatar nếu có
        avatar = validated_data.pop('avatar', None)
        if avatar:
            instance.avatar = avatar
        cover_image = validated_data.pop('cover_image', None)
        if cover_image:
            instance.cover_image = cover_image
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
#Kết thúc

#Bắt đâu code đăng bài viết
class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'name']

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction_type', 'target_type', 'target_id']

    def create(self, validated_data):
        user = validated_data['user']
        target_type = validated_data['target_type']
        target_id = validated_data['target_id']
        reaction_type = validated_data['reaction_type']

        # Kiểm tra xem cảm xúc đã tồn tại chưa
        existing_reaction = Reaction.objects.filter(
            user=user, target_type=target_type, target_id=target_id
        ).first()

        if existing_reaction:
            if existing_reaction.reaction_type == reaction_type:
                # Nếu cảm xúc đã tồn tại, cùng loại => xóa cảm xúc
                existing_reaction.delete()
                return existing_reaction
            else:
                existing_reaction.reaction_type = reaction_type
                existing_reaction.save()
                return existing_reaction
        else:
            # chưa có cảm xúc, tạo mới
            return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reaction_summary = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'created_date', 'reaction_summary']
        read_only_fields = ['user', 'created_date']

    def get_reaction_summary(self, comment):
        reactions = Reaction.objects.filter(target_type='comment', target_id=comment.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        return {reaction['reaction_type']: reaction['count'] for reaction in summary}


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=PostCategory.objects.all(), required=True)
    comments = CommentSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    reaction_summary = serializers.SerializerMethodField()



    def get_reaction_summary(self, post):
        reactions = Reaction.objects.filter(target_type='post', target_id=post.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        return {reaction['reaction_type']: reaction['count'] for reaction in summary}

    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'category',
            'content',
            'image',
            'visibility',
            'is_comment_locked',
            'comments',
            'reactions',
            'reaction_summary',
            'created_date',
            'updated_date',
        ]
#Kết thúc code ĐĂNG BÀi

#Bắt đầu code Đăng kí
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'avatar', 'cover_image', 'phone_number', 'first_name', 'last_name',
            'role', 'student_id', 'password_reset_deadline'
        ]

    def create(self, validated_data):
        role = validated_data.get('role', None)
        # Hash mật khẩu và tạo người dùng
        user = User.objects.create_user(**validated_data)
        if role:
            user.role = role
        # role 'Giảng viên'
        if user.role and user.role.name == 'Giảng viên':
            user.set_password('ou@123')  # Mật khẩu mặc định
            user.password_reset_deadline = user.date_joined + timedelta(days=1)  # MK hết hạn sau 24h
            # Gửi email yêu cầu thay đổi mật khẩu
            subject = 'Mật khẩu mặc định và yêu cầu thay đổi'
            message = (
                f"Chào {user.first_name} {user.last_name},\n\n"
                f"Bạn đã được tạo tài khoản với mật khẩu mặc định: 'ou@123'.\n"
                "Vui lòng đăng nhập và thay đổi mật khẩu của bạn trong vòng 24 giờ.\n\n"
                "Trân trọng,\n"
                "Quản trị viên"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        # Xử lý role 'Sinh viên'
        elif user.role and user.role.name == 'Sinh viên':
            # Gửi email thông báo
            subject = 'Mật khẩu mặc định và yêu cầu thay đổi'
            message = (
                f"Chào {user.first_name} {user.last_name},\n\n"
                f"Bạn đã được tạo tài khoản thành công.\n"
                "Vui lòng chờ quản trị viên xác nhận.\n\n"
                "Trân trọng,\n"
                "Quản trị viên"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        user.save()

        return user
#Kết thúc Code đăng kí

#Bắt đầu code cho Profile bên frontend
class ProfileWithPostsSerializer(serializers.Serializer):
    """
    Serializer để trả về thông tin người dùng và danh sách bài viết của họ, bao gồm cảm xúc trên các bài viết.
    """
    user = UserSerializer()
    posts = PostSerializer(many=True)

    def to_representation(self, instance):
        user = instance.get('user')
        posts = instance.get('posts')

        return {
            'user': UserSerializer(user, context=self.context).data,
            'posts': PostSerializer(posts, many=True, context=self.context).data,
        }
#Kết thúc code profile

#Bắt đầu code Survey
class SurveyOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyOption
        fields = ['id', 'text']


class SurveyQuestionSerializer(serializers.ModelSerializer):
    options = SurveyOptionSerializer(many=True, read_only=True)

    class Meta:
        model = SurveyQuestion
        fields = ['id', 'text', 'question_type', 'options']


class SurveySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    user_has_responded = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'status', 'created_by', 'created_date', 'updated_date', 'questions', 'user_has_responded'] # Thêm 'user_has_responded' vào đây
        read_only_fields = ['created_by', 'created_date', 'updated_date']

    def get_user_has_responded(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return SurveyResponse.objects.filter(user=user, survey=obj).exists()
        return False

class AnswerSerializer(serializers.Serializer):
    question = serializers.PrimaryKeyRelatedField(queryset=SurveyQuestion.objects.all())
    text_answer = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    option = serializers.PrimaryKeyRelatedField(queryset=SurveyOption.objects.all(), required=False, allow_null=True)

    def validate(self, data):
        question = data.get('question')
        text_answer = data.get('text_answer')
        option = data.get('option')

        # Kiểm tra loại câu hỏi
        if question.question_type == 'text' and text_answer is None:
            raise serializers.ValidationError("Câu hỏi tự luận cần phải có câu trả lời.")
        if question.question_type == 'multiple_choice' and option is None:
            raise serializers.ValidationError("Câu hỏi trắc nghiệm cần phải chọn một đáp án.")

        # # Kiểm tra xem lựa chọn có hợp lệ cho câu hỏi không
        # if option and option.question != question:
        #     raise serializers.ValidationError("Lựa chọn này không thuộc về câu hỏi.")

        return data


class SurveyResponseSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    answers = AnswerSerializer(many=True)

    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'user', 'created_date', 'answers']
        read_only_fields = ['created_date']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        survey_response = SurveyResponse.objects.create(**validated_data)
        for answer_data in answers_data:
            question_id = answer_data.get('question').id
            text_answer = answer_data.get('text_answer')
            option_id = answer_data.get('option').id if answer_data.get('option') else None
            # dunfgg trực tiếp question_id, option_id
            if text_answer is not None:
                SurveyAnswer.objects.create(response=survey_response, question_id=question_id, text_answer=text_answer)
            elif option_id is not None:
                SurveyAnswer.objects.create(response=survey_response, question_id=question_id, option_id=option_id)

        return survey_response
#Kết thúc code survey




class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'recipient_group', 'recipient_user', 'event', 'created_by']

    def create(self, validated_data):
        """
        Tạo thông báo và gửi email sau khi lưu.
        """
        notification = Notification.objects.create(**validated_data)

        self.send_notification_email(notification)

        return notification


class EventSerializer(serializers.ModelSerializer):
    notification = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'created_by', 'notification']

    def get_notification(self, obj):
        return f"Event '{obj.title}' starts on {obj.start_time}"
#Kết thúc code sự kienej



