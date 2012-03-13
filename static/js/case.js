//测试用
dojo.addOnLoad(function(){
    dojo.query('.case').forEach(function(e, i, a){
        dojo.hasClass(e, 'case_head') ? null : CaseBind(e);
    });
});

//一个运行实例的回调容器
var RunCase = function(o){
    var d = new dojo.Deferred();
    d.start = dojo.hitch({defer: d, obj: o}, function(){
        dojo.xhrPost({
            url: URL.run_case,
            handleAs: 'json',
            content: this.obj,
            defer: this.defer,
            obj: this.obj,
            error: function(error, ioArgs){
                ioArgs.args.defer.errback(error, ioArgs);
            },
            load: function(response, ioArgs){
                ioArgs.args.defer.callback(response, ioArgs);   
            }
        });
        return this.defer;
    });
    return d;
}

//删除一个实例的回调容器
var DeleteCase = function(cid){
    var d = new dojo.Deferred();
    d.start = dojo.hitch({defer: d, cid: cid}, function(){
        dojo.xhrPost({
            url: URL.case,
            handleAs: 'json',
            content: {id: cid, _method: 'delete'},
            defer: this.defer,
            cid: this.cid,
            error: function(error, ioArgs){
                ioArgs.args.defer.errback(error, ioArgs);
            },
            load: function(response, ioArgs){
                ioArgs.args.defer.callback(response, ioArgs);   
            }
        });
        return this.defer;
    });
    return d;
}


//更新头部信息,主要是Referer和Cookie的处理
var parse_header = dojo.hitch({ph_node: null},
    function(header, referer){
        if(!this.ph_node){this.ph_node = dojo.byId('pub_header')}
        var origin_header = {};

        var ph_v = dojo.attr(this.ph_node, 'value');
        if(ph_v != ''){ origin_header = eval( '(' + ph_v + ')' ) }
        if(referer){ origin_header.Referer = referer }

        if(!origin_header.Cookie){origin_header.Cookie = ''}
        if(header['Set-Cookie']){
            dojo.forEach(header['Set-Cookie'], function(item){
                var r = item.match(/(.*?)=(.*?);/);
                if(r){
                    origin_header.Cookie += (r[1] + '=' + r[2] + ';');
                }
            });
        }
        if(origin_header.Cookie == ''){delete origin_header.Cookie}
        dojo.attr(this.ph_node, 'value', dojo.toJson(origin_header));
    }
);


//绑定一个测试
var CaseBind = function(node){
    if(node.bind){return}
    node.bind = true;
    node.checked = false;
    node.cb_node = node.children[0].children[1];
    node.status_node = node.children[7].children[0];
    node.newtab_node = node.children[7].children[1];
    if(node.cb_node.check == undefined){
        dojo.aw.aw_checkbox_bind(node.cb_node);
    }

    //不能用dojo.connect直接绑定dojo.cb_node.check事件,因为dojo.cb_node是一个结点,X
    node.cb_node.check = dojo.hitch({f: node.cb_node.check, n: node},
        function(){
            this.f();
            dojo.addClass(this.n, 'hl_line');
            this.n.checked = true;
        }
    );

    node.cb_node.uncheck = dojo.hitch({f: node.cb_node.uncheck, n: node},
        function(){
            this.f();
            dojo.removeClass(this.n, 'hl_line');
            this.n.checked = false;
        }
    );

    node.check = node.cb_node.check;
    node.uncheck = node.cb_node.uncheck;
    node.set_status = dojo.hitch({n: node}, function(s){
        dojo.attr(this.n.status_node, 'class', '');
        dojo.attr(this.n.status_node, 'class', 'status ' + s);
    });


    //防止冒泡
    dojo.connect(node.cb_node, 'ondblclick',
        function(eventObj){dojo.stopEvent(eventObj)}
    );

    //获取当前用例的数据
    //顺便便会获取pub_host和pub_header的值
    //中间的值会根据参数池中的当前值作替换
    node.get_value = dojo.hitch({n: node},
        function(){
            var o = {};
            var c = this.n.children;
            o.url = unsafe(c[1].innerHTML.replace(/^-$/, ''));
            o.method = unsafe(c[2].innerHTML.replace(/^-$/, ''));
            o.params = unsafe(c[3].innerHTML.replace(/^-$/, ''));
            o.header = unsafe(c[4].innerHTML.replace(/^-$/, ''));
            o.check = unsafe(c[5].innerHTML.replace(/^-$/, ''));
            o.memo = unsafe(c[6].innerHTML.replace(/^-$/, ''));
            o.pub_host = unsafe(dojo.attr(dojo.byId('pub_host'), 'value'));
            o.pub_header = unsafe(dojo.attr(dojo.byId('pub_header'), 'value'));
            o.id = this.n.id;
            return o;
        }
    );

    //不能被选中
    node.onselectstart = function(){return false}
    dojo.attr(node, 'style', '-moz-user-select: none; -webkit-user-select: none; -ms-user-select: none;');

    //滑过高亮
    node.mousemove_bind = dojo.connect(node, 'onmousemove', {n: node}, function(eventObj){
        dojo.style(this.n, 'backgroundColor', '#B3F9B6');
        dojo.style(this.n.newtab_node, 'visibility', 'visible');
    });
    node.mouseout_bind = dojo.connect(node, 'onmouseout', {n: node}, function(eventObj){
        dojo.style(this.n, 'backgroundColor', 'white');
        dojo.style(this.n.newtab_node, 'visibility', 'hidden');
    });

    node.edit = dojo.hitch({n: node, new_case_node: dojo.byId('new_case')}, function(){
        var v = this.n.get_value();
        this.new_case_node.children[0].innerHTML = '编辑';
        set_new_case(v);
        var p = center_point(532, 492);
        dojo.style(this.new_case_node, {left: p[0] + 'px', top: (p[1] > 30 ? p[1] - 30 : p[1]) + 'px'});
        dojo.style(this.new_case_node, 'display', 'block');
    });

    //双击编辑
    dojo.connect(node, 'ondblclick', node.edit);

    //删除实例
    node.delete = dojo.hitch({n: node}, function(){
        var dc = DeleteCase(this.n.id);
        if(this.n.is_running){
            my_alert('正在运行的实例不能删除');
            dc.callback();
            return dc;
        } else {
            this.n.is_running = true;
        }
        dc.addCallback(dojo.hitch({n: node}, function(response, ioArgs){
            if(response.result != 0){
                this.n.is_running = false;
                return my_alert('删除失败 ' + response.msg);
            }
            dojo.destroy(this.n);
        }));
        dc.addErrback(function(error, ioArgs){
            this.n.is_running = false;
            return my_alert('删除失败 ' + error.message);
        });
        dc.start();
        return dc;
    });

    //运行实例
    //要使用参数池中的参数替换
    node.run = dojo.hitch({n: node, var_pool: dojo.byId('var_pool')}, function(){
        this.n.is_running = true;
        var v = this.n.get_value();

        //转成标准的json
        if(v.params != ''){
            var obj = eval('(' + v.params + ')');
            v.params = dojo.toJson(obj);
        }

        //转成标准的json
        if(v.header != ''){
            var obj = eval('(' + v.header + ')');
            v.header = dojo.toJson(v.header);
        }

        //使用参数池中的参数
        for(var k in v){
            v[k] = T(v[k]).render(this.var_pool.var, '');
        }

        var rc = RunCase(v);

        rc.addCallback(dojo.hitch({n: this.n, v: v,
                                   right_count_n: dojo.byId('right_count'),
                                   fail_count_n: dojo.byId('fail_count')},
            function(response, ioArgs){
                console.warn(response);
                if(response.result != 0 || response.response.code != 200){
                    var s = (new Date()).toLocaleString() + ' ' + response.msg + '\n';
                    for(var i in this.v){
                        s += i + ' -> ' + this.v[i] + '\n';
                    }
                    console.error(s);
                    this.n.set_status('fail');
                    this.fail_count_n.innerHTML = (parseInt(this.fail_count_n.innerHTML)+1);
                } else {
                    console.debug(response.request.url + ' ->');
                    console.debug(response.response.body);
                    console.debug('<- ' + response.request.url);
                    console.log(this.v);
                    if(this.v.check != ''){
                        var cf = new Function(this.v.check);
                        try{
                            cf.apply(response);
                            this.n.set_status('ok');
                            this.right_count_n.innerHTML = (parseInt(this.right_count_n.innerHTML)+1);
                        } catch (error) {
                            if('msg' in error){
                                var s = T('%(msg)s\n应该是: %(should)s\n实际是: %(actual)s').render(error);
                                console.error(s);
                            } else {
                                console.error(error);
                            }
                            this.n.set_status('fail');
                            this.fail_count_n.innerHTML = (parseInt(this.fail_count_n.innerHTML)+1);
                        }
                    } else {
                        this.n.set_status('ok');
                        this.right_count_n.innerHTML = (parseInt(this.right_count_n.innerHTML)+1);
                    }
                    parse_header(response.response.headers, response.request.url);
                }
                this.n.is_running = false;
            }
        ));

        rc.addErrback(dojo.hitch({n: this.n, v: v,
                                  fail_count_n: dojo.byId('fail_count')},
            function(error, ioArgs){
                var s = (new Date()).toLocaleString() + ' ' + error.message + '\n';
                for(var i in this.v){
                    s += i + ' -> ' + this.v[i] + '\n';
                }
                console.error(s);
                this.n.is_running = false;
                this.n.set_status('fail');
                this.fail_count_n.innerHTML = (parseInt(this.fail_count_n.innerHTML)+1);
            }
        ));
        this.n.set_status('loading');
        rc.start();
        return rc;
    });

    //点击运行
    dojo.connect(node.status_node, 'onclick', {n: node},
        function(){
            if(this.n.is_running){return}
            else{ node.run() }
        }
    );

    //直接请求,处理url,参数,方法
    node.tabnew = dojo.hitch({n: node}, function(){
        var v = this.n.get_value();

        //处理url
        var ph = v.pub_host;
        var url = v.url;
        if(ph.match(/\/$/)){
            ph = ph.replace(/\/$/, '');
        }
        if(!url.match(/^http:\/\//)){
            if(ph != ''){ url = ph + url}
            else{url = 'http://' + url}
        }

        //处理参数
        var s = '';
        if(v.params != ''){
            var p = eval('(' + v.params + ')');
            var template = T('<input type="hidden" name="%s" value="%s" />');
            for(var i in p){
                s += template.render([i, p[i]]);
            }
        }
        var form = dojo.create('form', {method: v.method, target: '_blank',
                                        innerHTML: s, style: 'display: none;',
                                        action: url},
                                dojo.body(), 'first');
        form.submit();
        dojo.destroy(form);
    });

    //新窗口直接请求
    dojo.connect(node.newtab_node, 'onclick', {n: node},
        function(){
            return this.n.tabnew();
        }
    );

    //防止冒泡
    dojo.connect(node.status_node, 'ondblclick',
        function(eventObj){dojo.stopEvent(eventObj)}
    );
    dojo.connect(node.newtab_node, 'ondblclick',
        function(eventObj){dojo.stopEvent(eventObj)}
    );

    //悬挂提示
    //地址
    var url_tip = dojo.aw.hang_tip(node.children[1]);
    url_tip.addCallback(dojo.hitch({n: url_tip}, function(){
        this.n.layout.innerHTML = this.n.innerHTML;
    }));
    //参数
    var params_tip = dojo.aw.hang_tip(node.children[3]);
    params_tip.addCallback(dojo.hitch({n: params_tip}, function(){
        this.n.layout.innerHTML = format_params(this.n.innerHTML);
    }));
    //头
    var header_tip = dojo.aw.hang_tip(node.children[4]);
    header_tip.addCallback(dojo.hitch({n: header_tip}, function(){
        this.n.layout.innerHTML = format_params(this.n.innerHTML);
    }));
    //备注
    var memo_tip = dojo.aw.hang_tip(node.children[6]);
    memo_tip.addCallback(dojo.hitch({n: memo_tip}, function(){
        this.n.layout.innerHTML = this.n.innerHTML;
    }));
    //验证
    var check_tip = dojo.aw.hang_tip(node.children[5]);
    check_tip.addCallback(dojo.hitch({n: check_tip}, function(){
        var s = this.n.innerHTML.replace(/\n/g, '<br />');
        s = s.replace(/(".*?")/g, '<span class="hl_str">$1</span>');
        s = s.replace(/('.*?')/g, '<span class="hl_str">$1</span>');
        s = s.replace(/(assert.*?)\(/g, '<span class="hl_func">$1</span>(');
        this.n.layout.innerHTML = s;
    }));

    //拖动
    var n = dojo.aw.move_it(node, node.children[0].children[0]);
    dojo.connect(node.children[0].children[0], 'ondblclick',
        function(eventObj){dojo.stopEvent(eventObj)}
    );

    //如果有只有一个条目则不能拖动
    n.before_move = dojo.hitch({n: node}, function(event){
        this.n.case_list = dojo.query('.case').filter(dojo.hitch({n: this.n},
            function(e, i){
                return  (i != 0) && (e != this.n);
            })
        );
        if(this.n.case_list.length < 1){return false}
        return true;
    });

    n.start_move = dojo.hitch({n: node}, function(event){
        dojo.style(this.n, 'cursor', 'move');
        dojo.style(this.n, 'opacity', '0.7');
        //先取消拖动完再重新绑定
        dojo.disconnect(this.n.mouseout_bind);

        //找出页面现在剩下的所有case节点的坐标
        this.n.y_position = [];
        for(var i=0; i < this.n.case_list.length; i++){
            //要校正一下,体验更好
            this.n.y_position.push(this.n.case_list[i].offsetTop - 10);
        }
        this.n.first_position = this.n.y_position[0];
        //处理只有两个条目的特殊情况
        this.n.step_position = this.n.y_position[1] ? this.n.y_position[1] - this.n.y_position[0] : 0;
        this.n.on_move(event);
    });

    n.end_move = dojo.hitch({n: node}, function(event){
        dojo.style(this.n, 'cursor', 'default');
        dojo.style(this.n, 'backgroundColor', 'white');
        dojo.style(this.n.newtab_node, 'visibility', 'hidden');
        this.n.mouseout_bind = dojo.connect(this.n, 'onmouseout', {n: this.n},
            function(eventObj){
                dojo.style(this.n, 'backgroundColor', 'white');
                dojo.style(this.n.newtab_node, 'visibility', 'hidden');
        });

        var before = '';
        var after = '';
        if(this.n.now_index < this.n.case_list.length){
            dojo.place(this.n, this.n.case_list[this.n.now_index], 'before');
            before = this.n.case_list[this.n.now_index].id;
        } else {
            //对最的一个i的特殊处理
            dojo.place(this.n, this.n.case_list[this.n.now_index - 1], 'after');
            dojo.style(this.n.case_list[this.n.now_index - 1], 'borderBottom', '1px solid #CCC');
            after = this.n.case_list[this.n.now_index - 1].id;
        }

        dojo.style(this.n, 'position', 'static');
        dojo.forEach(this.n.case_list, function(e){
            dojo.style(e, 'borderTop', 'none');
        });

        //放出改动请求
        dojo.xhrPost({
            url: URL.move_case,
            content: {id: this.n.id, before: before, after: after},
            handleAs: 'json',
            error: function(error, ioArgs){
                return my_alert('移动实例出错 ' + error.message);
            },
            load: function(response, ioArgs){
                if(response.result != 0){
                    return my_alert('移动实例出错 ' + response.msg);
                }
            }
        });
    });

    n.on_move = dojo.hitch({n: node}, function(event){
        dojo.style(this.n, 'left', this.n.ox + 'px');
        if(this.n.offsetTop < this.n.y_position[0]){
            dojo.style(this.n, 'top', this.n.y_position[0] + 'px');
        }
        //最末一行的特殊处理
        if(this.n.offsetTop > this.n.y_position[this.n.y_position.length - 1] + 40){
            dojo.style(this.n, 'top', this.n.y_position[this.n.y_position.length - 1] + 40 + 'px');
        }
        //处于第几个节点上, 对只有两个条目的情况特殊处理
        if(this.n.step_position != 0){
            var i = parseInt((this.n.offsetTop - this.n.first_position) / this.n.step_position);
        } else {
            if(this.n.offsetTop >= this.n.y_position[this.n.y_position.length - 1] + 35){
                //留5px的余地
                var i = 1;
            } else {
                var i = 0;
            }
        }

        if(i < 0){i = 0}
        if(i >= this.n.case_list.length){
            //对最后一个i特殊处理
            i = this.n.case_list.length;
            dojo.style(this.n.case_list[i - 1], 'borderBottom', '1px solid #703400');
        } else {
            dojo.style(this.n.case_list[i], 'borderTop', '1px solid #703400');
        }

        i == 0 ? {} : dojo.style(this.n.case_list[i-1], 'borderTop', 'none');
        i > this.n.case_list.length - 2 ? {} : dojo.style(this.n.case_list[i+1], 'borderTop', 'none');
        i == this.n.case_list.length - 1 ? dojo.style(this.n.case_list[i], 'borderBottom', '1px solid #CCC') : {};
        this.n.now_index = i;
    });
}
