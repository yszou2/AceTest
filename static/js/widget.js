dojo.aw = {};

//checkbox
(function(){
    dojo.aw.aw_checkbox_bind = function(node){
        node.AW_ONCLICK_BIND = dojo.connect(node, 'onclick', {node: node}, function(eventObj){
            //dojo.stopEvent(eventObj);
            if(this.node.disabled){return}
            this.node.checked = dojo.hasClass(this.node, 'aw_cb_on');
            this.node.checked ? this.node.uncheck() : this.node.check();
        });

        node.check = dojo.hitch({node: node},function(){
            if(this.node.checked){return this.node}
            dojo.removeClass(this.node, 'aw_cb_off');
            dojo.addClass(this.node, 'aw_cb_on');
            this.node.checked = true;
            return this.node;
        });

        node.uncheck = dojo.hitch({node: node}, function(){
            if(!this.node.checked){return this.node}
            dojo.addClass(this.node, 'aw_cb_off');
            dojo.removeClass(this.node, 'aw_cb_on');
            this.node.checked = false;
            return this.node;
        });

        return node;
    }

})();


//selectbox
(function(){
    var item_node_show = function(){
        dojo.addClass(this.node, 'aw_sb_items_on');
        dojo.removeClass(this.node, 'aw_sb_items_off');
        dojo.anim(this.node,
            {height: {start: 0, end: this.node.o_height}}, 200, null,
            dojo.hitch({sn: this.sn}, function(item){
                this.sn.disabled = false;
            }));
    }
    var item_node_hide = function(){
        dojo.anim(this.node,
            {height: {end: 0, start: this.node.o_height}}, 200, null,
            dojo.hitch({sn: this.sn, node: this.node}, function(item){
                dojo.addClass(item, 'aw_sb_items_off');
                dojo.removeClass(item, 'aw_sb_items_on');
                dojo.style(item, 'height', this.node.o_height + 'px');
                this.sn.disabled = false;
            }));
    }

    var scope_obj = {
        item_node_show: item_node_show,
        item_node_hide: item_node_hide
    }

    dojo.aw.aw_selectbox_bind = dojo.hitch(scope_obj, function(node){
        var sn = dojo.query('.aw_selectbox', node)[0];
        var n = dojo.query('.aw_selectbox_items', node)[0];
        sn.item_node = n;

        //鼠标滑过只是为了上面按钮的一个效果, 还有自动隐藏
        n.AW_ONMOUSEOVER_BIND = dojo.connect(n, 'onmouseover', {sb: sn, item_node: n}, function(eventObj){
            dojo.toggleClass(this.sb, 'aw_sb_on');
            dojo.toggleClass(this.sb, 'aw_sb_off');
            if(this.sb.sub){clearTimeout(this.sb.sub)}
        });
        n.AW_ONMOUSEOUT_BIND = dojo.connect(n, 'onmouseout', {sb: sn, item_node: n}, function(eventObj){
            dojo.toggleClass(this.sb, 'aw_sb_on');
            dojo.toggleClass(this.sb, 'aw_sb_off');
            this.sb.sub = setTimeout(dojo.hitch({item_node: this.item_node},
                                     function(){this.item_node.hide()}), 200);
        });

        dojo.toggleClass(n, 'aw_sb_items_on');
        dojo.toggleClass(n, 'aw_sb_items_off');
        n.show = dojo.hitch({node: n, sn: sn}, this.item_node_show);
        n.hide = dojo.hitch({node: n, sn: sn}, this.item_node_hide);

        //点击li后下拉菜隐藏
        dojo.query('li', n).forEach(function(item){
            item.AW_ONCLICK_BIND = dojo.connect(item, 'onclick', {node: n, sn: sn},
                function(eventObj){
                    if(this.sn.disabled){return}
                    else{this.node.hide()}
                });
        });

        sn.AW_ONMOUSEOVER_BIND = dojo.connect(sn, 'onmouseover', {sn: sn}, function(eventObj){
            dojo.stopEvent(eventObj);
            if(this.sn.disabled){return}
            dojo.toggleClass(this.sn, 'aw_sb_on');
            dojo.toggleClass(this.sn, 'aw_sb_off');
            if(this.sn.sub){clearTimeout(this.sn.sub)} //自动隐藏
        });

        sn.AW_ONMOUSEOUT_BIND = dojo.connect(sn, 'onmouseout', {sn: sn}, function(eventObj){
            dojo.stopEvent(eventObj);
            if(this.sn.disabled){return}
            dojo.toggleClass(this.sn, 'aw_sb_on');
            dojo.toggleClass(this.sn, 'aw_sb_off');
            //自动隐藏
            this.sn.sub = setTimeout(dojo.hitch({item_node: this.sn.item_node},
                                  function(){this.item_node.hide()}), 200);
        });

        sn.AW_ONCLICK_BIND = dojo.connect(sn, 'onclick', {sn: sn, n: n},
            function(eventObj){
                dojo.stopEvent(eventObj);
                if(this.sn.disabled){return}
                else{this.sn.disabled = true}
                this.n.o_height = this.n.children.length * 19;
                if(dojo.hasClass(this.sn.item_node, 'aw_sb_items_on')){
                    this.sn.item_node.hide();
                } else {this.sn.item_node.show()}
        });
    });
})();


//移动元素
(function(){
    dojo.aw.move_it = function(move_node, focus_node){
        if(!focus_node){
            var focus_node = move_node;
        }
        dojo.style(focus_node, 'cursor', 'move');

        move_node.before_move = function(){return true}
        move_node.start_move = function(){}
        move_node.on_move = function(){}
        move_node.end_move = function(){}

        dojo.connect(focus_node, 'onmousedown', {mn: move_node, fn: focus_node},
            function(eventObj){
                dojo.stopEvent(eventObj);
                var mn = this.mn;
                if(!mn.before_move(eventObj)){return}
                dojo.style(mn, 'position', 'absolute');
                dojo.style(mn, 'opacity', '0.9');

                mn.ox = mn.offsetLeft;
                mn.oy = mn.offsetTop;
                mn.ex = eventObj.clientX;
                mn.ey = eventObj.clientY;
                mn.start_move(eventObj);

                mn.move_bind = dojo.connect(dojo.doc, 'onmousemove', {mn: mn, fn: this.fn},
                    function(eventObj){
                        dojo.stopEvent(eventObj);
                        dojo.style(this.mn,
                            {left: (this.mn.ox + eventObj.clientX - this.mn.ex) + 'px',
                             top: (this.mn.oy + eventObj.clientY - this.mn.ey) + 'px'});
                        //不能移动到上面看不到， 左边看不到
                        if(this.mn.offsetLeft < 0){
                            dojo.style(this.mn, 'left', '0px');
                        }
                        if(this.mn.offsetTop < 0){
                            dojo.style(this.mn, 'top', '0px');
                        }
                        this.mn.on_move(eventObj);
                    }
                );

                mn.up_bind = dojo.connect(dojo.doc, 'onmouseup', {mn: mn, fn: this.fn},
                    function(eventObj){
                        dojo.stopEvent(eventObj);
                        dojo.style(this.mn, 'opacity', '1');
                        dojo.disconnect(this.mn.move_bind);
                        dojo.disconnect(this.mn.up_bind);
                        this.mn.end_move(eventObj);
                    }
                );
        });

        return move_node;
    }
})();

//悬挂提示
(function(){
    dojo.aw.hang_tip = function(node, time){
        if(time == undefined){time = 800}
        node.callback_list = [];
        node.addCallback = dojo.hitch({n: node},
            function(f){this.n.callback_list.push(f)}
        );
        dojo.connect(node, 'onmouseover', {n: node, time: time},
            function(eventObj){
                this.n.timer = setTimeout(dojo.hitch({n: this.n, event: eventObj},
                    function(){
                        var d = new dojo.Deferred();
                        dojo.forEach(this.n.callback_list, function(e){d.addCallback(e)});
                        d.callback(this.event);
                    }), this.time);
            }
        );
        dojo.connect(node, 'onmouseout', {n: node},
            function(){
                if(this.n.timer){clearTimeout(this.n.timer)}
                this.n.cancel();
            }
        );

        node.addCallback(dojo.hitch({n: node}, function(event){
            this.n.layout = dojo.create('div', {style: 'position: absolute; background-color: white; padding: 5px; border: 1px solid #0184B7; font-family: monospace; font-size: 12px; letter-spacing: 1px; line-height: 18px; -moz-box-shadow: 3px 3px 5px #333; -webkit-box-shadow: 3px 3px 5px #333;'}, dojo.body(), 'last');
            dojo.style(this.n.layout, {top: event.pageY + 10 + 'px',
                                       left: event.pageX + 10 + 'px'});
            this.n.layout_conn = dojo.connect(this.n, 'onmousemove', {n: this.n},
                function(eventObj){
                    dojo.style(this.n.layout, 'top', eventObj.pageY + 10 + 'px');
                    dojo.style(this.n.layout, 'left', eventObj.pageX + 10 + 'px');
                }
            );
        }));

        node.cancel = dojo.hitch({n: node}, function(){
            dojo.disconnect(this.n.layout_conn);
            dojo.destroy(this.n.layout);
        });

        return node;
    }
})();


dojo.addOnLoad(function(){
    (function(){
        //绑定页面上的所有checkbox
        dojo.query('img.aw_checkbox').forEach(dojo.aw.aw_checkbox_bind);

        //绑定所有页面上的selectbox
        dojo.query('div.aw_selectbox_block').forEach(dojo.aw.aw_selectbox_bind);
    })();
});
