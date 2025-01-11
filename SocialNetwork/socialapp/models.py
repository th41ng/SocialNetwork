from django.core.mail import send_mail
from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField

from socialapp_api import settings


# User roles
class Role(models.Model):
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
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    # def is_admin(self):
    #     return self.role and self.role.name == "Admin"
    #
    # def is_lecturer(self):
    #     return self.role and self.role.name == "Lecturer"
    #
    # def is_alumni(self):
    #     return self.role and self.role.name == "Alumni"


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True, null=True)
    updated_date = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        abstract = True
        ordering = ["-id"]


class PostCategory(BaseModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Post(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(PostCategory, on_delete=models.CASCADE)
    content = RichTextField()
    image = CloudinaryField('post_image', null=True, blank=True)
    visibility = models.CharField(max_length=10, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    is_comment_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"Post by {self.user.username}"


class Comment(BaseModel):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = RichTextField()
    is_deleted = models.BooleanField(default=False)
    user_deleted = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"


class Reaction(BaseModel):
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
        indexes = [models.Index(fields=['target_id', 'target_type'])]  # Index for better performance

    def __str__(self):
        return f"{self.reaction_type} by {self.user.username}"


class Survey(BaseModel):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=[('active', 'Active'), ('closed', 'Closed')], default='active')

    def __str__(self):
        return self.title


class SurveyResponse(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    response_data = models.JSONField()  # Changed to JSONField for flexibility

    def __str__(self):
        return f"Response by {self.user.username} for {self.survey.title}"

class SurveyQuestion(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()  # Nội dung câu hỏi
    question_type = models.CharField(
        max_length=20,
        choices=[('text', 'Text'), ('multiple_choice', 'Multiple Choice')],
        default='text'
    )

    def __str__(self):
        return self.text


class SurveyOption(BaseModel):
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)  # Nội dung đáp án

    def __str__(self):
        return self.text

class Group(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class Notification(BaseModel):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()
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
                self.title,
                self.content,
                settings.DEFAULT_FROM_EMAIL,
                [self.recipient_user.email],
                fail_silently=False,
            )
        elif self.recipient_group:
            # Gửi email đến tất cả thành viên trong nhóm
            users = self.recipient_group.members.all()
            for user in users:
                send_mail(
                    self.title,
                    self.content,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )



class GroupMember(BaseModel):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)  # New field to designate admins

    def __str__(self):
        return f"{self.user.username} is a member of {self.group.name}"


class Event(BaseModel):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = RichTextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    attendees = models.ManyToManyField(User, related_name='events_attending', blank=True)

    def __str__(self):
        return self.title



class Statistic(BaseModel):
    type = models.CharField(max_length=50)
    value = models.IntegerField()
    time_period = models.CharField(max_length=10, choices=[('daily', 'Daily'), ('monthly', 'Monthly'), ('yearly', 'Yearly')])

    def __str__(self):
        return f"{self.type} - {self.value} ({self.time_period})"
