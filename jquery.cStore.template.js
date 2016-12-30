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
     <i class="pabs add_close strong fontb  " g-area-close=""
     >╳</i>
     <div class="gCity  ">
     <div area-title="" class="gctSelect clearfix  ">
     <a href="javascript:;" id="cityClose" class="close"></a>
     </div>
     <div area-box="">
     </div>
     </div>
     </div>
     */});

    window.cStore_template = html;
})(window);