# admin.py
from datetime import timedelta
from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Role, PostCategory, Post, Comment, Reaction, Survey, SurveyResponse, Group, GroupMember, \
    Notification, Statistic
from django.utils.html import format_html

# Get custom User model
User = get_user_model()

# Register Role model
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

admin.site.register(Role, RoleAdmin)

from datetime import timedelta

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email', 'role', 'student_id', 'is_active', 'last_login']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'student_id', 'email']
    readonly_fields = ['last_login', 'password_reset_deadline']

    def get_form(self, request, obj=None, **kwargs):
        """
        Tùy chỉnh form hiển thị trên giao diện admin.
        - Nếu tạo mới giảng viên: Ẩn trường mật khẩu.
        - Nếu chỉnh sửa hoặc tài khoản khác: Hiển thị trường mật khẩu.
        """
        form = super().get_form(request, obj, **kwargs)
        if not obj:  # Khi tạo mới
            form.base_fields['password'].required = False  # Không bắt buộc nhập mật khẩu
        return form

    def save_model(self, request, obj, form, change):
        """
        Phương thức này thực thi khi lưu đối tượng người dùng.
        Nếu là giảng viên và đang tạo mới, tự động đặt mật khẩu mặc định.
        """
        if obj.role and obj.role.name == 'Giảng viên' and not change:
            obj.set_password('ou@123')  # Mật khẩu mặc định cho giảng viên
            obj.password_reset_deadline = obj.date_joined + timedelta(days=1)  # Thời gian thay đổi mật khẩu là 24 giờ từ khi đăng ký

        # Mã hóa mật khẩu nếu cần thiết
        if not change or not obj.check_password(obj.password):
            obj.set_password(obj.password)

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


from django.contrib import admin
from .models import Group, GroupMember, Notification, Event

# Group Admin
# Inline for GroupMember
class GroupMemberInline(admin.TabularInline):  # Dùng TabularInline để hiển thị dạng bảng
    model = GroupMember
    extra = 1  # Số dòng trống để thêm mới
    autocomplete_fields = ['user']  # Cho phép tìm kiếm người dùng theo tên


# Group Admin
@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_by', 'created_date', 'active']
    search_fields = ['name', 'created_by__username']
    list_filter = ['active', 'created_date']
    ordering = ['-created_date']
    list_per_page = 20
    inlines = [GroupMemberInline]  # Gắn GroupMemberInline để quản lý thành viên trong nhóm


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'recipient_group', 'recipient_user', 'event', 'created_date']
    search_fields = ['title', 'content', 'created_by__username', 'event__title']
    list_filter = ['recipient_group', 'event', 'created_date']
    ordering = ['-created_date']
    list_per_page = 20



@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'start_time', 'end_time', 'created_date']
    search_fields = ['title', 'created_by__username', 'description']
    list_filter = ['start_time', 'end_time']
    ordering = ['-start_time']
    list_per_page = 20


# Statistic Admin
class StatisticAdmin(admin.ModelAdmin):
    list_display = ['type', 'value', 'time_period', 'created_date']
    list_filter = ['time_period']
    search_fields = ['type']


admin.site.register(Statistic, StatisticAdmin)


