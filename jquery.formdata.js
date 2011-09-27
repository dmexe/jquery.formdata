(function($) {
    $.formData = {
      NativeImagePreview: {
        init: function($el) {
          if (window.FileReader) {
            var self = this;
            $el.find("input[type=file]").change(function(ev){
              self.onChange(this);
            });
          }
          return (!!window.FileReader);
        },
        onChange: function(el){
          var $el = $(el);
          var id = $el.attr("id");
          var boxId = id + "_image_preview";
          var images = $.grep(el.files, function(i){
              return i.type.match(/image/);
          });
          if ($("#" + boxId).size() === 0) {
            $("<div id=\"" + boxId + "\" />").insertAfter($el);
          }
          var box = $("#"+ boxId);
          box.html("");
          this.append(box.get(0), images);
        },
        append: function(box, images) {
          $.each(images, function(){
            var reader = new window.FileReader();
            var f = this;
            reader.onload = (function(ev){
              var img = document.createElement("img");
              img.src = ev.target.result;
              box.appendChild(img);
            });
            reader.readAsDataURL(f);
          });
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

      NativeFormData: {
        init: function($el) {
          if (window.FormData) {
            var self = this;
            $el.submit(function(ev){
              ev.preventDefault();
              self.onSubmit(this);
            });
          }
          return !!window.FormData;
        },

        append: function(fd, $form) {
          $form.find("input,select,textarea").each(function(){
            if(this.type === "file" && this.files) {
              var f = this;
              $.each(this.files, function(){
                fd.append(f.name, this);
              });
            } else {
              fd.append(this.name, this.value);
            }
          });
        },

        onSubmit: function(form) {
          var $form = $(form);
          if ($form.attr("disabled")) {
            return;
          }
          var options = $.formData.options(form);
          var fd = new window.FormData();
          var d = options.deferred;

          this.append(fd, $form);

          var xhr_provider = function() {
            var xhr = $.ajaxSettings.xhr();
            if(xhr.upload) {
              xhr.upload.addEventListener('progress', function(ev){
                d.list.progress.fireWith(ev, [(ev.loaded / ev.total) * 100]);
              }, false);
            }
            return xhr;
          };

          $.formData.disableForm($form, true);
          $.ajax({
              url:options.url,
              data:fd,
              processData:false,
              contentType:false,
              type:options.type,
              xhr: xhr_provider
          }).success(function(){
              d.list.success.fireWith(this, arguments);
          }).error(function(){
              d.list.error.fireWith(this, arguments);
          }).complete(function(){
              $.formData.disableForm($(form), false);
              d.list.complete.fireWith(this, arguments);
          });
        }
      },

      options: function(form) {
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

      init: function(el, options) {
        $el = $(el);
        callbacks = $el.data("jquery.formdata.callbacks");
        if (typeof callbacks === 'undefined') {
          callbacks = new this.Callbacks();
          $el.data("jquery.formdata.callbacks", callbacks);
          this.NativeFormData.init($el);
          this.NativeImagePreview.init($el);
        }
        if (typeof options === 'object') {
          $(el).data("jquery.formdata.options", options);
        }
        return callbacks;
      },

      defaultOptions: {},
      disableForm: function($form, disable) {
        var its= $form.find("input,select,textarea");
        if (disable) {
          its.attr("disabled", "disabled");
          $form.attr("disabled", "disabled");
        } else {
          its.removeAttr("disabled");
          $form.removeAttr("disabled");
        }
      }
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
