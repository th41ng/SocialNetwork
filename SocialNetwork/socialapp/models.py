from django.core.mail import send_mail
from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField
from socialapp_api import settings

# --- BaseModel ---
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True, null=True)
    updated_date = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        abstract = True
        ordering = ["-id"]

# --- Quản lý người dùng ---

class Role(models.Model):
    """Vai tro nguoi dung"""
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    avatar = CloudinaryField('avatar', null=True, blank=True)
    cover_image = CloudinaryField('cover_image', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True,unique=True)
    email = models.CharField(max_length=50,null=False,unique=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    password_reset_deadline = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    student_id_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username


# --- Quản lý bài viết ---

class PostCategory(BaseModel):
    """Danh mục bài viết"""
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Post(BaseModel):
    """Bài viết"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(PostCategory, on_delete=models.CASCADE)
    content = RichTextField()
    image = CloudinaryField('cloudinary_image', null=True, blank=True)
    visibility = models.CharField(max_length=10, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    is_comment_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"Post by {self.user.username}"

class Comment(BaseModel):
    """Bình luận"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = RichTextField()
    is_deleted = models.BooleanField(default=False)
    user_deleted = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"


class Reaction(BaseModel):
    """Tương tác"""
    REACTION_CHOICES = [
        ('like', 'Like'),
        ('haha', 'Haha'),
        ('love', 'Love'),
    ]
    target_type = models.CharField(max_length=10, choices=[('post', 'Post'), ('comment', 'Comment')])
    target_id = models.BigIntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)

    class Meta:
        indexes = [models.Index(fields=['target_id', 'target_type'])]

    def __str__(self):
        return f"{self.reaction_type} by {self.user.username}"


# --- Quản lý khảo sát ---

class Survey(BaseModel):
    """Khảo sát"""
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=[('active', 'Active'), ('closed', 'Closed')], default='active')

    def __str__(self):
        return self.title


class SurveyResponse(BaseModel):
    """Phản hồi khảo sát"""
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Response by {self.user.username} for {self.survey.title}"


class SurveyQuestion(BaseModel):
    """Câu hỏi khảo sát"""
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=[('text', 'Text'), ('multiple_choice', 'Multiple Choice')],
        default='text'
    )

    def __str__(self):
        return self.text


class SurveyOption(BaseModel):
    """Các lụa chọn trong câu hỏi trắc nghiệm"""
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text


class SurveyAnswer(models.Model):
    """Câu trả lời khảo sát"""
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    text_answer = models.TextField(blank=True, null=True)
    option = models.ForeignKey(SurveyOption, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return f"Answer to {self.question.text}"

    class Meta:
        verbose_name = "Câu trả lời khảo sát"
        verbose_name_plural = "Câu trả lời khảo sát"

# --- Quản lý Nhóm, sự kiện , thông báo ---

class Group(BaseModel):
    """Nhóm"""
    name = models.CharField(max_length=100, unique=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Notification(BaseModel):
    """Thông báo"""
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = RichTextField()
    recipient_group = models.ForeignKey('Group', on_delete=models.SET_NULL, null=True, blank=True)
    recipient_user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='received_notifications')
    event = models.ForeignKey('Event', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title

    def send_notification_email(self):
        """
        Gửi email cho người nhận thông báo.
        """
        if self.recipient_user:
            # Gửi email đến cá nhân
            send_mail(
               "Thư mời tham gia sự kiện: " + str(self.event),
                self.content,
                settings.DEFAULT_FROM_EMAIL,
                [self.recipient_user.email],
                fail_silently=False,
            )
        elif self.recipient_group:
            group_members = self.recipient_group.members.all()
            for member in group_members:
                email = member.user.email
                if email:
                    send_mail(
                        self.title,
                        self.content,
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                else:
                    print(f"Không thể gửi email: Thành viên {member.user.username} không có email.")


class GroupMember(BaseModel):
    """Thành viên nhóm"""
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)



class Event(BaseModel):
    """Sự kiện"""
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = RichTextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return self.title


# --- Statistic ---

class Statistic(BaseModel):
    """Thống kê"""
    type = models.CharField(max_length=50)
    value = models.IntegerField()
    time_period = models.CharField(max_length=10, choices=[('daily', 'Daily'), ('monthly', 'Monthly'), ('yearly', 'Yearly')])

    def __str__(self):
        return f"{self.type} - {self.value} ({self.time_period})"
