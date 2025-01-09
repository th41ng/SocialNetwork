from django.utils import timezone
from rest_framework import serializers
from .models import Post, User, PostCategory, Comment, Reaction, Group, Notification, Event, GroupMember
from cloudinary.models import CloudinaryField

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar','cover_image', 'phone_number', 'email' ]

class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'name']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_date', 'updated_date']

class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction_type', 'created_date']

class PostSerializer(serializers.ModelSerializer):
    # Sử dụng PrimaryKeyRelatedField cho user và category để làm việc với ID
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=PostCategory.objects.all())
    comments = serializers.PrimaryKeyRelatedField(many=True, read_only=True)  #
    reactions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    image = serializers.SerializerMethodField()

    def get_image(self, post):

        if post.image:
            if post.image.name.startswith("http"):
                return post.image.name
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(post.image.url)
        return None

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
            'created_date',
            'updated_date',
        ]

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'avatar', 'cover_image', 'phone_number']

    def create(self, validated_data):
        # Mã hóa mật khẩu trước khi lưu vào database
        user = User.objects.create_user(**validated_data)
        return user

class UpdatePasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['password']

    def validate(self, data):
        # Lấy người dùng từ context (đã được truyền vào trong viewset)
        user = self.context['request'].user

        # Kiểm tra nếu thời gian thay đổi mật khẩu đã hết hạn
        if user.password_reset_deadline and timezone.now() > user.password_reset_deadline:
            raise serializers.ValidationError(
                "Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên để reset thời gian đổi mật khẩu.")

        return data

    def update(self, instance, validated_data):
        # Thực hiện cập nhật mật khẩu và thời gian thay đổi mật khẩu
        password = validated_data.get('password')
        instance.set_password(password)
        # instance.password_reset_deadline = timezone.now() + timedelta(days=1)  # Cập nhật thời gian thay đổi mật khẩu
        instance.save()
        return instance



#Gôm 2 cái thông tin user và bài viết để dành cho profile
class ProfileWithPostsSerializer(serializers.Serializer):
    """
    Serializer để trả về thông tin người dùng hiện tại và danh sách bài viết của họ.
    """
    user = UserSerializer()
    posts = PostSerializer(many=True)


#tạo nhóm chỉ định nhóm gửi thông báo sự kiện
class GroupSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'members']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'recipient_group', 'recipients', 'is_sent']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 'attendees', 'created_by', 'notification']


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