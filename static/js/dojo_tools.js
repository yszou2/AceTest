//转义可能存在的html编码
var safe = function(s){
    if(typeof(s) == 'number'){return s}
    s = s.replace(/</g, '&lt;');
    s = s.replace(/>/g, '&gt;');
    s = dojo.trim(s);
    return s;
}

var unsafe = function(s){
    if(typeof(s) == 'number'){return s}
    s = s.replace(/&lt;/g, '<');
    s = s.replace(/&gt;/g, '>');
    return s;
}

//获取中心点坐标偏移
var center_point = function(w, h){
    if(w == undefined){w = 0}
    if(h == undefined){h = 0}
    var l = parseInt((document.documentElement.clientWidth - w) / 2);
    var t = parseInt((document.documentElement.clientHeight - h) / 2);
    if(l < 0){l = 0}
    if(t < 0){t = 0};
    return [l, t];
}

//模拟事件
var fire_event = function(node, event_name){
    if(dojo.isIE){
        node.fireEvent('on' + event_name);
    } else {
        var e = document.createEvent('MouseEvent');
        e.initEvent(event_name, true, false);
        node.dispatchEvent(e);
    }
}

//简单的模板系统
var T = function(template){
    var render = dojo.hitch({template: template}, function(context, when_null, is_escape){
        if(when_null == undefined){when_null = '-'}
        if(is_escape == undefined){is_escape = true}

        if(!dojo.isArray(context)){
            var s = this.template.replace(/%\((.*?)\)s/g, function(m, n){
                return context[n] != undefined ?
                           (is_escape ? safe(context[n]) : context[n]) :
                           when_null;
            });
        } else {
            var s = this.template.replace(/%s/g,
                dojo.hitch({n: 0, l: context.length}, function(m){
                    return this.n < this.l ?
                               (is_escape ? safe(context[this.n++]) : context[this.n++]) :
                               when_null;
            }));
        }
        return s;
    });
    var o = {template: template, render: render};
    return o;
}

//好读的时间
var human_date = function(dt){
    var now_dt = new Date();
    var now = parseInt(now_dt.getTime() / 1000);
    var dt_dt = new Date(dt * 1000);
    var delta = {};
    var d = now - dt;

    var A_DAY = 24 * 60 * 60;
    delta.days = Math.floor(d / A_DAY);

    if(delta.days == 0){
        if(d < 300){return '刚才'}
        if(d < 600){return '5分钟前'}
        if(d < 1800){return '10分钟前'}
        if(d < 3600){return '半小时前'}
        if(d < 7200){return '1小时前'}
    }

    var month = dt_dt.getMonth() + 1;
    if(delta.days < 4){ //取4天而不是3天, 要考虑最极端情况
        var a = now_dt.getDay(); //星期
        var b = dt_dt.getDay(); //星期
        var m = dt_dt.getMinutes();
        if(m < 10){m = '0' + m}
        //用星期来处理就可以避免考虑一个月是30还是31天的问题
        if(a - b == 0){return dt_dt.getHours() + ':' + m}
        if(a - b == 1 || a - b == -6){return '昨天' + dt_dt.getHours() + ':' + m}
        if(a - b == 2 || a - b == -5){return '前天' + dt_dt.getHours() + ':' + m}
    }
    if(now_dt.getFullYear()- dt_dt.getFullYear() != 0){
        return (dt_dt.getFullYear() + '年' + month + '月' + dt_dt.getDate() + '日');
    }

    return month + '月' + dt_dt.getDate() + '日';
}

//input后面的提示
var my_msg = function(node, msg, time){
    if(msg == ''){return}
    if(time == undefined){time = 2000}
    if(time < 0){time = 9999999999}

    var n = dojo.create('span', {innerHTML: msg, 'class': 'my_msg',
                                 style: {backgroundColor: '#FF9400',
                                         padding: '3px',
                                         fontSize: '14px',
                                         color: 'white',
                                         opacity: '0',
                                         margin: 'auto',
                                         marginLeft: '10px'
                                         }},
                        node, 'after');

    n.innerHTML = msg;
    dojo.style(n, { opacity: 0});
    dojo.anim(n, {opacity: 0.9}, 800);

    setTimeout(dojo.hitch({n: n}, function(){
            dojo.anim(this.n, {opacity: 0}, 500, null,
                 function(e){dojo.destroy(e)})
            }), time);

    n.destroy = dojo.hitch({n: n}, function(time){
        if(time == undefined){time = 800}
        if(time == 0){
            dojo.destroy(this.n);
        } else {
            setTimeout(dojo.hitch({n: this.n}, function(){
                dojo.destroy(this.n);
            }), time);
        }
    });
    return n
}

//提示框
var my_alert = function(msg, time){
    if(msg == ''){return}
    if(time == undefined){time = 2000}
    if(time < 0){time = 9999999999}

    var alert_block_node = dojo.query('.alert_block');
    if(alert_block_node.length == 0){
        alert_block_node = dojo.create('div', {'class': 'alert_block',
                                               style: {margin: 'auto',
                                                       position: 'fixed',
                                                       top: '0px',
                                                       width: '100%',
                                                       zIndex: '99',
                                                       textAlign: 'center'}},
                                       dojo.body(), 'first');
    } else {
        alert_block_node = alert_block_node[0];
    }

    var n = dojo.create('span', {innerHTML: msg,
                                 style: {backgroundColor: '#FF9400',
                                         padding: '0px 3px',
                                         fontSize: '14px',
                                         color: 'white',
                                         display: 'none',
                                         width: '300px',
                                         margin: 'auto',
                                         marginBottom: '5px',
                                         display: 'block',
                                         height: '25px',
                                         lineHeight: '25px'}},
                        alert_block_node, 'last');

    //一行显示不下
    if(msg.length > 19){
        dojo.style(n, 'width', '700px');
    }

    n.innerHTML = msg;
    dojo.style(n, {display: 'block',
                   opacity: 0});
    dojo.anim(n, {opacity: 0.9}, 800);

    setTimeout(dojo.hitch({n: n}, function(){
            dojo.anim(this.n, {opacity: 0, height: {start: 25, end: 0}}, 500, null,
                 function(e){dojo.destroy(e)})
            }), time);

    n.destroy = dojo.hitch({n: n}, function(time){
        if(time == undefined){time = 800}
        if(time == 0){
            dojo.destroy(this.n);
        } else {
            setTimeout(dojo.hitch({n: this.n}, function(){
                dojo.destroy(this.n);
            }), time);
        }
    });
    return n
}


//好读的数字
var human_num = function(n){
    var w = n / 10000;
    var y = n / 100000000;
    if(w < 1){return n}
    if(y < 1){return w + '万'}
    return y + '亿';
}
