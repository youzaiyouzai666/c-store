/**
 * Created by caoyi on 2016/12/20.
 * 四级选择门店
 */
;(function ($, window) {
    "use strict";
    var TYPES = ['province','city','district','store']
        ,template = ''
        ,defaults = {
            value: [11000000,11010000,11010200]//省市区县
            ,debug: true //调试模式
            ,defaultTitle:['请选择','请选择','请选择','门店'] //默认显示
            ,structure:{
                provinces: {
                    no: 'id'
                    ,name: 'name'
                    ,parent: null
                    ,children: 'childerns'
                    ,childrens: {
                        no: 'id'
                        ,name: 'name'
                        ,parent: null
                        ,children: 'childerns'
                        ,childrens: {
                            no: 'id'
                            ,name: 'name'
                            ,parent: null
                            ,children: 'childerns'
                        }
                    }
                }
                ,stores: {
                    no: 'storeCode'
                    ,name: 'name'
                    ,parent: 'countyCode'
                    ,children: null
                    ,mobile: 'storeZonePhone'
                    ,address: 'address'
                }
            }
            ,callback:function(data){
                //data == {province: {name:"", no:123456}, city: {name:"", no:123456}, district: {name:"", no:123456}, store: {name:"", no:123456}, stores: Array[3]}
                var html =data.province.name
                    + data.city.name
                    +data.district.name
                    + data.store.name;
                $('#js_store').find('.add_select').html(html);
            }
            ,initLoadDo: function(data){
                console.log(data);
            }
            //与TYPES强耦合
            ,isSelected: {
                province: false
                ,city: false
                ,district: true
                ,store: true
            }
            ,provinces:{}
            ,citys: {}
            ,districts: {}
            ,stores: {}
            ,checkedStatus: ''
            ,checkedStatusData: {
                province:{}
                ,city: {}
                ,district: {}
                ,store: {}
            }
        };

    /**********************************Object*********************************/
    var CStore = function(ele, opt){
        this.$ele = $(ele);
        this.settings = $.extend(true,{},opt);
        this.init();
    };
    CStore.prototype = {
        init: function() {
           _c.init.call(this);
        }
        ,show: function(e) {

        }
        ,hide: function(e) {

        }
    };

    /*********************************util************************************/
    var util = (function() {
        return {
            isArrayFn: function (o) {
                return Object.prototype.toString.call(o) === '[object Array]';
            }
            ,isStringFn: function(str){
                return typeof str === "string";
            }
            ,isEmptyObject: function(e){
                var t;
                for (t in e)
                    return !1;
                return !0
            }
            ,showDebug: function(err){
                if(settings.debug){
                    console.log(err);
                }
            }
            ,isFunction: function(fn){
                return Object.prototype.toString.call(fn)=== '[object Function]';
            }
            ,ajaxGet: function(url,data,callback,err){
                var jqxhr = $.ajax({
                    url: url,
                    type: "GET",      // 默认值GET，可根据需要配置
                    cache: true,      // 默认值true, dataType是'script'或'jsonp'时为false，可根据需要配置
                    data: data || {},         // 请求参数对象
                    dataType: "jsonp", // 设置数据类型
                    jsonp: "callback",// 只在操作JSONP时设置此项
                    statusCode: {     // 针对特定错误码的回调处理函数
                        404: err,
                        500: err
                    }
                });
                jqxhr.done(callback);//这里this无法传递
                jqxhr.fail(err);
            }
            ,firstUpperCase: function(str){
                if(!str || !this.isStringFn(str)){
                   return ''
                }
                return str.replace(/^\S/,function(s){return s.toUpperCase()});
            }
            ,arrayValueToIndex: function(arg, value){
                var i=0,
                    len = arg.length;
                for(i; i<len; i++){
                    if(arg[i] === value){
                        return i;
                    }
                }
                return -1;
            }
            /********************业务工具************************************/
            ,_getCheckData: function(lists, no){
                for(var i=0,len=lists.length; i<len; i++){
                    var one = lists[i];
                    if(one.no == no){
                        return one;
                    }
                }
                return false;
            }
            ,_isEmptyObjToAttrNull: function(objs){
                var obj =  jQuery.extend(true, {}, objs);
                for(var o in obj){
                    if(!obj[o] || this.isEmptyObject(obj[o])){
                        obj[o]= null;
                    }
                }
                return obj;

            }
            ,_getTemplate: function(){
                if(!window.cStore_template){
                    $.error('模板加载异常，请检查模板 by jquery.cStore ' );
                }
                return window.cStore_template;
            }
        }
    })();

    /**********************************MVC*********************************/
    var _m = (function() {
        var _f = {
            parseData: function(data, structure){
                var objs = [];
                if(!data || !util.isArrayFn(data) || data.length<1 || !structure){
                    return ''
                }
                for(var i=0,len=data.length; i<len; i++){
                    var one = data[i];
                    var obj = {
                        no: one[structure.no] || -1,
                        name: one[structure.name] || '',
                        parent: one[structure.parent] || '',
                        children: this.parseData(one[structure.children],structure.childrens)
                    };
                    objs.push(obj);
                }
                return objs;
            }
            ,parseDateSpe: function(data, structure){
                var objs = [];
                if(!data || !util.isArrayFn(data) || data.length<1 || !structure){
                    return ''
                }
                for(var i=0,len=data.length; i<len; i++){
                    var one = data[i];
                    var obj = {};
                    //TODO 将两个方法合成一个方法 （没有递归 所以可以这么玩 ）
                    for(var attr in structure){
                        obj[attr] = one[structure[attr]];
                    }
                    objs.push(obj);
                }
                return objs;
            }
            ,dealDataCheckedStatusToSettings: function(){
                var s = this.settings
                    ,v = s.value;

                for(var i=0,len=v.length; i<len; i++){
                    _f._dealDataCheckedStatusToSettingsByItem.apply(this,[v[i],TYPES[i]]);
                    // eval('_f._dealDataCheckedStatusToSettingsBy'+ util.firstUpperCase(TYPES[i])+'();');
                }
            }
            ,_dealDataCheckedStatusToSettingsByItem: function(no,type){
                var item = {}
                    ,s = this.settings;
                if(!no || !type){
                    $.error( '_dealDataCheckedStatusToSettingsByItem 参数有误 on jQuery.cStore' );
                }

                function dealData() {
                    item = util._getCheckData(s[type + 's'], no);
                    s.checkedStatusData[type] = item;
                }
                function dealDataChildren() {
                    var  index = -1
                        ,childType = '';
                    index = util.arrayValueToIndex(TYPES, type);
                    if (item.children && TYPES[index + 1]) {
                        childType = TYPES[index + 1];
                        if (item.children && util.isArrayFn(item.children)) {
                            s[childType + 's'] = item.children;
                        }
                    }
                }

                dealData();
                dealDataChildren();

                return this;
            }
        };
        return {
            initLoadDataByAsync: function(next){
                var count = 0,
                    oThis = this;

                _m.loadDataThreeByAsync.call(oThis,function(data){
                    oThis.settings.provinces = data;
                    handle();
                });
                if(oThis.settings.value.length >=3){
                    _m.loadDataEndByAsync.call(oThis,oThis.settings.value[2],function(data){
                        oThis.settings.stores = data;
                        handle();
                    });
                }else{
                    handle();
                }
                /**
                 * 并行 当且上面两个async 请求都完成后才触发
                 */
                function handle(){
                    count++;
                    if(count === 2){
                        next.call(oThis);
                    }
                }
            }
            ,loadDataThreeByAsync: function(next){
                var structure = this.settings.structure.provinces,
                    oThis = this;
                var callback = function(data){
                    next.call(oThis, _f.parseDateSpe(data, structure))
                };
                //TODO 接口需要cookie 所以先关闭
                /* util.ajaxGet.apply(this,[url.loadDataThreeByAsync,callback]);*/
                next.call(this, _f.parseData(cStore_config.data, structure));
            }
            ,loadDataEndByAsync: function(no,next){
                var structure = this.settings.structure.stores
                    ,oThis = this
                    ,data = {
                        countyCode:no
                    };
                var callback = function(data){
                    next.call(oThis, _f.parseDateSpe(data, structure))
                };
                /*util.ajaxGet(url.loadDataEndByAsync,data,callback);*/
                next.call(this, _f.parseDateSpe(cStore_config.stores.data, structure));
            }
            ,dealDataCheckedStatusToSettings: function(){
                _f.dealDataCheckedStatusToSettings.call(this);
            }
            /**
             * 因 checkedStatus 与 checkedStatusData 耦合关系
             * 通过checkedStatus 得到 checkedStatusData
             * 问题是： 在get 方法中 级联 改了checkedStatusData本身，但为了 
             * @returns {defaults.checkedStatusData|{province, city, district, store}|{province, city, district, store, stores}}
             */
            ,getCheckedStatusData: function(){
                var isNull = false
                    ,data = this.settings.checkedStatusData;

                for(var i,len=TYPES.length; i<len; i++){
                    var one = TYPES[i];
                    if(isNull){
                        data[one] = {};
                    }
                    if(one === this.settings.checkedStatus){
                        isNull = true;
                    }

                }
                return data;
            }
            ,setCheckedStatus: function(){

            }
        }
    })();

    var _v = (function(){
        var _f = {
            renderTitlesToTpl: function(){
                var $title = this.$ele.find('[area-title]')
                    ,html = ''
                    ,s = TYPES;

                for(var i=0,len=s.length; i<len; i++){
                    var o = s[i];
                    html+= '<a href="javascript:;" area-title-'+ o +'=""'
                        +'data-type="'+ o +'" '
                        +'data-no="'+ -1 +'"> '
                        +'<b>'+ this.settings.defaultTitle[i]  +'</b> '
                        +'<i></i> </a>';
                }
                $title.html(html);
            }
            ,renderTitlesByCheckedStatus: function(){
                var $title = this.$ele.find('[area-title]')
                    ,s = this.settings.isSelected //因为 isSelected 可以变
                    ,checked = _m.getCheckedStatusData.call(this);

                for(var o in s){
                    if(s[o]){
                        $title.find('[area-title-'+o+']')
                            .data('no',checked[o].no)
                                .find('b').text(checked[o].name);
                        console.log( 'area-title-'+o,$title.find('area-title-'+o).html());
                    }
                }
            }
            ,renderBoxsToTpl: function(){
                var $box = this.$ele.find('[area-box]')
                    ,html = '';
                var tplFn = function(type){
                    return '<div class="gctBox area-box-box" '
                            +'data-type="'+type+'" area-box-item '
                                +' area-box-'+type+' ></div>';
                };
                for(var i= 0,len=TYPES.length; i<len; i++){
                    var one = TYPES[i];
                    html += tplFn(one);
                }
                $box.html(html);
            }
            ,renderBoxsByCheckedStatus: function(){

            }
        };

        return {
            show: function(e) {
              /*  var type ='district';
                if(util.isEmptyObject(getCheckedStatusData().store)
                    || !util.isEmptyObject(getCheckedStatusData().district)){
                    type = 'store'
                }
                _f.showContent(type);*/
                this.$ele.find(".add_out,.gCity").show();
            }
            ,hide: function(e) {
                /*  $thisDom.find(".add_out,.gCity").hide();*/
                console.log('hide');
            }
            ,renderAllByCheckedStatus: function(){
                debugger;
                _v.renderTitlesByCheckedStatus.call(this);
                _v.renderBoxsByCheckedStatus.call(this);
            }
            ,renderTitlesToTpl: function(){
                _f.renderTitlesToTpl.call(this);
            }
            ,renderTitlesByCheckedStatus: function(){
                _f.renderTitlesByCheckedStatus.call(this);
            }
            ,renderBoxsToTpl: function(){
                _f.renderBoxsToTpl.call(this);
            }
            ,renderBoxsByCheckedStatus: function(){
                _f.renderBoxsByCheckedStatus.call(this);
            }

        }
    })();

    var _c = (function(){
        var _f = {
            addEvent: function(){
                _f._addEventOnEle.call(this);
                _f._addEventOnPlug.call(this);
            }
            ,_addEventOnEle: function(){
                var oThis = this
                    ,isHide = true;
                //隐藏添加 延时处理（当且仅当 离开div且 延时才hide）
                oThis.$ele.hover(function(e){
                    isHide = false;
                    _v.show.call(oThis,e);
                },function(e){
                    isHide = true;
                    setTimeout(function(){
                        if(isHide){
                            _v.hide.call(oThis,e);
                        }
                    },100);
                });
            }
            ,_addEventOnPlug: function(){
                var $ele =  this.$ele
                    ,s = this.settings.isSelected;

                $ele.find('[area-box-item]').on('click', $.proxy(_f.selectorBoxItem, this)); //区域
                $ele.find('#cityClose').on('click',$.proxy(_v.hide, this));//‘X’关闭绑定事件

                //TODO　等后续……
                for(var o in s){
                    if(s[o]){
                        $ele.find('[area-title-'+o+']')
                            .on('click',$.proxy(eval('_f.selector'+util.firstUpperCase(o)), this));//区域选择器事件
                    }

                }
            }
            ,loadTemplate: function(){
                this.$ele.append(template);
                _v.renderTitlesToTpl.call(this);
                _v.renderBoxsToTpl.call(this);
            }
        };
        return {
            init: function(){
                var oThis = this,
                    checkedData = {};
                _f.loadTemplate.call(oThis);
                _m.initLoadDataByAsync.call(this,function(){
                    _m.dealDataCheckedStatusToSettings.call(oThis);//初始化 settings 参数
                    //暴露load data后接口
                    checkedData = util._isEmptyObjToAttrNull(_m.getCheckedStatusData.call(oThis));
                    oThis.settings.initLoadDo(checkedData);
                    _v.renderAllByCheckedStatus.call(oThis);//渲染plugs，但没有控制显示
                });
                _f.addEvent.call(this);
            }
        }
    })();

    /**********************************入口*********************************/
    $.fn.cStore = function(options) {
        var settings = $.extend({}, defaults, options);
        template = util._getTemplate();//模板只需要加载一次就OK
        //处理 Sizzle 引擎
        this.each(function(){
            new CStore(this, settings);
        });
    };

}(jQuery, window));