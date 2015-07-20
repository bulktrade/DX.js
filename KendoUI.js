DX.KendoUI = {
    /**
     * Get Kendo UI Grid schema from OrientDB Class schema.
     *
     * @param {Object} orientDBClassSchema
     * @param {Object} defaults
     *
     * @returns {{data: null, total: null, errors: string, model: {id: string, fields: {}}}}
     */
    getSchemaFromOrientDB: function(orientDBClassSchema, defaults) {
        var schema = {
            data: null,
            total: null,
            errors: 'error',
            model: {
                id: '@rid',
                fields: {

                }
            }
        };

        for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
            var item = orientDBClassSchema.properties[i];
            var fieldType = 'string';

            switch (item.type) {
                case 'INTEGER':
                case 'SHORT':
                case 'LONG':
                case 'FLOAT':
                case 'DOUBLE':
                case 'BYTE':
                case 'DECIMAL':
                    fieldType = 'number';
                    break;
                case 'BOOLEAN':
                    fieldType = 'boolean';
                    break;
                case 'DATE':
                case 'DATETIME':
                    fieldType = 'date';
                    break;
            }

            schema.model.fields[item.name] = {
                type: fieldType,
                editable: true,
                validation: {
                    required: item.mandatory
                },
                nullable: !item.notNull
            };

            if (item.min !== null) {
                schema.model.fields[item.name].validation.min = item.min;
            }

            if (item.max !== null) {
                schema.model.fields[item.name].validation.max = item.max;
            }

            if (item.regexp !== null) {
                schema.model.fields[item.name].validation.pattern = item.regexp;
            }

            if (defaults) {
                schema.model.fields[item.name] = DX.mergeObjects(schema.model.fields[item.name], defaults[item.name]);
            }
        }

        return schema;
    },

    /**
     * Get Kendo UI Grid columns from OrientDB Class schema.
     *
     * @param {Object} orientDBClassSchema
     * @param {Object} defaults
     * @param {Array} order
     * @param {Object} $translate
     *
     * @returns {Array}
     */
    getColumnsFromOrientDB: function(orientDBClassSchema, defaults, order, $translate) {
        var columns = [];
        var column;

        for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
            var item = orientDBClassSchema.properties[i];

            column = {
                field: item.name,
                sortable: true,
                filterable: true,
                editable: true,
                title: $translate ? $translate.instant(orientDBClassSchema.name + '.' + item.name) : item.name
            };

            switch (item.type) {
                case 'DATE':
                case 'DATETIME':
                    column.template = function(item) {
                        return kendo.toString(item.created, "G");
                    };

                    column.filterable = {
                        ui: "datetimepicker" // use Kendo UI DateTimePicker
                    };

                    column.editor = function(container, options) {
                        container.prev().hide();
                        container.hide();
                    };

                    break;
            }

            if (defaults) {
                column = DX.mergeObjects(column, defaults[item.name]);
            }

            columns.push(column);
        }

        column = {
            field: 'commands',
            width: 90,
            title: '&nbsp;',
            filterable: false,
            attributes: {
                style: 'text-align: center; white-space: nowrap;'
            },
            template: function() {
                var result = '';

                result += '<div class="k-grid-edit btn btn-sm btn-primary" ng-click="editActionClick($event)"><i class="fa fa-pencil-square-o"></i></div>';
                result += '&nbsp;'
                result += '<div class="k-grid-destroy btn btn-sm btn-danger" ng-click="destroyActionClick($event)"><i class="fa fa-trash-o"></i></div>';

                return result;
            },
            editable: true,
            editor: function(container, options) {
                container.prev().hide();
                container.hide();
            }
        };

        if (defaults) {
            column = DX.mergeObjects(column, defaults['commands']);
        }

        columns.push(column);

        if (order) {
            var tmp = columns;
            columns = [];

            for (var i = 0; i < order.length; i++) {
                for (var j = 0; j < tmp.length; j++) {
                    if (tmp[j].field == order[i]) {
                        columns.push(tmp[j]);
                        break;
                    }
                }
            }
        }

        return columns;
    }
};