URL = {};
URL.case = '/case'; //处理用例
URL.run_case = '/run-case'; //运行用例
URL.move_case = '/move-case'; //移动用例
URL.category = '/category'; //分类
URL.export = '/export'; //导出


TEMPLATE = {};

//一个实例
TEMPLATE.case = '' + 
'<span class="c_cb"><img class="drag" src="static/img/null.gif" /><img class="aw_checkbox aw_cb_off" src="static/img/null.gif" /></span>' + 
'<span class="c_url">%(url)s</span>' + 
'<span class="c_method">%(method)s</span>' + 
'<span class="c_params">%(params)s</span>' + 
'<span class="c_header">%(header)s</span>' + 
'<span class="c_check">%(check)s</span>' + 
'<span class="c_memo">%(memo)s</span>' + 
'<span class="c_run"><img class="status play" src="static/img/null.gif" /><img class="newtab" src="static/img/null.gif" /></span>';

//编辑中的一个分类
TEMPLATE.edit_category = '' + 
'<span class="ci_name">%(name)s</span>' + 
'<span class="ci_edit">编辑</span>' + 
'<span class="ci_delete">删除</span>' + 
'<span class="ci_up">上移</span>' + 
'<span class="ci_down">下移</span>';

//参数池中的一个参数
TEMPLATE.edit_var_pool = '' + 
'<span class="var_name">%(name)s</span>' + 
'<input class="var_value" value="%(value)s" />';

//导出中的一对参数
TEMPLATE.export_kv = '' + 
'<div class="column">' + 
'<div class="var_name">%s</div>' + 
'<div class="var_value">%s</div>' +
'</div>';

//导出中的info部分
TEMPLATE.export_info = '' + 
'<h1>%(category)s访问接口</h1>' + 
'<div class="info">' + 
    '<div class="column">' + 
        '<div class="var_name">信息</div>' + 
        '<div class="var_value">本文档由 AceTest 于 %(now)s 生成</div>' + 
    '</div>' + 
    '<div class="column">' + 
        '<div class="var_name">主机</div>' + 
        '<div class="var_value">%(host)s</div>' + 
    '</div>' + 
    '<div class="column">' + 
        '<div class="var_name">公共头</div>' + 
        '<div class="var_value">%(pub_header)s</div>' +
    '</div>' + 
'</div>';


//导出的样式
TEMPLATE.export_template = '' +
'<!DOCTYPE html>\n' + 
'<html> <head> <meta charset="utf-8" />' +
'<title>%(category)s访问接口</title>' + 
'<style type="text/css" media="all">' + 
    'body{ width: 600px; margin: auto; font-size: 14px; font-family: monospace; padding: 0px; padding-right: 200px; letter-spacing: 1px; } a{ color: #0184b7; text-decoration: none; } a:hover{ color: white; background-color: #118ec4; } .head{ height: 50px;    } h1{ font-size: 16px; letter-spacing: 2px; background-color: #0184b7; color: white; padding: 5px; } .column{line-height: 20px; clear: both; } .var_name{ float: left; color: #703400; } .var_name:after{content: "："} .var_value{ float: left; } .control{position: fixed; top: 80px; right: 30px;} .toc{ height: 500px; overflow: auto; clear: both; border: 1px solid #96B7CE; padding: 10px; width: 350px; float: right; background-color: #EEE; position: fixed; top: 100px; right: 30px; display: none;} .toc ol{margin: 0px;} .toc li{margin-top: 5px;} .toc:target{display: block;} .list{clear: both;} .request{clear: both;} h2{ font-size: 14px;    color: #0184b7; height: 30px; line-height: 40px; border-bottom: 1px solid #0184b7; }' + 
    '</style> </head>' + 
'<body>%(body)s</body></html>';
