/**
 * Created by caoyi on 2016/12/20.
 * 四级选择门店
 */
;(function ($, window) {
    "use strict";
    var settings = {

        },
        $thisDom,
        url = {
            loadDataThreeByAsync: 'http://cart.gome.com.cn/home/api/payment/getStoreRegion',
            loadDataEndByAsync: 'http://cart.atguat.com.cn/home/api/transport/getGomeStores'
        },
       /* url = {
            loadDataThreeByAsync: '//cart'+cookieDomain+'/home/api/payment/getStoreRegion',
            loadDataEndByAsync: '//cart'+cookieDomain+'/home/api/transport/getGomeStores'
        },*/
        TYPES = ['province','city','district','store'],
        defaults = {
            value: [11000000,11010000,11010200]//省市区县
            ,debugger: false //调试模式

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
                /*console.log(data);*/
            }
            ,province:{}
            ,city: {}
            ,district: {}//区数据是 传值（必须）
            ,stores: {}
            ,checkedStatusData: {
                province:{}
                ,city: {}
                ,district: {}
                ,store: {}
                ,stores: []//与区域值一起传来（必须）
            }
        };
    var util = (function() {
        return {
            isArrayFn: function (o) {
                return Object.prototype.toString.call(o) === '[object Array]';
            }
            ,isEmptyObject: function(e){
                var t;
                for (t in e)
                    return !1;
                return !0
            }
            ,showDebugger: function(err){
                if(settings.debugger){
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
                jqxhr.done(callback);
                jqxhr.fail(err);
            }
        }
    })();

    //private function
    var _f = (function() {
        var isRenderCity = true,
            isRenderDistrict = true,
            isRenderStore = true;
        var _m = {
            verifySettings: function(){
                var v = settings.value;
                if(!v || !util.isArrayFn(v) || v.length<2){//前两个是必传
                    $.error( 'cStore options.value be at fault on jQuery.cStore' );
                    return false;
                }
                return true;
            }
            ,initCheckedStatus: function(){
                if(!this.verifySettings()){
                    $.error( 'cStore verifySettings be at fault on jQuery.cStore' );
                }
                var v = settings.value;

                this.setCheckProvince(v[0]);
                this.setCheckCity(v[1]);
                if(v[2]){
                    this.setCheckDistrict(v[2]);
                }
                if(v[3]){
                    this.setCheckStore(v[3]);
                }
            }
            ,_loadTemplate: function(){
                if(!window.cStore_template){
                    $.error('cStore template no read by jquery.cStore ' );
                }
               /* if($thisDom.find('.gCity').length > 0){
                    util.showDebugger('template已经加载');
                    return false;
                };*/
                var tpl = window.cStore_template;
                $thisDom.append(tpl);
            }
            ,renderBoxItems: function(){
                var types = TYPES,
                    html = '';
                var tplFn = function(type){
                    return '<div class="gctBox eye-protector-processed area-box-box" '
                        +'data-type="'+type+'" area-box-item '
                        +' area-box-'+type+' ></div>';
                }
                for(var i= 0,len=types.length; i<len; i++){
                    var one = types[i];
                    html += tplFn(one);
                }
                $thisDom.find('#area-box').html(html);

            }
            ,getDataProvince: function(no, callback){
                if(callback && util.isFunction(callback)){
                    callback();
                }
            }
            ,getDataCity: function(no, callback){
                if(callback && util.isFunction(callback)){
                    callback();
                }
            }
            ,getDataDistrict: function(no, callback){
                if(callback && util.isFunction(callback)){
                    callback(settings.district);
                }
                return settings.district;
            }
            ,getDataStore: function(no,callback){
                if(callback && util.isFunction(callback)){
                    callback();
                }
            }
            ,_getCheckData: function(lists, no){
                for(var i=0,len=lists.length; i<len; i++){
                    var one = lists[i];
                    if(one.no == no){
                        return one;
                    }
                }
                return false;
            }
            ,setCheckProvince: function(no){
                var province = [];
                if(!no || !settings.province){
                    $.error( 'setCheckProvince 参数有误 on jQuery.cStore' );
                }
                province = this._getCheckData(settings.province,no);
                settings.checkedStatusData.province = province;
                settings.city = province.children;
                return this;
            }
            ,setCheckCity: function(no){
                var pno = settings.checkedStatusData.province.no,
                    city = [];
                if(!no || !settings.city || !pno){
                    $.error( 'setCheckProvince 参数有误 on jQuery.cStore' );
                }
                city = this._getCheckData(settings.city,no);
                settings.checkedStatusData.city = city;
                settings.district = city.children;
                return this;
            }
            ,setCheckDistrict: function(no){
                var districts = settings.district,
                    district = [];
                if(!districts || !util.isArrayFn(districts) || districts.length<1){
                    $.error( 'setCheckDistrict 参数有误 on jQuery.cStore' );
                }
                district = this._getCheckData(districts,no);
                settings.checkedStatusData.district = district;
                return this;
            }
            ,setCheckStore: function(no){
                var stores = settings.stores,
                    store = {};
                if(!stores || !util.isArrayFn(stores) || stores.length<1){
                    $.error( 'setCheckStore 参数有误 on jQuery.cStore' );
                }
                store = this._getCheckData(stores,no);
                settings.checkedStatusData.store = store;
                return this;

            }
            ,setShowAllTitle: function(){
                if(!_m.verifySettings()){
                    $.error( 'cStore verifySettings be at fault on jQuery.cStore' );
                }
                var checked = settings.checkedStatusData;

                _m.setShowProvince(checked.province);
                _m.setShowCity(checked.city);
                _m.setShowDistrict(checked.district);
                _m.setShowStore(checked.store);

            }
            ,setShowBox: function(){
                if(!_m.verifySettings()){
                    $.error( 'cStore verifySettings be at fault on jQuery.cStore' );
                }
            }
            ,setShowProvince: function(checked){
                if(!checked || !checked.name){
                    return false;
                }
                $thisDom.find('[area-title-province] b').text(checked.name);

            }
            ,setShowCity: function(checked){
                if(!checked || !checked.name){
                    return false;
                }
                $thisDom.find('[area-title-city] b').text(checked.name);
            }
            ,setShowDistrict: function(checked){
                var $showDom = $thisDom.find('[area-title-district] b');

                if(!checked || !checked.name){
                    $showDom.text(settings.defaultTitle[2]);
                    return false;
                }
                $showDom.text(checked.name);
            }
            ,setShowStore: function(checked){
                var $showDom =  $thisDom.find('[area-title-store] b');
                if(!checked || !checked.name){
                    $showDom.text(settings.defaultTitle[3]);
                    return false;
                }
                $showDom.text(checked.name);
            }
            /**
             * title 切换状态
             * @param type
             */
            ,cutTitleStatus: function(type){
                var $selected = $thisDom.find('[area-title]');
                $selected.find('a').removeClass('cur');
                $selected.find('[area-title-'+type+']').addClass('cur');
            }
            ,cutBoxStatus: function(type){
                var $selected = $thisDom.find('#area-box');
                $selected.find('[area-box-item]').hide();
                $selected.find('[area-box-'+type+']').show();
            }
            ,renderBox: function(){
                if(settings.value && settings.value[2]) {
                    this.renderDistrict();
                }
                if(settings.value && settings.value[3]){
                    this.renderStore();
                }
            }
            ,renderCity: function(){

            }
            ,renderDistrict: function(){
                var html = '';
                var ftl = function(d){
                    //TODO 这个数据处理有问题，完全依赖于后端返回数据结构，应该init时对数据进行清洗一次
                    return ' <span><a href="javascript:;" '
                        +'title="'+d.name+'" data-no="'
                        +d.no+'" data-val="" class="eye-protector-processed area-box-item">'
                        +d.name+'</a></span>';
                };
                var district =  this.getDataDistrict();
                if(!district || !util.isArrayFn(district) || district.length<1){
                    $.error( 'selectorDistrict 参数有误 on jQuery.cStore' );
                }
                for(var i=0,len=district.length; i<len; i++){
                    var one = district[i];
                    html += ftl(one);
                }
                $thisDom.find('[area-box-district]').html(html);
            }
            ,renderStore: function(){
                var html = '';
                var ftl = function(d){
                    //TODO 这个数据处理有问题，完全依赖于后端返回数据结构，应该init时对数据进行清洗一次
                    return ' <span><a href="javascript:;"'
                        +'title="'+d.name+'" data-no="'
                        +d.no+'" data-val="" class="eye-protector-processed area-box-item" >'
                        +d.name+'</a></span>';
                };
                var stores = settings.stores;
                if(!stores || !util.isArrayFn(stores) || stores.length<1){
                    $.error( 'setCheckStore 参数有误 on jQuery.cStore' );
                }
                //TODO 处理数据 重新整理数据结构
                for(var i=0,len=stores.length; i<len; i++){
                    var one = stores[i];
                    html += ftl(one);
                }
                $thisDom.find('[area-box-store]').html(html);
            }
            ,parseData: function(data, structure){
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
                    for(var attr in structure){
                        obj[attr] = one[structure[attr]];
                    }
                    objs.push(obj);
                }
                return objs;
            }
        };
        return {
            initLoadDataByAsync: function(next){
                var count = 0;

                _f.loadDataThreeByAsync(function(data){
                    settings.province = data;
                    handle();
                });
                if(settings.value.length >=3){
                    _f.loadDataEndByAsync(settings.value[2],function(data){
                        settings.stores = data.data;
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
                        next();
                    }
                }
            },
            loadDataThreeByAsync: function(next){
                //TODO 接口需要cookie 所以先关闭
               /* util.ajaxGet(url.loadDataThreeByAsync,next);*/
               next(cStore_config.data);
            },
            loadDataEndByAsync: function(no,next){
                var data = {
                    countyCode:no
                };
                /*util.ajaxGet(url.loadDataEndByAsync,data,next);*/
                next(cStore_config.stores);
            },
            parseData: function(callback){
                _f.parseDataByProvinces();
                _f.parseDataByStores();
            }
            ,parseDataByProvinces: function(){
                var province = settings.province
                    ,structure = settings.structure.provinces;
                settings.province = _m.parseData(province,structure);
            }
            ,parseDataByStores: function(){
                var stores= settings.stores
                    ,structure = settings.structure.stores;
                if(!stores || !util.isArrayFn(stores) || stores.length<1){
                    return;
                }
                settings.stores = _m.parseDateSpe(stores,structure);
            }
            ,setSettings: function(){
                if(!_m.verifySettings()){
                    $.error( 'cStore verifySettings be at fault on jQuery.cStore' );
                }
                _m.initCheckedStatus();
            }
            ,show: function(e) {
                var type ='district';
                if(util.isEmptyObject(settings.checkedStatusData.store)
                    || !util.isEmptyObject(settings.checkedStatusData.district)){
                    type = 'store'
                }
                _f.showContent(type);
                 $thisDom.find(".add_out,.gCity").show();
            }
            ,showContent: function(type){
                _f.setShowAllTitle();
                if(type == 'district'){
                    _f.selectorDistrict();
                }else if(type == 'store'){
                    _f.selectorStore();
                }

            }
            ,hide: function(e) {
               /*  $thisDom.find(".add_out,.gCity").hide();*/
                console.log('hide');
            }
            ,initTemplate: function(){
                _m._loadTemplate();
                _m.renderBoxItems();
            }
            ,verifySettings: _m.verifySettings
            ,setShowAllTitle: _m.setShowAllTitle
            ,setShowBox: _m.setShowBox
            ,renderBox: _m.renderBox
            ,renderDistrict: _m.renderDistrict
            ,renderStore: _m.renderStore
            ,selectorProvince: function(e){

            }
            ,selectorCity: function(e){
                if(isRenderCity){
                    _m.renderCity();
                    isRenderCity = false;
                }
                _m.cutTitleStatus('city');
                _m.cutBoxStatus('city');
            }
            ,selectorDistrict: function(e){
                if(isRenderDistrict){
                    _m.renderDistrict();
                    isRenderDistrict = false;
                }
                _m.cutTitleStatus('district');
                _m.cutBoxStatus('district');
            }
            ,selectorStore: function(e){
                if(isRenderStore){
                    _m.renderStore();
                    isRenderStore = false;
                }
                _m.cutTitleStatus('store');
                _m.cutBoxStatus('store');
            }
            ,selectorBoxItem: function(e){
                var $target = $(e.target)
                    ,no = $target.data('no') || 0
                    ,type = $target.parents('[area-box-item]').data('type');
                $target.parents('[area-box-item]').find('.item-checked').removeClass('item-checked');
                $target.addClass('item-checked');
                if(type && type==='district'){//if 是区域选中
                    _f.loadDataEndByAsync(no, function(data){
                        settings.stores = data.data;
                        _f.parseDataByStores();
                        settings.checkedStatusData.store = {};
                        _m.setCheckDistrict(no);
                        _m.setShowAllTitle();
                        _m.renderStore('');
                    });
                    //TODO 特殊情况处理

                    _f.showContent('store');
                }
                if(type && type==='store'){
                    _m.setCheckStore(no);
                    _m.setShowAllTitle();
                    settings.callback(settings.checkedStatusData);
                    _f.hide();
                }
            }
        }
    })();

    // public function
    var methods = {
        init: function( options ) {
            return this.each(function (){//return jquery object
                var $this = $thisDom =  $(this);
                var isHide = true;
                _f.initTemplate();
                // parameter setting
                settings = $.extend({}, defaults, options);//每次 都重置setting
                // 填入插件代码
                _f.initLoadDataByAsync(function(){
                    _f.parseData();//处理过滤数据数据
                    _f.setSettings();//初始化 settings 参数
                    settings.initLoadDo(settings.checkedStatusData);
                });
                $thisDom.hover(function(e){
                    isHide = false;
                    methods.show(e);
                },function(e){
                    isHide = true;
                    setTimeout(function(){
                        if(isHide){
                            methods.hide(e);
                        }
                    },100);
                });
                methods.addEvents();
            });
        },
        show: function(e) {
            _f.show(e);
        },
        hide: function(e) {
            _f.hide(e);
        },
        addEvents: function(){
            $thisDom.find('#cityClose').on('click',$.proxy(_f.hide, this));//‘X’关闭绑定事件
            $thisDom.find('[area-title-province]').on('click',$.proxy(_f.selectorProvince, this));
           /* $thisDom.find('[area-title-city]').on('click',$.proxy(_f.selectorCity, this));*/
            $thisDom.find('[area-title-district]').on('click',$.proxy(_f.selectorDistrict, this));//区域选择器事件
            $thisDom.find('[area-title-store]').on('click',$.proxy(_f.selectorStore, this));//区域选择器事件
            $thisDom.find('[area-box-item]').on('click', $.proxy(eval(_f.selectorBoxItem), this)); //区域属性选择器
        }
    };
    $.fn.cStore = function(method ) {
        if(!cStore_config){
            $.error( 'cStore_config does not exist on jQuery.cStore' );
            return this;
        }
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.cStore' );
        }
    };
}(jQuery, window));