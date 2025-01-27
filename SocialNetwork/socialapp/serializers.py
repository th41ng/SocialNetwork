from datetime import timedelta

from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Count
from rest_framework import serializers
from .models import Survey, SurveyResponse, SurveyQuestion, SurveyOption, SurveyAnswer
from socialapp_api import settings
from .models import Post, User, PostCategory, Comment, Reaction, Group, Notification, Event, GroupMember, Role
from cloudinary.models import CloudinaryField

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)  # Sử dụng đúng cách để lấy tên role

    class Meta:
        model = User
        fields = [
            'id', 'username', 'avatar', 'cover_image',
            'phone_number', 'email', 'role',
            'student_id', 'student_id_verified', 'password_reset_deadline'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'student_id_verified']

    def update(self, instance, validated_data):
        # Cập nhật avatar nếu có
        avatar = validated_data.pop('avatar', None)
        if avatar:
            instance.avatar = avatar

        # Cập nhật ảnh bìa nếu có
        cover_image = validated_data.pop('cover_image', None)
        if cover_image:
            instance.cover_image = cover_image

        # Cập nhật các trường khác
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance





class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'name']

class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())  # Gắn user từ request.user

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
                # Nếu cảm xúc đã tồn tại và cùng loại, xóa cảm xúc
                existing_reaction.delete()
                return existing_reaction  # Trả về instance đã xóa để tránh lỗi
            else:
                # Nếu cảm xúc khác loại, cập nhật cảm xúc
                existing_reaction.reaction_type = reaction_type
                existing_reaction.save()
                return existing_reaction
        else:
            # Nếu chưa có cảm xúc, tạo mới
            return super().create(validated_data)



# class CommentSerializer(serializers.ModelSerializer):
#     user = serializers.ReadOnlyField(source='user.username')
#     reaction_summary = serializers.SerializerMethodField()

#     class Meta:
#         model = Comment
#         fields = ['id', 'content', 'user', 'post', 'created_date', 'reaction_summary']
#         read_only_fields = ['user', 'created_date']

#     def get_reaction_summary(self, comment):
#         reactions = Reaction.objects.filter(target_type='comment', target_id=comment.id)
#         summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))
#         return {reaction['reaction_type']: reaction['count'] for reaction in summary}

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Sử dụng UserSerializer và bỏ source
    reaction_summary = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'created_date', 'reaction_summary']
        read_only_fields = ['user', 'created_date'] # Giữ nguyên read_only_fields

    def get_reaction_summary(self, comment):
        reactions = Reaction.objects.filter(target_type='comment', target_id=comment.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        return {reaction['reaction_type']: reaction['count'] for reaction in summary}


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=PostCategory.objects.all(), required=True)  # Sử dụng PrimaryKeyRelatedField
    comments = CommentSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    reaction_summary = serializers.SerializerMethodField()
    # image = serializers.SerializerMethodField()

    # def get_image(self, post):
    #     if post.image and hasattr(post.image, 'url'):
    #         request = self.context.get('request')
    #         return request.build_absolute_uri(post.image.url) if request else post.image.url
    #     return None

    def get_reaction_summary(self, post):
        reactions = Reaction.objects.filter(target_type='post', target_id=post.id)
        summary = reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        return {reaction['reaction_type']: reaction['count'] for reaction in summary}

    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'category',  # Sử dụng ID của category thay vì đối tượng category
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



from django.core.mail import send_mail
from django.utils.timezone import timedelta
from django.conf import settings
from rest_framework import serializers
from .models import User, Role

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
        # If role is not provided, assign a default role (optional)
        role = validated_data.get('role', None)  # Default role can be assigned here, if needed

        # Hash the password and create the user
        user = User.objects.create_user(**validated_data)

        # Assign the role if it's present in validated data
        if role:
            user.role = role

        # Handle 'Giảng viên' role
        if user.role and user.role.name == 'Giảng viên':
            user.set_password('ou@123')  # Default password for "Giảng viên"
            user.password_reset_deadline = user.date_joined + timedelta(days=1)  # Password reset deadline (24 hours)
            # Send email requiring password change
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


        # Save the user instance
        user.save()

        return user


#class UpdatePasswordSerializer(serializers.ModelSerializer):
    #password = serializers.CharField(write_only=True)

    #class Meta:
        #model = User
        #fields = ['password']

    #def validate(self, data):
        # Lấy người dùng từ context (đã được truyền vào trong viewset)
        #user = self.context['request'].user

        # Kiểm tra nếu thời gian thay đổi mật khẩu đã hết hạn
        #if user.password_reset_deadline and timezone.now() > user.password_reset_deadline:
            #raise serializers.ValidationError(
               # "Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên để reset thời gian đổi mật khẩu.")

        #return data

    #def update(self, instance, validated_data):
        # Thực hiện cập nhật mật khẩu và thời gian thay đổi mật khẩu
        #password = validated_data.get('password')
        #instance.set_password(password)
        #instance.save()
        #return instance

# Gôm 2 cái thông tin user và bài viết để dành cho profile
class ProfileWithPostsSerializer(serializers.Serializer):
    """
    Serializer để trả về thông tin người dùng và danh sách bài viết của họ, bao gồm cảm xúc trên các bài viết.
    """
    user = UserSerializer()
    posts = PostSerializer(many=True)  # Các bài viết với đầy đủ thông tin về cảm xúc và bình luận

    def to_representation(self, instance):
        user = instance.get('user')  # Lấy user từ instance (dữ liệu đã được truyền vào)
        posts = instance.get('posts')  # Lấy danh sách bài viết từ instance

        return {
            'user': UserSerializer(user, context=self.context).data,
            'posts': PostSerializer(posts, many=True, context=self.context).data,
        }
# khảo sát

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
    user_has_responded = serializers.SerializerMethodField() # Thêm field này

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
    question = serializers.PrimaryKeyRelatedField(queryset=SurveyQuestion.objects.all())  # Dòng đã sửa
    text_answer = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    option = serializers.PrimaryKeyRelatedField(queryset=SurveyOption.objects.all(), required=False, allow_null=True)

    def validate(self, data):
        question = data.get('question')  # Bây giờ nó lấy đối tượng SurveyQuestion
        text_answer = data.get('text_answer')
        option = data.get('option')  # Bây giờ nó lấy đối tượng SurveyOption

        # Kiểm tra dựa trên loại câu hỏi
        if question.question_type == 'text' and text_answer is None:
            raise serializers.ValidationError("Câu hỏi tự luận cần phải có câu trả lời.")
        if question.question_type == 'multiple_choice' and option is None:
            raise serializers.ValidationError("Câu hỏi trắc nghiệm cần phải chọn một đáp án.")

        # Kiểm tra xem lựa chọn có hợp lệ cho câu hỏi không
        if option and option.question != question:
            raise serializers.ValidationError("Lựa chọn này không thuộc về câu hỏi.")

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
            question_id = answer_data.get('question').id # lấy id của question
            text_answer = answer_data.get('text_answer')
            option_id = answer_data.get('option').id if answer_data.get('option') else None # lấy id của option

            # Sử dụng trực tiếp question_id và option_id thay vì query lại
            if text_answer is not None:
                SurveyAnswer.objects.create(response=survey_response, question_id=question_id, text_answer=text_answer)
            elif option_id is not None:
                SurveyAnswer.objects.create(response=survey_response, question_id=question_id, option_id=option_id)

        return survey_response



#tạo nhóm chỉ định nhóm gửi thông báo sự kiện
class GroupSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'members']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'recipient_group', 'recipient_user', 'event', 'created_by']

    def create(self, validated_data):
        """
        Tạo thông báo và gửi email sau khi lưu.
        """
        notification = Notification.objects.create(**validated_data)

        # Gửi email sau khi thông báo được tạo
        self.send_notification_email(notification)

        return notification

    def send_notification_email(self, notification):
        """
        Gửi email cho người nhận thông báo.
        """
        if notification.recipient_user:
            # Gửi email đến cá nhân
            send_mail(
                notification.title,
                notification.content,
                settings.DEFAULT_FROM_EMAIL,
                [notification.recipient_user.email],
                fail_silently=False,
            )
        elif notification.recipient_group:
            # Gửi email đến tất cả thành viên trong nhóm
            group_members = notification.recipient_group.members.all()
            for member in group_members:
                email = member.user.email  # Truy cập email thông qua quan hệ user
                if email:
                    send_mail(
                        notification.title,
                        notification.content,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                else:
                    print(f"Không thể gửi email: Thành viên {member.user.username} không có email.")


class EventSerializer(serializers.ModelSerializer):
    notification = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'attendees', 'created_by', 'notification']

    def get_notification(self, obj):
        # Logic để trả về giá trị cho trường notification
        return f"Event '{obj.title}' starts on {obj.start_time}"



class GroupMemberSerializer(serializers.ModelSerializer):
    users = serializers.ListField(
        child=serializers.IntegerField(),  # Danh sách ID của User
        write_only=True,
        required=False
    )

    class Meta:
        model = GroupMember
        fields = ['id', 'group', 'user', 'is_admin', 'created_date', 'users']

    def create(self, validated_data):
        users = validated_data.pop('users', [])
        group = validated_data.get('group')

        # Tạo GroupMember cho từng user
        group_members = []
        for user_id in users:
            user = User.objects.get(id=user_id)
            group_member = GroupMember.objects.create(group=group, user=user, **validated_data)
            group_members.append(group_member)
        return group_members

