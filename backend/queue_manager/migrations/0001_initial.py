# Generated by Django 5.1.7 on 2025-04-08 09:07

import django.contrib.auth.validators
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('icon', models.CharField(blank=True, max_length=50, null=True)),
            ],
            options={
                'verbose_name_plural': 'Service Categories',
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('phone_number', models.CharField(blank=True, max_length=15, null=True)),
                ('user_type', models.CharField(choices=[('customer', 'Customer'), ('provider', 'Service Provider'), ('admin', 'Administrator')], default='customer', max_length=50)),
                ('is_service_provider', models.BooleanField(default=False)),
                ('is_verified', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, related_name='queue_manager_user_groups', related_query_name='queue_manager_user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, related_name='queue_manager_user_permissions', related_query_name='queue_manager_user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
                'ordering': ['-date_joined'],
            },
        ),
        migrations.CreateModel(
            name='Service',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('inactive', 'Inactive'), ('maintenance', 'Under Maintenance')], default='active', max_length=12)),
                ('average_service_time', models.PositiveIntegerField(default=15, help_text='Average service time in minutes')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='services_provided', to=settings.AUTH_USER_MODEL)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='services', to='queue_manager.servicecategory')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Queue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('join_time', models.DateTimeField(auto_now_add=True)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('status', models.CharField(choices=[('waiting', 'Waiting'), ('processing', 'Processing'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='waiting', max_length=10)),
                ('position', models.PositiveIntegerField(default=1)),
                ('priority', models.PositiveIntegerField(default=0, help_text='Higher number = higher priority (0-10)', validators=[django.core.validators.MaxValueValidator(10)])),
                ('notes', models.TextField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queues_joined', to=settings.AUTH_USER_MODEL)),
                ('service', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queues', to='queue_manager.service')),
            ],
            options={
                'ordering': ['-priority', 'position'],
            },
        ),
        migrations.CreateModel(
            name='Window',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('status', models.CharField(choices=[('available', 'Available'), ('busy', 'Busy'), ('closed', 'Closed'), ('break', 'On Break')], default='available', max_length=10)),
                ('location', models.CharField(blank=True, max_length=100, null=True)),
                ('last_active', models.DateTimeField(auto_now=True)),
                ('current_queue', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='active_window', to='queue_manager.queue')),
                ('service_provider', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='windows', to=settings.AUTH_USER_MODEL)),
                ('services', models.ManyToManyField(blank=True, related_name='windows_available', to='queue_manager.service')),
            ],
            options={
                'verbose_name': 'Service Window',
                'verbose_name_plural': 'Service Windows',
                'ordering': ['name'],
            },
        ),
        migrations.AddIndex(
            model_name='queue',
            index=models.Index(fields=['service', 'status'], name='queue_manag_service_ca5d7a_idx'),
        ),
        migrations.AddIndex(
            model_name='queue',
            index=models.Index(fields=['user'], name='queue_manag_user_id_fae0e3_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='service',
            unique_together={('name', 'provider')},
        ),
    ]
