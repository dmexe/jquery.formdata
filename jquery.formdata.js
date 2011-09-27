(function($) {
    $.formData = {
      nativeSubmit: function(form) {
        var options = this.formOptions(form);
        var fd = new FormData(form);
        var d = options.deferred;

        var xhr_provider = function() {
          var xhr = $.ajaxSettings.xhr();
          if(xhr.upload) {
            xhr.upload.addEventListener('progress', function(ev){
              d.list.progress.fireWith(ev, [(ev.loaded / ev.total) * 100]);
            }, false);
          }
          return xhr;
        };

        $.ajax({
            url:options.url,
            data:fd,
            processData:false,
            type:options.type,
            xhr: xhr_provider,
            xhrFields: {
              setRequestHeader:['Content-Type', '']
            }
        }).success(function(){
            d.list.success.fireWith(this, arguments);
        }).error(function(){
            d.list.error.fireWith(this, arguments);
        }).complete(function(){
            d.list.complete.fireWith(this, arguments);
        });
      },

      formOptions: function(form) {
        $form = $(form);
        options = {
          url: $form.attr("action"),
          type: $form.attr("method"),
          deferred: $form.data("jquery.formdata.callbacks")
        };
        var opt = $form.data("jquery.formdata.options");
        if (typeof opt !== 'undefined')  {
          $.extend(options, opt);
        }
        if (options.urlFormat) {
          options.url = options.url + "." + options.urlFormat;
        }
        return options;
      },

      setupSubmit: function($el) {
        if (typeof FormData !== 'undefined') {
          var self = this;
          $el.submit(function(ev){
            ev.preventDefault();
            self.nativeSubmit(this);
          });
        } else {
          console.log("jquery.formdata: FormData not supported!");
        }
      },

      Callbacks: function() {
        this.list = {
          success: $.Callbacks("memory"),
          error: $.Callbacks("memory"),
          complete: $.Callbacks("memory"),
          progress: $.Callbacks("memory")
        };
        this.success = this.list.success.add;
        this.error = this.list.error.add;
        this.complete = this.list.complete.add;
        this.progress = this.list.progress.add;
        return this;
      },

      init: function(el, options) {
        $el = $(el);
        callbacks = $el.data("jquery.formdata.callbacks");
        if (typeof callbacks === 'undefined') {
          callbacks = new this.Callbacks();
          $el.data("jquery.formdata.callbacks", callbacks);
          this.setupSubmit($el);
        }
        if (typeof options === 'object') {
          $(el).data("jquery.formdata.options", options);
        }
        return callbacks;
      },

      defaultOptions: {}
    };

    $.fn.formData = function(options) {
      return ($.formData.init(this.get(0), options));
    };
})(jQuery);

/*
$(document).ready(function(){
    var f = $("form");
    f.formData().success(..).error(...).complete(...).progress(...);
});
*/
