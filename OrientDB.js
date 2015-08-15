DX.OrientDB = {
    KendoUI: {
        /**
         *
         * @param $orientDBService
         * @param model
         * @param successFunction
         * @param errorFunction
         * @returns {*}
         * @constructor
         */
        GridByModel: function($orientDBService, model, successFunction, errorFunction) {
            return this.Grid($orientDBService, model.className, model.options, successFunction, errorFunction);
        },
        /**
         *
         * @param $orientDBService
         * @param className
         * @param options
         * @param successFunction
         * @param errorFunction
         * @constructor
         */
        Grid: function($orientDBService, className, options, successFunction, errorFunction) {
            var instance = this;

            $orientDBService.schema(className,
                function(orientDBClassSchema, status, headers, config) {
                    /**
                     * Get Kendo UI Grid columns from OrientDB Class schema.
                     *
                     * @param {Object} columns
                     * @param {Object} $translate
                     *
                     * @returns {Array}
                     */
                    instance.getColumns = function(columns, $translate) {
                        var result = [];
                        var column;

                        for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                            var item = orientDBClassSchema.properties[i];

                            if (typeof columns[item.name] != 'undefined') { // only defined columns
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
                                    column = DX.mergeObjects(column, columns[item.name]);
                                }

                                result.push(column);
                            }
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

                        result.push(column);

                        if (selectColumns) {
                            var tmp = result;
                            result = [];

                            for (var i = 0; i < selectColumns.length; i++) {
                                for (var j = 0; j < tmp.length; j++) {
                                    if (tmp[j].field == selectColumns[i]) {
                                        result.push(tmp[j]);
                                        break;
                                    }
                                }
                            }
                        }

                        return result;
                    };

                    /**
                     * Get Kendo UI Grid schema from OrientDB Class schema.
                     *
                     * @param {Object}|null defaults
                     *
                     * @returns {{data: null, total: null, errors: string, model: {id: string, fields: {}}}}
                     */
                    instance.getSchema = function(defaults) {
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
                    };

                    /**
                     * Get Kendo UI Grid Data Source.
                     *
                     * @param className
                     * @param defaults
                     * @returns {kendo.data.DataSource}
                     */
                    instance.getDataSource = function(className, defaults) {
                        var columns = [];

                        var options = {
                            transport: {
                                read: function(options) {
                                    var query = DX.sprintf('SELECT %s FROM %s', columns, className);

                                    if (options.take) {
                                        query.skip();
                                    }

                                    $orientDBService.query(
                                        query,
                                        options.take ? options.take : this.defaultPageSize,
                                        '*',
                                        function(result) {
                                            options.success(result);
                                        },
                                        function (result) {
                                            options.error(result);
                                        });

                                    //beforeSend: function (req) {
                                    //    req.setRequestHeader('Authorization', $http.defaults.headers.common.Authorization);
                                    //}
                                    // options.success(result);
                                    // options.error(result);
                                },
                                update: function(options) {

                                },
                                destroy: function(options) {

                                },
                                create: function(options) {

                                },
                                parameterMap: function(options, operation) {
                                    //if (operation !== "read" && options.models) {
                                    //    return kendo.stringify(options.models);
                                    //} else {
                                    //    options.sort = kendo.stringify(options.sort);
                                    //    options.filter = kendo.stringify(options.filter);
                                    //    --options.page;
                                    //
                                    //    return options;
                                    //}

                                    return options;
                                }
                            },
                            serverSorting: true,
                            batch: true,
                            pageSize: 20,
                            serverPaging: true,
                            serverFiltering: true,
                            autoSync: false,
                            schema: instance.getSchema(options.schemaDefaults)
                        };

                        return new kendo.data.DataSource(
                            DX.mergeObjects(options, defaults)
                        );
                    };

                    /**
                     * Get grid options by OrientDB class schema.
                     *
                     * @param className
                     * @param options
                     * @param successFunction
                     * @param errorFunction
                     *
                     * @returns {null|Object}
                     */
                    instance.getGridOptions = function(className, options, successFunction, errorFunction) {
                        if (!options) {
                            options = {
                                columnDefaults: null,
                                columnOrder: null,
                                schemaDefaults: null,
                                dataSourceOptions: null,
                                translate: null,
                                defaults: null
                            };
                        }

                        var grid = {
                            dataSource: instance.getDataSource(className, options.dataSourceOptions),
                            height: DX.KendoUI.Grid.defaultHeight,
                            pageable: {
                                refresh: true,
                                pageSizes: true,
                                buttonCount: DX.KendoUI.Grid.defaultPageSize
                            },
                            filterable: {
                                mode: DX.KendoUI.Grid.defaultFilterableMode,
                                extra: false
                            },
                            sortable: {
                                mode: DX.KendoUI.Grid.defaultSortableMode,
                                allowUnsort: true
                            },
                            detailInit: null,
                            detailTemplate: DX.KendoUI.Grid.defaultDetailTemplate,
                            detailExpand: null,
                            dataBound: null,
                            edit: DX.KendoUI.Grid.defaultEditFunction,
                            editable: 'popup',
                            columns: DX.OrientDB.getKendoUIGridColumns(
                                instance.getSchema(orientDBClassSchema, options.schemaDefaults),
                                options.columnDefaults,
                                options.columnOrder,
                                options.translate
                            )
                        };

                        successFunction(grid);

                        return DX.mergeObjects(grid, options.defaults);
                    };

                    successFunction(instance);
                },
                function(data, status, headers, config) {
                    errorFunction({
                        data: data,
                        status: status,
                        headers: headers,
                        config: config
                    });
                });
        }
    }
};