(function($) {
    var fire = function (el, evName, args){
      $(el).trigger("fd:"+evName, args);
    };

    var getOptions = function(form) {
      var $form = $(form);
      var opts = {
        url: $form.attr("action"),
        origUrl: $form.attr("action"),
        type: $form.attr("method"),
        swf: "/lib/formdata.swf?" + new Date().getTime()
      };
      var opt = $form.data("jquery-formdata-options");
      if (typeof opt !== 'undefined')  {
        opts = $.extend(opts, opt);
      }
      if (opts.format) {
        opts.url = opts.url + "." + opts.format;
      }
      return opts;
    };

    var disableForm = function($form, disable) {
      var its= $form.find("input,select,textarea");
      if (disable) {
        its.attr("disabled", "disabled");
        $form.attr("disabled", "disabled");
      } else {
        its.removeAttr("disabled");
        $form.removeAttr("disabled");
      }
    };

    var overrideFile = function($file, idx, value) {
      var values = $file.data("form-data-override") || {};
      if (typeof value !== 'undefined') {
        values[idx] = value;
        $file.data("form-data-override", values);
        return value;
      } else {
        return values[idx];
      }
    };
    var overrideFileClear = function($file) {
      $file.data("form-data-override", {});
    };

    $.formData = {
      flash: {
        init: function($form) {
          var ret = !!(typeof swfobject !== 'undefined' && swfobject.getFlashPlayerVersion());
          if ( ret ) {
            this.install($form);
            this.observe($form);
          }
          return ret;
        },

        observe: function($form) {
          var self = this;
          $form.submit(function(ev){
              ev.preventDefault();
              self.submit($(this));
          });
        },

        submit: function($form) {
          if ($form.attr("disabled")) {
            return;
          }

          var data = this.multipartBody($form);

          fire($form, "submit", []);
          var o = getOptions($form);
          disableForm($form, true);

          $.ajax({
              url:         o.url,
              data:        data.body,
              processData: false,
              contentType: data.contentType,
              type:        o.type
          }).success(function(data){
              fire($form, "success", [data]);
          }).error(function(xhr){
              fire($form, "error", [xhr]);
          }).complete(function(){
              disableForm($form, false);
              fire($form, "complete", []);
          });
        },

        change: function(flashVars, files) {
          var f = $.map(files, function(it) {
            if (it.type.match(/image/)) {
              it.image = "data:" + it.type + ";" + "base64," + it.file;
            }
            return it;
          });
          var $file = this.getInput(flashVars);
          overrideFileClear($file);
          this.files($file, f);
          fire($file, "change", [f]);
        },

        multipartBody: function($form) {
          var params = $form.serializeArray();
          var body = "";
          var nl = "\r\n";
          var boundary = "--Asrf456BGe4hsrfGe4h--";
          $.each(params, function(){
              body += "--" + boundary + nl;
              body += "Content-Disposition: form-data; name=\"" + this.name +"\"" + nl;
              body += nl + this.value + nl;
          });
          var self = this;
          $("input[type=file]", $form).each(function(){
              var $file = $(this);
              var files = self.files($file);
              var input = this;
              if (files && files.length > 0) {
                $.each(files, function(idx){
                  if (overrideFile($file, idx) !== false) {
                    body += "--" + boundary + nl;
                    body += "Content-Disposition: form-data; name=\"" + $(input).attr("name") + "\";";
                    body += " filename=\"" + "base64:" + this.name + "\"" + nl;
                    body += "Content-Type: " + this.type + nl;
                    body += nl + this.file + nl;
                  }
                });
              }
          });
          body += "--" + boundary + "--";
          return {contentType:"multipart/form-data, boundary="+boundary, body:body};
        },

        install: function($form) {
          var files = $("input[type=file]", $form);
          var self = this;
          $.each(files, function(){
              self.createFlash($(this), $form);
          });
        },

        getButton: function($file) {
          var button = $file.next("button.jquery-formdata-button");
          if (button.size() === 0) {
            var label = "Select File";
            $("<button class=\"jquery-formdata-button btn\">" + label + "</button>").insertAfter($file);
            button = $file.next("button.jquery-formdata-button");
          }
          return button;
        },

        getFlash: function($file) {
          return $("#" + this.flashId($file));
        },

        flashId: function($file) {
          var fid = $file.data("flash-id");
          if (!fid) {
            fid = $file.attr("name").replace(/[^a-zA-Z0-9-_]/g, '-').replace(/\-+$/, '') + "-jquery-formdata-flash-" + new Date().getTime();
            $file.data("flash-id", fid);
          }
          return fid;
        },

        getInput: function(flashVars) {
          var form = $("form[action='" + flashVars.form + "']");
          return $("input[name='"+ flashVars.id + "']", form);
        },

        createFlash: function($file, $form) {
          var fId = this.flashId($file);
          var o   = getOptions($form);
          var flashVars = {
            action:      o.url,
            form:        o.origUrl,
            id:          $file.attr("name"),
            flashId:     fId,
            type:        $form.attr("method"),
            multiple:    $file.attr("multiple"),
            change:      "jQuery.formData.flash.change",
            accept:      $file.attr("accept")
          };
          var flashParams = {
            quality:           "high",
            bgcolor:           "#ffffff",
            allowscriptaccess: "someDomain",
            allowfullscreen:   "false",
            wmode:             "transparent"
          };
          var flashAttributes = {
            id:   fId,
            name: fId
          };
          var self = this;

          $("<div id=\"" + fId +  "\"></div>").appendTo($form);

          swfobject.embedSWF(o.swf || "formdata.swf",
            fId, "10px", "10px", "10.2.0", null,
            flashVars, flashParams, flashAttributes,
            function(e){
              if(e.success) {
                self.createButton($file);
              }
          });
        },

        createButton: function($file) {
          var flash  = this.getFlash($file);
          flash.css("position", "absolute").width($file.outerWidth()).height($file.outerHeight());
          flash.offset($file.offset());
        },

        files: function($file, files) {
          return $file.data("jquery-formdata-files", files);
        }
      },

      html5: {
        init: function($el) {
          var ret = !!(window.FormData && window.FileReader);
          if (ret) {
            this.observe($el);
          }
          return ret;
        },

        observe: function($form) {
          (function(self){
              $form.submit(function(ev){
                  ev.preventDefault();
                  self.submit($(this));
              });
              $("input[type=file]", $form).change(function(ev){
                  self.change($(this));
              });
          })(this);
        },

        change: function($file) {
          var result = [];
          var states = [];
          overrideFileClear($file);
          $.each($file[0].files, function(index){
              var idx = result.push({
                  name:this.name,type:this.type,size:this.size
              }) - 1;
              if (this.type.match(/image\//)) {
                var dIdx = states.push($.Deferred()) - 1;
                var reader = new window.FileReader();
                reader.onload = (function(f, i, di){
                    return function(ev){
                      result[i].image = ev.target.result;
                      states[di].resolve();
                    };
                })(this, idx, dIdx);
                reader.readAsDataURL(this);
              }
          });
          $.when.apply(null, states).done(function(){
              fire($file, "change", [result]);
          });
        },

        submit: function($form) {
          if ($form.attr("disabled")) {
            return;
          }

          fire($form, "submit", []);
          $("progress", $form).show();
          var o = getOptions($form);
          var d = this.getData($form);
          disableForm($form, true);

          $.ajax({
              url:         o.url,
              data:        d,
              processData: false,
              contentType: false,
              type:        o.type,
              xhr:         this.getXhrProvider($form)
          }).success(function(data){
              fire($form, "success", [data]);
          }).error(function(xhr){
              fire($form, "error", [xhr]);
          }).complete(function(){
              disableForm($form, false);
              $("progress", $form).hide();
              fire($form, "complete", []);
          });
        },

        getData: function($form) {
          var fd = new window.FormData();
          $.each($form.serializeArray(), function(){
              fd.append(this.name, this.value);
          });
          $("input[type=file]", $form).each(function(){
              var $file = $(this);
              var name = $file.attr("name");
              $.each(this.files, function(idx){
                  if (overrideFile($file, idx) !== false) {
                    fd.append(name, this);
                  }
              });
          });
          return fd;
        },

        getXhrProvider: function($form){
          var xhr = $.ajaxSettings.xhr();
          if(xhr.upload) {
            xhr.upload.addEventListener('progress',
              function(ev) {
                var pr = $("progress", $form);
                var val = (ev.loaded / ev.total) * 100;
                if (pr.size() > 0) {
                  pr.val(val);
                }
                fire($form, "progress", [val]);
            });
          }
          return function(){ return xhr; };
        }
      },

      replace: function(file, idx, value) {
        overrideFile($(file), idx, value);
      },

      init: function($el, opts) {
        $el.data("jquery-formdata-options", opts || {});
        if (!$el.data("jquery-formdata-loaded")) {
          this.html5.init($el) ||
            this.flash.init($el);
          $el.data("jquery-formdata-loaded", 1);
        }
      },

      defaultOptions: {}
    };

    $.fn.formData = function(opts, a, b, c) {
      this.each(function(){
          if (opts === "replace") {
            $.formData.replace($(this), a, b);
          } else {
            $.formData.init($(this), opts);
          }
      });
      return this;
    };

})(jQuery);

/*
 $(document).ready(function(){
     var f = $("form");
     f.formData().success(..).error(...).complete(...).progress(...);
 });
 */
