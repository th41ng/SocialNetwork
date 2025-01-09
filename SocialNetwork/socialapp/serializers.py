from django.utils import timezone
from django.db.models import Count
from rest_framework import serializers
from .models import Post, User, PostCategory, Comment, Reaction
from cloudinary.models import CloudinaryField

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'cover_image', 'phone_number', 'email']

class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'name']

class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'reaction_type', 'created_date', 'target_type', 'target_id']

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')  # Chỉ đọc, lấy từ `user`

    class Meta:
        model = Comment
        fields = ['id', 'content', 'user', 'post', 'created_date']
        read_only_fields = ['user', 'created_date']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    category = PostCategorySerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    reaction_summary = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def get_image(self, post):
        if post.image and hasattr(post.image, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(post.image.url) if request else post.image.url
        return None

    def get_reaction_summary(self, post):
        # Tính tổng hợp cảm xúc theo từng loại cho bài viết
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
        instance.save()
        return instance

# Gôm 2 cái thông tin user và bài viết để dành cho profile
class ProfileWithPostsSerializer(serializers.Serializer):
    """
    Serializer để trả về thông tin người dùng hiện tại và danh sách bài viết của họ, bao gồm cảm xúc trên các bài viết.
    """
    user = UserSerializer()
    posts = PostSerializer(many=True)  # Các bài viết với đầy đủ thông tin về cảm xúc và bình luận
