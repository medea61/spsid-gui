qx.Class.define
("spsidgui.ObjectList",
 {
     extend : qx.ui.container.Composite, 
     
     construct : function() {

         this.base(arguments);

         this.setLayout(new qx.ui.layout.VBox(5));

         this.scroll = new qx.ui.container.Scroll();
         this.contentWidget =
             new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
         this.scroll.add(this.contentWidget);

         this.add(this.scroll, {flex : 1});
     },

     properties : {
         objectList :  {
             check: "Array",
             nullable : true
         },

         pageSize : {
             check : "Integer",
             init : 10
         }
     },
     
     members :
     {
         paginationBar : null,
         paginationLabel : null,
         scroll : null,
         contentWidget : null,

         pagination : null,
         paginationStart : null,
         paginationEnd : null,

         setAttrList : function (list) {

             var objList = new Array;
             for (var i=0; i < list.length; i++) {
                 var attr = list[i];
                 objList.push(
                     spsidgui.SpsidObject.getInstance(
                         attr['spsid.object.id'], attr));
             }

             objList.sort(function(a,b) {
                 return(a.getObjectName().localeCompare(b.getObjectName()));
             });

             if( list.length > this.getPageSize() )
             {
                 this.pagination = true;
                 this.paginationStart = 0;
                 this.paginationEnd = this.getPageSize();
                 this._addPaginationBar();
             }
             else
             {
                 this.pagination = false;
                 this._removePaginationBar();
             }

             this.setObjectList(objList);
             this.refresh();
         },
         
         refresh : function () {
             var removed = this.contentWidget.removeAll();
             for(var i=0; i<removed.length; i++) {
                 removed[i].dispose();
             }

             var list = this.getObjectList();
             
             if( list != undefined ) {
                 if( this.pagination )
                 {
                     for (var i=this.paginationStart;
                          i < this.paginationEnd; i++)
                     {
                         this._addObject(list[i]);
                     }

                     this.paginationLabel.setValue(
                         "Showing objects " + (this.paginationStart+1) +
                             " to " + (this.paginationEnd) +
                             " out of " + list.length);
                 }
                 else
                 {
                     for (var i=0; i < list.length; i++)
                     {
                         this._addObject(list[i]);
                     }
                 }                                      
             }
         },

         _addObject : function (obj) {

             var objID = obj.getObjectID();
             var disp = new spsidgui.DisplayObject(objID);
             
             var box = new qx.ui.container.Composite(new qx.ui.layout.VBox(0));
             box.set({appearance: "object-list-item"});

             var buttonsRow = spsidgui.Application.buttonRow();
             
             var name_label = new qx.ui.basic.Label();
             name_label.set({appearance: "object-list-item-label",
                             selectable: true});
             disp.setNameLabel(name_label);            
             
             buttonsRow.add(name_label);
             buttonsRow.add(new qx.ui.core.Spacer(30));
             
             var popupButton = new qx.ui.form.Button("Popup");
             popupButton.setUserData("objID", objID);
             popupButton.addListener(
                 "execute", function(e) {
                     var oid = e.getTarget().getUserData("objID");
                     spsidgui.ObjectWindow.openInstance(oid);
                 });
             buttonsRow.add(popupButton);
             
             disp.addControlButtons(buttonsRow);
             disp.setDestroyOnObjectDelete(box);
             disp.buildContent();
             
             box.add(buttonsRow);             
             box.add(disp);
             this.contentWidget.add(box);
         },

         _addPaginationBar : function() {
             if( this.paginationBar ) {
                 return;
             }
                 
             var buttonsRow = spsidgui.Application.buttonRow();

             var label = this.paginationLabel = new qx.ui.basic.Label();
             buttonsRow.add(label);

             var prevButton = new qx.ui.form.Button("<<");
             prevButton.setUserData("ObjectList", this);
             prevButton.addListener(
                 "execute", function(e) {
                     var target = e.getTarget().getUserData("ObjectList");
                     var pagesize = target.getPageSize();
                     var arraylen = target.getObjectList().length;
                     target.paginationStart -= pagesize;
                     if( target.paginationStart < 0 ) {
                         target.paginationStart = 0;
                     }
                     target.paginationEnd = target.paginationStart + pagesize;
                     target.refresh();
                 });
             buttonsRow.add(prevButton);
             
             var nextButton = new qx.ui.form.Button(">>");
             nextButton.setUserData("ObjectList", this);
             nextButton.addListener(
                 "execute", function(e) {
                     var target = e.getTarget().getUserData("ObjectList");
                     var pagesize = target.getPageSize();
                     var arraylen = target.getObjectList().length;
                     if( target.paginationEnd < arraylen ) {
                         target.paginationStart = target.paginationEnd;
                     }
                     target.paginationEnd += pagesize;
                     if( target.paginationEnd > arraylen ) {
                         target.paginationEnd = arraylen;
                     }
                     target.refresh();
                 });
             buttonsRow.add(nextButton);

             this.paginationBar = buttonsRow;             
             this.addAt(buttonsRow, 0);
         },

         _removePaginationBar : function() {
             if( this.paginationBar ) {
                 this.paginationLabel = null;
                 this.paginationBar = null;
                 this.removeAt(0);
             }
         }
     }
 }
);




