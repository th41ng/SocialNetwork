from rest_framework import serializers
from .models import Post, User, PostCategory, Comment, Reaction
from cloudinary.models import CloudinaryField

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

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