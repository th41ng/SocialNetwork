from datetime import timedelta

from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Role, PostCategory, Post, Comment, Reaction, Survey, SurveyResponse, Group, GroupMember, \
    Notification, Chat, ChatParticipant, Message, Statistic
from django.utils.html import format_html

# Register custom User model
User = get_user_model()


# Role Admin
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


admin.site.register(Role, RoleAdmin)


# User Admin (Cựu sinh viên, giảng viên, quản trị viên)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email', 'role', 'student_id', 'is_active', 'email_verified',
                    'phone_verified', 'last_login']
    list_filter = ['role', 'is_active', 'email_verified', 'phone_verified']
    search_fields = ['username', 'first_name', 'last_name', 'student_id', 'email']
    readonly_fields = ['last_login', 'password_reset_deadline', 'last_login_ip']

    def save_model(self, request, obj, form, change):
        # If user is a teacher and it's a new record, set default password and mark for password change
        if obj.role and obj.role.name == 'Giảng viên' and not change:
            obj.set_password('ou@123')
            obj.password_reset_deadline = obj.date_joined + timedelta(days=1)  # Set deadline to 24 hours
        super().save_model(request, obj, form, change)


admin.site.register(User, UserAdmin)


# PostCategory Admin
class PostCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


admin.site.register(PostCategory, PostCategoryAdmin)


# Post Admin
class PostAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'visibility', 'created_date', 'is_comment_locked']
    list_filter = ['visibility', 'category']
    search_fields = ['content', 'user__username']
    actions = ['delete_selected_posts']

    def delete_selected_posts(self, request, queryset):
        # Action to delete selected posts
        queryset.delete()

    delete_selected_posts.short_description = "Delete selected posts"


admin.site.register(Post, PostAdmin)


# Comment Admin
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'content', 'created_date', 'is_deleted', 'is_edited']
    list_filter = ['is_deleted', 'is_edited', 'post']
    search_fields = ['content', 'user__username']
    actions = ['delete_selected_comments', 'edit_selected_comments']

    def delete_selected_comments(self, request, queryset):
        queryset.update(is_deleted=True)

    delete_selected_comments.short_description = "Delete selected comments"

    def edit_selected_comments(self, request, queryset):
        # Implement edit selected comments logic here
        pass

    edit_selected_comments.short_description = "Edit selected comments"


admin.site.register(Comment, CommentAdmin)


# Reaction Admin
class ReactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_type', 'reaction_type', 'target_id', 'created_date']
    list_filter = ['reaction_type', 'target_type']
    search_fields = ['user__username']


admin.site.register(Reaction, ReactionAdmin)


# Survey Admin
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'status', 'created_date']
    list_filter = ['status']
    search_fields = ['title', 'description', 'created_by__username']


admin.site.register(Survey, SurveyAdmin)


# SurveyResponse Admin
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'user', 'created_date']
    list_filter = ['survey']
    search_fields = ['survey__title', 'user__username']


admin.site.register(SurveyResponse, SurveyResponseAdmin)


# Group Admin
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'created_date']
    search_fields = ['name', 'created_by__username']


admin.site.register(Group, GroupAdmin)


# GroupMember Admin
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['group', 'user', 'is_admin', 'created_date']
    list_filter = ['is_admin']
    search_fields = ['group__name', 'user__username']


admin.site.register(GroupMember, GroupMemberAdmin)


# Notification Admin
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'recipient_group', 'created_date']
    search_fields = ['title', 'content', 'created_by__username']
    list_filter = ['recipient_group']


admin.site.register(Notification, NotificationAdmin)


# Statistic Admin
class StatisticAdmin(admin.ModelAdmin):
    list_display = ['type', 'value', 'time_period', 'created_date']
    list_filter = ['time_period']
    search_fields = ['type']


admin.site.register(Statistic, StatisticAdmin)


# Chat Admin
class ChatAdmin(admin.ModelAdmin):
    list_display = ['created_by', 'is_group_chat', 'created_date']
    list_filter = ['is_group_chat']
    search_fields = ['created_by__username']


admin.site.register(Chat, ChatAdmin)


# ChatParticipant Admin
class ChatParticipantAdmin(admin.ModelAdmin):
    list_display = ['chat', 'user', 'is_active', 'created_date']
    list_filter = ['is_active']
    search_fields = ['chat__id', 'user__username']


admin.site.register(ChatParticipant, ChatParticipantAdmin)


# Message Admin
class MessageAdmin(admin.ModelAdmin):
    list_display = ['chat', 'sender', 'content', 'created_date', 'is_deleted']
    list_filter = ['is_deleted']
    search_fields = ['content', 'sender__username']


admin.site.register(Message, MessageAdmin)
