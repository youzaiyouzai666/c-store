/**
 * Created by caoyi on 2016/12/20.
 * 四级选择门店
 */
;(function ($, window) {
    "use strict";
    var TYPES = ['province','city','district','store']//一个枚举
        ,template = ''
        ,cache = {
            province: null
            ,stores:{}
        }
        ,defaults = {
            value: [11000000,11010000,11010200]//省市区县
            ,debug: true //调试模式
            ,defaultTitle:{province:'请选择',city:'请选择',district:'请选择',store:'门店'} //默认显示
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
                province: true
                ,city: true
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
                if(this.settings.debug){
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
            ,_getTemplate2: function(){
                if(!window.cStore_template){
                    $.error('模板加载异常，请检查模板 by jquery.cStore ' );
                }
                return window.cStore_template;
            }
            ,_isOneTYPES: function(type){
                if(!TYPES || !this.isArrayFn(TYPES)){
                    return false;
                }
                for(var i=0,len=TYPES.length; i<len; i++){
                   if(TYPES[i] === type){
                       return true;
                   }
                }
                return false;
            }
            ,_valuesLength: function(values){
                if(!values){
                    return 0;  }
              
                var length = 0;
                for(var i=0,len=values.length; i<len; i++){
                    if(values[i]){
                        length++
                    }
                }
                return length;
            }
        }
    })();

    /**********************************MVC*********************************/
    /**
     * Model层
     *  设计思路： 因为后台接口的不确定性，所以整个modeal模块 应该是灵活可变的（应该是插件外面处理），
     *             但本处进行了折中处理，目的是，当接口改变时，整个代码改动尽可能的少
     *             只需要改变 initLoadDataByAsync方法中实现即可
     *  整体的数据结构： 整个数据装在 this.setting 中
     *    initLoadDataByAsync function 集中通过ajax 来得到数据
     *    this.setting中 数据分为两大块：
     *                 1.box中数据--->>> setting.provinces;setting.citys;setting.districts;setting.stores中
     *                         注意，数据中都是以“s” 结尾，（citys）也是，因后续代码中需要通过
     *                             TYPES = ['province','city','district','store']加“s”得到
     *                 2.title中数据--->>>setting.checkedStatusData 中
     *                         为了代码方便，添加了一个“setting.checkedStatus”，与 “setting.checkedStatusData”高度耦合
     *                         因此附加了 getCheckedStatusData 和 setCheckedStatus 两个方法 来处理其中耦合关系
     *  数据清洗：通过setting.structure 的参数来处理（setting.structure与ajax请求数据完全相关）
     * @type {{initLoadDataByAsync, loadDataThreeByAsync, loadDataEndByAsync, dealDataCheckedStatusToSettings, getCheckedStatusData, setCheckedStatus}}
     * @private
     */
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

                s.checkedStatusData = {
                    province:{}
                    ,city: {}
                    ,district: {}
                    ,store: {}
                }
                for(var i=0,len=v.length; i<len; i++){
                    if(!v[i]){
                        return this;
                    }
                    _f._dealDataCheckedStatusToSettingsByItem.apply(this,[v[i],TYPES[i]]);
                    // eval('_f._dealDataCheckedStatusToSettingsBy'+ util.firstUpperCase(TYPES[i])+'();');
                }
            }
            /**
             * 通过no 与type来设置 checkedStatusData
             *   数据源为：ajax得到的：setting.provinces;setting.stores
             *        通过遍历得到：  setting.citys;setting.districts;
             * @param no
             * @param type
             * @returns {_f}
             * @private
             */
            ,_dealDataCheckedStatusToSettingsByItem: function(no,type){
                var item = {}
                    ,s = this.settings;
                if(!no || !type){
                    $.error( '_dealDataCheckedStatusToSettingsByItem 参数有误 on jQuery.cStore' );
                }
                function dealData() {
                    item = util._getCheckData(s[type + 's'], no);
                    s.checkedStatusData[type] = $.extend(true,{},item);//切断引用关系
                    delete s.checkedStatusData[type].children;//为了简化数据模型，checkedStatusData delete children
                }
                dealData.call(this);
                _m.setCheckedStatus.call(this,type);
                return this;
            }
        };
        return {
            /**
             * 通过ajax 异步得到基本并进行数据清洗数据
             * 得到基本数据后，在此基础上 通过value 得到setting.citys;setting.districts;setting.stores
             *    需要注意：
             *         1.当前需求是，两个ajax请求 且两请求可以并行的请求，因此以计数器设计并行请求
             *         2.对数据的清洗
             *         3.得到全部基础数据
             * @param next
             */
            initLoadDataByAsync: function(next){
                var count = 0,
                    oThis = this;
                if(!cache.province){
                    _m.loadDataThreeByAsync.call(oThis,function(data){
                        oThis.settings.provinces =cache.province = data;
                        handle();
                    });
                }else{
                    oThis.settings.provinces =cache.province;
                    handle();
                }
                //如果区数据未被选中，则不发送请求
                if( util._valuesLength(oThis.settings.value) >=3){
                    var no = oThis.settings.value[2];
                    if(!cache.stores[no]){
                        _m.loadDataEndByAsync.call(oThis,no,function(data){
                            oThis.settings.stores = cache.stores[no] = data;
                            handle();
                        });
                    }else{
                        oThis.settings.stores = cache.stores[no];
                    }
                }else{
                    handle();
                }
                /**
                 * 并行 当且上面两个async 请求都完成后才触发
                 */
                function handle(){
                    /**
                     * 得到剩下全部基础数据
                     * 通过aja请求已有数据的的children，通过value.no 来查询出实际值
                     * 得到setting.citys;setting.districts;setting.stores
                     *
                     */
                    function dealDataChildren() {
                        var s = this.settings;
                        function setItem(type,no) {
                            var index = -1
                                , item = {}
                                , s = this.settings
                                , childType = '';

                            index = util.arrayValueToIndex(TYPES, type);
                            item = util._getCheckData(s[type + 's'], no);;
                            if (item.children && TYPES[index + 1]) {
                                childType = TYPES[index + 1];
                                if (item.children && util.isArrayFn(item.children)) {
                                    s[childType + 's'] = item.children;
                                }
                            }
                        }
                        for(var i=0,len=TYPES.length; i<len; i++){
                            if(s.value[i]){
                                setItem.call(this,TYPES[i],s.value[i]);
                            }
                        }


                    }
                    count++;
                    if(count === 2){
                        dealDataChildren.call(oThis);// 3.得到全部基础数据
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

                /**
                 * 校验 settings.value[2]是否属于this.settings.districts 中
                 */
                function checkOutData() {
                    var isStoreNo = false
                        , lens = this.settings.districts;
                    for (var i = 0; i < lens.length; i++) {
                        var one = lens[i];
                        if (one.no == this.settings.value[2]) {
                            one.children = this.settings.stores;
                            isStoreNo = true;
                            break;
                        }
                    }
                    if (!isStoreNo) {
                        util.showDebug.call(this, 'settings.value[2]='
                            + this.settings.value[2] + '在this.settings.provinces中无')
                    }
                }

                checkOutData.call(this);
            }
            /**
             * 因：checkedStatus 与 checkedStatusData 耦合关系
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
            ,setCheckedStatus: function(type){
                if(type && util._isOneTYPES(type)){
                    this.settings.checkedStatus = type;
                }
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
                    html+= '<a href="javascript:;" area-title-item="" area-title-'+ o +'=""'
                        +'data-type="'+ o +'" '
                        +'data-no="'+ -1 +'"> '
                        +'<b>'+ this.settings.defaultTitle[TYPES[i]]  +'</b> '
                        +'<i></i> </a>';
                }
                $title.html(html);
            }
            ,renderTitlesByCheckedStatus: function(){
                var $title = this.$ele.find('[area-title]')
                    ,s = this.settings.isSelected //因为 isSelected 可以变
                    ,checked = _m.getCheckedStatusData.call(this);

                for(var o in s){
                        $title.find('[area-title-'+o+']')
                            .data('no',checked[o].no)
                                .find('b').text(checked[o].name ||this.settings.defaultTitle[o]);

                }
            }
            ,renderBoxsToTpl: function(){
                var $box = this.$ele.find('[area-box]')
                    ,html = '';
                var tplFn = function(type){
                    return '<div class="gctBox area-box-box" '
                            +'data-type="'+type+'" area-box-item '
                                +' area-box-'+type+' style="display: none"></div>';
                };
                for(var i= 0,len=TYPES.length; i<len; i++){
                    var one = TYPES[i];
                    html += tplFn(one);
                }
                $box.html(html);
            }
            /**
             * 通过 settings[TYPES +'s'] 数据 render Box
             */
            ,renderBoxsByCheckedStatus: function(){
                var $boxs = this.$ele.find('[area-box]')
                    ,$box = {}
                    ,s = this.settings.isSelected //因为 isSelected 可以变
                    ,checked = _m.getCheckedStatusData.call(this);

                function ftl(d,type){
                    //TODO 这个数据处理有问题，完全依赖于后端返回数据结构，应该init时对数据进行清洗一次
                    return ' <span data-no="'+d.no+'"><a href="javascript:;" title="" data-no="'
                        +d.no+'"data-type="'+type+'"area-box-'+type+'"'
                        +'" data-val="" class="area-box-item"  >'
                        +d.name+'</a></span>';
                };
                function renderBoxs(type){
                    var html = '';
                    var datas = this.settings[type+'s'];
                    if(!datas){
                        util.showDebug('function renderBoxsByCheckedStatus中数据为空');
                        return;
                    }
                    for(var i=0,len=datas.length; i<len; i++){
                        var data = datas[i];
                        html += ftl(data,type);
                    }
                    $box = $boxs.find('[area-box-'+o+']');
                    $box.html(html);
                }

                for(var o in s){
                    if(s[o]){
                        renderBoxs.call(this, o);
                    }
                }
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
                 /* this.$ele.find(".add_out,.gCity").hide();*/
                console.log('hide');
            }
            ,renderAllByCheckedStatus: function(){
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
            /**
             * 控制显隐藏及选中状态
             * 具体是根据状态 showType 来进行判断
             *
             */
            ,showAllByCheckedStatus: function(showType){
                _v.showTitlesByCheckedStatus.call(this,showType);
                _v.showBoxsByCheckedStatus.call(this,showType);
            }
            ,showTitlesByCheckedStatus: function(showType){
                var $title = this.$ele.find('[area-title]');

                $title.find('[area-title-item]').removeClass('cur');
                $title.find('[area-title-'+showType+']')
                        .addClass('cur');

            }
            ,showBoxsByCheckedStatus: function(showType){
                var $boxs = this.$ele.find('[area-box]');

                $boxs.find('[area-box-item]').hide();
                $boxs.find('[area-box-'+showType+']').show();
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

                $ele.find('[area-title-item]').on('click',$.proxy(_f.selectorTitles, this))

                $ele.find('#cityClose').on('click',$.proxy(_v.hide, this));//‘X’关闭绑定事件
                $ele.find('[area-box-item]').on('click', $.proxy(_f.selectorBoxItems, this)); //区域
            }
            /**
             * 加载模板
             * 模板包括两部分，
             * 1 部分是 jquery.cStore.template.js（整体框架）
             * 2.包括（title和box拼装的html）
             */
            ,loadTemplate: function(){
                this.$ele.append(template);
                _v.renderTitlesToTpl.call(this);
                _v.renderBoxsToTpl.call(this);
            }
            ,selectorBoxItems: function(e){
                var $e = $(e.target)
                    ,type =$e.parents('[area-box-item]').data('type')
                    ,no = $(e.target).data('no');

                //只有 isSelected 为true 才能触发
                if(!this.settings.isSelected[type]){
                    return false;
                }
                var index = util.arrayValueToIndex(TYPES, type)
                    ,values= this.settings.value || [];
                values[index] = no;
                for(var i=0,len=values.length; i<len; i++){
                    if(i> index){
                        values[i] = null;
                    }
                }
                _f.controlPlags.call(this);

            }
            ,selectorTitles: function(e){
                var $e = $(e.target)
                    ,type = $e.data('type') || $e.parent('[area-title-item]').data('type');
                //只有 isSelected 为true 才能触发
                if(this.settings.isSelected[type]){
                    _v.showAllByCheckedStatus.call(this,type);
                }

            }
            /**
             * 通过类型来选择显示
             *   如果选中前一级别，那么显示当前级别，但最后一级，则显示最后一级别
             * @param type
             * @returns {string}
             */
            ,showType: function(type){
                var index = util.arrayValueToIndex(TYPES,type);
                if(index == 3){
                    return TYPES[3];
                }else{
                    return TYPES[index+1];
                }
            }
            /**
             * 通过value 重新ajax 数据 并重新渲染整个插件
             * @param next
             */
            ,controlPlags: function(next){
                var oThis = this;
                _m.initLoadDataByAsync.call(this,function(){
                    _m.dealDataCheckedStatusToSettings.call(oThis);//初始化 settings 参数
                    _v.renderAllByCheckedStatus.call(oThis);//渲染plugs，但没有控制显示
                    _v.showAllByCheckedStatus.call(oThis,_f.showType(oThis.settings.checkedStatus));
                    if(next){
                        next.call(oThis);
                    }
                });
            }
        };
        return {
            init: function(){
                var oThis = this,
                    checkedData = {};
                _f.loadTemplate.call(oThis);//加载模板
                /**
                 *  通过ajax得到数据 后处理数据
                 *  function  initLoadDataByAsync中
                 */
                _f.controlPlags.call(this,function(){
                    //暴露load data后接口
                    checkedData = util._isEmptyObjToAttrNull(_m.getCheckedStatusData.call(oThis));
                    oThis.settings.initLoadDo(checkedData);
                });
                _f.addEvent.call(this);
            }
        }
    })();

    /**********************************入口*********************************/
    $.fn.cStore = function(options) {
        var settings = $.extend({}, defaults, options);
        template = util._getTemplate2();//模板只需要加载一次就OK
        //处理 Sizzle 引擎
        this.each(function(){
            new CStore(this, settings);
        });
    };

}(jQuery, window));