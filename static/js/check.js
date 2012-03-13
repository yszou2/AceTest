//定义一些检查用的断言
var AceTestError = function(msg, should, actual){
    var o = {};
    o._type = 'AceTestError';
    o.msg = msg;
    o.should = should;
    o.actual = actual;
    return o;
}

//使用这个函数获取对象属性,以避免对属性不存在的检查
var get_attr = function(obj, attr){
    try{
        return obj[attr];
    } catch (error) {
        if(error.name != 'TypeError'){
            throw error;   
        }
    }
}


//检查obj是不是一个json对象
var assertJson = function(obj, msg){
    if(msg == undefined){msg = 'JSON类型检查失败'}
    if(typeof(obj) != 'object' || obj === null){
        throw AceTestError(msg,
                    'Json',
                    obj === null ? 'null' : typeof(obj));
    }

}

//检查obj对象类型
var assertObject = function(obj, msg){
    if(msg == undefined){msg = '对象类型检查失败'}
    if(!(typeof(obj) == 'object' && obj.constructor == Object)){
        throw AceTestError(msg, 'Object',
                           obj == undefined ? obj : obj.constructor.name);
    }
}

//检查obj数组类型
var assertArray = function(obj, msg){
    if(msg == undefined){msg = '数组类型检查失败'}
    if(!(typeof(obj) == 'object' && obj.constructor == Array)){
        throw AceTestError(msg, 'Array',
                           obj == undefined ? obj : obj.constructor.name);
    }
}
//检查obj字符串
var assertStr = function(obj, msg){
    if(msg == undefined){msg = '字符串类型检查失败'}
    if(!(typeof(obj) == 'object' && obj.constructor == String)){
        throw AceTestError(msg, 'String',
                           obj == undefined ? obj : obj.constructor.name);
    }
}

//检查数据相等
var assertEqual = function(v, n, msg){
    if(msg == undefined){msg = '数据相同检查失败'}
    if(v != n){
        throw AceTestError(msg, n, v);
    }
}

//检查属性存在
var assertHasAttr = function(obj, attr, msg){
    if(msg == undefined){msg = '属性存在性检查失败'}
    if(!attr in obj){
        throw AceTestError(msg, attr, '');
    }
}
