qx.Class.define
("spsidgui.DisplayObject",
 {
     extend : qx.ui.core.Widget,

     construct : function(attr) {

         this.base(arguments);

         var layout = new qx.ui.layout.Grid(4, 0);
         var grid = new qx.ui.container.Composite(layout);

         var klass = attr['spsid.object.id'];
         var schema = spsidgui.Application.schema[klass];

         var name_label = new qx.ui.basic.Label();
         if( schema.display.name_attr &&
             attr[schema.display.name_attr] ) {
             name_label.setValue(attr[schema.display.name_attr]);
         }

         var nRow = 0;
         grid.add(name_label, {row: nRow++, column: 0, colspan: 2});

         for( var attr_name in attr ) {
             grid.add(new qx.ui.basic.Label(
                 attr_name, {row: nRow, column: 0}));
             grid.add(new qx.ui.basic.Label(
                 attr[attr_name], {row: nRow, column: 1}));
             nRow++;
         }
     }
 });
                      
             

         

         
