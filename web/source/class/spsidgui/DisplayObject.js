qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.container.Composite,

     construct : function(objID, attr) {

         this.initObjectID(objID);
         if( attr != undefined ) {
             this.setAttrCache(attr);
         }
         
         var layout = new qx.ui.layout.Grid(4, 0);
         layout.setColumnMinWidth(0, 200);
         layout.setColumnFlex(0, 1);
         layout.setColumnFlex(1, 1);
         
         this.base(arguments, layout);
         this.buildContent();
     },
     
     properties : {
         objectID :  {
             check: "String",
             deferredInit : true
         },
         attrCache : {
             init : null,
             nullable : true,
             check: "Map"
         }         
     },

     events :
     {
         "loaded": "qx.event.type.Data"
     },

     members :
     {
         objectName : function() {
             var attr = this.getAttrCache();
             if( attr == undefined ) {
                 return "";
             }

             var klass = attr['spsid.object.class'];
             var schema = spsidgui.Application.schema[klass];
             
             if( schema != undefined &&
                 schema.display != undefined &&
                 schema.display.name_attr != undefined &&
                 attr[schema.display.name_attr] != undefined ) {
                 
                 return attr[schema.display.name_attr];
             }

             if( attr['spsid.object.container'] == 'NIL' ) {
                 return "Root Object";
             }
             
             return "";
         },

         addControlButtons : function(container) {
             var disp = this;
             
             var refreshButton = new qx.ui.form.Button("Refresh");
             refreshButton.addListener(
                 "execute", function() { disp.refresh() });
             container.add(refreshButton);
         
             var containerButton = new qx.ui.form.Button("Container");
             containerButton.addListener(
                 "execute",
                 function() {
                     var attr = disp.getAttrCache();
                     if( attr != undefined &&
                         attr['spsid.object.container'] != 'NIL' ) {
                         new spsidgui.ObjectWindow(
                             attr['spsid.object.container']);
                     }
                 });
             container.add(containerButton);

             var contentButton = new qx.ui.form.Button("Contents");
             contentButton.addListener(
                 "execute",
                 function() {
                     // TODO
                 });
             container.add(contentButton);
                      
             var editButton = new qx.ui.form.Button("Edit");
             editButton.addListener(
                 "execute",
                 function() {
                     // TODO
                 });
             container.add(editButton);             
         },
         
         buildContent : function() {
             
             this.removeAll();

             var attr = this.getAttrCache();
             if( attr == undefined ) {
                 var rpc = spsidgui.SpsidRPC.getInstance();
                 var myself = this;

                 rpc.get_object(
                     function(result) {
                         myself.setAttrCache(result);
                         myself.buildContent();
                     },
                     this.getObjectID());
                 return;
             }    

             this.fireDataEvent("loaded", this);
                 
             var klass = attr['spsid.object.class'];
             var schema = spsidgui.Application.schema[klass];

             var hide = {'spsid.object.id': 1,
                         'spsid.object.container': 1};
             var hilite = {};

             if( schema != undefined && schema.display != undefined ) {
                 
                 if( schema.display.info_attr != undefined ) {
                     for (var i=0; i< schema.display.info_attr.length; i++) {
                         hilite[schema.display.info_attr[i]] = true;
                     }
                 }

                 if( schema.display.name_attr != undefined ) {
                     hilite[schema.display.name_attr] = true;
                 }
             }
             
             var filtered = new Array;
             for( var attr_name in attr ) {
                 if( ! hide[attr_name] ) {
                     filtered.push(attr_name);
                 }
             }
             
             var sorted = filtered.sort();         
             
             var nRow = 0;
             for( var i=0; i<sorted.length; i++) {
                 this.add(new qx.ui.basic.Label(sorted[i]),
                          {row: nRow, column: 0});
                 var valLabel = new qx.ui.basic.Label(attr[sorted[i]]);
                 if( hilite[sorted[i]] ) {
                     valLabel.set({font: "bold"});
                 }
                 this.add(valLabel, {row: nRow, column: 1});
                 nRow++;
             }             
         },

         refresh : function() {
             this.setAttrCache(null);
             this.buildContent();
         }
     }
 });
                      
             

         

         
