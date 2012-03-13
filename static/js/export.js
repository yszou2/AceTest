//导出勾选的实例为接口文档
var AceTestExport = function(){
    var body = ATE_export();
    var category = dojo.query('li[class~="selected"]', dojo.byId('category'))[0].innerHTML;

    var html = T(TEMPLATE.export_template).render({category: category, body: body});

    var s = T('<textarea name="text">%s</textarea><input type="hidden" name="category" value="%s" />').render([html, category])
    var form = dojo.create('form', {method: 'post', target: 'self',
                                    innerHTML: s, style: 'display: none;',
                                    action: URL.export},
                            dojo.body(), 'first');
    form.submit();
    dojo.destroy(form);
}

//格式化所有勾选的实例
var ATE_export = function(){
    var all_cases = dojo.filter(dojo.query('.case'), function(e){return e.checked});
    var s = '';
    var toc_data = [];
    for(var i = 0, l = all_cases.length; i < l; i++){
        var o = all_cases[i].get_value(); 
        s += ATE_format_case(o, i);
        toc_data.push([i, o.memo, o.url]);
    }

    var cases = '<div class="list">' + s + '</div>';
    var category = dojo.query('li[class~="selected"]', dojo.byId('category'))[0].innerHTML;
    var host = dojo.attr(dojo.byId('pub_host'), 'value');
    var now = (new Date()).toLocaleString();
    var info = T(TEMPLATE.export_info).render({category: category, host: host, now: now}, '');
    var toc = ATE_create_toc(toc_data);

    var head = '<div class="head">' + info + '</div>';

    var r = head + toc + cases;
    return r;
}


//创建目录
var ATE_create_toc = function(d){
    var template = T('<li><a href="#%s">%s</a></li>');
    var s = '';
    for(var i = 0, l = d.length; i < l; i++){
        s += template.render([d[i][0], d[i][1] + '<br />' + d[i][2]], '', false);
    }

    var r = '<div class="control"><a href="#toc">显示目录</a> / <a href="#">隐藏</a></div>';

    r += '<div class="toc" id="toc"><ol>' + s + '</ol></div>';

    return r
}


//格式化一个实例
var ATE_format_case = function(o, i){
    var h2 = T('<h2 id="%s">%s</h2>').render([i, o.memo]);
    var url = T(TEMPLATE.export_kv).render(['地址', o.url]);
    var method = T(TEMPLATE.export_kv).render(['方法', o.method]);
    var check = T(TEMPLATE.export_kv).render(['返回', '<pre>' + o.check + '</pre>'], '', false);

    if(o.header == ''){
        var header = T(TEMPLATE.export_kv).render(['头', '']);
    } else {
        var obj = eval('(' + o.header + ')');
        var s = '';
        for(var k in obj){
            s += T(TEMPLATE.export_kv).render([k, obj[k]]);
        }
        var header = T(TEMPLATE.export_kv).render(['头', s], '', false);
    }

    if(o.params == ''){
        var params = T(TEMPLATE.export_kv).render(['参数', '']);
    } else {
        var obj = eval('(' + o.params + ')');
        var s = '';
        for(var k in obj){
            s += T(TEMPLATE.export_kv).render([k, obj[k]]);
        }
        var params = T(TEMPLATE.export_kv).render(['参数', s], '', false);
    }

    var r = h2 + url + method + header + params + check;
    r = '<div class="request">' + r + '</div>';
    return r;
}
