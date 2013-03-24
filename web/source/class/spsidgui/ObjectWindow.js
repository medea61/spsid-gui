qx.Class.define
("spsidgui.ObjectWindow",
 {
     extend : spsidgui.AppWindow,

     construct : function(objID) {
         this.initObjectID(objID);
         this.base(arguments);
         
         this.addListener('close', function(e) {
             var objID = this.getObjectID();
             delete spsidgui.ObjectWindow._instances[objID];
             this.destroy();
         }, this);
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         }
     },

     statics :
     {
         _instances : {},
         
         openInstance : function(objID) {
             if( ! this._instances[objID] ) {
                 var w = new spsidgui.ObjectWindow(objID);
                 this._instances[objID] = w;
             }
             else {
                 this._instances[objID].open();
             }
             return(this._instances[objID]);
         }
     },

     members :
     {
         initWindow : function() {
             this.setShowStatusbar(false);
             this.setWidth(500);
             this.setHeight(300);
         },
         
         initContent : function() {
             
             var objID = this.getObjectID();
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(0));
             
             var buttonsRow =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             buttonsRow.set({backgroundColor: "#e6e6e6", padding: 4});

             var disp = new spsidgui.DisplayObject(objID);
             disp.addControlButtons(buttonsRow);

             var obj = spsidgui.SpsidObject.getInstance(objID);
             if( obj.getReady() ) {
                 this._initCaption(obj);
             }
             
             var win = this;
             obj.addListener(
                 "loaded",
                 function(e) { win._initCaption(e.getTarget()) });
             
             box.add(buttonsRow);             
             box.add(disp);
             this.add(box);
         },
         
         _initCaption: function(obj) {
             this.setCaption(obj.getObjectName() + ' -- ' +
                             obj.getAttr('spsid.object.class'));
         }
     }
 });

