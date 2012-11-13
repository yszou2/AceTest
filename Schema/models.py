# -*- coding: utf-8 -*-

from django.db import models

class Request(models.Model):
    '一个测试请求'

    id = models.CharField(u'ID', max_length=32, primary_key=True)
    url = models.CharField(u'访问地址', max_length=200)
    method = models.CharField(u'方法', default='GET', max_length=6)
    params = models.TextField(u'参数', default='', blank=True)
    header = models.TextField(u'头', default='', blank=True)
    memo = models.CharField(u'说明文字', max_length=200, default='', blank=True)
    check = models.TextField(u'测试函数', default='', blank=True)
    create = models.BigIntegerField(u'创建时间', db_index=True)
    status = models.SmallIntegerField(u'状态', db_index=True, default=0)
    category = models.IntegerField(u'分类', db_index=True, blank=True, default=0)
    order_after = models.CharField(u'在哪个之后', max_length=32, db_index=True, default="", blank=True)

    def __unicode__(self): return self.memo
    class Meta(object):
        db_table = 'Request'
        verbose_name_plural = u'访问请求'
        verbose_name = u'访问请求'


class Category(models.Model):
    '分类'

    id = models.AutoField(u'ID', primary_key=True)
    name = models.CharField(u'名字', max_length=50, default='')
    pub_header = models.TextField(u'头', default='', blank=True)
    host = models.CharField(u'主机', max_length=128, default='', blank=True)
    order = models.BigIntegerField(u'顺序权重', db_index=True, default=0)
    #越大则排在前面

    def __unicode__(self): return self.name
    class Meta(object):
        db_table = 'Category'
        verbose_name_plural = u'分类'
        verbose_name = u'分类'

