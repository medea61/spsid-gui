qx.Class.define
("spsidgui.ObjectList",
 {
     extend : qx.ui.container.Scroll,
     
     construct : function() {

         this.base(arguments);
         
         this.contentWidget =
             new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
         this.add(this.contentWidget);
         this.set({decorator: "inset"});
     },

     properties : {
         objectList :  {
             check: "Array",
             nullable : true,
             apply : "_applyObjectList"
         }         
     },
     
     members :
     {
         contentWidget : null,
         
         _applyObjectList : function (list) {

             this.contentWidget.removeAll();
             
             if( list != undefined ) {
                 for (var i=0; i < list.length; i++) {
                     this._addObject(list[i]);
                 }                                      
             }
         },

         _addObject : function (attr) {

             var disp =
                 new spsidgui.DisplayObject(attr['spsid.object.id'], attr);
             
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(0));
             
             var buttonsRow =
                 new qx.ui.container.Composite(new qx.ui.layout.HBox(4));
             buttonsRow.set({backgroundColor: "#e6e6e6", padding: 4});
             
             var name_label = new qx.ui.basic.Label();
             name_label.set({decorator: "popup",
                             font: "bold",
                             textAlign: "center",
                             minWidth: 200});
             name_label.setValue(disp.objectName());
             buttonsRow.add(name_label);
             buttonsRow.add(new qx.ui.core.Spacer(30));
             
             var popupButton = new qx.ui.form.Button("Popup");
             buttonsRow.add(popupButton);
             popupButton.addListener("execute", function(e) {
                 new spsidgui.ObjectWindow(attr['spsid.object.id'])});

             disp.addControlButtons(buttonsRow);
             
             box.add(buttonsRow);             
             box.add(disp);
             this.contentWidget.add(box);
         }
     }
 }
);




