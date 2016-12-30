/**
 * Created by caoyi on 2016/12/23.
 */
;(function(window){
    var rComment = /\/\*([\s\S]*?)\*\//;
// multiply string
    function ms(fn){
        return fn.toString().match(rComment)[1]
    };
    var html = ms(function(){/*
     <div class="pr add_out hide">
            <em class="pabs c-i arrowup add_up2"></em>
             <i class="pabs add_close strong fontb eye-protector-processed" g-area-close=""
            >╳</i>
             <div class="gCity eye-protector-processed">
             <div area-title class="gctSelect clearfix eye-protector-processed">
             <a href="javascript:;" area-title-province data-val="1" data-lnk="">
             <b>北京1</b>
             <i></i>
             </a>
             <a href="javascript:;" area-title-city data-val="2" data-lnk="">
             <b>北京市1</b>
             <i></i>
             </a>
             <a href="javascript:;" area-title-district data-val="3" data-lnk="">
             <b>朝阳区1</b>
             <i></i>
             </a>
             <a href="javascript:;" area-title-store data-val="4" data-lnk="" class="cur">
             <b>门店1</b>
             <i></i>
             </a>
             <a href="javascript:;" id="cityClose" class="close"></a>
             </div>
             <div id="area-box">
             <div class="gctBox eye-protector-processed area-box-box" data-type="district" area-box-item area-box-district ></div>
             <div class="gctBox eye-protector-processed area-box-box" data-type="store" area-box-item area-box-store ></div>
             </div>
             </div>
     </div>
             */});

     window.cStore_template = html;
})(window);