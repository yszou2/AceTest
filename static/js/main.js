//重置新建对话框
var reset_new_case = dojo.hitch({method_node: null, method_default: null,
                                 method_select: null},
    function(){
        if(!this.method_node){
            this.method_node = dojo.byId('nc_method');
            this.method_default = this.method_node.children[0];
            this.method_select = this.method_node.children[1];
        }

        dojo.query('#nc_url, #nc_params, #nc_header, #nc_check, #nc_memo, #nc_id').attr('value', '');
        this.method_default.innerHTML = 'GET';
        dojo.forEach(this.method_select.children, function(e, i, a){
            dojo.removeClass(e, 'selected');
        });
        dojo.addClass(this.method_select.children[0], 'selected');
    }
);

//获取新建对话框的当前值
var get_new_case = dojo.hitch(
    {nc_url_n: null, nc_params_n: null, nc_header_n: null, nc_id_n: null,
     nc_check_n: null, nc_method_n: null, nc_memo_n: null},
    function(){
        if(!this.nc_url_n){
            this.nc_url_n = dojo.byId('nc_url');
            this.nc_params_n = dojo.byId('nc_params');
            this.nc_header_n = dojo.byId('nc_header');
            this.nc_check_n = dojo.byId('nc_check');
            this.nc_memo_n = dojo.byId('nc_memo');
            this.nc_id_n = dojo.byId('nc_id');
            this.nc_method_n = dojo.byId('nc_method')
        }

        var o = {};
        o.url = dojo.attr(this.nc_url_n, 'value');
        o.params = dojo.attr(this.nc_params_n, 'value');
        o.header = dojo.attr(this.nc_header_n, 'value');
        o.check = dojo.attr(this.nc_check_n, 'value');
        o.memo = dojo.attr(this.nc_memo_n, 'value');
        o.id = dojo.attr(this.nc_id_n, 'value');
        o.method = this.nc_method_n.children[0].innerHTML;
        o.category = dojo.attr(dojo.query('#category ul li.selected')[0], 'name');
        return o;
    }
);

//获取新建对话框的当前值
var set_new_case = dojo.hitch(
    {nc_url_n: null, nc_params_n: null, nc_header_n: null, nc_id_n: null,
     nc_check_n: null, nc_method_n: null, nc_memo_n: null},
    function(o){
        if(!this.nc_url_n){
            this.nc_url_n = dojo.byId('nc_url');
            this.nc_params_n = dojo.byId('nc_params');
            this.nc_header_n = dojo.byId('nc_header');
            this.nc_check_n = dojo.byId('nc_check');
            this.nc_memo_n = dojo.byId('nc_memo');
            this.nc_id_n = dojo.byId('nc_id');
            this.nc_method_n = dojo.byId('nc_method')
        }

        dojo.attr(this.nc_url_n, 'value', o.url || '');
        dojo.attr(this.nc_params_n, 'value', o.params || '');
        dojo.attr(this.nc_header_n, 'value', o.header || '');
        dojo.attr(this.nc_check_n, 'value', o.check || '');
        dojo.attr(this.nc_memo_n, 'value', o.memo || '');
        dojo.attr(this.nc_id_n, 'value', o.id || '');

        this.nc_method_n.children[0].innerHTML = o.method;
        dojo.forEach(this.nc_method_n.children[1].children, function(e, i, a){
            dojo.removeClass(e, 'selected');
        });
        dojo.addClass(this.nc_method_n.children[1].children[({'GET': 0, 'POST': 1,
                                                           'PUT': 2, 'DELETE': 3})[o.method]],
                                                           'selected');
        return o;
    }
);

//在页面上渲染新的用例
var render_case = dojo.hitch({case_head_n: null},
    function(o){
        if(!this.case_head_n){
            this.case_head_n = dojo.byId('case_list').children[0];
        }

        //为了渲染出-
        for(var k in o){
            o[k] == '' ? o[k] = undefined : {};
        }

        var s = T(TEMPLATE.case).render(o);
        var n = dojo.create('div', {id: o.id ? o.id : '', 'class': 'case', innerHTML: s},
                            this.case_head_n, 'after');
        dojo.anim(n, {backgroundColor: {start: 'yellow'}}, 800);
        //绑定一些事件
        CaseBind(n);
        return n;
    }
);

//修改实例的数据
var reset_case = function(node, o){
    var nl = node.children;
    nl[1].innerHTML = (o.url == '' ? '-' : safe(o.url));
    nl[2].innerHTML = (o.method == '' ? '-' : safe(o.method));
    nl[3].innerHTML = (o.params == '' ? '-' : safe(o.params));
    nl[4].innerHTML = (o.header == '' ? '-' : safe(o.header));
    nl[5].innerHTML = (o.check == '' ? '-' : safe(o.check));
    nl[6].innerHTML = (o.memo == '' ? '-' : safe(o.memo));
    return node;
}


//获取实例
var GetCase = function(filter){
    var an = my_alert('正在获取用例...');
    var d = new dojo.Deferred();
    if(filter == undefined){filter = {}}
    filter.t = (new Date()).getTime();
    d.start = dojo.hitch({defer: d, filter: filter}, function(){
        dojo.publish('CASE_CHANGE');
        dojo.query('.case:not([class~="case_head"])').forEach(dojo.destroy);
        dojo.xhrGet({
            url: URL.case,
            content: filter,
            handleAs: 'json',
            defer: this.defer,
            filter: this.filter,
            an: an,
            error: function(error, ioArgs){
                ioArgs.args.an.destroy(0);
                my_alert('获取用例出错了. ' + error.message);
                ioArgs.args.defer.errback(error, ioArgs);
            },
            load: function(response, ioArgs){
                ioArgs.args.an.destroy(0);
                ioArgs.args.defer.callback(response, ioArgs);   
            }
        });
    });
    return d;
}

//运行勾选的实例
//type=0并发, type=1顺序
var multi_run = function(repeat, type){
    if(repeat < 1){return}
    if(type == undefined){type = 1}
    var all_cases = dojo.filter(dojo.query('.case'),
                        function(e){return e.checked && dojo.style(e, 'display') != 'none'});
    if(type == 0){return multi_run_concurrent(all_cases, repeat)}
    if(type == 1){return multi_run_sequential(all_cases, repeat)}
}

//并发执行
var multi_run_concurrent = function(case_list, repeat){
    var cb = dojo.hitch({count: 0, sum: case_list.length},
        function(){
            ++this.count;
            if(this.count == this.sum){ dojo.publish('MULTI_RUN_COMPLETE') }
        }
    );

    if(case_list.length == 0){return dojo.publish('MULTI_RUN_COMPLETE')}
    dojo.forEach(case_list, function(e){
        var r = e.run();
        for(var i=1; i < repeat; i++){
            r.addBoth(e.run);
        }
        r.addBoth(cb);
    });
}

//顺序执行
var multi_run_sequential = function(case_list, repeat){
    var l = case_list.length;
    if(l < 1){return dojo.publish('MULTI_RUN_COMPLETE')}
    var r = case_list[0].run();
    for(var i=1; i < repeat * l; i++){
        r.addBoth(case_list[i % l].run);
    }
    r.addBoth(function(){dojo.publish('MULTI_RUN_COMPLETE')});
}


//转字符串为对象
var format_params = function(s){
    if(typeof(s) == 'string'){
        try{var o = eval('(' + s + ')')}
        catch(error){return s}
    } else {
        var o = s;
    }
    if(typeof(o) != 'object'){return s}
    var r = '';
    for(var i in o){
        r += T('<div><span class="fp_key">%s</span><span class="fp_value">%s</span></div>').render([i, o[i]]);
    }
    return '<div class="format_params">' + r + '</div>';
}


//获取所有分类
var get_categories = function(callback){
    dojo.xhrGet({
        url: URL.category,
        handleAs: 'json',
        error: function(error, ioArgs){
            return my_alert('获取分类列表错误 ' + error.message);
        },
        load: function(response, ioArgs){
            if(response.result != 0){
                return my_alert('获取分类列表错误 ' + response.msg);
            }
            return callback(response.category_list);
        }
    });
}

//点击分类时的行为
var category_bind = function(node){
    dojo.connect(node, 'onclick', {n: null, tn: null,
                                   un: null, item: node},
        function(eventObj){
            if(!this.n){
                this.n = dojo.byId('category'),
                this.tn = dojo.byId('category').children[0],
                this.un = dojo.byId('category').children[1]
            }

            if(this.n.disabled){return}
            this.un.hide();
            this.tn.innerHTML = this.item.innerHTML;
            dojo.forEach(this.un.children, function(e){
                if(dojo.attr(e, 'name') == dojo.attr(eventObj.target, 'name')){
                    dojo.addClass(e, 'selected');
                } else {
                    dojo.removeClass(e, 'selected');
                }
            });

            //获取数据
            var get_case = GetCase({category: dojo.attr(this.item, 'name')});
            get_case.addCallback(function(response, ioArgs){
                if(response.result != 0){
                    return my_alert('获取用例出错了. ' + response.msg);
                }
                var cl = dojo.byId('case_list');
                response.request_list.reverse();
                for(var i=0, l = response.request_list.length; i < l; i++){
                    var obj = response.request_list[i];
                    render_case(obj);
                }
                //设置主机
                dojo.attr(dojo.byId('pub_host'), 'value', response.category.host || '');
                //设置公共头
                dojo.attr(dojo.byId('pub_header'), 'value', response.category.pub_header || '');
            });
            get_case.start();
        }
    );
}

//删除分类
var category_delete = function(id){
    var an = my_alert('你确定要删除吗?　<span style="color: blue; cursor: pointer;">确定</span> / <span style="color: blue; cursor: pointer;">取消</span> (删除后其下的测试用例会被分到 [未分类] )', 8000);
    dojo.connect(an, 'onclick', {an: an, id: id},
        function(eventObj){
            if(eventObj.target.innerHTML == '取消'){
                return this.an.destroy(0);
            }
            if(eventObj.target.innerHTML != '确定'){return}
            //确定
            this.an.destroy(0);
            dojo.publish('CASE_CHANGE');
            dojo.xhrPost({
                url: URL.category,
                content: {_method: 'delete', id: this.id},
                handleAs: 'json',
                error: function(error, ioArgs){
                    return my_alert('删除分类出现错误 ' + error.message);
                },
                load: function(response, ioArgs){
                    if(response.result != 0){
                        return my_alert('删除分类出现错误 ' + response.msg);
                    }
                    var id = ioArgs.args.content.id;

                    //右上角
                    var obj_list = dojo.byId('category').children[1].children;
                    for(var i = 0, l = obj_list.length; i < l; i++){
                        if(dojo.attr(obj_list[i], 'name') == id){
                            dojo.destroy(obj_list[i]);   
                            break;
                        }
                    }

                    //管理框
                    var obj_list = dojo.byId('edit_category').children[1].children;
                    for(var i = 0, l = obj_list.length; i < l; i++){
                        if(dojo.attr(obj_list[i], 'name') == id){
                            dojo.destroy(obj_list[i]);   
                            break;
                        }
                    }
                }
            });
        }
    );
}


//交换两个分类的位置
var category_switch = function(a, b){
    dojo.xhrPost({
        url: URL.category,
        content: {_method: 'switch', a: a, b: b},
        handleAs: 'json',
        error: function(error, ioArgs){
            return my_alert('移动失败 ' + error.message);
        },
        load: function(response, ioArgs){
            if(response.result != 0){
                return my_alert('移动失败 ' + response.msg);
            }
        }
    });
}

//向参数池当中添加一个参数
var add_var = dojo.hitch({n: undefined}, function(name, value){
        if(!this.n){
            this.n = dojo.byId('var_pool');
            this.n.var = {};
        }
        if(name == ''){return my_alert('参数名不能为空')}
        this.n.var[name] = value;
        dojo.publish('VAR_POOL_CHANGE');
    }
);




dojo.addOnLoad(function(){
    //TODO根据锚点值转到指定分类
    (function(){
        //跳到指定分类上
        window.onhashchange = function(){
        }
    })();


    //导出接口文档
    (function(){
        dojo.connect(dojo.byId('export'), 'onclick', function(eventObj){
            var an = my_alert('正在生成文档...', -1);
            AceTestExport();
            an.destroy(0);
        });
    })();


    //var_pool要初始化
    (function(){
        dojo.byId('var_pool').var = {};
    })();

    //联系方式
    (function(){
        var copyright_tip = dojo.aw.hang_tip(dojo.query('.copyright')[0]);
        copyright_tip.addCallback(dojo.hitch({n: copyright_tip}, function(){
            this.n.layout.innerHTML = '<div style="margin-bottom: 5px;">有问题欢迎反馈到 yeshengzou@gmail.com ^o^</div><div>我的个人站点在 http://zouyesheng.com</div>';
        }));
    })();

    //获取所有用例
    (function(){
        var get_case = GetCase();
        get_case.addCallback(function(response, ioArgs){
            if(response.result != 0){
                return my_alert('获取用例出错了. ' + response.msg);
            }
            var cl = dojo.byId('case_list');
            response.request_list.reverse();
            for(var i=0, l = response.request_list.length; i < l; i++){
                var obj = response.request_list[i];
                render_case(obj);
            }
        });
        get_case.start();
    })(); 

    //新建框可以拖动
    (function(){
        var n = dojo.byId('new_case');
        dojo.aw.move_it(n, dojo.query('h1', n)[0]);
    })();

    //checkbox的大控制
    (function(){
        dojo.connect(dojo.byId('cb_control'), 'onclick', function(eventObj){
            var case_list = dojo.query('.case');
            case_list.forEach(function(e, i, a){
                if(e.bind == undefined){return}
                eventObj.target.checked ? e.check() : e.uncheck();
            });
        });
    })();

    //取消新建用例
    (function(){
        dojo.connect(dojo.byId('new_case_cancel'), 'onclick',
            {n: dojo.byId('new_case')},
            function(eventObj){
                dojo.stopEvent(eventObj);
                reset_new_case();
                dojo.style(this.n, 'display', 'none');
            }
        );
    })();

    //提交新建或修改用例
    (function(){
        dojo.connect(dojo.byId('new_case_btn'), 'onclick',
            {n: dojo.byId('new_case')},
            function(eventObj){
                dojo.stopEvent(eventObj);
                var o = get_new_case();

                //检查参数格式
                if(o.params != ''){
                    try{
                        eval('(' + o.params + ')')
                    } catch (error) {
                        return my_alert('参数有误, 请检查 ' + error, 5000);
                    }
                }

                //检查头格式
                if(o.header != ''){
                    try{
                        eval('(' + o.header + ')')
                    } catch (error) {
                        return my_alert('头有误, 请检查 ' + error, 5000);
                    }
                }

                //检查验证函数体
                try{
                    (new Function(o.check)).apply({
                        msg: '', result: '',
                        request: {
                            body: '', headers: [], method: '',
                            url: ''
                        },
                        response: {
                            body: '', code: '', error: '',
                            headers: [], json: '', request_time: '',
                            time_info: {
                                connect: '',
                                namelookup: '',
                                pretransfer: '',
                                queue: '',
                                redirect: '',
                                starttransfer: '',
                                total: ''
                            }
                        }
                    });
                } catch (error) {
                    if(error._type != 'AceTestError'){
                        return my_alert('验证有误, 请检查 ' + error, 5000);
                    }
                }

                var an = my_alert('正在提交...', -1);
                o.id == '' ? o._method = 'put' : o._method = 'post';
                if(o.method == 'put'){dojo.publish('CASE_CHANGE')}
                dojo.xhrPost({
                    url: URL.case,
                    content: o,
                    handleAs: 'json',
                    new_case_node: this.n,
                    an: an,
                    error: function(error, ioArgs){
                        ioArgs.args.an.destroy(0);
                        return my_alert('提交出现错误 ' + error.message);
                    },
                    load: function(response, ioArgs){
                        ioArgs.args.an.destroy(0);
                        if(response.result != 0){
                            return my_alert('提交出现错误 ' + response.msg);
                        }
                        dojo.style(ioArgs.args.new_case_node, 'display', 'none');
                        reset_new_case();
                        var o = ioArgs.args.content;
                        if(o.id == ''){
                            o.id = response.request.id;
                            return render_case(o);
                        } else {
                            //高亮被修改的实例
                            var n = dojo.byId(o.id);
                            reset_case(n, o);
                            dojo.anim(n, {backgroundColor: {start: 'yellow'}}, 800);
                        }
                    }
                });
            }
        );
    })();

    //显示新建对话框
    //可以初始化一个已勾选的实例内容
    (function(){
        dojo.connect(dojo.byId('create'), 'onclick',
            {n: dojo.byId('new_case'), url_n: dojo.byId('nc_url')},
            function(eventObj){
                this.n.children[0].innerHTML = '新建测试用例';
                var all_cases = dojo.filter(dojo.query('.case'),
                                            function(e){return e.checked});
                if(all_cases.length > 0){
                    var o = all_cases[0].get_value();
                    delete o.id;
                    set_new_case(o);
                }
                var p = center_point(532, 492);
                dojo.style(this.n, {left: p[0] + 'px', top: (p[1] > 30 ? p[1] - 30 : p[1]) + 'px'});
                dojo.style(this.n, 'display', 'block');    
                this.url_n.focus();
            }
        );
    })();

    //新建对话框中选择方法
    (function(){
        dojo.connect(dojo.byId('nc_method'), 'onclick',
            {curr: dojo.byId('nc_method').children[0],
             select: dojo.byId('nc_method').children[1]},
            function(eventObj){
                dojo.stopEvent(eventObj);
                var n = eventObj.target;
                if(n.nodeName != 'LI'){return}
                dojo.forEach(this.select.children, function(e, i, a){
                    dojo.removeClass(e, 'selected');
                });
                dojo.addClass(n, 'selected');
                this.curr.innerHTML = n.innerHTML;
            }
        );
    })();

    //绑定选择运行方式的select_box
    (function(){
        dojo.connect(dojo.byId('run_type'), 'onclick',
            {curr: dojo.byId('run_type').children[0],
             select: dojo.byId('run_type').children[1]},
            function(eventObj){
                dojo.stopEvent(eventObj);
                var n = eventObj.target;
                if(n.nodeName != 'LI'){return}
                dojo.forEach(this.select.children, function(e, i, a){
                    dojo.removeClass(e, 'selected');
                });
                dojo.addClass(n, 'selected');
                this.curr.innerHTML = n.innerHTML;
            }
        );
    })();

    //绑定批量运行
    (function(){
        var n = dojo.byId('multi_run');
        n.set_status = dojo.hitch({n: n}, function(s){
            dojo.attr(this.n, 'class', '');
            dojo.attr(this.n, 'class', 'status ' + s);
        });
        dojo.connect(n, 'onclick', {n: n},
            function(eventObj){
                if(this.n.is_running){return}

                var repeat = parseInt(dojo.attr(dojo.byId('repeat'), 'value'));
                if(!repeat){return my_alert('重复次数错误')}

                this.n.is_running = true;

                var type = dojo.byId('run_type').children[0].innerHTML == '顺序' ? 1 : 0;
                this.n.set_status('loading');
                this.n.sub = dojo.subscribe('MULTI_RUN_COMPLETE',
                    dojo.hitch({n: this.n},
                        function(){
                            this.n.set_status('play');
                            this.n.is_running = false;
                            dojo.unsubscribe(this.n.sub);
                        }
                    )
                );
                multi_run(repeat, type);
            }
        );
    })();

    //计数归0
    (function(){
        dojo.query('#right_count, #fail_count').connect('onclick',
            {right_count_n: dojo.byId('right_count'),
             fail_count_n: dojo.byId('fail_count')},
            function(eventObj){
                this.right_count_n.innerHTML = 0;
                this.fail_count_n.innerHTML = 0;
            });
    })();

    //删除勾选的实例
    (function(){
        dojo.connect(dojo.byId('delete_cases'), 'onclick', function(eventObj){
            var all_cases = dojo.filter(dojo.query('.case'), function(e){return e.checked});
            if(all_cases.length < 1){
                return my_alert('请先勾选需要删除的实例');
            }
            var an = my_alert('你确定要删除吗?　<span style="color: blue; cursor: pointer;">确定</span> / <span style="color: blue; cursor: pointer;">取消</span>', 8000);
            dojo.connect(an, 'onclick', {an: an}, function(eventObj){
                if(eventObj.target.innerHTML == '取消'){
                    return this.an.destroy(0);
                }
                if(eventObj.target.innerHTML != '确定'){return}
                //确定
                this.an.destroy(0);
                var all_cases = dojo.filter(dojo.query('.case'), function(e){return e.checked});
                if(all_cases.length < 1){return}
                var dc = all_cases[0].delete();
                for(var i=1; i < all_cases.length; i++){
                    dc.addBoth(all_cases[i].delete);
                }
            });
        });
    })();


    //获取所有分类
    (function(){
        get_categories(dojo.hitch({n: dojo.byId('category'),
                                   tn: dojo.byId('category').children[0],
                                   un: dojo.byId('category').children[1]},
            function(category_list){
                //在没有绑定完之前不能点击
                dojo.style(this.n, 'display', 'block');
                var o_length = this.un.children.length;

                category_list.reverse();
                category_list.unshift({name: '未分类', id: '0', host: '', pub_header: ''});
                for(var i = 0, l = category_list.length; i < l; i++){
                    var obj = category_list[i];
                    var n = dojo.create('li', {innerHTML: obj.name,
                                               name: obj.id},
                                        this.un, 'first');
                    if(i == 0){dojo.addClass(n, 'selected')}
                    //绑定节点
                    category_bind(n);
                }
                dojo.style(this.un, 'height', (19 * (category_list.length + o_length)) + 'px');

        }));
    })();

    //新建分类框可以拖动
    (function(){
        var n = dojo.byId('new_category');
        dojo.aw.move_it(n, dojo.query('h1', n)[0]);
    })();

    //显示新建分类框
    (function(){
        dojo.connect(dojo.byId('category_new'), 'onclick',
            {n: dojo.byId('new_category'), tn: dojo.byId('new_category_name')},
            function(eventObj){
                dojo.style(this.n, {left: eventObj.pageX - 290 - 70 + 'px',
                                    top: eventObj.pageY - 30 + 'px'});
                dojo.style(this.n, 'display', 'block');
                this.tn.focus();
            }
        );
    })();

    //取消需要新建分类框
    (function(){
        dojo.connect(dojo.byId('new_category_cancel'), 'onclick',
            {n: dojo.byId('new_category'), tn: dojo.byId('new_category_name')},
            function(eventObj){
                dojo.attr(this.tn, 'value', '');
                dojo.style(this.n, 'display', 'none');    
            }
        );
    })();

    //确认提交新建分类框
    (function(){
        dojo.connect(dojo.byId('new_category_btn'), 'onclick',
            {n: dojo.byId('new_category'), tn: dojo.byId('new_category_name')},
            function(eventObj){
                var v = dojo.attr(this.tn, 'value');
                if(v == ''){return my_alert('名字不能为空', 1000)}
                an = my_alert('新建分类正在提交...', -1);
                dojo.xhrPost({
                    url: URL.category,
                    content: {_method: 'put', name: v},
                    handleAs: 'json',
                    an: an,
                    tn: this.tn,
                    n: this.n,
                    error: function(error, ioArgs){
                        ioArgs.args.an.destroy(0);
                        return my_alert('新建分类出现错误 ' + error.message);
                    },
                    load: function(response, ioArgs){
                        ioArgs.args.an.destroy(0);
                        if(response.result != 0){
                            return my_alert('新建分类出现错误 ' + response.msg);
                        }
                        var un = dojo.byId('category').children[1];
                        var n = dojo.create('li', {innerHTML: ioArgs.args.content.name,
                                                   name: response.category.id},
                                            un, 'first');
                        category_bind(n);
                        fire_event(n, 'click');

                        dojo.attr(ioArgs.args.tn, 'value', '');
                        dojo.style(ioArgs.args.n, 'display', 'none');    
                    }
                });
            }
        );
    })();

    //管理分类框可拖动
    (function(){
        var n = dojo.byId('edit_category');
        dojo.aw.move_it(n, dojo.query('h1', n)[0]);
    })();

    //显示管理分类
    (function(){
        dojo.connect(dojo.byId('category_manage'), 'onclick',
            {n: dojo.byId('edit_category')},
            function(eventObj){
                //获取分类
                var an = my_alert('正在获取分类信息...', -1);
                get_categories(dojo.hitch({n: this.n, ln: this.n.children[1], an: an},
                    function(category_list){
                        this.an.destroy(0);
                        dojo.empty(this.ln);
                        var template = T(TEMPLATE.edit_category);
                        for(var i = 0, l = category_list.length; i < l; i++){
                            var obj = category_list[i];
                            var n = dojo.create('div', {innerHTML: template.render(obj),
                                                        'class': 'category_item',
                                                        name: obj.id},
                                                this.ln, 'last');
                        }
                        var p = center_point(320, 0);
                        dojo.style(this.n, {left: p[0] + 'px', top: 80 + 'px'});
                        dojo.style(this.n, 'display', 'block');

                        //有现在函数,就先处理了
                        dojo.query('.ci_name', this.ln).forEach(function(e){
                            category_bind(e);
                        });
                    }
                ));
            }
        );
    })();

    //管理分类的删除,移动绑定, 处理简单就不单独绑定了
    (function(){
        dojo.connect(dojo.byId('edit_category'), 'onclick', function(eventObj){
            var n = eventObj.target;
            if(dojo.hasClass(n, 'ci_delete')){
                return category_delete(dojo.attr(n.parentNode, 'name'));
            }
            if(dojo.hasClass(n, 'ci_up')){
                var pn = n.parentNode;
                var up_node = pn.previousSibling;
                if(!up_node){return my_alert('不能再上移了')}
                category_switch(dojo.attr(pn, 'name'), dojo.attr(up_node, 'name'));
                dojo.place(pn, up_node, 'before');
            }
            if(dojo.hasClass(n, 'ci_down')){
                var pn = n.parentNode;
                var down_node = pn.nextSibling;
                if(!down_node){return my_alert('不能再下移了')}
                category_switch(dojo.attr(pn, 'name'), dojo.attr(down_node, 'name'));
                dojo.place(pn, down_node, 'after');
            }
            if(dojo.hasClass(n, 'ci_edit')){
                var text_n = n.previousSibling;
                dojo.style(text_n, 'display', 'none');
                var input_n = dojo.create('input', {style: {width: '110px',
                                                            display: 'block',
                                                            marginLeft: '2px',
                                                            float: 'left'},
                                                    value: text_n.innerHTML},
                                           text_n, 'after');
                input_n.focus();
                dojo.connect(input_n, 'onblur', {text_n: text_n}, function(eventObj){
                    dojo.destroy(eventObj.target);
                    dojo.style(this.text_n, 'display', 'block');
                });
                dojo.connect(input_n, 'onkeypress', {text_n: text_n,
                                                     cn: dojo.byId('category'),
                                                     ov: text_n.innerHTML,
                                         id: dojo.attr(input_n.parentNode, 'name')},
                    function(eventObj){
                        //13 回车, 27 ESC
                        if(eventObj.keyCode == 27){
                            dojo.destroy(eventObj.target);
                            dojo.style(this.text_n, 'display', 'block');
                        }
                        if(eventObj.keyCode == 13){
                            var nv = dojo.attr(eventObj.target, 'value');
                            dojo.destroy(eventObj.target);
                            dojo.style(this.text_n, 'display', 'block');
                            if(nv != ''){
                                //一样的就不用提交请求了
                                if(nv == this.ov){return}
                                else{this.ov = nv}

                                this.text_n.innerHTML = nv;
                                var sn = dojo.query('li[name="' + this.id + '"]',
                                                    this.cn)[0];
                                sn.innerHTML = nv;
                                if(dojo.hasClass(sn, 'selected')){
                                    this.cn.children[0].innerHTML = nv;
                                }
                                dojo.xhrPost({
                                    url: URL.category,
                                    content: {name: nv, id: this.id},
                                    handleAs: 'json',
                                    error: function(error, ioArgs){
                                        return my_alert('修改出错了 ' + error.message);
                                    },
                                    load: function(response, ioArgs){
                                        if(response.result != 0){
                                            return my_alert('修改出错了 ' + response.msg);
                                        }
                                    }
                                });
                            }
                        }
                    }
                );
            }
        });
    })();

    //关闭管理分类
    (function(){
        var n = dojo.byId('edit_category_close');
        //这点不能被拖动
        dojo.connect(n, 'onmousedown',
            function(eventObj){
                dojo.stopEvent(eventObj);
            }
        );
        dojo.connect(n, 'onclick', {n: dojo.byId('edit_category')},
            function(eventObj){
                dojo.style(this.n, 'display', 'none');
            }
        );
    })();

    //设置分类的主机
    (function(){
        dojo.connect(dojo.byId('pub_host'), 'onblur',
            {n: dojo.byId('pub_host'),
             cn: dojo.byId('category')},
            function(eventObj){
                var v = dojo.attr(this.n, 'value');
                if(v == ''){return}
                var sn = dojo.query('li.selected', this.cn)[0];
                var id = dojo.attr(sn, 'name');
                if(id == 0){return}

                dojo.xhrPost({
                    url: URL.category,
                    content: {_method: 'set_host', id: id, host: v},
                    handleAs: 'json',
                    error: function(error, ioArgs){
                        return my_alert('设置主机出错 ' + error.message);
                    },
                    load: function(response, ioArgs){
                        if(response.result != 0){
                            return my_alert('设置主机出错 ' + response.msg);
                        }
                    }
                });
            }
        );    
    })();

    //设置分类的公共头
    (function(){
        dojo.connect(dojo.byId('pub_header_btn'), 'onclick',
            {n: dojo.byId('pub_header'),
             cn: dojo.byId('category')},
            function(eventObj){
                var v = dojo.attr(this.n, 'value');
                var sn = dojo.query('li.selected', this.cn)[0];
                var id = dojo.attr(sn, 'name');
                if(id == 0){return}

                dojo.xhrPost({
                    url: URL.category,
                    content: {_method: 'set_pub_header', id: id, header: v},
                    handleAs: 'json',
                    error: function(error, ioArgs){
                        return my_alert('设置公共头出错 ' + error.message);
                    },
                    load: function(response, ioArgs){
                        if(response.result != 0){
                            return my_alert('设置公共头出错 ' + response.msg);
                        }
                    }
                });
            }
        );
    })();

    //过滤当前实例,通过url和memo
    (function(){
        var scope = {show: [], hide: [], last: '', n: dojo.byId('filter')};
        var f = dojo.hitch(scope,
            function(eventObj){
                var v = dojo.attr(this.n, 'value');
                //一样的就不用处理了
                if(v == this.last){return}
                if(this.show.length == 0 && this.hide.length == 0){
                    dojo.query('.case:not([class~="case_head"])').forEach(
                        dojo.hitch({show: this.show},
                            function(e){this.show.push(e)})
                    );
                    this.hide = new Array(this.show.length);
                }
                try{
                    var reg = new RegExp(v, 'i');
                } catch (error){
                    return;
                }

                if(v.length > this.last.length){
                    this.last = v;
                    //从show中找,减少显示
                    for(var i=0, l=this.show.length; i < l; i++){
                        var obj = this.show[i];
                        if(obj == undefined){continue} //为undefined
                        if(!(obj.children[1].innerHTML + obj.children[6].innerHTML).match(reg)){
                            setTimeout(dojo.hitch({n: this.show[i]}, function(){
                                dojo.style(this.n, 'display', 'none');
                            }),100);
                            this.hide[i] = this.show[i];
                            this.show[i] = undefined;
                        }
                    }
                } else {
                    this.last = v;
                    //从hide中找,增加显示
                    for(var i=0, l=this.hide.length; i < l; i++){
                        var obj = this.hide[i];
                        if(obj == undefined){continue} //为undefined
                        if((obj.children[1].innerHTML + obj.children[6].innerHTML).match(reg)){
                            setTimeout(dojo.hitch({n: this.hide[i]}, function(){
                                dojo.style(this.n, 'display', 'block');
                            }),100);
                            this.show[i] = this.hide[i];
                            this.hide[i] = undefined;
                        }
                    }
                }
            }
        );

        //变动的话要重新载入
        dojo.subscribe('CASE_CHANGE', {scope: scope}, function(){
            this.scope.show = [];
            this.scope.hide = [];
            this.scope.last = '';
        });

        dojo.connect(dojo.byId('filter'), 'onkeyup', f);
    })();

    //参数池编辑框可拖动
    (function(){
        var n = dojo.byId('edit_var_pool');
        dojo.aw.move_it(n, dojo.query('h1', n)[0]);
    })();

    //关闭参数池编辑
    (function(){
        var n = dojo.byId('edit_var_pool_close');
        //这点不能被拖动
        dojo.connect(n, 'onmousedown',
            function(eventObj){
                dojo.stopEvent(eventObj);
            }
        );
        dojo.connect(n, 'onclick', {n: dojo.byId('edit_var_pool')},
            function(eventObj){
                dojo.style(this.n, 'display', 'none');
            }
        );
    })();

    //显示参数池编辑
    (function(){
        dojo.connect(dojo.byId('var_pool'), 'onclick', 
            {n: dojo.byId('edit_var_pool')},
            function(eventObj){
                var p = center_point(430, 0);
                dojo.style(this.n, {left: p[0] + 'px', top: 80 + 'px'});
                dojo.style(this.n, 'display', 'block');
            }
        );
    })();

    //在参数池中添加新的参数
    (function(){
        dojo.connect(dojo.byId('var_control_btn'), 'onclick',
            {n: dojo.byId('edit_var_pool'), ln: dojo.query('.var_list')[0],
             vn: dojo.byId('var_name_control'), vv: dojo.byId('var_value_control')},
            function(eventObj){
                var name = dojo.attr(this.vn, 'value');
                if(name == ''){
                    return my_alert('请填写参数名');
                }
                var value = dojo.attr(this.vv, 'value');
                add_var(name, value);
                dojo.attr(this.vn, 'value', '');
                dojo.attr(this.vv, 'value', '');
                dojo.publish('VAR_POOL_CHANGE');
            }
        );
    })();

    //参数池的悬挂提示
    (function(){
        var n = dojo.byId('var_pool');
        var var_pool_tip = dojo.aw.hang_tip(n);
        var_pool_tip.addCallback(dojo.hitch({n: n}, function(){
            for(var k in this.n.var){
                this.n.layout.innerHTML = format_params(this.n.var);
                return;
            } 
            this.n.layout.innerHTML = '(还没有参数)';
        }));
    })();

    //对参数池的修改
    (function(){
        dojo.connect(dojo.query('.var_list')[0], 'onkeyup',
            {n: dojo.byId('var_pool')},
            function(eventObj){
                var n = eventObj.target;
                var value = dojo.attr(n, 'value');
                var name = n.previousSibling.innerHTML;
                this.n.var[name] = value;
            }
        );
    })();

    //参数池
    (function(){
        dojo.subscribe('VAR_POOL_CHANGE',
            {n: dojo.byId('var_pool'),
             ln: dojo.query('.var_list')[0],
             pool_num: dojo.byId('var_pool_num')},
            function(){
                dojo.empty(this.ln);
                var template = T(TEMPLATE.edit_var_pool);
                var count = 0;
                for(var name in this.n.var){
                    var s = template.render({name: name,
                                             value: this.n.var[name]});
                    var n = dojo.create('div', {'class': 'var',
                                                innerHTML: s},
                                        this.ln, 'last');
                    ++count;
                }
                this.pool_num.innerHTML = count;
            }
        );     
    })();
});
