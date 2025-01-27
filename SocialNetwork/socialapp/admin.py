# admin.py
from datetime import timedelta

from cloudinary.utils import now
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.utils.safestring import mark_safe
from rest_framework.exceptions import PermissionDenied

from socialapp_api import settings
from .models import Role, PostCategory, Post, Comment, Reaction, Survey, SurveyResponse, Group, GroupMember, \
    Notification, Statistic, Event, SurveyQuestion, SurveyOption, SurveyAnswer
from django.utils.html import format_html
from django.db.models import Count

# Import cho biểu đồ
from django.db.models.functions import TruncYear, TruncMonth, ExtractQuarter
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import path, reverse

# Get custom User model
User = get_user_model()

# Register Role model
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

admin.site.register(Role, RoleAdmin)

from datetime import timedelta
from django.contrib import admin
from django.core.mail import send_mail
from django.utils import timezone
from .models import User
from datetime import timedelta
from django.conf import settings

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email', 'role', 'student_id', 'is_active', 'student_id_verified']
    list_filter = ['role', 'is_active', 'student_id_verified']
    search_fields = ['username', 'first_name', 'last_name', 'student_id', 'email']
    readonly_fields = ['password_reset_deadline']

    actions = ['mark_student_id_verified','extend_password_reset_deadline']

    def mark_student_id_verified(self, request, queryset):
        # Kiểm tra xem có đối tượng nào được chọn không
        if not queryset:
            self.message_user(request, "Chưa có người dùng nào được chọn.")
            return

        # Duyệt qua từng đối tượng và lưu lại sau khi thay đổi
        updated_count = 0
        for user in queryset:
            if not user.student_id_verified:  # Chỉ thay đổi nếu chưa xác thực
                user.student_id_verified = True
                user.save()  # Lưu thay đổi vào cơ sở dữ liệu
                updated_count += 1

        if updated_count > 0:
            self.message_user(request, f"Đã xác thực mã sinh viên cho {updated_count} người dùng.")
        else:
            self.message_user(request, "Tất cả người dùng đã được xác thực mã sinh viên.")
            # Handle 'Sinh Viên' role
            subject = 'Đã xác nhận mã sinh viên'
            message = (
                f"Chào {user.first_name} {user.last_name},\n\n"
                f"Bạn đã đủ điều kiện đăng nhập.\n"
                "Trân trọng,\n"
                "Quản trị viên"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
    mark_student_id_verified.short_description = "Xác thực mã sinh viên"

    def extend_password_reset_deadline(self, request, queryset):
        """
        Action để gia hạn thời gian đổi mật khẩu cho người dùng được chọn.
        """
        if not queryset.exists():
            self.message_user(request, "Chưa có người dùng nào được chọn.", messages.WARNING)
            return

        updated_count = 0
        for user in queryset:
            user.password_reset_deadline = timezone.now() + timedelta(hours=24)
            user.save()
            updated_count += 1

            # Gửi email thông báo gia hạn thời gian đổi mật khẩu
            subject = 'Gia hạn thời gian đổi mật khẩu'
            message = (
                f"Chào {user.first_name} {user.last_name},\n\n"
                "Thời gian đổi mật khẩu của bạn đã được gia hạn thêm 24 giờ.\n"
                "Vui lòng đăng nhập và thay đổi mật khẩu trong thời gian quy định.\n\n"
                "Trân trọng,\n"
                "Quản trị viên"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )

        self.message_user(request, f"Đã gia hạn thời gian đổi mật khẩu cho {updated_count} người dùng.",
                          messages.SUCCESS)

    extend_password_reset_deadline.short_description = "Gia hạn thời gian đổi mật khẩu (+24 giờ)"

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not obj:  # Khi tạo mới
            form.base_fields['password'].required = False  # Không bắt buộc nhập mật khẩu
        return form

    def save_model(self, request, obj, form, change):
        if not change:  # Chỉ thay đổi mật khẩu khi tạo mới
            if obj.role and obj.role.name == 'Giảng viên':
                obj.set_password('ou@123')  # Mật khẩu mặc định cho giảng viên
                obj.password_reset_deadline = obj.date_joined + timedelta(days=1)
                # Gửi email yêu cầu thay đổi mật khẩu
                subject = 'Mật khẩu mặc định và yêu cầu thay đổi'
                message = (
                    f"Chào {obj.first_name} {obj.last_name},\n\n"
                    f"Bạn đã được tạo tài khoản với mật khẩu mặc định: 'ou@123'.\n"
                    "Vui lòng đăng nhập và thay đổi mật khẩu của bạn trong vòng 24 giờ.\n\n"
                    "Trân trọng,\n"
                    "Quản trị viên"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [obj.email],
                    fail_silently=False,
                )

        # Kiểm tra và lưu giá trị student_id_verified nếu có sự thay đổi
        if 'student_id_verified' in form.changed_data:
            obj.student_id_verified = form.cleaned_data.get('student_id_verified', obj.student_id_verified)

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
class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1
    # formfield_overrides = {
    #     models.TextField: {'widget': CKEditorWidget}
    # }


class SurveyOptionInline(admin.TabularInline):
    model = SurveyOption
    extra = 1


class SurveyAnswerInline(admin.TabularInline):
    model = SurveyAnswer
    extra = 0
    # readonly_fields = ('question', 'text_answer', 'option')


class SurveyResponseInline(admin.TabularInline):
    model = SurveyResponse
    extra = 0
    inlines = [SurveyAnswerInline]
    # readonly_fields = ('user', 'created_date')


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'status', 'created_date', 'response_count']
    list_filter = ['status']
    search_fields = ['title', 'description', 'created_by__username']
    inlines = [SurveyQuestionInline]
    readonly_fields = ('created_by', 'statistics_display') # Thêm statistics_display vào readonly_fields
    actions = ['close_selected_surveys']

    def response_count(self, obj):
        return obj.responses.count()

    response_count.short_description = 'Số lượng phản hồi'

    def close_selected_surveys(self, request, queryset):
        queryset.update(status='closed')

    close_selected_surveys.short_description = "Đóng các khảo sát đã chọn"

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(created_by=request.user)

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.created_by == request.user

    def statistics_display(self, obj):
        """Hiển thị link đến trang thống kê chi tiết"""
        url = reverse('admin:survey_statistics', args=[obj.id])
        return format_html('<a href="{}" target="_blank">📊 Xem thống kê chi tiết</a>', url)

    statistics_display.short_description = "Thống kê khảo sát"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:survey_id>/statistics/', self.admin_site.admin_view(self.survey_statistics), name="survey_statistics"),
        ]
        return custom_urls + urls

    def survey_statistics(self, request, survey_id):
        """View hiển thị thống kê khảo sát với phân trang"""
        survey = get_object_or_404(Survey, id=survey_id)
        statistics_data = []
        page_number = request.GET.get("page", 1)

        for question in survey.questions.all():
            question_data = {
                'question_text': question.text,
                'question_type': question.question_type,
                'results': []
            }

            if question.question_type == 'text':
                answers = SurveyAnswer.objects.filter(question=question).order_by('id').values_list('text_answer', flat=True)

                if answers.exists():  # Kiểm tra nếu có dữ liệu
                    paginator = Paginator(answers, 5)
                    page_obj = paginator.get_page(page_number)
                    question_data['paginator'] = paginator
                    question_data['page_obj'] = page_obj
                else:
                    question_data['paginator'] = None
                    question_data['page_obj'] = None

            elif question.question_type == 'multiple_choice':
                choices = SurveyOption.objects.filter(question=question)
                answer_counts = SurveyAnswer.objects.filter(question=question).values('option__text').annotate(
                    count=Count('option')).order_by('-count')

                for choice in choices:
                    count = 0
                    for answer_count in answer_counts:
                        if answer_count['option__text'] == choice.text:
                            count = answer_count['count']
                    question_data['results'].append({'choice_text': choice.text, 'count': count})

            statistics_data.append(question_data)

        return render(request, 'admin/survey_statistics.html', {
            'survey': survey,
            'statistics_data': statistics_data,
            'page_number': page_number,
        })


@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'survey', 'question_type']
    list_filter = ['survey']
    search_fields = ['text', 'survey__title']
    inlines = [SurveyOptionInline]

    def get_queryset(self, request):
        # Chỉ hiển thị các câu hỏi trong khảo sát do user hiện tại tạo, hoặc tất cả nếu là superuser
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        # Cho phép chỉnh sửa nếu là superuser hoặc là người tạo khảo sát chứa câu hỏi
        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        # Cho phép xóa nếu là superuser hoặc là người tạo khảo sát chứa câu hỏi
        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user

@admin.register(SurveyOption)
class SurveyOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question']
    list_filter = ['question__survey']
    search_fields = ['text', 'question__text']

    def get_queryset(self, request):
        # Chỉ hiển thị các lựa chọn trong khảo sát do user hiện tại tạo, hoặc tất cả nếu là superuser
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(question__survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        # Cho phép chỉnh sửa nếu là superuser hoặc là người tạo khảo sát chứa lựa chọn
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        # Cho phép xóa nếu là superuser hoặc là người tạo khảo sát chứa lựa chọn
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user

@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'user', 'created_date']
    list_filter = ['survey']
    search_fields = ['survey__title', 'user__username']
    inlines = [SurveyAnswerInline]
    # readonly_fields = ('user', 'created_date')


    # Thêm bộ lọc để chỉ hiển thị khảo sát có trạng thái 'active'
    def get_form(self, request, obj=None, change=False, *args, **kwargs):
        form = super().get_form(request, obj, change, *args, **kwargs)
        if not request.user.is_superuser:
            # Lọc khảo sát theo trạng thái 'active' và người tạo là user hiện tại
            form.base_fields['survey'].queryset = Survey.objects.filter(status='active', created_by=request.user)
        return form

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        # Không cho phép chỉnh sửa response
        return False

    def has_delete_permission(self, request, obj=None):
        # Cho phép xóa nếu là superuser hoặc là người tạo khảo sát chứa response
        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user



@admin.register(SurveyAnswer)
class SurveyAnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question', 'text_answer', 'option']
    list_filter = ['question__survey', 'question']
    search_fields = ['text_answer', 'option__text', 'question__text']
    # readonly_fields = ('response', 'question', 'text_answer', 'option')

    def get_queryset(self, request):
        # Chỉ hiển thị các câu trả lời cho khảo sát do user hiện tại tạo, hoặc tất cả nếu là superuser
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(question__survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        # Không cho phép chỉnh sửa answer
        return False

    def has_delete_permission(self, request, obj=None):
        # Cho phép xóa nếu là superuser hoặc là người tạo khảo sát chứa answer
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user

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

from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'recipient_group', 'recipient_user', 'event', 'created_date']
    search_fields = ['title', 'content', 'created_by__username', 'event__title']
    list_filter = ['recipient_group', 'event', 'created_date']
    ordering = ['-created_date']
    list_per_page = 20

    def save_model(self, request, obj, form, change):
        """
        Đảm bảo rằng chỉ quản trị viên mới có thể tạo hoặc chỉnh sửa thông báo.
        Đồng thời gửi email khi thông báo được tạo hoặc chỉnh sửa.
        """
        if not request.user.is_staff:
            raise PermissionDenied("Only admin can create or edit notifications.")

        # Gắn người tạo thông báo
        if not obj.pk:  # Chỉ gắn khi thông báo được tạo mới
            obj.created_by = request.user

        # Lưu đối tượng vào cơ sở dữ liệu
        super().save_model(request, obj, form, change)

        # Gửi email sau khi lưu
        try:
            obj.send_notification_email()
        except Exception as e:
            self.message_user(
                request,
                f"Notification saved but failed to send email: {e}",
                level='error'
            )

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

    # Thêm các URL custom cho StatisticAdmin
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('user_stats/', self.admin_site.admin_view(self.user_stats), name='user_stats'),
            path('post_stats/', self.admin_site.admin_view(self.post_stats), name='post_stats'),
        ]
        return custom_urls + urls

    def user_stats(self, request):
        period = request.GET.get('period', 'year')
        return JsonResponse(self.get_stats_data(User, period))

    def post_stats(self, request):
        period = request.GET.get('period', 'year')
        return JsonResponse(self.get_stats_data(Post, period))

    def get_stats_data(self, model, period):
        if period == 'year':
            data = model.objects.annotate(
                year=TruncYear('date_joined' if model == User else 'created_date')).values('year').annotate(
                count=Count('id')).order_by('year')
        elif period == 'month':
            data = model.objects.annotate(
                month=TruncMonth('date_joined' if model == User else 'created_date')).values('month').annotate(
                count=Count('id')).order_by('month')
        elif period == 'quarter':
            data = model.objects.annotate(
                year=TruncYear('date_joined' if model == User else 'created_date'),
                quarter=ExtractQuarter('date_joined' if model == User else 'created_date')
            ).values('year', 'quarter').annotate(count=Count('id')).order_by('year', 'quarter')
        else:
            data = []

        # Format dữ liệu trả về
        if period == 'quarter':
            formatted_data = [
                {"period": f"{item['year'].year}-Q{item['quarter']}", "count": item['count']}
                for item in data
            ]
        elif period == 'year':
            formatted_data = [
                {"period": item['year'].strftime('%Y'), "count": item['count']}
                for item in data
            ]
        else:  # month
            formatted_data = [
                {"period": item['month'].strftime('%Y-%m'), "count": item['count']}
                for item in data
            ]

        return {"data": formatted_data}

    # Thay đổi template cho trang danh sách Statistic
    change_list_template = 'admin/statistic_chart.html'

    # Truyền dữ liệu thống kê vào context
    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(
            request,
            extra_context=extra_context,
        )
        return response

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('user_stats/', self.admin_site.admin_view(self.user_stats), name='statistic_user_stats'),
            path('post_stats/', self.admin_site.admin_view(self.post_stats), name='statistic_post_stats'),
        ]
        return custom_urls + urls


admin.site.register(Statistic, StatisticAdmin)


