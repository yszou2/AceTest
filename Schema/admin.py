# -*- coding: utf-8 -*-

from django.contrib import admin
from models import Request, Category

class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'url', 'method', 'params', 'memo', 'status', 'category', 'order_after')
admin.site.register(Request, RequestAdmin)

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'pub_header', 'host')
admin.site.register(Category, CategoryAdmin)
