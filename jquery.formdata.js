(function($) {
    $.formData = function(el, options) {
      var init = function(elem) {
        // flash stuff
      };

      var submit = function() {
        var $elem = $(this);
        var data = new FormData(this);
        var url = $elem.attr("action");
        var type = $elem.attr("method");
        console.log($elem);
        var xhr = new XMLHttpRequest();
        xhr.open(type, url);
        xhr.send(data);
        return false;
      };

      init(el);
      $(el).submit(submit);
    };

    $.formData.defaultOptions = {};

    $.fn.formData = function(options) {
      return this.each(function() {
          ($.formData(this, options));
      });
    };
})(jQuery);

/*
$(document).ready(function(){
    var f = $("form");
    f.formData();
});
*/
