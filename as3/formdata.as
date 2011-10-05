package {
  import com.adobe.net.MimeTypeMap;

  import flash.display.Sprite;
  import flash.events.Event;
  import flash.events.MouseEvent;
  import flash.external.ExternalInterface;
  import flash.net.FileFilter;
  import flash.net.FileReference;
  import flash.net.FileReferenceList;

  import mx.utils.Base64Decoder;
  import mx.utils.Base64Encoder;

  public class formdata extends Sprite {

    private var options:Object = {};
    private var files:Array = [];
    private var fileRef:FileReference;
    private var fileRefList:FileReferenceList;
    private var fileRefListCount:Number;
    private var square:Sprite;

    public function formdata() {
      createButton();
      loadOptions();
      addCallbacks();
    }

    private function loadOptions():void {
      options["action"]   = loaderInfo.parameters["action"];
      options["id"]       = loaderInfo.parameters["id"];
      options["type"]     = loaderInfo.parameters["type"];
      options["multiple"] = loaderInfo.parameters["multiple"];
      options["change"]   = loaderInfo.parameters["change"];
      options["form"]     = loaderInfo.parameters["form"];
      options["accept"]   = loaderInfo.parameters["accept"];
    }

    private function createButton():void {
      square = new Sprite();
      square.buttonMode = true;
      square.graphics.beginFill(0x0000FF, 0.0);
      square.graphics.drawRect(0,0,10000,10000);
      square.graphics.endFill();
      addChild(square);
    }

    private function addCallbacks():void {
      if(ExternalInterface.available) {
      }
      if (this.options["multiple"] && this.options["multiple"] != "undefined") {
        square.addEventListener(MouseEvent.CLICK, browseFileList);
      }
      else {
        square.addEventListener(MouseEvent.CLICK, browseFile);
      }
    }

    private function getFileFilter():Array {
      var rs:Array;
      if (options["accept"] && options["accept"] != "undefined" && options["accept"] == "image/*") {
        rs = [new FileFilter("Images", "*.jpeg;*.jpg;*.png;*.gif")];
      } else {
		    rs = null;
	    }
      return rs;
    }

    private function browseFile(ev:Event):void {
      this.files = [];
      this.fileRefListCount = 0;
      fileRef = new FileReference();
      fileRef.addEventListener(Event.SELECT, selectFile);
      fileRef.addEventListener(Event.CANCEL, cancelBrowse);
      fileRef.browse(getFileFilter());
    }

    private function browseFileList(ev:Event):void {
      this.files = [];
      this.fileRefListCount = 0;
      fileRefList = new FileReferenceList();
      fileRefList.addEventListener(Event.SELECT, selectFileList);
      fileRefList.addEventListener(Event.CANCEL, cancelBrowseList);
      fileRefList.browse(getFileFilter());
    }

    private function selectFile(ev:Event):void {
      var file:FileReference = ev.target as FileReference;
      this.fileRefListCount = 1;

      cancelBrowse(ev);
      file.addEventListener(Event.COMPLETE, completeFile);
      file.load();
    }

    private function selectFileList(ev:Event):void {
      var file:FileReference;
      var fRef:FileReferenceList = ev.target as FileReferenceList;
      this.fileRefListCount = fRef.fileList.length;

      cancelBrowseList(ev);
      for (var i:uint = 0; i < fRef.fileList.length; i++) {
        file = fRef.fileList[i];
        file.addEventListener(Event.COMPLETE, completeFile);
        file.load();
      }
    }

    private function completeFile(ev:Event):void {
      var fRef:FileReference    = ev.target as FileReference;
      var mime:String           = new MimeTypeMap().getMimeTypeOfFIle(fRef.name);
      var encoder:Base64Encoder = new Base64Encoder();

      encoder.encodeBytes(fRef.data);

      this.files.push({
        name: fRef.name,
        type: mime,
        size: fRef.size,
        file: encoder.toString()
      });

      this.fileRefListCount -= 1;
      if (this.fileRefListCount == 0) {
        this.filesDone();
      }
    }

    private function filesDone():void {
      if (this.options["change"]) {
        ExternalInterface.call(this.options["change"], this.options, this.files);
      }
    }

    private function cancelBrowse(ev:Event):void {
      var fRef:FileReference = ev.target as FileReference;
      fRef.removeEventListener(Event.SELECT, completeFile);
      fRef.removeEventListener(Event.CANCEL, cancelBrowse);
    }

    private function cancelBrowseList(ev:Event): void {
      var fRef:FileReferenceList = ev.target as FileReferenceList;
      fRef.removeEventListener(Event.SELECT, selectFileList);
      fRef.removeEventListener(Event.CANCEL, cancelBrowseList);
    }
  }
}
