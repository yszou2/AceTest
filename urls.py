# -*- coding: utf-8 -*-


from django.conf.urls.defaults import *
from django.http import HttpResponseRedirect

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^AceTest/', include('AceTest.foo.urls')),

    # Uncomment the admin/doc line below and add 'django.contrib.admindocs' 
    # to INSTALLED_APPS to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^$', lambda r: HttpResponseRedirect('/admin/')),
    (r'^admin/', include(admin.site.urls)),
)
