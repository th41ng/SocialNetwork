from django.utils import timezone
from rest_framework import serializers
from .models import User

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