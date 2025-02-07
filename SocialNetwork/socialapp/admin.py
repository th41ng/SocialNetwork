from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.core.paginator import Paginator
from rest_framework.exceptions import PermissionDenied
from socialapp_api import settings
from .models import Role, PostCategory, Post, Comment, Reaction, Survey, SurveyResponse, Statistic,  SurveyQuestion, SurveyOption, SurveyAnswer
from django.utils.html import format_html
from django.db.models import Count
from django.db.models.functions import TruncYear, TruncMonth, ExtractQuarter
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.urls import path, reverse
from django.utils.html import strip_tags
from django.core.mail import send_mail
from django.utils import timezone
from .models import User
from datetime import timedelta
from django.conf import settings
from django.contrib import admin
from .models import Notification
from .models import Group, GroupMember, Event
import html
# --- Quan ly User ---

# User model
User = get_user_model()

class RoleAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

admin.site.register(Role, RoleAdmin)

# User Admin
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'first_name', 'last_name', 'email', 'role', 'student_id', 'is_active','student_id_verified']
    list_filter = ['role', 'is_active', 'student_id_verified']
    search_fields = ['username', 'first_name', 'last_name', 'student_id', 'email']
    readonly_fields = ['password_reset_deadline','student_id_verified']
    actions = ['mark_student_id_verified','extend_password_reset_deadline']


# Xác thực mã sinh viên
    def mark_student_id_verified(self, request, queryset):
        """Đánh dấu mã sinh viên người được chọn đã xác thực"""
        if not queryset:
            self.message_user(request, "Chưa có người dùng nào được chọn.")
            return
        updated_count = 0
        for user in queryset:
            if not user.student_id_verified:
                user.student_id_verified = True
                user.save()
                updated_count += 1
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

        if updated_count > 0:
            self.message_user(request, f"Đã xác thực mã sinh viên cho {updated_count} người dùng.")
        else:
            self.message_user(request, "Tất cả người dùng đã được xác thực mã sinh viên.")

# Gia hạn tgian reset mk
    def extend_password_reset_deadline(self, request, queryset):
        """
         Gia hạn thời gian đổi mật khẩu cho người dùng được chọn.
        """
        if not queryset.exists():
            self.message_user(request, "Chưa có người dùng nào được chọn.", messages.WARNING)
            return

        updated_count = 0
        for user in queryset:
            user.password_reset_deadline = timezone.now() + timedelta(hours=24)
            user.save()
            updated_count += 1
            # Gửi email thông báo gia hạn thời gian đổi mật khẩu ngay lập tức
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

    def get_form(self, request, obj=None, **kwargs):
        """Ẩn trường mk khi tạo người dùng mới"""
        form = super().get_form(request, obj, **kwargs)
        if not obj:
            form.base_fields['password'].required = False
        return form

    def save_model(self, request, obj, form, change):
        """Đặt mk mặc định cho gv và gửi tb"""
        if not change:
            if obj.role and obj.role.name == 'Giảng viên':
                obj.set_password('ou@123')
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

        if 'student_id_verified' in form.changed_data:
            obj.student_id_verified = form.cleaned_data.get('student_id_verified', obj.student_id_verified)

        if not change or not obj.check_password(obj.password):
            obj.set_password(obj.password)

        super().save_model(request, obj, form, change)

admin.site.register(User, UserAdmin)

# --- Quản lý Post ---

# PostCategory
class PostCategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

admin.site.register(PostCategory, PostCategoryAdmin)


# Post
class PostAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'visibility', 'created_date', 'is_comment_locked']
    list_filter = ['visibility', 'category']
    search_fields = ['content', 'user__username']
    actions = ['delete_selected_posts']


    def delete_selected_posts(self, request, queryset):
        """Xóa bài viết dc chọn"""
        queryset.delete()

    delete_selected_posts.short_description = "Delete selected posts"

admin.site.register(Post, PostAdmin)


# --- Quản lý Comment ---

# Comment
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'content', 'created_date', 'is_deleted', 'is_edited']
    list_filter = ['is_deleted', 'is_edited', 'post']
    search_fields = ['content', 'user__username']
    actions = ['delete_selected_comments', 'edit_selected_comments']


    def delete_selected_comments(self, request, queryset):
        """xóa cmt được chọn"""
        queryset.update(is_deleted=True)
    delete_selected_comments.short_description = "Delete selected comments"

    def edit_selected_comments(self, request, queryset):
        """edit cmt"""
        pass
    edit_selected_comments.short_description = "Edit selected comments"

admin.site.register(Comment, CommentAdmin)


# --- Quản lý Reaction

# Reaction
class ReactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_type', 'reaction_type', 'target_id', 'created_date']
    list_filter = ['reaction_type', 'target_type']
    search_fields = ['user__username']


admin.site.register(Reaction, ReactionAdmin)

# --- QUản lý Survey

class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1


class SurveyOptionInline(admin.TabularInline):
    model = SurveyOption
    extra = 1


class SurveyAnswerInline(admin.TabularInline):
    model = SurveyAnswer
    extra = 0


class SurveyResponseInline(admin.TabularInline):
    model = SurveyResponse
    extra = 0
    inlines = [SurveyAnswerInline]

# Survey
@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'status', 'created_date', 'response_count', 'statistics_display']
    list_filter = ['status']
    search_fields = ['title', 'description', 'created_by__username']
    inlines = [SurveyQuestionInline]
    readonly_fields = ('created_by',)
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
        if obj:
            url = reverse('admin:survey-statistics', args=[obj.id])
            print(f"Generated URL in statistics_display: {url}")
            return format_html('<a href="{}" target="_blank">📊 Xem thống kê chi tiết</a>', url)
        return "-"

    statistics_display.short_description = "Thống kê khảo sát"

    def get_urls(self):
        """URL custom cho trang thống kê khảo sát"""
        urls = super().get_urls()
        custom_urls = [
            path('<int:survey_id>/statistics/', self.admin_site.admin_view(self.survey_statistics), name="survey-statistics"),
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

                if answers.exists():
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
        current_path = request.get_full_path()
        return render(request, 'admin/survey_statistics.html', {
            'survey': survey,
            'statistics_data': statistics_data,
            'page_number': page_number,
            'current_path': current_path,
        })

# SurveyQuestion
@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'survey', 'question_type']
    list_filter = ['survey']
    search_fields = ['text', 'survey__title']
    inlines = [SurveyOptionInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user

# SurveyOption
@admin.register(SurveyOption)
class SurveyOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question']
    list_filter = ['question__survey']
    search_fields = ['text', 'question__text']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(question__survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user


# SurveyResponse
@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'user', 'created_date']
    list_filter = ['survey']
    search_fields = ['survey__title', 'user__username']
    inlines = [SurveyAnswerInline]

    def get_form(self, request, obj=None, change=False, *args, **kwargs):
        form = super().get_form(request, obj, change, *args, **kwargs)
        if not request.user.is_superuser:
            form.base_fields['survey'].queryset = Survey.objects.filter(status='active', created_by=request.user)
        return form

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):

        if obj is None:
            return True
        return request.user.is_superuser or obj.survey.created_by == request.user


#SurveyAnswer
@admin.register(SurveyAnswer)
class SurveyAnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question', 'text_answer', 'option']
    list_filter = ['question__survey', 'question']
    search_fields = ['text_answer', 'option__text', 'question__text']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(question__survey__created_by=request.user)

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        return request.user.is_superuser or obj.question.survey.created_by == request.user


# ---Quản lý Group---

class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 1
    autocomplete_fields = ['user']


# Group
@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'created_by', 'created_date', 'active']
    search_fields = ['name', 'created_by__username']
    list_filter = ['active', 'created_date']
    ordering = ['-created_date']
    list_per_page = 20
    inlines = [GroupMemberInline]
    readonly_fields = ['created_by']

    def save_model(self, request, obj, form, change):
        """
        Set the created_by field to the logged-in user when creating a new Group.
        """
        if not change:
            obj.created_by = request.user

        if not request.user.is_staff:
            raise PermissionDenied("Only admin can create or edit groups.")

        super().save_model(request, obj, form, change)



# --- QUản lý Thông báo ---

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'recipient_group', 'recipient_user', 'event', 'created_date']
    search_fields = ['title', 'content', 'event__title']
    list_filter = ['recipient_group', 'event', 'created_date']
    ordering = ['-created_date']
    readonly_fields = ['created_by']
    list_per_page = 20

    def save_model(self, request, obj, form, change):
        """
        Gán mặc định created_by là admin đang thao tác khi tạo mới.
        """
        if not change:
            obj.created_by = request.user
        if not request.user.is_staff:
            raise PermissionDenied("Only admin can create or edit notifications.")

        super().save_model(request, obj, form, change)

        self.send_notification_email(obj)

    def send_notification_email(self, obj):
        """
        Gửi email cho cả cá nhân và nhóm.
        """
        event_info = ""
        if obj.event:
            event_info = f"\n\nThông tin sự kiện:\nThời gian bắt đầu: {obj.event.start_time}\nThời gian kết thúc: {obj.event.end_time}\n"

        clean_content = strip_tags(obj.content)
        clean_content = html.unescape(clean_content)

        email_content = f"{clean_content}{event_info}"
        email_list = set()

        if obj.recipient_user and obj.recipient_user.email:
            email_list.add(obj.recipient_user.email)

        if obj.recipient_group:
            group_members = obj.recipient_group.members.all()
            for member in group_members:
                if member.user.email:
                    email_list.add(member.user.email)


        if email_list:
            send_mail(
                f"Thư mời tham gia sự kiện: {obj.event}",
                email_content,
                settings.DEFAULT_FROM_EMAIL,
                list(email_list),
                fail_silently=False,
            )
# --- Quản lý Event ---

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'start_time', 'end_time', 'created_date']
    search_fields = ['title', 'created_by__username', 'description']
    list_filter = ['start_time', 'end_time']
    ordering = ['-start_time']
    list_per_page = 20
    readonly_fields = ['created_by']

    def save_model(self, request, obj, form, change):
        """
        Set the created_by field to the logged-in user when creating a new Event.
        """
        if not change:
            obj.created_by = request.user


        if not request.user.is_staff:
            raise PermissionDenied("Only admin can create or edit events.")


        super().save_model(request, obj, form, change)


# --- Quản lý statistic ---

# Statistic
class StatisticAdmin(admin.ModelAdmin):
    list_display = ['type', 'value', 'time_period', 'created_date']
    list_filter = ['time_period']
    search_fields = ['type']

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
        else:
            formatted_data = [
                {"period": item['month'].strftime('%Y-%m'), "count": item['count']}
                for item in data
            ]

        return {"data": formatted_data}

    change_list_template = 'admin/statistic_chart.html'

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


