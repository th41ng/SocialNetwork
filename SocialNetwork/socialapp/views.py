from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets
from socialapp.models import Post
from socialapp.serializers import PostSerializer


from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Cho phép tất cả truy cập với phương thức GET,
    nhưng yêu cầu đăng nhập với các phương thức khác (POST, PUT, DELETE).
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:  # SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
            return True
        return request.user and request.user.is_authenticated

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# View index test
def index(request):
    return HttpResponse("TEST")
