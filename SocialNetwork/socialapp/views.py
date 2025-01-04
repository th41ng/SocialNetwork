from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User
from .serializers import UserRegistrationSerializer, UpdatePasswordSerializer
from django.utils import timezone
from datetime import timedelta
from django.http import Http404


class UserViewSet(viewsets.ModelViewSet, generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['get_current_user']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False)
    def get_current_user(self, request):
        """
        Trả về thông tin người dùng hiện tại.
        """
        return Response(UserRegistrationSerializer(request.user).data)

    @action(methods=['post'], url_path='update-password', detail=False)
    def update_password(self, request):
        """
        Giúp giảng viên đổi mật khẩu khi nhận tài khoản với mật khẩu mặc định.
        """
        serializer = UpdatePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mật khẩu đã được thay đổi."}, status=200)
        return Response(serializer.errors, status=400)

    @action(methods=['post'], url_path='reset-password-deadline', detail=True)
    def reset_password_deadline(self, request, pk=None):
        """
        Action dành cho quản trị viên để reset thời gian thay đổi mật khẩu và mở lại tài khoản người dùng bị khoá.
        """
        user = User.objects.get(pk=self.kwargs['pk'])

        # Kiểm tra nếu người dùng đã bị khoá
        if not user.is_active:
            user.is_active = True  # Mở lại tài khoản
            user.password_reset_deadline = timezone.now() + timedelta(
                days=1)  # Thiết lập lại thời gian thay đổi mật khẩu
            user.save()
            return Response({
                "message": f"Đã reset thời gian đổi mật khẩu cho người dùng {user.username}. Tài khoản đã được mở lại."
            }, status=200)

        return Response({"error": "Tài khoản này chưa bị khoá hoặc không cần reset."}, status=400)
