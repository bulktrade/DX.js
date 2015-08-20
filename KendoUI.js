DX.KendoUI = {
    Grid: {
        defaultHeight: 500,
        defaultPageSize: 20,
        defaultFilterableMode: 'menu, row',
        defaultSortableMode: 'multiple',
        defaultDetailTemplate: '',
        defaultPopupWindowCreateTitle: 'Grid.PopUp.Create.Title',
        defaultPopupWindowUpdateTitle: 'Grid.PopUp.Update.Title',
        defaultPopupWindowCreateButton: 'Grid.PopUp.Create.Button',
        defaultPopupWindowUpdateButton: 'Grid.PopUp.Update.Button',
        defaultPopupWindowCancelButton: 'Grid.PopUp.Cancel.Button',
        defaultEditFunction: function(e) {
            var popupWindow = e.container.data("kendoWindow");

            if (!e.model.get('id')) {
                popupWindow.title(this.defaultPopupWindowCreateTitle);
            } else {
                popupWindow.title(this.defaultPopupWindowUpdateTitle);
            }

            popupWindow.element.find(".k-grid-update").
                removeClass('k-button').
                removeClass('k-button-icontext').
                removeClass('k-primary').
                addClass('btn btn-sm btn-success').
                html("<i class=\"fa fa-check\"></i> " + (!e.model.get('id') ? this.defaultPopupWindowCreateButton : this.defaultPopupWindowUpdateButton));

            popupWindow.element.find(".k-grid-cancel").
                removeClass('k-button').
                removeClass('k-button-icontext').
                addClass('btn btn-sm btn-danger').
                html("<i class=\"fa fa-times\"></i> " + this.defaultPopupWindowCancelButton);
        }
    }
};