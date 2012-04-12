# -*- coding: utf-8 -*-

import json
import imp
import os
from urllib import urlencode
import time
import uuid
import datetime
import json
import traceback

import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.httpclient

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("settings", default='settings.py', help="the django settings", type=str)
define("db", default=os.path.join(os.path.dirname(__file__), 'data.db'),
       help="the database", type=str)

tornado.options.parse_command_line()

from django.conf import settings as django_settings
settings = imp.load_source('settings', options.settings)
DB = settings.DATABASES
DB['default']['NAME'] = options.db
django_settings.configure(DATABASES = settings.DATABASES)

from django.db import connection, transaction
from Schema.models import Request, Category

tornado.httpclient.AsyncHTTPClient.configure("tornado.curl_httpclient.CurlAsyncHTTPClient")
AsyncClient = tornado.httpclient.AsyncHTTPClient
Client = tornado.httpclient.HTTPClient

DEFAULT_HOST = 'http://localhost:8000'


class BaseHandler(tornado.web.RequestHandler):
    SUPPORTED_METHODS = ("GET", "POST", "DELETE", "PUT", 'SWITCH',
                         'SET_HOST', 'SET_PUB_HEADER')

    def initialize(self):
        '处理构建PUT和DELETE方法'

        _method = self.get_argument('_method', None)
        if self.request.method == 'POST' and _method:
            self.request.method = _method.upper()

    def finish(self, *args, **kargs):
        #必须手动关闭,要不sqlite3在内存中永远不变
        connection.close()
        super(BaseHandler, self).finish(*args, **kargs)


class TestHandler(BaseHandler):
    def get(self):
        return self.write('it works!')

    def post(self):
        return self.write('it works! post')


class CategoryHandler(BaseHandler):
    def get(self):
        '获取分类'

        cl = list(Category.objects.all().order_by('-order').values())
        return self.write({'result': 0, 'category_list': cl})

    def put(self):
        '新建分类'

        name = self.get_argument('name', '')
        if not name:
            return self.write({'result': 1, 'msg': 'need a name'})
        category = Category.objects.create(name=name, order=int(time.time()))
        self.write({'result': 0, 'msg': '', 'category': {'id': category.id}})

    @transaction.commit_manually
    def delete(self):
        '删除分类'

        id = self.get_argument('id', '')
        if not id:
            return self.write({'result': 1, 'msg': 'need a id'})
        if id == '0':
            return self.write({'result': 3, 'msg': 'error id'})

        try:
            Category.objects.filter(id=id).delete()
            Request.objects.filter(category=id).update(category=0)
        except:
            transaction.rollback()
            return self.write({'result': 2, 'msg': traceback.format_exc()})
        else:
            transaction.commit()
            return self.write({'result': 0, 'msg': ''})


    def post(self):
        '修改分类名字'

        id = self.get_argument('id', '')
        if not id:
            return self.write({'result': 1, 'msg': 'need a category id'})

        name = self.get_argument('name', '')
        if not name:
            return self.write({'result': 2, 'msg': 'give a name for the category'})

        Category.objects.filter(id=id).update(name=name)
        return self.write({'result': 0, 'msg': ''})


    @transaction.commit_manually
    def switch(self):
        '交互两个分类的顺序'

        a = self.get_argument('a', '')
        b = self.get_argument('b', '')
        if not (a and b):
            return self.write({'result': 1, 'msg': 'need a and b'})

        try:
            a = Category.objects.get(id=a)
            b = Category.objects.get(id=b)
            transaction.commit()
        except Category.DoesNotExist:
            return self.write({'result': 2, 'msg': 'category does not exists'})

        a.order, b.order = b.order, a.order
        try:
            a.save()
            b.save()
        except:
            transaction.rollback()
            return self.write({'result': 3, 'msg': traceback.format_exc()})
        else:
            transaction.commit()
            return self.write({'result': 0, 'msg': ''})

    def set_host(self):
        '设置主机'

        id = self.get_argument('id', '')
        if not id:
            return self.write({'result': 1, 'msg': 'need a id'})

        host = self.get_argument('host', '')

        Category.objects.filter(id=id).update(host=host)
        return self.write({'result': 0, 'msg': ''})

    def set_pub_header(self):
        '设置公共头'

        id = self.get_argument('id', '')
        if not id:
            return self.write({'result': 1, 'msg': 'need a id'})

        header = self.get_argument('header', '')

        Category.objects.filter(id=id).update(pub_header=header)
        return self.write({'result': 0, 'msg': ''})
            
            


class CaseHandler(BaseHandler):
    '处理实例'

    def get(self):
        '获取实例'

        #默认显示未分类
        category = self.get_argument('category', '0')

        r_list = Request.objects.filter(status=0).order_by('-create').all()
        r_list = r_list.filter(category=category)
        r_list = list(r_list.values())

        my_list = []
        head_list = []
        order_map = {}

        for r in r_list:
            if r['order_after'] == '':
                head_list.append(r)
            else:
                order_map[r['order_after']] = r

        head_list.sort(lambda x,y: 1 if x['create'] > y['create'] else -1)

        for h in head_list:
            my_list.append(h)

            n = h['id']
            while True:
                if n in order_map:
                    my_list.append(order_map[n])
                    n = order_map[n]['id']
                else:
                    break
        
        if category:
            try:
                category = Category.objects.filter(id=category).values()[0]
            except IndexError:
                category = {}

        return self.write({'result': 0, 'request_list': my_list, 'category': category})


    @transaction.commit_manually
    def delete(self):
        '删除实例, 注意修改order_after'

        r_list = list(Request.objects.filter(id__in=self.get_arguments('id'))\
                             .values('id', 'order_after'))

        try:
            for r in r_list:
                Request.objects.filter(order_after=r['id'])\
                               .update(order_after=r['order_after'])
                Request.objects.filter(id=r['id']).update(status=1, order_after='')
        except:
            transaction.rollback()
            return self.write({'result': 1, 'msg': traceback.format_exc()})
        else:
            transaction.commit()
            return self.write({'result': 0, 'msg': ''})


    def _get_value(self):
        '获取请求值'

        id = self.get_argument('id', '') or uuid.uuid4().hex
        url = self.get_argument('url', '')
        method = self.get_argument('method', 'GET')
        memo = self.get_argument('memo', '')
        check = self.get_argument('check', '')
        params = self.get_argument('params', '')
        header = self.get_argument('header', '')
        category = self.get_argument('category', '0')

        p = {
            'id': id,
            'url': url,
            'method': method,
            'memo': memo,
            'check': check,
            'params': params,
            'header': header,
            'category': category,
            'create': int(time.time()),
        }

        return p

    @transaction.commit_manually
    def put(self):
        '创建实例'

        p = self._get_value()
        try:
            Request.objects.filter(category=p['category'], order_after="")\
                           .update(order_after=p['id'])
            Request.objects.create(**p)
        except:
            transaction.rollback()
            return self.write({'result': 1, 'msg': traceback.format_exc()})
        else:
            transaction.commit()
            return self.write({'result': 0, 'msg': '', 'request': {'id': p['id']}})

    def post(self):
        '修改实例'

        p = self._get_value()
        cid = p['id']
        del p['id']
        del p['create']
        Request.objects.filter(id=cid).update(**p)
        return self.write({'result': 0, 'msg': ''})


class RunHandler(BaseHandler):
    '运行实例'

    @tornado.web.asynchronous
    def post(self):
        '运行实例'

        method = self.get_argument('method', 'GET').upper()
        if method not in ['GET', 'POST', 'HEAD', 'PUT', 'DELETE']:
            return self.finish({'result': 2, 'msg': 'wrong method'})

        url = self.get_argument('url', None)
        if url is None:
            return self.finish({'result': 3, 'msg': 'no url?'})
        if not (url.startswith('/') or url.startswith('http://')):
            url = 'http://' + url

        pub_host = self.get_argument('pub_host', '')
        if pub_host.endswith('/'):
            pub_host = pub_host[:-1]
        if not url.startswith('http://'):
            if pub_host:
                url = pub_host + url
            else:
                url = DEFAULT_HOST + url

        try:
            params = json.loads(self.get_argument('params', '{}').replace("'", '"').strip())
        except:
            traceback.print_exc()
            return self.finish({'result': 4, 'msg': 'wrong params'})

        try:
            header = json.loads(self.get_argument('header', '{}').replace("'", '"').strip())
        except:
            traceback.print_exc()
            return self.finish({'result': 5, 'msg': 'wrong header'})

        try:
            pub_header = json.loads(self.get_argument('pub_header', '{}').replace("'", '"').strip())
        except:
            traceback.print_exc()
            return self.finish({'result': 6, 'msg': 'wrong pub_header'})

        default_header = {
            'User-Agent':  'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.2.18) Gecko/20110628 Ubuntu/10.04 (lucid) Firefox/3.6.18',
            'Connection': 'close',
        }

        default_header.update(pub_header)
        default_header.update(header)
        if method == 'POST':
            default_header.update({'Content-Type': 'application/x-www-form-urlencoded'})

        #url编码不支持unicode
        if method in ['GET']:
            if params:
                p = {}
                for k, v in params.items():
                    p[k.encode('utf8')] = v.encode('utf8') if isinstance(v, unicode) else str(v)
                url = url + '?' + urlencode(p)
            params = None
        else:
            for p in params:
                params[p] = params[p].encode('utf8') if isinstance(params[p], unicode) \
                                                     else str(params[p])

        if isinstance(url, unicode):
            url = url.encode('utf8')

        self.r = {
            'url': url,
            'method': method,
            'headers': default_header,
            'body': params if method == 'POST' else None,
        }
        AsyncClient().fetch(url, self.on_response, method=method,
                headers=default_header,
                body=urlencode(params) if method == 'POST' else None,
                follow_redirects=False,
                connect_timeout=5, request_timeout=5)

    def on_response(self, response):
        is_error = False
        if response.error:
            if response.code in [301, 302]:
                pass
            else:
                is_error = True

        if response.headers.has_key('Content-Type'):
            try:
                charset = response.headers.get('Content-Type').split(';')[1].split('=')[1].lower()
            except:
                charset = 'utf8'
        else:
            charset = 'utf8'

        if response.body:
            try:
                body = unicode(response.body, charset)
            except UnicodeDecodeError:
                try:
                    body = unicode(response.body, 'gb18030')
                except UnicodeDecodeError:
                    body = unicode(response.body, 'iso-8859-1')

            try:
                js = json.loads(body)
            except:
                js = None
        else:
            body = '(no data)'
            js = None


        return self.finish({'result': 0 if not is_error else 1,
                            'response': {
                                'headers': response.headers._as_list,
                                'body': body,
                                'json': js,
                                'code': response.code,
                                'error': response.error and response.error.message,
                                'request_time': response.request_time,
                                'time_info': response.time_info,
                            },
                            'request': self.r,
                            'msg': response.error and response.error.message or '',
                    })


class MoveHandler(BaseHandler):
    '移动实例, 移动到最后一个时需要使用after'

    @transaction.commit_manually
    def post(self):
        id = self.get_argument('id', '')
        if not id:
            return self.write({'result': 1, 'msg': 'need a id'})
        before = self.get_argument('before', '')
        after = self.get_argument('after', '')

        if before and after:
            return self.write({'result': 6, 'msg': 'before? after? just only one'})

        if not before and not after:
            return self.write({'result': 7, 'msg': 'before? after? must be only one'})

        try:
            opr = Request.objects.only('id', 'order_after', 'category').get(id=id)
        except Request.DoesNotExist():
            return self.write({'result': 2, 'msg': 'the id does not exists'})

        if before:
            try:
                before_r = Request.objects.only('id', 'order_after').get(id=before,
                                                                         category=opr.category)
                if before_r.order_after == id:
                    return self.write({'result': 0, 'msg': ''})
            except Request.DoesNotExist():
                return self.write({'result': 3, 'msg': 'the before does not exists'})

        if after:
            try:
                if opr.order_after == after:
                    return self.write({'result': 0, 'msg': ''})
                after_r = Request.objects.only('id', 'order_after').get(id=after,
                                                                         category=opr.category)
            except Request.DoesNotExist():
                return self.write({'result': 5, 'msg': 'the after does not exists'})


        try:
            Request.objects.filter(order_after=id).update(order_after=opr.order_after)
            if before:
                Request.objects.filter(id=id).update(order_after=before_r.order_after)
                Request.objects.filter(id=before).update(order_after=id)
            if after:
                Request.objects.filter(id=id).update(order_after=after)
        except:
            transaction.rollback()
            return self.write({'result': 4, 'msg': traceback.format_exc()})
        else:
            transaction.commit()
            return self.write({'result': 0, 'msg': ''})


class ExportHandler(BaseHandler):
    '导出实例的接口文档, 前端JS处理格式化问题, 这里做的事只是接收什么就返回什么'

    def post(self):
        text = self.get_argument('text')
        category = self.get_argument('category', 'AceTest')
        self.set_header("Content-Type", "application/html; charset=UTF-8")
        self.set_header('Content-Disposition',
                        'attachment; filename=%s-api-export.html' % category)
        return self.write(text);


class MainHandler(BaseHandler):
    def get(self):
        return self.render('index.html')


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/case", CaseHandler),
            (r"/run-case", RunHandler),
            (r"/move-case", MoveHandler),
            (r"/category", CategoryHandler),
            (r"/export", ExportHandler),

            (r"/test", TestHandler),
        ]
        settings = dict(
            cookie_secret="3NSe%vu(u<dx)gok86eil~9kg>*FO)Xe",
            login_url="/auth/login",
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            template_path = os.path.dirname(__file__),
            debug=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    http_server = tornado.httpserver.HTTPServer(Application(), xheaders=True)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
