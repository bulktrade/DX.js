DX.Grid.KendoUI = {
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
    Widgets: {
        imageCropUploader: function(image, container, options, onAvatarImageChange, $translate, $compile, $scope, $) {
            $scope.croppedImage = image;

            $scope.onAvatarImageChange = onAvatarImageChange;
            angular.element(container).append($compile('<img ng-src="{{croppedImage}}" width="39" height="39" alt="avatar">')($scope));

            $('<input name="croppedImage" id="croppedImage" type="file"/>')
                .appendTo(container)
                .kendoUpload({
                    showFileList: false,
                    multiple: false,
                    select: function(e) {
                        $.each(e.files, function (index, file) {
                            if (file.extension !== '.jpg' && file.extension !== '.png' && file.extension !== '.gif') {
                                e.preventDefault();
                                alert($translate.instant('Users.fields.avatar.wrongTypeError'));
                                return;
                            }

                            var reader = new FileReader();
                            reader.onload = function(e) {
                                $scope.cropAvatar = e.target.result;
                                angular.element(container).find('#cropAvatarArea').remove();
                                angular.element(container).append($compile('<div style="background: #E4E4E4; overflow: hidden; width: 238px; height: 238px;" id="cropAvatarArea"><img-crop image="cropAvatar" result-image-quality="1.0" on-change="onAvatarImageChange($dataURI)" area-min-size="39" change-on-fly="true" area-type="square" result-image-size="39" result-image-format="image/png" result-image="croppedImage"></img-crop></div>')($scope));
                            };

                            reader.readAsDataURL(file.rawFile);
                        });
                    }
                });
        }
    },
    /**
     *
     * @param $orientDBService
     * @param model
     * @param successFunction
     * @param errorFunction
     * @returns {*}
     * @constructor
     */
    OrientDBGridByModel: function($orientDBService, model, successFunction, errorFunction) {
        return this.Grid(
            DX.Grid.Adapter.OrientDB,
            $orientDBService,
            model.className,
            model.options,
            successFunction,
            errorFunction
        );
    },
    /**
     *
     * @param adapter
     * @param $orientDBService
     * @param className
     * @param options
     * @param successFunction
     * @param errorFunction
     * @constructor
     */
    Grid: function(adapter, $orientDBService, className, options, successFunction, errorFunction) {
        return new adapter($orientDBService, className, options, successFunction, errorFunction);
    }
};