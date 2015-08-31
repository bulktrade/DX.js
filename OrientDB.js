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

                        var column = {
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

                        if (columns['commands']) {
                            column = DX.mergeObjects(column, columns['commands']);
                        }

                        result.push(column);

                        for (var columnName in columns) {
                            for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                                var item = orientDBClassSchema.properties[i];

                                if (item.name == columnName) {
                                    column = new (function() {
                                        this.field = item.name;
                                        this.sortable = true;
                                        this.filterable = true;
                                        this.editable = true;
                                        this.sortable = true;
                                        this.title = $translate ? $translate.instant(orientDBClassSchema.name + '.' + item.name) : item.name;

                                        this.set = function(name, value) {
                                            this[name] = value;
                                        };
                                    });

                                    switch (item.type) {
                                        case 'LINKSET':
                                            (function(item, column, $orientDBService, $) {
                                                var editorCallback = new (function() {
                                                    this.callback = null;

                                                    this.exec = function() {
                                                        if (this.callback) {
                                                            this.callback.apply(this, arguments);
                                                        }
                                                    };

                                                    this.set = function(name, value) {
                                                        this[name] = value;
                                                    };
                                                });

                                                column.set('editor', function(container, options) {
                                                    editorCallback.exec(container, options);
                                                });

                                                $orientDBService.schema(
                                                    item.linkedClass,
                                                    function(classSchema, status, headers, config) {
                                                        var relationTitle = "['@rid']";
                                                        var originalRelationTitle = relationTitle;

                                                        // SQL: ALTER PROPERTY MyTable.name CUSTOM relationTitle=true
                                                        for (var i = 0; i < classSchema.properties.length; i++) {
                                                            if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.relationTitle) {
                                                                relationTitle = classSchema.properties[i].name;
                                                                originalRelationTitle = relationTitle;

                                                                if (classSchema.properties[i].custom.translateTitle) {
                                                                    relationTitle = 'translated_' + relationTitle;
                                                                }

                                                                break;
                                                            }
                                                        }

                                                        editorCallback.set('callback', function(container, options) {
                                                            console.log('LINKSET: ', options.model);

                                                            var value = [];
                                                            if (options.model[options.field]) {
                                                                for (var i = 0; i < options.model[options.field].length; i++) {
                                                                    value.push(options.model[options.field][i]['@rid']);
                                                                }
                                                            }

                                                            $('<input/>')
                                                                .appendTo(container)
                                                                .kendoMultiSelect({
                                                                    dataTextField: relationTitle,
                                                                    dataValueField: "['@rid']",
                                                                    value: value,
                                                                    dataSource: {
                                                                        serverFiltering: true,
                                                                        schema: {
                                                                            data: 'result',
                                                                            model: {
                                                                                id: "['@rid']"
                                                                            }
                                                                        },
                                                                        transport: {
                                                                            read: function(options) {
                                                                                var filter = '';

                                                                                if (options.data.filter && options.data.filter.filters.length) {
                                                                                    var addFilter = '';

                                                                                    for (var i = 0; i < options.data.filter.filters.length; i++) {
                                                                                        if (options.data.filter.filters[0].value) {
                                                                                            var operator = '=';
                                                                                            var value = options.data.filter.filters[0].value;

                                                                                            switch (options.data.filter.filters[0].operator) {
                                                                                                case 'contains':
                                                                                                    operator = 'LIKE';
                                                                                                    value = '%' + value + '%';
                                                                                                    break;
                                                                                            }

                                                                                            addFilter += (i ? ' AND' : '') + DX.sprintf('%s %s "%s"', originalRelationTitle, operator, value)
                                                                                        }
                                                                                    }

                                                                                    if (addFilter !== '') {
                                                                                        filter += ' WHERE ' + addFilter;
                                                                                    }
                                                                                }

                                                                                var query = DX.sprintf('SELECT * FROM %s%s', item.linkedClass, filter);

                                                                                $orientDBService.query(
                                                                                    query,
                                                                                    options.take ? options.take : this.defaultPageSize,
                                                                                    '*:-1',
                                                                                    function(result) {
                                                                                        $orientDBService.schema(
                                                                                            item.linkedClass,
                                                                                            function(classSchema, status, headers, config) {
                                                                                                // SQL: ALTER PROPERTY Table.column CUSTOM translateTitle=true
                                                                                                for (var i = 0; i < classSchema.properties.length; i++) {
                                                                                                    if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.translateTitle) {
                                                                                                        for (var j = 0; j < result.result.length; j++) {
                                                                                                            if (result.result[j][classSchema.properties[i].name]) {
                                                                                                                result.result[j]['translated_' + classSchema.properties[i].name] = $translate.instant(item.linkedClass + '.' + result.result[j][classSchema.properties[i].name]);
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                options.success(result);
                                                                                            },
                                                                                            function(data, status, headers, config) {
                                                                                                /**
                                                                                                 * @todo Alert?
                                                                                                 */
                                                                                                console.log(data, status, headers, config);
                                                                                                options.success(result);
                                                                                            });
                                                                                    },
                                                                                    function (result) {
                                                                                        options.error(result);
                                                                                    });
                                                                            }
                                                                        }
                                                                    },
                                                                    filter: "contains",
                                                                    suggest: true,
                                                                    change: function(e) {
                                                                        var items = angular.copy(this.dataItems());

                                                                        for (var key in items) {
                                                                            if (relationTitle != "['@rid']") {
                                                                                delete items[key][relationTitle];
                                                                            }
                                                                        }

                                                                        options.model.set(options.field, items);
                                                                    }
                                                                });
                                                        });
                                                    },
                                                    function(data, status, headers, config) {
                                                        /**
                                                         * @todo Alert?
                                                         */
                                                        console.log(data, status, headers, config);
                                                    });
                                            }(item, column, $orientDBService, $));
                                            break;
                                        case 'LINK':
                                            (function(item, column, $orientDBService, $) {
                                                var editorCallback = new (function() {
                                                    this.callback = null;

                                                    this.exec = function() {
                                                        if (this.callback) {
                                                            this.callback.apply(this, arguments);
                                                        }
                                                    };

                                                    this.set = function(name, value) {
                                                        this[name] = value;
                                                    };
                                                });

                                                column.set('editor', function(container, options) {
                                                    editorCallback.exec(container, options);
                                                });

                                                $orientDBService.schema(
                                                    item.linkedClass,
                                                    function(classSchema, status, headers, config) {
                                                        var relationTitle = "['@rid']";
                                                        var originalRelationTitle = relationTitle;

                                                        // SQL: ALTER PROPERTY MyTable.name CUSTOM relationTitle=true
                                                        for (var i = 0; i < classSchema.properties.length; i++) {
                                                            if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.relationTitle) {
                                                                relationTitle = classSchema.properties[i].name;
                                                                originalRelationTitle = relationTitle;

                                                                if (classSchema.properties[i].custom.translateTitle) {
                                                                    relationTitle = 'translated_' + relationTitle;
                                                                }

                                                                break;
                                                            }
                                                        }

                                                        editorCallback.set('callback', function(container, options) {
                                                            $('<input/>')
                                                                .appendTo(container)
                                                                .kendoComboBox({
                                                                    dataTextField: relationTitle,
                                                                    dataValueField: "['@rid']",
                                                                    value: options.model[options.field] ? options.model[options.field]['@rid'] : null,
                                                                    dataSource: {
                                                                        serverFiltering: true,
                                                                        schema: {
                                                                            data: 'result',
                                                                            model: {
                                                                                id: "['@rid']"
                                                                            }
                                                                        },
                                                                        transport: {
                                                                            read: function(options) {
                                                                                var filter = '';

                                                                                if (options.data.filter && options.data.filter.filters.length) {
                                                                                    var addFilter = '';

                                                                                    for (var i = 0; i < options.data.filter.filters.length; i++) {
                                                                                        if (options.data.filter.filters[0].value) {
                                                                                            var operator = '=';
                                                                                            var value = options.data.filter.filters[0].value;

                                                                                            switch (options.data.filter.filters[0].operator) {
                                                                                                case 'contains':
                                                                                                    operator = 'LIKE';
                                                                                                    value = '%' + value + '%';
                                                                                                    break;
                                                                                            }

                                                                                            addFilter += (i ? ' AND' : '') + DX.sprintf('%s %s "%s"', originalRelationTitle, operator, value)
                                                                                        }
                                                                                    }

                                                                                    if (addFilter !== '') {
                                                                                        filter += ' WHERE ' + addFilter;
                                                                                    }
                                                                                }

                                                                                var query = DX.sprintf('SELECT * FROM %s%s', item.linkedClass, filter);

                                                                                $orientDBService.query(
                                                                                    query,
                                                                                    options.take ? options.take : this.defaultPageSize,
                                                                                    '*:-1',
                                                                                    function(result) {
                                                                                        $orientDBService.schema(
                                                                                            item.linkedClass,
                                                                                            function(classSchema, status, headers, config) {
                                                                                                // SQL: ALTER PROPERTY Table.column CUSTOM translateTitle=true
                                                                                                for (var i = 0; i < classSchema.properties.length; i++) {
                                                                                                    if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.translateTitle) {
                                                                                                        for (var j = 0; j < result.result.length; j++) {
                                                                                                            if (result.result[j][classSchema.properties[i].name]) {
                                                                                                                result.result[j]['translated_' + classSchema.properties[i].name] = $translate.instant(item.linkedClass + '.' + result.result[j][classSchema.properties[i].name]);
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                options.success(result);
                                                                                            },
                                                                                            function(data, status, headers, config) {
                                                                                                /**
                                                                                                 * @todo Alert?
                                                                                                 */
                                                                                                console.log(data, status, headers, config);
                                                                                                options.success(result);
                                                                                            });
                                                                                    },
                                                                                    function (result) {
                                                                                        options.error(result);
                                                                                    });
                                                                            }
                                                                        }
                                                                    },
                                                                    filter: "contains",
                                                                    suggest: true,
                                                                    select: function(e) {
                                                                        var item = angular.copy(this.dataItem(e.item.index()));

                                                                        if (relationTitle != "['@rid']") {
                                                                            delete item[relationTitle];
                                                                        }

                                                                        options.model.set(options.field, item);
                                                                    }
                                                                });
                                                        });
                                                    },
                                                    function(data, status, headers, config) {
                                                        /**
                                                         * @todo Alert?
                                                         */
                                                        console.log(data, status, headers, config);
                                                    });
                                            }(item, column, $orientDBService, $));
                                            break;
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

                                    if (columns[item.name]) {
                                        column = DX.mergeObjects(column, columns[item.name]);
                                    }

                                    result.push(column);
                                    break;
                                }
                            }
                        }

                        //if (selectColumns) {
                        //    var tmp = result;
                        //    result = [];
                        //
                        //    for (var i = 0; i < selectColumns.length; i++) {
                        //        for (var j = 0; j < tmp.length; j++) {
                        //            if (tmp[j].field == selectColumns[i]) {
                        //                result.push(tmp[j]);
                        //                break;
                        //            }
                        //        }
                        //    }
                        //}

                        return result;
                    };

                    /**
                     * Get Kendo UI Grid schema from OrientDB Class schema.
                     *
                     * @param {Object} defaults
                     *
                     * @returns {{data: null, total: null, errors: string, model: {id: string, fields: {}}}}
                     */
                    instance.getSchema = function(defaults) {
                        var schema = {
                            data: 'result',
                            total: 'total',
                            errors: 'error',
                            model: {
                                id: "['@rid']",
                                fields: {

                                }
                            }
                        };

                        for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                            var item = orientDBClassSchema.properties[i];
                            var fieldType = 'string';

                            console.log(item);

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
                                case 'LINK':
                                    fieldType = 'link';
                                    break;
                                case 'LINKSET':
                                    fieldType = 'linkset';
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

                        var dataSourceOptions = {
                            transport: {
                                read: function(options) {
                                    var query = DX.sprintf('SELECT %s FROM %s', columns, className);

                                    if (options.take) {
                                        query.skip();
                                    }

                                    $orientDBService.query(
                                        query,
                                        options.take ? options.take : this.defaultPageSize,
                                        '*:-1',
                                        function(result) {
                                            $orientDBService.query(
                                                DX.sprintf('SELECT COUNT(*) FROM %s', className),
                                                options.take ? options.take : this.defaultPageSize,
                                                '*:0',
                                                function(countResult) {
                                                    result['total'] = countResult.result[0]['COUNT'];
                                                    options.success(result);
                                                },
                                                function(result) {
                                                    options.error(result);
                                                }
                                            );
                                        },
                                        function (result) {
                                            options.error(result);
                                        });
                                },
                                update: function(options) {
                                    console.log('Update: ', options);

                                    delete options.data.models[0].password;
                                    delete options.data.models[0].roles;
                                    delete options.data.models[0].created;
                                    delete options.data.models[0]['gender.type'];
                                    delete options.data.models[0]['language.code'];

                                    console.log(options.data.models);

                                    $orientDBService.batchPatch(
                                        options.data.models,
                                        function(data, status, headers, config) {
                                            console.log(data, status, headers, config);
                                        }, function(data, status, headers, config) {
                                            console.log(data, status, headers, config);
                                        });
                                },
                                destroy: function(options) {
                                    console.log('Destroy: ', options);
                                },
                                create: function(options) {
                                    for (var key in options.data.models) {
                                        delete options.data.models[key]["['@rid']"];
                                    }

                                    console.log('Create: ', options);
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
                            DX.mergeObjects(dataSourceOptions, defaults)
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
                            dataSource: instance.getDataSource(
                                className,
                                options.dataSourceOptions
                            ),
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
                            edit: function(e) {
                                var popupWindow = e.container.data("kendoWindow");

                                if (!e.model.get('id')) {
                                    popupWindow.title(options.translate.instant(DX.KendoUI.Grid.defaultPopupWindowCreateTitle));
                                } else {
                                    popupWindow.title(options.translate.instant(DX.KendoUI.Grid.defaultPopupWindowUpdateTitle));
                                }

                                popupWindow.element.find(".k-grid-update").
                                    removeClass('k-button').
                                    removeClass('k-button-icontext').
                                    removeClass('k-primary').
                                    addClass('btn btn-sm btn-success').
                                    html("<i class=\"fa fa-check\"></i> " + (!e.model.get('id') ? options.translate.instant(DX.KendoUI.Grid.defaultPopupWindowCreateButton) : options.translate.instant(DX.KendoUI.Grid.defaultPopupWindowUpdateButton)));

                                popupWindow.element.find(".k-grid-cancel").
                                    removeClass('k-button').
                                    removeClass('k-button-icontext').
                                    addClass('btn btn-sm btn-danger').
                                    html("<i class=\"fa fa-times\"></i> " + options.translate.instant(DX.KendoUI.Grid.defaultPopupWindowCancelButton));
                            },
                            editable: 'popup',
                            columns: instance.getColumns(
                                options.columnDefaults,
                                options.translate
                            )
                        };

                        successFunction(grid);

                        return DX.mergeObjects(grid, options.defaults);
                    };

                    instance.getGridOptions(className, options, successFunction, errorFunction);
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